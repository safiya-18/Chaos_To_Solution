import { Router } from 'express';
import challengeService from '../services/challengeService.js';
import { generateChallengeId, formatChallengeForWhatsApp } from '../services/shareTextFormatter.js';
import { ValidationError } from '../utils/challengeValidator.js';

const router = Router();

/**
 * POST /api/challenges/generate
 * Generates an integrated hackathon challenge for a selected theme.
 * Dispatches to Gemini AI engine or transparently falls back to curated Phase 2 triplets.
 */
router.post('/generate', async (req, res, next) => {
  try {
    const rawTheme = req.body?.theme;

    if (!rawTheme || typeof rawTheme !== 'string' || !rawTheme.trim()) {
      throw new ValidationError(
        "Missing required field 'theme' in request body.",
        'MISSING_THEME'
      );
    }

    const theme = rawTheme.trim();

    // Call orchestrator (validates theme against APPROVED_THEMES, generates AI or curated fallback)
    const result = await challengeService.generateChallenge(theme);

    const id = generateChallengeId(result.theme);
    const generatedAt = new Date().toISOString();

    const challenge = {
      theme: result.theme,
      problem: result.problem,
      restriction: result.restriction,
      resource: result.resource,
      deliverable: result.deliverable
    };

    const shareText = formatChallengeForWhatsApp({
      id,
      theme: result.theme,
      source: result.source,
      challenge
    });

    res.status(200).json({
      success: true,
      data: {
        id,
        theme: result.theme,
        generatedAt,
        source: result.source,
        challenge,
        shareText
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
