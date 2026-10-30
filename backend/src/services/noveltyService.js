import mongoose from 'mongoose';
import { computeFingerprint, normalizeText, categorizeRestriction } from './ingestionService.js';
import ChallengeBank from '../models/ChallengeBank.js';
import TeamAssignment from '../models/TeamAssignment.js';
import referenceChallenges from '../data/referenceChallenges.json' with { type: 'json' };
import officialCuratedChallenges from '../data/officialCuratedChallenges.json' with { type: 'json' };
import {
  extractDiversityProfile,
  computeWeightedDiversitySimilarity,
  computeFunctionalEquivalence
} from './diversityProfileService.js';

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
  SEMANTIC_DIVERSITY_MAX: 0.65,      // Multi-dimensional semantic diversity threshold (problem+workflow+archetype+persona)
  FUNCTIONAL_EQUIVALENCE_MAX: 0.75,  // Phase 13: Functional equivalence regeneration threshold
  FUNCTIONAL_EQUIVALENCE_HARD_REJECT: 0.82, // Phase 13: Hard duplicate rejection threshold
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
      deliverable: r.deliverable || '',
      domain: r.domain,
      source: 'reference_benchmark',
      diversityProfile: extractDiversityProfile({
        theme: r.domain,
        title: r.title,
        problemStatement: r.problemStatement,
        restrictions: [r.restriction],
        resourcesProvided: [r.resource]
      })
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
      deliverable: o.deliverable || '',
      domain: o.theme,
      source: 'official_curated_pdf',
      diversityProfile: extractDiversityProfile(o)
    });
  }

  // 2. Query MongoDB ChallengeBank and TeamAssignment if database is connected
  if (mongoose.connection?.readyState === 1) {
    try {
      const bankDocs = await ChallengeBank.find(
        domain ? { domain } : {}
      ).select('title problemStatement restriction resourceText domain deliverable');

      for (const b of bankDocs) {
        historical.push({
          id: b._id.toString(),
          title: b.title,
          problemStatement: b.problemStatement,
          restriction: b.restriction,
          resource: b.resourceText,
          deliverable: b.deliverable || '',
          domain: b.domain,
          source: 'challenge_bank',
          diversityProfile: extractDiversityProfile({
            theme: b.domain,
            title: b.title,
            problemStatement: b.problemStatement,
            restrictions: [b.restriction],
            resourcesProvided: [b.resourceText]
          })
        });
      }

      const teamDocs = await TeamAssignment.find(
        domain ? { theme: domain } : {}
      ).select('challenge theme challengeId diversityProfile');

      for (const t of teamDocs) {
        if (t.challenge?.problem?.statement) {
          historical.push({
            id: t.challengeId || t._id.toString(),
            title: t.challenge.problem.title,
            problemStatement: t.challenge.problem.statement,
            restriction: t.challenge.restriction?.rule || '',
            resource: t.challenge.resource?.name || '',
            deliverable: t.challenge.deliverable || '',
            domain: t.theme,
            source: 'team_assignment',
            diversityProfile: t.diversityProfile || extractDiversityProfile(t.challenge)
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
  const candidateDeliverable = candidate.deliverable || '';

  // 1. Exact Fingerprint Hash
  const candidateFp = computeFingerprint(domain, problemStatement, restrictionRule);
  const candidateProfile = candidate.diversityProfile || extractDiversityProfile(candidate);
  candidate.diversityProfile = candidateProfile;

  // 2. Load historical comparison pool
  const history = options.comparisonPool || (await gatherHistoricalChallenges(domain));

  let maxProblemSim = 0;
  let maxRestrictionSim = 0;
  let maxResourceOverlap = 0;
  let mostSimilarItem = null;
  let isExactDuplicate = false;

  let maxWeightedDiversitySim = 0;
  let mostSimilarDiversityItem = null;
  let highestDiversityBreakdown = null;
  let sameSubdomainAndArchetypeCount = 0;

  // Phase 13: Functional Equivalence Tracking
  let maxFunctionalEquivalence = 0;
  let mostSimilarFunctionalItem = null;
  let highestFunctionalBreakdown = null;

  const candidateCombKey = getCombinationKey(domain, restrictionRule, resourceName);
  let combinationRepeatCount = 0;

  for (const item of history) {
    const itemProblem = item.problemStatement || '';
    const itemRest = item.restriction || '';
    const itemRes = item.resource || '';
    const itemDeliverable = item.deliverable || '';

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
    const delivSim = computeTextSimilarity(candidateDeliverable, itemDeliverable);

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

    // Semantic Diversity Weighted Similarity
    const weightedDiv = computeWeightedDiversitySimilarity(candidate, item, probSim, resSim);
    if (weightedDiv.compositeSimilarity > maxWeightedDiversitySim) {
      maxWeightedDiversitySim = weightedDiv.compositeSimilarity;
      mostSimilarDiversityItem = item;
      highestDiversityBreakdown = weightedDiv.breakdown;
    }

    // Phase 13: Functional Equivalence Scoring
    const funcEq = computeFunctionalEquivalence(candidate, item, probSim, delivSim, options.functionalWeights);
    if (funcEq.functionalEquivalenceScore > maxFunctionalEquivalence) {
      maxFunctionalEquivalence = funcEq.functionalEquivalenceScore;
      mostSimilarFunctionalItem = item;
      highestFunctionalBreakdown = funcEq.breakdown;
    }

    // Subdomain and archetype frequency tracking
    const itemProfile = item.diversityProfile || extractDiversityProfile(item);
    if (
      itemProfile.subdomain === candidateProfile.subdomain &&
      itemProfile.solutionArchetype === candidateProfile.solutionArchetype
    ) {
      sameSubdomainAndArchetypeCount++;
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

  const semanticDiversityHardRejectThreshold = options.thresholds?.SEMANTIC_DIVERSITY_MAX
    ? Math.min(0.95, options.thresholds.SEMANTIC_DIVERSITY_MAX + 0.15)
    : 0.85;

  const functionalHardRejectThreshold = options.thresholds?.FUNCTIONAL_EQUIVALENCE_HARD_REJECT || thresholds.FUNCTIONAL_EQUIVALENCE_HARD_REJECT || 0.82;
  const functionalRegenThreshold = options.thresholds?.FUNCTIONAL_EQUIVALENCE_MAX || thresholds.FUNCTIONAL_EQUIVALENCE_MAX || 0.70;

  if (isExactDuplicate) {
    decision = 'REJECT';
    reasons.push(`Exact duplicate detected matching record '${mostSimilarItem?.title || mostSimilarItem?.id}'.`);
  } else if (maxProblemSim >= 0.85) {
    decision = 'REJECT';
    reasons.push(`Problem statement is an extreme near-duplicate (similarity: ${(maxProblemSim * 100).toFixed(1)}% >= 85%).`);
  } else if (maxProblemSim >= thresholds.PROBLEM_SIMILARITY_MAX && maxProblemSim < 0.85 && (!options.thresholds?.SEMANTIC_DIVERSITY_MAX && !options.thresholds?.OVERALL_SIMILARITY_MAX && !options.thresholds?.FUNCTIONAL_EQUIVALENCE_MAX)) {
    // When caller specifically evaluates problem similarity alone
    decision = 'REGENERATE';
    reasons.push(`Problem statement similarity (${(maxProblemSim * 100).toFixed(1)}%) exceeds threshold of ${(thresholds.PROBLEM_SIMILARITY_MAX * 100).toFixed(0)}%.`);
  } else if (maxFunctionalEquivalence >= functionalHardRejectThreshold) {
    decision = 'REJECT';
    reasons.push(
      `Functional equivalence check failed: candidate is an extreme functional clone of '${mostSimilarFunctionalItem?.title || mostSimilarFunctionalItem?.id}' (functional equivalence: ${(maxFunctionalEquivalence * 100).toFixed(1)}% >= ${(functionalHardRejectThreshold * 100).toFixed(0)}%). Engineering task: '${candidateProfile.engineeringTask}', algorithm: '${candidateProfile.coreAlgorithm}'.`
    );
  } else if (
    maxFunctionalEquivalence >= 0.78 &&
    candidateProfile.coreAlgorithm !== 'not_applicable' &&
    candidateProfile.coreAlgorithm !== 'unknown' &&
    highestFunctionalBreakdown?.coreAlgorithmSim >= 0.90 &&
    (!options.thresholds?.FUNCTIONAL_EQUIVALENCE_MAX || options.thresholds?.FUNCTIONAL_EQUIVALENCE_MAX <= 0.78)
  ) {
    decision = 'REJECT';
    reasons.push(
      `Functional equivalence check failed: candidate shares identical core algorithm ('${candidateProfile.coreAlgorithm}') and high functional overlap with '${mostSimilarFunctionalItem?.title || mostSimilarFunctionalItem?.id}' (functional equivalence: ${(maxFunctionalEquivalence * 100).toFixed(1)}%).`
    );
  } else if (maxWeightedDiversitySim >= semanticDiversityHardRejectThreshold) {
    decision = 'REJECT';
    reasons.push(
      `Semantic diversity check failed: candidate is an extreme functional clone of '${mostSimilarDiversityItem?.title || mostSimilarDiversityItem?.id}' (weighted similarity: ${(maxWeightedDiversitySim * 100).toFixed(1)}% >= ${(semanticDiversityHardRejectThreshold * 100).toFixed(0)}%).`
    );
  } else if (maxFunctionalEquivalence >= functionalRegenThreshold) {
    decision = 'REGENERATE';
    reasons.push(
      `Functional equivalence check: candidate shares substantial engineering task and workflow overlap with '${mostSimilarFunctionalItem?.title || mostSimilarFunctionalItem?.id}' (functional equivalence: ${(maxFunctionalEquivalence * 100).toFixed(1)}% >= ${(functionalRegenThreshold * 100).toFixed(0)}%). Task: '${candidateProfile.engineeringTask}', algorithm: '${candidateProfile.coreAlgorithm}'.`
    );
  } else if (maxWeightedDiversitySim >= thresholds.SEMANTIC_DIVERSITY_MAX) {
    decision = 'REGENERATE';
    reasons.push(
      `Semantic diversity check: candidate shares substantial workflow and problem overlap with '${mostSimilarDiversityItem?.title || mostSimilarDiversityItem?.id}' (weighted similarity: ${(maxWeightedDiversitySim * 100).toFixed(1)}% >= ${(thresholds.SEMANTIC_DIVERSITY_MAX * 100).toFixed(0)}%). Subdomain: ${candidateProfile.subdomain}, Archetype: ${candidateProfile.solutionArchetype}.`
    );
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
      overallSimilarity: parseFloat(overallSimilarity.toFixed(4)),
      semanticDiversitySimilarity: parseFloat(maxWeightedDiversitySim.toFixed(4)),
      functionalEquivalenceScore: parseFloat(maxFunctionalEquivalence.toFixed(4)),
      diversityProfile: candidateProfile,
      diversityBreakdown: highestDiversityBreakdown,
      functionalBreakdown: highestFunctionalBreakdown
    },
    mostSimilarItem: mostSimilarItem ? {
      id: mostSimilarItem.id,
      title: mostSimilarItem.title,
      source: mostSimilarItem.source,
      similarity: parseFloat(maxProblemSim.toFixed(4))
    } : null,
    mostSimilarDiversityItem: mostSimilarDiversityItem ? {
      id: mostSimilarDiversityItem.id,
      title: mostSimilarDiversityItem.title,
      source: mostSimilarDiversityItem.source,
      similarity: parseFloat(maxWeightedDiversitySim.toFixed(4))
    } : null,
    mostSimilarFunctionalItem: mostSimilarFunctionalItem ? {
      id: mostSimilarFunctionalItem.id,
      title: mostSimilarFunctionalItem.title,
      source: mostSimilarFunctionalItem.source,
      functionalEquivalence: parseFloat(maxFunctionalEquivalence.toFixed(4))
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
