# Project: Chaos to Solution: Challenge Generator (CTS)

## Overview
A lightweight, robust backend service powering the **"Chaos to Solution: Challenge Generator"** for an **IEEE Computer Society** event at **SJC Institute of Technology (SJCIT)**.

Participants click **"Generate Challenge"** on the frontend, and the backend returns a randomized, feasible 3-part challenge:
1. **Problem Statement**: Practical digital product prompt achievable in ~3 hours.
2. **Restriction**: Creative limitation or constraint to test adaptability.
3. **Resource**: Prescribed API, dataset, or browser feature to incorporate.

After receiving the challenge, the frontend captures the participant's WhatsApp number and prepares a prefilled WhatsApp message containing the challenge details for submission/confirmation.

---

## Team & Responsibilities
- **Safiya**: Backend Developer (Node.js, Express, Challenge Logic, API, Data Banks, Tests)
- **Imadulla**: Frontend Developer (Separate UI, User Flow, WhatsApp Link Integration)
- **Collaboration Model**: Loosely coupled via clear REST API documentation and CORS.

---

## Technical Stack & Constraints
- **Runtime**: Node.js (v24.x LTS)
- **Framework**: Express.js with JavaScript ES Modules (`type: "module"`)
- **Data Source**: Pre-curated, structured JSON banks (`problems.json`, `restrictions.json`, `resources.json`)
- **Persistence**: In-memory ring buffer for recent combination deduplication (zero external DB overhead unless event audit requires Supabase)
- **Testing**: Vitest + Supertest
- **Documentation**: Markdown API specification & interactive endpoint examples
- **Key Constraints**:
  - No LLM API dependencies (deterministic, curated, fast, zero latency/token cost)
  - No auth, payments, or heavyweight database infrastructure
  - Feasible 3-hour scope for student participants

---

## Core Objectives
1. **Health Check**: `GET /api/health` providing service status and uptime.
2. **Challenge Generation**: `GET /api/challenges/generate` (or `POST`) returning structured problem, restriction, resource, and pre-formatted WhatsApp share copy.
3. **Compatibility Engine**: Rule-based validation to eliminate contradictory combinations (e.g., offline restriction + external API resource).
4. **Non-Repeating Logic**: In-memory sliding window cache preventing consecutive repeats of identical triplets.
5. **Standardized Responses**: Predictable JSON response envelopes `{ success: true, data: ... }` and unified error handling.
