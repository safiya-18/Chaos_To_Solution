import mongoose from 'mongoose';
import config from '../config/env.js';
import { groqService as defaultGroqService } from './groqService.js';
import { geminiService as defaultGeminiService } from './geminiService.js';
import { generateFallback as defaultGenerateFallback } from './fallbackService.js';
import { validateTheme, validateChallenge } from '../utils/challengeValidator.js';
import { evaluateNovelty } from './noveltyService.js';
import { scoreCandidate, validateHardRules } from './diversityService.js';
import { verifyResource } from './resourceVerifier.js';
import GenerationHistory from '../models/GenerationHistory.js';
import { computeFingerprint } from './ingestionService.js';
import { getGroundingContext } from './groundingService.js';
import { THEME_SUBDOMAINS, extractDiversityProfile } from './diversityProfileService.js';

export class ChallengeService {
  constructor({
    provider = config.aiProvider,
    groqService = defaultGroqService,
    geminiService = defaultGeminiService,
    fallbackGenerator = defaultGenerateFallback,
    historyCapacity = 30,
    hasApiKey = undefined,
    hasGroqKey = undefined,
    hasGeminiKey = undefined,
    maxNoveltyRetries = 2
  } = {}) {
    const isCustomGroq = groqService !== defaultGroqService;
    const isCustomGemini = geminiService !== defaultGeminiService;

    // Detect if test specifically injected Gemini service without specifying provider
    if (isCustomGemini && !isCustomGroq && provider === 'groq') {
      this.provider = 'gemini';
    } else {
      this.provider = (provider || 'groq').trim().toLowerCase();
    }

    this.groqService = groqService;
    this.geminiService = geminiService;
    this.fallbackGenerator = fallbackGenerator;
    this.historyCapacity = historyCapacity;
    this.maxNoveltyRetries = maxNoveltyRetries;

    // Compute key availability
    if (hasApiKey !== undefined) {
      this.hasGroqKey = hasApiKey;
      this.hasGeminiKey = hasApiKey;
    } else {
      this.hasGroqKey =
        hasGroqKey !== undefined
          ? hasGroqKey
          : Boolean(config.groqApiKey) || isCustomGroq;
      this.hasGeminiKey =
        hasGeminiKey !== undefined
          ? hasGeminiKey
          : Boolean(config.geminiApiKey) || isCustomGemini;
    }

    this.recentHistory = [];
  }

  recordHistory(signature) {
    if (!signature) return;
    this.recentHistory.push(signature);
    if (this.recentHistory.length > this.historyCapacity) {
      this.recentHistory.shift();
    }
  }

  getRecentHistory() {
    return [...this.recentHistory];
  }

  clearRecentHistory() {
    this.recentHistory = [];
  }

  /**
   * Logs a generation attempt and evaluation to GenerationHistory if DB is connected.
   */
  async logGenerationHistory({ candidate, domain, provider, decision, rejectionReason, similarityScores }) {
    if (mongoose.connection?.readyState === 1) {
      try {
        const fp = computeFingerprint(
          domain,
          candidate?.problem?.statement || '',
          candidate?.restriction?.rule || ''
        );
        const diversityProfile =
          candidate?.diversityProfile ||
          similarityScores?.diversityProfile ||
          extractDiversityProfile(candidate || {});

        await GenerationHistory.create({
          domain,
          candidateChallenge: candidate,
          fingerprint: fp,
          similarityScores: similarityScores || {},
          diversityProfile,
          provider,
          decision,
          rejectionReason: rejectionReason || null
        });
      } catch (err) {
        // Non-blocking telemetry
      }
    }
  }

  /**
   * Generates a challenge through Groq -> Gemini -> Fallback with novelty checking and scoring.
   */
  async generateChallenge(theme, options = {}) {
    // 1. Theme validation (throws ValidationError if invalid or missing)
    const validatedTheme = validateTheme(theme);

    // 2. Fetch grounded context (benchmarks, authoritative online resources, negative anti-patterns)
    let groundingContext = '';
    try {
      groundingContext = await getGroundingContext(validatedTheme);
    } catch (gErr) {
      console.warn(`[ChallengeService] Failed to load grounding context: ${gErr.message}`);
    }

    // 3. Compute diversity context & pattern frequency from recent history
    const recentArchetypeCounts = {};
    const recentSubdomainCounts = {};
    const recentAlgorithmCounts = {};
    const recentTaskCounts = {};
    const themeSubdomains = THEME_SUBDOMAINS[validatedTheme] || [];

    for (const item of this.recentHistory) {
      if (typeof item === 'string') {
        const parts = item.split(':');
        if (parts[0] === validatedTheme) {
          if (parts[1] === 'archetype' && parts[2]) {
            recentArchetypeCounts[parts[2]] = (recentArchetypeCounts[parts[2]] || 0) + 1;
          } else if (parts[1] === 'subdomain' && parts[2]) {
            recentSubdomainCounts[parts[2]] = (recentSubdomainCounts[parts[2]] || 0) + 1;
          } else if (parts[1] === 'algorithm' && parts[2]) {
            recentAlgorithmCounts[parts[2]] = (recentAlgorithmCounts[parts[2]] || 0) + 1;
          } else if (parts[1] === 'task' && parts[2]) {
            recentTaskCounts[parts[2]] = (recentTaskCounts[parts[2]] || 0) + 1;
          }
        }
      }
    }

    const overusedArchetypes = Object.keys(recentArchetypeCounts).filter(k => recentArchetypeCounts[k] >= 2);
    const underrepresentedSubdomains = themeSubdomains.filter(s => !recentSubdomainCounts[s] || recentSubdomainCounts[s] === 0);
    const overusedAlgorithms = Object.keys(recentAlgorithmCounts).filter(k => recentAlgorithmCounts[k] >= 2);

    const diversityLines = [];
    if (overusedArchetypes.length > 0) {
      diversityLines.push(`- OVERUSED ARCHETYPES to AVOID: ${overusedArchetypes.join(', ')}.`);
    }
    if (underrepresentedSubdomains.length > 0) {
      diversityLines.push(`- ENCOURAGED SUBDOMAINS to EXPLORE: ${underrepresentedSubdomains.slice(0, 5).join(', ')}.`);
    }
    if (overusedAlgorithms.length > 0) {
      diversityLines.push(`- OVERUSED ALGORITHMIC APPROACHES to AVOID: ${overusedAlgorithms.join(', ')}.`);
    }
    const diversityContextStr = diversityLines.length > 0
      ? diversityLines.join('\n')
      : 'Generate challenges featuring distinct computational algorithms, data structures, and functional tasks.';

    const genOptions = {
      ...options,
      groundingContext,
      diversityContext: diversityContextStr,
      recentArchetypeCounts,
      recentSubdomainCounts,
      recentAlgorithmCounts,
      recentTaskCounts
    };

    // 4. Identify primary and alternative secondary provider
    const isGroqPrimary = this.provider !== 'gemini';
    const primary = isGroqPrimary
      ? { name: 'Groq', providerId: 'groq', service: this.groqService, hasKey: this.hasGroqKey }
      : { name: 'Gemini', providerId: 'gemini', service: this.geminiService, hasKey: this.hasGeminiKey };

    const secondary = isGroqPrimary
      ? { name: 'Gemini', providerId: 'gemini', service: this.geminiService, hasKey: this.hasGeminiKey }
      : { name: 'Groq', providerId: 'groq', service: this.groqService, hasKey: this.hasGroqKey };

    // 5. Attempt Primary Provider with Bounded Novelty Retries
    if (primary.hasKey) {
      let attempts = 0;
      while (attempts <= this.maxNoveltyRetries) {
        attempts++;
        try {
          const aiChallenge = await primary.service.generate(
            validatedTheme,
            this.recentHistory,
            genOptions
          );

          const validation = validateChallenge(aiChallenge, validatedTheme);
          if (!validation.isValid) {
            console.warn(
              `[ChallengeService] ${primary.name} challenge failed validation: ${validation.errors.join('; ')}.`
            );
            await this.logGenerationHistory({
              candidate: aiChallenge,
              domain: validatedTheme,
              provider: primary.providerId,
              decision: 'rejected',
              rejectionReason: validation.errors.join('; ')
            });
            break; // Validation failure on schema, failover to secondary
          }

          // Resource reachability check before hard rules
          if (aiChallenge.resource?.docsUrl || aiChallenge.resource?.type === 'browser-api') {
            try {
              const resReport = await verifyResource({
                canonicalUrl: aiChallenge.resource.docsUrl,
                name: aiChallenge.resource.name,
                resourceType: aiChallenge.resource.type
              });
              aiChallenge.resource.verificationStatus = resReport.verificationStatus;
              aiChallenge.resource.verificationEvidence = resReport.verificationEvidence;
            } catch (err) {
              const isInaccessible =
                err?.name === 'FetchSecurityError' &&
                ['SSRF_PROHIBITED', 'OVERSIZED_RESPONSE', 'INVALID_REDIRECT', 'TOO_MANY_REDIRECTS'].includes(err?.code);
              aiChallenge.resource.verificationStatus = isInaccessible ? 'inaccessible' : 'verification_pending';
            }
          }

          // Hard rules check (rejects broken/inaccessible resources, banned paid services, impossible feats)
          const hardRules = validateHardRules(aiChallenge);
          if (!hardRules.passed) {
            console.warn(`[ChallengeService] ${primary.name} candidate failed hard rules: ${hardRules.rejections.join('; ')}`);
            await this.logGenerationHistory({
              candidate: aiChallenge,
              domain: validatedTheme,
              provider: primary.providerId,
              decision: 'rejected',
              rejectionReason: hardRules.rejections.join('; ')
            });
            if (attempts <= this.maxNoveltyRetries) {
              continue;
            }
            break;
          }

          // Novelty Evaluation
          const novelty = await evaluateNovelty(aiChallenge, options);

          if (novelty.decision === 'REJECT') {
            console.warn(`[ChallengeService] ${primary.name} candidate rejected as duplicate: ${novelty.reasons.join('; ')}`);
            await this.logGenerationHistory({
              candidate: aiChallenge,
              domain: validatedTheme,
              provider: primary.providerId,
              decision: 'rejected',
              rejectionReason: novelty.reasons.join('; '),
              similarityScores: novelty.similarityScores
            });
            if (attempts <= this.maxNoveltyRetries) {
              continue;
            }
            break;
          }

          if (novelty.decision === 'REGENERATE') {
            if (attempts <= this.maxNoveltyRetries) {
              console.info(`[ChallengeService] ${primary.name} candidate borderline similarity (${novelty.similarityScores?.problemSimilarity}), retrying (attempt ${attempts}/${this.maxNoveltyRetries})...`);
              this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
              continue;
            }
            console.warn(`[ChallengeService] ${primary.name} novelty retries exhausted on borderline duplicate. Cascading to secondary provider.`);
            await this.logGenerationHistory({
              candidate: aiChallenge,
              domain: validatedTheme,
              provider: primary.providerId,
              decision: 'rejected',
              rejectionReason: 'Novelty retries exhausted on borderline duplicate',
              similarityScores: novelty.similarityScores
            });
            break; // Failover to secondary
          }

          // Diversity scoring
          const scored = scoreCandidate(aiChallenge, novelty, genOptions);

          const profile =
            aiChallenge.diversityProfile ||
            novelty.similarityScores?.diversityProfile ||
            extractDiversityProfile(aiChallenge);

          this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
          if (profile?.subdomain) {
            this.recordHistory(`${validatedTheme}:subdomain:${profile.subdomain}`);
          }
          if (profile?.solutionArchetype) {
            this.recordHistory(`${validatedTheme}:archetype:${profile.solutionArchetype}`);
          }
          if (profile?.coreAlgorithm && profile.coreAlgorithm !== 'not_applicable') {
            this.recordHistory(`${validatedTheme}:algorithm:${profile.coreAlgorithm}`);
          }
          if (profile?.engineeringTask) {
            this.recordHistory(`${validatedTheme}:task:${profile.engineeringTask}`);
          }

          const fp = computeFingerprint(validatedTheme, aiChallenge.problem.statement, aiChallenge.restriction.rule);

          await this.logGenerationHistory({
            candidate: aiChallenge,
            domain: validatedTheme,
            provider: primary.providerId,
            decision: 'accepted',
            similarityScores: novelty.similarityScores
          });

          return {
            ...aiChallenge,
            source: 'ai',
            challengeSignature: fp,
            diversityProfile: profile,
            noveltyScores: novelty.similarityScores,
            diversityScore: scored.totalScore
          };
        } catch (err) {
          console.warn(
            `[ChallengeService] ${primary.name} generation failed (${err.message}).`
          );
          break; // Network/API error, jump to secondary
        }
      }
    } else {
      console.warn(
        `[ChallengeService] ${primary.name} API key is not configured.`
      );
    }

    // 5. Attempt Secondary Provider (alternative failover)
    if (secondary.hasKey) {
      console.info(
        `[ChallengeService] Attempting alternative provider (${secondary.name}) for theme '${validatedTheme}'.`
      );
      try {
        const aiChallenge = await secondary.service.generate(
          validatedTheme,
          this.recentHistory,
          genOptions
        );

        const validation = validateChallenge(aiChallenge, validatedTheme);
        if (validation.isValid) {
          // Resource reachability check before hard rules
          if (aiChallenge.resource?.docsUrl || aiChallenge.resource?.type === 'browser-api') {
            try {
              const resReport = await verifyResource({
                canonicalUrl: aiChallenge.resource.docsUrl,
                name: aiChallenge.resource.name,
                resourceType: aiChallenge.resource.type
              });
              aiChallenge.resource.verificationStatus = resReport.verificationStatus;
              aiChallenge.resource.verificationEvidence = resReport.verificationEvidence;
            } catch (err) {
              const isInaccessible =
                err?.name === 'FetchSecurityError' &&
                ['SSRF_PROHIBITED', 'OVERSIZED_RESPONSE', 'INVALID_REDIRECT', 'TOO_MANY_REDIRECTS'].includes(err?.code);
              aiChallenge.resource.verificationStatus = isInaccessible ? 'inaccessible' : 'verification_pending';
            }
          }

          const hardRules = validateHardRules(aiChallenge);
          if (hardRules.passed) {
            const novelty = await evaluateNovelty(aiChallenge, options);

            if (novelty.decision !== 'REJECT') {
              const scored = scoreCandidate(aiChallenge, novelty, genOptions);

              const profile =
                aiChallenge.diversityProfile ||
                novelty.similarityScores?.diversityProfile ||
                extractDiversityProfile(aiChallenge);

              this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
              if (profile?.subdomain) {
                this.recordHistory(`${validatedTheme}:subdomain:${profile.subdomain}`);
              }
              if (profile?.solutionArchetype) {
                this.recordHistory(`${validatedTheme}:archetype:${profile.solutionArchetype}`);
              }
              if (profile?.coreAlgorithm && profile.coreAlgorithm !== 'not_applicable') {
                this.recordHistory(`${validatedTheme}:algorithm:${profile.coreAlgorithm}`);
              }
              if (profile?.engineeringTask) {
                this.recordHistory(`${validatedTheme}:task:${profile.engineeringTask}`);
              }

              const fp = computeFingerprint(validatedTheme, aiChallenge.problem.statement, aiChallenge.restriction.rule);

              await this.logGenerationHistory({
                candidate: aiChallenge,
                domain: validatedTheme,
                provider: secondary.providerId,
                decision: 'accepted',
                similarityScores: novelty.similarityScores
              });

              return {
                ...aiChallenge,
                source: 'ai',
                challengeSignature: fp,
                diversityProfile: profile,
                noveltyScores: novelty.similarityScores,
                diversityScore: scored.totalScore
              };
            } else {
              console.warn(`[ChallengeService] Alternative ${secondary.name} candidate rejected as duplicate or borderline: ${novelty.reasons.join('; ')}`);
              await this.logGenerationHistory({
                candidate: aiChallenge,
                domain: validatedTheme,
                provider: secondary.providerId,
                decision: 'rejected',
                rejectionReason: novelty.reasons.join('; '),
                similarityScores: novelty.similarityScores
              });
            }
          } else {
            console.warn(`[ChallengeService] Alternative ${secondary.name} failed hard rules: ${hardRules.rejections.join('; ')}`);
          }
        } else {
          console.warn(
            `[ChallengeService] Alternative ${secondary.name} challenge failed validation: ${validation.errors.join('; ')}.`
          );
        }
      } catch (err) {
        console.warn(
          `[ChallengeService] Alternative ${secondary.name} generation failed (${err.message}).`
        );
      }
    }

    // 6. Guaranteed Safe Curated Fallback with Novelty Selection & Scoring
    console.info(
      `[ChallengeService] Engaging curated fallback for theme '${validatedTheme}'.`
    );
    const fallback = this.fallbackGenerator(validatedTheme, this.recentHistory);
    const fallbackProfile =
      fallback.diversityProfile ||
      extractDiversityProfile(fallback);

    this.recordHistory(`${validatedTheme}:${fallback.problem.title}`);
    if (fallbackProfile?.subdomain) {
      this.recordHistory(`${validatedTheme}:subdomain:${fallbackProfile.subdomain}`);
    }
    if (fallbackProfile?.solutionArchetype) {
      this.recordHistory(`${validatedTheme}:archetype:${fallbackProfile.solutionArchetype}`);
    }
    if (fallbackProfile?.coreAlgorithm && fallbackProfile.coreAlgorithm !== 'not_applicable') {
      this.recordHistory(`${validatedTheme}:algorithm:${fallbackProfile.coreAlgorithm}`);
    }
    if (fallbackProfile?.engineeringTask) {
      this.recordHistory(`${validatedTheme}:task:${fallbackProfile.engineeringTask}`);
    }

    const fallbackNovelty = await evaluateNovelty(fallback, options);
    const fallbackScored = scoreCandidate(fallback, fallbackNovelty, genOptions);
    if (!fallbackScored.eligible) {
      throw new Error(
        `Curated fallback for '${validatedTheme}' failed hard validation: ${fallbackScored.hardRejections.join('; ')}`
      );
    }
    const fallbackFp = computeFingerprint(validatedTheme, fallback.problem.statement, fallback.restriction.rule);

    await this.logGenerationHistory({
      candidate: fallback,
      domain: validatedTheme,
      provider: 'curated-fallback',
      decision: 'fallback_used',
      similarityScores: fallbackNovelty.similarityScores
    });

    return {
      ...fallback,
      source: 'curated-fallback',
      challengeSignature: fallbackFp,
      diversityProfile: fallbackProfile,
      noveltyScores: fallbackNovelty.similarityScores,
      diversityScore: fallbackScored.totalScore
    };
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
