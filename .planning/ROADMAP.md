# Roadmap: Chaos to Solution Backend

## Phase 1: Project Scaffolding & Tooling Setup
- **Goal**: Establish the base Node.js/Express environment with ES modules, linting/test harness, and configuration.
- **Deliverables**:
  - `package.json` (ES modules, scripts for start, dev, test)
  - Dependencies installed (`express`, `cors`, `helmet`, `dotenv`, `vitest`, `supertest`)
  - Project directory layout (`src/`, `src/data/`, `src/routes/`, `src/services/`, `tests/`)
  - `.env.example`, `.gitignore`
  - Minimal Express app bootstrap with basic test runner verification

## Phase 2: Challenge Bank Design & Curated Dataset
- **Goal**: Design and populate curated, high-quality JSON banks tailored for a 3-hour hackathon build.
- **Deliverables**:
  - `src/data/problems.json` (15-20 diverse, realistic prompts across campus, productivity, civic tech)
  - `src/data/restrictions.json` (15-20 creative constraints with difficulty ratings)
  - `src/data/resources.json` (15-20 specific APIs, web browser capabilities, and datasets)
  - Data schema validation utility to ensure all items conform to required structure and compatibility tags

## Phase 3: Generation Logic, Compatibility Engine & Anti-Repeat Buffer
- **Goal**: Build the core algorithm that picks compatible triplets and avoids recent repeats.
- **Deliverables**:
  - Compatibility engine checking constraint matrix (e.g., offline vs remote API conflict)
  - Sliding window de-duplication buffer (in-memory ring buffer)
  - Challenge assembly with formatted WhatsApp share text
  - Comprehensive unit tests covering combination generation, edge cases, and fallback mechanisms

## Phase 4: REST API Endpoints & Middleware
- **Goal**: Expose robust, clean endpoints with consistent JSON envelope formatting and CORS.
- **Deliverables**:
  - `GET /api/health` endpoint
  - `POST /api/challenges/generate` (and optional `GET /api/challenges/generate`) endpoint
  - Standardized JSON response middleware & centralized error handler (404, 500)
  - CORS configuration tailored for frontend consumption
  - Integration tests using Supertest for all routes and error scenarios

## Phase 5: Frontend Integration Docs, UAT & Readiness
- **Goal**: Provide frontend documentation for Imadulla and verify deployment readiness.
- **Deliverables**:
  - `API.md` with full endpoints, request/response examples, status codes, and WhatsApp URL formulation helper
  - End-to-end verification and testing reports
  - Event runbook and quickstart instructions
