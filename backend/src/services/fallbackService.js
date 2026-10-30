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
 * Constructs a rich, multi-component deliverable tailored for a realistic 3-hour hackathon MVP.
 * Follows the strict 3-tier structure:
 * - Product Objective
 * - LEVEL 1 — MUST BUILD (Core MVP) [Mandatory]
 * - LEVEL 2 — SHOULD IMPROVE (Enhancements) [Optional]
 * - LEVEL 3 — BONUS CHALLENGE (Stretch Goals) [Optional]
 * - Expected Working Outcome
 * - Evaluation Criteria
 * Preserves 100% of official technical constraints (client-side only, simulated data, no paid APIs).
 */
export const buildRichDeliverable = ({ title, theme, statement, restrictionRule, resourceName }) => {
  const isClientSideOnly = /client-side|purely on the client|no backend|zero backend/i.test(restrictionRule);
  const isSimulatedOnly = /simulated|no live|sample records|no hardware/i.test(restrictionRule);
  const isOfflineOnly = /offline|zero internet|no internet/i.test(restrictionRule);

  let componentDesc = 'Responsive client application with modular state management';
  if (!isClientSideOnly && !isOfflineOnly) {
    componentDesc += ', lightweight REST API, and local persistence';
  } else {
    componentDesc += ' and persistent browser storage (LocalStorage/IndexedDB)';
  }

  const coreInputs = isSimulatedOnly
    ? 'Input parsing & validation for simulated datasets'
    : 'User data input capture with field validation';

  const coreProcessing = isSimulatedOnly
    ? 'Core algorithmic processing on supplied records'
    : 'Core business logic execution and calculation';

  const cleanTitle = title.length > 50 ? `${title.slice(0, 47)}...` : title;
  const cleanRes = resourceName.length > 40 ? `${resourceName.slice(0, 37)}...` : resourceName;

  return `Build a functional, demonstrable MVP of ${cleanTitle} for ${theme} within 3 hours.

Product Objective: Solve: ${statement.slice(0, 75)}...

System Components: ${componentDesc} leveraging ${cleanRes}.

Functional Requirements:
LEVEL 1 — MUST BUILD (Core MVP) [Mandatory]:
- ${coreInputs}
- ${coreProcessing}
- Interactive interface displaying computed results and feedback
- Persistent state using ${cleanRes}
- End-to-end working demonstration using supplied/permitted data

LEVEL 2 — SHOULD IMPROVE (Enhancements) [Optional]:
- Advanced filtering and multi-criteria search
- Data visualization charts and summary metrics
- Error boundaries and accessible navigation

LEVEL 3 — BONUS CHALLENGE (Stretch Goals) [Optional]:
- Algorithmic performance optimization or heuristic recommendation
- Data export in JSON/CSV format

Expected Working Outcome: Demonstrable, testable application providing an interactive end-to-end user journey with zero runtime errors.
Evaluation Criteria: Core MVP completeness, algorithmic correctness, clean UX, and 100% adherence to: ${restrictionRule.slice(0, 50)}.`;
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

  // Filter 1: Exclude already seen titles
  let candidates = matches.filter((m) => !recentSet.has(`${validatedTheme}:${m.title}`));

  // Filter 2: If we have diverse candidates remaining, avoid immediately repeating subdomains & archetypes
  if (candidates.length > 1 && (recentSubdomains.size > 0 || recentArchetypes.size > 0)) {
    const varied = candidates.filter((m) => {
      const prof = extractDiversityProfile(m);
      const subRepeats = recentSubdomains.has(prof.subdomain);
      const archRepeats = recentArchetypes.has(prof.solutionArchetype);
      return !subRepeats && !archRepeats;
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
