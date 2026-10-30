import referenceChallenges from '../data/referenceChallenges.json' with { type: 'json' };
import officialCuratedChallenges from '../data/officialCuratedChallenges.json' with { type: 'json' };
import { CuratedAuthorityProvider } from './resourceDiscovery.js';
import GenerationHistory from '../models/GenerationHistory.js';
import { getThemeConstraintGuidelines } from '../utils/themeConstraintValidator.js';
import mongoose from 'mongoose';

const authorityProvider = new CuratedAuthorityProvider();

/**
 * Builds a compact, grounded retrieval context for Groq and Gemini.
 * Retrieves:
 * 1. Domain-relevant official curated challenge benchmarks and reference examples.
 * 2. Official mandatory restrictions and supplied organizer resources.
 * 3. Verified real online resources with exact canonical URLs.
 * 4. Recent negative signals / rejected titles from GenerationHistory (if DB connected).
 *
 * @param {string} domain
 * @param {Object} [options={}]
 * @param {string} [options.sourceFile] - Filter benchmarks by source filename
 * @param {boolean} [options.randomize=false] - Randomly sample benchmarks
 * @param {number} [options.offset] - Offset into domain benchmarks
 * @param {number} [options.limit=2] - Number of benchmarks to retrieve
 * @returns {Promise<string>} Grounding prompt block
 */
export async function getGroundingContext(domain, options = {}) {
  if (!domain) return '';

  const dLower = domain.trim().toLowerCase();

  // 1. Static reference benchmarks from referenceChallenges.json
  let refDomainBenchmarks = referenceChallenges.filter((r) => r.domain.toLowerCase() === dLower);
  if (options.sourceFile) {
    const filtered = refDomainBenchmarks.filter((b) => b.sourceFile && b.sourceFile.includes(options.sourceFile));
    if (filtered.length > 0) {
      refDomainBenchmarks = filtered;
    }
  }

  // 2. Official curated theme challenges from officialCuratedChallenges.json
  const officialThemeMatches = officialCuratedChallenges.filter(
    (c) => c.theme.toLowerCase() === dLower
  );

  if (options.randomize && refDomainBenchmarks.length > (options.limit || 2)) {
    refDomainBenchmarks = [...refDomainBenchmarks].sort(() => 0.5 - Math.random());
  } else if (typeof options.offset === 'number') {
    refDomainBenchmarks = refDomainBenchmarks.slice(options.offset);
  }

  const refLimit = officialThemeMatches.length > 0 ? 1 : (options.limit || 2);
  const refSnippets = refDomainBenchmarks.slice(0, refLimit).map((b, i) => {
    const titleStr = b.title ? `- Title: "${b.title}"\n` : '';
    return `[Reference Example ${i + 1}]
${titleStr}- Problem Statement: "${b.problemStatement}"
- Mandatory Restriction: "${b.restriction}"
- Officially Supplied Resource: "${b.resource}"`;
  });

  const officialLimit = refSnippets.length > 0 ? 1 : 2;
  const officialSnippets = officialThemeMatches.slice(0, officialLimit).map((b, i) => {
    return `[Official Curated Challenge ${i + 1} (CTS Official Knowledge Base)]
- Title: "${b.title}"
- Problem Statement: "${b.problemStatement}"
- Mandatory Restriction: "${b.restrictions.join('; ')}"
- Officially Supplied Resource: "${b.resourcesProvided.join('; ')}"`;
  });

  // 3. Retrieve 2 authoritative real online resources for this domain
  const domainResources = await authorityProvider.search({ domain });
  const resourceSnippets = domainResources.slice(0, 2).map((r) => {
    return `- Name: "${r.name}" | Type: "${r.resourceType}" | Docs: "${r.canonicalUrl}" (${r.description.slice(0, 120)}...)`;
  });

  // 4. Negative signals: fetch rejected or duplicate titles from GenerationHistory
  const negativeTitles = [];
  if (mongoose.connection?.readyState === 1) {
    try {
      const recentRejected = await GenerationHistory.find({
        domain,
        decision: { $in: ['rejected', 'regenerated'] }
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('candidateChallenge.problem.title rejectionReason');

      for (const rec of recentRejected) {
        if (rec.candidateChallenge?.problem?.title) {
          negativeTitles.push(rec.candidateChallenge.problem.title);
        }
      }
    } catch {
      // Non-blocking telemetry
    }
  }

  const sections = [];

  // Theme-specific constraint policy
  const themeGuideline = getThemeConstraintGuidelines(domain);
  if (themeGuideline) {
    sections.push(`THEME SPECIFIC CONSTRAINTS:\n${themeGuideline}`);
  }

  if (refSnippets.length > 0) {
    sections.push(
      `APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "${domain}":\n${refSnippets.join('\n\n')}`
    );
  }

  if (officialSnippets.length > 0) {
    sections.push(
      `OFFICIAL CURATED THEME CHALLENGES FOR "${domain}":\n${officialSnippets.join('\n\n')}\n\nIMPORTANT PROVENANCE MANDATE: When generating a challenge or variation, clearly distinguish: 1) Original problem, 2) Mandatory restrictions, 3) Provided resources, 4) AI-generated enhancements. Never present AI-generated suggestions as resources officially supplied by the organizers.`
    );
  }

  if (resourceSnippets.length > 0) {
    sections.push(
      `AVAILABLE VERIFIED ONLINE RESOURCES FOR THIS DOMAIN (Use one of these or a comparable verified free resource):\n${resourceSnippets.join('\n')}`
    );
  }

  if (negativeTitles.length > 0) {
    sections.push(
      `AVOID OVERUSED / REJECTED CANDIDATES:\n${negativeTitles.map((t) => `- Do not repeat concept: "${t}"`).join('\n')}`
    );
  }

  return sections.join('\n\n');
}

export default {
  getGroundingContext
};
