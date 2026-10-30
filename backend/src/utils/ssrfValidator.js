import dns from 'dns';
import net from 'net';

/**
 * CIDR block helper to check if an IPv4 address is within a given subnet.
 */
function ipv4InCidr(ip, cidr) {
  const [range, bits = 32] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * List of forbidden IPv4 CIDR blocks (RFC 1918, RFC 3927, RFC 6598, RFC 1122, RFC 5771, etc.)
 */
const FORBIDDEN_IPV4_CIDRS = [
  '0.0.0.0/8',          // Current network (RFC 1122)
  '10.0.0.0/8',         // Private-use (RFC 1918)
  '100.64.0.0/10',      // Shared address / CGNAT (RFC 6598)
  '127.0.0.0/8',        // Loopback (RFC 1122)
  '169.254.0.0/16',     // Link-local / Cloud metadata (RFC 3927)
  '172.16.0.0/12',      // Private-use (RFC 1918)
  '192.0.0.0/24',       // IETF Protocol Assignments
  '192.0.2.0/24',       // TEST-NET-1 (RFC 5737)
  '192.88.99.0/24',     // 6to4 Relay Anycast (RFC 3068)
  '192.168.0.0/16',     // Private-use (RFC 1918)
  '198.18.0.0/15',      // Benchmarking (RFC 2544)
  '198.51.100.0/24',    // TEST-NET-2 (RFC 5737)
  '203.0.113.0/24',     // TEST-NET-3 (RFC 5737)
  '224.0.0.0/4',        // Multicast (RFC 5771)
  '240.0.0.0/4',        // Reserved / future use (RFC 1112)
  '255.255.255.255/32'  // Limited broadcast
];

/**
 * Checks whether an IP address (IPv4 or IPv6) is within private, loopback, or reserved ranges.
 *
 * @param {string} ip - Raw IP address string.
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function isIpBlocked(ip) {
  if (!ip || typeof ip !== 'string') {
    return { blocked: true, reason: 'Invalid or missing IP address' };
  }

  const cleanIp = ip.trim();
  const family = net.isIP(cleanIp);

  if (family === 0) {
    return { blocked: true, reason: 'Malformed IP address format' };
  }

  // Handle IPv4
  if (family === 4) {
    for (const cidr of FORBIDDEN_IPV4_CIDRS) {
      if (ipv4InCidr(cleanIp, cidr)) {
        return { blocked: true, reason: `IPv4 address ${cleanIp} falls in prohibited range ${cidr}` };
      }
    }
    return { blocked: false };
  }

  // Handle IPv6
  if (family === 6) {
    const lower = cleanIp.toLowerCase();

    // Check for IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1 or ::ffff:7f00:1 or 0:0:0:0:0:ffff:127.0.0.1)
    if (lower.includes('ffff:')) {
      const parts = lower.split('ffff:');
      const suffix = parts[parts.length - 1];
      if (net.isIPv4(suffix)) {
        return isIpBlocked(suffix);
      }
      const hexParts = suffix.split(':');
      if (hexParts.length === 2) {
        const p1 = parseInt(hexParts[0], 16);
        const p2 = parseInt(hexParts[1], 16);
        if (!isNaN(p1) && !isNaN(p2) && p1 >= 0 && p1 <= 0xffff && p2 >= 0 && p2 <= 0xffff) {
          const b1 = (p1 >> 8) & 0xff;
          const b2 = p1 & 0xff;
          const b3 = (p2 >> 8) & 0xff;
          const b4 = p2 & 0xff;
          return isIpBlocked(`${b1}.${b2}.${b3}.${b4}`);
        }
      }
    }

    // Exact matches
    if (lower === '::' || lower === '0000:0000:0000:0000:0000:0000:0000:0000') {
      return { blocked: true, reason: 'Unspecified IPv6 address is prohibited' };
    }
    if (lower === '::1' || lower === '0000:0000:0000:0000:0000:0000:0000:0001') {
      return { blocked: true, reason: 'IPv6 loopback address is prohibited' };
    }

    // Unique Local Addresses (fc00::/7)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return { blocked: true, reason: 'Unique Local IPv6 (private) is prohibited' };
    }

    // Link-local unicast (fe80::/10)
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return { blocked: true, reason: 'Link-local IPv6 address is prohibited' };
    }

    // Multicast (ff00::/8)
    if (lower.startsWith('ff')) {
      return { blocked: true, reason: 'Multicast IPv6 address is prohibited' };
    }

    // Documentation addresses (2001:db8::/32)
    if (lower.startsWith('2001:db8') || lower.startsWith('2001:0db8')) {
      return { blocked: true, reason: 'Documentation IPv6 address is prohibited' };
    }

    return { blocked: false };
  }

  return { blocked: true, reason: 'Unknown IP family' };
}

/**
 * Validates a URL for SSRF vulnerabilities, DNS resolution, and forbidden destination networks.
 *
 * @param {string} rawUrl - Target URL.
 * @param {Object} [options]
 * @param {Function} [options.dnsLookup] - Custom DNS lookup function (for testing).
 * @returns {Promise<{ safe: boolean, ipAddresses: string[], reason?: string, parsedUrl?: URL }>}
 */
export async function validateUrlSafety(rawUrl, options = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, ipAddresses: [], reason: 'URL must be a non-empty string' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { safe: false, ipAddresses: [], reason: `Invalid URL syntax: ${err.message}` };
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      safe: false,
      ipAddresses: [],
      reason: `Prohibited protocol '${parsed.protocol}'. Only http: and https: are allowed.`
    };
  }

  // 2. Reject credentials in URL
  if (parsed.username || parsed.password) {
    return {
      safe: false,
      ipAddresses: [],
      reason: 'URLs containing user authentication credentials are prohibited.'
    };
  }

  let hostname = parsed.hostname;
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // 3. Fast-check for literal localhost or loopback name
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1' || hostname === '::1') {
    return {
      safe: false,
      ipAddresses: ['127.0.0.1'],
      reason: 'Loopback and localhost destinations are prohibited.'
    };
  }

  // 4. If hostname is already a raw IP address
  if (net.isIP(hostname)) {
    const ipCheck = isIpBlocked(hostname);
    if (ipCheck.blocked) {
      return { safe: false, ipAddresses: [hostname], reason: ipCheck.reason, parsedUrl: parsed };
    }
    return { safe: true, ipAddresses: [hostname], parsedUrl: parsed };
  }

  // 5. DNS Resolution
  const lookupFn = options.dnsLookup || (async (host) => {
    return dns.promises.lookup(host, { all: true });
  });

  try {
    const addresses = await lookupFn(hostname);
    if (!addresses || addresses.length === 0) {
      return { safe: false, ipAddresses: [], reason: `DNS lookup returned no addresses for ${hostname}` };
    }

    const resolvedIps = addresses.map((a) => (typeof a === 'string' ? a : a.address));

    for (const ip of resolvedIps) {
      const check = isIpBlocked(ip);
      if (check.blocked) {
        return {
          safe: false,
          ipAddresses: resolvedIps,
          reason: `Resolved IP ${ip} is prohibited: ${check.reason}`,
          parsedUrl: parsed
        };
      }
    }

    return { safe: true, ipAddresses: resolvedIps, parsedUrl: parsed };
  } catch (err) {
    return {
      safe: false,
      ipAddresses: [],
      reason: `DNS resolution failed for '${hostname}': ${err.message}`
    };
  }
}

export default {
  isIpBlocked,
  validateUrlSafety
};
