# REST API Specification — Chaos to Solution (CTS)

This document provides the authoritative reference for all REST endpoints exposed by the CTS backend service.

---

## Base URLs
- **Production Base URL**: `https://cts-backend-iywa.onrender.com`
- **Local Development Base URL**: `http://localhost:5000`

All responses follow the unified envelope:
```json
{
  "success": true,
  "data": { ... }
}
```
Errors return:
```json
{
  "success": false,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

---

## 1. System Health

### `GET /api/health`
Returns runtime status and database connectivity.

- **Authentication**: None
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "database": {
        "connected": true,
        "status": "connected"
      },
      "uptime": 1240,
      "timestamp": "2026-10-30T04:14:40.999Z",
      "version": "1.0.0"
    }
  }
  ```

---

## 2. Challenge Generation

### `POST /api/challenges/generate`
Generates a challenge for a selected theme without persisting a team registration record.

- **Authentication**: None
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "theme": "EdTech"
  }
  ```
  *Allowed Themes*: `EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "cts-edtech-mvtx513gn0646",
      "theme": "EdTech",
      "generatedAt": "2026-10-30T04:15:00.000Z",
      "source": "ai",
      "challenge": {
        "theme": "EdTech",
        "problem": {
          "title": "Interactive Spaced Repetition",
          "statement": "Design a micro-learning tool that reinforces concept recall through adaptive interval scheduling."
        },
        "restriction": "Single-Screen View: Entire user experience must fit within a single non-scrolling dashboard.",
        "resource": "Web Speech API (SpeechSynthesis) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API",
        "deliverable": "A responsive single-page web app demonstrating audio-assisted flashcard reviews."
      },
      "shareText": "*CHAOS TO SOLUTION — BUILD CHALLENGE*\n..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`MISSING_THEME` / `INVALID_THEME`): Theme missing or not in approved list.

---

## 3. Team Registration & Assignment Management

### `POST /api/teams`
Registers a team name, generates a challenge, and atomically persists the assignment in MongoDB.

- **Authentication**: None
- **Request Body**:
  ```json
  {
    "teamName": "CyberKnights",
    "theme": "HealthTech"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "team": {
        "id": "6ae39a33851d1c7daf550836",
        "challengeId": "cts-healthtech-8b92c4f1a20",
        "teamName": "CyberKnights",
        "theme": "HealthTech",
        "generatedAt": "2026-10-30T04:20:00.000Z",
        "source": "ai",
        "challenge": {
          "problem": {
            "title": "Allergy Alert Telemetry",
            "statement": "Design an emergency dietary risk detector for shared meal environments."
          },
          "restriction": "Zero External CSS Frameworks: Must use vanilla CSS with native flexbox/grid.",
          "resource": "Open Food Facts API | https://world.openfoodfacts.org",
          "deliverable": "A working single-page scanner with local ingredient filtering."
        }
      },
      "shareText": "*CHAOS TO SOLUTION — BUILD CHALLENGE*..."
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`INVALID_TEAM_NAME`): Team name shorter than 2 or longer than 50 characters.
  - `409 Conflict` (`TEAM_ALREADY_EXISTS`): A team with this normalized name is already registered.
  - `503 Service Unavailable` (`DATABASE_UNAVAILABLE`): MongoDB is unreachable.

---

### `GET /api/teams`
Lists all registered teams with optional search query, theme filter, and pagination.

- **Authentication**: None
- **Query Parameters**:
  - `search` *(string, optional)*: Search term matching team name or problem title.
  - `theme` *(string, optional)*: Filter by theme (e.g. `FinTech`).
  - `sortBy` *(string, optional)*: `generatedAt` (default) or `teamName`.
  - `sortOrder` *(string, optional)*: `desc` (default) or `asc`.
  - `page` *(number, optional)*: Page number (default `1`).
  - `limit` *(number, optional)*: Items per page (default `50`).
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "teams": [
        {
          "index": 1,
          "id": "6ae39a33851d1c7daf550836",
          "challengeId": "cts-healthtech-8b92c4f1a20",
          "teamName": "CyberKnights",
          "theme": "HealthTech",
          "generatedAt": "2026-10-30T04:20:00.000Z",
          "source": "ai",
          "challenge": { ... }
        }
      ],
      "pagination": {
        "total": 17,
        "page": 1,
        "limit": 50,
        "totalPages": 1
      }
    }
  }
  ```

---

### `GET /api/teams/:id`
Retrieves a specific team assignment by MongoDB `_id` or normalized team name.

- **Authentication**: None
- **Response**: `200 OK` (returns team assignment object)
- **Error Responses**: `404 Not Found` (`TEAM_NOT_FOUND`)

---

### `DELETE /api/teams/:id`
Protected operator endpoint to delete a team assignment record.

- **Authentication**: `Bearer <EVENT_ADMIN_TOKEN>` required in `Authorization` header.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "deleted": true,
      "id": "6ae39a33851d1c7daf550836",
      "teamName": "CyberKnights"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`OPERATOR_AUTH_REQUIRED` / `INVALID_OPERATOR_TOKEN`).
  - `404 Not Found` (`TEAM_NOT_FOUND`).

---

## 4. Authoritative Event Timer

### `GET /api/event-timer`
Public endpoint returning the shared, authoritative 4-hour event timer state.

- **Authentication**: None
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "eventId": "cts-2026",
      "status": "not_started",
      "durationMs": 14400000,
      "startedAt": null,
      "endsAt": null,
      "pausedAt": null,
      "remainingMs": 14400000,
      "serverTime": "2026-10-30T04:15:12.550Z"
    }
  }
  ```
  *Statuses*: `not_started`, `running`, `paused`, `ended`.

---

### `POST /api/event-timer/start`
Starts or begins the shared event countdown.

- **Authentication**: `Bearer <EVENT_ADMIN_TOKEN>`
- **Response**: `200 OK` (returns updated timer state with `status: "running"`)

---

### `POST /api/event-timer/pause`
Pauses the running countdown timer.

- **Authentication**: `Bearer <EVENT_ADMIN_TOKEN>`
- **Response**: `200 OK` (returns updated timer state with `status: "paused"`)

---

### `POST /api/event-timer/resume`
Resumes a paused countdown timer.

- **Authentication**: `Bearer <EVENT_ADMIN_TOKEN>`
- **Response**: `200 OK` (returns updated timer state with `status: "running"`)

---

### `POST /api/event-timer/reset`
Resets the timer back to `not_started` (default 4 hours / 14,400,000 ms, or custom duration).

- **Authentication**: `Bearer <EVENT_ADMIN_TOKEN>`
- **Request Body** *(optional)*:
  ```json
  {
    "durationMs": 14400000
  }
  ```
- **Response**: `200 OK` (returns reset timer state)

---

## 5. Offline Mock Datasets

### `GET /api/mock/:dataset`
Serves bundled offline datasets for testing and constraint environments.

- **Authentication**: None
- **Allowed Datasets**: `weather`, `products`, `countries`, `books`, `quotes`, `campus-map`, `waste-taxonomy`, `nutrition`.
- **Response**: `200 OK` (returns dataset JSON array/object)
- **Error Responses**: `404 Not Found` (`MOCK_NOT_FOUND`)
