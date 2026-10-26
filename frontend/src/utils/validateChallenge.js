/**
 * Validates a challenge payload received from the API or mock service.
 * Enforces the contract required by Chaos to Solution.
 */

const VALID_THEMES = [
  'EdTech',
  'FinTech',
  'HealthTech',
  'Sustainability',
  'Smart Cities',
  'Accessibility',
  'E-commerce',
  'Open Innovation'
];

/**
 * Validates an URL string
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates the full challenge payload
 * @param {any} response - The API response object (e.g. { success: true, data: { ... } } or raw data)
 * @returns {{ isValid: boolean, error: string | null, data: object | null }}
 */
export function validateChallenge(response) {
  if (!response || typeof response !== 'object') {
    return {
      isValid: false,
      error: 'Invalid response format: expected a JSON object.',
      data: null
    };
  }

  // Handle both enveloped { success: true, data: { ... } } and direct challenge data
  let data = response;
  if ('success' in response) {
    if (response.success !== true) {
      const errMsg = response.error?.message || 'Server indicated generation was not successful.';
      return {
        isValid: false,
        error: errMsg,
        data: null
      };
    }
    data = response.data;
  }

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: 'Missing or malformed challenge data payload.',
      data: null
    };
  }

  // Validate theme
  if (!data.theme || typeof data.theme !== 'string' || !VALID_THEMES.includes(data.theme)) {
    return {
      isValid: false,
      error: `Invalid or missing theme. Expected one of: ${VALID_THEMES.join(', ')}.`,
      data: null
    };
  }

  // Validate source
  const validSources = ['ai', 'curated-fallback'];
  const source = data.source && validSources.includes(data.source) ? data.source : 'curated-fallback';

  // Validate challenge container
  const challenge = data.challenge;
  if (!challenge || typeof challenge !== 'object') {
    return {
      isValid: false,
      error: 'Challenge payload is missing the core challenge object.',
      data: null
    };
  }

  // 1. Problem validation
  if (
    !challenge.problem ||
    typeof challenge.problem !== 'object' ||
    typeof challenge.problem.title !== 'string' ||
    !challenge.problem.title.trim() ||
    typeof challenge.problem.statement !== 'string' ||
    !challenge.problem.statement.trim()
  ) {
    return {
      isValid: false,
      error: 'Invalid or missing problem statement in challenge payload.',
      data: null
    };
  }

  // 2. Restriction validation
  if (
    !challenge.restriction ||
    typeof challenge.restriction !== 'object' ||
    typeof challenge.restriction.name !== 'string' ||
    !challenge.restriction.name.trim() ||
    typeof challenge.restriction.rule !== 'string' ||
    !challenge.restriction.rule.trim()
  ) {
    return {
      isValid: false,
      error: 'Invalid or missing restriction in challenge payload.',
      data: null
    };
  }

  // 3. Resource validation
  if (
    !challenge.resource ||
    typeof challenge.resource !== 'object' ||
    typeof challenge.resource.name !== 'string' ||
    !challenge.resource.name.trim() ||
    typeof challenge.resource.guidance !== 'string' ||
    !challenge.resource.guidance.trim() ||
    typeof challenge.resource.docsUrl !== 'string' ||
    !isValidUrl(challenge.resource.docsUrl)
  ) {
    return {
      isValid: false,
      error: 'Invalid or missing resource details or documentation URL in challenge payload.',
      data: null
    };
  }

  // 4. Expected Deliverable validation
  if (
    typeof challenge.deliverable !== 'string' ||
    !challenge.deliverable.trim()
  ) {
    return {
      isValid: false,
      error: 'Invalid or missing expected deliverable in challenge payload.',
      data: null
    };
  }

  // Normalize returned structure
  const normalizedData = {
    id: data.id || `cts-${data.theme.toLowerCase().replace(/\s+/g, '')}-${Date.now().toString(36)}`,
    theme: data.theme,
    generatedAt: data.generatedAt || new Date().toISOString(),
    source,
    challenge: {
      problem: {
        title: challenge.problem.title.trim(),
        statement: challenge.problem.statement.trim()
      },
      restriction: {
        name: challenge.restriction.name.trim(),
        rule: challenge.restriction.rule.trim()
      },
      resource: {
        name: challenge.resource.name.trim(),
        type: challenge.resource.type || 'resource',
        guidance: challenge.resource.guidance.trim(),
        docsUrl: challenge.resource.docsUrl.trim()
      },
      deliverable: challenge.deliverable.trim()
    }
  };

  return {
    isValid: true,
    error: null,
    data: normalizedData
  };
}
