# Testing Strategy & Test Suites — Chaos to Solution (CTS)

## Overview

CTS maintains a comprehensive automated testing matrix covering unit logic, integration pipelines, concurrency stress tests, and adversarial security edge cases.

---

## 1. Quick Test Commands

```bash
# Backend Test Suite (Vitest)
cd backend
npm test

# Frontend Test Suite (Vitest + Testing Library)
cd frontend
npm test -- --run

# Frontend Production Build Test
npm run build
```

---

## 2. Test Directory Organization

### Backend (`backend/tests/`)
```
backend/tests/
├── integration/
│   ├── adversarialSuite.test.js              # Security, concurrency, cache eviction, SSRF tests
│   ├── aiGenerationPipeline.test.js          # Groq -> Gemini -> Fallback cascade tests
│   ├── atomicUniquenessAndResourcePolicy.test.js # MongoDB index uniqueness & policy tests
│   ├── challenge.test.js                     # Challenge generation REST endpoint tests
│   ├── masterPdfIngestionAndPipeline.test.js # PDF benchmark ingestion & idempotency tests
│   ├── mock.test.js                          # Offline mock datasets routes tests
│   ├── team.test.js                          # Team registration & deduplication tests
│   └── timer.test.js                         # Event timer state & operator auth tests
└── unit/
    ├── challengeService.test.js              # Orchestrator fallback logic tests
    ├── challengeValidator.test.js            # Theme and challenge schema validation tests
    ├── diversityService.test.js              # Hard rules & diversity scoring tests
    ├── geminiService.test.js                 # Gemini SDK payload formatting tests
    ├── groqService.test.js                   # Groq SDK JSON Schema tests
    ├── ingestionService.test.js              # Ingestion fingerprinting & categorizer tests
    ├── noveltyService.test.js                # Jaccard and n-gram similarity calculations
    ├── resourceDiscovery.test.js             # Curated authority provider tests
    ├── resourceVerification.test.js          # DNS, timeout, and SSRF status checks
    └── teamService.test.js                   # Name normalization and persistence tests
```

### Frontend (`frontend/src/test/`)
```
frontend/src/test/
├── App.test.jsx                              # Full application integration flow
├── ChallengeCard.test.jsx                    # Card flip, reveal, and styling
├── ChallengeRevealTouch.test.jsx             # Mobile touch and 'Reveal All' interactions
├── EventTimer.test.jsx                       # Timer formatting and status warning pills
├── GeometricIllustration.test.jsx            # Dynamic theme SVG rendering
├── LoadingState.test.jsx                     # Shimmer animation and progress indicator
├── Navigation.test.jsx                       # View switching and header navigation
├── TeamRegistrationFlow.test.jsx             # Registration input, 409 and 503 error states
├── TeamsScreen.test.jsx                      # Teams table, search query filter, modal view
├── ThemeSelector.test.jsx                    # 8-theme selection grid interaction
├── TimerScreen.test.jsx                      # Fullscreen timer view & operator dialog
└── validateChallenge.test.js                 # Frontend schema validation logic
```

---

## 3. Historical Release Test Metrics

As of the production release on `main` (commit `930f22b`):

- **Backend Suites**: 18 test files passed (18/18) | **237 tests passed (237/237)** | 0 failures.
- **Frontend Suites**: 12 test files passed (12/12) | **72 tests passed (72/72)** | 0 failures.
- **Frontend Build**: Vite v8.3.5 compiled cleanly with gzip optimization in ~1.9s.

> [!NOTE]
> Test counts represent verified historical release snapshots. As new features or regression tests are added, total counts may increase.

---

## 4. Key Areas Tested

1. **Adversarial Concurrency**: 50 simultaneous team registrations with colliding initial signatures tested to guarantee zero duplicate assignments.
2. **SSRF & DNS Rebinding**: IP pinning and private network blocklist verification against live sockets and redirects.
3. **Cache Expiration**: Isolated TTL eviction testing for resource verification records.
4. **Resilient Fallback**: Disconnecting or timing out AI providers tested to verify seamless fallback to vetted curated benchmarks.
5. **Zero Outbound Leaks**: Unit test suites are mock-isolated to prevent live outbound API calls or dependency on external network access.
