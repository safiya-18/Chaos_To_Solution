import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isIpBlocked, validateUrlSafety } from '../../src/utils/ssrfValidator.js';
import { safeFetch, FetchSecurityError } from '../../src/utils/safeFetcher.js';
import { verifyResource, isGenericHomepage, clearVerificationCache } from '../../src/services/resourceVerifier.js';
import {
  ResourceDiscoveryService,
  CuratedAuthorityProvider,
  ExternalSearchProvider
} from '../../src/services/resourceDiscovery.js';
import { validateHardRules } from '../../src/services/diversityService.js';

describe('Phase 2: Online Resource Catalog & Verification Engine Tests', () => {
  beforeEach(() => {
    clearVerificationCache();
    vi.restoreAllMocks();
  });

  describe('SSRF & IP Range Security Guard', () => {
    it('should block IPv4 loopback addresses (127.0.0.0/8)', () => {
      expect(isIpBlocked('127.0.0.1').blocked).toBe(true);
      expect(isIpBlocked('127.0.1.1').blocked).toBe(true);
      expect(isIpBlocked('127.255.255.254').blocked).toBe(true);
    });

    it('should block RFC 1918 private IPv4 networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      expect(isIpBlocked('10.0.0.1').blocked).toBe(true);
      expect(isIpBlocked('10.254.1.5').blocked).toBe(true);
      expect(isIpBlocked('172.16.0.1').blocked).toBe(true);
      expect(isIpBlocked('172.31.255.255').blocked).toBe(true);
      expect(isIpBlocked('192.168.1.1').blocked).toBe(true);
      expect(isIpBlocked('192.168.100.50').blocked).toBe(true);
    });

    it('should block cloud metadata and link-local addresses (169.254.0.0/16)', () => {
      expect(isIpBlocked('169.254.169.254').blocked).toBe(true);
      expect(isIpBlocked('169.254.1.1').blocked).toBe(true);
    });

    it('should block Carrier-Grade NAT (100.64.0.0/10) and 0.0.0.0/8', () => {
      expect(isIpBlocked('100.64.0.1').blocked).toBe(true);
      expect(isIpBlocked('100.127.255.254').blocked).toBe(true);
      expect(isIpBlocked('0.0.0.0').blocked).toBe(true);
      expect(isIpBlocked('0.1.2.3').blocked).toBe(true);
    });

    it('should block IPv6 loopback, unspecified, and private ULA/link-local', () => {
      expect(isIpBlocked('::1').blocked).toBe(true);
      expect(isIpBlocked('::').blocked).toBe(true);
      expect(isIpBlocked('fc00::1').blocked).toBe(true);
      expect(isIpBlocked('fd12:3456::1').blocked).toBe(true);
      expect(isIpBlocked('fe80::1').blocked).toBe(true);
    });

    it('should block IPv4-mapped IPv6 loopback and metadata addresses', () => {
      expect(isIpBlocked('::ffff:127.0.0.1').blocked).toBe(true);
      expect(isIpBlocked('::ffff:169.254.169.254').blocked).toBe(true);
      expect(isIpBlocked('::ffff:10.0.0.1').blocked).toBe(true);
    });

    it('should allow legitimate public IPv4 and IPv6 addresses', () => {
      expect(isIpBlocked('8.8.8.8').blocked).toBe(false);
      expect(isIpBlocked('1.1.1.1').blocked).toBe(false);
      expect(isIpBlocked('142.250.190.46').blocked).toBe(false);
      expect(isIpBlocked('2606:4700:4700::1111').blocked).toBe(false);
    });
  });

  describe('URL Syntax & Protocol Validation', () => {
    it('should reject non-HTTP/HTTPS protocols (file:, ftp:, gopher:, javascript:)', async () => {
      const fileRes = await validateUrlSafety('file:///etc/passwd');
      expect(fileRes.safe).toBe(false);
      expect(fileRes.reason).toContain('Prohibited protocol');

      const ftpRes = await validateUrlSafety('ftp://files.example.com');
      expect(ftpRes.safe).toBe(false);
      expect(ftpRes.reason).toContain('Prohibited protocol');

      const jsRes = await validateUrlSafety('javascript:alert(1)');
      expect(jsRes.safe).toBe(false);
    });

    it('should reject URLs containing embedded credentials', async () => {
      const res = await validateUrlSafety('https://admin:password@api.example.com/data');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('user authentication credentials');
    });

    it('should reject localhost and resolved private IPs', async () => {
      const res = await validateUrlSafety('http://localhost:5000/api');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('Loopback');

      // Mock DNS lookup returning internal IP
      const mockDnsLookup = vi.fn().mockResolvedValue([{ address: '192.168.1.100', family: 4 }]);
      const dnsRes = await validateUrlSafety('https://internal-service.local/data', { dnsLookup: mockDnsLookup });
      expect(dnsRes.safe).toBe(false);
      expect(dnsRes.reason).toContain('prohibited range');
    });

    it('should handle DNS lookup failures gracefully', async () => {
      const mockDnsLookup = vi.fn().mockRejectedValue(new Error('ENOTFOUND'));
      const res = await validateUrlSafety('https://non-existent-domain-xyz-123.org', { dnsLookup: mockDnsLookup });
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('DNS resolution failed');
    });
  });

  describe('Safe Fetcher & Redirect Guard', () => {
    it('should block requests that redirect to prohibited SSRF destinations', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Map([['location', 'http://169.254.169.254/latest/meta-data/']])
      });

      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      await expect(
        safeFetch('https://public-site.com/redirect', {
          customFetch: mockFetch,
          dnsLookup: mockDns
        })
      ).rejects.toThrow(FetchSecurityError);
    });

    it('should abort requests that exceed the response size limit', async () => {
      const hugeString = 'X'.repeat(600000); // 600 KB > 512 KB limit
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => hugeString
      });

      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      await expect(
        safeFetch('https://public-api.org/data', {
          maxBytes: 524288,
          customFetch: mockFetch,
          dnsLookup: mockDns
        })
      ).rejects.toThrow(/exceeded maximum allowed limit/);
    });

    it('should abort requests that exceed the timeout limit', async () => {
      const hangingFetch = vi.fn().mockImplementation((url, opts) => {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      await expect(
        safeFetch('https://slow-api.org/data', {
          timeoutMs: 50,
          customFetch: hangingFetch,
          dnsLookup: mockDns
        })
      ).rejects.toThrow(/timed out/);
    });
  });

  describe('Content Evidence & Resource Verification', () => {
    it('should correctly identify generic homepages and classify them as needs_manual_review', () => {
      expect(isGenericHomepage('https://github.com')).toBe(true);
      expect(isGenericHomepage('https://github.com/')).toBe(true);
      expect(isGenericHomepage('https://data.gov.in/')).toBe(true);
      expect(isGenericHomepage('https://data.gov.in/index.html')).toBe(true);
      expect(isGenericHomepage('https://info.arxiv.org/help/api/index.html')).toBe(false);
      expect(isGenericHomepage('https://github.com/dequelabs/axe-core')).toBe(false);
    });

    it('should return needs_manual_review when HTTP 200 is returned on a generic homepage', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => '<html><head><title>GitHub: Let’s build from here</title></head><body>Welcome</body></html>'
      });
      const mockDns = vi.fn().mockResolvedValue([{ address: '140.82.121.4', family: 4 }]);

      const report = await verifyResource('https://github.com/', {
        customFetch: mockFetch,
        dnsLookup: mockDns
      });

      expect(report.verificationStatus).toBe('needs_manual_review');
      expect(report.verificationEvidence.notes).toContain('Generic root or homepage provided');
      expect(report.verificationEvidence.limitations).toContain('generic_homepage');
    });

    it('should verify legitimate documentation endpoint with technical markers', async () => {
      const htmlBody = `
        <html>
          <head><title>arXiv API Basics and User Manual</title></head>
          <body>
            <h1>arXiv API User Manual</h1>
            <p>The arXiv API allows programmatic query access to the arXiv repository of scientific papers.</p>
            <p>Endpoint: http://export.arxiv.org/api/query</p>
            <p>Released under Open Access terms. Rate limit: 1 request per 3 seconds.</p>
          </body>
        </html>
      `;
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => htmlBody
      });
      const mockDns = vi.fn().mockResolvedValue([{ address: '128.84.21.199', family: 4 }]);

      const report = await verifyResource({
        name: 'arXiv Academic Paper API',
        canonicalUrl: 'https://info.arxiv.org/help/api/index.html',
        domains: ['EdTech'],
        capabilities: ['academic-search', 'paper-summarization']
      }, {
        customFetch: mockFetch,
        dnsLookup: mockDns
      });

      expect(report.verificationStatus).toBe('verified');
      expect(report.verificationEvidence.httpStatus).toBe(200);
      expect(report.verificationEvidence.matchedKeywords).toContain('api');
      expect(report.verificationEvidence.matchedKeywords).toContain('endpoint');
    });

    it('should flag HTTP 401/403 as needs_manual_review and mark apiKeyRequired: true', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 403,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => '{"error": "Forbidden - API key required"}'
      });
      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      const report = await verifyResource('https://api.example.com/v1/protected', {
        customFetch: mockFetch,
        dnsLookup: mockDns
      });

      expect(report.verificationStatus).toBe('needs_manual_review');
      expect(report.apiKeyRequired).toBe(true);
      expect(report.verificationEvidence.limitations).toContain('authentication_required');
    });

    it('should mark HTTP 404 and 500 as inaccessible', async () => {
      const mockFetch404 = vi.fn().mockResolvedValue({
        status: 404,
        headers: new Map([]),
        text: async () => 'Not Found'
      });
      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      const report404 = await verifyResource('https://example.com/broken-link', {
        customFetch: mockFetch404,
        dnsLookup: mockDns
      });
      expect(report404.verificationStatus).toBe('inaccessible');
      expect(report404.verificationEvidence.httpStatus).toBe(404);

      const mockFetch500 = vi.fn().mockResolvedValue({
        status: 503,
        headers: new Map([]),
        text: async () => 'Service Unavailable'
      });
      const report500 = await verifyResource('https://example.com/down-service', {
        customFetch: mockFetch500,
        dnsLookup: mockDns
      });
      expect(report500.verificationStatus).toBe('inaccessible');
      expect(report500.verificationEvidence.httpStatus).toBe(503);
    });

    it('should automatically verify browser built-in APIs without network fetch', async () => {
      const report = await verifyResource({
        name: 'Browser Web Speech API',
        resourceType: 'browser-api',
        canonicalUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API'
      });

      expect(report.verificationStatus).toBe('verified');
      expect(report.pricingStatus).toBe('free');
      expect(report.apiKeyRequired).toBe(false);
      expect(report.verificationEvidence.notes).toContain('Browser built-in Web API');
    });
  });

  describe('Caching & Concurrency', () => {
    it('should cache verification results and avoid repeated network calls for the same URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => '<html><head><title>Leaflet API reference</title></head><body>Leaflet API documentation</body></html>'
      });
      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

      // First call
      const res1 = await verifyResource('https://leafletjs.com/reference.html', {
        customFetch: mockFetch,
        dnsLookup: mockDns
      });
      expect(res1.cached).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call (should use in-memory cache)
      const res2 = await verifyResource('https://leafletjs.com/reference.html', {
        customFetch: mockFetch,
        dnsLookup: mockDns
      });
      expect(res2.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Not called again!

      // Force refresh should bypass cache
      const res3 = await verifyResource('https://leafletjs.com/reference.html', {
        forceRefresh: true,
        customFetch: mockFetch,
        dnsLookup: mockDns
      });
      expect(res3.cached).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Discovery Provider Interface & Fallback Handling', () => {
    it('should discover candidate resources from CuratedAuthorityProvider', async () => {
      const service = new ResourceDiscoveryService([new CuratedAuthorityProvider()]);
      const results = await service.discoverCandidates({ domain: 'Smart Cities' });

      expect(results.length).toBeGreaterThan(0);
      const osmMaps = results.find((r) => r.name.includes('OpenStreetMap'));
      expect(osmMaps).toBeDefined();
      expect(osmMaps.verificationStatus).toBe('candidate'); // Candidate by default!
    });

    it('should gracefully handle unconfigured or offline external discovery providers', async () => {
      const unconfiguredProvider = new ExternalSearchProvider({ apiKey: null });
      expect(await unconfiguredProvider.isAvailable()).toBe(false);

      const res = await unconfiguredProvider.search({ query: 'traffic dataset', domain: 'Smart Cities' });
      expect(res.status).toBe('discovery_limited');
      expect(res.reason).toContain('unconfigured or offline');
      expect(res.results).toHaveLength(0);
    });
  });

  describe('Resource Verification Acceptance Policy & State Enforcement', () => {
    it('should return verification_pending for DNS resolution / network errors (DNS_UNRESOLVED) and never mark verified', async () => {
      const testUrl = 'https://unresolved-domain-xyz987.org/api';
      const mockDns = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND unresolved-domain-xyz987.org'));

      const result = await verifyResource(testUrl, {
        dnsLookup: mockDns,
        customFetch: vi.fn()
      });

      expect(result.verificationStatus).toBe('verification_pending');
      expect(result.verificationStatus).not.toBe('verified');
      expect(result.verificationStatus).not.toBe('inaccessible');
      expect(result.verificationEvidence.limitations).toContain('DNS_UNRESOLVED');
      expect(result.verificationEvidence.notes).toMatch(/deferred/i);
    });

    it('should return verification_pending for transient request timeouts without marking verified', async () => {
      const testUrl = 'https://lagging-service.org/api/docs';
      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
      const mockFetch = vi.fn().mockRejectedValue(
        new FetchSecurityError("Request to 'https://lagging-service.org/api/docs' timed out after 5000ms.", 'REQUEST_TIMEOUT')
      );

      const result = await verifyResource(testUrl, {
        dnsLookup: mockDns,
        customFetch: mockFetch
      });

      expect(result.verificationStatus).toBe('verification_pending');
      expect(result.verificationStatus).not.toBe('verified');
      expect(result.verificationStatus).not.toBe('inaccessible');
      expect(result.verificationEvidence.notes).toMatch(/deferred/i);
    });

    it('should return inaccessible for SSRF prohibited destinations and never accept as valid', async () => {
      const testUrl = 'https://169.254.169.254/latest/meta-data';
      const mockDns = vi.fn().mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);

      const result = await verifyResource(testUrl, {
        dnsLookup: mockDns,
        customFetch: vi.fn()
      });

      expect(result.verificationStatus).toBe('inaccessible');
      expect(result.verificationStatus).not.toBe('verified');
      expect(result.verificationStatus).not.toBe('verification_pending');
    });

    it('should return verified for reachable documentation with technical signals', async () => {
      const testUrl = 'https://open-meteo.com/en/docs';
      const mockDns = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html><head><title>Open-Meteo Weather API Documentation</title></head><body>Free open-source weather forecast API endpoint with JSON output. No API key required.</body></html>'
      });

      const result = await verifyResource({
        canonicalUrl: testUrl,
        name: 'Open-Meteo Weather API',
        resourceType: 'public-api'
      }, {
        dnsLookup: mockDns,
        customFetch: mockFetch
      });

      expect(result.verificationStatus).toBe('verified');
      expect(result.pricingStatus).toBe('free');
      expect(result.accessRequirements).toBe('unauthenticated_public');
    });

    it('should reject candidates whose resources are inaccessible via validateHardRules', () => {
      const candidateWithInaccessibleResource = {
        theme: 'HealthTech',
        problem: {
          title: 'Emergency Medical Dispatcher',
          statement: 'Build a dispatch triage tool for hospital emergency staff.'
        },
        restriction: {
          name: 'Low Latency',
          rule: 'Render state updates in under 100ms.'
        },
        resource: {
          name: 'Dead API Service',
          type: 'public-api',
          verificationStatus: 'inaccessible',
          docsUrl: 'https://dead-service.invalid'
        },
        deliverable: 'A responsive dashboard prototype for medical triage.'
      };

      const hardCheck = validateHardRules(candidateWithInaccessibleResource);
      expect(hardCheck.passed).toBe(false);
      expect(hardCheck.rejections.some((r) => r.includes('inaccessible'))).toBe(true);
    });

    it('should accept candidates whose resources are verification_pending with appropriate penalty', () => {
      const candidateWithPendingResource = {
        theme: 'HealthTech',
        problem: {
          title: 'Emergency Medical Dispatcher',
          statement: 'Build a dispatch triage tool for hospital emergency staff.'
        },
        restriction: {
          name: 'Low Latency',
          rule: 'Render state updates in under 100ms.'
        },
        resource: {
          name: 'Deferred API Service',
          type: 'public-api',
          guidance: 'Use Deferred API to provide emergency patient telemetry.',
          verificationStatus: 'verification_pending',
          docsUrl: 'https://deferred-service.org/api'
        },
        deliverable: 'A responsive dashboard prototype for medical triage.'
      };

      const hardCheck = validateHardRules(candidateWithPendingResource);
      expect(hardCheck.passed).toBe(true);
    });
  });
});
