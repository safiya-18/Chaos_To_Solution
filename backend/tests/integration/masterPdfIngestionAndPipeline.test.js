import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  ingestReferenceChallenges,
  computeFingerprint,
  normalizeText
} from '../../src/services/ingestionService.js';
import { getGroundingContext } from '../../src/services/groundingService.js';
import { CuratedAuthorityProvider } from '../../src/services/resourceDiscovery.js';
import { verifyResource } from '../../src/services/resourceVerifier.js';
import { evaluateNovelty } from '../../src/services/noveltyService.js';
import { calculateDiversityScore } from '../../src/services/diversityService.js';
import { generateChallengeWithFallback } from '../../src/services/challengeService.js';
import ChallengeBank from '../../src/models/ChallengeBank.js';
import ResourceCatalog from '../../src/models/ResourceCatalog.js';
import RestrictionCatalog from '../../src/models/RestrictionCatalog.js';
import TeamAssignment from '../../src/models/TeamAssignment.js';
import { APPROVED_THEMES } from '../../src/utils/challengeValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/cts_master_pdf_regression_test';

describe('CTS Master Challenge PDF Ingestion, Pipeline Integration & Hard Regression Suite', () => {
  let isDbAvailable = false;
  let referenceDataset = [];

  beforeAll(async () => {
    const refPath = path.resolve(__dirname, '../../src/data/referenceChallenges.json');
    referenceDataset = JSON.parse(fs.readFileSync(refPath, 'utf-8'));

    try {
      await mongoose.connect(TEST_MONGO_URI, {
        serverSelectionTimeoutMS: 2000
      });
      isDbAvailable = true;
    } catch {
      console.warn('[Master PDF Test Suite] Local MongoDB not available, falling back to in-memory evaluation.');
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (isDbAvailable && mongoose.connection.readyState === 1) {
      await ChallengeBank.deleteMany({});
      await ResourceCatalog.deleteMany({});
      await RestrictionCatalog.deleteMany({});
      await TeamAssignment.deleteMany({});
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (isDbAvailable && mongoose.connection.readyState === 1) {
      await ChallengeBank.deleteMany({});
      await ResourceCatalog.deleteMany({});
      await RestrictionCatalog.deleteMany({});
      await TeamAssignment.deleteMany({});
    }
  });

  // =========================================================================
  // Section A: Master PDF Ingestion & Dataset Audit
  // =========================================================================
  describe('A. Master PDF Ingestion & Dataset Audit', () => {
    const expectedMasterIds = [
      'HT-01', 'HT-02', 'HT-03', 'HT-04', 'HT-05', 'HT-06', 'HT-07', 'HT-08', 'HT-09', 'HT-10',
      'EC-01', 'EC-02', 'EC-03', 'EC-04', 'EC-05', 'EC-06', 'EC-07', 'EC-08', 'EC-09', 'EC-10',
      'BONUS-01'
    ];

    it('should contain all 21 expected master challenge identifiers in the dataset', () => {
      const ids = referenceDataset.map((r) => r.id);
      for (const expectedId of expectedMasterIds) {
        expect(ids).toContain(expectedId);
      }
    });

    it('should preserve exact source file name and page numbers across all 21 master challenges', () => {
      const masterRecords = referenceDataset.filter(
        (r) => r.sourceFile === 'Chaos to Solution — Master Problem Statements (2).pdf'
      );
      expect(masterRecords).toHaveLength(21);

      // Verify page distribution matches the official 11-page PDF
      const pageCounts = {};
      for (const rec of masterRecords) {
        expect(rec.sourcePage).toBeGreaterThanOrEqual(1);
        expect(rec.sourcePage).toBeLessThanOrEqual(11);
        pageCounts[rec.sourcePage] = (pageCounts[rec.sourcePage] || 0) + 1;
      }

      // Pages 1-5: 2 HealthTech per page = 10
      for (let p = 1; p <= 5; p++) {
        expect(pageCounts[p]).toBe(2);
      }
      // Pages 6-10: 2 E-commerce per page = 10
      for (let p = 6; p <= 10; p++) {
        expect(pageCounts[p]).toBe(2);
      }
      // Page 11: 1 Bonus track = 1
      expect(pageCounts[11]).toBe(1);
    });

    it('should preserve deliverables, restrictions, and exact wording for all master challenges', () => {
      const ht01 = referenceDataset.find((r) => r.id === 'HT-01');
      expect(ht01).toBeDefined();
      expect(ht01.title).toBe('BedLock — Emergency Triage & ICU Transfer Bottleneck');
      expect(ht01.deliverable).toBe('Prototype with GET /wards and POST /wards/update.');
      expect(ht01.restriction).toContain('Counts change only through API');
      expect(ht01.resource).toContain('National Hospital Directory CSV');
      expect(ht01.resourceTag).toBe('PUBLIC-DATA');

      const ec02 = referenceDataset.find((r) => r.id === 'EC-02');
      expect(ec02).toBeDefined();
      expect(ec02.title).toBe('FlashCrash — High-Traffic Inventory Overselling');
      expect(ec02.deliverable).toBe('Page with GET /sale and concurrency-safe POST /purchase.');
      expect(ec02.restriction).toContain('atomic');
      expect(ec02.resource).toContain('DummyJSON');
      expect(ec02.resourceTag).toBe('PUBLIC-API');

      const bonus = referenceDataset.find((r) => r.id === 'BONUS-01');
      expect(bonus).toBeDefined();
      expect(bonus.title).toBe('Instant Currency Converter with Trend Analysis');
      expect(bonus.domain).toBe('Open Innovation');
      expect(bonus.deliverable).toContain('Chart.js');
      expect(bonus.restriction).toContain('Pure client-side operation is fully permitted');
    });

    it('should maintain exactly 55 historical records untouched with total dataset count of 76', () => {
      const historicalRecords = referenceDataset.filter(
        (r) => r.sourceFile !== 'Chaos to Solution — Master Problem Statements (2).pdf'
      );
      expect(historicalRecords).toHaveLength(55);
      expect(referenceDataset).toHaveLength(76);

      // Verify zero fingerprint collisions in the complete 76-record dataset
      const fingerprints = new Set(referenceDataset.map((r) => r.fingerprint));
      expect(fingerprints.size).toBe(76);
    });

    it('should idempotently ingest into MongoDB and preserve deliverables and resourceTags', async () => {
      if (!isDbAvailable) return;

      const report1 = await ingestReferenceChallenges({ dryRun: false });
      expect(report1.totalInspected).toBe(76);
      expect(report1.importedCount).toBe(76);
      expect(report1.duplicatesDetected).toBe(0);

      const count = await ChallengeBank.countDocuments();
      expect(count).toBe(76);

      const dbHt01 = await ChallengeBank.findOne({ title: /BedLock/ });
      expect(dbHt01).toBeDefined();
      expect(dbHt01.deliverable).toBe('Prototype with GET /wards and POST /wards/update.');
      expect(dbHt01.resourceTag).toBe('PUBLIC-DATA');

      // Second run must be completely idempotent
      const report2 = await ingestReferenceChallenges({ dryRun: false });
      expect(report2.importedCount).toBe(0);
      expect(report2.duplicatesDetected).toBe(76);
      expect(await ChallengeBank.countDocuments()).toBe(76);
    });
  });

  // =========================================================================
  // Section B: Domain Retrieval & Grounding Tests
  // =========================================================================
  describe('B. Domain Retrieval & Grounding Tests', () => {
    it('should retrieve HealthTech references and online resources', async () => {
      const context = await getGroundingContext('HealthTech');
      expect(context).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "HealthTech"');
      expect(context).toContain('AVAILABLE VERIFIED ONLINE RESOURCES FOR THIS DOMAIN');
      expect(context).toContain('USDA FoodData Central API');
      expect(context).toContain('Open Food Facts Database API');
    });

    it('should discover master PDF HealthTech challenges via targeted source query', async () => {
      const context = await getGroundingContext('HealthTech', { sourceFile: 'Master Problem Statements' });
      expect(context).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "HealthTech"');
      expect(context).toMatch(/BedLock|QueueFatigue|ColdBreach|MissedCare/);
    });

    it('should retrieve E-commerce references and online resources', async () => {
      const context = await getGroundingContext('E-commerce');
      expect(context).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "E-commerce"');
      expect(context).toContain('AVAILABLE VERIFIED ONLINE RESOURCES FOR THIS DOMAIN');
      expect(context).toMatch(/CartShock|FlashCrash|GreenWashing|CrossSellFail/);
      expect(context).toMatch(/Frankfurter Currency API|DummyJSON E-Commerce/);
    });

    it('should categorize and retrieve the bonus currency converter challenge under Open Innovation', async () => {
      const context = await getGroundingContext('Open Innovation', { sourceFile: 'Master Problem Statements' });
      expect(context).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "Open Innovation"');
      expect(context).toContain('Instant Currency Converter with Trend Analysis');
    });

    it('should continue to retrieve existing domains correctly', async () => {
      const edTech = await getGroundingContext('EdTech');
      expect(edTech).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "EdTech"');
      expect(edTech).toContain('AVAILABLE VERIFIED ONLINE RESOURCES FOR THIS DOMAIN');

      const accessibility = await getGroundingContext('Accessibility');
      expect(accessibility).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "Accessibility"');

      const smartCities = await getGroundingContext('Smart Cities');
      expect(smartCities).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "Smart Cities"');

      const finTech = await getGroundingContext('FinTech');
      expect(finTech).toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "FinTech"');
    });

    it('should gracefully handle domains with no benchmarks without crashing or leaking cross-domain records', async () => {
      const sustainContext = await getGroundingContext('Sustainability');
      expect(sustainContext).toBeDefined();
      expect(sustainContext).not.toContain('APPROVED REFERENCE CHALLENGE BENCHMARKS');
      // Must not accidentally substitute another domain's benchmarks
      expect(sustainContext).not.toContain('EdTech');
      expect(sustainContext).not.toContain('HealthTech');
    });
  });

  // =========================================================================
  // Section C: Novelty & Semantic Deduplication Tests
  // =========================================================================
  describe('C. Novelty & Semantic Deduplication Tests', () => {
    it('should reject exact duplicate challenge candidates', async () => {
      const ref = referenceDataset[0];
      const evaluation = await evaluateNovelty(
        {
          domain: ref.domain,
          problemStatement: ref.problemStatement,
          restriction: ref.restriction,
          resource: ref.resource
        },
        { comparisonPool: referenceDataset }
      );

      expect(evaluation.decision).toBe('REJECT');
      expect(evaluation.isExactDuplicate).toBe(true);
    });

    it('should reject semantic duplicate challenges with disguised titles', async () => {
      // Disguised version of EC-02 FlashCrash
      const semanticDuplicate = {
        domain: 'E-commerce',
        problem: {
          title: 'High Volume Rapid Flash Purchase Guard',
          statement: 'Flash sales crash or oversell under heavy concurrent traffic. Build a flash sale system where stock count lives on a backend server to prevent race conditions.'
        },
        restriction: {
          rule: 'Stock decrementing must be atomic so inventory never drops below zero. One unit per user ID enforced server-side.'
        },
        resource: {
          name: 'DummyJSON products API for stock levels and promotional pricing.'
        }
      };

      const evaluation = await evaluateNovelty(semanticDuplicate, { comparisonPool: referenceDataset });
      expect(['REJECT', 'REGENERATE']).toContain(evaluation.decision);
      expect(evaluation.similarityScores.problemSimilarity).toBeGreaterThanOrEqual(0.7);
    });

    it('should accept genuinely novel challenges even when using a shared common resource (e.g. Frankfurter API)', async () => {
      const distinctChallengeUsingFrankfurter = {
        domain: 'E-commerce',
        problem: {
          title: 'Expatriate Remittance Purchasing Power Parity Indexer',
          statement: 'Remote workers struggle to compare purchasing power across global employment hubs. Build a cost-of-living salary indexer calculating real purchasing power.'
        },
        restriction: {
          rule: 'Salary indexation must run entirely in local client memory using cached market baskets.'
        },
        resource: {
          name: 'Frankfurter currency API for latest and historical exchange rates.'
        }
      };

      const evaluation = await evaluateNovelty(distinctChallengeUsingFrankfurter, { comparisonPool: referenceDataset });
      expect(evaluation.decision).toBe('ACCEPT');
      expect(evaluation.similarityScores.overallSimilarity).toBeLessThan(0.65);
    });

    it('should accept genuinely novel challenges even with a shared generic restriction', async () => {
      const distinctChallengeWithCommonRestriction = {
        domain: 'Open Innovation',
        problem: {
          title: 'Autonomous Drone Flight Log Telemetry Validator',
          statement: 'Drone operators fail to catch sensor drifts during agricultural crop inspection passes. Build a flight log validator comparing GPS altimeter readings.'
        },
        restriction: {
          rule: 'Must load and parse errors entirely offline in the browser; no cloud API calls after initial load.'
        },
        resource: {
          name: 'Agricultural flight telemetry CSV repository'
        }
      };

      const evaluation = await evaluateNovelty(distinctChallengeWithCommonRestriction, { comparisonPool: referenceDataset });
      expect(evaluation.decision).toBe('ACCEPT');
      expect(evaluation.similarityScores.problemSimilarity).toBeLessThan(0.7);
    });

    it('should compute deterministic fingerprints for duplicate detection', () => {
      const fp1 = computeFingerprint('E-commerce', 'Flash sales crash under heavy traffic.', 'Atomic stock decrement.');
      const fp2 = computeFingerprint('E-commerce', 'Flash sales crash under heavy traffic.', 'Atomic stock decrement.');
      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // =========================================================================
  // Section D: Resource Verification, Safety & SSRF Tests
  // =========================================================================
  describe('D. Resource Verification, Safety & SSRF Tests', () => {
    it('should verify built-in browser APIs safely without network dispatch', async () => {
      const browserApi = {
        name: 'Web Speech API',
        resourceType: 'browser-api',
        canonicalUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
      };

      const report = await verifyResource(browserApi);
      expect(report.verificationStatus).toBe('verified');
      expect(report.verificationEvidence.notes).toContain('Browser built-in Web API');
    });

    it('should mark unverified PDF candidate resources strictly as candidate without equating HTTP 200 with verified', async () => {
      const candidateResource = {
        name: 'National Hospital Directory CSV',
        resourceType: 'public-data',
        canonicalUrl: 'https://data.gov.in/dataset/national-hospital-directory'
      };

      // Mock safe fetch returning generic HTML 200 without API schema
      const report = await verifyResource(candidateResource, {
        mockFetcher: async () => ({
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          body: '<html><body>Welcome to Data.gov.in</body></html>'
        })
      });

      // A generic homepage or portal with HTTP 200 must NOT be marked verified automatically!
      expect(['candidate', 'needs_manual_review']).toContain(report.verificationStatus);
    });

    it('should block SSRF attempts targeting private, loopback, or metadata addresses', async () => {
      const maliciousResource = {
        name: 'Internal Metadata Leak',
        canonicalUrl: 'http://169.254.169.254/latest/meta-data/'
      };

      const report = await verifyResource(maliciousResource);
      expect(report.verificationStatus).toBe('inaccessible');
      expect(report.verificationEvidence.notes).toMatch(/SSRF|Blocked|private|restricted|Loopback/i);
    });
  });

  // =========================================================================
  // Section E: Pipeline Cascade, Fallback & Atomicity Tests
  // =========================================================================
  describe('E. Pipeline Cascade, Fallback & Atomicity Tests', () => {
    it('should execute full generation pipeline for E-commerce domain with mocked AI provider', async () => {
      const mockGroq = {
        generate: async (theme, history, options) => {
          expect(theme).toBe('E-commerce');
          return {
            theme: 'E-commerce',
            problem: {
              title: 'Dynamic Cross-Border Currency Margin Calculator',
              statement: 'Global shoppers abandon checkout when unpredictable payment processing surcharges and FX fees are revealed at payment.'
            },
            restriction: {
              name: 'Server-Side Calculation Rule',
              rule: 'All FX margin calculations and payment surcharges must execute server-side using server-fetched rates.'
            },
            resource: {
              name: 'Frankfurter Currency API',
              docsUrl: 'https://api.frankfurter.dev/v1/',
              type: 'public-api',
              guidance: 'Use Frankfurter time-series exchange rates for transparent FX calculation.'
            },
            deliverable: 'Checkout preview component with dynamic foreign exchange cost breakdown.'
          };
        }
      };

      const { ChallengeService } = await import('../../src/services/challengeService.js');
      const service = new ChallengeService({
        groqService: mockGroq,
        hasGroqKey: true,
        hasGeminiKey: false
      });

      const result = await service.generateChallenge('E-commerce');

      expect(result.source).toBe('ai');
      expect(result.problem.title).toBe('Dynamic Cross-Border Currency Margin Calculator');
      expect(result.theme).toBe('E-commerce');
      expect(result.diversityScore).toBeGreaterThanOrEqual(0.7);
    });

    it('should safely fall back to curated fallback when AI providers fail for HealthTech', async () => {
      const failingGroq = {
        generateChallenge: async () => {
          throw new Error('Groq rate limited (429)');
        }
      };
      const failingGemini = {
        generateChallenge: async () => {
          throw new Error('Gemini quota exceeded (429)');
        }
      };

      const { ChallengeService } = await import('../../src/services/challengeService.js');
      const service = new ChallengeService({
        groqService: failingGroq,
        geminiService: failingGemini,
        hasGroqKey: true,
        hasGeminiKey: true
      });

      const result = await service.generateChallenge('HealthTech');

      expect(result.source).toBe('curated-fallback');
      expect(result.theme).toBe('HealthTech');
      expect(result.problem.title).toBeDefined();
      expect(result.restriction.rule).toBeDefined();
      expect(result.diversityScore).toBeDefined();
    });

    it('should not mutate event timers, participant records, or production collections during ingestion', async () => {
      if (!isDbAvailable) return;

      const preAssignmentCount = await TeamAssignment.countDocuments();
      await ingestReferenceChallenges({ dryRun: false });
      const postAssignmentCount = await TeamAssignment.countDocuments();

      expect(postAssignmentCount).toBe(preAssignmentCount);
    });
  });
});
