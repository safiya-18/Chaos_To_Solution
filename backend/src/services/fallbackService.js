import problems from '../data/problems.json' with { type: 'json' };
import restrictions from '../data/restrictions.json' with { type: 'json' };
import resources from '../data/resources.json' with { type: 'json' };
import officialCuratedChallenges from '../data/officialCuratedChallenges.json' with { type: 'json' };
import { validateTheme } from '../utils/challengeValidator.js';

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
 * Constructs a rich, multi-component deliverable tailored for a realistic 3-hour hackathon sprint.
 * Adheres strictly to the 3-level scope model:
 * - Product Objective
 * - Core MVP (Must Build)
 * - Enhancements (Should Improve)
 * - Bonus (Stretch Goals)
 * - Expected Working Outcome
 * - Evaluation Criteria
 * Preserves all official technical constraints (client-side only, simulated data, no paid APIs).
 */
export const buildRichDeliverable = ({ title, theme, statement, restrictionRule, resourceName }) => {
  const isClientSideOnly = /client-side|purely on the client|no backend|zero backend/i.test(restrictionRule);
  const isSimulatedOnly = /simulated|no live|sample records|no hardware/i.test(restrictionRule);
  const isOfflineOnly = /offline|zero internet|no internet/i.test(restrictionRule);

  let coreArchitecture = 'responsive client application with modular state management';
  if (!isClientSideOnly && !isOfflineOnly) {
    coreArchitecture += ' and lightweight local REST handler';
  } else {
    coreArchitecture += ' and persistent browser storage (LocalStorage/IndexedDB)';
  }

  const coreFlow = isSimulatedOnly
    ? 'load provided simulated records, validate input parameters, execute deterministic core calculations/analysis, and render status summaries'
    : 'accept structured user inputs, validate data invariants, execute core processing/calculation algorithms, and render interactive results';

  return `Product Objective: Build a functional, demonstrable ${title} addressing ${theme.toLowerCase()} problem: ${statement.slice(0, 110)}...

Core MVP (Must Build):
- Primary user flow: ${coreFlow}.
- Complete functional interface built with ${coreArchitecture} leveraging ${resourceName}.
- 3 to 5 core functional capabilities with full data validation and demonstrable output states (zero static mockups).

Enhancements (Should Improve):
- Dynamic search/filtering across records and interactive visual trend feedback.
- Tabular reporting and structured data export (JSON/CSV).
- Enhanced keyboard accessibility and resilient error boundaries.

Bonus (Stretch Goals):
- Algorithmic optimization for enhanced calculation efficiency or heuristic ranking.
- Advanced automated recommendations or anomaly detection rules based on processed data.

Expected Working Outcome: Fully operational solution demonstrable end-to-end within 3 hours, adhering strictly to technical constraints.

Evaluation Criteria: Functional completeness of Core MVP, algorithmic correctness, clean user experience, and 100% compliance with: ${restrictionRule.slice(0, 80)}.`;
};

/**
 * Generates fallback challenge directly from official curated challenge dataset when available.
 */
export const generateOfficialFallback = (theme, recentHistory = []) => {
  const validatedTheme = validateTheme(theme);
  const matches = getOfficialCuratedChallenges(validatedTheme);

  if (matches.length === 0) {
    return generateFallback(validatedTheme, recentHistory);
  }

  const recentSet = new Set(recentHistory);
  const unseen = matches.filter((m) => !recentSet.has(`${validatedTheme}:${m.title}`));
  const pool = unseen.length > 0 ? unseen : matches;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  const primaryResource = selected.resourcesProvided[0] || 'Official Dataset';
  const resourceName = primaryResource.length > 80 ? `${primaryResource.slice(0, 77)}...` : primaryResource;
  const isBrowserApi = /web speech|canvas|storage|indexeddb|notification|worker|clipboard/i.test(primaryResource);
  const restrictionRule = selected.restrictions.join('; ');

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
    curatedId: selected.id
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
    source: 'curated-fallback'
  };
};

export default {
  THEME_PROBLEM_AFFINITY,
  generateFallback,
  getOfficialCuratedChallenges,
  generateOfficialFallback
};
