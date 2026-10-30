# Phase 11 Plan: Event Branding, Printable Team Challenge Report & Advanced Deliverable Generation

## Wave 1: Branding Updates & Validation Bounds
- [ ] Task 1.1: Update event branding in `frontend/src/components/TimerScreen.jsx` from "IEEE SJC INSTITUTE OF TECHNOLOGY" to "IEEE COMPUTER SOCIETY".
- [ ] Task 1.2: Check and update event branding in `backend/src/services/shareTextFormatter.js` and `frontend/src/utils/whatsapp.js` to reflect "IEEE Computer Society" cleanly.
- [ ] Task 1.3: Update `backend/src/utils/challengeValidator.js` to allow deliverables up to 1500 characters (`checkStringLength(challenge.deliverable, 10, 1500, 'deliverable', errors)`).

## Wave 2: Printable Team Challenge Report (Print / PDF Export)
- [ ] Task 2.1: Add `Print / Export PDF` button in `frontend/src/components/TeamsScreen.jsx` toolbar with Lucide `Printer` icon and `onClick={() => window.print()}`.
- [ ] Task 2.2: Implement dedicated print styles and layout in `frontend/src/components/TeamsScreen.jsx` and `frontend/src/index.css`:
  - Hide screen headers, navbar, search/filter inputs, refresh button, modal dialogs, and table action buttons (`.no-print` or `@media print`).
  - Render high-contrast, professional report header with IEEE COMPUTER SOCIETY, CHAOS TO SOLUTION, TEAM CHALLENGE ALLOCATION REPORT, and metadata chips (date/time, theme filter, search filter, sort order, team count).
  - Render print table with columns: `#`, `Team Name`, `Theme`, `Problem Statement`, `Technical Restriction`, `Resource`, `Deliverable`.
  - Prevent text truncation (`line-clamp-none`, `whitespace-normal`), allow full statements, restrictions, resource docs, and deliverables.
  - Configure A4 landscape page rule, repeating table headers (`thead`), and page-break inside avoidance for rows.
- [ ] Task 2.3: Add unit tests for printable view in `frontend/src/test/TeamsScreen.test.jsx`:
  - Test print button exists and triggers `window.print`.
  - Test print view reflects current theme filter and sorting order.
  - Test print view renders full untruncated text.

## Wave 3: Advanced AI Challenge Deliverable Generation
- [ ] Task 3.1: Upgrade Groq system prompt in `backend/src/services/groqService.js`:
  - Define the 2-hour hackathon scope and 5-part deliverable structure (Product Objective, Functional Requirements, System Components, Expected Working Outcome, Evaluation Criteria).
  - Explicitly prohibit default single-page prototypes unless mandated by official constraint.
  - Enforce strict adherence to official restrictions (client-side only, simulated datasets, zero paid APIs).
- [ ] Task 3.2: Upgrade Gemini system prompt in `backend/src/services/geminiService.js` with identical guidance.
- [ ] Task 3.3: Upgrade `backend/src/services/fallbackService.js`:
  - Upgrade `generateOfficialFallback` to synthesize structured deliverables respecting official constraints.
  - Upgrade `generateFallback` to synthesize structured deliverables across all standard themes.
- [ ] Task 3.4: Format deliverable rendering in `frontend/src/components/ChallengeScreen.jsx` and `frontend/src/components/TeamsScreen.jsx` (Mission Modal) so multi-section deliverables are visually clean, readable, and structured.

## Wave 4: End-to-End Verification, CI & Merge
- [ ] Task 4.1: Add unit and integration tests in backend and frontend verifying branding, print export, and rich deliverables.
- [ ] Task 4.2: Run complete backend test suite (`npm --prefix backend test`), frontend test suite (`npm --prefix frontend test -- --run`), and frontend production build (`npm --prefix frontend run build`).
- [ ] Task 4.3: Verify `git diff --check`.
- [ ] Task 4.4: Commit and push branch `feat/event-branding-print-and-deliverables`.
- [ ] Task 4.5: Create GitHub Pull Request via MCP.
- [ ] Task 4.6: Verify GitHub Actions CI run passes.
- [ ] Task 4.7: Execute safe merge into `main` and sync local `main`.
