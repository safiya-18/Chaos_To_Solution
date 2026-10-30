# Phase 12 Plan: Challenge Diversity Engine & Semantic Repetition Prevention

## Wave 1: Domain & Archetype Similarity Audit
- [ ] Audit the 10 FinTech official challenges (and all 40 curated records across FinTech, Sustainability, EdTech, Open Innovation, Healthcare, CyberSecurity, AgriTech, Smart Cities).
- [ ] Generate pairwise similarity matrix and identify clusters of overlapping archetypes (e.g. dashboards, calculators) and user personas.
- [ ] Document audit findings for the final report.

## Wave 2: Diversity Profile Taxonomy & Extractor (`diversityProfileService.js`)
- [ ] Define taxonomy dictionaries for all 8 themes covering:
  - Subdomains (e.g. 10 FinTech subdomains, 8+ per other theme).
  - 15 solution archetypes: `dashboard`, `calculator`, `tracker`, `recommendation-engine`, `prediction-system`, `marketplace`, `matching-system`, `optimization-engine`, `classification-system`, `simulation`, `scheduling-system`, `accessibility-tool`, `data-transformation-tool`, `resource-allocation-system`, `workflow-automation-system`.
  - Common user personas and functional workflows.
- [ ] Implement `extractDiversityProfile(challenge)`:
  - Deterministically extracts `subdomain`, `problemCategory`, `userPersona`, `solutionArchetype`, `primaryWorkflow`, `technicalApproach`, `datasetType`.
  - Normalizes text, matches keyword stems and regex signals with high precision.
- [ ] Implement `computeWeightedDiversitySimilarity(profileA, profileB, textSim)`:
  - Core problem similarity: 30%
  - Functional workflow similarity: 25%
  - Solution archetype similarity: 20%
  - User persona similarity: 10%
  - Technical approach similarity: 10%
  - Resource similarity: 5%

## Wave 3: Semantic Diversity Engine & Two-Stage Gate
- [ ] Extend `noveltyService.js`:
  - Enhance `evaluateNovelty` with `evaluateDiversityAndNovelty`.
  - Compare candidate against official 40 challenges, recent history, MongoDB assignments, and in-memory attempts.
  - Return `semanticDiversityScore`, `highestSimilarityPair`, and two-stage decision:
    - Hard `REJECT`: Weighted similarity $\ge 0.65$ or identical `(subdomain, solutionArchetype)` in recent window.
    - Soft penalty: Apply archetype and subdomain frequency penalty to total score.
- [ ] Extend `diversityService.js`:
  - Incorporate archetype diversity and subdomain diversity into candidate scoring and ranking.

## Wave 4: Schema & Fallback Rotation
- [ ] Update `backend/src/models/GenerationHistory.js`: Add optional `diversityProfile` subdocument.
- [ ] Update `backend/src/models/TeamAssignment.js`: Add optional `diversityProfile` subdocument.
- [ ] Update `backend/src/services/fallbackService.js`:
  - Rotate across subdomains and archetypes to avoid repeated fallback patterns.

## Wave 5: Prompt Diversity Ingestion & Orchestration Integration
- [ ] Update `groqService.js` and `geminiService.js`:
  - Inject active diversity context (overused archetypes/subdomains to avoid, suggested underrepresented directions) into system prompt.
- [ ] Update `challengeService.js`:
  - Inspect current theme distribution before generation.
  - Inject diversity hints.
  - Check candidate against two-stage semantic diversity gate.
  - Perform bounded diversity retry with alternative directions if rejected.

## Wave 6: Unit & Integration Tests
- [ ] Unit tests for `diversityProfileService`:
  - Accurate extraction of profiles from official challenges.
  - Similarity calculator behavior across matching vs differing archetypes/personas.
- [ ] Unit tests for semantic diversity gate:
  - Rejection of identical functionality with different titles.
  - Acceptance of distinct problems within the same theme.
  - Archetype frequency penalty verification.
- [ ] Integration tests:
  - End-to-end generation across themes without repetitive archetypes.
  - Fallback rotation across subdomains.

## Wave 7: Verification, Git & PR Release
- [ ] Run full backend test suite (`npm --prefix backend test`).
- [ ] Run full frontend test suite (`npm --prefix frontend test -- --run`).
- [ ] Run frontend build (`npm --prefix frontend run build`).
- [ ] Create feature branch `feat/challenge-diversity-engine`.
- [ ] Push, open Pull Request, verify GitHub Actions CI pass, and safely merge.
- [ ] Output the full final audit report requested by the prompt.
