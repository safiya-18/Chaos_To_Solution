# AI Challenge Intelligence Engine & Pipeline — Chaos to Solution (CTS)

## Overview

The CTS **AI Challenge Intelligence Engine** produces scoped, cohesive, and architecturally restricted hackathon problem sets. Instead of unconstrained LLM hallucinations, CTS executes a multi-stage validation and ground-retrieval pipeline.

---

## Pipeline Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Participant as Team Registration
    participant Svc as ChallengeService
    participant Ground as GroundingService
    participant Cascade as Provider Cascade
    participant Nov as NoveltyService
    participant Div as DiversityService
    participant Ver as ResourceVerifier
    participant DB as MongoDB Atlas

    Participant->>Svc: generateChallenge(theme)
    Svc->>Ground: getGroundingContext(theme)
    Ground-->>Svc: Domain Benchmarks (2) + Verified APIs (2) + Negative Signals

    loop Up to 2 Novelty Retries
        Svc->>Cascade: Request Generation (Groq -> Gemini -> Curated)
        Cascade-->>Svc: Candidate Triad Payload

        Svc->>Ver: verifyResource(candidate.resource)
        Ver-->>Svc: Status: verified / verification_pending / inaccessible

        Svc->>Div: validateHardRules(candidate)
        alt Inaccessible Resource or Broken Rules
            Div-->>Svc: REJECT (Trigger Regeneration)
        else Rules Valid
            Svc->>Nov: evaluateNovelty(candidate, theme)
            alt Similarity >= Thresholds
                Nov-->>Svc: REGENERATE / REJECT
            else Novelty Confirmed
                Nov-->>Svc: ACCEPT
            end
        end
    end

    alt Exhausted Retries / LLM Failure
        Svc->>Svc: Engage Curated Benchmark Fallback
    end

    Svc->>DB: Log to GenerationHistory (Diagnositcs)
    Svc-->>Participant: Final Verified Challenge & Signature
```

---

## 1. Domain-Specific Reference Grounding (`groundingService.js`)

Before generating a prompt:
1. Retrieves **2 curated reference benchmarks** from `referenceChallenges.json` matching the requested theme (from a master bank of 76 reference records).
2. Retrieves **2 authoritative public resources** (browser APIs, open REST APIs, or local datasets) from `CuratedAuthorityProvider`.
3. Queries `GenerationHistory` in MongoDB for recently generated or rejected problem titles to inject negative anti-pattern constraints into the prompt context.

---

## 2. Multi-Tier Provider Cascade (`challengeService.js`)

CTS guarantees resilient, sub-second responses via a 3-tier cascade:

| Tier | Provider / Service | Model | Timeout | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Primary)** | Groq LPU | `openai/gpt-oss-20b` | 4,000 ms | Ultra-low latency primary generator with JSON Schema enforcement. |
| **Tier 2 (Secondary)** | Google Gemini | `gemini-3.8-flash` | 4,000 ms | Secondary cloud AI provider when Groq is rate-limited or unavailable. |
| **Tier 3 (Fallback)** | Curated Fallback | In-Memory Dataset | 0 ms | Deterministic, instantaneous offline benchmarks guaranteed to succeed. |

---

## 3. Resource Discovery & SSRF Verification (`resourceVerifier.js`)

Every online tool or API proposed by the AI undergoes verification:
1. **SSRF Guard**: Resolves the hostname using Node's DNS resolver. Verifies IP addresses against RFC 1918 private subnets, loopbacks (`127.0.0.0/8`), link-local addresses (`169.254.0.0/16`), and AWS metadata endpoints (`169.254.169.254`). Prohibited targets are instantly flagged as `inaccessible`.
2. **Safe Fetching (`safeFetcher.js`)**: Connects to the pinned IP to eliminate DNS rebinding (TOCTOU). Enforces strict timeouts (4,000 ms), validates redirect limits (max 3), and caps response bodies at 512 KB.
3. **Policy Acceptance**:
   - `verified`: Tested and reachable with documentation.
   - `verification_pending`: Transient network or DNS timeout during offline build (allowed with feasibility penalty).
   - `inaccessible`: Blocked by SSRF, oversized response, or redirect loop (hard rejected).

---

## 4. Semantic & Lexical Novelty Detection (`noveltyService.js`)

Novelty scoring prevents challenge repetition across participant teams:
- **Composite Jaccard Metric**: 60% normalized word-token Jaccard + 40% character 3-gram Jaccard.
- **Combination Keys**: Tracks `domain:restrictionCategory:resource` combinations.
- **Thresholds**:
  - `EXACT_DUPLICATE_THRESHOLD`: 1.0 -> Instant `REJECT`.
  - `PROBLEM_SIMILARITY_MAX`: 0.70 -> Triggers bounded `REGENERATE`.
  - `OVERALL_SIMILARITY_MAX`: 0.65 -> Triggers bounded `REGENERATE`.
  - Retries are bounded to a maximum of **2 attempts** before falling back to an unassigned curated benchmark, preventing cascading latency.

---

## 5. Challenge Signatures & Atomic Uniqueness

- Each challenge receives a deterministic signature:
  `sha256(theme:problem_statement:restriction_name:resource_name)`.
- Enforced at database level via the MongoDB partial unique index on `(eventId, challengeSignature)`, ensuring no two teams in the same event receive an identical challenge.

---

## 6. Official Curated Challenge Knowledge Base & Theme Constraint Enforcement

CTS integrates **40 official curated problem statements** extracted directly from official organizer challenge documents across four primary themes:
1. **FinTech (10 Challenges)**: Client-side settlement calculation, rule-based fraud detection without external ML APIs, simulated transactions without live UPI/banking credentials, offline compound growth comparisons, zero PII collection, and sub-1 MB performance budgets.
2. **Sustainability (10 Challenges)**: Simulated mess logs without physical scales, 5-inch mobile usability, transparent formulas without paid GIS, zero-cash donation/barter models, WCAG AA compliance, and sub-1.5 MB bundle bounds.
3. **EdTech (10 Challenges)**: Dual-pane notes preserving original context, image text alternatives with full keyboard access, rule-based syllabus prioritization without paid APIs, preserved technical terms, zero arbitrary server-side code execution, and sub-2 MB bundle bounds.
4. **Open Innovation (10 Challenges)**: Simulated hazard map alternatives without safety guarantees, simulated sensor waste dispatch, static web civic dashboards, no facial recognition or vehicle tracking, allergen disclosures without food safety guarantees, and strictly no emergency medical diagnoses.

### Strict Theme Constraint Validator (`themeConstraintValidator.js`)
Integrated into `diversityService.js` (`validateHardRules`), this validator executes non-negotiable hackathon rule enforcement using affirmative violation detection, ensuring candidates never breach official organizer constraints while distinguishing between official requirements and prohibited implementation attempts.

### Source Provenance Mandate
Generated challenges maintain rigorous provenance:
- **Original Problem**: Direct friction point from official source.
- **Mandatory Restrictions**: Non-negotiable technical bounds.
- **Provided Resources**: Officially supplied datasets, starter templates, or libraries.
- **AI-Generated Enhancements**: Distinctly marked suggestions that are never misrepresented as organizer-supplied materials.
