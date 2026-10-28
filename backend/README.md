# Chaos to Solution: Challenge Generator — Backend

Backend REST API service for the **Chaos to Solution: Challenge Generator** event organized by **IEEE Computer Society** at **SJC Institute of Technology (SJCIT)**.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (`v24.x` LTS)
- **Framework**: Express.js (JavaScript ES Modules `"type": "module"`)
- **AI Engine**: Groq (`groq-sdk`, `llama-3.3-70b-versatile` default) & Google Gemini (`@google/genai`, `gemini-3.8-flash` optional)
- **Testing**: Vitest + Supertest
- **Security & Networking**: Helmet, CORS, Dotenv

---

## 📁 Directory Structure
```
backend/
├── src/
│   ├── app.js               # Express app instance, middleware & route binding
│   ├── server.js            # Server entrypoint and port listener
│   ├── config/
│   │   └── env.js           # Environment configuration validator (ports, CORS, Gemini)
│   ├── data/
│   │   ├── problems.json    # 20 curated hackathon problems across 5 categories
│   │   ├── restrictions.json # 15 meaningful constraints
│   │   ├── resources.json   # 15 keyless resources (browser, public API, local)
│   │   ├── mock/            # Offline mock fallbacks for public APIs
│   │   │   ├── weather.json
│   │   │   ├── products.json
│   │   │   ├── countries.json
│   │   │   ├── books.json
│   │   │   └── quotes.json
│   │   └── local/           # Curated offline reference datasets
│   │       ├── campus_map.json
│   │       ├── waste_taxonomy.json
│   │       └── nutrition.json
│   ├── middlewares/
│   │   ├── errorHandler.js  # Centralized JSON error handler
│   │   └── notFoundHandler.js # Standardized 404 handler
│   ├── routes/
│   │   ├── challenge.routes.js # POST /api/challenges/generate route
│   │   ├── health.routes.js # GET /api/health route
│   │   └── mock.routes.js   # GET /api/mock/:dataset (offline fallbacks)
│   ├── services/
│   │   ├── challengeService.js # AI orchestrator with anti-repeat ring buffer
│   │   ├── fallbackService.js # Curated Phase 2 fallback selector for 8 themes
│   │   ├── geminiService.js # @google/genai integration, structured JSON schema
│   │   └── shareTextFormatter.js # WhatsApp message formatter & ID generator
│   └── utils/
│       ├── challengeValidator.js # 8-theme validation, schema bounds & banned-term check
│       └── dataValidator.js # Schema validation & combinatorial calculator
├── tests/
│   ├── integration/
│   │   ├── challenge.test.js # Challenge generation API integration tests
│   │   ├── health.test.js   # Health check integration tests
│   │   └── mock.test.js     # Mock fallback endpoints integration tests
│   └── unit/
│       ├── challengeService.test.js # Theme validation, fallback, and AI orchestrator tests
│       └── dataValidation.test.js # Data bank integrity & combinatorial tests
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
- `AI_PROVIDER=groq` *(default: groq; optional: gemini)*
- `AI_TIMEOUT_MS=4000`
- `GROQ_API_KEY=` *(Configured server-side. If omitted or rate-limited, engine falls back to Gemini or curated datasets)*
- `GROQ_MODEL=llama-3.3-70b-versatile`
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
Run the automated test suite with Vitest:
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

## 🧠 AI Generation & Fallback Engine (Phase 3)

The service layer generates cohesive, theme-tailored challenge triads (**Problem**, **Restriction**, **Resource**, and **Deliverable**) targeted for a 3-hour student hackathon prototype.

### Approved Themes (8)
`EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.

### Resilient Orchestration Pipeline
1. **Theme Validation**: Throws `ValidationError` (HTTP 400) if the requested theme is missing or unapproved.
2. **AI Generation (`geminiService`)**: Requests structured JSON via `@google/genai` with `gemini-3.8-flash` and strict response schema.
3. **Multi-Pillar Validation (`challengeValidator`)**: Checks character bounds, URL syntax, deliverable feasibility, and rejects banned paid services (`openai`, `stripe`, `aws`, etc.) or hardware requirements.
4. **Curated Fallback Routing (`fallbackService`)**: If Gemini is unconfigured, times out (>10000ms), encounters a 429 quota limit, or produces invalid output, it seamlessly returns a pre-vetted triplet from Phase 2 curated datasets.
5. **Anti-Repeat Ring Buffer**: An in-memory cache of 30 recent challenges avoids immediate repetition per theme.
6. **Transparent Source Stamping**: Challenges return `"source": "ai"` or `"source": "curated-fallback"` for observability.

---

## 📡 API Reference

### Challenge Generation
- **Endpoint**: `POST /api/challenges/generate`
- **Description**: Generates an integrated hackathon challenge for a selected theme (AI or curated fallback) with pre-formatted WhatsApp text.
- **Request Body**:
```json
{
  "theme": "EdTech"
}
```
- **Supported Themes**: `EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.
- **Response** (`200 OK`):
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
      "problem": { "title": "...", "statement": "..." },
      "restriction": { "name": "...", "rule": "..." },
      "resource": { "name": "...", "type": "browser-api", "guidance": "...", "docsUrl": "https://..." },
      "deliverable": "..."
    },
    "shareText": "⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡\n..."
  }
}
```
*(For complete request/response schemas, error status codes, and WhatsApp click-to-chat integration, see [`API.md`](./API.md).)*

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies service operational status, uptime, and version.
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 14,
    "timestamp": "2026-10-26T14:48:00.000Z",
    "version": "1.0.0"
  }
}
```

### Offline Fallback Mock Datasets
- **Endpoint**: `GET /api/mock/:dataset`
- **Description**: Serves local JSON fallbacks for public APIs to protect teams from spotty venue Wi-Fi.
- **Supported Datasets**: `weather`, `products`, `countries`, `books`, `quotes`, `campus-map`, `waste-taxonomy`, `nutrition`.
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": { ... }
}
```

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
