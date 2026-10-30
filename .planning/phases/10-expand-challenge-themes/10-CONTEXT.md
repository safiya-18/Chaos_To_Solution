# Phase 10 Context: Integrate Four New Challenge Themes into AI Intelligence Engine

## Objective
Integrate 40 official problem statements from two official challenge-document PDFs into the CTS AI challenge intelligence engine:
1. `Chaos to Solution - FinTech & Sustainability.pdf` (10 FinTech, 10 Sustainability)
2. `Chaos to Solution - EdTech & Open Innovation Challenges.pdf` (10 EdTech, 10 Open Innovation)

## Locked Implementation Decisions

### 1. Data Schema & Storage Architecture
- Store the 40 official challenges in `backend/src/data/officialCuratedChallenges.json` strictly matching the requested schema:
  - `id`: Unique stable ID (`fintech-01` to `fintech-10`, `sustainability-01` to `sustainability-10`, `edtech-01` to `edtech-10`, `open-innovation-01` to `open-innovation-10`).
  - `theme`: `FinTech` | `Sustainability` | `EdTech` | `Open Innovation`.
  - `number`: 1 to 10 within each theme.
  - `title`: Professional descriptive title derived from problem statement and resources.
  - `problemStatement`: Exact wording and constraints from official PDF.
  - `restrictions`: Array of official constraint strings.
  - `resourcesProvided`: Array of official resource strings.
  - `tags`: Array of domain/technology tags.
  - `difficulty`: `easy` | `medium` | `hard` based on technical scope.
  - `source`: `{ document: string, page: number }`.
- Do NOT mutate or corrupt `backend/src/data/referenceChallenges.json` which has 76 existing benchmark records with strict assertions in `tests/integration/masterPdfIngestionAndPipeline.test.js`.

### 2. AI Grounding & Retrieval Integration
- Update `backend/src/services/groundingService.js`:
  - Query `officialCuratedChallenges.json` when building prompt context for `FinTech`, `Sustainability`, `EdTech`, and `Open Innovation`.
  - Distinguish official supplied resources from AI suggestions in prompt instructions: AI must never present AI suggestions as resources officially supplied by organizers.

### 3. Strict Constraint Validation
- Create `backend/src/utils/themeConstraintValidator.js` and link it to `diversityService.js`:
  - FinTech: Client-side settlements, rule-based anomaly detection, no live UPI / real credentials, offline support, bilingual receipts, no PII, under 1 MB page size.
  - Sustainability: Simulated mess/sensor logs, mobile-first (5-inch screen), no paid GIS, no live GPS tracking, WCAG AA contrast & screen-readers, no cash transactions, offline operation, under 1.5 MB asset size.
  - EdTech: Dual-pane notes display, image text alternatives & keyboard navigation, rule-based prioritization without paid APIs, technical term preservation in translations, no student login or LMS integration, anonymous doubts without leaderboards, no arbitrary server code execution, offline under 2 MB, anonymized data without rankings.
  - Open Innovation: Clearly label simulated safety without route guarantees, simulated sensor readings only, static web app with no PII, no camera/facial recognition, food redistribution with allergen flags & no food safety guarantee, step-free accessible routes based strictly on supplied data, conflict detection for equipment without external calendars, aggregate supply counts without medical advice, air quality visualization without live claims or medical diagnoses, public notice simplifier preserving dates/deadlines with unverified translations labeled draft.

### 4. Uniqueness & Novelty Detection
- Update `backend/src/services/noveltyService.js`:
  - `gatherHistoricalChallenges` loads all 40 official records from `officialCuratedChallenges.json` alongside `referenceChallenges.json` and MongoDB `ChallengeBank` / `TeamAssignment`.
  - Ensures no candidate duplicates any of the 40 official problem statements or existing challenges.

### 5. Curated Fallback Enhancement
- Update `backend/src/services/fallbackService.js`:
  - Populate curated fallback entries directly from the official 40 challenges when AI is offline or rate-limited.
  - Provide full coverage across all 4 themes.

### 6. Frontend Integration
- Update `frontend/src/data/mockChallenges.js`:
  - Ensure all 4 themes (`FinTech`, `Sustainability`, `EdTech`, `Open Innovation`) have rich fixtures drawn from the 40 official challenges.
  - Ensure `ChallengeScreen.jsx` clearly displays provenance badges: distinguishes `source === 'ai'` from official curated challenges.

### 7. Production Safety
- Work entirely on branch `feat/expand-challenge-themes`.
- Zero changes to production secrets or live Atlas data.
- Run complete backend test suite, frontend test suite, and frontend build before pushing.
