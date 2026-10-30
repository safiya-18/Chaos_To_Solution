import referenceChallenges from '../data/referenceChallenges.json' with { type: 'json' };
import { CuratedAuthorityProvider } from './resourceDiscovery.js';
import GenerationHistory from '../models/GenerationHistory.js';
import mongoose from 'mongoose';

const authorityProvider = new CuratedAuthorityProvider();

/**
 * Builds a compact, grounded retrieval context for Groq and Gemini.
 * Retrieves:
 * 1. 2 domain-relevant approved reference benchmark challenges.
 * 2. 2 domain-relevant verified/candidate real online resources with exact canonical URLs.
 * 3. Recent negative signals / rejected titles from GenerationHistory (if DB connected).
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

  // 1. Retrieve domain benchmark examples
  let allDomainBenchmarks = referenceChallenges.filter((r) => r.domain.toLowerCase() === dLower);

  if (options.sourceFile) {
    const filtered = allDomainBenchmarks.filter((b) => b.sourceFile && b.sourceFile.includes(options.sourceFile));
    if (filtered.length > 0) {
      allDomainBenchmarks = filtered;
    }
  }

  if (options.randomize && allDomainBenchmarks.length > (options.limit || 2)) {
    allDomainBenchmarks = [...allDomainBenchmarks].sort(() => 0.5 - Math.random());
  } else if (typeof options.offset === 'number') {
    allDomainBenchmarks = allDomainBenchmarks.slice(options.offset);
  }

  const domainBenchmarks = allDomainBenchmarks.slice(0, options.limit || 2);

  const benchmarkSnippets = domainBenchmarks.map((b, i) => {
    const titleStr = b.title ? `- Title: "${b.title}"\n` : '';
    return `[Reference Example ${i + 1}]
${titleStr}- Problem Statement: "${b.problemStatement}"
- Restriction: "${b.restriction}"
- Resource: "${b.resource}"`;
  });

  // 2. Retrieve 2 authoritative real online resources for this domain
  const domainResources = await authorityProvider.search({ domain });
  const resourceSnippets = domainResources.slice(0, 2).map((r) => {
    return `- Name: "${r.name}" | Type: "${r.resourceType}" | Docs: "${r.canonicalUrl}" (${r.description.slice(0, 120)}...)`;
  });

  // 3. Negative signals: fetch rejected or duplicate titles from GenerationHistory
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

  if (benchmarkSnippets.length > 0) {
    sections.push(
      `APPROVED REFERENCE CHALLENGE BENCHMARKS FOR DOMAIN "${domain}" (Use for structural inspiration only; do NOT copy or paraphrase):\n${benchmarkSnippets.join('\n\n')}`
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
