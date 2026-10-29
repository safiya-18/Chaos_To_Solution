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

## Phase 5: Frontend Integration Docs, UAT & Readiness (COMPLETED)
- **Goal**: Provide frontend documentation for Imadulla and verify complete end-to-end readiness.
- **Status**: Completed & Verified. All 78 tests passing (48 backend, 30 frontend). E2E integration across all 8 themes verified.
- **Deliverables**:
  - `backend/API.md` documenting complete REST API contract and WhatsApp specifications.
  - Conversational UAT report (`.planning/phases/05-integration/05-UAT.md`).
  - Operational event runbook (`EVENT_RUNBOOK.md`).
  - Dual-service running instructions in `backend/README.md`.

## Phase 6: Groq AI Provider Integration (COMPLETED & VERIFIED)
- **Goal**: Replace Gemini as the default AI generation engine with Groq while preserving Gemini as an optional provider and retaining the curated challenge fallback.
- **Status**: Completed & Verified. All 95 automated tests passing (65 backend, 30 frontend).
- **Deliverables**:
  - `groq-sdk` integration with strict JSON schema outputs (`openai/gpt-oss-20b`).
  - Decoupled `groqService.js` and configurable multi-provider dispatcher in `challengeService.js`.
  - Fail-fast sub-second error and rate-limit handling (< 1000ms failover to curated fallback).
  - Comprehensive unit and integration test coverage for Groq provider and provider switching.
  - Updated API docs, runbook, and environment configuration.

## Phase 7: Shared Event Timer & MongoDB Team Challenge Persistence (COMPLETED & VERIFIED)
- **Goal**: Implement a shared event-wide authoritative 4-hour countdown timer and persistent team registration using MongoDB.
- **Status**: Completed & Verified. All 148 automated tests passing (98 backend, 50 frontend).
- **Deliverables**:
  - MongoDB integration using Mongoose with resilient connection manager, connection lifecycle logging, and health readiness probe.
  - Team registration and assignment persistence (`POST /api/teams`, `GET /api/teams/:id`) collecting team name (2-50 chars) before generation.
  - Unique team name enforcement (case-insensitive `normalizedTeamName`) returning `409 TEAM_ALREADY_EXISTS`.
  - Full preservation of challenge pillars, provenance (`ai` vs `curated-fallback`), and metadata without storing personal data.
  - Shared event-wide 4-hour timer model (`EventTimer`) with authoritative server clock math (`startedAt`, `endsAt`, `pausedAt`).
  - Operator-only timer mutation endpoints (`/start`, `/pause`, `/resume`, `/reset`) secured with `EVENT_ADMIN_TOKEN` via constant-time verification.
  - Public `GET /api/event-timer` endpoint polled periodically by frontend with local 1s tick and visual warning thresholds (< 60m amber, < 10m red).

## Phase 8: UI Redesign & Security Hardening — Event Dashboard, 4-Hour Timer & Team Table (COMPLETED & VERIFIED)
- **Goal**: Redesign the existing CTS application into a clean, professional event-management interface centered on 3 connected screens, fix the `next is not a function` persistence bug, provide a full-screen projector timer and team challenge table, harden operator authorization, and polish modal UI.
- **Status**: Completed & Verified. All 177 automated tests passing (112 backend across 11 suites, 65 frontend across 11 suites). Clean production build.
- **Deliverables**:
  - Root cause fix for `Failed to persist team challenge assignment: next is not a function` in `backend/src/models/TeamAssignment.js` using synchronous validation hooks and regression unit test `tests/unit/teamAssignmentModel.test.js`.
  - Added `listTeams` service and `GET /api/teams` endpoint with search, theme filter, and sorting.
  - Protected operator team deletion (`DELETE /api/teams/:id`) requiring `EVENT_ADMIN_TOKEN` via constant-time authentication (`crypto.timingSafeEqual`).
  - Zero credential leakage: operator tokens are entered on-demand and kept strictly in ephemeral React component memory—never written to `localStorage` or `sessionStorage`.
  - Custom browser history router (`frontend/src/router/Router.jsx`) supporting clean URLs `/`, `/timer`, `/teams` without page reloads.
  - **Screen 1: Event Dashboard (`/`)**: Compact event identity, 3 metric chips (4 Hours, 2 Members, Real Problems), 2 navigation action cards (Live Event Timer, Team Challenges), team registration input (max 50 chars), 8-theme selection grid, Generate button, and challenge results with 4 pillars + WhatsApp share.
  - **Screen 2: Live Event Timer (`/timer`)**: Large centered 4-hour countdown (`04:00:00`) for seminar hall projection, status label (NOT STARTED, RUNNING, PAUSED, COMPLETED), operator-protected Start/Pause/Resume/Reset controls via `EVENT_ADMIN_TOKEN`, fullscreen toggle.
  - **Screen 3: Team Challenge Table (`/teams`)**: Searchable, filterable, sortable table of persisted team assignments from MongoDB, `#`, Team Name, Theme, Problem, Restriction, Resource, Deliverable, Generated At, mission detail modal with 4 pillars, custom sleek scrollbar (`.custom-modal-scrollbar`), operator delete modal, refresh button with last updated timestamp.
  - Comprehensive unit and integration test coverage for all screens and navigation flows (112 backend tests, 65 frontend tests).
  - Backward compatibility of `POST /api/challenges/generate` and existing AI cascade preserved 100%.

## Phase 9: Production Deployment & Cloud Hardening — Render, Vercel & MongoDB Atlas (PREPARED & VERIFIED)
- **Goal**: Prepare, harden, and document production deployment across Render (backend), Vercel (frontend), and MongoDB Atlas, with zero secret leaks, SPA rewrites, and full CORS allowlist support.
- **Status**: Prepared & Locally Verified. 178 automated tests passing (113 backend across 11 suites, 65 frontend across 11 suites). Production build ready in 1.27s.
- **Deliverables**:
  - Bound backend Express server explicitly to `0.0.0.0` with configurable `process.env.HOST` for cloud container hosting.
  - Hardened CORS origin delegate to dynamically allow explicit production domains (`https://cts.vercel.app`, `https://ctschallenge.vercel.app`) as well as Vercel preview subdomains (`*.vercel.app`) while rejecting untrusted origins.
  - Added `frontend/vercel.json` SPA history rewrite rule to guarantee direct loads of `/timer` and `/teams` resolve without 404 errors.
  - Created root `render.yaml` Blueprint specification with `sync: false` for all secret credentials.
  - Authored comprehensive `DEPLOYMENT.md` operational runbook covering Atlas network access, Render deployment, Vercel custom domains, and non-destructive post-deployment smoke verification.


