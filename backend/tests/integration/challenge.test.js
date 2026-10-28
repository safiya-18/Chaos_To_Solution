import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import groqService from '../../src/services/groqService.js';
import geminiService from '../../src/services/geminiService.js';

describe('Phase 4: Challenge API Integration Tests (POST /api/challenges/generate)', () => {
  const createMockChallenge = (theme) => ({
    theme,
    problem: {
      title: `${theme} Automated Solution Challenge`,
      statement: `A student-tailored prototype problem statement addressing real user challenges in ${theme}.`
    },
    restriction: {
      name: 'Client-Side Only Execution',
      rule: 'The solution must operate entirely within the browser without requiring a custom backend service.'
    },
    resource: {
      name: 'Web Storage API',
      type: 'browser-api',
      guidance: `Use browser local storage to preserve state and preferences for this ${theme} prototype.`,
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
    },
    deliverable: `A functional 3-hour prototype demonstrating the core user flow for ${theme}.`
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    // Default mocks ensure tests run deterministically offline without burning Groq or Gemini quotas
    vi.spyOn(groqService, 'generate').mockImplementation(async (theme) => createMockChallenge(theme));
    vi.spyOn(geminiService, 'generate').mockImplementation(async (theme) => createMockChallenge(theme));
  });

  describe('Theme Validation & Error Handling (HTTP 400)', () => {
    it('should return HTTP 400 when theme is missing from request body', async () => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_THEME',
          message: expect.stringContaining("Missing required field 'theme'")
        })
      });
    });

    it('should return HTTP 400 when theme is an empty or whitespace string', async () => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_THEME'
        })
      });
    });

    it('should return HTTP 400 when theme is not one of the 8 approved themes', async () => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'Blockchain' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_THEME',
          message: expect.stringContaining("Invalid theme 'Blockchain'")
        })
      });
    });

    it('should return HTTP 400 when request body contains malformed JSON', async () => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .set('Content-Type', 'application/json')
        .send('{"theme": "EdTech"'); // Invalid unclosed JSON

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Theme Acceptance & Contract Verification (All 8 Approved Themes)', () => {
    const approvedThemes = [
      'EdTech',
      'FinTech',
      'HealthTech',
      'Sustainability',
      'Smart Cities',
      'Accessibility',
      'E-commerce',
      'Open Innovation'
    ];

    it.each(approvedThemes)('should accept approved theme "%s" and return 200 OK with compliant envelope', async (theme) => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;
      expect(data).toBeDefined();
      expect(data.theme).toBe(theme);
      expect(data.id).toMatch(/^cts-[a-z0-9]+-[a-z0-9]+$/);
      expect(new Date(data.generatedAt).toISOString()).toBe(data.generatedAt);
      expect(['ai', 'curated-fallback']).toContain(data.source);

      // Verify core challenge structure
      const { challenge } = data;
      expect(challenge).toBeDefined();
      expect(challenge.theme).toBe(theme);
      expect(challenge.problem.title).toBeTruthy();
      expect(challenge.problem.statement).toBeTruthy();
      expect(challenge.restriction.name).toBeTruthy();
      expect(challenge.restriction.rule).toBeTruthy();
      expect(challenge.resource.name).toBeTruthy();
      expect(challenge.resource.guidance).toBeTruthy();
      expect(challenge.resource.docsUrl).toMatch(/^https?:\/\//);
      expect(challenge.deliverable).toBeTruthy();

      // Verify shareText presence and formatting
      expect(data.shareText).toBeDefined();
      expect(data.shareText).toContain('⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡');
      expect(data.shareText).toContain(`🏷️ *Theme:* ${theme}`);
      expect(data.shareText).toContain(`📌 *01 — PROBLEM STATEMENT*`);
      expect(data.shareText).toContain(`⚠️ *02 — TECHNICAL RESTRICTION*`);
      expect(data.shareText).toContain(`🛠️ *03 — RESOURCE*`);
      expect(data.shareText).toContain(`🎯 *04 — EXPECTED DELIVERABLE*`);
      expect(data.shareText).toContain(challenge.resource.docsUrl);

      // Verify docsUrl occurs exactly once in shareText
      const urlMatches = data.shareText.match(new RegExp(challenge.resource.docsUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
      expect(urlMatches).toHaveLength(1);
    });
  });

  describe('AI Generation vs. Curated Fallback Mocking', () => {
    it('should return source: "ai" when AI provider returns a valid challenge', async () => {
      const mockAiChallenge = {
        theme: 'EdTech',
        problem: {
          title: 'Dyslexia-Aware Speed Reader',
          statement: 'Build a rapid reader tool that converts crowded academic articles into spaced, bionic reading formats.'
        },
        restriction: {
          name: 'Zero External Bundles',
          rule: 'All fonts, styling, and text segmentation must run using native browser APIs with no npm UI packages.'
        },
        resource: {
          name: 'Web Storage API (LocalStorage)',
          type: 'browser-api',
          guidance: 'Store user font-scaling, color contrast, and reading pace preferences across browser tabs.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
        },
        deliverable: 'A working prototype showing dyslexia-friendly speed reading with persistent theme toggles.'
      };

      vi.spyOn(groqService, 'generate').mockResolvedValueOnce(mockAiChallenge);
      vi.spyOn(geminiService, 'generate').mockResolvedValueOnce(mockAiChallenge);

      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'EdTech' });

      expect(response.status).toBe(200);
      expect(response.body.data.source).toBe('ai');
      expect(response.body.data.challenge.problem.title).toBe('Dyslexia-Aware Speed Reader');
      expect(response.body.data.shareText).toContain('[AI Generated]');
    });

    it('should transparently return source: "curated-fallback" when AI providers encounter a 429 quota limit or network timeout', async () => {
      vi.spyOn(groqService, 'generate').mockRejectedValueOnce(
        new Error('429 rate_limit_exceeded')
      );
      vi.spyOn(geminiService, 'generate').mockRejectedValueOnce(
        new Error('ResourceExhausted: 429 Quota Exceeded')
      );

      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'Smart Cities' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.source).toBe('curated-fallback');
      expect(response.body.data.theme).toBe('Smart Cities');
      expect(response.body.data.shareText).toContain('[Backup Challenge]');
      expect(response.body.data.challenge.problem.title).toBeTruthy();
    });

    it('should transparently return source: "curated-fallback" when AI response fails validation', async () => {
      const invalidAiResponse = {
        theme: 'FinTech',
        problem: { title: 'X', statement: 'Too short' }, // Invalid bounds
        restriction: { name: 'R', rule: 'R' },
        resource: { name: 'Res', type: 'invalid-type', guidance: 'G', docsUrl: 'bad-url' },
        deliverable: 'D'
      };

      vi.spyOn(groqService, 'generate').mockResolvedValueOnce(invalidAiResponse);
      vi.spyOn(geminiService, 'generate').mockResolvedValueOnce(invalidAiResponse);

      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'FinTech' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.source).toBe('curated-fallback');
      expect(response.body.data.theme).toBe('FinTech');
    });
  });

  describe('Zero Secrets Leakage & Response Security', () => {
    it('should never expose GROQ_API_KEY, GEMINI_API_KEY, or secret environment variables in response body', async () => {
      const response = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'Sustainability' });

      expect(response.status).toBe(200);
      const jsonString = JSON.stringify(response.body);
      expect(jsonString).not.toContain('AIzaSy');
      expect(jsonString).not.toContain('GEMINI_API_KEY');
      expect(jsonString).not.toContain('gsk_');
      expect(jsonString).not.toContain('GROQ_API_KEY');
    });
  });
});
