/**
 * WhatsApp share text formatter and challenge ID generator.
 * Formats challenge details into clean, WhatsApp-friendly text.
 */

/**
 * Generates a unique, collision-resistant challenge identifier.
 * Format: cts-<theme_slug>-<random_base36>
 *
 * @param {string} theme - Challenge theme
 * @returns {string} Unique challenge ID
 */
export function generateChallengeId(theme = 'challenge') {
  const cleanTheme = String(theme).toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `cts-${cleanTheme || 'gen'}-${timestamp}${randomSuffix}`;
}

/**
 * Formats challenge data into structured text suitable for sharing via WhatsApp.
 *
 * @param {object} params
 * @param {string} params.id - Unique challenge ID
 * @param {string} params.theme - Selected hackathon theme
 * @param {string} params.source - 'ai' | 'curated-fallback'
 * @param {object} params.challenge - Challenge triad (problem, restriction, resource, deliverable)
 * @returns {string} Clean WhatsApp-formatted text
 */
export function formatChallengeForWhatsApp({ id, theme, source, challenge } = {}) {
  if (!challenge || typeof challenge !== 'object') {
    return '';
  }

  const { problem = {}, restriction = {}, resource = {}, deliverable = '' } = challenge;
  const sourceLabel = source === 'ai' ? 'AI Generated' : 'Backup Challenge';
  const resourceType = resource.type ? ` (${resource.type})` : '';

  const lines = [
    '⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡',
    '_IEEE Computer Society | SJC Institute of Technology_',
    '',
    `🏷️ *Theme:* ${theme || 'General'}`,
    `🆔 *Challenge ID:* #${id} [${sourceLabel}]`,
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '📌 *01 — PROBLEM STATEMENT*',
    `*${problem.title || 'Untitled Problem'}*`,
    problem.statement || '',
    '',
    '⚠️ *02 — TECHNICAL RESTRICTION*',
    `*${restriction.name || 'Standard Constraint'}*`,
    `Rule: ${restriction.rule || 'Follow standard hackathon rules.'}`,
    '',
    '🛠️ *03 — RESOURCE*',
    `*${resource.name || 'Official Documentation'}*${resourceType}`,
    `Guidance: ${resource.guidance || 'Integrate this resource into your prototype solution.'}`,
    `Docs: ${resource.docsUrl || 'https://developer.mozilla.org'}`,
    '',
    '🎯 *04 — EXPECTED DELIVERABLE*',
    deliverable || 'A working prototype demonstrating the solution within ~3 hours.',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '💡 *Sprint Time:* ~3 hours',
    'Ready to build? Turn chaos into solution!'
  ];

  return lines.join('\n');
}

export default {
  generateChallengeId,
  formatChallengeForWhatsApp
};
