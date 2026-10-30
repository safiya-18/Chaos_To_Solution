# Production Deployment Guide — Chaos to Solution (CTS)

## Overview

Chaos to Solution (CTS) is deployed in a cloud-native, zero-server-maintenance architecture:

```
[ Participant Browsers / Kiosks ]
              |
              +---> [ Frontend ] Vercel Edge Network (https://cts-beta.vercel.app)
              |            |
              +------------+ (HTTPS REST API Calls)
                           v
                    [ Backend ] Render Web Service (https://cts-backend-iywa.onrender.com)
                                 |
                                 v (TLS 1.3 Mongoose Connection)
                    [ Database ] MongoDB Atlas Replica Set (chaos_to_solution)
```

---

## Production Endpoints

| Component | Provider | Live URL | Health / Verify Path |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Vercel | [https://cts-beta.vercel.app](https://cts-beta.vercel.app) | `/` |
| **Backend REST API** | Render | [https://cts-backend-iywa.onrender.com](https://cts-backend-iywa.onrender.com) | `/api/health` |
| **Database** | MongoDB Atlas | Cluster: `cluster0.a9nfhxb.mongodb.net` | Database: `chaos_to_solution` |

---

## 1. Backend Deployment on Render

The backend is configured as a standard Web Service using `render.yaml` at the root of the repository.

### Build & Runtime Settings:
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### Environment Variables Configured in Render Dashboard:
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
CORS_ORIGIN=https://cts-beta.vercel.app,https://cts.vercel.app,http://localhost:5173
AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_MODEL=gemini-3.8-flash
AI_TIMEOUT_MS=4000
EVENT_ID=cts-2026
EVENT_TIMER_DURATION_MS=14400000

# Secrets (Managed securely in Render, NEVER in source code):
MONGODB_URI=mongodb+srv://[db-username]:[db-password]@cluster0.a9nfhxb.mongodb.net/chaos_to_solution?retryWrites=true&w=majority
GROQ_API_KEY=<your_groq_api_key>
GEMINI_API_KEY=<your_gemini_api_key>
EVENT_ADMIN_TOKEN=<your_secure_random_operator_token>
```

---

## 2. Frontend Deployment on Vercel

The frontend is deployed on Vercel with single-page application rewrites defined in `frontend/vercel.json`.

### Build Settings:
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables Configured in Vercel Dashboard:
```env
VITE_API_URL=https://cts-backend-iywa.onrender.com
```

---

## 3. Database Prerequisite (MongoDB Atlas)

Before serving traffic, confirm that the partial unique index on `teamassignments` is active. Connect to MongoDB Atlas via `mongosh` and inspect:

```javascript
db.teamassignments.getIndexes().filter(
  index => index.name === "eventId_1_challengeSignature_1"
);
```

Expected output:
```json
[
  {
    "v": 2,
    "key": { "eventId": 1, "challengeSignature": 1 },
    "name": "eventId_1_challengeSignature_1",
    "unique": true,
    "partialFilterExpression": {
      "challengeSignature": { "$type": "string" }
    }
  }
]
```

---

## 4. Post-Deployment Verification

1. **Verify Backend Health**:
   ```bash
   curl -i https://cts-backend-iywa.onrender.com/api/health
   ```
   Must return `HTTP 200` with `"database": { "connected": true, "status": "connected" }`.

2. **Verify Frontend UI**:
   Open [https://cts-beta.vercel.app](https://cts-beta.vercel.app) in an incognito window.
   - Confirm theme cards render cleanly.
   - Click `/timer` to ensure the 4-hour countdown clock is synchronized.
   - Click `/teams` to verify registered teams table loads data from the backend.
