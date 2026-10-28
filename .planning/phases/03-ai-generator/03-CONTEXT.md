# Phase 3 Context: AI Challenge Generation Engine & Fallback Routing (Refined)

## Metadata
- **Phase**: 3 - AI Challenge Generation Engine & Fallback Routing
- **Status**: Context & Architecture Refined & Locked
- **Date**: 2026-10-26
- **Target Event**: IEEE Computer Society Hackathon, SJC Institute of Technology

---

## 1. Locked Architecture Decisions

### A. Approved Themes (8 Themes) & Strict Validation
1. `EdTech`
2. `FinTech`
3. `HealthTech`
4. `Sustainability`
5. `Smart Cities`
6. `Accessibility`
7. `E-commerce`
8. `Open Innovation`

- **Theme Rule**: Falsy, missing, or unapproved themes strictly throw a descriptive `ValidationError`. No silent conversion into Open Innovation.

### B. Gemini SDK & Structured Schema
- **SDK**: Official `@google/genai` Node.js SDK.
- **Model**: `gemini-2.5-flash` (or `gemini-1.5-flash`).
- **Configuration**: Loaded strictly via `backend/src/config/env.js` from `backend/.env`.
- **System Prompt**: Anchors generation to a functional prototype achievable by 2–4 students in ~3 hours (180 minutes). Disallows authentication, databases, payment gateways, and hardware sensors.
- **Output Schema**: Native JSON mode with strict properties:
  - `theme`: string
  - `problem`: `{ title: string, statement: string }`
  - `restriction`: `{ name: string, rule: string }`
  - `resource`: `{ name: string, type: string, guidance: string, docsUrl: string }`
  - `deliverable`: string

### C. Multi-Pillar Challenge Validator (`challengeValidator.js`)
- Validates approved theme.
- Validates text field string lengths (title 3-100, statement 10-500, deliverable 10-500, guidance 10-500).
- Validates resource type (`browser-api`, `public-api`, `local-dataset`) and docsUrl syntax (`^https?:\/\/.+`).
- Scans full text for banned paid services, proprietary tokens, or hardware (OpenAI, Stripe, AWS, Twilio, Raspberry Pi).
- Checks holistic cohesion between problem, restriction, and resource guidance.

### D. Audited Curated Fallback Service (`fallbackService.js`)
- Maps all 8 themes to audited Phase 2 problems, restrictions, and resources.
- Avoids recent signatures when candidates exist. Recycles gracefully if all candidates exhausted.
- 100% of fallback outputs pass `challengeValidator`.
- Explicitly flags `"source": "curated-fallback"`.

### E. Anti-Repeat Memory
- In-memory ring buffer (capacity: 30) of `${theme}:${title}` signatures.
