# Chaos to Solution: Challenge Generator — Frontend

Modern, dark-themed hackathon challenge generator web application built for the **IEEE Computer Society** at **SJC Institute of Technology (SJCIT)**.

Participants select from eight hackathon themes and generate an AI-powered challenge containing four core pillars:
1. **01 — Problem Statement**: Practical real-world problem prompt achievable in ~3 hours.
2. **02 — Technical Restriction**: Architectural or technical constraint to test adaptability.
3. **03 — Prescribed Resource**: Recommended browser API, public API, dataset, or tool with verified documentation.
4. **04 — Expected Deliverable**: Concrete working prototype to demonstrate to judges.

After generating a challenge, teams can validate an Indian mobile number (+91) and trigger a pre-filled WhatsApp message containing all four challenge sections.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler & Dev Server**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) with custom dark design tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [JSDOM](https://github.com/jsdom/jsdom)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx             # Branding, IEEE badge, and Mock/Live API toggle
│   │   ├── Hero.jsx               # Hackathon premise and 4-pillar preview
│   │   ├── ThemeSelector.jsx      # Radiogroup selector for the 8 themes
│   │   ├── ThemeCard.jsx          # Individual interactive theme card
│   │   ├── GenerateButton.jsx     # Primary action button with loading spinner
│   │   ├── LoadingState.jsx       # Step-by-step progress indicator & skeleton cards
│   │   ├── ErrorState.jsx         # User-friendly error message & Retry action
│   │   ├── ResourceLink.jsx       # External doc link with secure target="_blank"
│   │   ├── ChallengeCard.jsx      # Numbered section card (01-04)
│   │   ├── ChallengeResults.jsx   # Results view with AI / Backup Challenge badges
│   │   └── WhatsAppShareForm.jsx  # +91 phone validation and click-to-chat generator
│   ├── data/
│   │   └── mockChallenges.js      # Curated fixtures across all 8 themes
│   ├── services/
│   │   ├── challengeApi.js        # API service with timeout, abort & error handling
│   │   └── mockChallengeApi.js    # Offline mock challenge generator
│   ├── utils/
│   │   ├── validateChallenge.js   # Schema validation enforcing data contract
│   │   └── whatsapp.js            # Indian number normalization & message builder
│   ├── test/
│   │   ├── setup.js               # Vitest environment & RTL cleanup setup
│   │   ├── validateChallenge.test.js
│   │   ├── whatsapp.test.js
│   │   ├── mockChallenges.test.js
│   │   ├── ThemeSelector.test.jsx
│   │   └── App.test.jsx
│   ├── App.jsx                    # Root state coordinator
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Tailwind directives, focus rings & dark tokens
├── public/
│   └── favicon.svg                # IEEE / CTS brand favicon
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
- `VITE_API_BASE_URL`: Base URL of Safiya's backend REST service (defaults to `http://localhost:5000`).
- `VITE_USE_MOCK`: Set to `true` (default) to run completely self-contained with offline mock data, or `false` to ping the live backend.

> **Tip:** You can also toggle between Mock Mode and Live API at runtime via the badge button in the top navigation bar.

### 3. Running Locally
Start the development server with HMR:
```bash
npm run dev
```
Open [http://localhost:5176](http://localhost:5176) in your browser.

### 4. Running Automated Tests
Run all unit and integration tests with Vitest:
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
