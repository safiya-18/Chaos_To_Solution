import { describe, it, expect } from 'vitest';
import { buildGroqSystemPrompt } from '../../src/services/groqService.js';
import { buildSystemPrompt as buildGeminiSystemPrompt } from '../../src/services/geminiService.js';
import { buildRichDeliverable, generateOfficialFallback } from '../../src/services/fallbackService.js';
import { validateChallenge, APPROVED_THEMES } from '../../src/utils/challengeValidator.js';
import { validateThemeConstraints } from '../../src/utils/themeConstraintValidator.js';
import officialCuratedChallenges from '../../src/data/officialCuratedChallenges.json' with { type: 'json' };

describe('3-Hour Hackathon Challenge Scope & Feasibility Invariants', () => {
  describe('1. Prompt Directives & Structure Consistency (Groq vs Gemini)', () => {
    const groqPrompt = buildGroqSystemPrompt('FinTech');
    const geminiPrompt = buildGeminiSystemPrompt('FinTech');

    it('both Groq and Gemini system prompts must explicitly target a 3-hour development window', () => {
      expect(groqPrompt).toContain('within 3 hours');
      expect(geminiPrompt).toContain('within 3 hours');
      expect(groqPrompt).not.toContain('2 hours');
      expect(geminiPrompt).not.toContain('2 hours');
    });

    it('both prompts must enforce the 3-tier scope model: Level 1 (Core MVP), Level 2 (Enhancements), Level 3 (Stretch Goals)', () => {
      const tiers = [
        'LEVEL 1 — MUST BUILD (Core MVP)',
        'LEVEL 2 — SHOULD IMPROVE (Enhancements)',
        'LEVEL 3 — BONUS CHALLENGE (Stretch Goals)'
      ];

      for (const tier of tiers) {
        expect(groqPrompt).toContain(tier);
        expect(geminiPrompt).toContain(tier);
      }
    });

    it('both prompts must clearly differentiate mandatory Core MVP from optional stretch goals', () => {
      expect(groqPrompt).toContain('[Mandatory]');
      expect(geminiPrompt).toContain('[Mandatory]');
      expect(groqPrompt).toContain('[Optional]');
      expect(geminiPrompt).toContain('[Optional]');
      expect(groqPrompt).toContain('Never make stretch goals mandatory');
      expect(geminiPrompt).toContain('Never make stretch goals mandatory');
    });

    it('both prompts must forbid unrealistic enterprise-scale scope', () => {
      const forbiddenAntiPatterns = [
        'Full production authentication',
        'Complex multi-role administration',
        'Multiple independent backend services or microservices',
        'Large-scale machine learning model training',
        'Enterprise security infrastructure'
      ];

      for (const pattern of forbiddenAntiPatterns) {
        expect(groqPrompt).toContain(pattern);
        expect(geminiPrompt).toContain(pattern);
      }
    });

    it('both prompts must demand deliverable specifications matching the 3-hour contract', () => {
      expect(groqPrompt).toContain('DELIVERABLE SPECIFICATION');
      expect(geminiPrompt).toContain('DELIVERABLE SPECIFICATION');
      expect(groqPrompt).toContain('Product Objective');
      expect(geminiPrompt).toContain('Expected Working Outcome');
      expect(groqPrompt).toContain('Evaluation Criteria');
    });
  });

  describe('2. Curated Fallback Deliverable Structure & 3-Hour Scope', () => {
    it('buildRichDeliverable must output a deliverable matching the 3-level model within 3 hours', () => {
      const deliverable = buildRichDeliverable({
        title: 'Micro-Savings Round-Up Simulator',
        theme: 'FinTech',
        statement: 'Young adults struggle to save money consistently because manual transfers feel burdensome.',
        restrictionRule: 'Simulated Wallet Only: Must use simulated wallet transactions; no live banking credentials.',
        resourceName: 'Web Storage API'
      });

      expect(deliverable).toContain('within 3 hours');
      expect(deliverable).toContain('Product Objective');
      expect(deliverable).toContain('LEVEL 1 — MUST BUILD (Core MVP) [Mandatory]:');
      expect(deliverable).toContain('LEVEL 2 — SHOULD IMPROVE (Enhancements) [Optional]:');
      expect(deliverable).toContain('LEVEL 3 — BONUS CHALLENGE (Stretch Goals) [Optional]:');
      expect(deliverable).toContain('Expected Working Outcome');
      expect(deliverable).toContain('Evaluation Criteria');
      expect(deliverable.length).toBeGreaterThanOrEqual(300);
      expect(deliverable.length).toBeLessThanOrEqual(1800);
    });

    it('generateOfficialFallback across all 8 themes must produce valid challenges under 1800 chars', () => {
      for (const theme of APPROVED_THEMES) {
        const fallback = generateOfficialFallback(theme);
        const validation = validateChallenge(fallback, theme);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(fallback.deliverable.length).toBeLessThanOrEqual(1800);
        expect(fallback.deliverable).toContain('within 3 hours');
      }
    });
  });

  describe('3. Restriction Preservation & 3-Hour Feasibility', () => {
    it('must preserve 100% of official theme constraints without weakening them', () => {
      const themes = ['FinTech', 'Sustainability', 'EdTech', 'Open Innovation'];
      for (const theme of themes) {
        const fallback = generateOfficialFallback(theme);
        const constraintCheck = validateThemeConstraints(fallback, theme);
        expect(constraintCheck.passed).toBe(true);
      }
    });

    it('all 40 official curated challenges must remain unchanged and pass theme constraint validation', () => {
      expect(officialCuratedChallenges).toHaveLength(40);
      for (const challenge of officialCuratedChallenges) {
        expect(APPROVED_THEMES).toContain(challenge.theme);
        expect(challenge.title).toBeDefined();
        expect(challenge.problemStatement).toBeDefined();
        expect(challenge.restrictions).toBeDefined();
        expect(challenge.resourcesProvided).toBeDefined();
      }
    });
  });
});
