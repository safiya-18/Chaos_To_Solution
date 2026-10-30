import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import {
  computeTextSimilarity,
  calculateJaccardSimilarity,
  tokenizeWords,
  generateCharNgrams,
  getCombinationKey,
  evaluateNovelty,
  DEFAULT_NOVELTY_THRESHOLDS
} from '../../src/services/noveltyService.js';
import {
  validateHardRules,
  scoreCandidate,
  rankAndSelectBest,
  SCORING_WEIGHTS
} from '../../src/services/diversityService.js';
import { ChallengeService } from '../../src/services/challengeService.js';
import { TeamService } from '../../src/services/teamService.js';

describe('Phase 3: Novelty, Diversity Engine & Semantic Similarity Tests', () => {
  describe('Text Similarity & Paraphrase Detection', () => {
    it('should calculate 1.0 similarity for identical texts with different casing and whitespace', () => {
      const a = 'Students copy code solutions blindly without understanding the underlying logic.';
      const b = '  students COPY code solutions BLINDLY without understanding the underlying logic. ';
      expect(computeTextSimilarity(a, b)).toBe(1.0);
    });

    it('should detect paraphrased near-duplicates with high similarity (> 0.70)', () => {
      const original = 'Students copy code solutions blindly without understanding the underlying logic or runtime pitfalls.';
      const paraphrase = 'Pupils copy software solutions blindly without understanding runtime pitfalls or the underlying logic.';
      const sim = computeTextSimilarity(original, paraphrase);
      expect(sim).toBeGreaterThan(0.65);
    });

    it('should compute low similarity (< 0.35) for completely distinct challenges in the same domain', () => {
      const edtech1 = 'Students copy code solutions blindly without understanding the underlying logic.';
      const edtech2 = 'Blind and low-vision engineering students cannot decipher mathematical formulas or circuit schematics.';
      const sim = computeTextSimilarity(edtech1, edtech2);
      expect(sim).toBeLessThan(0.35);
    });

    it('should generate character n-grams correctly', () => {
      const ngrams = generateCharNgrams('code', 3);
      expect(ngrams).toContain('cod');
      expect(ngrams).toContain('ode');
    });

    it('should tokenize words and exclude short stop-words', () => {
      const tokens = tokenizeWords('A tool for student code analysis in C, Java, and Python');
      expect(tokens).toContain('tool');
      expect(tokens).toContain('student');
      expect(tokens).toContain('code');
      expect(tokens).toContain('analysis');
      expect(tokens).toContain('java');
      expect(tokens).toContain('python');
      expect(tokens).not.toContain('in'); // < 3 chars
    });
  });

  describe('Multi-Layer Novelty Evaluation', () => {
    const mockBenchmarkPool = [
      {
        id: 'bench_001',
        title: 'Students copy code solutions blindly',
        problemStatement: 'Students copy code solutions blindly without understanding the underlying logic, runtime pitfalls, or algorithmic structure.',
        restriction: 'Must not display raw code; explanation must use visual flowcharts, step-by-step traces, or spoken metaphors only.',
        resource: 'A free-tier LLM API key with a prompt template library.',
        domain: 'EdTech'
      },
      {
        id: 'bench_002',
        title: 'First-year compiler syntax errors',
        problemStatement: 'First-year students struggle to debug cryptic compiler syntax errors and runtime exceptions in C, Java, and Python.',
        restriction: 'Must load and parse errors entirely offline in the browser; no cloud API calls after initial load.',
        resource: 'A compiled dataset of 100 common beginner compiler error messages and stack traces.',
        domain: 'EdTech'
      }
    ];

    it('should REJECT an exact duplicate challenge', async () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Students copy code',
          statement: 'Students copy code solutions blindly without understanding the underlying logic, runtime pitfalls, or algorithmic structure.'
        },
        restriction: {
          name: 'Visual explanation',
          rule: 'Must not display raw code; explanation must use visual flowcharts, step-by-step traces, or spoken metaphors only.'
        },
        resource: {
          name: 'A free-tier LLM API key with a prompt template library.',
          type: 'public-api'
        }
      };

      const result = await evaluateNovelty(candidate, { comparisonPool: mockBenchmarkPool });
      expect(result.decision).toBe('REJECT');
      expect(result.isExactDuplicate).toBe(true);
      expect(result.similarityScores.problemSimilarity).toBe(1.0);
    });

    it('should REGENERATE a candidate that paraphrases an existing benchmark above the similarity threshold', async () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Students copy code blindly',
          statement: 'Students copy code solutions without understanding the logic, runtime pitfalls, or algorithmic structure.'
        },
        restriction: {
          name: 'Visual explanation',
          rule: 'Must use visual flowcharts only.'
        },
        resource: {
          name: 'Free LLM API',
          type: 'public-api'
        }
      };

      const result = await evaluateNovelty(candidate, {
        comparisonPool: mockBenchmarkPool,
        thresholds: { PROBLEM_SIMILARITY_MAX: 0.70 }
      });
      expect(result.decision).toBe('REGENERATE');
      expect(result.similarityScores.problemSimilarity).toBeGreaterThanOrEqual(0.70);
      expect(result.similarityScores.problemSimilarity).toBeLessThan(0.85);
    });

    it('should ACCEPT a novel challenge with low similarity scores', async () => {
      const candidate = {
        theme: 'EdTech',
        problem: {
          title: 'Distributed Peer Code Review Rotator',
          statement: 'Undergraduate students submitting group project milestones have unequal code review burdens across teams.'
        },
        restriction: {
          name: 'Strict Anonymity',
          rule: 'Must completely anonymize student names and commit hashes during the review process.'
        },
        resource: {
          name: 'Local IndexedDB Ledger',
          type: 'browser-api'
        }
      };

      const result = await evaluateNovelty(candidate, { comparisonPool: mockBenchmarkPool });
      expect(result.decision).toBe('ACCEPT');
      expect(result.similarityScores.problemSimilarity).toBeLessThan(DEFAULT_NOVELTY_THRESHOLDS.PROBLEM_SIMILARITY_MAX);
      expect(result.isExactDuplicate).toBe(false);
    });

    it('should penalize repeated domain + restrictionCategory + resource combinations', () => {
      const key1 = getCombinationKey('Smart Cities', 'Must work offline in dead zones.', 'OpenStreetMap');
      const key2 = getCombinationKey('Smart Cities', 'Must operate completely offline without internet.', 'OpenStreetMap');
      expect(key1).toBe(key2);
    });
  });

  describe('Hard Rejection Rules & Candidate Diversity Scoring', () => {
    it('should hard reject candidates with broken/inaccessible resources', () => {
      const candidate = {
        theme: 'Smart Cities',
        problem: {
          title: 'Pothole Detection Map',
          statement: 'Citizens cannot report potholes and broken streetlights effectively.'
        },
        restriction: {
          name: 'No Login',
          rule: 'No login or signup required.'
        },
        resource: {
          name: 'Broken Map Tiles',
          type: 'public-api',
          verificationStatus: 'inaccessible',
          guidance: 'Use map tiles to render coordinates on a canvas.',
          docsUrl: 'https://broken-example.com/api'
        },
        deliverable: 'A live web map application.'
      };

      const hardCheck = validateHardRules(candidate);
      expect(hardCheck.passed).toBe(false);
      expect(hardCheck.rejections[0]).toContain('inaccessible or broken');
    });

    it('should hard reject candidates with contradictory constraints (e.g. offline rule with cloud API)', () => {
      const candidate = {
        theme: 'Smart Cities',
        problem: {
          title: 'Offline Traffic Navigator',
          statement: 'Commuters need live traffic routing in basement parking garages.'
        },
        restriction: {
          name: 'Zero Network',
          rule: 'Must work completely offline with zero network connectivity.'
        },
        resource: {
          name: 'Live Google Traffic REST Endpoint',
          type: 'public-api',
          docsUrl: 'https://example.com/api'
        },
        deliverable: 'A client-side navigation tool.'
      };

      const hardCheck = validateHardRules(candidate);
      expect(hardCheck.passed).toBe(false);
      expect(hardCheck.rejections.some((r) => r.includes('Contradictory constraints'))).toBe(true);
    });

    it('should score eligible candidates using the exact 5 weighted factors', () => {
      const candidate = {
        theme: 'Accessibility',
        problem: {
          title: 'Semantic Screen Reader for STEM Math',
          statement: 'Visually impaired students struggle to read complex mathematical equations on online portals.'
        },
        restriction: {
          name: 'Keyboard Navigation Only',
          rule: 'Must be 100% operable via keyboard navigation only with zero mouse dependency.'
        },
        resource: {
          name: 'Browser Web Speech API',
          type: 'browser-api',
          guidance: 'Use window.speechSynthesis to dictate expressions step-by-step.',
          docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
        },
        deliverable: 'A responsive single-page web application.'
      };

      const noveltyResult = {
        similarityScores: {
          problemSimilarity: 0.15,
          restrictionSimilarity: 0.20,
          resourceOverlap: 0.10
        }
      };

      const scored = scoreCandidate(candidate, noveltyResult, {
        recentResourceCounts: {},
        recentRestrictionCategories: {}
      });

      expect(scored.eligible).toBe(true);
      expect(scored.totalScore).toBeGreaterThan(0.75);
      expect(scored.breakdown.novelty).toBe(0.85); // 1.0 - 0.15
    });

    it('should rank multiple candidates and select the highest scoring eligible candidate', () => {
      const candidateA = {
        eligible: true,
        totalScore: 0.65,
        candidate: { problem: { title: 'Candidate A' } }
      };
      const candidateB = {
        eligible: true,
        totalScore: 0.88,
        candidate: { problem: { title: 'Candidate B' } }
      };
      const candidateC = {
        eligible: false,
        totalScore: 0,
        candidate: { problem: { title: 'Candidate C' } }
      };

      const best = rankAndSelectBest([candidateA, candidateB, candidateC]);
      expect(best.candidate.problem.title).toBe('Candidate B');
      expect(best.totalScore).toBe(0.88);
    });
  });

  describe('Multi-Candidate Challenge Service Integration & Concurrency Safety', () => {
    it('should retry generation when initial candidate is borderline duplicate, accepting second novel candidate', async () => {
      let callCount = 0;
      const mockGroq = {
        generate: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            // First attempt: duplicate of benchmark 001
            return {
              theme: 'EdTech',
              problem: {
                title: 'Students copy code',
                statement: 'Students copy code solutions blindly without understanding the underlying logic, runtime pitfalls, or algorithmic structure.'
              },
              restriction: {
                name: 'Visual Flowchart',
                rule: 'Must not display raw code; explanation must use visual flowcharts, step-by-step traces, or spoken metaphors only.'
              },
              resource: {
                name: 'LLM Key',
                type: 'public-api',
                guidance: 'Use LLM prompt templates',
                docsUrl: 'https://example.com/docs'
              },
              deliverable: 'A responsive web application prototype.'
            };
          }
          // Second attempt: fresh novel problem
          return {
            theme: 'EdTech',
            problem: {
              title: 'Interactive Spaced Repetition Flashcard Scheduler',
              statement: 'Freshmen cramming for semester exams forget key engineering concepts within two days.'
            },
            restriction: {
              name: 'Strict 1MB Bundle',
              rule: 'Must be built as a single responsive web page with total bundle size strictly under 1 MB.'
            },
            resource: {
              name: 'Browser Web Speech API',
              type: 'browser-api',
              guidance: 'Use speech synthesis',
              docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
            },
            deliverable: 'A single responsive web application.'
          };
        })
      };

      const service = new ChallengeService({
        groqService: mockGroq,
        hasGroqKey: true,
        provider: 'groq'
      });

      const res = await service.generateChallenge('EdTech');
      expect(res.source).toBe('ai');
      expect(res.problem.title).toBe('Interactive Spaced Repetition Flashcard Scheduler');
      expect(mockGroq.generate).toHaveBeenCalledTimes(2);
      expect(res.noveltyScores).toBeDefined();
    });

    it('should resolve collision in TeamService when concurrent request matches existing challenge signature', async () => {
      let createAttempts = 0;
      const mockModel = {
        findOne: vi.fn().mockResolvedValue(null), // teamName check passes
        create: vi.fn().mockImplementation(async (doc) => {
          createAttempts++;
          if (createAttempts === 1) {
            const err = new Error(
              'E11000 duplicate key error collection: cts.teamassignments index: eventId_1_challengeSignature_1 dup key: { eventId: "cts-2026", challengeSignature: "sig_duplicate" }'
            );
            err.code = 11000;
            err.keyPattern = { challengeSignature: 1 };
            throw err;
          }
          return { _id: 'new_assignment_2', createdAt: new Date(), ...doc };
        })
      };

      let genCount = 0;
      const mockGenerator = {
        generateChallenge: vi.fn().mockImplementation(async () => {
          genCount++;
          return {
            theme: 'FinTech',
            problem: {
              title: genCount === 1 ? 'Duplicate Problem' : 'Regenerated Unique Problem',
              statement: genCount === 1 ? 'Statement 1' : 'A unique fresh problem statement.'
            },
            restriction: {
              name: 'Rule',
              rule: 'Must support vernacular voice input.'
            },
            resource: {
              name: 'Public API',
              type: 'public-api',
              guidance: 'Use schemes API',
              docsUrl: 'https://example.com/api'
            },
            deliverable: 'A web app prototype.',
            source: 'ai',
            challengeSignature: genCount === 1 ? 'sig_duplicate' : 'sig_unique_fresh'
          };
        })
      };

      const teamService = new TeamService({
        model: mockModel,
        generatorService: mockGenerator
      });

      const assignment = await teamService.registerTeamAndGenerate({
        teamName: 'AlphaTeam',
        theme: 'FinTech'
      });

      expect(mockGenerator.generateChallenge).toHaveBeenCalledTimes(2);
      expect(assignment.challenge.problem.title).toBe('Regenerated Unique Problem');
      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeSignature: 'sig_unique_fresh'
        })
      );
    });
  });
});
