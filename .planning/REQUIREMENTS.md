# Requirements: Chaos to Solution Backend

## Functional Requirements (FR)

### FR-1: Health Check Endpoint
- **FR-1.1**: `GET /api/health` returns HTTP 200 with server status, timestamp, uptime, and version.
- **FR-1.2**: Responds swiftly with negligible resource overhead.

### FR-2: Curated Offline Fallback Datasets & Mock Endpoints
- **FR-2.1**: Preserved curated JSON banks (`problems.json`, `restrictions.json`, `resources.json`) in `src/data/`.
- **FR-2.2**: Dedicated offline mock endpoints (`GET /api/mock/:dataset`) serving static sample data for public APIs.
- **FR-2.3**: Used exclusively as the fallback mechanism during provider outages or rate-limit saturation.

### FR-3: AI-Powered Theme-Based Challenge Generation
- **FR-3.1**: Endpoint `POST /api/challenges/generate` accepting a selected theme (`EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`).
- **FR-3.2**: Generates Problem, Restriction, Resource, and Deliverable together via Gemini API structured output.
- **FR-3.3**: Enforces ~3-hour prototype feasibility anchor across all themes without difficulty selector options.
- **FR-3.4**: Returns explicit source indicator: `"source": "ai"` or `"source": "curated-fallback"`.
- **FR-3.5**: Formats an ready-to-use `shareText` string optimized for WhatsApp URL encoding.

### FR-4: Output Validation & Anti-Repeat Mechanism
- **FR-4.1**: Validates Gemini response for complete schema, non-empty text, reasonable string lengths, and absence of banned paid/credentialed services.
- **FR-4.2**: In-memory sliding window cache tracking recent challenge fingerprints/titles to reduce immediate repetition.

### FR-5: Resilience, Timeouts & Graceful Fallback
- **FR-5.1**: Configurable request timeout (e.g. 5,000ms) and limited retry (1 attempt) for Gemini calls.
- **FR-5.2**: Automatic fallback to Phase 2 curated bank upon timeout, rate-limiting (HTTP 429), or quota exhaustion, ensuring students always receive a valid challenge.

### FR-6: Security & Cross-Origin Configuration
- **FR-6.1**: `GEMINI_API_KEY` stored exclusively in `backend/.env` and validated in `env.js`. Never committed or exposed to frontend.
- **FR-6.2**: CORS enabled with configurable origins via `CORS_ORIGIN` env variable.
- **FR-6.3**: HTTP security headers using `helmet`.

### FR-7: Frontend Developer Integration & Documentation
- **FR-7.1**: Provide clear markdown API documentation (`API.md`) detailing request payloads, response samples, source indicators, and WhatsApp formatting for Imadulla.
- **FR-7.2**: Supply `.env.example` with `GEMINI_API_KEY` placeholder.

### FR-8: Configurable Multi-Provider AI Generation (Groq & Gemini)
- **FR-8.1**: Support configurable `AI_PROVIDER` (`groq` default, `gemini` secondary) via environment variables.
- **FR-8.2**: Integrate `groq-sdk` with strict JSON schema outputs using `llama-3.3-70b-versatile` (or `llama-3.1-8b-instant`).
- **FR-8.3**: Enforce fail-fast sub-second handoff (< 1,000ms) to `fallbackService.js` on Groq rate limits (`429`), timeouts, or quota errors without retry loops.
- **FR-8.4**: Fallback to secondary provider if configured when primary key is missing, or fallback to curated datasets if neither is available.
- **FR-8.5**: Zero modifications to the REST API request/response envelope or frontend client contract.

---

## Non-Functional Requirements (NFR)
- **NFR-1**: AI response generation latency targeted under 3 seconds; fallback response under 50ms.
- **NFR-2**: Zero database dependency; state and recent history managed safely in-memory.
- **NFR-3**: Automated test suite with Vitest & Supertest covering unit validation, Gemini service mocking, and fallback behavior.
- **NFR-4**: Fully compliant with JavaScript ES Modules (`import`/`export`).
