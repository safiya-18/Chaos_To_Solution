/**
 * Theme-Specific Constraint Validator for Chaos to Solution (CTS)
 * Enforces non-negotiable hackathon boundaries across the four core themes:
 * - FinTech (10 challenges)
 * - Sustainability (10 challenges)
 * - EdTech (10 challenges)
 * - Open Innovation (10 challenges)
 */

export const THEME_CONSTRAINT_POLICIES = Object.freeze({
  FinTech: {
    disallowedRules: [
      { pattern: /live upi|banking credentials/i, reason: 'No real banking credentials or live UPI data' },
      { pattern: /payment gateway|backend.*settlement/i, reason: 'Settlements must be client-side only (no external payment gateways or backend server)' },
      { pattern: /external ml api/i, reason: 'Rule-based anomaly detection only (no external ML APIs)' },
      { pattern: /crypto token|real-world fiat/i, reason: 'Fictional time-credits only without real-world fiat or crypto conversion' }
    ],
    maxPageSizeMb: 1.0
  },

  Sustainability: {
    disallowedRules: [
      { pattern: /hardware scale|physical load cell/i, reason: 'Simulated mess records only without live hardware scale integration' },
      { pattern: /live gps tracking/i, reason: 'No live GPS tracking' },
      { pattern: /paid.*gis/i, reason: 'Transparent mathematical formulas only (no paid GIS APIs or paid external mapping allowed)' },
      { pattern: /cash transaction|cash payment|resale/i, reason: 'No cash transactions allowed (donations or barters only)' },
      { pattern: /live.*solar.*irradiance|certified utility/i, reason: 'Do not claim real-time solar irradiance or certified utility contracts' }
    ],
    maxAssetSizeMb: 1.5
  },

  EdTech: {
    disallowedRules: [
      { pattern: /execute.*code on.*server|arbitrary.*code.*server/i, reason: 'Must use supplied error library; do not execute arbitrary submitted code on a server' },
      { pattern: /student login|lms integration/i, reason: 'Process only supplied sample documents; no student login or LMS integration' },
      { pattern: /popularity rankings|student ranking|direct messaging/i, reason: 'No personal identifiers, public popularity rankings, or direct messaging' },
      { pattern: /paid translation/i, reason: 'No paid translation services' }
    ],
    maxAssetSizeMb: 2.0
  },

  'Open Innovation': {
    disallowedRules: [
      { pattern: /guarantee.*route.*safe/i, reason: 'Must clearly label simulated safety information and not guarantee a route is safe' },
      { pattern: /facial recognition|vehicle tracking|live camera feed/i, reason: 'No live camera feeds, facial recognition, or vehicle tracking' },
      { pattern: /guarantee.*food safety/i, reason: 'Display known allergens and deadlines without guaranteeing food safety' },
      { pattern: /unsupported accessibility/i, reason: 'Only recommend paths supported by supplied accessibility data (no unsupported claims)' },
      { pattern: /external calendar/i, reason: 'Must prevent overlapping confirmed bookings locally (no external calendar integration)' },
      { pattern: /medical diagnos|emergency medical advice/i, reason: 'Do not provide medical diagnoses or emergency medical advice' },
      { pattern: /claim live.*air/i, reason: 'Do not claim live air monitoring' }
    ]
  }
});

/**
 * Checks if a prohibited pattern appears affirmatively rather than as a negated rule/disclaimer.
 *
 * @param {string} text - Candidate text
 * @param {RegExp|string} pattern - Pattern to search for
 * @returns {boolean} True if pattern appears without preceding negation
 */
export function hasAffirmativeViolation(text, pattern) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  const match = regex.exec(lower);
  if (!match) return false;

  const matchIndex = match.index;
  const lookback = lower.slice(Math.max(0, matchIndex - 50), matchIndex);
  const isNegated = /\b(no|not|do not|does not|must not|never|without|zero|prohibit|prohibits|prohibited|forbid|forbidden|avoid|prevent|excluding)\b[\w\s,;-]*$/.test(lookback);

  return !isNegated;
}

/**
 * Validates a challenge candidate against theme-specific official restrictions.
 *
 * @param {Object} challenge - Full challenge object (problem, restriction, resource, deliverable)
 * @param {string} theme - Theme name
 * @returns {{ passed: boolean, violations: string[] }}
 */
export function validateThemeConstraints(challenge, theme) {
  const targetTheme = theme || challenge?.theme;
  const policy = THEME_CONSTRAINT_POLICIES[targetTheme];
  const violations = [];

  if (!policy) {
    // If not one of the 4 enhanced themes, no domain-specific policy applies
    return { passed: true, violations: [] };
  }

  const combinedText = [
    challenge?.problem?.title,
    challenge?.problem?.statement,
    challenge?.restriction?.name,
    challenge?.restriction?.rule,
    challenge?.resource?.name,
    challenge?.resource?.guidance,
    challenge?.deliverable
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Evaluate affirmative violations across policy rules
  if (Array.isArray(policy.disallowedRules)) {
    for (const rule of policy.disallowedRules) {
      if (hasAffirmativeViolation(combinedText, rule.pattern)) {
        violations.push(`Theme [${targetTheme}] violation: ${rule.reason}`);
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Returns a concise guidance string for prompting AI models with theme constraints.
 *
 * @param {string} theme
 * @returns {string}
 */
export function getThemeConstraintGuidelines(theme) {
  switch (theme) {
    case 'FinTech':
      return 'FINTECH MANDATES: Client-side settlements only (no payment gateways/server); rule-based fraud detection only (no ML APIs); simulated wallet/mock logs only (no live UPI/banking credentials); offline compound interest/budgeting (under 1 MB). Fictional time-credits only.';
    case 'Sustainability':
      return 'SUSTAINABILITY MANDATES: Simulated mess/sensor logs only (no live scales/hardware); mobile-first 5-inch usability; transparent formulas without paid GIS; no live GPS tracking; WCAG AA contrast & screen-reader support; zero-cash donation/barter only; under 1.5 MB total asset size.';
    case 'EdTech':
      return 'EDTECH MANDATES: Display original notes alongside simplified text; image alt-text with keyboard navigation; rule-based prioritization without paid APIs; preserve technical terms; no LMS/student login; anonymous doubts without rankings; never execute submitted code on server; under 2 MB.';
    case 'Open Innovation':
      return 'OPEN INNOVATION MANDATES: Clearly label simulated safety without route safety guarantees; simulated sensors only; static web app without PII; no camera/vehicle tracking; display allergens without food safety guarantees; step-free routes based on supplied data only; no medical diagnoses; label unverified translations as draft.';
    default:
      return '';
  }
}

export default {
  THEME_CONSTRAINT_POLICIES,
  hasAffirmativeViolation,
  validateThemeConstraints,
  getThemeConstraintGuidelines
};
