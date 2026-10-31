export const APPROVED_THEMES = Object.freeze([
  'EdTech',
  'FinTech',
  'HealthTech',
  'Sustainability',
  'Smart Cities',
  'Accessibility',
  'E-commerce',
  'Open Innovation'
]);

export class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.statusCode = 400;
  }
}

export const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'string' || !APPROVED_THEMES.includes(theme.trim())) {
    throw new ValidationError(
      `Invalid theme '${theme}'. Must be one of: ${APPROVED_THEMES.join(', ')}`,
      'INVALID_THEME'
    );
  }
  return theme.trim();
};

export const BANNED_SERVICE_KEYWORDS = Object.freeze([
  'openai',
  'chatgpt',
  'gpt-4',
  'aws',
  'azure',
  'gcp',
  'stripe',
  'twilio',
  'sendgrid',
  'paid api',
  'subscription',
  'credit card',
  'raspberry pi',
  'arduino',
  'bluetooth sensor'
]);

const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function isKeywordDisallowed(fullText, bannedKeyword) {
  if (typeof fullText !== 'string' || !fullText) return false;
  const lower = fullText.toLowerCase();
  let idx = 0;

  while ((idx = lower.indexOf(bannedKeyword, idx)) !== -1) {
    const lookback = lower.slice(Math.max(0, idx - 120), idx);
    const lookahead = lower.slice(idx + bannedKeyword.length, Math.min(lower.length, idx + bannedKeyword.length + 80));

    const isBackwardNegated = /\b(no|not|without|never|zero|free of|prevent|prevents|prohibit|prohibits|prohibited|disallow|disallows|disallowed|banned|forbidden|avoid|avoids|avoiding)\b[\w\s,;:'"()-]*$/.test(lookback);
    const isForwardNegated = /^[\w\s,;:'"()-]*\b(is|are|shall be)?\s*(not allowed|prohibited|forbidden|banned|disallowed|avoided)\b/.test(lookahead);
    const isSubscriptionTracker = bannedKeyword === 'subscription' && /audit|track|cancel|unnoticed|drain/i.test(lower);

    if (!isBackwardNegated && !isForwardNegated && !isSubscriptionTracker) {
      return true;
    }

    idx += bannedKeyword.length;
  }

  return false;
}

const checkStringLength = (val, min, max, fieldName, errors) => {
  if (typeof val !== 'string' || val.trim().length < min || val.trim().length > max) {
    errors.push(
      `${fieldName} must be a string between ${min} and ${max} characters (got ${typeof val === 'string' ? val.trim().length : typeof val}).`
    );
  }
};

export const validateChallenge = (challenge, requestedTheme) => {
  const errors = [];

  if (!challenge || typeof challenge !== 'object') {
    return {
      isValid: false,
      errors: ['Challenge payload must be a non-null object.']
    };
  }

  // 1. Theme validation
  if (!challenge.theme || challenge.theme !== requestedTheme) {
    errors.push(`Challenge theme '${challenge.theme}' does not match requested theme '${requestedTheme}'.`);
  }
  if (!APPROVED_THEMES.includes(challenge.theme)) {
    errors.push(`Challenge theme '${challenge.theme}' is not an approved theme.`);
  }

  // 2. Problem validation
  if (!challenge.problem || typeof challenge.problem !== 'object') {
    errors.push('Challenge missing valid problem object.');
  } else {
    checkStringLength(challenge.problem.title, 3, 100, 'problem.title', errors);
    checkStringLength(challenge.problem.statement, 10, 500, 'problem.statement', errors);
  }

  // 3. Restriction validation
  if (!challenge.restriction || typeof challenge.restriction !== 'object') {
    errors.push('Challenge missing valid restriction object.');
  } else {
    checkStringLength(challenge.restriction.name, 3, 100, 'restriction.name', errors);
    checkStringLength(challenge.restriction.rule, 10, 500, 'restriction.rule', errors);
  }

  // 4. Resource validation
  const validResourceTypes = ['browser-api', 'public-api', 'local-dataset'];
  if (!challenge.resource || typeof challenge.resource !== 'object') {
    errors.push('Challenge missing valid resource object.');
  } else {
    checkStringLength(challenge.resource.name, 2, 100, 'resource.name', errors);
    if (!validResourceTypes.includes(challenge.resource.type)) {
      errors.push(
        `resource.type '${challenge.resource.type}' is invalid. Must be one of: ${validResourceTypes.join(', ')}.`
      );
    }
    checkStringLength(challenge.resource.guidance, 10, 500, 'resource.guidance', errors);
    if (!isValidUrl(challenge.resource.docsUrl)) {
      errors.push(`resource.docsUrl '${challenge.resource.docsUrl}' is not a valid HTTP/HTTPS URL.`);
    }
  }

  // 5. Deliverable validation (allows rich multi-component deliverables up to 1500 chars)
  checkStringLength(challenge.deliverable, 10, 1500, 'deliverable', errors);

  // 6. Banned keywords / paid services check across all text
  const fullText = [
    challenge.problem?.title,
    challenge.problem?.statement,
    challenge.restriction?.name,
    challenge.restriction?.rule,
    challenge.resource?.name,
    challenge.resource?.guidance,
    challenge.deliverable
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  BANNED_SERVICE_KEYWORDS.forEach((bannedKeyword) => {
    if (isKeywordDisallowed(fullText, bannedKeyword)) {
      errors.push(
        `Challenge references disallowed paid/proprietary or hardware dependency: '${bannedKeyword}'.`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  APPROVED_THEMES,
  BANNED_SERVICE_KEYWORDS,
  ValidationError,
  validateTheme,
  validateChallenge,
  isKeywordDisallowed
};
