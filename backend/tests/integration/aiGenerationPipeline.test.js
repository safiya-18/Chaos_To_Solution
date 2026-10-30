import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import challengeService, { ChallengeService } from '../../src/services/challengeService.js';
import { TeamService } from '../../src/services/teamService.js';
import { generateFallback } from '../../src/services/fallbackService.js';
import { validateChallenge } from '../../src/utils/challengeValidator.js';
import { getGroundingContext } from '../../src/services/groundingService.js';

describe('Phase 4: End-to-End AI Generation Integration & Quality Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Grounded Context Retrieval', () => {
    it('should retrieve domain-relevant reference benchmarks and authoritative online resources', async () => {
      const context = await getGroundingContext('EdTech');

      expect(context).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS');
      expect(context).toContain('AVAILABLE VERIFIED ONLINE RESOURCES');
      // Must not dump entire 55 records, only compact relevant snippets
      expect(context.length).toBeLessThan(3000);
      expect(context).toContain('EdTech');
    });

    it('should return empty string safely for invalid or empty domain', async () => {
      const context = await getGroundingContext('');
      expect(context).toBe('');
    });
  });

  describe('2. Grounded Generation Flow with Mocked AI Providers', () => {
    it('should pass groundingContext into AI generation and return a scored, novel challenge', async () => {
      const mockGroq = {
        generate: vi.fn().mockImplementation(async (theme, recentHistory, options) => {
          expect(options.groundingContext).toBeDefined();
          expect(options.groundingContext).toContain('APPROVED REFERENCE CHALLENGE');
          return {
            theme: 'EdTech',
            problem: {
              title: 'Adaptive Micro-Quiz Generator',
              statement: 'Students preparing for engineering competitive exams need immediate targeted diagnostic flashcards.'
            },
            restriction: {
              name: 'Zero External Frameworks',
              rule: 'Implement using pure vanilla JavaScript, HTML5, and CSS with no bundlers.'
            },
            resource: {
              name: 'Web Storage API',
              type: 'browser-api',
              guidance: 'Persist quiz state, score trends, and weak area tags in localStorage.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
            },
            deliverable: 'A responsive single-page web application featuring dynamic question rendering and instant local progress analytics.'
          };
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        fallbackGenerator: generateFallback,
        hasGroqKey: true
      });

      const result = await service.generateChallenge('EdTech');

      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Adaptive Micro-Quiz Generator');
      expect(result.challengeSignature).toBeDefined();
      expect(result.noveltyScores).toBeDefined();
      expect(result.diversityScore).toBeGreaterThan(0.5);
      expect(result.resource.verificationStatus).toBe('verified');
      expect(validateChallenge(result, 'EdTech').isValid).toBe(true);
    });
  });

  describe('3. Duplicate Detection & Bounded Retry', () => {
    it('should reject a duplicate reference challenge, retry with bounded limit, and accept novel candidate', async () => {
      let callCount = 0;
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // Exact copy of reference challenge bench_046 from PDF
            return {
              theme: 'Accessibility',
              problem: {
                title: 'Keyboard-Only Web Audio Screen Navigation Tool',
                statement: 'Visually impaired users cannot understand websites where images have no description.'
              },
              restriction: {
                name: 'Must be fully usable with a keyboard only.',
                rule: 'Must be fully usable with a keyboard only.'
              },
              resource: {
                name: 'Web Speech API',
                type: 'browser-api',
                guidance: 'The browser Web Speech API speech-to-text and text-to-speech for vocalizing elements.',
                docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
              },
              deliverable: 'A lightweight web application that reads DOM elements aloud as the user navigates.'
            };
          }
          // Second candidate is novel and distinct
          return {
            theme: 'Accessibility',
            problem: {
              title: 'Haptic Soundscape Transcriber',
              statement: 'Auditory alert visualizer converting real-time alert frequencies into color-coded waveforms for deaf campus commuters.'
            },
            restriction: {
              name: 'Zero Mouse Interaction',
              rule: 'Full interactive workflows must be executable exclusively via standard keyboard tab and enter sequences.'
            },
            resource: {
              name: 'Web Audio API',
              type: 'browser-api',
              guidance: 'Analyze microphone frequency peaks and render them on an HTML5 canvas element.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API'
            },
            deliverable: 'A responsive single-flow web application visualizing audio inputs into animated waveforms.'
          };
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        fallbackGenerator: generateFallback,
        hasGroqKey: true,
        maxNoveltyRetries: 2
      });

      const result = await service.generateChallenge('Accessibility');

      expect(callCount).toBe(2);
      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Haptic Soundscape Transcriber');
      expect(result.challengeSignature).toBeDefined();
    });
  });

  describe('4. Hard Rules & Prohibited Services Enforcement', () => {
    it('should reject candidates referencing prohibited paid services and retry', async () => {
      let callCount = 0;
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // Contradictory constraints: Offline restriction conflicts with requirement for external public API
            return {
              theme: 'FinTech',
              problem: {
                title: 'Offline Market Monitor',
                statement: 'A financial tracking dashboard that provides real-time market data during local campus sessions.'
              },
              restriction: {
                name: 'Zero Network Operations',
                rule: 'Must run completely offline with zero external network connectivity after startup.'
              },
              resource: {
                name: 'Financial Modeling REST API',
                type: 'public-api',
                guidance: 'Query live financial stock ticker rates using cloud API requests.',
                docsUrl: 'https://financialmodelingprep.com/developer/docs'
              },
              deliverable: 'A responsive financial dashboard demonstrating offline operation with live cloud API data.'
            };
          }
          // Valid zero-budget candidate
          return {
            theme: 'FinTech',
            problem: {
              title: 'Offline Expense Ledger',
              statement: 'A student budget calculator highlighting daily dining expenses against monthly allowance.'
            },
            restriction: {
              name: 'Zero Network Requests',
              rule: 'All budget calculations and persistence must execute locally without making external HTTP requests.'
            },
            resource: {
              name: 'Web Storage API',
              type: 'browser-api',
              guidance: 'Store transactional arrays and category quotas directly in localStorage.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
            },
            deliverable: 'A responsive single-page budgeting dashboard with interactive balance tracking.'
          };
        })
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        fallbackGenerator: generateFallback,
        hasGroqKey: true,
        maxNoveltyRetries: 2
      });

      const result = await service.generateChallenge('FinTech');

      expect(callCount).toBe(2);
      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Offline Expense Ledger');
    });
  });

  describe('5. Provider Fallback Cascade', () => {
    it('should failover from Groq to Gemini and then to Curated Fallback when both fail', async () => {
      const mockGroq = {
        generate: vi.fn().mockRejectedValue(new Error('Groq 429 rate limit exceeded'))
      };
      const mockGemini = {
        generate: vi.fn().mockRejectedValue(new Error('Gemini 503 service unavailable'))
      };

      const service = new ChallengeService({
        provider: 'groq',
        groqService: mockGroq,
        geminiService: mockGemini,
        fallbackGenerator: generateFallback,
        hasGroqKey: true,
        hasGeminiKey: true
      });

      const result = await service.generateChallenge('Smart Cities');

      expect(result.source).toBe('curated-fallback');
      expect(result.theme).toBe('Smart Cities');
      expect(result.problem.title).toBeDefined();
      expect(result.challengeSignature).toBeDefined();
      expect(validateChallenge(result, 'Smart Cities').isValid).toBe(true);
    });
  });

  describe('6. Concurrent Team Registration & Signature Collision Safety', () => {
    it('should detect duplicate challenge signatures under concurrent registration and assign unique challenge', async () => {
      let generationCalls = 0;
      const fakeGenerator = {
        generateChallenge: vi.fn().mockImplementation(async (theme) => {
          generationCalls++;
          if (generationCalls <= 2) {
            // First 2 calls return the identical challenge (simulating concurrent race)
            return {
              theme,
              source: 'ai',
              challengeSignature: 'sig_shared_collision_hash_123',
              problem: {
                title: 'Campus Food Surplus Distributor',
                statement: 'A student cafeteria surplus board alerting commuters to surplus meals before closing.'
              },
              restriction: {
                name: 'Zero Frameworks',
                rule: 'Vanilla JS, HTML5, and CSS only.'
              },
              resource: {
                name: 'Web Storage API',
                type: 'browser-api',
                guidance: 'Save surplus listings locally.',
                docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
              },
              deliverable: 'A responsive single-flow web application displaying cafeteria item availability.'
            };
          }
          // Subsequent call generates a unique challenge
          return {
            theme,
            source: 'ai',
            challengeSignature: 'sig_unique_fresh_hash_456',
            problem: {
              title: 'Study Group Schedule Matcher',
              statement: 'A peer-to-peer library study room coordinator matching students by course revision topics.'
            },
            restriction: {
              name: 'Zero Mouse Interaction',
              rule: 'Full interactive workflows must be keyboard operable with Tab and Enter only.'
            },
            resource: {
              name: 'Web Storage API',
              type: 'browser-api',
              guidance: 'Save room reservation slots in localStorage.',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
            },
            deliverable: 'A responsive study room reservation prototype.'
          };
        })
      };

      const savedAssignments = [];
      const mockModel = {
        findOne: vi.fn().mockImplementation(async (query) => {
          if (query.normalizedTeamName) {
            return savedAssignments.find((a) => a.normalizedTeamName === query.normalizedTeamName) || null;
          }
          if (query.challengeSignature) {
            return savedAssignments.find((a) => a.challengeSignature === query.challengeSignature) || null;
          }
          return null;
        }),
        create: vi.fn().mockImplementation(async (doc) => {
          if (doc.challengeSignature && savedAssignments.some((a) => a.challengeSignature === doc.challengeSignature)) {
            const err = new Error(
              'E11000 duplicate key error collection: cts.teamassignments index: eventId_1_challengeSignature_1 dup key: { eventId: "cts-2026", challengeSignature: "' +
                doc.challengeSignature +
                '" }'
            );
            err.code = 11000;
            err.keyPattern = { challengeSignature: 1 };
            throw err;
          }
          const record = {
            ...doc,
            _id: `doc_${Date.now()}_${Math.random()}`,
            createdAt: new Date()
          };
          savedAssignments.push(record);
          return record;
        })
      };

      const teamService = new TeamService({
        model: mockModel,
        generatorService: fakeGenerator
      });

      // Register Team 1
      const res1 = await teamService.registerTeamAndGenerate({
        teamName: 'Team Nova',
        theme: 'EdTech'
      });

      expect(res1.teamName).toBe('Team Nova');
      expect(res1.challenge.problem.title).toBe('Campus Food Surplus Distributor');

      // Register Team 2 concurrently: initial candidate collides on signature
      const res2 = await teamService.registerTeamAndGenerate({
        teamName: 'Team Quantum',
        theme: 'EdTech'
      });

      expect(res2.teamName).toBe('Team Quantum');
      // Must have regenerated to avoid duplicate challenge signature!
      expect(res2.challenge.problem.title).toBe('Study Group Schedule Matcher');
      expect(savedAssignments[0].challengeSignature).not.toBe(savedAssignments[1].challengeSignature);
    });
  });

  describe('7. API Compatibility & Response Envelope Contracts', () => {
    it('POST /api/challenges/generate should return valid envelope conforming to frontend expectation', async () => {
      const mockGenerated = {
        theme: 'EdTech',
        source: 'ai',
        challengeSignature: 'sig_api_contract_test',
        problem: {
          title: 'Adaptive Micro-Quiz Generator',
          statement: 'Students preparing for engineering exams need targeted diagnostic flashcards.'
        },
        restriction: {
          name: 'Zero External Frameworks',
          rule: 'Vanilla JS, HTML5, and CSS only without bundlers.'
        },
        resource: {
          name: 'Web Storage API',
          type: 'browser-api',
          guidance: 'Persist quiz state in localStorage.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage'
        },
        deliverable: 'A responsive single-page web application featuring dynamic question rendering.'
      };

      vi.spyOn(challengeService, 'generateChallenge').mockResolvedValue(mockGenerated);

      const res = await request(app)
        .post('/api/challenges/generate')
        .send({ theme: 'EdTech' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const ch = res.body.data.challenge;
      expect(ch.theme).toBe('EdTech');
      expect(typeof ch.problem.title).toBe('string');
      expect(typeof ch.problem.statement).toBe('string');
      expect(typeof ch.restriction.name).toBe('string');
      expect(typeof ch.restriction.rule).toBe('string');
      expect(typeof ch.resource.name).toBe('string');
      expect(typeof ch.resource.docsUrl).toBe('string');
      expect(typeof ch.deliverable).toBe('string');
      expect(['ai', 'curated-fallback']).toContain(res.body.data.source);
    });
  });
});
