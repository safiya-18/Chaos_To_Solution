# Project: Chaos to Solution: Challenge Generator (CTS)

## Overview
A resilient, AI-powered backend service powering the **"Chaos to Solution: Challenge Generator"** for an **IEEE Computer Society** event at **SJC Institute of Technology (SJCIT)**.

Participants select an innovation theme (e.g., *EdTech, FinTech, HealthTech, Sustainability, Smart Cities, Accessibility, E-commerce, Open Innovation*) and click **"Generate Challenge"**. The backend invokes Google Gemini to generate a tailored, coherent 3-part challenge:
1. **Problem Statement**: Specific, relatable problem with a clear user persona.
2. **Restriction**: Meaningful technical or UX constraint that forces creative thinking.
3. **Resource**: Keyless public API, browser capability, or local dataset with practical usage guidance.
4. **Deliverable**: Concrete prototype scope achievable in approximately ~3 hours.

After receiving the challenge, the frontend captures the participant's WhatsApp number and prepares a prefilled WhatsApp message containing the challenge details for submission/confirmation.

---

## Team & Responsibilities
- **Safiya**: Backend Developer (Node.js, Express, Gemini Client, Validation, Fallback Engine, REST API, Tests)
- **Imadulla**: Frontend Developer (Theme Selection, Challenge Presentation, WhatsApp Link Integration)
- **Collaboration Model**: Loosely coupled via documented REST API (`POST /api/challenges/generate`).

---

## Technical Stack & Constraints
- **Runtime**: Node.js (v24.x LTS)
- **Framework**: Express.js with JavaScript ES Modules (`type: "module"`)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK (Model: `gemini-2.5-flash` or `gemini-1.5-flash`)
- **Structured Outputs**: Native JSON responseSchema enforcement
- **Fallback Engine**: Pre-curated Phase 2 JSON datasets used as high-availability offline fallbacks if Gemini is rate-limited or unreachable
- **Persistence**: Lightweight in-memory history cache to reduce duplicate challenges
- **Testing**: Vitest + Supertest
- **Key Constraints**:
  - `GEMINI_API_KEY` stored exclusively in server environment; never exposed in client code or Git
  - No authentication, payments, or heavyweight database infrastructure
  - Strict ~3-hour prototype feasibility anchor; no difficulty selection
  - Explicit source transparency (`"source": "ai"` vs `"source": "curated-fallback"`)
