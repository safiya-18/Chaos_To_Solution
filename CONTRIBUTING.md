# Contributing to Chaos to Solution (CTS)

Thank you for your interest in contributing to **Chaos to Solution (CTS)**! CTS is an AI-powered hackathon challenge generation and live event management platform engineered for student and developer innovation events.

This guide outlines our development workflow, quality gates, and pull request procedures.

---

## 1. Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before engaging with the community.

---

## 2. Getting Started

### Prerequisites
- **Node.js**: v20.x, v22.x, or v24.x
- **npm**: v10.x or higher
- **MongoDB**: Local MongoDB instance (v6.0+) or MongoDB Atlas cluster URI for full persistence testing
- **Git**

### Local Setup
1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Chaos_To_Solution.git
   cd Chaos_To_Solution
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   cd ..
   ```

4. Configure local environment variables:
   - Copy `backend/.env.example` to `backend/.env` (if provided) or configure minimal keys:
     ```env
     PORT=5000
     HOST=0.0.0.0
     NODE_ENV=development
     CORS_ORIGIN=http://localhost:5173
     AI_PROVIDER=groq
     GROQ_MODEL=openai/gpt-oss-20b
     GEMINI_MODEL=gemini-3.8-flash
     AI_TIMEOUT_MS=4000
     EVENT_ID=cts-2026
     EVENT_TIMER_DURATION_MS=14400000
     ```

---

## 3. Branching & PR Workflow

We follow a **simple, trunk-based workflow** centered around `main` as the sole permanent branch:

1. **Keep branches short-lived**:
   Always branch off the latest `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   # or fix/your-bug-fix
   ```

2. **Develop and Test Locally**:
   Run both backend and frontend test suites before committing:
   ```bash
   # In /backend
   npm test

   # In /frontend
   npm test -- --run
   npm run build
   ```

3. **Commit Your Changes**:
   Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat(...)`: New feature or capability
   - `fix(...)`: Bug fix or edge-case remediation
   - `docs(...)`: Documentation updates
   - `refactor(...)`: Code cleanup without behavior change
   - `test(...)`: Adding or updating test suites
   - `chore(...)`: Tooling, dependency, or configuration updates

4. **Submit a Pull Request**:
   - Push your feature branch to your fork.
   - Open a Pull Request targeting `main`.
   - Fill out the PR template completely with test evidence.
   - Ensure GitHub Actions CI passes cleanly.

---

## 4. Coding Standards

- **Backend (Node.js/Express)**:
  - Clean modular architecture: separate routes, controllers/services, models, and utility helpers.
  - Strict input validation using explicit schemas.
  - Constant-time comparison (`crypto.timingSafeEqual`) for sensitive operator tokens.
  - Safe error handling without leaking stack traces or credentials in production.
- **Frontend (React + Vite + TailwindCSS)**:
  - Accessible, keyboard-navigable components with clear focus states.
  - Responsive layouts supporting desktop displays, tablets, and mobile viewports.
  - Zero sensitive state stored in `localStorage` or `sessionStorage`.

---

## 5. Security & Secret Protection

- **NEVER commit `.env` files, API keys, MongoDB URIs, or tokens**.
- All PRs are subject to automated secret scanning and CI validation.
- If you discover a security vulnerability, please follow our [Security Policy](./SECURITY.md) for responsible disclosure.

---

## 6. Proposing Features or Reporting Bugs

- **Reporting Bugs**: Use the [Bug Report Template](https://github.com/safiya-18/Chaos_To_Solution/issues/new?template=bug_report.md). Include detailed steps to reproduce, actual vs expected behavior, and environment details.
- **Proposing Enhancements**: Use the [Feature Request Template](https://github.com/safiya-18/Chaos_To_Solution/issues/new?template=feature_request.md). Explain the problem, proposed solution, and event benefit.
