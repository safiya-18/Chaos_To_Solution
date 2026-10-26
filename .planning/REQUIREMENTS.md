# Requirements: Chaos to Solution Backend

## Functional Requirements (FR)

### FR-1: Health Check Endpoint
- **FR-1.1**: `GET /api/health` returns HTTP 200 with server status, timestamp, uptime, and version.
- **FR-1.2**: Responds swiftly with negligible resource overhead.

### FR-2: Curated Challenge Data Banks
- **FR-2.1**: Separate JSON banks for `problems.json`, `restrictions.json`, and `resources.json`.
- **FR-2.2**: Each bank item contains unique `id`, human-readable text, category/domain, and metadata tags.
- **FR-2.3**: Bank items specify compatibility attributes (e.g. `requiresNetwork`, `tags`, or `incompatibleWith`).
- **FR-2.4**: Minimum 15-20 distinct items per bank to ensure high entropy (>3,000 potential valid combinations).

### FR-3: Challenge Generation Engine & Compatibility Validation
- **FR-3.1**: Endpoint `POST /api/challenges/generate` (with optional `GET /api/challenges/generate` support).
- **FR-3.2**: Selects one Problem, one Restriction, and one Resource.
- **FR-3.3**: Validates mutual compatibility (e.g., prevents "Offline-only" restriction paired with "Public Weather API" resource).
- **FR-3.4**: If a random selection conflicts, retries up to $N$ attempts before falling back to a universally compatible combination.
- **FR-3.5**: Formats an ready-to-use `shareText` string optimized for WhatsApp URL encoding.

### FR-4: De-duplication / Anti-Repeat Mechanism
- **FR-4.1**: Tracks recently generated combination signatures (`${problemId}-${restrictionId}-${resourceId}`).
- **FR-4.2**: Avoids repeating identical triplets within the last $K$ generations (e.g., sliding window of 25-50 combinations).

### FR-5: Error Handling & API Contract Standardization
- **FR-5.1**: Success responses follow uniform envelope: `{ "success": true, "data": { ... } }`.
- **FR-5.2**: Error responses follow uniform envelope: `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`.
- **FR-5.3**: Handles invalid routes (404) and unexpected exceptions (500) gracefully with JSON, never exposing raw stack traces in production.

### FR-6: Security & Cross-Origin Configuration
- **FR-6.1**: CORS enabled with configurable origins via `CORS_ORIGIN` env variable (supporting local dev `http://localhost:*` and frontend host).
- **FR-6.2**: Basic security headers using `helmet`.

### FR-7: Frontend Developer Integration & Documentation
- **FR-7.1**: Provide clear markdown API documentation (`API.md`) detailing endpoints, request/response samples, and error codes for Imadulla.
- **FR-7.2**: Supply `.env.example` with sensible defaults.

---

## Non-Functional Requirements (NFR)
- **NFR-1**: Response time under 50ms for challenge generation.
- **NFR-2**: Zero external database dependency required for core functionality; run self-contained with Node.js.
- **NFR-3**: Automated test suite with Vitest & Supertest covering 100% of API endpoints and compatibility logic.
- **NFR-4**: Fully compliant with JavaScript ES Modules (`import`/`export`).
