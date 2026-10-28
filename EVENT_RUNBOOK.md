# Chaos to Solution: Challenge Generator — Event Operational Runbook

**Event**: Chaos to Solution: Challenge Generator  
**Organizer**: IEEE Computer Society Student Branch  
**Institution**: SJC Institute of Technology (SJCIT), Chickballapur  
**System**: AI-Powered Challenge Generation Engine with Curated Fallback  

---

## 📋 1. Pre-Event System Checklist (T-30 Minutes)

Perform these verification steps on the master presentation/kiosk laptops before participants arrive:

- [ ] **Node.js Environment**: Verify Node.js v20+ or v24+ LTS is installed:
  ```bash
  node -v
  npm -v
  ```
- [ ] **Repository State**: Ensure you are on the `backend` branch with a clean working tree:
  ```bash
  git status
  ```
- [ ] **Backend Configuration**: Confirm `backend/.env` exists and contains:
  ```env
  PORT=5000
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000
  GEMINI_API_KEY=your_gemini_api_key_here
  GEMINI_MODEL=gemini-3.8-flash
  GEMINI_TIMEOUT_MS=10000
  ```
- [ ] **Frontend Configuration**: Confirm `frontend/.env` exists and contains:
  ```env
  VITE_API_BASE_URL=http://localhost:5000
  VITE_USE_MOCK=false
  ```
- [ ] **Dependency Verification**:
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```

---

## 🚀 2. Starting the Services

Open **two separate terminal windows**:

### Terminal 1: Backend Server (Safiya's Service)
```bash
cd backend
npm run dev
```
- **Expected Output**:
  ```text
  [CTS Backend] Server running on port 5000 (development)
  [CTS Backend] Health check: http://localhost:5000/api/health
  ```
- **Verify Health via cURL**:
  ```bash
  curl http://localhost:5000/api/health
  # Response: {"success":true,"data":{"status":"ok",...}}
  ```

### Terminal 2: Frontend UI (Imadulla's Interface)
```bash
cd frontend
npm run dev
```
- **Expected Output**:
  ```text
  VITE v8.3.5 ready in 500 ms
  ➜  Local:   http://localhost:5173/ (or next free port)
  ```
- Open the printed Local URL in Google Chrome or Microsoft Edge.

---

## 🛡️ 3. Resilience, Quota & Offline Contingencies

The system is architected with a **Zero-Downtime Guarantee** specifically for hackathons with unpredictable venue Wi-Fi:

### Scenario A: Gemini API Quota Exceeded (429 Rate Limit)
- **Symptom**: Free-tier Gemini accounts enforce request limits (e.g., 5 Requests Per Minute).
- **Engine Behavior**: The backend catches the 429 error, logs a server warning, and automatically serves a pre-vetted curated triplet from `src/data/` for the requested theme.
- **Participant UI**: The challenge renders instantly with an amber **[Backup Challenge]** badge instead of green **[AI Generated]**.
- **Action Required**: **None.** Do NOT stop the server; student teams receive a valid, hackathon-tested challenge without delay.

### Scenario B: Campus Wi-Fi Drop / Unstable Internet
- **Engine Behavior**: Outbound HTTPS calls to Google Gemini will time out after 10 seconds. The backend catches the timeout and immediately activates the curated fallback bank.
- **Local Datasets**: Resource documentation links and mock datasets (`/api/mock/weather`, `/api/mock/products`, `/api/mock/books`, etc.) are served locally from `backend/src/data/mock/`.
- **Frontend Mock Mode Toggle**: If the backend machine is completely unreachable, open developer console in the browser (`F12`) and run:
  ```javascript
  window.__toggleMockMode();
  ```
  This switches the frontend to run entirely client-side using built-in mock fixtures.

---

## 📲 4. WhatsApp Sharing Operational Flow

1. Student team selects a theme and generates their challenge.
2. Under the 3 flip cards, locate the **"Share Your Mission"** section.
3. Enter the team lead's **10-digit Indian mobile number** (e.g., `9876543210`).
4. Click **"SHARE VIA WHATSAPP"**.
5. WhatsApp Web or the WhatsApp Desktop App will open in a new tab with the entire challenge pre-formatted (Problem Statement, Technical Restriction, Resource Docs, Deliverable, and Sprint Duration).
6. **Privacy Note**: Participant phone numbers are processed entirely within the browser and are **never** logged or saved to the backend database.

---

## 🔧 5. Quick Troubleshooting Guide

| Issue | Root Cause | Immediate Resolution |
| :--- | :--- | :--- |
| **CORS Blocked (Red console error)** | Frontend running on port not in `CORS_ORIGIN` | Add frontend port to `CORS_ORIGIN` in `backend/.env` (e.g. `http://localhost:5176`) and restart backend. |
| **Port 5000 in use** | Residual node process running | Run `npx kill-port 5000` or stop previous background tasks in terminal. |
| **Model 404 Error in backend log** | Outdated model string | Ensure `GEMINI_MODEL=gemini-3.8-flash` in `backend/.env`. |
| **Frontend fails with "Network Error"** | Backend server not running | Ensure Terminal 1 is running `npm run dev` in `backend/`. Verify `curl http://localhost:5000/api/health`. |
| **Cards not flipping** | Browser hardware acceleration disabled | Click directly on the card surface or press Enter on keyboard when focused. |

---

## ✅ 6. Final Pre-Hackathon Verification (T-5 Minutes)

Run the automated test suites to confirm full green status:
```bash
# 1. Backend suite (48 tests)
cd backend && npm test

# 2. Frontend suite (30 tests)
cd ../frontend && npm test
```
All **78 tests** must pass. Once verified, project the frontend onto the main stage display or open for participant kiosk entry!
