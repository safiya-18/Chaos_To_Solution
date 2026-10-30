import { validateChallenge, BANNED_SERVICE_KEYWORDS } from '../utils/challengeValidator.js';
import { categorizeRestriction } from './ingestionService.js';
import { validateThemeConstraints } from '../utils/themeConstraintValidator.js';
import { extractDiversityProfile } from './diversityProfileService.js';

export const SCORING_WEIGHTS = Object.freeze({
  PROBLEM_NOVELTY: 0.35,
  RESOURCE_DIVERSITY: 0.20,
  RESTRICTION_DIVERSITY: 0.20,
  FEASIBILITY: 0.15,
  CLARITY: 0.10
});

/**
 * Enforces non-negotiable hard rejection rules before candidate ranking.
 */
export function validateHardRules(candidate) {
  const rejections = [];

  // 1. Core Schema Validation
  const schemaRes = validateChallenge(candidate, candidate.theme || candidate.domain);
  if (!schemaRes.isValid) {
    rejections.push(`Schema validation failed: ${schemaRes.errors.join('; ')}`);
  }

  // 2. Resource reachability check
  const resStatus = candidate.resource?.verificationStatus;
  if (resStatus === 'inaccessible' || (resStatus && RESOURCE_STATUS_POLICIES[resStatus] && !RESOURCE_STATUS_POLICIES[resStatus].allowed)) {
    rejections.push(`Associated resource '${candidate.resource.name}' is verified as inaccessible or broken.`);
  }

  // 3. Prohibited paid cloud/AI services check
  const candidateStr = JSON.stringify(candidate).toLowerCase();
  for (const keyword of BANNED_SERVICE_KEYWORDS) {
    if (candidateStr.includes(keyword)) {
      const matchIndex = candidateStr.indexOf(keyword);
      const lookback = candidateStr.slice(Math.max(0, matchIndex - 35), matchIndex);
      const isNegated = /\b(no|not|without|never|zero|free of|prevent)\b[\w\s,;-]*$/.test(lookback);
      if (!isNegated && keyword === 'subscription' && /audit|track|cancel|unnoticed|drain/i.test(candidateStr)) {
        continue;
      }
      if (!isNegated) {
        rejections.push(`Candidate references prohibited paid service keyword '${keyword}' violating zero-budget policy.`);
      }
    }
  }

  // 4. Contradiction Detection: Offline requirement vs Cloud API
  const restLower = (candidate.restriction?.rule || '').toLowerCase();
  const resType = candidate.resource?.type || '';
  const resNameLower = (candidate.resource?.name || '').toLowerCase();

  const isOfflineRestriction = restLower.includes('offline') || restLower.includes('zero network') || restLower.includes('no cloud api');
  const isCloudResource = resType === 'public-api' || resNameLower.includes('cloud api') || resNameLower.includes('rest endpoint');

  if (isOfflineRestriction && isCloudResource) {
    rejections.push('Contradictory constraints: Offline restriction conflicts with requirement for external public API.');
  }

  // 5. Impossible 3-Hour Delivery Feasibility
  const deliverableLower = (candidate.deliverable || '').toLowerCase();
  const problemLower = (candidate.problem?.statement || '').toLowerCase();
  const impossibleTokens = ['train an llm from scratch', 'collect 10,000 real patient records', 'deploy physical hardware sensors', 'patent registration'];

  for (const token of impossibleTokens) {
    if (deliverableLower.includes(token) || problemLower.includes(token)) {
      rejections.push(`Impossible 3-hour hackathon feasibility: requires '${token}'.`);
    }
  }

  // 6. Official Theme-Specific Constraint Policy
  const themeConstraintCheck = validateThemeConstraints(candidate, candidate.theme || candidate.domain);
  if (!themeConstraintCheck.passed) {
    rejections.push(...themeConstraintCheck.violations);
  }

  return {
    passed: rejections.length === 0,
    rejections
  };
}

export const RESOURCE_STATUS_POLICIES = Object.freeze({
  verified: {
    allowed: true,
    requiresManualReview: false,
    multiplier: 1.0,
    feasibilityPenalty: 0.0,
    description: 'Fully reachable, verified documentation signals and zero-budget compliant.'
  },
  candidate: {
    allowed: true,
    requiresManualReview: false,
    multiplier: 0.70,
    feasibilityPenalty: 0.10,
    description: 'Proposed candidate resource; automated verification has not yet run.'
  },
  verification_pending: {
    allowed: true,
    requiresManualReview: false,
    multiplier: 0.75,
    feasibilityPenalty: 0.10,
    description: 'Automated reachability check deferred due to transient network latency or domain rate limiting.'
  },
  needs_manual_review: {
    allowed: true,
    requiresManualReview: true,
    multiplier: 0.60,
    feasibilityPenalty: 0.20,
    description: 'Requires organizer review due to potential authentication requirements, generic homepage URL, or licensing ambiguity.'
  },
  inaccessible: {
    allowed: false,
    requiresManualReview: false,
    multiplier: 0.0,
    feasibilityPenalty: 0.80,
    description: 'Strictly prohibited; destination is unreachable, returns 404/5xx, or violates SSRF security boundaries.'
  }
});

/**
 * Calculates feasibility score (0.0 to 1.0) based on 3-hour time limit and zero budget.
 */
export function calculateFeasibilityScore(candidate) {
  let score = 1.0;
  const restLower = (candidate.restriction?.rule || '').toLowerCase();
  const resType = candidate.resource?.type || '';
  const isBrowserApi = resType === 'browser-api';
  const status = candidate.resource?.verificationStatus || (isBrowserApi ? 'verified' : 'candidate');
  const policy = RESOURCE_STATUS_POLICIES[status] || RESOURCE_STATUS_POLICIES.candidate;

  // Zero-budget compliance: pure browser API or local dataset is ideal for zero-cost rapid dev
  if (isBrowserApi || resType === 'local-dataset') {
    score += 0.05;
  }

  // Deduct based on resource status readiness
  score -= policy.feasibilityPenalty;

  // Overly restrictive constraint combinations that slow down 3-hour builds
  if (restLower.includes('under 1 mb') && restLower.includes('60 fps')) {
    score -= 0.15;
  }

  return Math.max(0.2, Math.min(1.0, score));
}

/**
 * Calculates clarity and actionable usefulness score (0.0 to 1.0).
 */
export function calculateClarityScore(candidate) {
  let score = 0.7; // baseline
  const problem = candidate.problem?.statement || '';
  const deliverable = candidate.deliverable || '';

  // Good problem statements describe a specific user pain point (40-300 chars)
  if (problem.length >= 60 && problem.length <= 350) {
    score += 0.15;
  }

  // Concrete deliverable with clear artifact description
  if (deliverable.toLowerCase().includes('web') || deliverable.toLowerCase().includes('dashboard') || deliverable.toLowerCase().includes('application') || deliverable.toLowerCase().includes('prototype')) {
    score += 0.15;
  }

  return Math.min(1.0, score);
}

/**
 * Evaluates candidate diversity, applies weights, and computes composite score.
 *
 * @param {Object} candidate
 * @param {Object} noveltyResult
 * @param {Object} [context]
 * @returns {Object} Scored candidate
 */
export function scoreCandidate(candidate, noveltyResult, context = {}) {
  // Hard validation check
  const hardValidation = validateHardRules(candidate);
  if (!hardValidation.passed) {
    return {
      candidate,
      eligible: false,
      totalScore: 0,
      hardRejections: hardValidation.rejections,
      breakdown: {
        novelty: 0,
        resourceDiversity: 0,
        restrictionDiversity: 0,
        feasibility: 0,
        clarity: 0,
        resourceStatus: candidate.resource?.verificationStatus || 'inaccessible'
      }
    };
  }

  // 1. Novelty & Semantic Diversity (35%)
  const probSim = noveltyResult?.similarityScores?.problemSimilarity || 0;
  const weightedDivSim = noveltyResult?.similarityScores?.semanticDiversitySimilarity || 0;
  const effectiveSimilarity = Math.max(probSim, weightedDivSim);
  const noveltyScore = Math.max(0, 1.0 - effectiveSimilarity);

  // 2. Resource Diversity (20%) — adjusted by usage recency AND verification status
  const resourceKey = candidate.resource?.name || '';
  const recentResourceCounts = context.recentResourceCounts || {};
  const resUsageCount = recentResourceCounts[resourceKey] || 0;
  const usageScore = Math.max(0.2, 1.0 - resUsageCount * 0.25);

  const isBrowserApi = candidate.resource?.type === 'browser-api';
  const status = candidate.resource?.verificationStatus || (isBrowserApi ? 'verified' : 'candidate');
  const policy = RESOURCE_STATUS_POLICIES[status] || RESOURCE_STATUS_POLICIES.candidate;
  const resourceDiversityScore = Math.max(0.1, usageScore * policy.multiplier);

  // 3. Restriction Diversity (20%)
  const restCategory = categorizeRestriction(candidate.restriction?.rule || '');
  const recentRestrictionCategories = context.recentRestrictionCategories || {};
  const catUsageCount = recentRestrictionCategories[restCategory] || 0;
  const restrictionDiversityScore = Math.max(0.2, 1.0 - catUsageCount * 0.25);

  // 4. Feasibility (15%)
  const feasibilityScore = calculateFeasibilityScore(candidate);

  // 5. Clarity (10%)
  const clarityScore = calculateClarityScore(candidate);

  // 6. Archetype & Subdomain Frequency Penalties (Soft Diversity Gate)
  const profile = candidate.diversityProfile || extractDiversityProfile(candidate);
  const recentArchetypeCounts = context.recentArchetypeCounts || {};
  const archCount = recentArchetypeCounts[profile.solutionArchetype] || 0;
  const archetypePenalty = Math.min(0.20, archCount * 0.05);

  const recentSubdomainCounts = context.recentSubdomainCounts || {};
  const subCount = recentSubdomainCounts[profile.subdomain] || 0;
  const subdomainPenalty = Math.min(0.15, subCount * 0.05);

  // Composite Weighted Score
  const baseScore =
    SCORING_WEIGHTS.PROBLEM_NOVELTY * noveltyScore +
    SCORING_WEIGHTS.RESOURCE_DIVERSITY * resourceDiversityScore +
    SCORING_WEIGHTS.RESTRICTION_DIVERSITY * restrictionDiversityScore +
    SCORING_WEIGHTS.FEASIBILITY * feasibilityScore +
    SCORING_WEIGHTS.CLARITY * clarityScore;

  const totalScore = Math.max(0.05, baseScore - archetypePenalty - subdomainPenalty);

  return {
    candidate,
    eligible: true,
    totalScore: parseFloat(totalScore.toFixed(4)),
    hardRejections: [],
    breakdown: {
      novelty: parseFloat(noveltyScore.toFixed(4)),
      resourceDiversity: parseFloat(resourceDiversityScore.toFixed(4)),
      restrictionDiversity: parseFloat(restrictionDiversityScore.toFixed(4)),
      feasibility: parseFloat(feasibilityScore.toFixed(4)),
      clarity: parseFloat(clarityScore.toFixed(4)),
      archetypeDiversity: parseFloat((1.0 - archetypePenalty).toFixed(4)),
      subdomainDiversity: parseFloat((1.0 - subdomainPenalty).toFixed(4)),
      resourceStatus: status
    },
    resourcePolicy: {
      status,
      allowed: policy.allowed,
      requiresManualReview: policy.requiresManualReview
    }
  };
}

/**
 * Ranks multiple scored candidates and returns the best valid candidate.
 */
export function rankAndSelectBest(scoredCandidates) {
  const eligible = scoredCandidates.filter((c) => c.eligible);
  if (eligible.length === 0) {
    return null;
  }

  eligible.sort((a, b) => b.totalScore - a.totalScore);
  return eligible[0];
}

export default {
  SCORING_WEIGHTS,
  validateHardRules,
  calculateFeasibilityScore,
  calculateClarityScore,
  scoreCandidate,
  rankAndSelectBest
};
