import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import TeamAssignment from '../../src/models/TeamAssignment.js';
import { TeamService } from '../../src/services/teamService.js';
import {
  scoreCandidate,
  calculateFeasibilityScore,
  validateHardRules,
  RESOURCE_STATUS_POLICIES
} from '../../src/services/diversityService.js';
import { verifyResource, clearVerificationCache } from '../../src/services/resourceVerifier.js';

const LOCAL_TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/cts_audit_test';

describe('Pre-Deployment Audit Remediation: Atomic Uniqueness & Resource-State-Aware Quality Scoring', () => {
  let isMongoLive = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(LOCAL_TEST_MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      isMongoLive = true;
      await TeamAssignment.syncIndexes();
    } catch {
      isMongoLive = false;
      console.warn('[Test] Local MongoDB not available, skipping live database concurrency suite.');
    }
  });

  afterAll(async () => {
    if (isMongoLive) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    clearVerificationCache();
  });

  describe('Issue 1 — Atomic Challenge Uniqueness & Legacy Index Compatibility', () => {
    it('should allow multiple legacy records with missing or null challengeSignature without index conflict', async () => {
      if (!isMongoLive) return;

      const testEventId = `test_legacy_event_${Date.now()}`;

      // Insert legacy record 1: challengeSignature is null
      const legacyDoc1 = await TeamAssignment.create({
        teamName: `Legacy Team Alpha ${Date.now()}`,
        theme: 'EdTech',
        challenge: {
          problem: { title: 'Legacy Prob 1', statement: 'Legacy Statement 1' },
          restriction: { name: 'Legacy Rest 1', rule: 'Legacy Rule 1' },
          resource: {
            name: 'Web Storage API',
            type: 'browser-api',
            guidance: 'Save state',
            docsUrl: 'https://developer.mozilla.org'
          },
          deliverable: 'A legacy prototype'
        },
        challengeSource: 'curated-fallback',
        challengeId: `cts-leg-${Date.now()}-1`,
        challengeSignature: null,
        eventId: testEventId
      });

      // Insert legacy record 2: challengeSignature is null
      const legacyDoc2 = await TeamAssignment.create({
        teamName: `Legacy Team Beta ${Date.now()}`,
        theme: 'FinTech',
        challenge: {
          problem: { title: 'Legacy Prob 2', statement: 'Legacy Statement 2' },
          restriction: { name: 'Legacy Rest 2', rule: 'Legacy Rule 2' },
          resource: {
            name: 'Web Storage API',
            type: 'browser-api',
            guidance: 'Save state',
            docsUrl: 'https://developer.mozilla.org'
          },
          deliverable: 'A legacy prototype 2'
        },
        challengeSource: 'curated-fallback',
        challengeId: `cts-leg-${Date.now()}-2`,
        challengeSignature: null,
        eventId: testEventId
      });

      expect(legacyDoc1._id).toBeDefined();
      expect(legacyDoc2._id).toBeDefined();

      // Clean up test documents
      await TeamAssignment.deleteMany({ eventId: testEventId });
    });

    it('should atomically enforce uniqueness on challengeSignature and trigger regeneration on race condition', async () => {
      if (!isMongoLive) return;

      const testEventId = `test_race_event_${Date.now()}`;
      const sharedSignature = `sig_shared_race_${Date.now()}`;
      let genCount = 0;

      const fakeGenerator = {
        generateChallenge: async (theme) => {
          genCount++;
          if (genCount <= 2) {
            // First 2 calls return the identical challenge signature (simulating a concurrent race condition)
            return {
              theme,
              source: 'ai',
              challengeSignature: sharedSignature,
              problem: {
                title: 'Colliding Energy Optimizer',
                statement: 'A smart microgrid optimizer for residential solar panel distribution.'
              },
              restriction: {
                name: 'Zero Frameworks',
                rule: 'Vanilla JavaScript only.'
              },
              resource: {
                name: 'Web Storage API',
                type: 'browser-api',
                guidance: 'Store energy statistics in browser localStorage.',
                docsUrl: 'https://developer.mozilla.org'
              },
              deliverable: 'A functional single-page solar dashboard prototype.'
            };
          }

          // Third call (regeneration) returns a fresh, unique signature
          return {
            theme,
            source: 'ai',
            challengeSignature: `sig_fresh_unique_${Date.now()}_${Math.random()}`,
            problem: {
              title: 'Novel Smart Irrigation Scheduler',
              statement: 'An automated community garden soil moisture and weather forecasting tool.'
            },
            restriction: {
              name: 'Zero Audio',
              rule: 'Visual progress cues only with no auditory alerts.'
            },
            resource: {
              name: 'Web Storage API',
              type: 'browser-api',
              guidance: 'Store moisture levels in browser localStorage.',
              docsUrl: 'https://developer.mozilla.org'
            },
            deliverable: 'A working moisture scheduling dashboard.'
          };
        }
      };

      const liveTeamService = new TeamService({
        model: TeamAssignment,
        generatorService: fakeGenerator
      });

      // Fire 2 concurrent team registrations with identical initial challenge candidates
      const [reg1, reg2] = await Promise.all([
        liveTeamService.registerTeamAndGenerate({
          teamName: `Concurrent Team A ${Date.now()}`,
          theme: 'Sustainability'
        }),
        liveTeamService.registerTeamAndGenerate({
          teamName: `Concurrent Team B ${Date.now()}`,
          theme: 'Sustainability'
        })
      ]);

      expect(reg1.teamName).toBeDefined();
      expect(reg2.teamName).toBeDefined();

      // One of the teams got the first candidate; the other team encountered the atomic DB duplicate key
      // and regenerated a fresh unique challenge!
      const doc1 = await TeamAssignment.findById(reg1.id);
      const doc2 = await TeamAssignment.findById(reg2.id);

      expect(doc1.challengeSignature).not.toBe(doc2.challengeSignature);
      expect([doc1.challengeSignature, doc2.challengeSignature]).toContain(sharedSignature);

      // Clean up
      await TeamAssignment.deleteMany({ _id: { $in: [doc1._id, doc2._id] } });
    });
  });

  describe('Issue 2 — Resource-State-Aware Quality Scoring & Policies', () => {
    const baseCandidate = {
      theme: 'Sustainability',
      problem: {
        title: 'Municipal Water Quality Tracker',
        statement: 'Citizens need live tracking of tap water purity and filtration schedule alerts.'
      },
      restriction: {
        name: 'Zero Third-Party Bundlers',
        rule: 'Must run directly in standard modern browsers without webpack or vite builds.'
      },
      resource: {
        name: 'Open-Meteo Weather API',
        type: 'public-api',
        guidance: 'Query rainfall and precipitation forecasts to predict runoff contamination.',
        docsUrl: 'https://open-meteo.com/en/docs'
      },
      deliverable: 'A responsive web application displaying municipal water advisory notices.'
    };

    const dummyNovelty = {
      decision: 'ACCEPT',
      similarityScores: {
        problemSimilarity: 0.0,
        restrictionSimilarity: 0.0,
        resourceOverlap: 0.0,
        compositeSimilarity: 0.0
      }
    };

    it('1. verified resource receives 1.0 multiplier and 0.0 feasibility penalty (high score ~0.95+)', () => {
      const candidate = JSON.parse(JSON.stringify(baseCandidate));
      candidate.resource.verificationStatus = 'verified';

      const scored = scoreCandidate(candidate, dummyNovelty);
      expect(scored.eligible).toBe(true);
      expect(scored.breakdown.resourceStatus).toBe('verified');
      expect(scored.breakdown.resourceDiversity).toBe(1.0);
      expect(scored.breakdown.feasibility).toBe(1.0);
      expect(scored.totalScore).toBeGreaterThanOrEqual(0.95);
      expect(scored.resourcePolicy.allowed).toBe(true);
      expect(scored.resourcePolicy.requiresManualReview).toBe(false);
    });

    it('2. verification_pending resource receives 0.75 multiplier and 0.10 feasibility penalty (capped at 0.9350)', () => {
      const candidate = JSON.parse(JSON.stringify(baseCandidate));
      candidate.resource.verificationStatus = 'verification_pending';

      const scored = scoreCandidate(candidate, dummyNovelty);
      expect(scored.eligible).toBe(true);
      expect(scored.breakdown.resourceStatus).toBe('verification_pending');
      expect(scored.breakdown.resourceDiversity).toBe(0.75);
      expect(scored.breakdown.feasibility).toBe(0.90);
      // Explains why Sustainability staging example scored 1.0000 previously, now strictly capped at 0.9350
      expect(scored.totalScore).toBe(0.935);
      expect(scored.resourcePolicy.allowed).toBe(true);
      expect(scored.resourcePolicy.requiresManualReview).toBe(false);
    });

    it('3. candidate resource receives 0.70 multiplier and 0.10 feasibility penalty (capped at ~0.9250)', () => {
      const candidate = JSON.parse(JSON.stringify(baseCandidate));
      candidate.resource.verificationStatus = 'candidate';

      const scored = scoreCandidate(candidate, dummyNovelty);
      expect(scored.eligible).toBe(true);
      expect(scored.breakdown.resourceStatus).toBe('candidate');
      expect(scored.breakdown.resourceDiversity).toBe(0.7);
      expect(scored.breakdown.feasibility).toBe(0.9);
      expect(scored.totalScore).toBe(0.925);
    });

    it('4. needs_manual_review resource receives 0.60 multiplier, 0.20 feasibility penalty, and requiresManualReview flag', () => {
      const candidate = JSON.parse(JSON.stringify(baseCandidate));
      candidate.resource.verificationStatus = 'needs_manual_review';

      const scored = scoreCandidate(candidate, dummyNovelty);
      expect(scored.eligible).toBe(true);
      expect(scored.breakdown.resourceStatus).toBe('needs_manual_review');
      expect(scored.breakdown.resourceDiversity).toBe(0.6);
      expect(scored.breakdown.feasibility).toBe(0.8);
      expect(scored.totalScore).toBe(0.89);
      expect(scored.resourcePolicy.requiresManualReview).toBe(true);
    });

    it('5. inaccessible resource is hard rejected in validateHardRules and receives totalScore 0', () => {
      const candidate = JSON.parse(JSON.stringify(baseCandidate));
      candidate.resource.verificationStatus = 'inaccessible';

      const validation = validateHardRules(candidate);
      expect(validation.passed).toBe(false);
      expect(validation.rejections[0]).toContain('inaccessible or broken');

      const scored = scoreCandidate(candidate, dummyNovelty);
      expect(scored.eligible).toBe(false);
      expect(scored.totalScore).toBe(0);
      expect(scored.hardRejections.length).toBeGreaterThan(0);
    });

    it('6. HTTP 200 without auth proof does not assume free or unauthenticated; keeps unknown pricing & access explicitly unknown', async () => {
      // Mock fetch returning HTTP 200 without any pricing or authentication details
      const customFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () =>
          '<html><head><title>General Data Portal API Documentation</title></head><body><h1>Data Feed</h1><p>Welcome to our data catalog and API documentation endpoint.</p></body></html>'
      });
      const dnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];

      const report = await verifyResource(
        {
          canonicalUrl: 'https://example-data.org/docs',
          name: 'General Data Portal',
          resourceType: 'public-api'
        },
        { customFetch, dnsLookup }
      );

      expect(report.verificationEvidence.httpStatus).toBe(200);
      // Crucial: HTTP 200 alone must NOT assume free or unauthenticated
      expect(report.pricingStatus).toBe('unknown');
      expect(report.accessRequirements).toBe('unknown');
    });
  });
});
