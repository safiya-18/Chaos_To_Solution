# Phase 3 Plan: AI Challenge Generation Engine & Fallback Routing (Refined)

## Metadata
- **Phase**: 3
- **Focus**: Gemini API Integration, Theme-Based Prompting, Multi-Pillar Challenge Validation, High-Quality Curated Fallbacks, and Anti-Repeat Memory
- **Location**: `backend/`
- **Dependencies**: Phase 1 (Scaffolding & Tooling), Phase 2 (Curated Datasets & Mock Endpoints)
- **Status**: Refined & Ready for Review / Execution Approval

---

## 1. Objective
Build a robust, production-grade service layer that uses Google's official `@google/genai` SDK to generate cohesive, theme-tailored 3-part hackathon challenges (Problem, Restriction, Resource with guidance, and a concrete Deliverable). Enforce strict ~3-hour prototype feasibility and zero paid/credentialed dependencies via a holistic validator. Guarantee 100% event availability through an instant, transparent fallback mechanism powered by our audited Phase 2 curated datasets when Gemini is unreachable, rate-limited, or out of quota.

---

## 2. Refined Architectural Rules & Boundaries

1. **Theme Validation**:
   - Supported Themes (8): `EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.
   - **Explicit Error Behavior**: Missing or unapproved themes strictly throw a descriptive `ValidationError` (`"Invalid theme '<theme>'. Must be one of: ..."`). **Do not silently convert invalid themes into Open Innovation.**
   - HTTP status code mapping (e.g. 400 Bad Request) remains isolated to Phase 4 route controllers.
2. **Challenge Feasibility & Cohesion**:
   - The Gemini system prompt explicitly anchors the scope to a **single functional UI prototype achievable by 2–4 students within 180 minutes**.
   - Strictly disallows production-scale infrastructure (no user login/auth, no private databases, no payment processors, no external microservices, no specialized hardware).
   - The validator assesses the **complete challenge as a cohesive unit**:
     - The Problem must describe a concrete user pain point.
     - The Restriction must be actionable and technically verifiable.
     - The Resource must have legitimate documentation and actionable guidance showing *how* it applies to the problem.
     - The Deliverable must state a clear, achievable prototype scope.
3. **Resource Reliability & Static URL Validation**:
   - Validates resource documentation URLs via syntax and protocol patterns (`https://...`), **without making live HTTP pings during generation** (avoiding network latency and external site downtime).
   - Disallows resources requiring API keys, billing accounts, or hardware sensors.
4. **Fallback Audit & Resilience**:
   - All 8 themes have audited, pre-vetted problem mappings from `src/data/problems.json`.
   - Fallback engine checks combination compatibility and avoids recent repeats.
   - If all theme candidates have been recently used, it safely recycles the least-recently-used candidate rather than failing.
   - Every fallback challenge must pass `challengeValidator` with 100% compliance.
   - Fallback outputs are explicitly stamped with `"source": "curated-fallback"`.
5. **Scope Guardrails**:
   - No REST routes mounted in `app.js` during Phase 3 (reserved for Phase 4).
   - No frontend modifications.
   - No changes to Phase 1/2 files except config and dependency declarations.

---

## 3. Atomic Tasks

### Task 1: SDK Installation & Environment Configuration
- **Target Files**:
  - `backend/package.json`
  - `backend/.env.example`
  - `backend/src/config/env.js`
- **Actions**:
  - Install `@google/genai` into `backend/package.json`.
  - Add `GEMINI_API_KEY`, `GEMINI_MODEL` (default: `gemini-2.5-flash`), and `GEMINI_TIMEOUT_MS` (default: `5000`) to `backend/.env.example`.
  - Update `backend/src/config/env.js` to parse, validate, and export `geminiApiKey`, `geminiModel`, and `geminiTimeoutMs`.

### Task 2: Multi-Pillar Challenge Validator (`backend/src/utils/challengeValidator.js`)
- **Target File**: `backend/src/utils/challengeValidator.js`
- **Actions**:
  - Export `APPROVED_THEMES` array containing the 8 approved themes.
  - Export custom error class `ValidationError extends Error`.
  - Implement `validateTheme(theme)`:
    - Throws `ValidationError` if theme is falsy, not a string, or not in `APPROVED_THEMES`.
  - Define `BANNED_SERVICE_KEYWORDS`:
    - `openai`, `chatgpt`, `gpt-4`, `aws`, `azure`, `gcp`, `stripe`, `twilio`, `sendgrid`, `paid api`, `subscription`, `credit card`, `raspberry pi`, `arduino`, `bluetooth sensor`.
  - Implement `validateChallenge(challenge, requestedTheme)`:
    - Validates `theme` matches `requestedTheme` and is approved.
    - Validates `problem.title` (3-100 chars) and `problem.statement` (10-500 chars).
    - Validates `restriction.name` (3-100 chars) and `restriction.rule` (10-500 chars).
    - Validates `resource.name`, `resource.type` (`browser-api` | `public-api` | `local-dataset`), `resource.guidance` (10-500 chars), and `resource.docsUrl` (valid URL format: `^https?:\/\/.+`).
    - Validates `deliverable` (10-500 chars).
    - Full-text scan across all fields against `BANNED_SERVICE_KEYWORDS`.
    - Holistic cohesion check: Ensures resource guidance explains integration and deliverable provides clear prototype scope.
    - Returns `{ isValid: boolean, errors: string[] }`.

### Task 3: Audited Curated Fallback Service (`backend/src/services/fallbackService.js`)
- **Target File**: `backend/src/services/fallbackService.js`
- **Actions**:
  - Import Phase 2 datasets: `problems.json`, `restrictions.json`, `resources.json`.
  - Establish explicit theme-to-problem affinity map covering all 8 themes:
    - `EdTech` $\to$ `prob_prod_04` (Leitner Box), `prob_access_03` (Dyslexia Reader), `prob_prod_01` (Markdown Stream)
    - `FinTech` $\to$ `prob_campus_02` (Lending Ledger), `prob_civic_03` (E-Waste Credits)
    - `HealthTech` $\to$ `prob_civic_02` (Blood Donor Matcher), `prob_media_02` (Breathing Pacer), `prob_media_04` (Digital Detox)
    - `Sustainability` $\to$ `prob_campus_03` (Food-Waste Board), `prob_civic_03` (E-Waste Directory)
    - `Smart Cities` $\to$ `prob_campus_04` (Bus Route Beacon), `prob_civic_01` (Hazard Reporter), `prob_civic_04` (Disaster Shelter)
    - `Accessibility` $\to$ `prob_access_01` (High-Contrast Digest), `prob_access_02` (Voice SOS Alert), `prob_access_04` (Colorblind Checker)
    - `E-commerce` $\to$ `prob_campus_01` (Canteen Queue), `prob_campus_02` (Equipment Ledger)
    - `Open Innovation` $\to$ all 20 curated problems
  - Implement `generateFallback(theme, recentHistory = [])`:
    - Calls `validateTheme(theme)`.
    - Selects candidate problems matching theme affinity.
    - Filters out recent signatures present in `recentHistory` when alternatives exist.
    - Selects compatible restriction and resource.
    - Generates concrete prototype deliverable text tailored to the triplet.
    - Returns challenge object stamped with `"source": "curated-fallback"` and `"theme": theme`.

### Task 4: Gemini Client Service (`backend/src/services/geminiService.js`)
- **Target File**: `backend/src/services/geminiService.js`
- **Actions**:
  - Initialize `GoogleGenAI` client using `config.geminiApiKey`.
  - Craft system prompt with explicit 3-hour hackathon constraints:
    - Target: Single-flow prototype by student team in 180 minutes.
    - Disallowed: User registration/auth, paid APIs, private databases, backend servers, hardware sensors.
    - Cohesion: Resource must directly solve problem under restriction.
  - Apply strict JSON response schema:
    ```json
    {
      "theme": "string",
      "problem": { "title": "string", "statement": "string" },
      "restriction": { "name": "string", "rule": "string" },
      "resource": { "name": "string", "type": "string", "guidance": "string", "docsUrl": "string" },
      "deliverable": "string"
    }
    ```
  - Implement execution timeout via `AbortSignal.timeout(config.geminiTimeoutMs)`.
  - Include 1 retry on transient network errors.
  - Return parsed JSON challenge or throw error.

### Task 5: Challenge Orchestrator & Anti-Repeat Memory (`backend/src/services/challengeService.js`)
- **Target File**: `backend/src/services/challengeService.js`
- **Actions**:
  - Maintain an in-memory Ring Buffer (capacity: 30) of recent challenge signatures (`${theme}:${title}`).
  - Implement `generateChallenge(theme)`:
    1. Validate `theme` with `validateTheme(theme)`. Throws `ValidationError` if invalid or missing.
    2. Check if `config.geminiApiKey` is available. If missing, log warning and route directly to `fallbackService.generateFallback(theme, recentHistory)`.
    3. Call `geminiService.generate(theme, recentHistory)`.
    4. Run result through `challengeValidator.validateChallenge`.
    5. If valid, format with `"source": "ai"` and record signature in anti-repeat memory.
    6. If Gemini throws (timeout, 429 quota, network drop) OR validation fails, log reason, call `fallbackService.generateFallback(theme, recentHistory)`, record signature, and return.

### Task 6: Comprehensive Unit Test Suite (`backend/tests/unit/challengeService.test.js`)
- **Target File**: `backend/tests/unit/challengeService.test.js`
- **Actions**:
  - **Theme Validation Tests**:
    - Fails on empty, null, or invalid theme string with `ValidationError`.
    - Passes for all 8 approved themes.
  - **Challenge Validator Tests**:
    - Passes complete, valid challenge.
    - Rejects banned keywords (OpenAI, Stripe, AWS, Raspberry Pi).
    - Rejects invalid URL format or missing deliverable.
  - **Fallback Service Tests**:
    - Every one of the 8 approved themes produces a valid fallback challenge.
    - All fallback challenges pass `challengeValidator` with 0 errors.
    - Explicitly stamps `"source": "curated-fallback"`.
    - Successfully avoids recent signatures when candidates exist.
  - **Orchestrator Tests**:
    - Returns `"source": "ai"` when Gemini succeeds and validates.
    - Seamlessly falls back with `"source": "curated-fallback"` on Gemini timeout.
    - Seamlessly falls back on Gemini 429 rate limit.
    - Seamlessly falls back on malformed/invalid Gemini response.
    - Operates safely without crashing when `GEMINI_API_KEY` is not set.
    - Anti-repeat memory correctly records signatures.

### Task 7: Regression Check & Documentation Update
- **Target File**: `backend/README.md`
- **Actions**:
  - Run full test suite `npm test` verifying 100% pass across all tests.
  - Update `backend/README.md` with environment configuration instructions for `GEMINI_API_KEY`.

---

## 4. Verification & Acceptance Criteria
1. **Strict Theme Validation**: `validateTheme()` throws descriptive `ValidationError` for any unapproved or missing theme.
2. **All 8 Themes Verified**: Both Gemini prompt builder and `fallbackService` support all 8 approved themes.
3. **Holistic Feasibility Gate**: `challengeValidator` strictly detects and blocks paid APIs, hardware requirements, or missing deliverable guidance.
4. **Static URL Validation**: Resource documentation URLs are verified via URL syntax regex without blocking network calls.
5. **Zero-Downtime Fallback**: Simulated Gemini failures (timeout, 429, parse error, missing API key) gracefully return a valid curated fallback stamped `"source": "curated-fallback"`.
6. **Zero Regressions**: All 17 previous tests in `health.test.js`, `mock.test.js`, and `dataValidation.test.js` continue to pass.
7. **Scope Discipline**: No REST endpoint implemented in `app.js` (Phase 4 scope preserved).
