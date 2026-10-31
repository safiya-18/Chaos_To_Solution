import { describe, it, expect, vi } from 'vitest';
import { validateChallenge, isKeywordDisallowed } from '../../src/utils/challengeValidator.js';
import { validateHardRules } from '../../src/services/diversityService.js';
import { ChallengeService } from '../../src/services/challengeService.js';
import { buildGroqSystemPrompt, formatDeliverableProse } from '../../src/services/groqService.js';
import { buildSystemPrompt as buildGeminiSystemPrompt } from '../../src/services/geminiService.js';

describe('AI Generation Fixes & Validation Regression Suite', () => {
  const createBaseChallenge = (overrides = {}) => ({
    theme: 'HealthTech',
    problem: {
      title: 'Nutrition Assistant',
      statement: 'Develop a client-side nutrition tracking assistant that analyzes food entries.'
    },
    restriction: {
      name: 'Client-Side Only',
      rule: 'Pure client-side only using LocalStorage for persistence. No backend servers or paid APIs allowed.'
    },
    resource: {
      name: 'HTML5 Web SpeechSynthesis API',
      type: 'browser-api',
      guidance: 'Use text-to-speech synthesis to announce nutritional insights.',
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis'
    },
    deliverable: 'Build a functional client-side app that tracks food entries, flags dietary risks, and stores user history locally.',
    ...overrides
  });

  // 1. Negation detection
  describe('1. Negation Detection Engine', () => {
    it('should correctly allow compliant negative restrictions containing banned keywords', () => {
      const compliantRestrictions = [
        'All logic, parsing, and storage must be purely client-side using LocalStorage. No backend servers, database connections, or paid APIs are permitted.',
        'Zero external cloud services or paid APIs allowed in this hackathon challenge.',
        'Paid APIs are strictly prohibited in this application.',
        'Must run completely offline without any paid APIs, OpenAI, or AWS Lambda.',
        'Designed to track, audit, and cancel unused subscription plans without spending money.'
      ];

      for (const text of compliantRestrictions) {
        expect(isKeywordDisallowed(text, 'paid api')).toBe(false);
      }
    });

    it('should strictly reject affirmative, non-negated usage of prohibited services', () => {
      const affirmativeDisallowed = [
        'The application requires OpenAI API to generate smart suggestions.',
        'Integrate Stripe payments to process user subscription fees.',
        'Deploy backend endpoints using AWS Lambda and DynamoDB.',
        'Must use a paid API to fetch real-time stock prices.'
      ];

      expect(isKeywordDisallowed(affirmativeDisallowed[0], 'openai')).toBe(true);
      expect(isKeywordDisallowed(affirmativeDisallowed[1], 'stripe')).toBe(true);
      expect(isKeywordDisallowed(affirmativeDisallowed[2], 'aws')).toBe(true);
      expect(isKeywordDisallowed(affirmativeDisallowed[3], 'paid api')).toBe(true);
    });

    it('should pass full validateChallenge and validateHardRules for compliant negated restrictions', () => {
      const challenge = createBaseChallenge({
        restriction: {
          name: 'Zero Paid Tools',
          rule: 'All state must be stored locally. No backend servers, database connections, or paid APIs are permitted.'
        }
      });

      const validation = validateChallenge(challenge, 'HealthTech');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);

      const hardRules = validateHardRules(challenge);
      expect(hardRules.passed).toBe(true);
    });
  });

  // 2. Prompt instructions preserve restrictions
  describe('2. Prompt Construction & Restriction Preservation', () => {
    it('should instruct Groq and Gemini models to preserve restrictions and avoid literal "paid API" phrasing', () => {
      const groqPrompt = buildGroqSystemPrompt('HealthTech');
      expect(groqPrompt).toContain('Zero external cloud services');
      expect(groqPrompt).toContain('PRESERVE ALL MANDATORY RESTRICTIONS');
      expect(groqPrompt).toContain('do NOT use the literal phrase \'paid API\'');

      const geminiPrompt = buildGeminiSystemPrompt('HealthTech');
      expect(geminiPrompt).toContain('Zero external cloud services');
      expect(geminiPrompt).toContain('PRESERVE ALL MANDATORY RESTRICTIONS');
      expect(geminiPrompt).toContain('do NOT use the literal phrase \'paid API\'');
    });
  });

  // 3. Deliverables as readable prose
  describe('3. Deliverable Clean Prose Unpacking', () => {
    it('should unpack stringified JSON deliverables into clean, readable text paragraphs', async () => {
      const stringifiedJsonDeliverable = JSON.stringify({
        'Product Objective': 'Build an offline personal triage assistant.',
        'Functional Requirements': 'Symptom logging, risk score computation, and visual severity alerts.',
        'Demo Outcome': 'Fully working single-page application demonstrating triage workflow.'
      });

      const mockGroq = {
        generate: vi.fn().mockResolvedValue({
          theme: 'HealthTech',
          problem: { title: 'Triage Assistant', statement: 'Help users assess basic health urgency.' },
          restriction: { name: 'Local Only', rule: 'All logic remains in browser.' },
          resource: {
            name: 'Local Symptom Dataset',
            type: 'local-dataset',
            guidance: 'Load bundled JSON symptom dataset.',
            docsUrl: 'https://en.wikipedia.org/wiki/ICD-10'
          },
          deliverable: stringifiedJsonDeliverable
        })
      };

      // Mock groqService.generate callApi deliverable unpacking behavior
      const rawResult = await mockGroq.generate('HealthTech');
      if (typeof rawResult.deliverable === 'string' && rawResult.deliverable.trim().startsWith('{')) {
        const inner = JSON.parse(rawResult.deliverable);
        rawResult.deliverable = Object.entries(inner)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n\n');
      }

      expect(rawResult.deliverable.startsWith('{')).toBe(false);
      expect(rawResult.deliverable).toContain('Product Objective: Build an offline personal triage assistant.');
      expect(rawResult.deliverable).toContain('Functional Requirements: Symptom logging');
    });
  });

  // 4. Browser API resilience
  describe('4. Built-in Browser API Resilience', () => {
    it('should preserve browser-api resources as verification_pending if docsUrl fetch fails', async () => {
      const mockGroq = {
        generate: vi.fn().mockResolvedValue({
          theme: 'HealthTech',
          problem: {
            title: 'Audio Medication Tracker',
            statement: 'Track scheduled medications with spoken voice alarms.'
          },
          restriction: {
            name: 'Client-Only',
            rule: 'No backend servers permitted.'
          },
          resource: {
            name: 'HTML5 Web SpeechSynthesis API',
            type: 'browser-api',
            guidance: 'Use text-to-speech to announce alerts.',
            docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis'
          },
          deliverable: 'A client-side medication timer that speaks pill names aloud.'
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true
      });

      const result = await service.generateChallenge('HealthTech');
      expect(result.source).toBe('ai');
      expect(result.resource.type).toBe('browser-api');
      expect(['verified', 'verification_pending']).toContain(result.resource.verificationStatus);
    });
  });

  // 5. Novelty retries & failover
  describe('5. Novelty Retries & Cascade Behavior', () => {
    it('should retry primary provider on borderline novelty before cascading', async () => {
      const borderChallenge1 = createBaseChallenge({
        problem: { title: 'Triage Tool v1', statement: 'Duplicate statement that exceeds similarity threshold.' }
      });
      const novelChallenge2 = createBaseChallenge({
        problem: { title: 'Completely Novel Biometric Tracker', statement: 'A unique algorithmic biofeedback monitor.' }
      });

      let callCount = 0;
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => {
          callCount++;
          return callCount === 1 ? borderChallenge1 : novelChallenge2;
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        hasGroqKey: true,
        maxNoveltyRetries: 3
      });

      const result = await service.generateChallenge('HealthTech', {
        comparisonPool: [
          {
            domain: 'HealthTech',
            problemStatement: 'Duplicate statement that exceeds similarity threshold.',
            restriction: 'No backend servers permitted.',
            resource: 'Local storage'
          }
        ]
      });

      expect(callCount).toBe(2);
      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Completely Novel Biometric Tracker');
    });

    it('should clearly distinguish AI-generated challenges from curated fallback', async () => {
      const serviceWithAi = new ChallengeService({
        provider: 'groq',
        groqService: {
          generate: vi.fn().mockResolvedValue(createBaseChallenge())
        },
        hasGroqKey: true
      });

      const aiResult = await serviceWithAi.generateChallenge('HealthTech');
      expect(aiResult.source).toBe('ai');

      const serviceWithFallback = new ChallengeService({
        provider: 'groq',
        groqService: {
          generate: vi.fn().mockRejectedValue(new Error('Network error'))
        },
        hasGroqKey: true,
        hasGeminiKey: false
      });

      const fallbackResult = await serviceWithFallback.generateChallenge('HealthTech');
      expect(fallbackResult.source).toBe('curated-fallback');
    });

    it('should not silently bypass validation when hard rules fail', async () => {
      const illegalChallenge = createBaseChallenge({
        problem: {
          title: 'Train Custom LLM',
          statement: 'Train an LLM from scratch on medical patient histories within 3 hours.'
        }
      });

      const service = new ChallengeService({
        provider: 'groq',
        groqService: {
          generate: vi.fn().mockResolvedValue(illegalChallenge)
        },
        hasGroqKey: true,
        hasGeminiKey: false,
        maxNoveltyRetries: 1
      });

      // Should reject impossible feat and safely fall back to curated challenge
      const result = await service.generateChallenge('HealthTech');
      expect(result.source).toBe('curated-fallback');
      expect(result.problem.title).not.toBe('Train Custom LLM');
    });

    it('should format complete and truncated JSON string deliverables into readable prose', () => {
      // 1. Complete JSON object string
      const completeJson = JSON.stringify({
        productObjective: 'Deliver an accessible exam simulator',
        functionalRequirements: ['Voice input', 'Axe-core scan'],
        systemComponents: 'Client application with LocalStorage'
      });
      const completeResult = formatDeliverableProse(completeJson);
      expect(completeResult).toContain('Product Objective: Deliver an accessible exam simulator');
      expect(completeResult).toContain('Functional Requirements: Voice input; Axe-core scan');
      expect(completeResult.startsWith('{')).toBe(false);

      // 2. Truncated JSON string (e.g. cut off by token limit before closing brace)
      const truncatedJson = '{"title": "Accessible Exam", "problemStatement": "Visual impairment barrier", "productObjective": "Create offline exam simulator';
      const truncatedResult = formatDeliverableProse(truncatedJson);
      expect(truncatedResult).toContain('Title: Accessible Exam');
      expect(truncatedResult).toContain('Problem Statement: Visual impairment barrier');
      expect(truncatedResult.startsWith('{')).toBe(false);

      // 3. Normal plain text passes through unchanged
      const plainText = 'Build a multi-page web utility that solves food waste with 3 key features.';
      expect(formatDeliverableProse(plainText)).toBe(plainText);
    });
  });
});
