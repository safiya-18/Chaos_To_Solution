# Phase 12 Context: Challenge Diversity Engine & Semantic Repetition Prevention

## Context & Objectives
Feedback during participant testing revealed that generated challenges under themes like FinTech felt overly repetitive: many asked teams to build similar single-purpose calculators or dashboards with minor variations in title or wording.
The objective of Phase 12 is to implement a robust, multi-dimensional Challenge Diversity Engine and Semantic Repetition Prevention system that guarantees genuine differentiation across 8 core dimensions:
1. Problem domain / subdomain
2. Primary user persona
3. Core problem / friction point
4. Expected solution / deliverable
5. Primary workflow
6. Technical approach / architecture
7. Main algorithmic approach
8. Expected demonstration outcome

## Key Architectural Decisions (Locked)

1. **Diversity Profile & Taxonomy Classification**:
   - Hybrid extraction: A comprehensive, deterministic taxonomy and keyword classification engine (`diversityProfileService.js`) maps any challenge (official curated 40 challenges, AI candidate, or curated fallback) into a structured `diversityProfile`:
     - `theme`: One of the 8 approved themes.
     - `subdomain`: Theme-specific specialization (e.g. For FinTech: Payments & Transactions, Fraud & Anomaly, Lending & Repayment, Financial Literacy, Taxation & Compliance, Merchant Operations, Inclusion & Accessibility, Insurance, Risk Assessment, Data Privacy).
     - `problemCategory`: Specific category of friction (e.g. expense-settlement, debt-simplification, micro-charge-detection, burn-rate-projection, invoice-matching, savings-gamification).
     - `userPersona`: Target beneficiary (e.g. student/roommates, first-time digital wallet user, gig-economy freelancer, micro-retailer, low-income saver).
     - `solutionArchetype`: 1 of 15 tracked application archetypes:
       `dashboard`, `calculator`, `tracker`, `recommendation-engine`, `prediction-system`, `marketplace`, `matching-system`, `optimization-engine`, `classification-system`, `simulation`, `scheduling-system`, `accessibility-tool`, `data-transformation-tool`, `resource-allocation-system`, `workflow-automation-system`.
     - `primaryWorkflow`: Key user action steps (e.g. import-data -> rule-eval -> alert -> report).
     - `technicalApproach`: Execution model (e.g. client-side-only, local-storage-persistence, event-driven-canvas, speech-synthesis, heuristic-scoring).
     - `datasetType`: Type of supplied data (e.g. simulated-transactions, time-series-csv, tabular-json, mock-rest-api, browser-sensor).
   - Prompt guidance: Groq and Gemini system prompts receive instructions and diversity context (overused archetypes/subdomains to avoid, suggested underrepresented directions) to guide generation toward varied solutions.

2. **Two-Stage Semantic Diversity Gate**:
   - **Stage 1 (Hard Gate / Rejection & Regeneration)**:
     - Compare candidate against:
       1. All 40 official curated challenges.
       2. Recent generation history in current event.
       3. Active team assignments in MongoDB.
       4. In-memory generation attempts buffer.
     - Weighted Semantic Similarity formula:
       - Core problem similarity: 30%
       - Functional workflow similarity: 25%
       - Solution archetype similarity: 20%
       - User persona similarity: 10%
       - Technical approach similarity: 10%
       - Resource similarity: 5%
     - If weighted similarity $\ge 0.65$, or if exact `(subdomain, solutionArchetype)` repeats within the recent history window, reject/regenerate the candidate.
   - **Stage 2 (Soft Scoring & Ranking)**:
     - Apply frequency penalties to candidates that utilize frequently chosen archetypes or subdomains, promoting underrepresented categories.

3. **Storage & Data Schema**:
   - Add optional `diversityProfile` subdocument to `GenerationHistory` and `TeamAssignment` schemas.
   - Fully backward-compatible (defaults to empty/null if absent in legacy records, derived dynamically on-the-fly when reading legacy records).

4. **Curated Fallback Rotation**:
   - Upgraded `fallbackService.js` rotates systematically across distinct subdomains and archetypes rather than repeatedly selecting the first matching affinity problem.

5. **Strict Constraint Preservation**:
   - Official restrictions (client-side only, simulated data, no paid APIs, no hardware) remain absolute.
   - 2-3 hour hackathon feasibility: Every challenge specifies realistic MVP functional bounds, optional enhancements, and demonstrable outcome.
