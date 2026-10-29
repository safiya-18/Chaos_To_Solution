# Project State: Chaos to Solution Backend
 
## Current Phase: Phase 8 - UI Redesign — Event Dashboard, 4-Hour Timer & Team Challenge Table (COMPLETED & VERIFIED)
- **Current Milestone**: Milestone 1 - Complete Event Management Platform — COMPLETED
- **Active Phase**: Phase 8 (UI Redesign — Event Dashboard, 4-Hour Timer & Team Challenge Table) — Implemented, Verified & Documented
- **Status**: Fully audited, verified end-to-end, and release-ready. All 177 automated tests passing (112 backend across 11 suites, 65 frontend across 11 suites). Clean Vite production build. 3 interconnected screens (`/`, `/timer`, `/teams`), live MongoDB Atlas persistence, real-time Groq AI generation with transparent fallbacks, authoritative shared timer, protected deletion requiring operator authorization, and complete API endpoint verification.
 
## Key Approved Decisions
- **Decision 1 (Themes)**: 8 approved themes (`EdTech`, `FinTech`, `HealthTech`, `Sustainability`, `Smart Cities`, `Accessibility`, `E-commerce`, `Open Innovation`). Strict validation with HTTP 400. No silent fallback to Open Innovation.
- **Decision 2 (AI Integration)**: Multi-provider architecture. Groq (`groq-sdk`, `openai/gpt-oss-20b`) as primary with strict JSON Schema. Google Gemini (`gemini-3.8-flash`) as secondary.
- **Decision 3 (Frontend Contract)**: Reconciled with Imadulla's completed frontend `validateChallenge.js` and `whatsapp.js`. Envelope `{ success: true, data: { id, theme, generatedAt, source, challenge, shareText } }`.
- **Decision 4 (WhatsApp Formatter)**: Pre-formatted WhatsApp copy in `shareTextFormatter.js` returned inside `data.shareText`. Phone number collection and URL generation handled client-side. Includes registered team name when present.
- **Decision 5 (Graceful Fallback)**: Timeouts ($\le 4000$ms), rate limits (429), or missing keys trigger curated Phase 2 fallbacks with explicit source indicator (`source: "curated-fallback"` vs `source: "ai"`). Zero 500 crashes.
- **Decision 6 (CORS & Security)**: Default CORS allows `http://localhost:5173-5176` and `http://localhost:3000`. No API keys, database credentials, or admin tokens exposed.
- **Decision 7 (Offline Resilience)**: Tier 1 backend curated fallback bank ensures 100% server uptime even without internet; Tier 2 frontend client mock mode handles venue network drops.
- **Decision 8 (Groq Strict Schema & Fast Failover)**: Groq structured outputs enforced via `response_format: { type: "json_schema", json_schema: { strict: true } }`. Rate limits fail fast to curated fallback in < 1000ms with zero retry loops.
- **Decision 9 (Database Architecture & Lifecycle)**: Mongoose utilized for schemas, indexes, and validation. Non-blocking connection lifecycle with sanitized URI logging and health probe reporting. Database unavailability returns clear 503 error without silent false "saved" confirmation.
- **Decision 10 (Unique Team Policy)**: Case-insensitive uniqueness enforced via `normalizedTeamName` unique index. Duplicates return `409 TEAM_ALREADY_EXISTS`. Existing challenges are never overwritten.
- **Decision 11 (Shared Authoritative Timer)**: Single event-wide countdown (`14,400,000 ms` = 4h) computed from server timestamps (`startedAt`, `endsAt`, `pausedAt`). Refresh or browser reload does not restart countdown. Operator mutations (`/start`, `/pause`, `/resume`, `/reset`) protected by `EVENT_ADMIN_TOKEN` via constant-time verification.
- **Decision 12 (Frontend Synchronization)**: Frontend polls `/api/event-timer` every 8-12 seconds to correct drift and ticks locally each second. Warning states (< 60m amber, < 10m red) inform participants.
- **Decision 13 (Mongoose Hook Modernization)**: Mongoose 8.x synchronous `pre('validate')` without `next` parameter to resolve `TypeError: next is not a function`, plus schema default for `normalizedTeamName`. Guarded by unit regression tests.
- **Decision 14 (Zero-Dependency Client Routing)**: Browser History API router (`RouterProvider`, `useRouter`, `Link`) supporting `/`, `/timer`, `/teams` without page reloads or bundle bloat.
- **Decision 15 (Three-Screen Event Interface)**: Event Dashboard (`/`), Dedicated Projector Timer (`/timer`), and Searchable Team Challenge Table (`/teams`) fully connected with live backend.
- **Decision 16 (Protected Operator Deletion & Zero Credential Leaks)**: `DELETE /api/teams/:id` requires operator Bearer token matching `EVENT_ADMIN_TOKEN` via constant-time verification. Operator tokens are kept strictly in ephemeral React component memory—never stored in `sessionStorage` or `localStorage`.
- **Decision 17 (Pinned Modal & Floating Custom Scrollbar)**: Detail modal in Screen 3 pins the header and close button while allowing the 4 challenge pillars to scroll independently via `.custom-modal-scrollbar` with a floating pill thumb.

## Next Action
System is production-ready for the IEEE Chaos to Solution event at SJCIT. Event kiosk and projection setup follows `EVENT_RUNBOOK.md`.
