# Phase 12 Context: Refine AI Challenge Generation for a Realistic 3-Hour Hackathon

## 1. Problem & Context
The hackathon duration is officially 3 hours. Previously, AI prompts targeted 2 hours and generated deliverables with a 5-part structure.
While the previous improvement successfully moved CTS away from generic single-page apps and basic prototypes, it lacked an explicit tiered feasibility boundary. Without structured feasibility guardrails, challenges risk asking for enterprise-scale systems (full auth/RBAC, microservices, complex real-time setups) that are impossible to build within 3 hours.

## 2. Core Generation Philosophy
"Build a functional, demonstrable MVP within 3 hours, with optional opportunities for further innovation."
- Technically meaningful.
- Interesting enough to challenge engineering students through algorithmic complexity (e.g. transparent prioritization, resource allocation, matching algorithms, pattern detection).
- Realistic for a two-member team using AI coding assistants.
- Testable during the final live demo.
- 100% compliant with official technical restrictions.
- Focused on solving one clearly defined problem.

## 3. Strict 3-Hour Tiered Scope Model
Every generated deliverable must be divided into three clear levels:
- **Level 1 — MUST BUILD (Core MVP) [Mandatory]**:
  - One primary user problem and journey.
  - 3–5 meaningful functional capabilities (input, processing, output, validation, functional interface, demonstrable result with supplied/permitted data, essential architecture).
  - Independently usable and demonstrable (no static mockups or non-functional screens).
- **Level 2 — SHOULD IMPROVE (Enhancements) [Optional]**:
  - Advanced filtering, additional analytics, better visualizations, improved accessibility, data export, better error handling, additional useful workflows.
- **Level 3 — BONUS CHALLENGE (Stretch Goals) [Optional]**:
  - Algorithmic optimization, advanced recommendation logic, extra visualizations, performance improvements, extra user role, AI-powered enhancement where permitted.

## 4. Internal Feasibility Invariants (Pre-Generation Self-Check)
1. Can two students understand the problem and plan their approach in 15–20 minutes?
2. Can they implement the core MVP in 120–140 minutes?
3. Can they test, debug, and prepare a demonstration in the remaining time?
4. Are all datasets, APIs, and resources accessible without complex infrastructure?
5. Mandatory features must be limited enough to finish.
6. Does the solution demonstrate meaningful value even if optional enhancements are skipped?

## 5. Explicitly Avoided Anti-Patterns
Do not demand:
- Full production auth/RBAC.
- Complex multi-role administration.
- Multiple independent backends or microservices.
- Complex real-time socket infrastructure.
- Large ML model training or complex pipelines.
- Lengthy setup or external paid integrations.

## 6. Deliverable Output Structure
The deliverable string must follow this structured specification:
- Product Objective: Clear description of what is built and what friction point it solves.
- Core MVP (Must Build): Mandatory functional capabilities, input/processing/output, demonstrable result.
- Enhancements (Should Improve): Optional enhancements (filtering, analytics, visualizations, export).
- Bonus (Stretch Goals): Optional stretch goals (algorithmic optimization, advanced recommendations).
- Expected Working Outcome: Demonstrable, testable criteria at demo time.
- Evaluation Criteria: Measurable rubrics (functional completeness, correctness, UX, constraint compliance).

## 7. Official Constraint Preservation
Non-negotiable:
- Client-side-only challenges must remain client-side-only (no backend).
- Offline-first must remain offline-first.
- Simulated data must remain simulated (no live hardware, sensors, payment gateways).
- Free resources only (zero paid APIs).
- Accessibility and asset-size limits remain strictly enforced.
