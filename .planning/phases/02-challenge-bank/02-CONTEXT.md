# Phase 2 Context: Challenge Bank Design & Curated Dataset

## Metadata
- **Phase**: 2 - Challenge Bank Design & Curated Dataset
- **Status**: Context & Strategy Finalized (Discussion Phase)
- **Date**: 2026-10-26
- **Target Event**: IEEE Computer Society Hackathon, SJC Institute of Technology

---

## 1. Locked Decisions (Approved)

### A. Difficulty & Generation Balancing
- **Generation Model**: Pure Random / Standard generation. No frontend difficulty selector.
- **Combined Difficulty Metric**: Difficulty is calculated as a composite score of the combination, not just the problem:
  - Item Weights: `easy` = 1, `medium` = 2, `hard` = 3.
  - `Composite Score` = `Weight(Problem) + Weight(Restriction) + Weight(Resource)` (Range: 3 to 9).
  - Target balanced intermediate window: **4 to 6**.
  - Prevents extreme spikes (3+3+3 = 9, unfeasible in 3 hours) or trivial tasks (1+1+1 = 3).

### B. Resource Types & Offline Resilience
- **Resource Composition**: A balanced mix of:
  1. Browser APIs (Canvas, Web Speech, Web Audio, Geolocation, IndexedDB, Vibration/Orientation).
  2. Public keyless REST APIs (Open-Meteo, DummyJSON, REST Countries, Open Library).
  3. Curated local JSON datasets (bundled in backend).
- **Offline Fallback Guarantee**:
  - Every external public API in the bank must have a local mock payload hosted directly by our Express backend (e.g. `/api/mock/...`) so teams can continue building even if venue Wi-Fi fails.

### C. Content Preparation Workflow
- **Live Operation**: 100% deterministic local JSON. Zero live AI calls during the event.
- **Pre-Event Preparation**: Gemini API may optionally assist in drafting/auditing candidates, but content must pass automated schema validation and human review before committing to `backend/src/data/`.
- No mandatory AI script dependency in production.

### D. Category Scope (5 Core Areas)
1. **Campus Life & Student Utility** (Includes waste reduction/sustainability on campus).
2. **Accessibility & Assistive Technology** (Screen readers, high-contrast, voice navigation).
3. **Productivity & Micro-Tools** (Rapid focus, smart planners, dev micro-utilities).
4. **Civic & Community Good** (Public resources, emergency notices, neighborhood aid).
5. **Interactive Media & Digital Wellbeing** (Canvas visuals, audio synthesis, habit health).

### E. Dataset Size
- Target: **20 Problems**, **15 Restrictions**, **15 Resources**.
- Principle: Quality, feasibility, and creative cohesion over sheer volume.

---

## 2. Finalized JSON Schemas

### `problems.json`
```json
{
  "id": "prob_campus_01",
  "title": "Campus Canteen Congestion Tracker",
  "description": "Create a live queue visualizer showing stall wait times with crowd-sourced delay reporting.",
  "category": "campus-life",
  "difficulty": "medium",
  "difficultyWeight": 2,
  "tags": ["campus", "real-time", "utility"],
  "incompatibleRestrictions": [],
  "incompatibleResources": []
}
```

### `restrictions.json`
```json
{
  "id": "rest_css_01",
  "name": "Zero External CSS / Pure HTML & Inline",
  "rule": "No external CSS frameworks or style sheets. All visuals must use semantic HTML, inline attributes, or Canvas/SVG.",
  "difficulty": "medium",
  "difficultyWeight": 2,
  "categoryTag": "ui-constraint",
  "incompatibleResources": [],
  "requiresNetwork": false
}
```

### `resources.json`
```json
{
  "id": "res_api_openmeteo",
  "name": "Open-Meteo Weather Forecast API",
  "type": "public-api",
  "description": "Free, keyless weather and temperature forecast API.",
  "docsUrl": "https://open-meteo.com/en/docs",
  "offlineSupported": false,
  "fallbackMockUrl": "/api/mock/weather",
  "difficulty": "easy",
  "difficultyWeight": 1,
  "tags": ["weather", "realtime", "api"]
}
```

---

## 3. Phase 2 Measurable Acceptance Criteria
1. JSON data banks created in `backend/src/data/`: `problems.json`, `restrictions.json`, `resources.json`.
2. All entries strictly conform to the schema with unique IDs, valid documentation links, and appropriate difficulty weights (1-3).
3. Express backend serves offline mock endpoints under `/api/mock/` for every external API resource.
4. Comprehensive Vitest suite in `backend/tests/unit/dataValidation.test.js`:
   - Confirms ID uniqueness and schema conformity.
   - Validates that incompatible references actually exist.
   - Validates that composite scores yield $> 1,000$ balanced combinations within composite score range 4–6.
   - Verifies 100% offline availability of fallback mocks.
