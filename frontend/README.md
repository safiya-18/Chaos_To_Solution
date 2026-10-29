# Chaos to Solution: Challenge Generator — Frontend

Modern, dark-themed hackathon challenge generator web application built for the **IEEE Computer Society** at **SJC Institute of Technology (SJCIT)**.

Participants select from eight hackathon themes and generate an AI-powered challenge containing four core pillars:
1. **01 — Problem Statement**: Practical real-world problem prompt achievable in ~3 hours.
2. **02 — Technical Restriction**: Architectural or technical constraint to test adaptability.
3. **03 — Prescribed Resource**: Recommended browser API, public API, dataset, or tool with verified documentation.
4. **04 — Expected Deliverable**: Concrete working prototype to demonstrate to judges.

The application is organized into three connected screens managed by a zero-dependency History API router:
1. **Screen 1 — Event Dashboard (`/`)**: Collects team name, presents the 8-theme grid, handles challenge generation via AI cascade, displays the 4 challenge flip cards, and generates WhatsApp share copy.
2. **Screen 2 — Live Event Timer (`/timer`)**: Full-screen projector countdown clock (`04:00:00`) designed for seminar halls with operator-protected Start/Pause/Resume/Reset controls.
3. **Screen 3 — Team Challenges Table (`/teams`)**: Live searchable, filterable, and sortable table of all registered teams with a mission detail modal (featuring a custom floating scrollbar) and protected operator deletion.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with custom dark design tokens and `.custom-modal-scrollbar`
- **Routing**: Zero-dependency Browser History API router (`src/router/Router.jsx`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [JSDOM](https://github.com/jsdom/jsdom) (65 tests across 11 test suites)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ActionCards.jsx        # Navigation cards deep-linking to /timer and /teams
│   │   ├── ChallengeCard.jsx      # Numbered 3D flip card (01-04)
│   │   ├── ChallengeResults.jsx   # Results view with AI / Backup Challenge badges
│   │   ├── ErrorState.jsx         # User-friendly error message & Retry action
│   │   ├── GenerateButton.jsx     # Primary action button with loading spinner
│   │   ├── Header.jsx             # Branding, IEEE badge, and Mock/Live API toggle
│   │   ├── Hero.jsx               # Hackathon premise and 4-pillar preview
│   │   ├── LoadingState.jsx       # Step-by-step progress indicator & skeleton cards
│   │   ├── MetricChips.jsx        # 4 Hours, 2 Members, Real Problems chips
│   │   ├── ResourceLink.jsx       # External doc link with secure target="_blank"
│   │   ├── TeamRegistrationCard.jsx # Team name input with character counter & validation
│   │   ├── TeamsScreen.jsx        # Screen 3: Searchable table, mission modal & operator delete
│   │   ├── ThemeCard.jsx          # Individual interactive theme card
│   │   ├── ThemeSelector.jsx      # Radiogroup grid selector for the 8 themes
│   │   ├── TimerScreen.jsx        # Screen 2: Projector 4-hour countdown & operator modal
│   │   └── WhatsAppShareForm.jsx  # +91 phone validation and click-to-chat generator
│   ├── router/
│   │   └── Router.jsx             # History API router (RouterProvider, useRouter, Link)
│   ├── data/
│   │   └── mockChallenges.js      # Curated fixtures across all 8 themes
│   ├── services/
│   │   ├── challengeApi.js        # API service with timeout, abort & error handling
│   │   └── mockChallengeApi.js    # Offline mock challenge generator
│   ├── utils/
│   │   ├── validateChallenge.js   # Schema validation enforcing data contract
│   │   └── whatsapp.js            # Indian number normalization & message builder
│   ├── test/                      # 11 Vitest & RTL test suites (65 tests)
│   │   ├── App.test.jsx
│   │   ├── EventTimer.test.jsx
│   │   ├── mockChallenges.test.js
│   │   ├── Navigation.test.jsx
│   │   ├── setup.js
│   │   ├── TeamRegistrationFlow.test.jsx
│   │   ├── TeamRegistrationInput.test.jsx
│   │   ├── TeamsScreen.test.jsx
│   │   ├── ThemeSelector.test.jsx
│   │   ├── TimerScreen.test.jsx
│   │   ├── validateChallenge.test.js
│   │   └── whatsapp.test.js
│   ├── App.jsx                    # Root state coordinator (Screen 1 Dashboard)
│   ├── main.jsx                   # Entry point with RouterProvider
│   └── index.css                  # Custom modal scrollbar, focus rings & dark tokens
├── public/
│   ├── favicon.svg                # IEEE / CTS brand favicon
│   └── icons.svg                  # SVG sprite sheet
├── .env.example                   # Environment configuration template
├── tailwind.config.js             # Color palette & font definitions
├── vite.config.js                 # Vite & Vitest configuration
└── package.json
```

---

## 🚀 Getting Started

### 1. Installation
Navigate into the `frontend/` directory:
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration keys:
- `VITE_API_BASE_URL`: Base URL of the backend REST service (defaults to `http://localhost:5000`).
- `VITE_USE_MOCK`: Set to `false` for live backend & MongoDB persistence, or `true` for offline in-browser fixtures.

> **Tip:** You can also toggle between Mock Mode and Live API at runtime via the badge button in the top navigation bar.

### 3. Running Locally
Start the development server with HMR:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Automated Tests
Run all 65 unit and integration tests across 11 suites with Vitest:
```bash
npm test
```
To run tests in watch mode:
```bash
npm run test:watch
```

### 5. Production Build & Linting
Validate the production bundle:
```bash
npm run build
```
Run linter:
```bash
npm run lint
```

---

## 🎯 Themes Supported

1. **EdTech**: Digital classrooms, spaced repetition, peer skill-sharing
2. **FinTech**: Student micro-budgets, shared expense ledgers, payment UX
3. **HealthTech**: Campus wellness check-ins, posture reminders, medication alerts
4. **Sustainability**: E-waste tracking, food waste reduction, energy auditing
5. **Smart Cities**: Campus shuttle tracking, civic issue logging, urban mobility
6. **Accessibility**: High-contrast readers, screen-reader navigation, speech tools
7. **E-commerce**: Second-hand textbook barter, local artisan storefronts, checkout speed
8. **Open Innovation**: Decentralized collaboration, open-source metrics, developer tooling

---

## 📡 Backend Integration Contract

The frontend connects to Safiya's backend via `POST /api/challenges/generate`:
- **Request**:
  ```json
  { "theme": "FinTech" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "challenge-id",
      "theme": "FinTech",
      "generatedAt": "2026-10-26T12:00:00.000Z",
      "source": "ai",
      "challenge": {
        "problem": {
          "title": "Offline-First Peer Splitter",
          "statement": "Detailed statement..."
        },
        "restriction": {
          "name": "Zero External Server Sync",
          "rule": "Exact constraint..."
        },
        "resource": {
          "name": "IndexedDB API",
          "type": "browser-api",
          "guidance": "How it helps...",
          "docsUrl": "https://developer.mozilla.org/..."
        },
        "deliverable": "Working functional prototype description..."
      }
    }
  }
  ```
- **Source Labeling**:
  - `source === "ai"` renders as **AI Generated** (Cyan badge).
  - `source === "curated-fallback"` renders as **Backup Challenge** (Amber badge).
  - Fallbacks are never misrepresented as AI-generated.
