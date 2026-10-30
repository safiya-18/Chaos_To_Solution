import mongoose from 'mongoose';
import TeamAssignment, { normalizeTeamName } from '../models/TeamAssignment.js';
import challengeService from './challengeService.js';
import { validateTheme, validateChallenge, ValidationError } from '../utils/challengeValidator.js';
import { generateChallengeId, formatChallengeForWhatsApp } from './shareTextFormatter.js';
import config from '../config/env.js';

export class TeamService {
  constructor({
    model = TeamAssignment,
    generatorService = challengeService
  } = {}) {
    this.model = model;
    this.generatorService = generatorService;
  }

  /**
   * Validates a team name string.
   */
  validateTeamName(rawName) {
    if (!rawName || typeof rawName !== 'string') {
      throw new ValidationError("Missing required field 'teamName' in request body.", 'MISSING_TEAM_NAME');
    }

    const trimmed = rawName.trim();
    if (trimmed.length < 2) {
      throw new ValidationError('Team name must be at least 2 characters.', 'INVALID_TEAM_NAME');
    }
    if (trimmed.length > 50) {
      throw new ValidationError('Team name cannot exceed 50 characters.', 'INVALID_TEAM_NAME');
    }

    return trimmed;
  }

  /**
   * Registers a team, generates an integrated challenge, and persists it in MongoDB.
   */
  async registerTeamAndGenerate({ teamName: rawTeamName, theme: rawTheme }) {
    // 1. Validation
    const teamName = this.validateTeamName(rawTeamName);
    const theme = validateTheme(rawTheme);
    const normalizedTeamName = normalizeTeamName(teamName);

    // 2. Pre-check for duplicate team to fail fast before burning AI tokens
    const existing = await this.model.findOne({ normalizedTeamName });
    if (existing) {
      const err = new Error(`Team name '${teamName}' is already registered for this event.`);
      err.statusCode = 409;
      err.code = 'TEAM_ALREADY_EXISTS';
      err.existingAssignment = {
        id: existing._id,
        teamName: existing.teamName,
        theme: existing.theme,
        challengeId: existing.challengeId
      };
      throw err;
    }

    // 3. Generate Challenge via orchestrator cascade (Groq -> Gemini -> Fallback)
    const result = await this.generatorService.generateChallenge(theme);
    const challengeValidation = validateChallenge(result, theme);
    if (!challengeValidation.isValid) {
      const err = new Error(`Generated challenge failed validation: ${challengeValidation.errors.join('; ')}`);
      err.statusCode = 502;
      err.code = 'CHALLENGE_GENERATION_FAILED';
      throw err;
    }

    const challengeId = generateChallengeId(result.theme);

    const challengeDoc = {
      problem: result.problem,
      restriction: result.restriction,
      resource: {
        name: result.resource.name,
        type: result.resource.type,
        guidance: result.resource.guidance,
        docsUrl: result.resource.docsUrl,
        verificationStatus:
          result.resource.verificationStatus ||
          (result.resource.type === 'browser-api' ? 'verified' : 'candidate')
      },
      deliverable: result.deliverable
    };

    let finalResult = result;
    let signature = result.challengeSignature;

    // 4. Persist to MongoDB with atomic unique constraints and bounded collision retries
    let saved;
    let persistAttempts = 0;
    const maxPersistAttempts = 3; // 1 initial attempt + up to 2 collision retries

    while (persistAttempts < maxPersistAttempts) {
      persistAttempts++;
      try {
        saved = await this.model.create({
          teamName,
          normalizedTeamName,
          theme: finalResult.theme,
          challenge: challengeDoc,
          challengeSource: finalResult.source,
          challengeSignature: signature || null,
          challengeId,
          eventId: config.eventId
        });
        break; // Successfully persisted atomically
      } catch (dbErr) {
        if (dbErr.code === 11000) {
          const errMessage = String(dbErr.message || '');
          const keyPattern = dbErr.keyPattern || {};
          const isSignatureConflict =
            Boolean(keyPattern.challengeSignature) ||
            errMessage.includes('challengeSignature') ||
            errMessage.includes('challengeSignature_1');

          // Signature collision caught atomically by database partial unique index
          if (isSignatureConflict && persistAttempts < maxPersistAttempts) {
            console.warn(
              `[TeamService] Atomic challengeSignature collision detected for event '${config.eventId}', regenerating candidate (attempt ${persistAttempts} of ${maxPersistAttempts - 1})...`
            );
            try {
              const regenerated = await this.generatorService.generateChallenge(theme);
              if (regenerated && validateChallenge(regenerated, theme).isValid) {
                finalResult = regenerated;
                signature = regenerated.challengeSignature || null;
                challengeDoc.problem = regenerated.problem;
                challengeDoc.restriction = regenerated.restriction;
                challengeDoc.resource = {
                  name: regenerated.resource.name,
                  type: regenerated.resource.type,
                  guidance: regenerated.resource.guidance,
                  docsUrl: regenerated.resource.docsUrl,
                  verificationStatus:
                    regenerated.resource.verificationStatus ||
                    (regenerated.resource.type === 'browser-api' ? 'verified' : 'candidate')
                };
                challengeDoc.deliverable = regenerated.deliverable;
                continue; // Retry atomic insertion with regenerated candidate
              }
            } catch (regenErr) {
              console.warn(`[TeamService] Regeneration after collision failed: ${regenErr.message}`);
            }
          }

          // Team name collision or signature conflict retries exhausted
          if (!isSignatureConflict || keyPattern.normalizedTeamName || errMessage.includes('normalizedTeamName')) {
            const err = new Error(`Team name '${teamName}' is already registered for this event.`);
            err.statusCode = 409;
            err.code = 'TEAM_ALREADY_EXISTS';
            throw err;
          }

          const err = new Error(
            `Unable to assign unique challenge for team '${teamName}' due to concurrent collision. Please try again.`
          );
          err.statusCode = 409;
          err.code = 'CHALLENGE_SIGNATURE_COLLISION';
          throw err;
        }

        const err = new Error(`Failed to persist team challenge assignment: ${dbErr.message}`);
        err.statusCode = 503;
        err.code = 'DATABASE_SAVE_FAILED';
        throw err;
      }
    }

    // 5. Build presentation envelope and WhatsApp copy
    const shareText = formatChallengeForWhatsApp({
      id: challengeId,
      theme: result.theme,
      source: result.source,
      challenge: challengeDoc,
      teamName
    });

    return {
      id: saved._id,
      challengeId,
      teamName: saved.teamName,
      theme: saved.theme,
      generatedAt: saved.createdAt.toISOString(),
      source: saved.challengeSource,
      challengeSource: saved.challengeSource,
      challenge: saved.challenge,
      shareText
    };
  }

  /**
   * Retrieves a saved team assignment by MongoDB _id or team name.
   */
  async getTeamAssignment(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      const err = new Error('Team identifier is required.');
      err.statusCode = 400;
      err.code = 'MISSING_IDENTIFIER';
      throw err;
    }

    const trimmed = identifier.trim();
    let query;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { normalizedTeamName: normalizeTeamName(trimmed) };
    }

    const found = await this.model.findOne(query);
    if (!found) {
      const err = new Error(`No assignment found for team identifier '${identifier}'.`);
      err.statusCode = 404;
      err.code = 'TEAM_NOT_FOUND';
      throw err;
    }

    const shareText = formatChallengeForWhatsApp({
      id: found.challengeId,
      theme: found.theme,
      source: found.challengeSource,
      challenge: found.challenge,
      teamName: found.teamName
    });

    return {
      id: found._id,
      challengeId: found.challengeId,
      teamName: found.teamName,
      theme: found.theme,
      generatedAt: found.createdAt.toISOString(),
      source: found.challengeSource,
      challenge: found.challenge,
      shareText
    };
  }

  /**
   * Deletes a saved team assignment by MongoDB _id or team name.
   */
  async deleteTeam(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      const err = new Error('Team identifier is required.');
      err.statusCode = 400;
      err.code = 'MISSING_IDENTIFIER';
      throw err;
    }

    const trimmed = identifier.trim();
    let query;

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query = { _id: trimmed };
    } else {
      query = { normalizedTeamName: normalizeTeamName(trimmed) };
    }

    const deleted = await this.model.findOneAndDelete(query);
    if (!deleted) {
      const err = new Error(`No assignment found for team identifier '${identifier}'.`);
      err.statusCode = 404;
      err.code = 'TEAM_NOT_FOUND';
      throw err;
    }

    return {
      id: deleted._id,
      teamName: deleted.teamName,
      deleted: true,
      message: `Team '${deleted.teamName}' deleted successfully.`
    };
  }

  /**
   * Lists persisted team assignments with optional search, theme filtering, and sorting.
   */
  async listTeams({ search = '', theme = '', sortBy = 'createdAt', sortOrder = 'desc', limit = 100, page = 1 } = {}) {
    const filter = {};

    if (theme && typeof theme === 'string' && theme.trim() !== '' && theme.toLowerCase() !== 'all') {
      filter.theme = theme.trim();
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { teamName: { $regex: sanitized, $options: 'i' } },
        { 'challenge.problem.title': { $regex: sanitized, $options: 'i' } }
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField = ['teamName', 'createdAt', 'theme'].includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortDirection };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, docs] = await Promise.all([
      this.model.countDocuments(filter),
      this.model.find(filter).sort(sort).skip(skip).limit(parsedLimit).lean()
    ]);

    const teams = docs.map((doc, idx) => ({
      index: skip + idx + 1,
      id: doc._id,
      challengeId: doc.challengeId,
      teamName: doc.teamName,
      theme: doc.theme,
      generatedAt: doc.createdAt?.toISOString?.() || new Date(doc.createdAt).toISOString(),
      source: doc.challengeSource,
      challenge: doc.challenge,
      createdAt: doc.createdAt
    }));

    return {
      teams,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1
    };
  }
}

export const teamService = new TeamService();
export default teamService;
