# Phase 9: Production Deployment Plan (Render + Vercel + MongoDB Atlas)

## Objectives
Prepare, configure, document, and verify production deployment for CTS:
- **Backend on Render**: Node.js web service running from `backend/` with host `0.0.0.0`, dynamic `PORT`, MongoDB Atlas connection, and CORS allowlist.
- **Frontend on Vercel**: Vite React client deployed from `frontend/` with SPA history rewrites, connected to live Render backend via `VITE_API_BASE_URL`.
- **Database on MongoDB Atlas**: Network security check and verification of zero data disruption.
- **Verification**: Complete non-destructive test pass across health, CORS, timer sync, and team challenges.

---

## Task Breakdown

### Task 1: Backend Production Readiness
- **File**: `backend/src/config/env.js`
  - Ensure `host: process.env.HOST || '0.0.0.0'` is exposed.
- **File**: `backend/src/server.js`
  - Update `app.listen(config.port, config.host, ...)` to bind explicitly to `0.0.0.0`.
- **File**: `render.yaml`
  - Create Render Blueprint configuration with `sync: false` for all secrets.
- **Verification**: Run backend tests (`npm test`) to ensure all 112 tests pass.

### Task 2: Frontend Production Readiness & Routing
- **File**: `frontend/vercel.json`
  - Create Vercel SPA rewrite rule to ensure `/timer` and `/teams` direct loads route to `/index.html`.
- **Verification**: Run frontend tests (`npm test`) and production build (`npm run build`) to ensure all 65 tests pass and dist builds cleanly.

### Task 3: Comprehensive Production Deployment Guide (`DEPLOYMENT.md`)
- Document exact step-by-step instructions:
  - **Part A: MongoDB Atlas Network Configuration**: How to verify/add `0.0.0.0/0` in Network Access.
  - **Part B: Deploy Backend to Render**:
    - Method 1: Via Render Blueprint (`render.yaml`)
    - Method 2: Via Manual Web Service creation (root directory `backend`, start command `npm start`, etc.)
    - Environment variables required on Render.
  - **Part C: Deploy Frontend to Vercel**:
    - Root directory `frontend`, Framework preset `Vite`.
    - Custom domain configuration (`cts.vercel.app` or `ctschallenge.vercel.app`).
    - Environment variables required on Vercel (`VITE_API_BASE_URL`, `VITE_USE_MOCK=false`).
  - **Part D: CORS Synchronization**:
    - Adding the final Vercel domain to Render `CORS_ORIGIN`.
  - **Part E: Post-Deployment Smoke Verification Checklist**:
    - Non-destructive end-to-end verification.

### Task 4: Execute Code Updates & Verify Offline Tests
- Apply `backend/src/config/env.js` & `backend/src/server.js` changes.
- Add `frontend/vercel.json`.
- Add `render.yaml`.
- Re-run all 177 tests and production build.
- Request user confirmation before any Git commit or push.
