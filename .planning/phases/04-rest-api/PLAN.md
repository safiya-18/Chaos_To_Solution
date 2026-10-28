# Phase 4 Plan: REST API Endpoints, WhatsApp Formatter & Integration Tests

## Metadata
- **Phase**: 4
- **Focus**: REST API Routes (`POST /api/challenges/generate`), WhatsApp Formatter, Supertest Integration Harness, and Frontend Contract Stabilization (`API.md`)
- **Location**: `backend/`
- **Dependencies**: Phase 1 (App Scaffolding & Error Handlers), Phase 2 (Curated Datasets & Mock Routes), Phase 3 (Gemini Service, Challenge Validator, Fallback Service & Orchestrator)
- **Status**: Ready for Review / Approval

---

## 1. Objective
Expose a production-ready, resilient REST API endpoint `POST /api/challenges/generate` that serves theme-tailored challenges (AI or curated fallback) to the completed frontend. Format challenge output with unique IDs, ISO timestamps, and a WhatsApp-ready sharing payload (`shareText`). Provide comprehensive Supertest integration coverage with mocked Gemini interactions, and document the complete contract in `backend/API.md`.

---

## 2. Architectural Findings & Reconciled Contract

### Frontend Inspection (`origin/main` - Imadulla's implementation)
- **Endpoint expected**: `POST /api/challenges/generate` with payload `{ "theme": "<theme>" }`.
- **Validation**: Frontend `validateChallenge.js` strictly validates the response envelope:
  - Requires `{ success: true, data: { ... } }` or compatible root payload.
  - Requires `data.theme` to be one of the 8 approved themes.
  - Requires `data.source` to be `'ai'` or `'curated-fallback'`.
  - Expects `data.id`, `data.generatedAt`, and core `data.challenge` containing `problem`, `restriction`, `resource` (with `name`, `type`, `guidance`, `docsUrl`), and `deliverable`.
  - Supports `data.shareText` directly.
- **WhatsApp Sharing**:
  - Frontend `WhatsAppShareForm.jsx` validates Indian 10-digit mobile numbers (+91), encodes text, and initiates `window.open('https://wa.me/91...' + encodedText)`.
  - Backend provides `shareText` pre-formatted with clean markdown formatting (`*bold*`, `_italic_`, line breaks), eliminating client-side formatting discrepancies.
- **CORS & Port**:
  - Frontend Vite dev server defaults to `http://localhost:5173`.
  - Backend default `CORS_ORIGIN=http://localhost:5173,http://localhost:3000` already authorizes this origin.

### Reconciled API Response Envelope
```json
{
  "success": true,
  "data": {
    "id": "cts-edtech-m3f9g1k",
    "theme": "EdTech",
    "generatedAt": "2026-10-27T05:45:00.000Z",
    "source": "ai",
    "challenge": {
      "theme": "EdTech",
      "problem": {
        "title": "Interactive Leitner Flashcard Trainer",
        "statement": "Students preparing for exams lose focus because repetitive notes lack spaced-repetition scheduling."
      },
      "restriction": {
        "name": "Zero Client-Side Frameworks",
        "rule": "The frontend must be written in vanilla HTML, modern CSS, and plain JavaScript without React, Vue, or build tooling."
      },
      "resource": {
        "name": "Web Storage API (LocalStorage)",
        "type": "browser-api",
        "guidance": "Use localStorage to track card box levels, review intervals, and recall streak stats.",
        "docsUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
      },
      "deliverable": "A responsive single-page flashcard app with spaced-repetition buckets and progress visualization."
    },
    "shareText": "⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡\n_IEEE Computer Society | SJC Institute of Technology_\n\n🏷️ *Theme:* EdTech\n🆔 *Challenge ID:* #cts-edtech-m3f9g1k [AI Generated]\n\n━━━━━━━━━━━━━━━━━━━━\n📌 *01 — PROBLEM STATEMENT*\n*Interactive Leitner Flashcard Trainer*\nStudents preparing for exams lose focus because repetitive notes lack spaced-repetition scheduling.\n\n⚠️ *02 — TECHNICAL RESTRICTION*\n*Zero Client-Side Frameworks*\nRule: The frontend must be written in vanilla HTML, modern CSS, and plain JavaScript without React, Vue, or build tooling.\n\n🛠️ *03 — RESOURCE*\n*Web Storage API (LocalStorage)* (browser-api)\nGuidance: Use localStorage to track card box levels, review intervals, and recall streak stats.\nDocs: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage\n\n🎯 *04 — EXPECTED DELIVERABLE*\nA responsive single-page flashcard app with spaced-repetition buckets and progress visualization.\n━━━━━━━━━━━━━━━━━━━━\n\n💡 *Sprint Time:* ~3 hours\nReady to build? Turn chaos into solution!"
  }
}
```

---

## 3. Atomic Implementation Tasks

### Task 1: WhatsApp Share Formatter (`backend/src/services/shareTextFormatter.js`)
- **Target File**: `backend/src/services/shareTextFormatter.js`
- **Actions**:
  - Implement `formatChallengeForWhatsApp({ id, theme, source, challenge })`.
  - Format source badge: `AI Generated` for `'ai'`, `Backup Challenge` for `'curated-fallback'`.
  - Build clean WhatsApp-compatible text containing:
    - Event banner: `⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡` and `_IEEE Computer Society | SJC Institute of Technology_`
    - Theme & Challenge ID
    - Problem Statement with title
    - Technical Restriction with rule
    - Resource with type, guidance, and docs URL
    - Expected Deliverable
    - Sprint duration (~3 hours) and call-to-action
  - Export `formatChallengeForWhatsApp` and helper `generateChallengeId(theme)`.
  - Ensure zero external network calls or SMS/WhatsApp API dependencies.

### Task 2: Challenge REST Routes & Controller (`backend/src/routes/challenge.routes.js`)
- **Target File**: `backend/src/routes/challenge.routes.js`
- **Actions**:
  - Create Express `Router()`.
  - Implement handler for `POST /generate`:
    1. Extract `theme` from `req.body`.
    2. Check if `theme` is provided; if missing, throw `new ValidationError("Missing required field 'theme' in request body.", "MISSING_THEME")` with status 400.
    3. Pass `theme` to `challengeService.generateChallenge(theme)`. If `validateTheme` throws, `ValidationError` is propagated with HTTP 400.
    4. Generate unique challenge ID (`cts-<themename>-<timestamp_base36>`).
    5. Construct complete response payload with `id`, `theme`, `generatedAt` (ISO-8601), `source`, `challenge`, and `shareText` (via `shareTextFormatter`).
    6. Return `res.status(200).json({ success: true, data: responsePayload })`.
  - Implement optional convenience fallback `GET /generate?theme=<theme>` for quick manual testing/monitoring in browser.
  - Export `router`.

### Task 3: Mount Routes & Error Mapping (`backend/src/app.js` & `backend/src/utils/challengeValidator.js`)
- **Target Files**:
  - `backend/src/utils/challengeValidator.js`
  - `backend/src/middlewares/errorHandler.js`
  - `backend/src/app.js`
- **Actions**:
  - Update `ValidationError` in `challengeValidator.js` to set `this.statusCode = 400`.
  - Verify `errorHandler.js` maps `err.statusCode || (err.name === 'ValidationError' ? 400 : 500)` and status 400 for malformed JSON bodies (`SyntaxError`).
  - Import `challengeRouter` in `backend/src/app.js` and mount at `/api/challenges`.

### Task 4: Comprehensive Supertest Integration Tests (`backend/tests/integration/challenge.test.js`)
- **Target File**: `backend/tests/integration/challenge.test.js`
- **Actions**:
  - Create full integration test suite using `supertest(app)`:
    - **Happy Path (8 Themes)**:
      - Test `POST /api/challenges/generate` with `{ "theme": "EdTech" }` returns HTTP 200, `{ success: true }`, valid `data.challenge`, `data.source`, and `data.shareText`.
      - Test all 8 approved themes are accepted and return 200 OK.
    - **Validation Errors (HTTP 400)**:
      - Missing theme (`{}` and `{ "theme": "" }`) returns 400 Bad Request with `{ success: false, error: { code: 'MISSING_THEME' } }`.
      - Invalid/unsupported theme (`{ "theme": "QuantumComputing" }`) returns 400 Bad Request with `{ success: false, error: { code: 'INVALID_THEME' } }`.
      - Malformed JSON string in request body returns 400 Bad Request with standard error envelope.
    - **AI vs. Fallback Resilience**:
      - Mock Gemini success $\to$ returns `source: "ai"`.
      - Mock Gemini failure (429 Rate Limit / Timeout) $\to$ gracefully returns `source: "curated-fallback"` with 200 OK.
    - **WhatsApp ShareText Integrity**:
      - Verify `shareText` string exists and contains all required sections (problem, restriction, resource docs, deliverable).
    - **Regression Suite**:
      - Verify `GET /api/health` and `GET /api/mock/:dataset` continue to pass without regression.

### Task 5: Frontend Contract Documentation (`backend/API.md`)
- **Target File**: `backend/API.md`
- **Actions**:
  - Write complete, beginner-friendly integration documentation for Imadulla and team:
    - Base URL & Environment configurations (`VITE_API_BASE_URL`).
    - Endpoint: `POST /api/challenges/generate`.
    - Request headers & body schema with examples.
    - Approved themes enum table.
    - Success response structure with field descriptions (`id`, `theme`, `generatedAt`, `source`, `challenge`, `shareText`).
    - Error responses table (HTTP 400 `MISSING_THEME`, `INVALID_THEME`, HTTP 404, HTTP 500).
    - WhatsApp Click-to-Chat integration guide (`wa.me` URL construction with phone validation rules).
    - Local verification steps via `curl` and `npm test`.

### Task 6: Documentation Reconcile & State Update
- **Target Files**:
  - `backend/README.md`
  - `.planning/STATE.md`
  - `.planning/ROADMAP.md`
- **Actions**:
  - Update `backend/README.md` API reference to document `/api/challenges/generate`.
  - Update `.planning/STATE.md` to reflect Phase 4 plan readiness.
  - Run full test suite to verify 100% pass across all existing and new tests.

---

## 4. Verification & Acceptance Criteria
1. **Endpoint Availability**: `POST /api/challenges/generate` responds on `http://localhost:5000/api/challenges/generate`.
2. **Strict Theme Validation**: All 8 approved themes return HTTP 200. Any missing, empty, or unapproved theme returns HTTP 400.
3. **No Silent Replacements**: Unsupported themes strictly fail with HTTP 400 (never coerced into Open Innovation).
4. **Resilience & Fallback**: AI quota limits or network dropouts automatically yield a valid curated fallback stamped `"source": "curated-fallback"` without 500 errors.
5. **WhatsApp Integration**: `data.shareText` matches the agreed formatting specifications, ready for `wa.me` link generation.
6. **Zero Leaks**: `GEMINI_API_KEY` remains completely server-side in `.env` and never enters HTTP response payloads.
7. **Regression Guarantee**: All 32 existing tests in `health.test.js`, `mock.test.js`, `dataValidation.test.js`, and `challengeService.test.js` continue to pass.
