import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ChallengeBank from '../models/ChallengeBank.js';
import ResourceCatalog from '../models/ResourceCatalog.js';
import RestrictionCatalog from '../models/RestrictionCatalog.js';
import { APPROVED_THEMES } from '../utils/challengeValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REFERENCE_PATH = path.resolve(__dirname, '../data/referenceChallenges.json');

/**
 * Normalizes text for robust duplicate comparison.
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Computes deterministic SHA-256 fingerprint for a challenge triple.
 */
export function computeFingerprint(domain, problemStatement, restriction) {
  const normDomain = (domain || '').trim().toLowerCase();
  const normProblem = normalizeText(problemStatement);
  const normRestriction = normalizeText(restriction);
  const raw = `${normDomain}|${normProblem}|${normRestriction}`;
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Categorizes a restriction rule text into a standard constraint category.
 */
export function categorizeRestriction(rule) {
  const lower = (rule || '').toLowerCase();
  if (
    lower.includes('privacy') ||
    lower.includes('personal') ||
    lower.includes('login') ||
    lower.includes('signup') ||
    lower.includes('pii') ||
    lower.includes('phone number') ||
    lower.includes('roll number') ||
    lower.includes('anonymize') ||
    lower.includes('cloud') ||
    lower.includes('donor health')
  ) {
    return 'privacy_and_security';
  }
  if (lower.includes('offline') || lower.includes('network') || lower.includes('dead zone') || lower.includes('2g')) {
    return 'network_and_offline';
  }
  if (
    lower.includes('phone screen') ||
    lower.includes('5-inch') ||
    lower.includes('screen') ||
    lower.includes('fps') ||
    lower.includes('laptop') ||
    lower.includes('10-year-old') ||
    lower.includes('mobile-first')
  ) {
    return 'device_and_performance';
  }

  if (
    lower.includes('keyboard') ||
    lower.includes('wcag') ||
    lower.includes('screen reader') ||
    lower.includes('contrast') ||
    lower.includes('plain language') ||
    lower.includes('button') ||
    lower.includes('reading level') ||
    lower.includes('accessibility') ||
    lower.includes('dyslexia') ||
    lower.includes('color-blind') ||
    lower.includes('colour-blind')
  ) {
    return 'accessibility_and_inclusion';
  }
  if (
    lower.includes('budget') ||
    lower.includes('free-tier') ||
    lower.includes('zero budget') ||
    lower.includes('budget must be zero') ||
    lower.includes('zero cost') ||
    lower.includes('paid api')
  ) {
    return 'budget_and_service_limits';
  }
  if (lower.includes('hour') || lower.includes('second') || lower.includes('expiry') || lower.includes('countdown')) {
    return 'time_and_delivery';
  }
  if (lower.includes('api call') || lower.includes('generative ai') || lower.includes('calls allowed') || lower.includes('ai audio')) {
    return 'api_usage_constraints';
  }
  if (lower.includes('server') || lower.includes('database') || lower.includes('collision logic')) {
    return 'technology_and_architecture';
  }
  return 'general';
}

/**
 * Ingests reference challenge records idempotently into ChallengeBank, ResourceCatalog, and RestrictionCatalog.
 *
 * @param {Object} options
 * @param {Array} [options.records] - In-memory records array. If omitted, reads referenceChallenges.json.
 * @param {boolean} [options.dryRun=false] - If true, evaluates without modifying the database.
 * @returns {Promise<Object>} Ingestion report.
 */
export async function ingestReferenceChallenges(options = {}) {
  const { dryRun = false } = options;

  let records = options.records;
  if (!records) {
    if (!fs.existsSync(DEFAULT_REFERENCE_PATH)) {
      throw new Error(`Reference challenges dataset not found at ${DEFAULT_REFERENCE_PATH}`);
    }
    const raw = fs.readFileSync(DEFAULT_REFERENCE_PATH, 'utf-8');
    records = JSON.parse(raw);
  }

  if (!Array.isArray(records)) {
    throw new Error('Reference records must be an array.');
  }

  const report = {
    totalInspected: records.length,
    importedCount: 0,
    duplicatesDetected: 0,
    skippedCount: 0,
    errors: [],
    domains: {},
    sourceTraceability: {},
    candidateResourcesExtracted: 0,
    restrictionsExtracted: 0,
    dryRun
  };

  const batchSeenFingerprints = new Set();

  for (let idx = 0; idx < records.length; idx++) {
    const rec = records[idx];
    const recIndex = idx + 1;

    // 1. Validate fields
    if (!rec.domain || !APPROVED_THEMES.includes(rec.domain.trim())) {
      report.errors.push(`Record #${recIndex}: Invalid or missing domain '${rec.domain}'.`);
      report.skippedCount++;
      continue;
    }
    if (!rec.problemStatement || typeof rec.problemStatement !== 'string' || rec.problemStatement.trim().length < 10) {
      report.errors.push(`Record #${recIndex}: problemStatement must be a string with >= 10 chars.`);
      report.skippedCount++;
      continue;
    }
    if (!rec.restriction || typeof rec.restriction !== 'string' || rec.restriction.trim().length < 5) {
      report.errors.push(`Record #${recIndex}: restriction must be a string with >= 5 chars.`);
      report.skippedCount++;
      continue;
    }
    if (!rec.resource || typeof rec.resource !== 'string' || rec.resource.trim().length < 5) {
      report.errors.push(`Record #${recIndex}: resource must be a string with >= 5 chars.`);
      report.skippedCount++;
      continue;
    }
    if (!rec.sourceFile || !rec.sourcePage) {
      report.errors.push(`Record #${recIndex}: Missing sourceFile or sourcePage provenance.`);
      report.skippedCount++;
      continue;
    }

    const domain = rec.domain.trim();
    const problem = rec.problemStatement.trim();
    const restriction = rec.restriction.trim();
    const resource = rec.resource.trim();
    const title = (rec.title || problem.split('.')[0]).trim().slice(0, 80);

    const fp = rec.fingerprint || computeFingerprint(domain, problem, restriction);

    // 2. Intra-batch duplicate check
    if (batchSeenFingerprints.has(fp)) {
      report.duplicatesDetected++;
      continue;
    }
    batchSeenFingerprints.add(fp);

    // Track domain & source stats
    report.domains[domain] = (report.domains[domain] || 0) + 1;
    const sourceKey = `${rec.sourceFile} (p. ${rec.sourcePage})`;
    report.sourceTraceability[sourceKey] = (report.sourceTraceability[sourceKey] || 0) + 1;

    if (!dryRun) {
      // 3. Upsert ChallengeBank
      const existingBank = await ChallengeBank.findOne({ fingerprint: fp });
      if (existingBank) {
        report.duplicatesDetected++;
      } else {
        await ChallengeBank.create({
          title,
          problemStatement: problem,
          restriction,
          deliverable: rec.deliverable || null,
          resourceTag: rec.resourceTag || null,
          resourceText: resource,
          domain,
          subdomain: rec.subdomain || null,
          difficulty: rec.difficulty || 'intermediate',
          skills: rec.skills || [],
          estimatedBuildTime: rec.estimatedBuildTime || '3-6 hours',
          sourceType: 'pdf_benchmark',
          sourceFile: rec.sourceFile,
          sourcePage: rec.sourcePage,
          sourceUrl: rec.sourceUrl || null,
          approvalStatus: 'approved',
          qualityScore: rec.qualityScore !== undefined ? rec.qualityScore : 1.0,
          fingerprint: fp
        });
        report.importedCount++;
      }

      // 4. Candidate Resource Entry in ResourceCatalog (candidate only, pending verification)
      const resName = resource.split('(')[0].replace(/^A\s+|^An\s+/, '').trim().slice(0, 60);
      const existingResource = await ResourceCatalog.findOne({ name: resName });
      if (!existingResource) {
        await ResourceCatalog.create({
          name: resName,
          description: resource,
          domains: [domain],
          resourceType: determineInitialResourceType(resource, rec.resourceTag),
          sourceProvenance: 'pdf_import',
          verificationStatus: 'candidate', // ALWAYS candidate until live verification!
          pricingStatus: 'unknown',
          license: 'unknown',
          timesUsed: 0
        });
        report.candidateResourcesExtracted++;
      } else if (!existingResource.domains.includes(domain)) {
        existingResource.domains.push(domain);
        await existingResource.save();
      }

      // 5. Restriction Entry in RestrictionCatalog
      const restrictionCategory = categorizeRestriction(restriction);
      const restFp = crypto.createHash('sha256').update(normalizeText(restriction), 'utf8').digest('hex');
      const existingRest = await RestrictionCatalog.findOne({ fingerprint: restFp });
      if (!existingRest) {
        await RestrictionCatalog.create({
          name: restriction.split(';')[0].slice(0, 60),
          rule: restriction,
          category: restrictionCategory,
          applicableDomains: [domain],
          fingerprint: restFp,
          timesUsed: 0
        });
        report.restrictionsExtracted++;
      } else if (!existingRest.applicableDomains.includes(domain)) {
        existingRest.applicableDomains.push(domain);
        await existingRest.save();
      }
    } else {
      report.importedCount++;
    }
  }

  return report;
}

function determineInitialResourceType(text, resourceTag) {
  if (resourceTag) {
    const tag = resourceTag.toUpperCase().trim();
    if (tag === 'PUBLIC-API') return 'public-api';
    if (tag === 'PUBLIC-DATA') return 'local-dataset';
    if (tag === 'CURATED-TEXT') return 'documentation';
  }
  const lower = (text || '').toLowerCase();
  if (lower.includes('api')) return 'public-api';
  if (lower.includes('browser') || lower.includes('speech api') || lower.includes('audio api') || lower.includes('detector api')) return 'browser-api';
  if (lower.includes('dataset') || lower.includes('csv') || lower.includes('json') || lower.includes('question bank') || lower.includes('records')) return 'local-dataset';
  if (lower.includes('library') || lower.includes('leaflet') || lower.includes('chart.js') || lower.includes('axe') || lower.includes('radix')) return 'open-source-library';
  return 'other';
}

export default {
  ingestReferenceChallenges,
  computeFingerprint,
  categorizeRestriction,
  normalizeText
};
