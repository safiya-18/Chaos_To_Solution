# Chaos to Solution: Challenge Generator — Backend

Backend REST API service for the **Chaos to Solution: Challenge Generator** event organized by **IEEE Computer Society** at **SJC Institute of Technology (SJCIT)**.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (`v24.x` LTS or `v20.x`)
- **Framework**: Express.js (JavaScript ES Modules `"type": "module"`)
- **Database**: MongoDB (Mongoose `8.x` / `9.x`) for team challenge persistence and authoritative event countdown clock
- **AI Engine**: Groq Cloud (`groq-sdk`, `openai/gpt-oss-20b` default) & Google Gemini (`@google/genai`, `gemini-3.8-flash` secondary failover)
- **Testing**: Vitest + Supertest (112 tests across 11 suites, 100% offline)
- **Security & Networking**: Helmet, CORS, Dotenv, Timing-safe Auth (`crypto.timingSafeEqual`)

---

## 📁 Directory Structure
```
backend/
├── src/
│   ├── app.js               # Express app instance, security middleware & route binding
│   ├── server.js            # Server entrypoint and MongoDB connection lifecycle
│   ├── config/
│   │   └── env.js           # Environment configuration validator (ports, CORS, DB, AI)
│   ├── data/
│   │   ├── problems.json    # 20 curated hackathon problems across 5 categories
│   │   ├── restrictions.json# 15 meaningful constraints
│   │   ├── resources.json   # 15 keyless resources (browser, public API, local)
│   │   ├── mock/            # Offline mock fallbacks for public APIs
│   │   └── local/           # Curated offline reference datasets
│   ├── middlewares/
│   │   ├── auth.js          # Constant-time operator authentication for admin actions
│   │   ├── errorHandler.js  # Centralized JSON error handler
│   │   └── notFoundHandler.js # Standardized 404 handler
│   ├── models/
│   │   ├── EventTimer.js    # Event-wide 4-hour countdown schema & time math
│   │   └── TeamAssignment.js# Team registration and challenge persistence schema
│   ├── routes/
│   │   ├── challenge.routes.js # POST /api/challenges/generate
│   │   ├── health.routes.js    # GET /api/health (with MongoDB readiness)
│   │   ├── mock.routes.js      # GET /api/mock/:dataset (offline fallbacks)
│   │   ├── team.routes.js      # POST, GET, GET /:id, DELETE /:id /api/teams
│   │   └── timer.routes.js     # GET & POST /api/event-timer
│   ├── services/
│   │   ├── challengeService.js # AI orchestrator with anti-repeat ring buffer
│   │   ├── fallbackService.js  # Curated Phase 2 fallback selector for 8 themes
│   │   ├── geminiService.js    # @google/genai integration, structured JSON schema
│   │   ├── groqService.js      # Groq SDK integration with strict JSON Schema
│   │   ├── shareTextFormatter.js # WhatsApp message formatter & ID generator
│   │   ├── teamService.js      # Team registration, validation, uniqueness & deletion
│   │   └── timerService.js     # Authoritative duration math & state transitions
│   └── utils/
│       ├── challengeValidator.js # 8-theme validation, schema bounds & banned-term check
│       └── dataValidator.js      # Schema validation & combinatorial calculator
├── tests/
│   ├── integration/
│   │   ├── challenge.test.js # Challenge generation API integration tests
│   │   ├── health.test.js    # Health check integration tests
│   │   ├── mock.test.js      # Mock fallback endpoints integration tests
│   │   ├── team.test.js      # Team registration, query & operator delete tests
│   │   └── timer.test.js     # Event timer public read & protected mutation tests
│   └── unit/
│       ├── challengeService.test.js   # Multi-provider AI orchestrator tests
│       ├── dataValidation.test.js     # Data bank integrity & combinatorial tests
│       ├── groqService.test.js        # Groq SDK integration & schema tests
│       ├── teamAssignmentModel.test.js# Mongoose pre-validate regression tests
│       ├── teamService.test.js        # Persistence, uniqueness & delete tests
│       └── timerService.test.js       # Time math & state machine tests
├── .env.example             # Environment variable template
├── API.md                   # Full REST API documentation for frontend
├── package.json             # NPM package specification & scripts
├── vitest.config.js         # Vitest test runner configuration
└── README.md                # Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v20.x` or `v24.x` (LTS)
- npm `v10.x` or `v11.x`

### 2. Installation
Navigate into the `backend/` directory:
```bash
cd backend
npm install
```

### 3. Environment Configuration
Copy the template to `.env`:
```bash
cp .env.example .env
```
Settings in `.env`:
- `PORT=5000`
- `NODE_ENV=development`
- `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`
- `MONGODB_URI=mongodb+srv://[username]:[password]@cluster.mongodb.net/chaos_to_solution`
- `EVENT_ID=cts-2026-hackathon`
- `EVENT_ADMIN_TOKEN=your_secure_admin_token`
- `EVENT_TIMER_DURATION_MS=14400000`
- `AI_PROVIDER=groq` *(default: groq; optional: gemini)*
- `AI_TIMEOUT_MS=4000`
- `GROQ_API_KEY=` *(Configured server-side. Enforces JSON Schema structured output)*
- `GROQ_MODEL=openai/gpt-oss-20b`
- `GEMINI_API_KEY=` *(Optional secondary provider)*
- `GEMINI_MODEL=gemini-3.8-flash`
- `GEMINI_TIMEOUT_MS=4000`

### 4. Running the Dev Server
Uses Node 24 native watch mode (auto-reloads on file changes):
```bash
npm run dev
```
The server will start at: `http://localhost:5000`
Health check endpoint: `http://localhost:5000/api/health`

### 5. Running Tests
Run the automated test suite with Vitest (112 tests across 11 suites):
```bash
npm test
```
To run tests in watch mode:
```bash
npm run test:watch
```

### 6. Running Frontend & Backend Together
To run the complete application for local testing:
1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm run dev
   ```
   Runs on `http://localhost:5000`.
2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on `http://localhost:5173` (or next free port).

For pre-event checklist and emergency contingencies, see [`../EVENT_RUNBOOK.md`](../EVENT_RUNBOOK.md).

---

## 🧠 AI Generation & Fallback Engine (Multi-Tier Cascade)

The service layer generates cohesive, theme-tailored challenge triads (**Problem**, **Restriction**, **Resource**, and **Deliverable**) targeted for a 3-4 hour student hackathon prototype.

### Approved Themes (8)
`EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.

### Resilient Orchestration Pipeline
1. **Theme Validation**: Throws `ValidationError` (HTTP 400) if the requested theme is missing or unapproved.
2. **Groq Primary Engine (`groqService`)**: High-speed generation using `openai/gpt-oss-20b` with strict JSON Schema output.
3. **Multi-Pillar Validation (`challengeValidator`)**: Checks character bounds, URL syntax, deliverable feasibility, and rejects banned paid services (`openai`, `stripe`, `aws`, etc.) or hardware requirements.
4. **Gemini Secondary Engine (`geminiService`)**: Automatic failover if Groq encounters rate limits (429), timeouts (>4s), 404/503 errors, or schema validation failures.
5. **Curated Fallback Routing (`fallbackService`)**: Seamlessly returns a pre-vetted triplet from curated datasets if both AI engines fail or if offline.
6. **Anti-Repeat Ring Buffer**: An in-memory cache of 30 recent challenges avoids immediate repetition per theme.
7. **Transparent Source Stamping**: Challenges return `"source": "ai"` or `"source": "curated-fallback"` for observability.

---

## 📡 API Reference

### 1. Challenge Generation (Legacy Endpoint)
- **Endpoint**: `POST /api/challenges/generate`
- **Description**: Generates an integrated hackathon challenge for a selected theme (AI or curated fallback) with pre-formatted WhatsApp text.
- **Request Body**: `{ "theme": "EdTech" }`
- **Response** (`200 OK`): `{ "success": true, "data": { "id": "...", "theme": "EdTech", "source": "ai", "challenge": { ... }, "shareText": "..." } }`

### 2. Team Registration & Challenge Persistence
- **Endpoint**: `POST /api/teams`
- **Description**: Collects team name (2-50 chars), validates against duplicates, generates challenge, and persists atomically to MongoDB.
- **Request Body**: `{ "teamName": "Binary Beasts", "theme": "EdTech" }`
- **Response** (`201 Created`): `{ "success": true, "data": { "id": "...", "teamName": "Binary Beasts", "theme": "EdTech", "challenge": { ... }, "source": "ai", "shareText": "..." } }`
- **Conflict** (`409 Conflict`): `{ "code": "TEAM_ALREADY_EXISTS" }`

### 3. List Registered Teams (Screen 3 Table)
- **Endpoint**: `GET /api/teams`
- **Description**: Query teams with pagination, search, theme filter, and sorting.
- **Query Params**: `search`, `theme`, `sortBy`, `sortOrder`, `page`, `limit`
- **Response** (`200 OK`): `{ "success": true, "data": { "teams": [...], "total": 1, "page": 1, "totalPages": 1 } }`

### 4. Delete Team Assignment (Protected Operator Action)
- **Endpoint**: `DELETE /api/teams/:id`
- **Description**: Permanently delete a team registration from MongoDB.
- **Headers**: `Authorization: Bearer <EVENT_ADMIN_TOKEN>`
- **Response** (`200 OK`): `{ "success": true, "data": { "id": "...", "teamName": "...", "deleted": true, "message": "..." } }`
- **Auth Errors**: `401 Unauthorized` (missing/malformed), `403 Forbidden` (invalid token)

### 5. Shared Event Timer
- **Endpoint**: `GET /api/event-timer` (Public)
  - **Response** (`200 OK`): `{ "status": "running", "remainingMs": 12645000, "formattedRemaining": "03:30:45", ... }`
- **Operator Mutations**:
  - `POST /api/event-timer/start`
  - `POST /api/event-timer/pause`
  - `POST /api/event-timer/resume`
  - `POST /api/event-timer/reset`
  - All require `Authorization: Bearer <EVENT_ADMIN_TOKEN>`.

### 6. Health & Readiness Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies service operational status, uptime, and MongoDB connectivity.
- **Response** (`200 OK`): `{ "success": true, "data": { "status": "ok", "uptime": 42, "database": { "status": "connected", "readyState": 1 } } }`

### 7. Offline Fallback Mock Datasets
- **Endpoint**: `GET /api/mock/:dataset`
- **Description**: Serves local JSON fallbacks for public APIs to protect teams from spotty venue Wi-Fi.
- **Supported Datasets**: `weather`, `products`, `countries`, `books`, `quotes`, `campus-map`, `waste-taxonomy`, `nutrition`.

### Error Response Envelope
All non-200 responses return a consistent JSON envelope:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_THEME",
    "message": "Invalid theme 'Crypto'. Must be one of: EdTech, FinTech, ..."
  }
}
```
*(For complete request/response schemas, error status codes, and WhatsApp click-to-chat integration, see [`API.md`](./API.md).)*
