# Roadmap: Chaos to Solution Backend

## Phase 1: Project Scaffolding & Tooling Setup (COMPLETED)
- **Goal**: Establish the base Node.js/Express environment with ES modules, linting/test harness, and configuration.
- **Status**: Completed & Verified. All 4 initial integration tests passing.

## Phase 2: Curated Datasets, Offline Mock Endpoints & Integrity Tests (COMPLETED)
- **Goal**: Build curated reference datasets and local mock endpoints to serve as the offline fallback reservoir.
- **Status**: Completed & Verified. 20 problems, 15 restrictions, 15 resources, 5 mock endpoints, 17/17 tests passing.

## Phase 3: AI Challenge Generation Engine & Fallback Routing (ACTIVE)
- **Goal**: Integrate the official `@google/genai` SDK to generate theme-tailored, coherent challenge triads with structured outputs, validation, and curated fallback routing.
- **Deliverables**:
  - Install `@google/genai` dependency and configure `GEMINI_API_KEY` in `env.js` and `.env.example`.
  - Implement `src/services/geminiService.js` with structured system prompt and schema.
  - Implement `src/services/fallbackService.js` to select curated triplets from Phase 2 banks when Gemini is offline or rate-limited.
  - Implement `src/utils/challengeValidator.js` to assert required fields, reasonable lengths, valid theme, and absence of banned paid/credentialed resources.
  - Implement `src/services/challengeService.js` orchestrating generation, validation, fallback handling, and in-memory anti-repeat buffer.
  - Unit tests covering prompt construction, schema validation, rate-limit fallback routing, and anti-repeat cache.

## Phase 4: REST API Endpoints, WhatsApp Formatter & Integration Tests
- **Goal**: Expose `POST /api/challenges/generate` with standardized JSON response envelopes, CORS, and full integration test coverage.
- **Deliverables**:
  - Implement `src/routes/challenge.routes.js` supporting `POST /api/challenges/generate` (and optional `GET` fallback).
  - Implement `src/services/shareTextFormatter.js` formatting WhatsApp copy containing theme, problem, restriction, resource, and deliverable.
  - Supertest integration tests verifying AI generation path, theme validation, and graceful fallback on simulated AI provider failure.

## Phase 5: Frontend Integration Docs, UAT & Readiness
- **Goal**: Provide frontend documentation for Imadulla and verify complete end-to-end readiness.
- **Deliverables**:
  - `API.md` with full endpoints, request/response samples, source flags, and WhatsApp URL guide.
  - Conversational UAT report (`05-UAT.md`).
  - Final event runbook and operational check.
