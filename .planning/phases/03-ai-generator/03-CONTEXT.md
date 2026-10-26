# Phase 3 Context: AI Challenge Generation Engine & Fallback Routing

## Metadata
- **Phase**: 3 - AI Challenge Generation Engine & Fallback Routing
- **Status**: Context & Architecture Finalized
- **Date**: 2026-10-26
- **Target Event**: IEEE Computer Society Hackathon, SJC Institute of Technology

---

## 1. Locked Architecture Decisions

### A. Approved Themes (8 Themes)
1. `EdTech`
2. `FinTech`
3. `HealthTech`
4. `Sustainability`
5. `Smart Cities`
6. `Accessibility`
7. `E-commerce`
8. `Open Innovation`

### B. Gemini SDK & Structured Schema
- **SDK**: `@google/genai` (official Google Gen AI Node.js SDK).
- **Environment**: `GEMINI_API_KEY` configured in `backend/.env` (and `.env.example`).
- **Generation Model**: `gemini-2.5-flash` (or `gemini-1.5-flash`).
- **Structured Schema**: Enforces output JSON matching:
  - `theme`: String
  - `problem`: `{ title: string, statement: string }`
  - `restriction`: `{ name: string, rule: string }`
  - `resource`: `{ name: string, type: string, guidance: string, docsUrl: string }`
  - `deliverable`: `string`

### C. Validation & Fairness Rules (`challengeValidator.js`)
- Validates that theme is one of the 8 approved themes.
- Validates required fields are non-empty and within reasonable character/word bounds (e.g. statement $< 500$ chars, title $< 100$ chars).
- Validates resource type (`browser-api`, `public-api`, or `local-dataset`) and docsUrl format.
- Banned Service Guardrail: Checks that resource does not require paid subscriptions, proprietary tokens (e.g. OpenAI, AWS, Twilio, Stripe), or hardware peripherals.
- Feasibility Guardrail: Rejects prompts demanding full-scale multi-user production systems.

### D. Fallback Engine (`fallbackService.js`)
- If Gemini call times out (> 5000ms), errors with 429/500, or returns invalid structure:
  - Fallback service selects a curated triplet from `problems.json`, `restrictions.json`, and `resources.json` matching the theme category.
  - Returns challenge payload with `"source": "curated-fallback"`.
- Never displays an unhandled error to hackathon participants.

### E. Anti-Repeat Memory
- In-memory sliding window cache (last 30 generations) tracking problem titles / hashes.
- Injects a brief negative prompt or random seed to discourage Gemini from repeating the same headline.

---

## 2. Phase 3 Scope & Deliverables
1. Install `@google/genai` in `backend/package.json`.
2. Update `backend/src/config/env.js` and `backend/.env.example` with `GEMINI_API_KEY`.
3. Create `backend/src/services/geminiService.js`.
4. Create `backend/src/services/fallbackService.js`.
5. Create `backend/src/utils/challengeValidator.js`.
6. Create `backend/src/services/challengeService.js` (orchestrator + anti-repeat cache).
7. Create unit test suite `backend/tests/unit/challengeService.test.js`.
8. Ensure all existing Phase 1 & 2 tests continue passing (zero regressions).
