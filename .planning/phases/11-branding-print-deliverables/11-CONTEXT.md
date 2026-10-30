# Phase 11 Context: Event Branding, Printable Team Challenge Report & Advanced Deliverable Generation

## Objective
Implement three core enhancements to Chaos to Solution (CTS):
1. **Event Timer Branding Update**: Change organization branding from "IEEE SJC Institute of Technology" to "IEEE Computer Society" on the Live Event Timer and relevant CTS event branding locations.
2. **Professional Formatted Print / PDF Export**: Add a native print-ready allocation report action to the Team Challenge Table that preserves active search, theme filter, sort order (Newest First, Oldest First, Team Name A-Z/Z-A), renders complete un-truncated text, A4 landscape formatting, repeated headers, and clean print styling.
3. **Advanced AI Deliverable Generation**: Upgrade challenge deliverables from simplistic "single-page prototypes" to functional, multi-component solutions for a 2-hour AI-assisted hackathon (Product Objective, Functional Requirements, System Components, Expected Working Outcome, Evaluation Criteria) while strictly preserving all official restrictions.

---

## Decisions & Locked Technical Specifications

### 1. Event Timer Branding
- **Timer Header**: Replace `IEEE SJC INSTITUTE OF TECHNOLOGY` with `IEEE COMPUTER SOCIETY` in uppercase gold tracking font (`text-[#FFE56A]`, uppercase tracking-[0.24em]).
- **Sub-header**: Preserve `CHAOS TO SOLUTION — LIVE EVENT TIMER`.
- **Scope of Replacements**: Update timer screen, header brand label, and share text templates where CTS event branding refers to the organizing society. Preserve historical PDF document filenames or raw sample datasets where appropriate.
- **Security & Functionality**: Timer clock mathematics, admin authentication (`EVENT_ADMIN_TOKEN`), and operator endpoints remain 100% untouched.

### 2. Print / PDF Export on Team Challenge Table
- **UI Placement**: Place a "Print / Export PDF" button (`id="print-teams-report-btn"`) in the top toolbar next to the Refresh button with Lucide `Printer` icon.
- **Dynamic Dataset Alignment**: The printed document must render the exact filtered and sorted dataset visible to the user:
  - If search query is applied, only matching records are printed.
  - If theme is filtered (e.g., FinTech), only that theme is printed.
  - If sorting is "Oldest First", the printed table orders records oldest to newest.
  - If sorting is "Newest First", the printed table orders records newest to oldest.
  - If sorting is "Team Name (A-Z)" or "(Z-A)", the print matches that order.
- **Print Document Structure**:
  - Dedicated print container rendered with `@media print` stylesheet.
  - Interactive UI (`header`, search box, filter selects, refresh button, modal triggers, action buttons, delete buttons) set to `display: none !important` during print.
  - **Document Header**:
    - `IEEE COMPUTER SOCIETY`
    - `CHAOS TO SOLUTION`
    - `TEAM CHALLENGE ALLOCATION REPORT`
    - Metadata summary: Generation Date & Time, Selected Theme Filter, Search Query (if any), Selected Sort Order, Total Teams Included.
  - **Table Columns**:
    1. `#` (Index)
    2. `Team Name`
    3. `Theme`
    4. `Problem Statement` (Full title + statement, never truncated with ellipses)
    5. `Technical Restriction` (Full rule, never truncated)
    6. `Resource` (Resource name + documentation URL)
    7. `Deliverable` (Full deliverable text, structured line breaks preserved)
  - **Print CSS Features**:
    - Default page orientation `@page { size: A4 landscape; margin: 12mm 10mm; }`.
    - Table header repetition across pages (`thead { display: table-header-group; }`).
    - Row page-break avoidance (`tr { break-inside: avoid; page-break-inside: avoid; }`).
    - High-contrast, clean typography for crisp black-and-white or color printing.
  - **Empty State**: If active search/filter has 0 results, print shows a clean notification banner stating no records match the filter criteria.

### 3. Advanced Deliverable Generation
- **Philosophy**: Challenge undergraduate teams to build complete, functional software using AI assistants in ~2 hours.
- **5-Part Structure**:
  1. *Product Objective*: Clear explanation of what is built and the problem it solves.
  2. *Functional Requirements*: Concrete working features (data input, calculation/validation, analytics, reporting, filtering, offline cache, etc.).
  3. *System Components*: Architecture parts (client UI, local storage/indexedDB or backend API where permitted, styling system, modules).
  4. *Expected Working Outcome*: Demonstrable, testable criteria at demo time.
  5. *Evaluation Criteria*: Measurable grading rubrics (correctness, technical implementation, UX, constraint compliance).
- **Validation Length Adjustment**: In `challengeValidator.js`, expand deliverable string length upper bound from 500 to 1500 characters (`checkStringLength(challenge.deliverable, 10, 1500, 'deliverable', errors)`).
- **Prompt Upgrades**:
  - `backend/src/services/groqService.js`: Upgrade `buildGroqSystemPrompt` to instruct the AI to generate complete multi-component deliverables following the 5-part structure.
  - `backend/src/services/geminiService.js`: Upgrade `buildSystemPrompt` identically.
- **Fallback Upgrade**:
  - `backend/src/services/fallbackService.js`: Update both `generateOfficialFallback` and `generateFallback` to produce structured multi-component deliverables conforming to official constraints.
- **Strict Constraint Enforcement**:
  - When the restriction is "Client-Side Only", no backend may be specified.
  - When the restriction is "Simulated Data Only", no live camera/hardware may be specified.
  - When the restriction is "No Paid APIs", zero paid services may be specified.
- **Frontend Presentation**:
  - In `ChallengeScreen.jsx` and `TeamsScreen.jsx` (mission modal), format the deliverable string cleanly. If structured with section headers or bullet points, render with formatted paragraphs/lists; if plain text, render with clean line breaks.

---

## Verification Plan
1. **Branding Tests**: Verify "IEEE COMPUTER SOCIETY" appears on `/timer` and old "IEEE SJC INSTITUTE OF TECHNOLOGY" does not appear on the timer.
2. **Print/PDF Tests**: Verify Print button triggers `window.print()`, respects sort order, filters, and renders full text.
3. **Deliverable Tests**: Verify Groq, Gemini, and Fallback services generate rich deliverables, pass validation up to 1500 chars, and preserve official constraints across all 8 themes.
4. **Regression**: Run complete backend test suite, frontend test suite, and production build.
5. **Git & CI**: Push feature branch, create PR, verify GitHub Actions CI run, and safely merge.
