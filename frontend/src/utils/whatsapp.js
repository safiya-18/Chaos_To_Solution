/**
 * WhatsApp integration utilities for Chaos to Solution.
 * Handles Indian mobile number validation, normalization, message formatting, and click-to-chat URL generation.
 */

/**
 * Validates and normalizes an Indian mobile phone number.
 * Accepts optional leading +91, 91, or 0.
 * Normalizes to international standard without '+' prefix (e.g., 919876543210).
 *
 * @param {string} input - Raw phone number entered by user
 * @returns {{ isValid: boolean, normalizedNumber: string, error: string | null }}
 */
export function validateIndianPhoneNumber(input) {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalizedNumber: '',
      error: 'Please enter a 10-digit mobile number.'
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedNumber: '',
      error: 'Please enter a 10-digit mobile number.'
    };
  }

  // Remove spaces, hyphens, and parentheses
  let digits = trimmed.replace(/[\s\-()]/g, '');

  // Strip leading plus
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // If user entered with 91 prefix (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // If user entered with leading 0 (STD trunk prefix)
    digits = digits.slice(1);
  }

  // Check if non-digits remain
  if (!/^\d+$/.test(digits)) {
    return {
      isValid: false,
      normalizedNumber: '',
      error: 'Phone number must contain only numerical digits.'
    };
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      normalizedNumber: '',
      error: `Please enter a valid 10-digit mobile number (entered ${digits.length} digits).`
    };
  }

  // Indian mobile numbers must start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      normalizedNumber: '',
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9.'
    };
  }

  return {
    isValid: true,
    normalizedNumber: `91${digits}`,
    error: null
  };
}

/**
 * Formats the challenge details into a clean, WhatsApp-friendly text message.
 *
 * @param {object} challengeData - Normalized challenge data
 * @returns {string} Formatted text message
 */
export function formatChallengeForWhatsApp(challengeData) {
  if (!challengeData || !challengeData.challenge) {
    return '';
  }

  const { id, theme, source, challenge } = challengeData;
  const { problem, restriction, resource, deliverable } = challenge;

  const sourceLabel = source === 'ai' ? 'AI Generated' : 'Backup Challenge';

  const lines = [
    '*CHAOS TO SOLUTION — AI Challenge*',
    '_IEEE Computer Society_',
    '----------------------------------------',
    `*Theme:* ${theme || 'General'}`,
    ...(challengeData.teamName ? [`*Team:* ${challengeData.teamName}`] : []),
    `*Challenge ID:* #${id} [${sourceLabel}]`,
    '----------------------------------------',
    '',
    '*01. PROBLEM STATEMENT*',
    `*${problem?.title || 'Untitled Problem'}*`,
    problem?.statement || '',
    '',
    '*02. TECHNICAL RESTRICTION*',
    `*${restriction?.name || 'Standard Constraint'}*`,
    `Rule: ${restriction?.rule || 'Follow standard hackathon rules.'}`,
    '',
    '*03. PRESCRIBED RESOURCE*',
    `*${resource?.name || 'Official Documentation'}* (${resource?.type || 'resource'})`,
    `Guidance: ${resource?.guidance || ''}`,
    `Docs: ${resource?.docsUrl || ''}`,
    '',
    '*04. EXPECTED DELIVERABLE*',
    deliverable || '',
    '',
    '----------------------------------------',
    '*Sprint Time:* ~4 hours',
    'Ready to build? Turn chaos into solution!'
  ];

  return lines.join('\n');
}

/**
 * Builds the complete WhatsApp click-to-chat URL.
 * Uses direct api.whatsapp.com/send to prevent wa.me 302 redirect from stripping newlines and mangling characters.
 *
 * @param {string} rawPhoneNumber - Raw phone number input
 * @param {object} challengeData - Validated challenge data
 * @returns {{ url: string | null, error: string | null }}
 */
export function buildWhatsAppShareUrl(rawPhoneNumber, challengeData) {
  const phoneValidation = validateIndianPhoneNumber(rawPhoneNumber);
  if (!phoneValidation.isValid) {
    return {
      url: null,
      error: phoneValidation.error
    };
  }

  const message = formatChallengeForWhatsApp(challengeData);
  if (!message) {
    return {
      url: null,
      error: 'Cannot share empty or invalid challenge data.'
    };
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://api.whatsapp.com/send?phone=${phoneValidation.normalizedNumber}&text=${encodedMessage}`;

  return {
    url,
    error: null
  };
}
