import { describe, it, expect } from 'vitest';
import { buildGroqSystemPrompt } from '../../src/services/groqService.js';
import { buildSystemPrompt as buildGeminiSystemPrompt } from '../../src/services/geminiService.js';
import { buildRichDeliverable, generateOfficialFallback } from '../../src/services/fallbackService.js';
import { validateChallenge, APPROVED_THEMES } from '../../src/utils/challengeValidator.js';
import { validateThemeConstraints } from '../../src/utils/themeConstraintValidator.js';
import officialCuratedChallenges from '../../src/data/officialCuratedChallenges.json' with { type: 'json' };

describe('3-Hour Hackathon Challenge Scope & Concise Deliverable Invariants', () => {
  describe('1. Prompt Directives & Structure Consistency (Groq vs Gemini)', () => {
    const groqPrompt = buildGroqSystemPrompt('FinTech');
    const geminiPrompt = buildGeminiSystemPrompt('FinTech');

    it('both Groq and Gemini system prompts must explicitly target a 3-hour development window', () => {
      expect(groqPrompt).toContain('within 3 hours');
      expect(geminiPrompt).toContain('within 3 hours');
      expect(groqPrompt).not.toContain('2 hours');
      expect(geminiPrompt).not.toContain('2 hours');
    });

    it('both prompts must enforce concise, natural deliverable writing style and forbid multi-level sections', () => {
      expect(groqPrompt).toContain('DELIVERABLE WRITING STYLE');
      expect(geminiPrompt).toContain('DELIVERABLE WRITING STYLE');
      expect(groqPrompt).toContain('DO NOT INTRODUCE SEPARATE SECTIONS');
      expect(geminiPrompt).toContain('DO NOT INTRODUCE SEPARATE SECTIONS');

      // Prohibit rigid multi-tier headers from being prescribed in output
      const forbiddenSectionNames = [
        '"Must Build"',
        '"Should Improve"',
        '"Bonus Challenges"',
        '"Stretch Goals"'
      ];

      for (const section of forbiddenSectionNames) {
        expect(groqPrompt).toContain(section);
        expect(geminiPrompt).toContain(section);
      }
    });

    it('both prompts must emphasize 3–5 meaningful features and demonstrable functionality over static mockups', () => {
      expect(groqPrompt).toContain('approximately 3–5 meaningful features');
      expect(geminiPrompt).toContain('approximately 3–5 meaningful features');
      expect(groqPrompt).toContain('functional and demonstrable');
      expect(geminiPrompt).toContain('functional and demonstrable');
      expect(groqPrompt).toContain('not just a UI mockup or static prototype');
      expect(geminiPrompt).toContain('not just a UI mockup or static prototype');
    });

    it('both prompts must forbid unrealistic enterprise-scale scope', () => {
      const forbiddenAntiPatterns = [
        'full production authentication',
        'Complex multi-role administration',
        'Multiple independent backend services or microservices',
        'Large-scale machine learning model training',
        'External integrations requiring lengthy setup'
      ];

      for (const pattern of forbiddenAntiPatterns) {
        expect(groqPrompt.toLowerCase()).toContain(pattern.toLowerCase());
        expect(geminiPrompt.toLowerCase()).toContain(pattern.toLowerCase());
      }
    });

    it('both prompts must demand technical depth through useful algorithms, data processing, and optimization', () => {
      expect(groqPrompt).toContain('MAINTAIN TECHNICAL DEPTH');
      expect(geminiPrompt).toContain('MAINTAIN TECHNICAL DEPTH');
      expect(groqPrompt).toContain('Do NOT make every challenge a basic CRUD application');
      expect(geminiPrompt).toContain('Do NOT make every challenge a basic CRUD application');
    });
  });

  describe('2. Curated Fallback Deliverable Structure & 3-Hour Scope', () => {
    it('buildRichDeliverable must output a concise natural deliverable within 3 hours without multi-level sections', () => {
      const deliverable = buildRichDeliverable({
        title: 'Micro-Savings Round-Up Simulator',
        theme: 'FinTech',
        statement: 'Young adults struggle to save money consistently because manual transfers feel burdensome.',
        restrictionRule: 'Simulated Wallet Only: Must use simulated wallet transactions; no live banking credentials.',
        resourceName: 'Web Storage API'
      });

      expect(deliverable).toContain('3-hour MVP');
      expect(deliverable).not.toContain('LEVEL 1');
      expect(deliverable).not.toContain('MUST BUILD');
      expect(deliverable).not.toContain('LEVEL 2');
      expect(deliverable).not.toContain('SHOULD IMPROVE');
      expect(deliverable).not.toContain('LEVEL 3');
      expect(deliverable).not.toContain('BONUS CHALLENGE');
      expect(deliverable).not.toContain('Stretch Goals');
      expect(deliverable.length).toBeGreaterThanOrEqual(150);
      expect(deliverable.length).toBeLessThanOrEqual(900);
    });

    it('generateOfficialFallback across all 8 themes must produce valid challenges with concise deliverables', () => {
      for (const theme of APPROVED_THEMES) {
        const fallback = generateOfficialFallback(theme);
        const validation = validateChallenge(fallback, theme);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(fallback.deliverable.length).toBeLessThanOrEqual(900);
        expect(fallback.deliverable).toContain('3-hour');
        expect(fallback.deliverable).not.toContain('LEVEL 1');
        expect(fallback.deliverable).not.toContain('MUST BUILD');
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
