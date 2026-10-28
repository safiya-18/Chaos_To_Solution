# Phase 2 Plan: Challenge Bank Design & Curated Dataset

## Metadata
- **Phase**: 2
- **Focus**: Curated Challenge Bank Datasets, Offline Fallback Mocks, and Deterministic Data Validation
- **Location**: `backend/`
- **Dependencies**: Phase 1 (Completed Scaffolding & Tooling)
- **Status**: Ready for Review / Execution Approval

---

## 1. Objective
Design, curate, and implement the high-quality challenge data banks (`problems.json`, `restrictions.json`, `resources.json`) for the **Chaos to Solution** hackathon at SJCIT. Establish offline resilience through local mock endpoints for external APIs, and provide a deterministic validation suite in Vitest verifying schema strictness, reference integrity, and that $>1,000$ valid combinations fall strictly within the balanced composite difficulty range of 4–6.

---

## 2. Scope & Target Dataset

1. **Problems (`backend/src/data/problems.json`)**:
   - Minimum 20 realistic, relatable problems achievable in ~3 hours.
   - Evenly distributed across the 5 approved categories (4 per category):
     - `campus-life` (Campus Life & Student Utility)
     - `accessibility` (Accessibility & Assistive Technology)
     - `productivity` (Productivity & Micro-Tools)
     - `civic-good` (Civic & Community Good)
     - `interactive-media` (Interactive Media & Digital Wellbeing)
2. **Restrictions (`backend/src/data/restrictions.json`)**:
   - Minimum 15 constraints across UI layout, libraries, network, interaction, and data persistence.
3. **Resources (`backend/src/data/resources.json`)**:
   - Minimum 15 resources comprising zero-setup Browser APIs, keyless public REST APIs, and local curated datasets.
4. **Offline Resilience**:
   - Local mock JSON payloads in `backend/src/data/mock/` for every external public API.
   - Express router `GET /api/mock/:dataset` serving these payloads.
5. **Deterministic Validation & Testing**:
   - Validation utility `backend/src/utils/dataValidator.js`.
   - Comprehensive test suite `backend/tests/unit/dataValidation.test.js` and `backend/tests/integration/mock.test.js`.

---

## 3. Atomic Tasks

### Task 1: Curate `problems.json`
- **Target File**: `backend/src/data/problems.json`
- **Actions**:
  - Implement 20 curated problem definitions across all 5 categories.
  - Fields per item:
    - `id`: Unique string (e.g., `prob_campus_01`)
    - `title`: Short punchy name
    - `description`: 2-3 sentence actionable prompt
    - `category`: Exactly one of the 5 approved category keys
    - `difficulty`: `"easy"` | `"medium"` | `"hard"`
    - `difficultyWeight`: Integer (1, 2, or 3)
    - `tags`: String array
    - `incompatibleRestrictions`: String array of restriction IDs (or empty array)
    - `incompatibleResources`: String array of resource IDs (or empty array)

### Task 2: Curate `restrictions.json`
- **Target File**: `backend/src/data/restrictions.json`
- **Actions**:
  - Implement 15 creative, prototype-friendly constraints.
  - Fields per item:
    - `id`: Unique string (e.g., `rest_css_01`)
    - `name`: Short constraint title
    - `rule`: Clear, unambiguous rule description
    - `difficulty`: `"easy"` | `"medium"` | `"hard"`
    - `difficultyWeight`: Integer (1, 2, or 3)
    - `categoryTag`: UI, network, input, storage, or logic constraint
    - `incompatibleResources`: String array of resource IDs
    - `requiresNetwork`: Boolean

### Task 3: Curate `resources.json`
- **Target File**: `backend/src/data/resources.json`
- **Actions**:
  - Implement 15 free, keyless resources (mix of Browser APIs, Public APIs, and Local Datasets).
  - Fields per item:
    - `id`: Unique string (e.g., `res_api_openmeteo`)
    - `name`: Resource name
    - `type`: `"browser-api"` | `"public-api"` | `"local-dataset"`
    - `description`: What it provides and how teams can use it
    - `docsUrl`: Direct official documentation link
    - `offlineSupported`: Boolean (true for browser APIs and local datasets)
    - `fallbackMockUrl`: Path to backend mock route (e.g., `"/api/mock/weather"`) for public APIs, or `null` for offline-supported resources
    - `difficulty`: `"easy"` | `"medium"` | `"hard"`
    - `difficultyWeight`: Integer (1, 2, or 3)
    - `tags`: String array

### Task 4: Offline Mock Payloads Creation
- **Target Directory**: `backend/src/data/mock/`
- **Actions**:
  - Create static JSON snapshots for each public API resource:
    - `weather.json`: Hourly and daily forecast sample
    - `products.json`: Product catalog sample
    - `countries.json`: Demographics and flags sample
    - `books.json`: Library book catalog sample
    - `quotes.json`: Daily motivation/wisdom quotes sample
  - Verify all mock payloads are lightweight (< 50KB) and conform to realistic schemas.

### Task 5: Express Mock Router & Endpoint Mounting
- **Target Files**:
  - `backend/src/routes/mock.routes.js`
  - `backend/src/app.js`
- **Actions**:
  - Implement router handling `GET /api/mock/:resourceName`.
  - Return `{ success: true, data: <payload> }`.
  - Handle unknown mock datasets with 404 `{ success: false, error: { code: "MOCK_NOT_FOUND", message: "..." } }`.
  - Mount router in `app.js` at `/api/mock`.

### Task 6: Deterministic Data Validator Utility
- **Target File**: `backend/src/utils/dataValidator.js`
- **Actions**:
  - Implement schema validation functions for problems, restrictions, and resources.
  - Implement combinatorial calculator:
    - Iterates over all problem $\times$ restriction $\times$ resource triplets.
    - Excludes triplets where problem/restriction or restriction/resource incompatibilities exist.
    - Excludes triplets where `restriction.requiresNetwork === true` and `resource.offlineSupported === false` under offline restrictions.
    - Filters by composite difficulty: $\text{Weight}(P) + \text{Weight}(R) + \text{Weight}(Res) \in [4, 6]$.
    - Counts and returns total valid balanced combinations.

### Task 7: Data Validation Unit Tests
- **Target File**: `backend/tests/unit/dataValidation.test.js`
- **Actions**:
  - Assert IDs are 100% unique across each dataset.
  - Assert all items satisfy required fields, types, and difficulty weight mappings (1=easy, 2=medium, 3=hard).
  - Assert every reference in `incompatibleRestrictions` or `incompatibleResources` maps to an existing ID.
  - Assert all public API resources have an existing fallback mock file in `backend/src/data/mock/`.
  - Assert that the number of valid combinations within composite difficulty 4–6 exceeds 1,000.

### Task 8: Mock Endpoints Integration Tests
- **Target File**: `backend/tests/integration/mock.test.js`
- **Actions**:
  - Use Supertest to request each mock route (e.g. `GET /api/mock/weather`).
  - Assert HTTP 200, Content-Type application/json, and `{ success: true, data }`.
  - Assert unknown mock route `GET /api/mock/unknown` returns 404 with standard error envelope.

### Task 9: Documentation & Readiness Check
- **Target File**: `backend/README.md`
- **Actions**:
  - Update README with details on challenge banks, mock fallback endpoints, and test commands.
  - Run full test suite `npm test` verifying all health, validation, and mock tests pass.

---

## 4. Verification & Acceptance Criteria
1. **File Count & Distribution**:
   - `problems.json` has $\ge 20$ items across the 5 categories.
   - `restrictions.json` has $\ge 15$ items.
   - `resources.json` has $\ge 15$ items.
2. **Schema & Reference Integrity**: Zero validation errors or broken IDs when analyzed by `dataValidator.js`.
3. **Offline Fallback Coverage**: 100% of public API resources have a verified mock file and working `/api/mock/:resource` route.
4. **Combinatorial Density**: Greater than 1,000 valid, non-incompatible challenge triplets fall strictly within composite difficulty 4–6.
5. **Zero Regressions**: Existing health check tests (`tests/integration/health.test.js`) continue to pass.
6. **ES Module Pure**: All files use native ES modules (`import`/`export`).
