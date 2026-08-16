# 🚀 Developer Command Center — Real-Time Engineering Productivity & Telemetry SaaS

<div align="center">

[![Live Frontend](https://img.shields.io/badge/Live%20Frontend-Vercel%20App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://developer-command-center-five.vercel.app)
[![Live Backend](https://img.shields.io/badge/Live%20Backend-Render%20API-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://developer-command-center-api.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Google%20Gemini%201.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**A modern, enterprise-grade Engineering Intelligence & Telemetry Platform built for high-velocity software teams.**

[🌐 Explore Live App](https://developer-command-center-five.vercel.app) • [📖 API Reference](#-api-reference) • [🏛️ Architecture](#-system-architecture)

</div>

---

## 🌟 Executive Summary

**Developer Command Center** provides engineering leaders and developers with real-time visibility into software delivery performance, AI-powered automated code reviews, DORA metrics calculation, GitHub telemetry ingestion, and CI/CD pipelines.

Built with **React 18 + Vite**, **Node.js/Express with TypeScript**, **Prisma ORM with Neon Serverless PostgreSQL**, and **Google Gemini 1.5 Flash AI**.

---

## 🛡️ Enterprise Architectural Highlights

- 🔐 **Multi-Provider Authentication Suite:**
  - 🔴 **Google OAuth 2.0** with verified profiles and automatic account linking.
  - 🐙 **GitHub OAuth 2.0** with AES-256-GCM encrypted token storage.
  - ✉️ **Email / Password Authentication** with bcrypt (cost factor 12) and strict Zod validation.
  - ⚡ **Dual-Layer Session Management** (HttpOnly SameSite=None secure cookies + Bearer token fallback for cross-domain stability).
  - 🚀 **1-Click Portfolio Demo Access** for recruiters and visitors.
- 📊 **Real DORA Metrics Engine:** Computes Deployment Frequency, Lead Time for Changes, Change Failure Rate (CFR), and Mean Time to Recovery (MTTR) from live database records with 7-day and 30-day historical trend curves.
- 🤖 **Automated AI PR Code Reviews:** Ingests live GitHub pull request diffs and performs automated OWASP security scans, performance audits, and calculates code quality scores (0-100) via Gemini 1.5 Flash.
- ⚡ **Timing-Safe HMAC-SHA256 Webhook Ingestion:** Replay-protected with GUID deduplication and timing-attack immune signature validation.
- ⌨️ **Global Command Palette (`Cmd + K` / `Ctrl + K`):** Instant keyboard-first navigation across all 10 platform modules.
- 🔄 **Live Sync Freshness Telemetry:** Dynamically tracks repository sync timestamps with visual health indicators (`Synced`, `Stale`).

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER — REACT 18 + VITE + TAILWIND CSS                     │
│                                                                                        │
│  ⚡ DORA Analytics    🔀 PR Intelligence    🤖 Gemini AI Review    🚀 CI/CD Telemetry  │
│  ⌨️ Command Palette   📊 Team Workspaces    🔔 Live Alerts         ⚙️ Settings         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │ HTTPS REST (Axios)    ⚡ WebSockets (Socket.IO)│
                    ▼                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        API & TELEMETRY ENGINE — NODE.JS / EXPRESS                      │
│                                                                                        │
│  ├── 🔐 Auth & RBAC (Google OAuth, GitHub OAuth, bcrypt-12, JWT + HttpOnly Cookies)    │
│  ├── 🛡️ HMAC-SHA256 Webhook Pipeline (Deduplicated Replay Protection)                 │
│  ├── 📊 Real DORA Metric Computation Engine (Daily historical trends)                  │
│  ├── 🤖 Gemini 1.5 Flash AI Assistant (Sanitized diff analysis & prompt synthesis)     │
│  └── 📡 Activity Broadcasting Hub (Socket.IO rooms)                                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
      ┌──────────────────────────────┐              ┌──────────────────────────────┐
      │  NEON SERVERLESS POSTGRESQL  │              │   GOOGLE GEMINI 1.5 FLASH    │
      │         (Prisma ORM)         │              │                              │
      │                              │              │ ├── Automated PR Reviews     │
      │ ├── users & credentials      │              │ ├── OWASP Security Audits    │
      │ ├── repositories             │              │ ├── Standup Summaries        │
      │ ├── pull_requests & reviews  │              │ └── Bottleneck Warnings      │
      │ ├── issues & commits         │              └──────────────────────────────┘
      │ ├── deployments & logs       │
      │ └── webhook_deliveries       │
      └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript 5 | Component architecture, custom hooks, Lucide icons |
| **Styling & UI** | Vanilla CSS + Tailwind CSS | Obsidian dark theme, cyber mesh gradients, Glassmorphism |
| **Charts** | Recharts | DORA trend line charts, velocity area graphs, score gauges |
| **Backend** | Node.js, Express, TypeScript | REST API, Zod schemas, rate limiters, security middlewares |
| **Database** | Neon Serverless PostgreSQL, Prisma ORM | Relational data models, indexing, cascades |
| **Authentication** | Google OAuth 2.0, GitHub OAuth, bcrypt | AES-256-GCM cipher, JWT, HttpOnly SameSite=None cookies |
| **AI / LLM** | Google Gemini 1.5 Flash SDK | Automated PR diff reviews, security audit reports |
| **Deployment** | Vercel (Frontend), Render (Backend) | Continuous Deployment, Automated Git triggers |

---

## 📡 API Reference

### 🔐 Authentication & Session
- `GET /api/auth/google` — Initiates Google OAuth 2.0 consent flow.
- `GET /api/auth/google/callback` — Handles Google code exchange, upserts user, links account.
- `GET /api/auth/github` — Initiates GitHub OAuth 2.0 flow.
- `GET /api/auth/github/callback` — Validates state, exchanges token, encrypts with AES-256-GCM.
- `POST /api/auth/register` — Registers new user with bcrypt-12 password hashing.
- `POST /api/auth/login` — Authenticates user via email/password.
- `POST /api/auth/dev-login` — 1-Click instant demo access for guests/portfolio visitors.
- `GET /api/auth/me` — Returns authenticated user profile and RBAC role.
- `POST /api/auth/logout` — Clears authentication session.

### 📊 DORA Metrics & Telemetry
- `GET /api/dora/metrics` — Calculates live DORA 4 metrics and historical 7/30-day trend lines.
- `GET /api/github/repositories` — Lists synchronized repositories with sync freshness badges.
- `GET /api/github/pull-requests` — Live PR stream with author, review state, and age SLA.
- `GET /api/github/issues` — Live issue tracking and resolution SLA metrics.
- `GET /api/github/commits` — Commit stream and velocity telemetry.
- `POST /api/github/sync/all` — Idempotent master sync with GitHub REST API.

### 🤖 AI Engineering Intelligence & Code Review
- `POST /api/ai/ask` — Interactive engineering telemetry queries via Gemini 1.5 Flash.
- `POST /api/ai/review-pr/:prId` — Automated PR diff review, security alerts, and score generation.
- `GET /api/ai/reviews/:prId` — Fetches historical AI reviews for a pull request.

### 🚀 CI/CD & Deployments
- `GET /api/deployments` — CI/CD deployment history and build pass rates.
- `POST /api/deployments/trigger` — Simulates or executes pipeline deployment releases.

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/alokchoudhary885-coder/Developer-Command-Center-.git
cd Developer-Command-Center-

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="c3f190a6e4d29381c0ab5827e892ef61203498ab5671239845cdfa1234567890"

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/auth/github/callback"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# Optional Gemini Key
GEMINI_API_KEY="your_gemini_api_key"
DEMO_LOGIN_ENABLED="true"
```

### 3. Initialize Database & Run
```bash
# In server directory:
npx prisma generate
npm run dev

# In client directory (separate terminal):
npm run dev
```

Visit `http://localhost:5173` to test locally!

---

## 💼 Resume & Portfolio Highlights

> **Developer Command Center — Full-Stack Engineering Productivity SaaS**  
> *TypeScript, React 18, Node.js, Express, PostgreSQL, Prisma, Google Gemini AI, OAuth 2.0, WebSockets*
> - Engineered an enterprise telemetry platform supporting **Multi-Provider SSO (Google, GitHub, Email/Password)** with **AES-256-GCM** encryption and dual-layer cross-domain cookie authentication.
> - Built a real-time **DORA Metrics Computation Engine** aggregating deployment frequency, lead time, CFR, and MTTR with 7-day and 30-day historical trend telemetry.
> - Integrated **Google Gemini 1.5 Flash AI** to conduct automated PR code reviews on unified diffs, surfacing OWASP security vulnerabilities and calculating code quality scores.
> - Deployed resilient full-stack architecture on **Vercel** and **Render** backed by **Neon Serverless PostgreSQL**.

---

<div align="center">
  <sub>Built with ❤️ by Alok Kumar • Enterprise Ready</sub>
</div>
