# Chaos to Solution: Challenge Generator — Backend

Backend REST API service for the **Chaos to Solution: Challenge Generator** event organized by **IEEE Computer Society** at **SJC Institute of Technology (SJCIT)**.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (`v24.x` LTS)
- **Framework**: Express.js (JavaScript ES Modules `"type": "module"`)
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
│   │   └── env.js           # Environment configuration validator
│   ├── middlewares/
│   │   ├── errorHandler.js  # Centralized JSON error handler
│   │   └── notFoundHandler.js # Standardized 404 handler
│   └── routes/
│       └── health.routes.js # GET /api/health route
├── tests/
│   └── integration/
│       └── health.test.js   # Supertest integration tests
├── .env.example             # Environment variable template
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
Default settings in `.env`:
- `PORT=5000`
- `NODE_ENV=development`
- `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`

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

---

## 📡 API Reference

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

### Error Response Envelope
All non-200 responses return a consistent JSON envelope:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cannot GET /api/unknown"
  }
}
```
