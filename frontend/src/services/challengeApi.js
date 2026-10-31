/**
 * Challenge API Client Service.
 * Manages communication with Safiya's backend REST service or delegates to mock service.
 */

import { fetchMockChallenge } from './mockChallengeApi.js';
import { validateChallenge } from '../utils/validateChallenge.js';

// Configuration
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If explicitly set to something other than localhost (e.g. Render production URL), use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  // When accessed via active Cloudflare quick tunnel, route to backend tunnel
  if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname.endsWith('trycloudflare.com')) {
    return 'https://fellow-realm-remarks-chairman.trycloudflare.com';
  }
  // When accessed on Vercel production or preview domain, route to Render production backend
  if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname.endsWith('vercel.app')) {
    return 'https://cts-backend-iywa.onrender.com';
  }
  // When accessed from a tablet or mobile device over LAN (e.g. 192.168.x.x), connect to backend on the same LAN IP
  const isLan =
    typeof window !== 'undefined' &&
    window.location?.hostname &&
    (/^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname) || window.location.hostname.endsWith('.local'));
  if (isLan && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return envUrl || 'http://localhost:5000';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const IS_MOCK_ENABLED_BY_DEFAULT =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_USE_MOCK === '1';

const REQUEST_TIMEOUT_MS = 15000;

/**
 * Registers a team and generates its challenge assignment with MongoDB persistence.
 *
 * @param {string} teamName - The team's registered name
 * @param {string} theme - The selected hackathon theme
 * @param {object} [options]
 * @param {boolean} [options.useMock=false] - Whether to use local mock fixtures
 * @param {AbortSignal} [options.signal] - Optional external AbortSignal
 * @returns {Promise<object>} Validated challenge data with team assignment
 */
export async function registerTeamAndGenerate(teamName, theme, options = {}) {
  const { useMock = false, signal: externalSignal } = options;

  if (useMock) {
    const mock = await fetchMockChallenge(theme);
    return {
      ...mock,
      teamName: teamName?.trim() || 'Mock Team',
      isOfflinePreview: true
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`));
  }, REQUEST_TIMEOUT_MS);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason));
  }

  try {
    const endpoint = `${API_BASE_URL}/api/teams`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ teamName: teamName?.trim(), theme }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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
      const err = new Error(serverErrMsg);
      err.code = json?.error?.code || 'REGISTRATION_FAILED';
      err.status = response.status;
      throw err;
    }

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

    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error(
        `Unable to reach backend at ${API_BASE_URL}. Ensure the server is running or switch to Mock Mode.`
      );
    }

    throw err;
  }
}

/**
 * Fetches the current authoritative shared event timer state from the backend.
 *
 * @returns {Promise<object|null>} Authoritative timer state or null on failure
 */
export async function fetchEventTimerState() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/event-timer`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/**
 * Generates a challenge for the specified theme without team registration (legacy compatibility).
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

    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error(
        `Unable to reach backend at ${API_BASE_URL}. Ensure the server is running or switch to Mock Mode.`
      );
    }

    throw err;
  }
}

/**
 * Fetches the list of persisted team challenge assignments.
 */
export async function fetchTeamsList(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.theme && params.theme !== 'All') query.set('theme', params.theme);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : '';

  try {
    const response = await fetch(`${API_BASE_URL}/api/teams${queryString}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Failed to fetch teams (${response.status})`);
    }

    const json = await response.json();
    return json?.data || { teams: [], total: 0, page: 1, totalPages: 1 };
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error(`Unable to reach backend at ${API_BASE_URL}. Ensure the backend server is running.`);
    }
    throw err;
  }
}

/**
 * Sends an authorized timer mutation request to the backend.
 */
async function mutateEventTimer(action, adminToken) {
  if (!adminToken || typeof adminToken !== 'string') {
    throw new Error('Operator admin token is required.');
  }

  const response = await fetch(`${API_BASE_URL}/api/event-timer/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${adminToken.trim()}`
    }
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json?.error?.message || `Timer action '${action}' failed with HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.code = json?.error?.code || 'TIMER_MUTATION_FAILED';
    throw error;
  }

  return json?.data || null;
}

export function startEventTimer(adminToken) {
  return mutateEventTimer('start', adminToken);
}

export function pauseEventTimer(adminToken) {
  return mutateEventTimer('pause', adminToken);
}

export function resumeEventTimer(adminToken) {
  return mutateEventTimer('resume', adminToken);
}

export function resetEventTimer(adminToken) {
  return mutateEventTimer('reset', adminToken);
}

/**
 * Deletes a registered team assignment from the backend.
 *
 * @param {string} identifier - MongoDB _id or team name
 * @returns {Promise<object>}
 */
export async function deleteTeamAssignment(identifier, adminToken = '') {
  if (!identifier) throw new Error('Team identifier is required.');

  const headers = { Accept: 'application/json' };
  if (adminToken && typeof adminToken === 'string' && adminToken.trim()) {
    headers.Authorization = `Bearer ${adminToken.trim()}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/teams/${encodeURIComponent(identifier)}`, {
    method: 'DELETE',
    headers
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json?.error?.message || `Failed to delete team (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.code = json?.error?.code || 'DELETE_TEAM_FAILED';
    throw error;
  }

  return json?.data || null;
}

