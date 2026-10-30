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

  it('should accept rich, multi-component deliverables up to 1500 characters', () => {
    const richDeliverable = `Product Objective: Build a complete expense settlement platform.
Functional Requirements: Add expenses, compute minimal debt transactions, and export reports.
System Components: Client-side calculation engine, interactive dashboard, and local persistence.
Expected Working Outcome: Fully demonstratable zero-server settlement app.
Evaluation Criteria: Functional completeness, settlement accuracy, and constraint compliance.`;
    const challenge = createValidChallenge({ deliverable: richDeliverable });
    const result = validateChallenge(challenge, 'HealthTech');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should reject deliverables exceeding 1500 characters', () => {
    const tooLong = 'A'.repeat(1501);
    const challenge = createValidChallenge({ deliverable: tooLong });
    const result = validateChallenge(challenge, 'HealthTech');
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('deliverable must be a string between 10 and 1500 characters'))).toBe(true);
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

  it('should generate concise, natural 3-hour deliverables without multi-level sections across all approved themes', () => {
    APPROVED_THEMES.forEach((theme) => {
      const challenge = generateFallback(theme);
      expect(challenge.deliverable).toContain('3-hour MVP');
      expect(challenge.deliverable).not.toContain('LEVEL 1');
      expect(challenge.deliverable).not.toContain('MUST BUILD');
      expect(challenge.deliverable).not.toContain('Bonus Challenges');
      expect(challenge.deliverable).not.toContain('Stretch Goals');
      expect(challenge.deliverable.length).toBeGreaterThan(150);
      expect(challenge.deliverable.length).toBeLessThanOrEqual(800);
    });
  });

  it('should preserve client-side restrictions and avoid prescribing backend servers in deliverables', () => {
    // Generate fallbacks for FinTech and check restrictions containing client-side only
    const challenge = generateFallback('FinTech');
    if (challenge.restriction.rule.toLowerCase().includes('client-side')) {
      expect(challenge.deliverable.toLowerCase()).not.toContain('backend api');
      expect(challenge.deliverable.toLowerCase()).not.toContain('server-side database');
    }
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
      provider: 'gemini',
      geminiService: mockGemini,
      hasGeminiKey: true,
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
        name: 'HTML5 Canvas 2D API',
        type: 'browser-api',
        guidance: 'Render real-time animated power curves and panel state programmatically.',
        docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
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

describe('Phase 6: Multi-Provider (Groq & Gemini) Orchestration', () => {
  const sampleGroqOutput = {
    theme: 'FinTech',
    problem: {
      title: 'Micro-Expense Tracker',
      statement: 'A real-time lightweight budget tracker for student campus purchases.'
    },
    restriction: {
      name: 'Single File Architecture',
      rule: 'All logic and styling must reside entirely within a single standalone HTML page.'
    },
    resource: {
      name: 'HTML5 IndexedDB Storage',
      type: 'browser-api',
      guidance: 'Store and retrieve transaction history offline without external databases.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'
    },
    deliverable: 'A single-page prototype storing and graphing campus micro-transactions.'
  };

  const sampleGeminiOutput = {
    theme: 'FinTech',
    problem: {
      title: 'Campus Food Coupon Expiry Alert',
      statement: 'A tracker warning students before meal coupon credits expire.'
    },
    restriction: {
      name: 'Zero External CSS',
      rule: 'Use standard HTML5 elements with inline styles and zero third-party stylesheets.'
    },
    resource: {
      name: 'Web Notification API',
      type: 'browser-api',
      guidance: 'Trigger desktop alerts when coupons are within 24 hours of expiring.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API'
    },
    deliverable: 'A functional single-screen web app showing coupon timers and notifications.'
  };

  it('should use Groq by default when provider is groq and Groq succeeds', async () => {
    const mockGroq = { generate: vi.fn().mockResolvedValue(sampleGroqOutput) };
    const mockGemini = { generate: vi.fn().mockResolvedValue(sampleGeminiOutput) };

    const service = new ChallengeService({
      provider: 'groq',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: true,
      hasGeminiKey: true
    });

    const result = await service.generateChallenge('FinTech');
    expect(result.source).toBe('ai');
    expect(result.problem.title).toBe('Micro-Expense Tracker');
    expect(mockGroq.generate).toHaveBeenCalledOnce();
    expect(mockGemini.generate).not.toHaveBeenCalled();
  });

  it('should seamlessly fail over to Gemini when Groq encounters a 429 rate limit', async () => {
    const mockGroq = {
      generate: vi.fn().mockRejectedValue(new Error('429 rate_limit_exceeded'))
    };
    const mockGemini = { generate: vi.fn().mockResolvedValue(sampleGeminiOutput) };

    const service = new ChallengeService({
      provider: 'groq',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: true,
      hasGeminiKey: true
    });

    const result = await service.generateChallenge('FinTech');
    expect(result.source).toBe('ai');
    expect(result.problem.title).toBe('Campus Food Coupon Expiry Alert');
    expect(mockGroq.generate).toHaveBeenCalledOnce();
    expect(mockGemini.generate).toHaveBeenCalledOnce();
  });

  it('should seamlessly fail over to Gemini when Groq encounters a 404 model_not_found error', async () => {
    const mockGroq = {
      generate: vi.fn().mockRejectedValue(new Error('404 The model does not exist (model_not_found)'))
    };
    const mockGemini = { generate: vi.fn().mockResolvedValue(sampleGeminiOutput) };

    const service = new ChallengeService({
      provider: 'groq',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: true,
      hasGeminiKey: true
    });

    const result = await service.generateChallenge('FinTech');
    expect(result.source).toBe('ai');
    expect(result.problem.title).toBe('Campus Food Coupon Expiry Alert');
    expect(mockGroq.generate).toHaveBeenCalledOnce();
    expect(mockGemini.generate).toHaveBeenCalledOnce();
  });

  it('should use Gemini directly when provider is explicitly configured to gemini', async () => {
    const mockGroq = { generate: vi.fn().mockResolvedValue(sampleGroqOutput) };
    const mockGemini = { generate: vi.fn().mockResolvedValue(sampleGeminiOutput) };

    const service = new ChallengeService({
      provider: 'gemini',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: true,
      hasGeminiKey: true
    });

    const result = await service.generateChallenge('FinTech');
    expect(result.source).toBe('ai');
    expect(result.problem.title).toBe('Campus Food Coupon Expiry Alert');
    expect(mockGemini.generate).toHaveBeenCalledOnce();
    expect(mockGroq.generate).not.toHaveBeenCalled();
  });

  it('should drop cleanly to curated fallback when both Groq and Gemini fail', async () => {
    const mockGroq = {
      generate: vi.fn().mockRejectedValue(new Error('429 rate_limit_exceeded'))
    };
    const mockGemini = {
      generate: vi.fn().mockRejectedValue(new Error('503 Service Unavailable'))
    };

    const service = new ChallengeService({
      provider: 'groq',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: true,
      hasGeminiKey: true
    });

    const result = await service.generateChallenge('FinTech');
    expect(result.source).toBe('curated-fallback');
    expect(result.theme).toBe('FinTech');
    expect(validateChallenge(result, 'FinTech').isValid).toBe(true);
    expect(mockGroq.generate).toHaveBeenCalledOnce();
    expect(mockGemini.generate).toHaveBeenCalledOnce();
  });

  it('should drop directly to curated fallback when neither provider key is configured', async () => {
    const mockGroq = { generate: vi.fn() };
    const mockGemini = { generate: vi.fn() };

    const service = new ChallengeService({
      provider: 'groq',
      groqService: mockGroq,
      geminiService: mockGemini,
      hasGroqKey: false,
      hasGeminiKey: false
    });

    const result = await service.generateChallenge('EdTech');
    expect(result.source).toBe('curated-fallback');
    expect(mockGroq.generate).not.toHaveBeenCalled();
    expect(mockGemini.generate).not.toHaveBeenCalled();
  });
});
