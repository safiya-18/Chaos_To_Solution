import mongoose from 'mongoose';
import { computeFingerprint, normalizeText, categorizeRestriction } from './ingestionService.js';
import ChallengeBank from '../models/ChallengeBank.js';
import TeamAssignment from '../models/TeamAssignment.js';
import referenceChallenges from '../data/referenceChallenges.json' with { type: 'json' };
import officialCuratedChallenges from '../data/officialCuratedChallenges.json' with { type: 'json' };

/**
 * Configurable thresholds for novelty detection.
 * Can be tuned or overridden via configuration/environment.
 */
export const DEFAULT_NOVELTY_THRESHOLDS = Object.freeze({
  EXACT_DUPLICATE_THRESHOLD: 1.0,
  PROBLEM_SIMILARITY_MAX: 0.70,      // Max allowed problem similarity before reject/regenerate
  RESTRICTION_SIMILARITY_MAX: 0.75,  // Max allowed restriction similarity
  RESOURCE_OVERLAP_MAX: 0.80,        // Max allowed resource overlap
  OVERALL_SIMILARITY_MAX: 0.65,      // Composite weighted similarity threshold
  COMBINATION_REPEAT_PENALTY: 0.30   // Score deduction when domain + restrictionCat + resource repeats
});

/**
 * Splits text into normalized word tokens.
 */
export function tokenizeWords(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2); // Exclude 1-2 char stop tokens
}

/**
 * Generates character n-grams from text to capture morphological & phrasing variations.
 */
export function generateCharNgrams(text, n = 3) {
  const norm = normalizeText(text);
  if (norm.length < n) return [norm];
  const ngrams = new Set();
  for (let i = 0; i <= norm.length - n; i++) {
    ngrams.add(norm.slice(i, i + n));
  }
  return [...ngrams];
}

/**
 * Computes Jaccard similarity between two arrays/sets: |A ∩ B| / |A ∪ B|.
 */
export function calculateJaccardSimilarity(tokensA, tokensB) {
  if (!tokensA || !tokensB || tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...setA, ...setB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Computes a hybrid semantic similarity score combining word token Jaccard and char 3-gram Jaccard.
 */
export function computeTextSimilarity(textA, textB) {
  if (!textA || !textB) return 0;
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (normA === normB) return 1.0;

  const wordsA = tokenizeWords(textA);
  const wordsB = tokenizeWords(textB);
  const wordJaccard = calculateJaccardSimilarity(wordsA, wordsB);

  const charNgramsA = generateCharNgrams(textA, 3);
  const charNgramsB = generateCharNgrams(textB, 3);
  const charJaccard = calculateJaccardSimilarity(charNgramsA, charNgramsB);

  // 60% word tokens + 40% char 3-grams provides robust paraphrase detection
  return 0.6 * wordJaccard + 0.4 * charJaccard;
}

/**
 * Generates combination key for domain + restriction category + primary resource.
 */
export function getCombinationKey(domain, restrictionRule, resourceName) {
  const cat = categorizeRestriction(restrictionRule);
  const resKey = normalizeText(resourceName).slice(0, 30);
  return `${(domain || '').trim().toLowerCase()}|${cat}|${resKey}`;
}

/**
 * Gathers comparison history from reference benchmarks, ChallengeBank, and TeamAssignment.
 */
export async function gatherHistoricalChallenges(domain) {
  const historical = [];

  // 1. Static reference benchmarks from PDFs
  const refMatches = referenceChallenges.filter(
    (r) => !domain || r.domain.toLowerCase() === domain.toLowerCase()
  );
  for (const r of refMatches) {
    historical.push({
      id: r.id,
      title: r.title,
      problemStatement: r.problemStatement,
      restriction: r.restriction,
      resource: r.resource,
      domain: r.domain,
      source: 'reference_benchmark'
    });
  }

  // 1b. Official curated challenges from PDFs (FinTech, Sustainability, EdTech, Open Innovation)
  const officialMatches = officialCuratedChallenges.filter(
    (o) => !domain || (o.theme && o.theme.toLowerCase() === domain.toLowerCase())
  );
  for (const o of officialMatches) {
    historical.push({
      id: o.id,
      title: o.title,
      problemStatement: o.problemStatement,
      restriction: Array.isArray(o.restrictions) ? o.restrictions.join('; ') : (o.restrictions || ''),
      resource: Array.isArray(o.resourcesProvided) ? o.resourcesProvided.join('; ') : (o.resourcesProvided || ''),
      domain: o.theme,
      source: 'official_curated_pdf'
    });
  }

  // 2. Query MongoDB ChallengeBank and TeamAssignment if database is connected
  if (mongoose.connection?.readyState === 1) {
    try {
      const bankDocs = await ChallengeBank.find(
        domain ? { domain } : {}
      ).select('title problemStatement restriction resourceText domain');

      for (const b of bankDocs) {
        historical.push({
          id: b._id.toString(),
          title: b.title,
          problemStatement: b.problemStatement,
          restriction: b.restriction,
          resource: b.resourceText,
          domain: b.domain,
          source: 'challenge_bank'
        });
      }

      const teamDocs = await TeamAssignment.find(
        domain ? { theme: domain } : {}
      ).select('challenge theme challengeId');

      for (const t of teamDocs) {
        if (t.challenge?.problem?.statement) {
          historical.push({
            id: t.challengeId || t._id.toString(),
            title: t.challenge.problem.title,
            problemStatement: t.challenge.problem.statement,
            restriction: t.challenge.restriction?.rule || '',
            resource: t.challenge.resource?.name || '',
            domain: t.theme,
            source: 'team_assignment'
          });
        }
      }
    } catch (err) {
      console.warn(`[NoveltyService] Failed to query Mongo history: ${err.message}`);
    }
  }

  return historical;
}

/**
 * Evaluates the novelty of a candidate challenge against past challenges.
 *
 * @param {Object} candidate - Challenge candidate object
 * @param {Object} [options]
 * @param {Object} [options.thresholds]
 * @param {Array} [options.comparisonPool] - Optional explicit comparison items (for testing)
 * @returns {Promise<Object>} Novelty evaluation result
 */
export async function evaluateNovelty(candidate, options = {}) {
  const thresholds = { ...DEFAULT_NOVELTY_THRESHOLDS, ...(options.thresholds || {}) };

  const domain = candidate.theme || candidate.domain || '';
  const problemStatement = candidate.problem?.statement || candidate.problemStatement || '';
  const problemTitle = candidate.problem?.title || candidate.title || '';
  const restrictionRule = candidate.restriction?.rule || candidate.restriction || '';
  const resourceName = candidate.resource?.name || candidate.resourceText || candidate.resource || '';

  // 1. Exact Fingerprint Hash
  const candidateFp = computeFingerprint(domain, problemStatement, restrictionRule);

  // 2. Load historical comparison pool
  const history = options.comparisonPool || (await gatherHistoricalChallenges(domain));

  let maxProblemSim = 0;
  let maxRestrictionSim = 0;
  let maxResourceOverlap = 0;
  let mostSimilarItem = null;
  let isExactDuplicate = false;

  const candidateCombKey = getCombinationKey(domain, restrictionRule, resourceName);
  let combinationRepeatCount = 0;

  for (const item of history) {
    const itemProblem = item.problemStatement || '';
    const itemRest = item.restriction || '';
    const itemRes = item.resource || '';

    // Exact fingerprint match
    const itemFp = computeFingerprint(item.domain, itemProblem, itemRest);
    if (candidateFp === itemFp) {
      isExactDuplicate = true;
      maxProblemSim = 1.0;
      mostSimilarItem = item;
      break;
    }

    // Similarity calculations
    const probSim = computeTextSimilarity(problemStatement, itemProblem);
    const restSim = computeTextSimilarity(restrictionRule, itemRest);
    const resSim = computeTextSimilarity(resourceName, itemRes);

    if (probSim > maxProblemSim) {
      maxProblemSim = probSim;
      mostSimilarItem = item;
    }
    if (restSim > maxRestrictionSim) {
      maxRestrictionSim = restSim;
    }
    if (resSim > maxResourceOverlap) {
      maxResourceOverlap = resSim;
    }

    // Combination novelty check
    const itemCombKey = getCombinationKey(item.domain, itemRest, itemRes);
    if (candidateCombKey === itemCombKey) {
      combinationRepeatCount++;
    }
  }

  // Composite overall similarity: 50% problem + 25% restriction + 25% resource
  const overallSimilarity = 0.5 * maxProblemSim + 0.25 * maxRestrictionSim + 0.25 * maxResourceOverlap;

  // Combination novelty score
  const combinationNoveltyScore = combinationRepeatCount > 0
    ? Math.max(0, 1.0 - combinationRepeatCount * thresholds.COMBINATION_REPEAT_PENALTY)
    : 1.0;

  // Decision Logic
  const reasons = [];
  let decision = 'ACCEPT';

  if (isExactDuplicate) {
    decision = 'REJECT';
    reasons.push(`Exact duplicate detected matching record '${mostSimilarItem?.title || mostSimilarItem?.id}'.`);
  } else if (maxProblemSim >= 0.85) {
    decision = 'REJECT';
    reasons.push(`Problem statement is an extreme near-duplicate (similarity: ${(maxProblemSim * 100).toFixed(1)}% >= 85%).`);
  } else if (maxProblemSim >= thresholds.PROBLEM_SIMILARITY_MAX) {
    decision = 'REGENERATE';
    reasons.push(`Problem statement similarity (${(maxProblemSim * 100).toFixed(1)}%) exceeds threshold of ${(thresholds.PROBLEM_SIMILARITY_MAX * 100).toFixed(0)}%.`);
  } else if (overallSimilarity >= thresholds.OVERALL_SIMILARITY_MAX) {
    decision = 'REGENERATE';
    reasons.push(`Overall challenge similarity (${(overallSimilarity * 100).toFixed(1)}%) exceeds threshold of ${(thresholds.OVERALL_SIMILARITY_MAX * 100).toFixed(0)}%.`);
  } else if (combinationNoveltyScore < 0.6) {
    decision = 'REGENERATE';
    reasons.push(`High repetition of domain, restriction category, and resource combination.`);
  }

  return {
    decision,
    fingerprint: candidateFp,
    combinationKey: candidateCombKey,
    isExactDuplicate,
    similarityScores: {
      problemSimilarity: parseFloat(maxProblemSim.toFixed(4)),
      restrictionSimilarity: parseFloat(maxRestrictionSim.toFixed(4)),
      resourceOverlap: parseFloat(maxResourceOverlap.toFixed(4)),
      combinationNoveltyScore: parseFloat(combinationNoveltyScore.toFixed(4)),
      overallSimilarity: parseFloat(overallSimilarity.toFixed(4))
    },
    mostSimilarItem: mostSimilarItem ? {
      id: mostSimilarItem.id,
      title: mostSimilarItem.title,
      source: mostSimilarItem.source,
      similarity: parseFloat(maxProblemSim.toFixed(4))
    } : null,
    reasons
  };
}

export default {
  DEFAULT_NOVELTY_THRESHOLDS,
  tokenizeWords,
  generateCharNgrams,
  calculateJaccardSimilarity,
  computeTextSimilarity,
  getCombinationKey,
  gatherHistoricalChallenges,
  evaluateNovelty
};
