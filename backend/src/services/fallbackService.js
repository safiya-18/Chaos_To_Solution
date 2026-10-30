import problems from '../data/problems.json' with { type: 'json' };
import restrictions from '../data/restrictions.json' with { type: 'json' };
import resources from '../data/resources.json' with { type: 'json' };
import officialCuratedChallenges from '../data/officialCuratedChallenges.json' with { type: 'json' };
import { validateTheme } from '../utils/challengeValidator.js';
import { extractDiversityProfile } from './diversityProfileService.js';

export const THEME_PROBLEM_AFFINITY = Object.freeze({
  EdTech: ['prob_prod_04', 'prob_access_03', 'prob_prod_01'],
  FinTech: ['prob_campus_02', 'prob_civic_03'],
  HealthTech: ['prob_civic_02', 'prob_media_02', 'prob_media_04'],
  Sustainability: ['prob_campus_03', 'prob_civic_03'],
  'Smart Cities': ['prob_campus_04', 'prob_civic_01', 'prob_civic_04'],
  Accessibility: ['prob_access_01', 'prob_access_02', 'prob_access_04'],
  'E-commerce': ['prob_campus_01', 'prob_campus_02'],
  'Open Innovation': problems.map((p) => p.id)
});

const problemsMap = new Map(problems.map((p) => [p.id, p]));

/**
 * Retrieves official curated challenge records filtered by theme.
 */
export const getOfficialCuratedChallenges = (theme) => {
  if (!theme) return officialCuratedChallenges;
  const tLower = theme.toLowerCase();
  return officialCuratedChallenges.filter((c) => c.theme.toLowerCase() === tLower);
};

/**
 * Constructs a concise, natural deliverable tailored for a realistic 3-hour hackathon.
 * Naturally explains:
 * 1. What the team needs to build.
 * 2. What important functionality it should contain (approximately 3–5 meaningful features).
 * 3. What the expected working solution should demonstrate.
 * Avoids separate sections (Must Build, Should Improve, Stretch Goals).
 * Preserves 100% of official technical constraints (client-side only, simulated data, no paid APIs).
 */
export const buildRichDeliverable = ({ title, theme, statement, restrictionRule, resourceName }) => {
  const isClientSideOnly = /client-side|purely on the client|no backend|zero backend/i.test(restrictionRule);
  const isSimulatedOnly = /simulated|no live|sample records|no hardware/i.test(restrictionRule);
  const isOfflineOnly = /offline|zero internet|no internet/i.test(restrictionRule);

  let archDesc = 'responsive client application';
  if (!isClientSideOnly && !isOfflineOnly) {
    archDesc += ' with lightweight local persistence';
  } else {
    archDesc += ' with client-side browser storage';
  }

  const inputAction = isSimulatedOnly
    ? 'ingests and validates the supplied simulated dataset'
    : 'captures and validates user inputs';

  const processingAction = isSimulatedOnly
    ? 'executes core analytical algorithms on the records'
    : 'applies business calculation logic in real time';

  const cleanTitle = title.length > 50 ? `${title.slice(0, 47)}...` : title;
  const cleanRes = resourceName.length > 40 ? `${resourceName.slice(0, 37)}...` : resourceName;
  const cleanStatement = statement.trim().endsWith('.') ? statement.trim() : `${statement.trim()}.`;

  return `Build a functional 3-hour MVP of ${cleanTitle} for ${theme} as a ${archDesc} powered by ${cleanRes}. The solution directly addresses the challenge where ${cleanStatement} It should provide an interactive interface that ${inputAction}, ${processingAction}, renders actionable results and summary visualizations, and demonstrates a reliable working workflow strictly adhering to ${restrictionRule.slice(0, 60)}.`;
};

/**
 * Generates fallback challenge directly from official curated challenge dataset when available.
 * Rotates systematically across distinct subdomains and solution archetypes.
 */
export const generateOfficialFallback = (theme, recentHistory = []) => {
  const validatedTheme = validateTheme(theme);
  const matches = getOfficialCuratedChallenges(validatedTheme);

  if (matches.length === 0) {
    return generateFallback(validatedTheme, recentHistory);
  }

  const recentSet = new Set(recentHistory);
  // Extract recent subdomains from history strings formatted as "theme:subdomain:*"
  const recentSubdomains = new Set(
    recentHistory
      .filter((h) => h.includes(':subdomain:'))
      .map((h) => h.split(':subdomain:')[1])
  );
  const recentArchetypes = new Set(
    recentHistory
      .filter((h) => h.includes(':archetype:'))
      .map((h) => h.split(':archetype:')[1])
  );
  const recentAlgorithms = new Set(
    recentHistory
      .filter((h) => h.includes(':algorithm:'))
      .map((h) => h.split(':algorithm:')[1])
  );

  // Filter 1: Exclude already seen titles
  let candidates = matches.filter((m) => !recentSet.has(`${validatedTheme}:${m.title}`));

  // Filter 2: If we have diverse candidates remaining, avoid immediately repeating subdomains, archetypes & algorithms
  if (candidates.length > 1 && (recentSubdomains.size > 0 || recentArchetypes.size > 0 || recentAlgorithms.size > 0)) {
    const varied = candidates.filter((m) => {
      const prof = extractDiversityProfile(m);
      const subRepeats = recentSubdomains.has(prof.subdomain);
      const archRepeats = recentArchetypes.has(prof.solutionArchetype);
      const algoRepeats = prof.coreAlgorithm && prof.coreAlgorithm !== 'not_applicable' && recentAlgorithms.has(prof.coreAlgorithm);
      return !subRepeats && !archRepeats && !algoRepeats;
    });
    if (varied.length > 0) {
      candidates = varied;
    }
  }

  const pool = candidates.length > 0 ? candidates : matches;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  const primaryResource = selected.resourcesProvided[0] || 'Official Dataset';
  const resourceName = primaryResource.length > 80 ? `${primaryResource.slice(0, 77)}...` : primaryResource;
  const isBrowserApi = /web speech|canvas|storage|indexeddb|notification|worker|clipboard/i.test(primaryResource);
  const restrictionRule = selected.restrictions.join('; ');
  const profile = extractDiversityProfile(selected);

  return {
    theme: selected.theme,
    problem: {
      title: selected.title,
      statement: selected.problemStatement
    },
    restriction: {
      name: `${selected.theme} Official Constraint`,
      rule: restrictionRule
    },
    resource: {
      name: resourceName,
      type: isBrowserApi ? 'browser-api' : 'local-dataset',
      guidance: `Utilize provided resource: ${selected.resourcesProvided.join('; ')}`,
      docsUrl: 'https://github.com/safiya-18/Chaos_To_Solution'
    },
    deliverable: buildRichDeliverable({
      title: selected.title,
      theme: selected.theme,
      statement: selected.problemStatement,
      restrictionRule,
      resourceName
    }),
    source: 'curated-fallback',
    isOfficialCurated: true,
    curatedId: selected.id,
    diversityProfile: profile
  };
};

export const generateFallback = (theme, recentHistory = []) => {
  const validatedTheme = validateTheme(theme);
  const candidateIds = THEME_PROBLEM_AFFINITY[validatedTheme] || THEME_PROBLEM_AFFINITY['Open Innovation'];

  // Resolve candidate problem objects
  const candidateProblems = candidateIds
    .map((id) => problemsMap.get(id))
    .filter(Boolean);

  if (candidateProblems.length === 0) {
    throw new Error(`No fallback problems available for theme '${validatedTheme}'.`);
  }

  // Filter out recent history signatures: `${theme}:${problem.title}`
  const recentSignatures = new Set(recentHistory);
  const unseenProblems = candidateProblems.filter(
    (p) => !recentSignatures.has(`${validatedTheme}:${p.title}`)
  );

  // If all candidates were recently used, recycle the full candidate pool safely
  const problemPool = unseenProblems.length > 0 ? unseenProblems : candidateProblems;

  // Pick deterministic/pseudo-random problem from pool
  const problem = problemPool[Math.floor(Math.random() * problemPool.length)];

  // Find compatible restriction
  const compatibleRestrictions = restrictions.filter(
    (r) => !problem.incompatibleRestrictions?.includes(r.id)
  );
  const restriction =
    compatibleRestrictions[Math.floor(Math.random() * compatibleRestrictions.length)] ||
    restrictions[0];

  // Find compatible resource
  const compatibleResources = resources.filter(
    (res) =>
      !problem.incompatibleResources?.includes(res.id) &&
      !restriction.incompatibleResources?.includes(res.id)
  );
  const resource =
    compatibleResources[Math.floor(Math.random() * compatibleResources.length)] ||
    resources[0];

  return {
    theme: validatedTheme,
    problem: {
      title: problem.title,
      statement: problem.description
    },
    restriction: {
      name: restriction.name,
      rule: restriction.rule
    },
    resource: {
      name: resource.name,
      type: resource.type,
      guidance: `Use ${resource.name} to provide live data, interactive feedback, or storage for ${problem.title.toLowerCase()}.`,
      docsUrl: resource.docsUrl
    },
    deliverable: buildRichDeliverable({
      title: problem.title,
      theme: validatedTheme,
      statement: problem.description,
      restrictionRule: restriction.rule,
      resourceName: resource.name
    }),
    source: 'curated-fallback',
    diversityProfile: extractDiversityProfile({
      theme: validatedTheme,
      title: problem.title,
      problemStatement: problem.description,
      restrictions: [restriction.rule],
      resourcesProvided: [resource.name]
    })
  };
};

export default {
  THEME_PROBLEM_AFFINITY,
  generateFallback,
  getOfficialCuratedChallenges,
  generateOfficialFallback
};
