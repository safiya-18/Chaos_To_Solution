# Chaos to Solution (CTS) — Production Deployment Runbook

Comprehensive guide for deploying **Chaos to Solution (CTS)** to production with:
- **Backend**: [Render](https://render.com/) (Node.js Web Service)
- **Frontend**: [Vercel](https://vercel.com/) (Vite + React 19 SPA)
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com/) (Existing Persistent Database)
- **Repository**: `https://github.com/safiya-18/Chaos_To_Solution.git` (`main` branch)

---

## 🔒 1. Secrets & Data Protection Rules

> [!IMPORTANT]
> **Data Integrity Guarantee**: CTS is an active event management system with registered participant teams (`hlo`, `Alien`) and a synchronized event timer (`cts-2026`).
> - **Never** drop, wipe, or recreate existing database collections or indexes.
> - **Never** hardcode or commit actual credentials (`MONGODB_URI`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `EVENT_ADMIN_TOKEN`) to Git.
> - **Never** expose backend secrets in frontend environment variables. Frontend only requires `VITE_API_BASE_URL` and `VITE_USE_MOCK`.

---

## 🍃 2. MongoDB Atlas Configuration

Render web services run inside dynamic cloud containers whose outbound IP addresses can change. To allow Render to communicate with your MongoDB Atlas cluster:

### Step 1: Configure Network Access in Atlas
1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Select your Project and navigate to **Security** → **Network Access** in the left sidebar.
3. Review your current **IP Access List**:
   - If `0.0.0.0/0` (Allow Access from Anywhere) is already listed with status `Active`, no change is needed.
   - If not, click **+ Add IP Address**.
   - Click **Allow Access from Anywhere** (adds CIDR block `0.0.0.0/0`).
   - Add a comment: `Render Cloud Web Service`.
   - Click **Confirm**.

> [!NOTE]
> **Security Implication**: `0.0.0.0/0` allows inbound TCP connections from cloud providers. Your database remains strictly secured by:
> - Strong database user username and password authentication (SCRAM-SHA-256).
> - TLS/SSL in-transit encryption enforced by the `mongodb+srv://` protocol.
> - Granular database user permissions restricted to `chaos_to_solution`.

### Step 2: Retrieve Your Existing Connection String
1. In Atlas, navigate to **Deployment** → **Database**.
2. Click **Connect** on your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string format:
   ```text
   mongodb+srv://[username]:[password]@[cluster-address].mongodb.net/chaos_to_solution?retryWrites=true&w=majority
   ```
*(Keep this ready for your Render environment variables dashboard—do not paste it into chat or Git).*

---

## 🚀 3. Backend Deployment on Render

### Verified Backend Specifications
- **Runtime**: Node.js (`v20.x` or `v24.x`)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (`node src/server.js`)
- **Host Binding**: `0.0.0.0`
- **Port**: Dynamically assigned via `process.env.PORT`
- **Health Check Path**: `/api/health`

---

### Option A: Automatic Blueprint Deployment (Recommended)
This repository includes a committed [`render.yaml`](./render.yaml) blueprint.

1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `https://github.com/safiya-18/Chaos_To_Solution.git`.
4. Render will detect `render.yaml` and parse the `cts-backend` service.
5. In the prompted environment variables screen, fill in your secret variables:
   - `MONGODB_URI`: Your Atlas connection string
   - `GROQ_API_KEY`: Your server-side Groq API key
   - `EVENT_ADMIN_TOKEN`: Your secret operator bearer token
   - `GEMINI_API_KEY`: *(Optional)* Your Gemini fallback key
6. Click **Apply**.
7. Render will build and deploy the web service. Note the assigned public URL (e.g., `https://cts-backend.onrender.com`).

---

### Option B: Manual Web Service Creation
If creating manually without Blueprints:

1. In [Render Dashboard](https://dashboard.render.com/), click **New +** → **Web Service**.
2. Connect `https://github.com/safiya-18/Chaos_To_Solution.git`.
3. Fill in the service parameters:
   - **Name**: `cts-backend` (or your preferred name)
   - **Region**: Oregon (US West) or closest to your location
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or `Starter`)
4. Expand **Advanced**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: `Yes`
5. In the **Environment Variables** section, add:
   | Key | Value / Notes |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `HOST` | `0.0.0.0` |
   | `CORS_ORIGIN` | `https://cts.vercel.app,https://ctschallenge.vercel.app,http://localhost:5173` |
   | `MONGODB_URI` | *Your MongoDB Atlas connection URI* |
   | `EVENT_ID` | `cts-2026` |
   | `EVENT_ADMIN_TOKEN` | *Your secure operator token* |
   | `EVENT_TIMER_DURATION_MS` | `14400000` |
   | `AI_PROVIDER` | `groq` |
   | `GROQ_API_KEY` | *Your Groq API key* |
   | `GROQ_MODEL` | `openai/gpt-oss-20b` |
   | `GEMINI_API_KEY` | *Your Gemini API key (optional)* |
   | `GEMINI_MODEL` | `gemini-3.8-flash` |
   | `AI_TIMEOUT_MS` | `4000` |
6. Click **Create Web Service**.
7. Monitor the deployment logs until you see:
   ```text
   [CTS Backend] Server running on 0.0.0.0:10000 (production)
   [CTS Database] Connected to MongoDB: mongodb+srv://***:***@...
   ```
8. Verify health via browser or terminal:
   ```bash
   curl https://<YOUR_RENDER_URL>/api/health
   # Expected response:
   # {"success":true,"data":{"status":"ok","database":{"status":"connected","readyState":1},"uptime":...,"version":"1.0.0"}}
   ```

---

## ⚡ 4. Frontend Deployment on Vercel

### Verified Frontend Specifications
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Rewrite Rule**: [`frontend/vercel.json`](./frontend/vercel.json) routes all requests to `/index.html` to support direct visits to `/timer` and `/teams`.

---

### Step-by-Step Vercel Deployment

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import the Git repository: `https://github.com/safiya-18/Chaos_To_Solution.git`.
4. In the **Configure Project** screen:
   - **Project Name**: `cts` or `ctschallenge` (determines your `.vercel.app` subdomain).
   - **Framework Preset**: Select **Vite**.
   - **Root Directory**: Click **Edit** and select **`frontend`** (Crucial: do not leave as root `./`).
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
5. In **Environment Variables**, add:
   | Variable Name | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<YOUR_RENDER_URL>` | The live backend URL from Section 3 (e.g. `https://cts-backend.onrender.com`) without trailing slash |
   | `VITE_USE_MOCK` | `false` | Enables live API calls and persistent MongoDB challenge assignments |
6. Click **Deploy**.
7. Wait ~45 seconds for Vite to compile and publish the client bundle.

---

### Step 5: Configure Custom / Preferred Vercel Domain

To claim `cts.vercel.app` or `ctschallenge.vercel.app`:
1. In your Vercel project, go to **Settings** → **Domains**.
2. In the input box, type `ctschallenge.vercel.app` (or `cts.vercel.app`).
3. Click **Add**.
4. If available, Vercel will immediately assign and issue a free SSL certificate.
5. If the exact slug is already claimed by another global user, Vercel will suggest an alternative (e.g., `cts-challenge.vercel.app` or `cts-sjcit.vercel.app`).
6. Copy the finalized Vercel URL.

---

## 🔄 5. CORS Synchronization

Now that your Vercel URL is live, ensure the backend allows requests from it:

1. Return to your [Render Dashboard](https://dashboard.render.com/) → `cts-backend` service.
2. Navigate to **Environment**.
3. Check the `CORS_ORIGIN` variable.
4. Ensure your actual Vercel domain is included (comma-separated):
   ```text
   https://ctschallenge.vercel.app,https://cts.vercel.app,http://localhost:5173
   ```
5. Click **Save Changes**. Render will automatically restart the service in ~20 seconds with updated origins.

---

## ✅ 6. Post-Deployment Smoke Verification Checklist

Perform these non-destructive tests to verify production health:

- [ ] **1. Public Health Check**:
  Visit `https://<YOUR_RENDER_URL>/api/health` in your browser.
  Confirm `status: "ok"` and `database.status: "connected"`.

- [ ] **2. Frontend Dashboard Loading**:
  Open `https://<YOUR_VERCEL_DOMAIN>/`.
  Confirm brand header, metric chips, 8-theme selection grid, and action cards load with zero console errors.

- [ ] **3. Deep Link Navigation (SPA History Rewrite)**:
  Directly paste `https://<YOUR_VERCEL_DOMAIN>/timer` and `https://<YOUR_VERCEL_DOMAIN>/teams` in a fresh browser tab.
  Confirm pages load directly without 404 errors.

- [ ] **4. Shared Authoritative Timer**:
  On `/timer`, confirm the clock displays `04:00:00` and `NOT STARTED`.
  Open `/timer` in a second browser (or mobile device); confirm digits and status match across sessions.

- [ ] **5. Team Challenges Persistence Table**:
  On `/teams`, confirm the table loads existing registered teams (`hlo`, `Alien`) from MongoDB Atlas.
  Click **View Mission** to verify the 4-pillar detail modal and custom scrollbar render smoothly.

- [ ] **6. Non-Destructive Challenge Generation Test**:
  On `/`, enter a unique test team name (e.g. `Staging Team Alpha`) and select `EdTech`.
  Click **GENERATE MY CHALLENGE**.
  Confirm challenge generates successfully with `[AI Generated]` badge (or `[Backup Challenge]` if upstream is unavailable).
  Verify the new team appears on the `/teams` table.

- [ ] **7. Operator Authentication Enforcement**:
  On `/teams`, click the delete icon on `Staging Team Alpha`.
  Verify entering an incorrect token rejects with `403 Forbidden`.
  Enter the valid `EVENT_ADMIN_TOKEN` and confirm the staging record is deleted cleanly.

- [ ] **8. Zero Secrets Exposure**:
  Inspect browser Network tab and page source.
  Confirm no API keys, admin tokens, or MongoDB connection strings are exposed in client bundles or network responses.
