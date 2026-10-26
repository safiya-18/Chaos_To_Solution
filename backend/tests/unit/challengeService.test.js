import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APPROVED_THEMES,
  ValidationError,
  validateTheme,
  validateChallenge
} from '../../src/utils/challengeValidator.js';
import { generateFallback, THEME_PROBLEM_AFFINITY } from '../../src/services/fallbackService.js';
import { ChallengeService } from '../../src/services/challengeService.js';

describe('Phase 3: Theme Validation', () => {
  it('should accept all 8 approved themes', () => {
    APPROVED_THEMES.forEach((theme) => {
      expect(validateTheme(theme)).toBe(theme);
      expect(validateTheme(`  ${theme}  `)).toBe(theme);
    });
  });

  it('should throw ValidationError for missing, null, or falsy themes', () => {
    expect(() => validateTheme()).toThrow(ValidationError);
    expect(() => validateTheme('')).toThrow(ValidationError);
    expect(() => validateTheme(null)).toThrow(ValidationError);
    expect(() => validateTheme(123)).toThrow(ValidationError);
  });

  it('should throw ValidationError for unapproved theme strings without silent fallback', () => {
    expect(() => validateTheme('CryptoWeb3')).toThrow(ValidationError);
    expect(() => validateTheme('RandomTheme')).toThrow(ValidationError);
    expect(() => validateTheme('Gaming')).toThrow(/Invalid theme 'Gaming'/);
  });
});

describe('Phase 3: Challenge Validator', () => {
  const createValidChallenge = (overrides = {}) => ({
    theme: 'HealthTech',
    problem: {
      title: 'Medication Adherence Alarm',
      statement: 'Build a single-screen dashboard to help patients track daily pill schedules with audio reminders.'
    },
    restriction: {
      name: 'Single Screen View',
      rule: 'All state, inputs, and feedback must live on one view without modals or navigation.'
    },
    resource: {
      name: 'HTML5 Web SpeechSynthesis API',
      type: 'browser-api',
      guidance: 'Use text-to-speech synthesis to announce medication names aloud upon reminder click.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis'
    },
    deliverable: 'A responsive single-screen prototype demonstrating reminder audio and check-ins.',
    ...overrides
  });

  it('should pass validation for a well-formed challenge', () => {
    const challenge = createValidChallenge();
    const result = validateChallenge(challenge, 'HealthTech');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject challenge when theme does not match requested theme', () => {
    const challenge = createValidChallenge({ theme: 'FinTech' });
    const result = validateChallenge(challenge, 'HealthTech');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('does not match requested theme'))).toBe(true);
  });

  it('should reject challenge with missing or out-of-bounds fields', () => {
    const invalidChallenge = createValidChallenge({
      problem: { title: 'No', statement: 'Short' }
    });
    const result = validateChallenge(invalidChallenge, 'HealthTech');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject challenge with invalid resource type or malformed docsUrl', () => {
    const invalidResource = createValidChallenge({
      resource: {
        name: 'Custom Tool',
        type: 'unsupported-type',
        guidance: 'Valid guidance statement explaining how to integrate.',
        docsUrl: 'not-a-url'
      }
    });
    const result = validateChallenge(invalidResource, 'HealthTech');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('resource.type'))).toBe(true);
    expect(result.errors.some((e) => e.includes('resource.docsUrl'))).toBe(true);
  });

  it('should strictly reject challenges referencing banned paid services or hardware', () => {
    const bannedServices = ['OpenAI API', 'Stripe payments', 'AWS Lambda', 'Raspberry Pi'];

    bannedServices.forEach((banned) => {
      const challenge = createValidChallenge({
        problem: {
          title: `Project using ${banned}`,
          statement: `A platform requiring ${banned} to operate fully.`
        }
      });
      const result = validateChallenge(challenge, 'HealthTech');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('disallowed paid/proprietary'))).toBe(true);
    });
  });
});

describe('Phase 3: Curated Fallback Service', () => {
  it('should generate a valid fallback challenge for every approved theme', () => {
    APPROVED_THEMES.forEach((theme) => {
      const challenge = generateFallback(theme);
      expect(challenge.theme).toBe(theme);
      expect(challenge.source).toBe('curated-fallback');

      const validation = validateChallenge(challenge, theme);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  it('should avoid recently used problem titles when alternatives exist', () => {
    const theme = 'EdTech';
    const firstChallenge = generateFallback(theme);
    const recentHistory = [`${theme}:${firstChallenge.problem.title}`];

    // Candidate pool has multiple EdTech problems
    const secondChallenge = generateFallback(theme, recentHistory);
    expect(secondChallenge.problem.title).not.toBe(firstChallenge.problem.title);
  });

  it('should safely recycle candidates when all candidates for a theme have been seen', () => {
    const theme = 'FinTech';
    const candidateTitles = THEME_PROBLEM_AFFINITY[theme];
    const exhaustedHistory = candidateTitles.map((id) => `${theme}:${id}`);

    // Must not crash, should return a valid challenge
    const challenge = generateFallback(theme, exhaustedHistory);
    expect(challenge.theme).toBe(theme);
    expect(challenge.source).toBe('curated-fallback');
    expect(validateChallenge(challenge, theme).isValid).toBe(true);
  });
});

describe('Phase 3: Challenge Service Orchestration', () => {
  let mockGemini;
  let service;

  beforeEach(() => {
    mockGemini = {
      generate: vi.fn()
    };
    service = new ChallengeService({
      geminiService: mockGemini,
      fallbackGenerator: generateFallback,
      historyCapacity: 5
    });
  });

  it('should return source: "ai" when Gemini returns a valid challenge', async () => {
    const aiOutput = {
      theme: 'Sustainability',
      problem: {
        title: 'Solar Inverter Anomaly Alert',
        statement: 'A real-time monitor highlighting sudden power generation drops across campus solar panels.'
      },
      restriction: {
        name: 'Zero External CSS',
        rule: 'Use semantic HTML elements and inline styles with zero CSS libraries.'
      },
      resource: {
        name: 'Open-Meteo Weather API',
        type: 'public-api',
        guidance: 'Compare solar production against cloud cover and solar irradiance metrics.',
        docsUrl: 'https://open-meteo.com/en/docs'
      },
      deliverable: 'A responsive dashboard displaying panel output and cloud-cover correlation.'
    };

    mockGemini.generate.mockResolvedValue(aiOutput);

    const result = await service.generateChallenge('Sustainability');
    expect(result.source).toBe('ai');
    expect(result.problem.title).toBe('Solar Inverter Anomaly Alert');
    expect(service.getRecentHistory()).toContain('Sustainability:Solar Inverter Anomaly Alert');
  });

  it('should gracefully return source: "curated-fallback" when Gemini throws timeout or rate limit error', async () => {
    mockGemini.generate.mockRejectedValue(new Error('ResourceExhausted: 429 Quota Exceeded'));

    const result = await service.generateChallenge('Smart Cities');
    expect(result.source).toBe('curated-fallback');
    expect(result.theme).toBe('Smart Cities');
    expect(validateChallenge(result, 'Smart Cities').isValid).toBe(true);
  });

  it('should gracefully return source: "curated-fallback" when Gemini returns an invalid challenge', async () => {
    // Malformed: references banned OpenAI API and has invalid docsUrl
    mockGemini.generate.mockResolvedValue({
      theme: 'EdTech',
      problem: { title: 'AI Assistant', statement: 'Use OpenAI API to generate quiz questions.' },
      restriction: { name: 'Rule', rule: 'Must be quick.' },
      resource: { name: 'OpenAI', type: 'invalid-type', guidance: 'guidance', docsUrl: 'bad-url' },
      deliverable: 'Short'
    });

    const result = await service.generateChallenge('EdTech');
    expect(result.source).toBe('curated-fallback');
    expect(result.theme).toBe('EdTech');
    expect(validateChallenge(result, 'EdTech').isValid).toBe(true);
  });

  it('should manage in-memory history ring buffer capacity', () => {
    for (let i = 1; i <= 7; i++) {
      service.recordHistory(`Theme:Title_${i}`);
    }

    const history = service.getRecentHistory();
    expect(history.length).toBe(5);
    expect(history[0]).toBe('Theme:Title_3');
    expect(history[4]).toBe('Theme:Title_7');
  });
});
