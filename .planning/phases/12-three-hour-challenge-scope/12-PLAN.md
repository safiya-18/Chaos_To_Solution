# Phase 12 Plan: Refine AI Challenge Generation for a Realistic 3-Hour Hackathon

## Execution Waves

### Wave 1: AI Prompt Architectures & Generation Feasibility (Groq & Gemini)
- Update `buildGroqSystemPrompt` in `backend/src/services/groqService.js`:
  - Target 3-hour development scope with 2-member student team using AI assistants.
  - Implement the 3-hour scope model (Core MVP: Must Build, Enhancements: Should Improve, Bonus: Stretch Goals).
  - Embed the internal 7-point feasibility self-check and explicit list of unrealistic enterprise anti-patterns to avoid.
  - Explicitly mandate algorithmic depth over feature bloat.
  - Deliverable specification with 6 components:
    - Product Objective
    - Core MVP (Must Build)
    - Enhancements (Should Improve)
    - Bonus (Stretch Goals)
    - Expected Working Outcome
    - Evaluation Criteria
- Update `buildSystemPrompt` in `backend/src/services/geminiService.js` to match Groq prompt structure identically.

### Wave 2: Fallback Generator Upgrade & Schema Bounds Validation
- Update `buildRichDeliverable` in `backend/src/services/fallbackService.js`:
  - Generate compliant 3-hour deliverables with the exact 3-level scope model (Core MVP, Enhancements, Bonus).
  - Dynamically respect technical restrictions (e.g. client-side-only restricts persistence to LocalStorage/IndexedDB and avoids backend APIs; simulated-data restrictions avoid live APIs/hardware).
- Update `challengeValidator.js`:
  - Ensure string length bounds for `deliverable` comfortably accommodate the detailed 3-tier structure (e.g., 10 to 1800 characters).

### Wave 3: Test Suite Updates & End-to-End Verification
- Update `backend/tests/unit/groqService.test.js`:
  - Assert 3-hour hackathon target scope and 3-level model in prompt construction.
- Update `backend/tests/unit/challengeService.test.js`:
  - Assert 3-hour structured deliverables with Core MVP, Enhancements, and Bonus components across all themes.
  - Assert rejection of deliverables exceeding updated character bound.
- Verify existing tests across all 8 themes (Healthcare, CyberSecurity, AgriTech, Smart Cities, FinTech, Sustainability, EdTech, Open Innovation).
- Run:
  - `npm --prefix backend test`
  - `npm --prefix frontend test -- --run`
  - `npm --prefix frontend run build`
  - `git diff --check`

### Wave 4: Git Push, PR, CI & Merge
- Commit changes to `feat/3-hour-challenge-scope`.
- Push to origin with `GIT_ASKPASS`.
- Open PR against `main`.
- Monitor GitHub Actions CI run to completion.
- Safe merge into `main` and fast-forward local branch.
- Generate final report.
