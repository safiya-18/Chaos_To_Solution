# Phase 3 Plan: AI Challenge Generation Engine & Fallback Routing

## Metadata
- **Phase**: 3
- **Focus**: Gemini API Integration, Theme-Based Prompting, Output Validation, Curated Fallback Routing, and Anti-Repeat Memory
- **Location**: `backend/`
- **Dependencies**: Phase 1 (Scaffolding & Tooling), Phase 2 (Curated Datasets & Mock Endpoints)
- **Status**: Ready for Review / Execution Approval

---

## 1. Objective
Build the core backend generation engine that uses Google's official `@google/genai` SDK to generate coherent, theme-tailored 3-part hackathon challenges (Problem, Restriction, Resource, Deliverable). Enforce strict ~3-hour prototype feasibility and zero paid/credentialed dependencies via a deterministic validator. Guarantee 100% event availability through an instant, transparent fallback mechanism powered by our Phase 2 curated datasets when Gemini is unreachable, rate-limited, or out of quota.

---

## 2. Scope & Technical Architecture

1. **AI Provider**: Google Gemini via `@google/genai` (default model: `gemini-2.5-flash` or `gemini-1.5-flash`).
2. **Approved Themes**: `EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.
3. **Structured Outputs**: Native JSON schema enforcement for predictable parsing.
4. **Resilience & Timeouts**: Configurable timeout (default: 5,000ms), 1 retry attempt, and automatic routing to `fallbackService`.
5. **Output Validation (`challengeValidator.js`)**: Structural integrity, reasonable string lengths, valid documentation URLs, and absence of banned paid/proprietary services.
6. **Fallback Mechanism (`fallbackService.js`)**: Selects pre-vetted triplets from Phase 2 banks tailored to the theme with explicit indicator: `"source": "curated-fallback"`.
7. **Anti-Repeat History**: In-memory ring buffer (capacity: 30) of recent challenge signatures.
8. **Constraint Boundary**: Do **not** implement the Express REST route (`POST /api/challenges/generate`) in this phase — that is reserved for Phase 4.

---

## 3. Atomic Tasks

### Task 1: SDK Installation & Environment Configuration
- **Target Files**:
  - `backend/package.json`
  - `backend/.env.example`
  - `backend/src/config/env.js`
- **Actions**:
  - Install `@google/genai` into `backend/package.json`.
  - Update `backend/.env.example` to document `GEMINI_API_KEY`, `GEMINI_MODEL` (default: `gemini-2.5-flash`), and `GEMINI_TIMEOUT_MS` (default: `5000`).
  - Update `backend/src/config/env.js` to parse, validate, and export `geminiApiKey`, `geminiModel`, and `geminiTimeoutMs`.

### Task 2: Deterministic Challenge Validator (`backend/src/utils/challengeValidator.js`)
- **Target File**: `backend/src/utils/challengeValidator.js`
- **Actions**:
  - Define `APPROVED_THEMES` array (8 themes).
  - Define `BANNED_SERVICE_KEYWORDS` (e.g., `openai`, `gpt`, `aws`, `azure`, `gcp`, `stripe`, `twilio`, `paid api`, `subscription`, `credit card`, `raspberry pi`, `arduino`).
  - Implement `validateChallenge(challenge, requestedTheme)`:
    - Verifies theme matches requested theme and is in `APPROVED_THEMES`.
    - Verifies `problem.title` (3-100 chars) and `problem.statement` (10-500 chars).
    - Verifies `restriction.name` (3-100 chars) and `restriction.rule` (10-500 chars).
    - Verifies `resource.name`, `resource.type` (`browser-api` | `public-api` | `local-dataset`), `resource.guidance` (10-500 chars), and `resource.docsUrl` (valid HTTP/HTTPS).
    - Verifies `deliverable` (10-500 chars).
    - Scans all text fields against `BANNED_SERVICE_KEYWORDS`.
    - Returns `{ isValid: boolean, errors: string[] }`.

### Task 3: Curated Fallback Service (`backend/src/services/fallbackService.js`)
- **Target File**: `backend/src/services/fallbackService.js`
- **Actions**:
  - Import Phase 2 datasets: `problems.json`, `restrictions.json`, `resources.json`.
  - Map the 8 themes to compatible problem domains and tags (e.g. `Sustainability` $\to$ E-waste, food waste; `Accessibility` $\to$ screen readers, high-contrast, speech; `FinTech` $\to$ ledger, escrow, pricing).
  - Implement `generateFallback(theme, recentHistory)`:
    - Filters problems by theme affinity.
    - Picks a compatible restriction and resource that avoid recent combinations in `recentHistory`.
    - Constructs deliverable guidance.
    - Returns challenge object with `"source": "curated-fallback"` and `"theme": theme`.

### Task 4: Gemini Client Service (`backend/src/services/geminiService.js`)
- **Target File**: `backend/src/services/geminiService.js`
- **Actions**:
  - Initialize `GoogleGenAI` client using `config.geminiApiKey`.
  - Construct system prompt anchoring the model to ~3-hour hackathon prototype feasibility, zero credentials, and keyless resources.
  - Enforce native response schema (theme, problem, restriction, resource, deliverable).
  - Implement request timeout using `AbortSignal.timeout(config.geminiTimeoutMs)`.
  - Include single retry on transient network errors.
  - Return parsed JSON challenge object or throw on failure.

### Task 5: Challenge Orchestrator & Anti-Repeat Memory (`backend/src/services/challengeService.js`)
- **Target File**: `backend/src/services/challengeService.js`
- **Actions**:
  - Coordinate `geminiService`, `challengeValidator`, and `fallbackService`.
  - Maintain an in-memory Ring Buffer (FIFO, max 30) storing recent challenge signatures (`${theme}:${title}`).
  - Generation Flow:
    1. Validate requested theme (defaults to `'Open Innovation'` if omitted or invalid).
    2. If `config.geminiApiKey` is missing or empty, log notice and route immediately to `fallbackService`.
    3. Call `geminiService.generate(theme, recentHistory)`.
    4. Pass result through `challengeValidator.validateChallenge`.
    5. If valid, format with `"source": "ai"` and record signature in anti-repeat buffer.
    6. If Gemini fails (timeout, 429 quota, network failure, or invalid schema), catch error, log warning, and call `fallbackService.generateFallback(theme, recentHistory)`.
    7. Return standardized challenge object.

### Task 6: Unit Test Suite (`backend/tests/unit/challengeService.test.js`)
- **Target File**: `backend/tests/unit/challengeService.test.js`
- **Actions**:
  - **Validation Tests**:
    - Valid challenge passes with `isValid: true`.
    - Mismatched or unapproved theme fails.
    - Banned keywords (e.g. OpenAI or Stripe dependencies) fail validation.
    - String length violations fail validation.
  - **Fallback Service Tests**:
    - Every approved theme produces a valid, complete fallback challenge.
    - All fallback challenges pass `challengeValidator`.
    - Explicitly marks `"source": "curated-fallback"`.
  - **Orchestrator Tests**:
    - Returns `"source": "ai"` when Gemini succeeds.
    - Gracefully triggers fallback with `"source": "curated-fallback"` when Gemini throws 429, times out, or returns invalid structure.
    - Operates safely without crashing when `GEMINI_API_KEY` is undefined.
    - Anti-repeat memory records recent signatures.

### Task 7: Regression Verification & State Update
- **Target Files**:
  - `.planning/STATE.md`
- **Actions**:
  - Run full test suite `npm test` verifying that all 17 existing tests (health, mock, dataValidation) plus all new Phase 3 tests pass.
  - Update `STATE.md` with Phase 3 completion metrics and results.

---

## 4. Verification & Acceptance Criteria
1. **Dependency Integrity**: `@google/genai` installed cleanly without breaking ES module compatibility.
2. **Secrets Protection**: `GEMINI_API_KEY` is loaded strictly via environment, never printed in test outputs or Git commits.
3. **8 Theme Coverage**: Validated for all 8 approved themes.
4. **Feasibility & Guardrail Compliance**: `challengeValidator` strictly detects and rejects banned paid APIs or unrealistic full-stack deliverables.
5. **Zero-Downtime Fallback**: If Gemini fails (simulated timeout, quota exceeded, or network severed), the orchestrator returns a valid curated fallback with `"source": "curated-fallback"`.
6. **Zero Regressions**: All 17 previous tests in `tests/integration/health.test.js`, `tests/integration/mock.test.js`, and `tests/unit/dataValidation.test.js` continue to pass.
7. **Scope Discipline**: No REST generation endpoint mounted in `app.js` (reserved for Phase 4).
