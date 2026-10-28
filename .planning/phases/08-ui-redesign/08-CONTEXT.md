# Phase 8 Context: CTS UI Redesign — Event Dashboard, 4-Hour Timer & Team Challenge Table

## Background & Motivation
The previous landing page had a large decorative illustration on the left that occupied valuable presentation screen real estate. The IEEE hackathon event requires a clean, professional event-management interface organized into three primary screens:
1. **Event Dashboard (`/`)**: Compact event identity, 3 metric chips, 2 quick-nav cards, team name input, 8-theme selection grid, and challenge generation with 4-pillar result flip cards.
2. **Live Event Timer (`/timer`)**: Large, bold, centered 4-hour countdown (`04:00:00`) for seminar hall projector displays, with operator-protected Start/Pause/Resume/Reset controls and fullscreen support.
3. **Team Challenge Table (`/teams`)**: Searchable, filterable, sortable registry of all teams and their persisted challenges directly from MongoDB Atlas.

## Key Decisions

### 1. Visual Identity & Dashboard Layout
- **Left Column**: Clean, editorial typography layout matching the user's mockup:
  - Header: `AI-POWERED BUILD CHALLENGE`, `CHAOS TO SOLUTION.` in royal blue and dark charcoal with yellow sparkle doodles.
  - Subtitle: "One problem. One restriction. One resource. Build a solution that matters."
  - 3 Metric Badges:
    - `4 Hours` / `Build Time` (purple clock)
    - `2 Members` / `Per Team` (yellow users)
    - `Real Problems` / `Real Impact` (blue trophy)
  - 2 Action / Navigation Cards:
    - `Live Event Timer` with blue clock icon and right arrow navigating to `/timer`.
    - `Team Challenges` with yellow users icon and right arrow navigating to `/teams`.
- **Right Column**: Elevated white card:
  - Header: `GET YOUR CHALLENGE`, `Enter your team name`, helper text.
  - Team Name input with live character counter `0/50`.
  - `SELECT A THEME` with 8 theme cards in a 2-column grid featuring colored circular icons, titles, taglines, and radio circles.
  - `GENERATE MY CHALLENGE` button with yellow sparkle and right arrow.

### 2. Live Event Timer (`/timer`)
- Viewport-spanning countdown display readable across a classroom or auditorium.
- Centered digital clock font in `04:00:00` format with status indicators (`NOT STARTED`, `RUNNING`, `PAUSED`, `COMPLETED`).
- Synchronized with MongoDB backend (polls every 8 seconds for drift correction; ticks locally every 1 second).
- Event operator controls (Start, Pause, Resume, Reset) protected by `EVENT_ADMIN_TOKEN`.
- Fullscreen button using the standard HTML Fullscreen API.

### 3. Team Challenge Table (`/teams`)
- Live registry of all registered teams fetched from `GET /api/teams`.
- Columns: `#`, `Team Name`, `Theme`, `Problem Statement`, `Technical Restriction`, `Resource`, `Deliverable`, `Generated At`.
- Real-time search filter by team name.
- Filter dropdown/chips by Theme (All + 8 themes).
- Sort options: Newest First, Oldest First, Team Name (A-Z).
- "View Full Mission" detail modal to inspect full guidance and docs URLs.
- Refresh button with last-updated timestamp.

### 4. Backend & MongoDB
- Add `GET /api/teams` endpoint to `team.routes.js` and `teamService.js` supporting search, theme filtering, and sorting.
- Add regression test guaranteeing `TeamAssignmentSchema.pre('validate')` cannot produce `next is not a function`.

### 5. Client-Side Routing
- Clean browser history router (`useRouter`, `navigate`) supporting `/`, `/timer`, `/teams` without page reloads, compatible with browser back/forward and direct refresh.
