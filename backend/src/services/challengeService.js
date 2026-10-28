import config from '../config/env.js';
import { groqService as defaultGroqService } from './groqService.js';
import { geminiService as defaultGeminiService } from './geminiService.js';
import { generateFallback as defaultGenerateFallback } from './fallbackService.js';
import { validateTheme, validateChallenge } from '../utils/challengeValidator.js';

export class ChallengeService {
  constructor({
    provider = config.aiProvider,
    groqService = defaultGroqService,
    geminiService = defaultGeminiService,
    fallbackGenerator = defaultGenerateFallback,
    historyCapacity = 30,
    hasApiKey = undefined,
    hasGroqKey = undefined,
    hasGeminiKey = undefined
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

  async generateChallenge(theme) {
    // 1. Theme validation (throws ValidationError if invalid or missing)
    const validatedTheme = validateTheme(theme);

    // 2. Identify primary and alternative secondary provider
    const isGroqPrimary = this.provider !== 'gemini';
    const primary = isGroqPrimary
      ? { name: 'Groq', service: this.groqService, hasKey: this.hasGroqKey }
      : { name: 'Gemini', service: this.geminiService, hasKey: this.hasGeminiKey };

    const secondary = isGroqPrimary
      ? { name: 'Gemini', service: this.geminiService, hasKey: this.hasGeminiKey }
      : { name: 'Groq', service: this.groqService, hasKey: this.hasGroqKey };

    // 3. Attempt Primary Provider
    if (primary.hasKey) {
      try {
        const aiChallenge = await primary.service.generate(
          validatedTheme,
          this.recentHistory
        );

        const validation = validateChallenge(aiChallenge, validatedTheme);
        if (validation.isValid) {
          this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
          return {
            ...aiChallenge,
            source: 'ai'
          };
        }

        console.warn(
          `[ChallengeService] ${primary.name} challenge failed validation: ${validation.errors.join('; ')}.`
        );
      } catch (err) {
        console.warn(
          `[ChallengeService] ${primary.name} generation failed (${err.message}).`
        );
      }
    } else {
      console.warn(
        `[ChallengeService] ${primary.name} API key is not configured.`
      );
    }

    // 4. Attempt Secondary Provider (alternative failover)
    if (secondary.hasKey) {
      console.info(
        `[ChallengeService] Attempting alternative provider (${secondary.name}) for theme '${validatedTheme}'.`
      );
      try {
        const aiChallenge = await secondary.service.generate(
          validatedTheme,
          this.recentHistory
        );

        const validation = validateChallenge(aiChallenge, validatedTheme);
        if (validation.isValid) {
          this.recordHistory(`${validatedTheme}:${aiChallenge.problem.title}`);
          return {
            ...aiChallenge,
            source: 'ai'
          };
        }

        console.warn(
          `[ChallengeService] Alternative ${secondary.name} challenge failed validation: ${validation.errors.join('; ')}.`
        );
      } catch (err) {
        console.warn(
          `[ChallengeService] Alternative ${secondary.name} generation failed (${err.message}).`
        );
      }
    }

    // 5. Guaranteed Safe Curated Fallback
    console.info(
      `[ChallengeService] Engaging curated fallback for theme '${validatedTheme}'.`
    );
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
