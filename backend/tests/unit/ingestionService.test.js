import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  ingestReferenceChallenges,
  computeFingerprint,
  categorizeRestriction,
  normalizeText
} from '../../src/services/ingestionService.js';
import ChallengeBank from '../../src/models/ChallengeBank.js';
import ResourceCatalog from '../../src/models/ResourceCatalog.js';
import RestrictionCatalog from '../../src/models/RestrictionCatalog.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/cts_phase1_test';

describe('Phase 1: Reference Data Ingestion & Data Foundation Tests', () => {
  let isDbAvailable = false;

  beforeAll(async () => {
    try {
      await mongoose.connect(TEST_MONGO_URI, {
        serverSelectionTimeoutMS: 2000
      });
      isDbAvailable = true;
    } catch {
      console.warn('[Ingestion Test] Local MongoDB not available, falling back to dry-run testing.');
      isDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (isDbAvailable && mongoose.connection.readyState === 1) {
      await ChallengeBank.deleteMany({});
      await ResourceCatalog.deleteMany({});
      await RestrictionCatalog.deleteMany({});
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (isDbAvailable && mongoose.connection.readyState === 1) {
      await ChallengeBank.deleteMany({});
      await ResourceCatalog.deleteMany({});
      await RestrictionCatalog.deleteMany({});
    }
  });

  describe('Fingerprint & Normalization Utility', () => {
    it('should strip special characters and whitespace when normalizing text', () => {
      const raw = '  Students, copy-code (blindly)!  ';
      expect(normalizeText(raw)).toBe('studentscopycodeblindly');
    });

    it('should produce identical SHA-256 fingerprint for semantically identical triples with differing whitespace/casing', () => {
      const fp1 = computeFingerprint(
        'EdTech',
        'Students copy code blindly without understanding.',
        'Must not display raw code.'
      );
      const fp2 = computeFingerprint(
        'edtech ',
        '  Students copy CODE blindly without understanding. ',
        'MUST NOT display raw code.  '
      );
      expect(fp1).toBe(fp2);
    });

    it('should categorize restrictions into proper taxonomy', () => {
      expect(categorizeRestriction('Must work completely offline in basements/dead zones with zero network connectivity.'))
        .toBe('network_and_offline');
      expect(categorizeRestriction('Must run smoothly on a 10-year-old low-end Android phone.'))
        .toBe('device_and_performance');
      expect(categorizeRestriction('Must be 100% operable via keyboard navigation only with zero mouse dependency.'))
        .toBe('accessibility_and_inclusion');
      expect(categorizeRestriction('Must not collect, transmit, or store any personal phone numbers, emails, or student roll numbers.'))
        .toBe('privacy_and_security');
      expect(categorizeRestriction('Only free-tier tools and APIs may be used; the budget is zero.'))
        .toBe('budget_and_service_limits');
      expect(categorizeRestriction('Maximum of 6 AI audio/text evaluation calls allowed per complete practice session.'))
        .toBe('api_usage_constraints');
    });
  });

  describe('Dry-Run Evaluation of Reference Dataset', () => {
    it('should inspect exactly 76 records with zero duplicate fingerprints in default referenceChallenges.json', async () => {
      const report = await ingestReferenceChallenges({ dryRun: true });
      expect(report.totalInspected).toBe(76);
      expect(report.importedCount).toBe(76);
      expect(report.duplicatesDetected).toBe(0);
      expect(report.skippedCount).toBe(0);
      expect(report.errors).toHaveLength(0);

      // Verify domain counts match audited PDF pages
      expect(report.domains['EdTech']).toBe(15);
      expect(report.domains['Open Innovation']).toBe(11);
      expect(report.domains['Smart Cities']).toBe(10);
      expect(report.domains['Accessibility']).toBe(10);
      expect(report.domains['FinTech']).toBe(5);
      expect(report.domains['HealthTech']).toBe(15);
      expect(report.domains['E-commerce']).toBe(10);

      // Verify source traceability for historical and new master PDFs
      expect(report.sourceTraceability['Chaos to Solution - EdTech & Open Innovation Challenges.pdf (p. 1)']).toBe(10);
      expect(report.sourceTraceability['Chaos to Solution - EdTech & Open Innovation Challenges.pdf (p. 2)']).toBe(10);
      expect(report.sourceTraceability['Domain Breakdown (2).pdf (p. 1)']).toBe(5);
      expect(report.sourceTraceability['Domain Breakdown (2).pdf (p. 2)']).toBe(5);
      expect(report.sourceTraceability['Domain Breakdown (2).pdf (p. 3)']).toBe(5);
      expect(report.sourceTraceability['Chaos_to_Solution_Challenge.pdf (p. 1)']).toBe(10);
      expect(report.sourceTraceability['Chaos_to_Solution_Challenge.pdf (p. 2)']).toBe(10);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 1)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 2)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 3)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 4)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 5)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 6)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 7)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 8)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 9)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 10)']).toBe(2);
      expect(report.sourceTraceability['Chaos to Solution — Master Problem Statements (2).pdf (p. 11)']).toBe(1);
    });

    it('should reject invalid or incomplete records during ingestion', async () => {
      const invalidRecords = [
        { domain: 'InvalidDomain', problemStatement: 'Valid length problem statement here', restriction: 'Valid rule', resource: 'Valid resource', sourceFile: 'test.pdf', sourcePage: 1 },
        { domain: 'EdTech', problemStatement: 'Too short', restriction: 'Valid rule', resource: 'Valid resource', sourceFile: 'test.pdf', sourcePage: 1 },
        { domain: 'EdTech', problemStatement: 'Valid problem statement here', restriction: 'r', resource: 'Valid resource', sourceFile: 'test.pdf', sourcePage: 1 },
        { domain: 'EdTech', problemStatement: 'Valid problem statement here', restriction: 'Valid rule', resource: 'r', sourceFile: 'test.pdf', sourcePage: 1 },
        { domain: 'EdTech', problemStatement: 'Valid problem statement here', restriction: 'Valid rule', resource: 'Valid resource' /* missing source */ }
      ];

      const report = await ingestReferenceChallenges({ records: invalidRecords, dryRun: true });
      expect(report.totalInspected).toBe(5);
      expect(report.importedCount).toBe(0);
      expect(report.skippedCount).toBe(5);
      expect(report.errors).toHaveLength(5);
    });
  });

  describe('Database Persistence & Idempotency (when MongoDB is live)', () => {
    it('should persist 76 challenges and mark initial resources strictly as candidate', async () => {
      if (!isDbAvailable) return;

      const report = await ingestReferenceChallenges({ dryRun: false });
      expect(report.totalInspected).toBe(76);
      expect(report.importedCount).toBe(76);
      expect(report.duplicatesDetected).toBe(0);

      const count = await ChallengeBank.countDocuments();
      expect(count).toBe(76);

      // Verify that all extracted resources have verificationStatus: 'candidate'
      const candidates = await ResourceCatalog.find({ sourceProvenance: 'pdf_import', verificationStatus: 'candidate' });
      const verified = await ResourceCatalog.find({ sourceProvenance: 'pdf_import', verificationStatus: 'verified' });
      expect(candidates.length).toBeGreaterThan(0);
      expect(verified.length).toBe(0); // None should be marked verified yet!

      // Verify source traceability preserved in records
      const sample = await ChallengeBank.findOne({ domain: 'EdTech' });
      expect(sample.sourceFile).toBeDefined();
      expect(sample.sourcePage).toBeGreaterThanOrEqual(1);
      expect(sample.approvalStatus).toBe('approved');
      expect(sample.qualityScore).toBe(1.0);

      // Verify deliverable and resourceTag preserved for master PDF entries
      const masterSample = await ChallengeBank.findOne({ domain: 'E-commerce' });
      expect(masterSample).toBeDefined();
      expect(masterSample.deliverable).toBeDefined();
      expect(masterSample.resourceTag).toBeDefined();
    });

    it('should be completely idempotent: second run inserts 0 new challenges and reports 76 duplicates', async () => {
      if (!isDbAvailable) return;

      // First run
      await ingestReferenceChallenges({ dryRun: false });
      expect(await ChallengeBank.countDocuments()).toBe(76);

      // Second run
      const report2 = await ingestReferenceChallenges({ dryRun: false });
      expect(report2.totalInspected).toBe(76);
      expect(report2.importedCount).toBe(0);
      expect(report2.duplicatesDetected).toBe(76);
      expect(await ChallengeBank.countDocuments()).toBe(76);
    });
  });
});
