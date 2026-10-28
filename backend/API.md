# Chaos to Solution: Challenge Generator — REST API Documentation

Official API documentation for the **Chaos to Solution: Challenge Generator** backend service. This guide covers all endpoints, contracts, error states, and frontend integration details for connecting the frontend UI to Safiya's backend service.

---

## 🌐 Server Configuration & Base URL

- **Default Server Port**: `5000`
- **Default Base URL**: `http://localhost:5000`
- **Frontend Vite Dev Server**: `http://localhost:5173`

### CORS Configuration
The backend allows cross-origin requests from the origins specified in `CORS_ORIGIN`.
Default setting in `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```
If your frontend runs on a different port or host (e.g. `http://localhost:4173`), append it to the comma-separated `CORS_ORIGIN` list in `backend/.env`.

---

## 🎯 Primary Endpoint: Challenge Generation

Generates an integrated, 3-hour hackathon challenge tailored to a chosen theme. Dispatches to the high-speed **Groq** engine (`llama-3.3-70b-versatile` by default), falls over to **Google Gemini** (`gemini-3.8-flash`) if configured, or seamlessly falls back to pre-vetted curated datasets when offline or rate-limited.

- **Method**: `POST`
- **Path**: `/api/challenges/generate`
- **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

### Approved Themes (8)
The request body must contain exactly one of the following 8 approved themes (case-sensitive):
1. `EdTech`
2. `FinTech`
3. `HealthTech`
4. `Sustainability`
5. `Smart Cities`
6. `Accessibility`
7. `E-commerce`
8. `Open Innovation`

---

### Request Body Schema
```json
{
  "theme": "EdTech"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | **Yes** | One of the 8 approved hackathon themes listed above. |

---

### Success Response (`200 OK`)

All successful responses return a structured JSON envelope with `success: true`:

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
      "problem": {
        "title": "Interactive Leitner Flashcard Trainer",
        "statement": "Students preparing for exams lose focus because repetitive notes lack spaced-repetition scheduling."
      },
      "restriction": {
        "name": "Zero Client-Side Frameworks",
        "rule": "The frontend must be written in vanilla HTML, modern CSS, and plain JavaScript without React, Vue, or build tooling."
      },
      "resource": {
        "name": "Web Storage API (LocalStorage)",
        "type": "browser-api",
        "guidance": "Use localStorage to track card box levels, review intervals, and recall streak stats.",
        "docsUrl": "https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
      },
      "deliverable": "A responsive single-page flashcard app with spaced-repetition buckets and progress visualization."
    },
    "shareText": "⚡ *CHAOS TO SOLUTION — AI Challenge* ⚡\n_IEEE Computer Society | SJC Institute of Technology_\n\n🏷️ *Theme:* EdTech\n🆔 *Challenge ID:* #cts-edtech-m3f9g1k [AI Generated]\n\n━━━━━━━━━━━━━━━━━━━━\n📌 *01 — PROBLEM STATEMENT*\n*Interactive Leitner Flashcard Trainer*\nStudents preparing for exams lose focus because repetitive notes lack spaced-repetition scheduling.\n\n⚠️ *02 — TECHNICAL RESTRICTION*\n*Zero Client-Side Frameworks*\nRule: The frontend must be written in vanilla HTML, modern CSS, and plain JavaScript without React, Vue, or build tooling.\n\n🛠️ *03 — RESOURCE*\n*Web Storage API (LocalStorage)* (browser-api)\nGuidance: Use localStorage to track card box levels, review intervals, and recall streak stats.\nDocs: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage\n\n🎯 *04 — EXPECTED DELIVERABLE*\nA responsive single-page flashcard app with spaced-repetition buckets and progress visualization.\n━━━━━━━━━━━━━━━━━━━━\n\n💡 *Sprint Time:* ~3 hours\nReady to build? Turn chaos into solution!"
  }
}
```

#### Field Descriptions:
- `id` (`string`): Unique challenge reference formatted as `cts-<theme>-<id>`.
- `theme` (`string`): The confirmed theme.
- `generatedAt` (`string`): ISO-8601 UTC timestamp of challenge creation.
- `source` (`string`): Indicates generation origin:
  - `"ai"`: Generated live by Google Gemini (`gemini-3.8-flash`) and validated by the backend multi-pillar validator.
  - `"curated-fallback"`: Generated deterministically from the audited Phase 2 challenge bank (used when offline, rate-limited, or when Gemini times out).
- `challenge` (`object`): The complete challenge triad:
  - `problem.title` (`string`): Catchy title of the core problem.
  - `problem.statement` (`string`): Actionable user pain point.
  - `restriction.name` (`string`): Name of the creative constraint.
  - `restriction.rule` (`string`): Clear boundary constraint.
  - `resource.name` (`string`): Tool or API name.
  - `resource.type` (`string`): `'browser-api'` | `'public-api'` | `'local-dataset'`.
  - `resource.guidance` (`string`): Actionable tips on integrating the resource.
  - `resource.docsUrl` (`string`): Official documentation link (valid HTTP/HTTPS URL).
  - `deliverable` (`string`): Prototype scope achievable by students in ~3 hours.
- `shareText` (`string`): Complete, pre-formatted markdown string ready for WhatsApp sharing.

---

### Error Responses (`400 Bad Request`)

When request input is invalid or missing, the server responds with HTTP 400 and a consistent error envelope:

#### 1. Missing Theme
```json
{
  "success": false,
  "error": {
    "code": "MISSING_THEME",
    "message": "Missing required field 'theme' in request body."
  }
}
```

#### 2. Unsupported Theme
```json
{
  "success": false,
  "error": {
    "code": "INVALID_THEME",
    "message": "Invalid theme 'Crypto'. Must be one of: EdTech, FinTech, HealthTech, Sustainability, Smart Cities, Accessibility, E-commerce, Open Innovation"
  }
}
```

#### 3. Malformed JSON
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Unexpected token ... in JSON at position ..."
  }
}
```

---

## 📲 WhatsApp Sharing Contract

The backend provides the formatted message in `data.shareText`.

### Client-Side Integration Flow:
1. Participant enters a 10-digit Indian phone number in `WhatsAppShareForm.jsx`.
2. Frontend validates number using regex `^[6-9]\d{9}$` and prepends country code `91`.
3. Frontend encodes `data.shareText`:
   ```javascript
   const shareUrl = `https://wa.me/91${digits}?text=${encodeURIComponent(data.shareText)}`;
   window.open(shareUrl, '_blank', 'noopener,noreferrer');
   ```
4. **Zero Backend Phone Storage**: Participant phone numbers are never transmitted to or logged by the backend, preserving privacy.

---

## 🛠️ Other Endpoints

### 1. Health Check
- **Method**: `GET`
- **Path**: `/api/health`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "uptime": 42.1,
      "timestamp": "2026-10-27T05:40:00.000Z",
      "version": "1.0.0"
    }
  }
  ```

### 2. Offline Mock Public Datasets
- **Method**: `GET`
- **Path**: `/api/mock/:dataset`
- **Supported Datasets**: `weather`, `products`, `countries`, `books`, `quotes`, `campus-map`, `waste-taxonomy`, `nutrition`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

---

## 💻 Local Setup & Quick Verification

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
Server starts on `http://localhost:5000`.

### 2. Quick Test via cURL
```bash
curl -X POST http://localhost:5000/api/challenges/generate \
  -H "Content-Type: application/json" \
  -d '{"theme": "EdTech"}'
```

### 3. Run Automated Tests
```bash
cd backend
npm test
```
All 48 integration and unit tests run in <4 seconds.
