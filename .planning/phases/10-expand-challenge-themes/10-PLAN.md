# Phase 10 Plan: Integrate Four New Challenge Themes into AI Intelligence Engine

## Execution Waves

### Wave 1: Data Modeling & Extraction
- **Task 1.1**: Author `backend/src/data/officialCuratedChallenges.json` with all 40 challenges from the two official PDFs (10 FinTech, 10 Sustainability, 10 EdTech, 10 Open Innovation) matching the specified schema.
- **Task 1.2**: Write unit test `backend/tests/unit/officialCuratedChallenges.test.js` asserting schema completeness: exactly 40 records, 10 per theme, non-empty problem statements, restrictions, resources provided, valid numbers 1-10, valid source document and page numbers.

### Wave 2: Constraint Validation & Pipeline Integration
- **Task 2.1**: Implement `backend/src/utils/themeConstraintValidator.js` defining all domain-specific constraint checks for FinTech, Sustainability, EdTech, and Open Innovation.
- **Task 2.2**: Integrate `themeConstraintValidator` into `backend/src/services/diversityService.js` (`validateHardRules`) and `backend/src/utils/challengeValidator.js`.
- **Task 2.3**: Update `backend/src/services/groundingService.js` to index and retrieve official curated challenges by theme with clear prompt demarcation distinguishing official supplied resources from AI suggestions.
- **Task 2.4**: Update `backend/src/services/noveltyService.js` to evaluate novelty against the 40 official records so that candidates cannot duplicate official problem statements.
- **Task 2.5**: Update `backend/src/services/fallbackService.js` to provide curated fallback options for all 4 themes drawn directly from the 40 official challenges.

### Wave 3: Frontend Integration
- **Task 3.1**: Update `frontend/src/data/mockChallenges.js` to enrich mock fixtures for FinTech, Sustainability, EdTech, and Open Innovation using the official challenges.
- **Task 3.2**: Verify `frontend/src/components/ChallengeScreen.jsx` displays clear provenance and renders challenge cards cleanly for all 4 themes.

### Wave 4: Testing, Verification & Documentation
- **Task 4.1**: Run complete backend test suite (`npm --prefix backend test`).
- **Task 4.2**: Run complete frontend test suite (`npm --prefix frontend test -- --run`) and production build (`npm --prefix frontend run build`).
- **Task 4.3**: Update project documentation in `backend/API.md`, `backend/README.md`, and `DEPLOYMENT.md`.
- **Task 4.4**: Commit changes to `feat/expand-challenge-themes` and push to origin.
