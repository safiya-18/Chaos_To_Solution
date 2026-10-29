# Phase 9: Production Deployment (Render + Vercel + MongoDB Atlas) — Context & Decisions

## Context
Deploy **Chaos to Solution (CTS)** to production using:
- **Frontend**: Vercel (target domains: `cts.vercel.app` or `ctschallenge.vercel.app`)
- **Backend**: Render (Web Service)
- **Database**: Existing MongoDB Atlas database
- **GitHub Repository**: `https://github.com/safiya-18/Chaos_To_Solution.git`

## Key Architecture & Safety Constraints
1. **Zero Secret Leakage**:
   - Never print, log, or commit secret credentials (`MONGODB_URI`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `EVENT_ADMIN_TOKEN`).
   - Frontend environment contains ONLY public/client variables (`VITE_API_BASE_URL`, `VITE_USE_MOCK`).
2. **Data & Timer Preservation**:
   - Zero destructive database operations. Never drop collections or recreate indexes.
   - Preserve existing participant teams (`hlo`, `Alien`) and event timer (`cts-2026`).
   - Non-destructive health checks and verification only.
3. **Backend Service Contract (Render)**:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start` (`node src/server.js`)
   - Host binding: `0.0.0.0`
   - Port: `process.env.PORT` (Render dynamically assigns)
   - Health check: `/api/health`
   - CORS origin: Explicit allowlist including Vercel production domains (`https://cts.vercel.app,https://ctschallenge.vercel.app`).
4. **Frontend Service Contract (Vercel)**:
   - Root directory: `frontend`
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Single Page Application (SPA) rewrites configured via `frontend/vercel.json` (`/.*` -> `/index.html`) so `/timer` and `/teams` resolve cleanly.
   - Environment variable: `VITE_API_BASE_URL` pointing to the deployed Render backend URL, `VITE_USE_MOCK=false`.
5. **MongoDB Atlas Network Access**:
   - Render web services use dynamic outbound IPs.
   - MongoDB Atlas Network Access must allow Render connections via `0.0.0.0/0` (with strong user credentials and TLS).
6. **Git Safety**:
   - No automatic git commits or pushes without user's explicit consent.
