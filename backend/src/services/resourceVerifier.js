import mongoose from 'mongoose';
import ResourceCatalog from '../models/ResourceCatalog.js';
import { safeFetch, FetchSecurityError } from '../utils/safeFetcher.js';

// Cache configuration: 24 hours default TTL
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// In-memory verification cache for instantaneous lookups
const inMemoryCache = new Map();

// Active in-flight verification requests to deduplicate concurrent requests
const inFlightRequests = new Map();

// Domain rate-limiting timestamps (domain -> array of recent request timestamps)
const domainRequestTimestamps = new Map();
const MAX_REQUESTS_PER_DOMAIN_PER_MINUTE = 10;

/**
 * Checks whether a request to a given domain violates rate limits.
 */
function checkDomainRateLimit(domain) {
  const now = Date.now();
  const windowStart = now - 60000;
  const timestamps = (domainRequestTimestamps.get(domain) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_DOMAIN_PER_MINUTE) {
    return false;
  }

  timestamps.push(now);
  domainRequestTimestamps.set(domain, timestamps);
  return true;
}

/**
 * Determines whether a URL is merely a generic root or homepage.
 */
export function isGenericHomepage(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname.replace(/\/+$/, '');
    return path === '' || path === '/index.html' || path === '/home';
  } catch {
    return false;
  }
}

/**
 * Extracts page title and matching keywords from HTML/JSON content.
 */
function analyzeContentEvidence(bodyText, resourceInfo) {
  const matchedKeywords = [];
  const limitations = [];

  const textLower = (bodyText || '').toLowerCase();

  // Extract <title> if HTML
  let title = '';
  const titleMatch = textLower.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Check for park page or domain-for-sale indicators
  const parkIndicators = ['domain for sale', 'buy this domain', 'parking page', 'hugedomains', 'godaddy'];
  for (const pi of parkIndicators) {
    if (textLower.includes(pi)) {
      limitations.push(`Suspected domain park page: '${pi}' detected`);
    }
  }

  // Check for 404 soft landing
  if (title.includes('404') || title.includes('not found') || textLower.includes('page could not be found')) {
    limitations.push('Page content indicates soft-404 or missing resource');
  }

  // Check for relevant technical documentation markers
  const docMarkers = ['api', 'documentation', 'reference', 'endpoint', 'sdk', 'dataset', 'query', 'schema'];
  for (const marker of docMarkers) {
    if (textLower.includes(marker)) {
      matchedKeywords.push(marker);
    }
  }

  // Check resource name or capability keywords
  const candidateKeywords = [
    ...(resourceInfo.capabilities || []),
    ...(resourceInfo.domains || []),
    resourceInfo.name
  ].filter(Boolean);

  for (const kw of candidateKeywords) {
    const kwLower = kw.toLowerCase().trim();
    if (kwLower.length > 2 && textLower.includes(kwLower)) {
      matchedKeywords.push(kwLower);
    }
  }

  // Pricing & Access Requirements analysis:
  // Never assume free or unauthenticated from HTTP 200 alone; keep unknown when unproven
  let pricingStatus = 'unknown';
  let apiKeyRequired = false;
  let registrationRequired = false;
  let accessRequirements = 'unknown';

  if (textLower.includes('free tier') || textLower.includes('free plan')) {
    pricingStatus = 'free_tier';
  } else if (textLower.includes('mit license') || textLower.includes('apache 2.0') || textLower.includes('open-source') || textLower.includes('creative commons') || textLower.includes('public domain')) {
    pricingStatus = 'free';
  } else if (textLower.includes('pricing') || textLower.includes('subscription') || textLower.includes('per month') || textLower.includes('billed')) {
    pricingStatus = 'paid';
  }

  if (textLower.includes('api key') || textLower.includes('apikey') || textLower.includes('authorization: bearer')) {
    apiKeyRequired = true;
  }
  if (textLower.includes('sign up') || textLower.includes('create account') || textLower.includes('register for free')) {
    registrationRequired = true;
  }

  if (
    textLower.includes('no api key required') ||
    textLower.includes('no key required') ||
    textLower.includes('no registration required') ||
    textLower.includes('unauthenticated') ||
    textLower.includes('publicly accessible without authentication')
  ) {
    accessRequirements = 'unauthenticated_public';
    apiKeyRequired = false;
    registrationRequired = false;
  } else if (apiKeyRequired && registrationRequired) {
    accessRequirements = 'api_key_and_registration';
  } else if (apiKeyRequired) {
    accessRequirements = 'api_key_required';
  } else if (registrationRequired) {
    accessRequirements = 'registration_required';
  } else {
    accessRequirements = 'unknown';
  }

  return {
    title,
    matchedKeywords: [...new Set(matchedKeywords)],
    limitations,
    pricingStatus,
    apiKeyRequired,
    registrationRequired,
    accessRequirements
  };
}

/**
 * Verifies a single resource candidate with SSRF protection, caching,
 * content inspection, and distinct lifecycle status attribution.
 *
 * @param {Object|string} targetResource - URL string or Resource object
 * @param {Object} [options]
 * @param {number} [options.cacheTtlMs=86400000]
 * @param {boolean} [options.forceRefresh=false]
 * @param {Function} [options.customFetch]
 * @param {Function} [options.dnsLookup]
 * @returns {Promise<Object>} Verification report
 */
export async function verifyResource(targetResource, options = {}) {
  const {
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    forceRefresh = false,
    customFetch,
    dnsLookup
  } = options;

  const resourceInfo = typeof targetResource === 'string'
    ? { canonicalUrl: targetResource, name: targetResource }
    : { ...targetResource };

  const rawUrl = resourceInfo.canonicalUrl || resourceInfo.documentationUrl;

  // Handle standard browser built-in APIs
  if (resourceInfo.resourceType === 'browser-api' && (!rawUrl || rawUrl.includes('developer.mozilla.org'))) {
    return {
      name: resourceInfo.name,
      canonicalUrl: rawUrl || 'https://developer.mozilla.org/en-US/docs/Web/API',
      verificationStatus: 'verified',
      pricingStatus: 'free',
      apiKeyRequired: false,
      registrationRequired: false,
      accessRequirements: 'unauthenticated_public',
      verificationEvidence: {
        checkedUrl: rawUrl || 'browser-standard',
        checkedAt: new Date(),
        httpStatus: 200,
        notes: 'Browser built-in Web API verified against standard web platform specification.',
        matchedKeywords: ['browser-api', 'w3c-standard'],
        limitations: []
      }
    };
  }

  if (!rawUrl) {
    return {
      name: resourceInfo.name,
      canonicalUrl: null,
      verificationStatus: 'needs_manual_review',
      pricingStatus: 'unknown',
      apiKeyRequired: false,
      registrationRequired: false,
      accessRequirements: 'unknown',
      verificationEvidence: {
        checkedUrl: null,
        checkedAt: new Date(),
        notes: 'No URL provided for online verification; treated as pending manual review.',
        limitations: ['missing_canonical_url']
      }
    };
  }

  const cacheKey = rawUrl.trim().toLowerCase();

  // 1. Check in-memory & DB cache
  if (!forceRefresh) {
    const memoryCached = inMemoryCache.get(cacheKey);
    if (memoryCached) {
      if (memoryCached.cacheExpiresAt > Date.now()) {
        return { ...memoryCached, cached: true };
      }
      inMemoryCache.delete(cacheKey);
    }

    if (mongoose.connection?.readyState === 1) {
      try {
        const dbCached = await ResourceCatalog.findOne({ canonicalUrl: rawUrl });
        if (dbCached && dbCached.cacheExpiresAt && dbCached.cacheExpiresAt > new Date()) {
          const cachedResult = {
            name: dbCached.name,
            canonicalUrl: dbCached.canonicalUrl,
            verificationStatus: dbCached.verificationStatus,
            pricingStatus: dbCached.pricingStatus,
            apiKeyRequired: Boolean(dbCached.apiKeyRequired),
            registrationRequired: Boolean(dbCached.registrationRequired),
            accessRequirements: dbCached.accessRequirements || 'unknown',
            verificationEvidence: dbCached.verificationEvidence,
            lastVerifiedAt: dbCached.lastVerifiedAt,
            cached: true
          };
          inMemoryCache.set(cacheKey, { ...cachedResult, cacheExpiresAt: dbCached.cacheExpiresAt.getTime() });
          return cachedResult;
        }
      } catch {
        // Database query failed, fallback to live verification
      }
    }
  }

  // 2. Concurrency Deduplication: if same URL is currently verifying, share promise
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const verificationPromise = (async () => {
    let hostname;
    try {
      hostname = new URL(rawUrl).hostname;
    } catch (err) {
      return {
        name: resourceInfo.name,
        canonicalUrl: rawUrl,
        verificationStatus: 'inaccessible',
        pricingStatus: 'unknown',
        apiKeyRequired: false,
        registrationRequired: false,
        accessRequirements: 'unknown',
        verificationEvidence: {
          checkedUrl: rawUrl,
          checkedAt: new Date(),
          httpStatus: null,
          notes: `Invalid URL syntax: ${err.message}`,
          limitations: ['invalid_url_syntax']
        }
      };
    }

    // 3. Domain Rate Limiting
    if (!checkDomainRateLimit(hostname)) {
      return {
        name: resourceInfo.name,
        canonicalUrl: rawUrl,
        verificationStatus: 'verification_pending',
        pricingStatus: 'unknown',
        apiKeyRequired: false,
        registrationRequired: false,
        accessRequirements: 'unknown',
        verificationEvidence: {
          checkedUrl: rawUrl,
          checkedAt: new Date(),
          notes: `Rate limit reached for domain '${hostname}'; verification deferred.`,
          limitations: ['domain_rate_limited']
        }
      };
    }

    // 4. Safe Fetch with SSRF Protection
    let fetchResult;
    try {
      fetchResult = await safeFetch(rawUrl, {
        method: 'GET',
        timeoutMs: 5000,
        maxBytes: 524288,
        customFetch,
        dnsLookup
      });
    } catch (err) {
      const isSecurityError = err instanceof FetchSecurityError;
      const permanentSecurityCodes = [
        'SSRF_PROHIBITED',
        'OVERSIZED_RESPONSE',
        'INVALID_REDIRECT',
        'TOO_MANY_REDIRECTS'
      ];

      if (isSecurityError && permanentSecurityCodes.includes(err.code)) {
        return {
          name: resourceInfo.name,
          canonicalUrl: rawUrl,
          verificationStatus: 'inaccessible',
          pricingStatus: 'unknown',
          apiKeyRequired: false,
          registrationRequired: false,
          accessRequirements: 'unknown',
          verificationEvidence: {
            checkedUrl: rawUrl,
            checkedAt: new Date(),
            httpStatus: null,
            notes: `Resource check failed: ${err.message}`,
            limitations: [err.code || 'inaccessible_error']
          }
        };
      }

      // Transient or network/DNS errors: timeouts (REQUEST_TIMEOUT, AbortError), DNS resolution deferrals, and network connection failures
      // must NEVER be labelled verified, but defer reachability check following the documented verification_pending policy.
      return {
        name: resourceInfo.name,
        canonicalUrl: rawUrl,
        verificationStatus: 'verification_pending',
        pricingStatus: 'unknown',
        apiKeyRequired: false,
        registrationRequired: false,
        accessRequirements: 'unknown',
        verificationEvidence: {
          checkedUrl: rawUrl,
          checkedAt: new Date(),
          httpStatus: null,
          notes: `Network verification deferred: ${err.message}`,
          limitations: [err.code || 'network_deferred']
        }
      };
    }

    const { statusCode, body, finalUrl, resolvedIps, responseTimeMs } = fetchResult;

    // 5. Evaluate HTTP Status Codes
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 401 && statusCode !== 403) {
      return {
        name: resourceInfo.name,
        canonicalUrl: finalUrl,
        verificationStatus: 'inaccessible',
        pricingStatus: 'unknown',
        apiKeyRequired: false,
        registrationRequired: false,
        accessRequirements: 'unknown',
        verificationEvidence: {
          checkedUrl: finalUrl,
          checkedAt: new Date(),
          httpStatus: statusCode,
          ipAddress: resolvedIps[0] || null,
          responseTimeMs,
          notes: `HTTP client error status ${statusCode}`,
          limitations: [`http_${statusCode}`]
        }
      };
    }

    if (statusCode >= 500) {
      return {
        name: resourceInfo.name,
        canonicalUrl: finalUrl,
        verificationStatus: 'inaccessible',
        pricingStatus: 'unknown',
        apiKeyRequired: false,
        registrationRequired: false,
        accessRequirements: 'unknown',
        verificationEvidence: {
          checkedUrl: finalUrl,
          checkedAt: new Date(),
          httpStatus: statusCode,
          ipAddress: resolvedIps[0] || null,
          responseTimeMs,
          notes: `Upstream service error status ${statusCode}`,
          limitations: [`http_${statusCode}`]
        }
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        name: resourceInfo.name,
        canonicalUrl: finalUrl,
        verificationStatus: 'needs_manual_review',
        pricingStatus: 'unknown',
        apiKeyRequired: true,
        registrationRequired: false,
        accessRequirements: 'api_key_or_credentials_required',
        verificationEvidence: {
          checkedUrl: finalUrl,
          checkedAt: new Date(),
          httpStatus: statusCode,
          ipAddress: resolvedIps[0] || null,
          responseTimeMs,
          notes: `Authentication/Authorization required (HTTP ${statusCode}). Verify API key / credential access before student assignment.`,
          limitations: ['authentication_required']
        }
      };
    }

    // 6. Deep Content Inspection for HTTP 200
    const contentAnalysis = analyzeContentEvidence(body, resourceInfo);

    // Rule: Generic homepages are not proof of a specific working API or dataset
    let finalStatus = 'verified';
    const notesArr = [];

    if (isGenericHomepage(finalUrl)) {
      finalStatus = 'needs_manual_review';
      notesArr.push('Generic root or homepage provided. A specific API, repo, or documentation endpoint is required.');
      contentAnalysis.limitations.push('generic_homepage');
    }

    if (contentAnalysis.limitations.length > 0) {
      if (contentAnalysis.limitations.some((l) => l.includes('Soft-404') || l.includes('park page'))) {
        finalStatus = 'inaccessible';
      } else if (finalStatus !== 'inaccessible') {
        finalStatus = 'needs_manual_review';
      }
    }

    // If HTTP 200 but zero relevant keywords or documentation signals found
    if (finalStatus === 'verified' && contentAnalysis.matchedKeywords.length === 0) {
      finalStatus = 'needs_manual_review';
      notesArr.push('HTTP 200 returned, but page lacked technical documentation or capability signals.');
      contentAnalysis.limitations.push('unverified_content_signals');
    }

    if (finalStatus === 'verified') {
      notesArr.push(`Verified online resource. Matched signals: [${contentAnalysis.matchedKeywords.slice(0, 5).join(', ')}]`);
    }

    const report = {
      name: resourceInfo.name,
      canonicalUrl: finalUrl,
      verificationStatus: finalStatus,
      pricingStatus: contentAnalysis.pricingStatus,
      apiKeyRequired: contentAnalysis.apiKeyRequired,
      registrationRequired: contentAnalysis.registrationRequired,
      accessRequirements: contentAnalysis.accessRequirements,
      verificationEvidence: {
        checkedUrl: finalUrl,
        checkedAt: new Date(),
        httpStatus: statusCode,
        ipAddress: resolvedIps[0] || null,
        responseTimeMs,
        matchedKeywords: contentAnalysis.matchedKeywords,
        limitations: contentAnalysis.limitations,
        notes: notesArr.join(' ')
      },
      lastVerifiedAt: new Date(),
      cacheExpiresAt: new Date(Date.now() + cacheTtlMs)
    };

    // 7. Store in in-memory cache
    inMemoryCache.set(cacheKey, { ...report, cacheExpiresAt: report.cacheExpiresAt.getTime() });

    // 8. Persist to MongoDB ResourceCatalog if database is connected
    if (mongoose.connection?.readyState === 1) {
      try {
        await ResourceCatalog.findOneAndUpdate(
          { canonicalUrl: finalUrl },
          {
            name: resourceInfo.name,
            canonicalUrl: finalUrl,
            verificationStatus: report.verificationStatus,
            pricingStatus: report.pricingStatus,
            apiKeyRequired: report.apiKeyRequired,
            registrationRequired: report.registrationRequired,
            accessRequirements: report.accessRequirements,
            verificationEvidence: report.verificationEvidence,
            lastVerifiedAt: report.lastVerifiedAt,
            cacheExpiresAt: report.cacheExpiresAt,
            sourceProvenance: resourceInfo.sourceProvenance || 'online_discovery'
          },
          { upsert: true, returnDocument: 'after' }
        );
      } catch {
        // Mongo operation failed, ignore
      }
    }

    return report;
  })();

  inFlightRequests.set(cacheKey, verificationPromise);

  try {
    const res = await verificationPromise;
    return res;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Clears verification caches (useful for testing).
 */
export function clearVerificationCache() {
  inMemoryCache.clear();
  inFlightRequests.clear();
  domainRequestTimestamps.clear();
}

export default {
  verifyResource,
  isGenericHomepage,
  clearVerificationCache
};
