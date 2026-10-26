import config from '../config/env.js';
import { geminiService as defaultGeminiService } from './geminiService.js';
import { generateFallback as defaultGenerateFallback } from './fallbackService.js';
import { validateTheme, validateChallenge } from '../utils/challengeValidator.js';

export class ChallengeService {
  constructor({
    geminiService = defaultGeminiService,
    fallbackGenerator = defaultGenerateFallback,
    historyCapacity = 30,
    hasApiKey = Boolean(config.geminiApiKey)
  } = {}) {
    this.geminiService = geminiService;
    this.fallbackGenerator = fallbackGenerator;
    this.historyCapacity = historyCapacity;
    this.hasApiKey = hasApiKey || geminiService !== defaultGeminiService;
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

  async generateChallenge(theme) {
    // 1. Theme validation (throws ValidationError if invalid or missing)
    const validatedTheme = validateTheme(theme);

    // 2. Direct fallback if API key is not configured and no custom service injected
    if (!this.hasApiKey) {
      console.warn(
        `[ChallengeService] GEMINI_API_KEY is not configured; generating curated fallback for theme '${validatedTheme}'.`
      );
      const fallback = this.fallbackGenerator(validatedTheme, this.recentHistory);
      this.recordHistory(`${validatedTheme}:${fallback.problem.title}`);
      return {
        ...fallback,
        source: 'curated-fallback'
      };
    }

    // 3. Attempt AI generation via Gemini
    try {
      const aiChallenge = await this.geminiService.generate(validatedTheme, this.recentHistory);

      // Validate AI response against multi-pillar guardrails
      const validation = validateChallenge(aiChallenge, validatedTheme);

      if (validation.isValid) {
        this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
        return {
          ...aiChallenge,
          source: 'ai'
        };
      }

      console.warn(
        `[ChallengeService] Gemini challenge failed validation: ${validation.errors.join('; ')}. Engaging curated fallback.`
      );
    } catch (err) {
      console.warn(
        `[ChallengeService] Gemini generation failed (${err.message}). Engaging curated fallback for theme '${validatedTheme}'.`
      );
    }

    // 4. Safe Curated Fallback
    const fallback = this.fallbackGenerator(validatedTheme, this.recentHistory);
    this.recordHistory(`${validatedTheme}:${fallback.problem.title}`);
    return {
      ...fallback,
      source: 'curated-fallback'
    };
  }
}

export const challengeService = new ChallengeService();
export default challengeService;
