/**
 * Challenge API Client Service.
 * Manages communication with Safiya's backend REST service or delegates to mock service.
 */

import { fetchMockChallenge } from './mockChallengeApi.js';
import { validateChallenge } from '../utils/validateChallenge.js';

// Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const IS_MOCK_ENABLED_BY_DEFAULT =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_USE_MOCK === '1';

const REQUEST_TIMEOUT_MS = 15000;

/**
 * Generates a challenge for the specified theme.
 *
 * @param {string} theme - The selected hackathon theme
 * @param {object} [options]
 * @param {boolean} [options.useMock=false] - Whether to bypass network and use local mock
 * @param {AbortSignal} [options.signal] - Optional external AbortSignal
 * @returns {Promise<object>} Validated challenge data
 */
export async function generateChallenge(theme, options = {}) {
  const { useMock = false, signal: externalSignal } = options;

  if (useMock) {
    return await fetchMockChallenge(theme);
  }

  // Network call with timeout guard
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
  }, REQUEST_TIMEOUT_MS);

  // If caller passed an external signal, propagate abort
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason));
  }

  try {
    const endpoint = `${API_BASE_URL}/api/challenges/generate`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ theme }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Parse response
    let json;
    try {
      json = await response.json();
    } catch {
      throw new Error(`Server returned malformed response (${response.status} ${response.statusText}).`);
    }

    if (!response.ok) {
      const serverErrMsg =
        json?.error?.message ||
        json?.message ||
        `Backend request failed with HTTP ${response.status} (${response.statusText})`;
      throw new Error(serverErrMsg);
    }

    // Validate structure against contract
    const validation = validateChallenge(json);
    if (!validation.isValid) {
      throw new Error(`Data format error: ${validation.error}`);
    }

    return validation.data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error(
        'The backend server took too long to respond. Please check your connection and retry.'
      );
    }

    // Pass through exact message or friendly network error
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error(
        `Unable to reach backend at ${API_BASE_URL}. Ensure the server is running or switch to Mock Mode.`
      );
    }

    throw err;
  }
}
