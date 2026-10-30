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
- [ ] **Repository State**: Ensure you are on the `main` branch with a clean working tree:
  ```bash
  git status
  ```
- [ ] **Backend Configuration**: Confirm `backend/.env` exists and contains:
  ```env
  PORT=5000
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000
  AI_PROVIDER=groq
  AI_TIMEOUT_MS=4000
  GROQ_API_KEY=your_groq_api_key_here
  GROQ_MODEL=openai/gpt-oss-20b
  GEMINI_API_KEY=your_gemini_api_key_here
  GEMINI_MODEL=gemini-3.8-flash
  GEMINI_TIMEOUT_MS=4000
  MONGODB_URI=mongodb+srv://[username]:[password]@cluster.mongodb.net/chaos_to_solution
  EVENT_ID=cts-2026
  EVENT_ADMIN_TOKEN=your_secure_admin_token_here
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

---

## ⏱️ 5. Event-Wide Timer Operations (Operator Runbook)

The event features a centralized 4-hour countdown timer (`14,400,000 ms`) synchronized across all screens.
Mutations require the `EVENT_ADMIN_TOKEN` configured in `backend/.env`.

### 5.1 Projector Setup (Auditorium & Seminar Hall Display)
1. Open Google Chrome on the projector display laptop and navigate to:
   ```text
   http://localhost:5173/timer
   ```
2. Click the **Fullscreen** button (`Maximize2` icon in top right) or press `F11` on the keyboard to enter distraction-free full-screen mode.
3. The display will show the high-contrast `04:00:00` digits and `NOT STARTED` status.

### 5.2 Hackathon Kickoff (Start the Countdown)
When the countdown begins, the event operator can either:
- **Via the UI**: Click **Start Event (4H)**. An authorization dialog will pop up. Enter the `EVENT_ADMIN_TOKEN` and click **Confirm & Start Event**. The token is used in-memory for the request and is **never written to browser `sessionStorage` or `localStorage`**, the timer transitions to `EVENT RUNNING`, and digits count down in real-time.
- **Via cURL**:
  ```bash
  curl -X POST http://localhost:5000/api/event-timer/start \
    -H "Authorization: Bearer YOUR_EVENT_ADMIN_TOKEN" \
    -H "Content-Type: application/json"
  ```
*Note: Starting is idempotent. Re-submitting will not restart or reset an already running countdown.*

### 5.3 Temporary Event Halts (e.g. Announcements / Lunch)
To freeze the remaining time, click **Pause Timer** in the operator controls (or send cURL):
```bash
curl -X POST http://localhost:5000/api/event-timer/pause \
  -H "Authorization: Bearer YOUR_EVENT_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 5.4 Resuming Countdown
To resume ticking from the saved remaining time, click **Resume Timer** (or send cURL):
```bash
curl -X POST http://localhost:5000/api/event-timer/resume \
  -H "Authorization: Bearer YOUR_EVENT_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 5.5 Emergency / Rehearsal Reset
To reset the timer back to `not_started` (04:00:00), click **Reset (Operator)** and confirm:
```bash
curl -X POST http://localhost:5000/api/event-timer/reset \
  -H "Authorization: Bearer YOUR_EVENT_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🗄️ 6. Team Registration & Challenge Table Audit

Teams enter their team name before generating a challenge on the dashboard (`/`).

### 6.1 Live Team Monitoring via UI Table
Mentors, organizers, and judges can monitor registered teams live by navigating to:
```text
http://localhost:5173/teams
```
- **Real-time Table**: Displays all registered teams, chosen themes, problem statements, restrictions, resources, and deliverables.
- **Search & Filter**: Search by team name or keyword, and filter by theme.
- **Mission Detail Modal**: Click **View Mission** on any team to inspect the 4 complete challenge pillars, challenge ID, and external documentation links inside a sleek, pinned modal with a floating custom scrollbar (`.custom-modal-scrollbar`).
- **Auto & Manual Refresh**: Click **Refresh** to pull the latest registration records from MongoDB.

### 6.2 Operator Team Deletion (Disqualifications / Test Cleanup)
If a team name was registered as a test or needs to be reset:
- **Via the UI**:
  1. Click the red **Trash** icon next to the team row on `/teams`.
  2. A confirmation modal will appear requiring the operator `EVENT_ADMIN_TOKEN`.
  3. Enter the token and click **Delete Team**.
  4. The record is permanently deleted from MongoDB, and the table updates immediately. The token remains strictly in ephemeral component state.
- **Via cURL**:
  ```bash
  curl -X DELETE http://localhost:5000/api/teams/TEAM_ID_OR_NORMALIZED_NAME \
    -H "Authorization: Bearer YOUR_EVENT_ADMIN_TOKEN"
  ```

### 6.3 Checking Assignments via API
- **List All Teams**:
  ```bash
  curl http://localhost:5000/api/teams
  ```
- **Query Specific Team**:
  ```bash
  curl http://localhost:5000/api/teams/YOUR_TEAM_NAME
  ```
- **MongoDB Direct Inspection** (via mongosh or Compass):
  ```bash
  mongosh "mongodb://localhost:27017/cts" --eval "db.teamassignments.find({}, { teamName: 1, theme: 1, source: 1, createdAt: 1 })"
  ```

---

## 🔧 7. Quick Troubleshooting Guide

| Issue | Root Cause | Immediate Resolution |
| :--- | :--- | :--- |
| **`Failed to persist team challenge assignment: next is not a function`** | Mongoose 8.x synchronous validation hook signature mismatch | Fixed in `backend/src/models/TeamAssignment.js` using synchronous `pre('validate')` without `next` and schema default. Tested via unit regression suite. |
| **Database Unavailable (503 on registration)** | MongoDB is not running or unreachable | Start MongoDB (`docker compose up -d` or verify `MONGODB_URI` connection). Backend health at `/api/health` reports status. |
| **Timer / Deletion controls return 401/403** | Missing or invalid admin token | Ensure token entered in dialog or `Authorization: Bearer <EVENT_ADMIN_TOKEN>` matches token in `backend/.env`. |
| **CORS Blocked (Red console error)** | Frontend running on port not in `CORS_ORIGIN` | Add frontend port to `CORS_ORIGIN` in `backend/.env` (e.g. `http://localhost:5176`) and restart backend. |
| **Port 5000 in use** | Residual node process running | Run `npx kill-port 5000` or stop previous background tasks in terminal. |
| **Frontend fails with "Network Error"** | Backend server not running | Ensure Terminal 1 is running `npm run dev` in `backend/`. Verify `curl http://localhost:5000/api/health`. |
| **Cards not flipping** | Browser hardware acceleration disabled | Click directly on the card surface or press Enter on keyboard when focused. |

---

## ✅ 8. Final Pre-Hackathon Verification (T-5 Minutes)

Run the automated test suites to confirm full green status:
```bash
# 1. Backend suite (112 tests across 11 test files)
cd backend && npm test

# 2. Frontend suite (65 tests across 11 test files)
cd ../frontend && npm test
```
All **177 tests** must pass. Once verified, project the `/timer` screen onto the main stage display or open `/` for participant kiosk entry!

