/**
 * Mock API service simulating backend challenge generation.
 * Used when mock mode is enabled or when running independently without backend.
 */

import { MOCK_CHALLENGES } from '../data/mockChallenges.js';
import { validateChallenge } from '../utils/validateChallenge.js';

// Track index to alternate between fixtures on regeneration
const themeRotationIndex = {};

/**
 * Simulates an API call to generate a challenge for the chosen theme.
 * @param {string} theme - One of the 8 valid themes
 * @param {number} [delayMs=650] - Simulated network delay
 * @returns {Promise<object>} Validated challenge data
 */
export async function fetchMockChallenge(
  theme,
  delayMs = import.meta.env.MODE === 'test' ? 20 : 650
) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const fixtures = MOCK_CHALLENGES[theme];
  if (!fixtures || fixtures.length === 0) {
    throw new Error(`No mock fixtures found for theme: ${theme}`);
  }

  // Rotate between available fixtures
  const currentIndex = themeRotationIndex[theme] || 0;
  const fixture = fixtures[currentIndex % fixtures.length];
  themeRotationIndex[theme] = currentIndex + 1;

  // Clone and stamp with fresh generation timestamp
  const mockPayload = {
    success: true,
    data: {
      ...fixture,
      generatedAt: new Date().toISOString()
    }
  };

  const validation = validateChallenge(mockPayload);
  if (!validation.isValid) {
    throw new Error(`Mock fixture validation failed: ${validation.error}`);
  }

  return validation.data;
}
