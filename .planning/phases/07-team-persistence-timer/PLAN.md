# Phase 7: Shared Event Timer & MongoDB Team Challenge Persistence

## Goal
Add a shared authoritative 4-hour countdown timer for the entire hackathon event and integrate MongoDB for persistent team challenge assignments, collecting the team name before challenge generation.

## Deliverables

### 1. MongoDB Connection & Lifecycle
- Integrate Mongoose in `backend/package.json`.
- Configure `MONGODB_URI` safely in `backend/src/config/env.js` and `backend/.env.example`.
- Implement `backend/src/config/db.js` with sanitized URI logging, lifecycle listeners, and `getDBStatus()`.
- Add database readiness to `GET /api/health`.

### 2. Team Registration & Challenge Persistence
- Implement `TeamAssignment` Mongoose model with `normalizedTeamName` unique index.
- Create `backend/src/services/teamService.js` orchestrating generation via `challengeService` and atomic persistence.
- Enforce case-insensitive duplicate team policy returning `409 TEAM_ALREADY_EXISTS`.
- Preserve full 4-pillar challenge triad, metadata, and provenance (`ai` vs `curated-fallback`).
- Expose `POST /api/teams` and `GET /api/teams/:id`.
- Maintain 100% backward compatibility for existing `POST /api/challenges/generate`.

### 3. Shared Event Timer
- Implement `EventTimer` Mongoose model storing `eventId`, `status`, `durationMs` (`14,400,000`), `startedAt`, `endsAt`, `pausedAt`, `remainingMs`.
- Compute authoritative remaining time from server clock timestamps (`Date.now()`).
- Implement `timerService.js` managing transitions (start, pause, resume, reset).
- Expose public `GET /api/event-timer`.
- Secure operator mutations (`/start`, `/pause`, `/resume`, `/reset`) with `EVENT_ADMIN_TOKEN` via constant-time verification.

### 4. Frontend Integration
- Add `TeamRegistrationInput.jsx` (min 2, max 50 chars, trimmed) before theme selection.
- Keep Generate button disabled until both team name and theme are valid.
- Build reusable `EventTimer.jsx` component displaying `HH:MM:SS`, sync status, and warning colors (< 60m amber, < 10m red).
- Render registered team name on challenge results screen.
- Update WhatsApp share text formatting to include team name.
- Handle 409 conflict and 503 database unavailability without losing user inputs.

### 5. Automated Testing & Verification
- Unit and integration tests for team persistence, duplicate rejection, database errors, and timer transitions.
- Frontend unit and integration tests for team input, validation states, timer formatting, and error handling.
- Verify 100% passing status across backend and frontend test suites.
