# Phase 1 Plan: Project Scaffolding & Tooling Setup

## Metadata
- **Phase**: 1
- **Focus**: Backend Project Scaffolding, Tooling & Health Check
- **Location**: `backend/`
- **Status**: Ready for Review / Execution Approval

---

## 1. Objective
Establish a clean, robust, and testable Node.js + Express backend foundation using **JavaScript ES modules** (`"type": "module"`). The architecture must separate the Express application (`app.js`) from the network listener (`server.js`) to allow isolation during automated Supertest integration tests.

---

## 2. Requirements & Scope
- Initialize `backend/package.json` with ES module support, proper production/development dependencies, and task scripts.
- Setup `backend/.env.example` and a centralized environment loader `backend/src/config/env.js`.
- Configure security middleware (`helmet`), cross-origin sharing (`cors`), and JSON body parsing.
- Implement the `GET /api/health` endpoint returning a standardized response envelope.
- Implement unified error handling and 404 route handling middleware.
- Configure Vitest and write a Supertest integration test suite for `/api/health` and error responses.
- Document run commands and developer instructions in `backend/README.md`.

---

## 3. Atomic Tasks

### Task 1: Package Configuration & Dependency Installation
- **Target File**: `backend/package.json`
- **Actions**:
  - Set `"name": "cts-backend"`, `"type": "module"`, `"version": "1.0.0"`.
  - Add production dependencies: `express`, `cors`, `helmet`, `dotenv`.
  - Add development dependencies: `vitest`, `supertest`.
  - Configure scripts:
    - `"start"`: `"node src/server.js"`
    - `"dev"`: `"node --watch src/server.js"` (leveraging Node 24 native watch mode)
    - `"test"`: `"vitest run"`
    - `"test:watch"`: `"vitest"`
  - Run `npm install` inside `backend/`.

### Task 2: Environment Configuration
- **Target Files**:
  - `backend/.env.example`
  - `backend/src/config/env.js`
- **Actions**:
  - Define `PORT` (default: 5000), `NODE_ENV` (default: development), `CORS_ORIGIN` (default: `http://localhost:5173,http://localhost:3000`).
  - Create `env.js` that loads dotenv and exports a frozen configuration object with fallback defaults.

### Task 3: Error & Response Handling Middleware
- **Target Files**:
  - `backend/src/middlewares/errorHandler.js`
  - `backend/src/middlewares/notFoundHandler.js`
- **Actions**:
  - Create standardized 404 handler returning JSON:
    `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Route not found" } }`
  - Create centralized error handler returning uniform error envelope and concealing stack traces in production.

### Task 4: Health Check Controller & Routes
- **Target Files**:
  - `backend/src/routes/health.routes.js`
- **Actions**:
  - Implement `GET /api/health` responding with:
    `{ "success": true, "data": { "status": "ok", "uptime": <seconds>, "timestamp": "<iso>", "version": "1.0.0" } }`

### Task 5: Express App Creation (`backend/src/app.js`)
- **Target File**: `backend/src/app.js`
- **Actions**:
  - Initialize Express instance.
  - Apply `helmet()` and `cors(corsOptions)`.
  - Apply `express.json()`.
  - Mount `/api/health` router.
  - Mount 404 and global error handlers.
  - Export `app` as default export without calling `listen`.

### Task 6: Server Entry Point (`backend/src/server.js`)
- **Target File**: `backend/src/server.js`
- **Actions**:
  - Import `app` from `./app.js` and `config` from `./config/env.js`.
  - Start listener on `config.port`.
  - Attach graceful shutdown listeners for `SIGTERM` and `SIGINT`.

### Task 7: Vitest Setup & Integration Testing
- **Target Files**:
  - `backend/vitest.config.js`
  - `backend/tests/integration/health.test.js`
- **Actions**:
  - Configure Vitest for Node environment with ES module resolution.
  - Write tests verifying:
    1. `GET /api/health` returns HTTP 200, Content-Type application/json.
    2. Response body matches `{ success: true, data: { status: "ok", ... } }`.
    3. Security headers (Helmet) are present on the response.
    4. Non-existent route `GET /api/non-existent` returns HTTP 404 with standardized error JSON.
  - Verify tests pass with `npm test`.

### Task 8: Backend Documentation
- **Target File**: `backend/README.md`
- **Actions**:
  - Document setup steps (`npm install`), environment variables, dev workflow (`npm run dev`), test execution (`npm test`), and health check endpoint details.

---

## 4. Verification & Acceptance Criteria
1. **Dependency Integrity**: `npm install` runs cleanly without dependency conflicts.
2. **ES Module Compliance**: All imports/exports use standard ES modules (`import`/`export`), no `require()` statements.
3. **App/Server Decoupling**: `app.js` does NOT call `app.listen()`, allowing clean imports in tests without port conflicts.
4. **Test Suite Passes**: `npm test` runs via Vitest and passes 100% of the health endpoint and 404 integration tests.
5. **Security & CORS**: Helmet headers are verified in HTTP response; CORS allows requests from configured origins.
6. **Documentation**: Clear instructions provided in `backend/README.md`.
