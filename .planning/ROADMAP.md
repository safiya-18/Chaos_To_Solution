# Roadmap: Chaos to Solution Backend

## Phase 1: Project Scaffolding & Tooling Setup (COMPLETED)
- **Goal**: Establish the base Node.js/Express environment with ES modules, linting/test harness, and configuration.
- **Status**: Completed & Verified. All 4 initial integration tests passing.

## Phase 2: Curated Datasets, Offline Mock Endpoints & Integrity Tests (COMPLETED)
- **Goal**: Build curated reference datasets and local mock endpoints to serve as the offline fallback reservoir.
- **Status**: Completed & Verified. 20 problems, 15 restrictions, 15 resources, 5 mock endpoints, 17/17 tests passing.

## Phase 3: AI Challenge Generation Engine & Fallback Routing (COMPLETED)
- **Goal**: Integrate the official `@google/genai` SDK to generate theme-tailored, coherent challenge triads with structured outputs, validation, and curated fallback routing.
- **Status**: Completed & Verified. All 32 automated tests passing (15 challengeService, 7 dataValidation, 6 mock, 4 health).
- **Deliverables**:
  - Install `@google/genai` dependency and configure `GEMINI_API_KEY` in `env.js` and `.env.example`.
  - Implement `src/services/geminiService.js` with structured system prompt and schema.
  - Implement `src/services/fallbackService.js` to select curated triplets from Phase 2 banks when Gemini is offline or rate-limited.
  - Implement `src/utils/challengeValidator.js` to assert required fields, reasonable lengths, valid theme, and absence of banned paid/credentialed resources.
  - Implement `src/services/challengeService.js` orchestrating generation, validation, fallback handling, and in-memory anti-repeat buffer.
  - Unit tests covering prompt construction, schema validation, rate-limit fallback routing, and anti-repeat cache.

## Phase 4: REST API Endpoints, WhatsApp Formatter & Integration Tests (COMPLETED)
- **Goal**: Expose `POST /api/challenges/generate` with standardized JSON response envelopes, CORS, and full integration test coverage.
- **Status**: Completed & Verified. All 48 automated tests passing (16 challenge integration, 15 challengeService, 7 dataValidation, 6 mock, 4 health).
- **Deliverables**:
  - Implemented `src/routes/challenge.routes.js` supporting `POST /api/challenges/generate`.
  - Implemented `src/services/shareTextFormatter.js` formatting WhatsApp copy containing theme, problem, restriction, resource docs, and deliverable.
  - Implemented comprehensive Supertest integration tests in `tests/integration/challenge.test.js`.
  - Documented full API contract in `backend/API.md`.

## Phase 5: Frontend Integration Docs, UAT & Readiness
- **Goal**: Provide frontend documentation for Imadulla and verify complete end-to-end readiness.
- **Deliverables**:
  - `API.md` with full endpoints, request/response samples, source flags, and WhatsApp URL guide.
  - Conversational UAT report (`05-UAT.md`).
  - Final event runbook and operational check.
