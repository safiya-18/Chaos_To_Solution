import http from 'http';
import https from 'https';
import net from 'net';
import { validateUrlSafety } from './ssrfValidator.js';

export class FetchSecurityError extends Error {
  constructor(message, code = 'FETCH_SECURITY_ERROR') {
    super(message);
    this.name = 'FetchSecurityError';
    this.code = code;
  }
}

/**
 * Executes an HTTP or HTTPS request pinned strictly to a pre-validated IP address,
 * bypassing runtime DNS re-resolution to prevent DNS rebinding TOCTOU attacks.
 *
 * @param {Object} params
 * @param {string} params.targetUrl
 * @param {'GET'|'HEAD'} [params.method='GET']
 * @param {Record<string, string>} [params.headers]
 * @param {number} [params.timeoutMs=5000]
 * @param {number} [params.maxBytes=524288]
 * @param {string} params.pinnedIp
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ statusCode: number, headers: Record<string, string>, body: string, responseTimeMs: number }>}
 */
function performPinnedRequest({
  targetUrl,
  method = 'GET',
  headers = {},
  timeoutMs = 5000,
  maxBytes = 524288,
  pinnedIp,
  signal
}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;
    const defaultPort = isHttps ? 443 : 80;
    const port = parsed.port ? parseInt(parsed.port, 10) : defaultPort;
    const pinnedFamily = net.isIP(pinnedIp);

    let finished = false;

    const reqHeaders = {
      'User-Agent': 'ChaosToSolution-ResourceVerifier/1.0 (+https://github.com/safiya-18/Chaos_To_Solution)',
      Accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8',
      Host: parsed.host,
      ...headers
    };

    const reqOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port,
      path: parsed.pathname + parsed.search,
      method,
      headers: reqHeaders,
      // CRITICAL: Custom lookup pins socket strictly to the pre-validated IP address,
      // completely eliminating TOCTOU DNS rebinding windows.
      lookup: (hostname, lookupOpts, callback) => {
        if (lookupOpts && lookupOpts.all) {
          callback(null, [{ address: pinnedIp, family: pinnedFamily }]);
        } else {
          callback(null, pinnedIp, pinnedFamily);
        }
      },
      servername: parsed.hostname, // Preserves TLS SNI for certificate verification
      timeout: timeoutMs
    };

    const startTime = Date.now();
    let req;
    try {
      req = client.request(reqOptions);
    } catch (err) {
      return reject(new FetchSecurityError(`Request initialization failed: ${err.message}`, 'NETWORK_FAILURE'));
    }

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      req.destroy();
      reject(new FetchSecurityError(`Request to '${targetUrl}' timed out after ${timeoutMs}ms.`, 'REQUEST_TIMEOUT'));
    }, timeoutMs);

    let onAbort;
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        req.destroy();
        return reject(new FetchSecurityError(`Request to '${targetUrl}' was aborted.`, 'REQUEST_ABORTED'));
      }
      onAbort = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        req.destroy();
        reject(new FetchSecurityError(`Request to '${targetUrl}' was aborted.`, 'REQUEST_ABORTED'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    const cleanup = () => {
      clearTimeout(timer);
      if (signal && onAbort) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    req.on('timeout', () => {
      if (finished) return;
      finished = true;
      cleanup();
      req.destroy();
      reject(new FetchSecurityError(`Request to '${targetUrl}' timed out after ${timeoutMs}ms.`, 'REQUEST_TIMEOUT'));
    });

    req.on('response', (res) => {
      const responseTimeMs = Date.now() - startTime;
      const resHeaders = {};
      for (const [key, value] of Object.entries(res.headers)) {
        resHeaders[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value;
      }

      // Check Content-Length header early
      const reportedLength = parseInt(resHeaders['content-length'] || '0', 10);
      if (reportedLength > maxBytes) {
        cleanup();
        res.resume();
        req.destroy();
        if (!finished) {
          finished = true;
          reject(new FetchSecurityError(
            `Response declared Content-Length (${reportedLength} bytes) exceeds limit of ${maxBytes} bytes.`,
            'OVERSIZED_RESPONSE'
          ));
        }
        return;
      }

      // For redirects, drain and return early for outer redirect handler
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        cleanup();
        res.resume();
        if (!finished) {
          finished = true;
          resolve({
            statusCode: res.statusCode,
            headers: resHeaders,
            body: '',
            responseTimeMs
          });
        }
        return;
      }

      if (method === 'HEAD') {
        cleanup();
        res.resume();
        if (!finished) {
          finished = true;
          resolve({
            statusCode: res.statusCode,
            headers: resHeaders,
            body: '',
            responseTimeMs
          });
        }
        return;
      }

      let totalBytes = 0;
      const chunks = [];

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          cleanup();
          res.destroy();
          req.destroy();
          if (!finished) {
            finished = true;
            reject(new FetchSecurityError(
              `Response body exceeded maximum allowed limit of ${maxBytes} bytes.`,
              'OVERSIZED_RESPONSE'
            ));
          }
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        cleanup();
        if (finished) return;
        finished = true;
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: resHeaders,
          body: bodyBuffer.toString('utf-8'),
          responseTimeMs
        });
      });

      res.on('error', (err) => {
        cleanup();
        if (finished) return;
        finished = true;
        reject(new FetchSecurityError(`Response stream error: ${err.message}`, 'NETWORK_FAILURE'));
      });
    });

    req.on('error', (err) => {
      cleanup();
      if (finished) return;
      finished = true;
      if (err instanceof FetchSecurityError) {
        return reject(err);
      }
      reject(new FetchSecurityError(`Failed to fetch '${targetUrl}': ${err.message}`, 'NETWORK_FAILURE'));
    });

    req.end();
  });
}

/**
 * Safely fetches a URL with SSRF protection, connection pinning, manual redirect validation,
 * DNS rebinding checks, response size capping, and strict timeouts.
 *
 * @param {string} targetUrl
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=5000]
 * @param {number} [options.maxBytes=524288] - Default 512 KB
 * @param {number} [options.maxRedirects=5]
 * @param {'GET'|'HEAD'} [options.method='GET']
 * @param {Object} [options.headers]
 * @param {Function} [options.customFetch] - For testing mocking
 * @param {Function} [options.dnsLookup] - For testing mocking
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{
 *   statusCode: number,
 *   headers: Record<string, string>,
 *   body: string,
 *   finalUrl: string,
 *   resolvedIps: string[],
 *   responseTimeMs: number
 * }>}
 */
export async function safeFetch(targetUrl, options = {}) {
  const {
    timeoutMs = 5000,
    maxBytes = 524288,
    maxRedirects = 5,
    method = 'GET',
    headers = {},
    customFetch,
    dnsLookup,
    signal
  } = options;

  let currentUrl = targetUrl;
  let redirectsRemaining = maxRedirects;
  let finalIps = [];

  while (true) {
    // 1. SSRF and DNS check on current URL
    const safetyCheck = await validateUrlSafety(currentUrl, { dnsLookup });
    if (!safetyCheck.safe) {
      const code = safetyCheck.reason?.includes('DNS resolution failed') || safetyCheck.reason?.includes('DNS lookup returned no addresses')
        ? 'DNS_UNRESOLVED'
        : 'SSRF_PROHIBITED';
      throw new FetchSecurityError(
        `Destination rejected by SSRF guard: ${safetyCheck.reason}`,
        code
      );
    }
    finalIps = safetyCheck.ipAddresses;
    const pinnedIp = finalIps[0];

    let result;

    if (customFetch) {
      // Setup timeout and controller for customFetch mock
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const startTime = Date.now();

      try {
        const response = await customFetch(currentUrl, {
          method,
          headers: {
            'User-Agent': 'ChaosToSolution-ResourceVerifier/1.0 (+https://github.com/safiya-18/Chaos_To_Solution)',
            Accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8',
            ...headers
          },
          redirect: 'manual',
          signal: signal || controller.signal
        });

        clearTimeout(timer);
        const responseTimeMs = Date.now() - startTime;

        const resHeaders = {};
        if (response.headers && typeof response.headers.forEach === 'function') {
          response.headers.forEach((val, key) => {
            resHeaders[key.toLowerCase()] = val;
          });
        }

        const reportedLength = parseInt(resHeaders['content-length'] || '0', 10);
        if (reportedLength > maxBytes) {
          throw new FetchSecurityError(
            `Response declared Content-Length (${reportedLength} bytes) exceeds limit of ${maxBytes} bytes.`,
            'OVERSIZED_RESPONSE'
          );
        }

        let bodyText = '';
        if (method !== 'HEAD' && ![301, 302, 303, 307, 308].includes(response.status)) {
          if (typeof response.text === 'function') {
            bodyText = await response.text();
            if (Buffer.byteLength(bodyText, 'utf8') > maxBytes) {
              throw new FetchSecurityError(
                `Response body exceeded maximum allowed limit of ${maxBytes} bytes.`,
                'OVERSIZED_RESPONSE'
              );
            }
          }
        }

        result = {
          statusCode: response.status,
          headers: resHeaders,
          body: bodyText,
          responseTimeMs
        };
      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError' || err.code === 'ABORT_ERR') {
          throw new FetchSecurityError(
            `Request to '${currentUrl}' timed out after ${timeoutMs}ms.`,
            'REQUEST_TIMEOUT'
          );
        }
        if (err instanceof FetchSecurityError) {
          throw err;
        }
        throw new FetchSecurityError(
          `Failed to fetch '${currentUrl}': ${err.message}`,
          'NETWORK_FAILURE'
        );
      }
    } else {
      // Native pinned HTTP/HTTPS request enforcing IP connection-pinning
      result = await performPinnedRequest({
        targetUrl: currentUrl,
        method,
        headers,
        timeoutMs,
        maxBytes,
        pinnedIp,
        signal
      });
    }

    // 2. Handle Redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(result.statusCode)) {
      const location = result.headers['location'];
      if (!location) {
        throw new FetchSecurityError(
          `Redirect status ${result.statusCode} returned without Location header`,
          'INVALID_REDIRECT'
        );
      }

      if (redirectsRemaining <= 0) {
        throw new FetchSecurityError(
          `Maximum allowed redirects (${maxRedirects}) exceeded`,
          'TOO_MANY_REDIRECTS'
        );
      }

      redirectsRemaining--;
      try {
        currentUrl = new URL(location, currentUrl).href;
      } catch (err) {
        throw new FetchSecurityError(
          `Invalid redirect Location: ${location} (${err.message})`,
          'INVALID_REDIRECT'
        );
      }
      continue; // Re-validate redirect target through SSRF guard and re-pin IP
    }

    return {
      statusCode: result.statusCode,
      headers: result.headers,
      body: result.body,
      finalUrl: currentUrl,
      resolvedIps: finalIps,
      responseTimeMs: result.responseTimeMs
    };
  }
}

export default {
  safeFetch,
  FetchSecurityError
};
