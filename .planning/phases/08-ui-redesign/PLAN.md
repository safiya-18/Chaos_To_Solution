# Phase 8 Plan: CTS UI Redesign — Event Dashboard, 4-Hour Timer & Team Challenge Table

## Wave 1: Backend API & Model Regression Fix
- [ ] Task 1.1: Add `listTeams` method to `backend/src/services/teamService.js` with search, theme filter, and sorting.
- [ ] Task 1.2: Add `GET /api/teams` route in `backend/src/routes/team.routes.js`.
- [ ] Task 1.3: Add unit regression test in `backend/tests/unit/teamAssignmentModel.test.js` validating that `TeamAssignment` validation and save hooks execute synchronously without `next is not a function`.
- [ ] Task 1.4: Add integration tests for `GET /api/teams` in `backend/tests/integration/team.test.js` (listing, search, theme filter, sorting).

## Wave 2: Frontend Client-Side Routing & Services
- [ ] Task 2.1: Implement lightweight browser history router (`frontend/src/router/Router.jsx` and hook `useRouter`).
- [ ] Task 2.2: Add `fetchTeamsList` method in `frontend/src/services/challengeApi.js`.
- [ ] Task 2.3: Add operator mutation methods `startEventTimer`, `pauseEventTimer`, `resumeEventTimer`, `resetEventTimer` with admin token support in `frontend/src/services/challengeApi.js`.

## Wave 3: UI Redesign Implementation
- [ ] Task 3.1: Redesign `Hero.jsx` into Event Identity section with metric chips (4 Hours, 2 Members, Real Problems) and two navigation cards (Live Event Timer, Team Challenges).
- [ ] Task 3.2: Redesign `ThemeSelector.jsx` to render the clean 2-column theme grid with colored circular icons, taglines, and radio circles matching the mockup.
- [ ] Task 3.3: Build `TimerScreen.jsx` at `/timer`: large high-contrast countdown digits, projector-friendly full viewport, status badges, operator token modal/controls, and fullscreen toggle.
- [ ] Task 3.4: Build `TeamsScreen.jsx` at `/teams`: searchable, filterable, sortable table of persisted challenges, expandable details modal, and refresh timestamp.
- [ ] Task 3.5: Update `App.jsx` to mount router and connect the 3 screens seamlessly, maintaining challenge generation, flip cards, and WhatsApp sharing.

## Wave 4: Testing, Verification & Runbook Documentation
- [ ] Task 4.1: Update frontend tests and add tests for routing, `TimerScreen`, `TeamsScreen`, and new `Hero` component.
- [ ] Task 4.2: Verify 100% test pass on backend (`npm test`) and frontend (`npm test`).
- [ ] Task 4.3: Verify production build (`npm run build`).
- [ ] Task 4.4: Update `README.md`, `EVENT_RUNBOOK.md`, `ROADMAP.md`, `STATE.md`, and produce UAT report.
