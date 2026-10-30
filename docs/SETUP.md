# Local Setup & Installation Guide — Chaos to Solution (CTS)

This guide walks you through setting up and running Chaos to Solution (CTS) locally for development and testing.

---

## 1. Prerequisites

- **Node.js**: `v20.x`, `v22.x`, or `v24.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **MongoDB**:
  - Local MongoDB instance (`v6.0` or higher) running at `mongodb://localhost:27017`, OR
  - A MongoDB Atlas connection URI
- **Git**

---

## 2. Repository Cloning

```bash
git clone https://github.com/safiya-18/Chaos_To_Solution.git
cd Chaos_To_Solution
```

---

## 3. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   # Server Settings
   PORT=5000
   HOST=0.0.0.0
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/chaos_to_solution

   # Event Configuration
   EVENT_ID=cts-2026
   EVENT_ADMIN_TOKEN=your_secure_operator_token_here
   EVENT_TIMER_DURATION_MS=14400000

   # AI Provider Cascade
   AI_PROVIDER=groq
   GROQ_MODEL=openai/gpt-oss-20b
   GROQ_API_KEY=your_groq_api_key_optional_for_mock_fallback
   GEMINI_MODEL=gemini-3.8-flash
   GEMINI_API_KEY=your_gemini_api_key_optional_for_mock_fallback
   AI_TIMEOUT_MS=4000
   ```

   > [!NOTE]
   > If API keys for Groq and Gemini are omitted or rate-limited, the system transparently utilizes its verified **Curated Fallback** engine. You can develop and test offline without external API keys.

4. **Run the backend development server**:
   ```bash
   npm run dev
   ```
   The backend will be live at `http://localhost:5000`. Test health with:
   ```bash
   curl http://localhost:5000/api/health
   ```

---

## 4. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Frontend Environment (Optional)**:
   By default, the Vite dev server proxies API requests to `http://localhost:5000`. If running against a custom backend port or remote host, create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 5. Running the Full Test Suite

Ensure code quality and regressions are checked before submitting PRs:

```bash
# 1. Run all backend unit & integration tests
cd backend
npm test

# 2. Run all frontend component & navigation tests
cd ../frontend
npm test -- --run

# 3. Test production frontend build
npm run build
```

---

## 6. Common Setup Issues & Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `MongooseServerSelectionError` | MongoDB is not running or URI is invalid | Ensure local `mongod` is active (`sudo systemctl start mongod`) or update `MONGODB_URI` in `backend/.env`. |
| `CORS Error in Browser` | Frontend port not listed in `CORS_ORIGIN` | Add your Vite dev URL (e.g. `http://localhost:5173`) to `CORS_ORIGIN` in `backend/.env`. |
| `EADDRINUSE: port 5000` | Port 5000 already occupied by another process | Change `PORT=5001` in `backend/.env` and update `VITE_API_URL=http://localhost:5001` in frontend. |
| `401 Unauthorized on Operator Action` | Missing or mismatched `EVENT_ADMIN_TOKEN` | Enter the exact `EVENT_ADMIN_TOKEN` set in `backend/.env` into the frontend operator prompt dialog. |
