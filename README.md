# 🚀 Developer Command Center — Real-Time Engineering Productivity Platform

> An enterprise-grade, real-time developer telemetry platform featuring **AES-256-GCM authenticated cipher security**, **timing-safe HMAC SHA-256 webhook ingestion**, **Google Gemini 1.5 Flash AI Assistant**, **Automated AI PR Code Reviews**, and **CI/CD Pipeline Telemetry**.

---

## 🌟 Architectural Highlights (S-Tier Standards)

- 🛡️ **Hardware-Grade Cryptography:** GitHub access tokens stored with **AES-256-GCM** (with unique 96-bit IV and 128-bit authentication tag) rather than vulnerable legacy CBC mode.
- 🔐 **Timing-Safe Webhook Security:** Webhook signatures validated via `crypto.timingSafeEqual()` against raw request buffers to prevent timing side-channel attacks.
- 🔄 **Idempotent Ingestion & Replay Protection:** Deduplication of GitHub `X-GitHub-Delivery` GUIDs ensures zero double-processing or race conditions.
- ⚡ **Decoupled Real-Time Broadcasting:** WebSockets architecture decoupled from database transactions; room-scoped Socket.IO streams update connected UI clients without page refreshes.
- 🤖 **Context-Engineered Gemini AI Assistant:** Google Gemini 1.5 Flash SDK ingests sanitized SQL telemetry summaries (PR age, commit velocity, review bottlenecks) with zero sensitive credential exposure.
- 🔍 **Automated AI Code Review & Security Scanner:** Audits PR diffs for OWASP vulnerabilities, performance bottlenecks, and calculates quality scores with actionable guidance.
- 🚀 **CI/CD Pipeline & Deployment Suite:** Real-time tracking of releases, build pass rates, and Slack/Discord webhook alerts.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │       DEVELOPER COMMAND CENTER (REACT 18 + VITE)       │
                               │                                                        │
                               │  ⚡ Live Dashboard    🔀 PR Intelligence    🤖 Gemini  │
                               │  🚀 CI/CD Telemetry   🔔 Webhook Alerts     ⚙️ Settings│
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                   ┌───────────────────────┴────────────────────────┐
                                   │ HTTP (Axios / REST)   ⚡ WebSockets (Socket.IO)│
                                   ▼                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                               EXPRESS API & WEBSOCKET ENGINE                          │
│                                                                                       │
│  ├── 🔐 OAuth 2.0 & RBAC (CSRF State Cookies + Minimal JWT)                           │
│  ├── 🛡️ Webhook Verifier (HMAC SHA-256 with timingSafeEqual)                         │
│  ├── 🔄 Idempotent Sync Pipeline (AES-256-GCM Token Storage)                          │
│  ├── 🤖 AI Telemetry Engine (Google Gemini 1.5 Flash + Heuristics)                    │
│  └── 📡 Broadcast Service (activity_stream, repo:* rooms)                             │
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
     ┌──────────────────────────────┐              ┌──────────────────────────────┐
     │  NEON SERVERLESS POSTGRESQL  │              │   GOOGLE GEMINI 1.5 FLASH    │
     │         (Prisma ORM)         │              │                              │
     │                              │              │ ├── Automated PR Reviews     │
     │ ├── users                    │              │ ├── Security Vulnerabilities │
     │ ├── repositories             │              │ ├── Standup Summaries        │
     │ ├── pull_requests            │              │ └── Bottleneck Warnings      │
     │ ├── pr_reviews               │              └──────────────────────────────┘
     │ ├── issues                   │
     │ ├── commits                  │
     │ ├── deployments              │
     │ └── webhook_deliveries       │
     └──────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript 5, Tailwind CSS 3, Framer Motion, Recharts, Lucide React, Socket.IO Client |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, Cookie-Parser, Morgan, Socket.IO Server |
| **Database** | Neon Serverless PostgreSQL, Prisma ORM 6 |
| **Security** | AES-256-GCM Ciphers, HMAC SHA-256 (`timingSafeEqual`), Minimal JWT (`sub`, `role`), CSRF State Cookies |
| **AI / LLM** | Google Gemini 1.5 Flash SDK (`@google/generative-ai`) + Context Engineering Engine |
| **DevOps** | Docker, Docker Compose, Nginx Multi-Stage Containerization |

---

## 📡 API Reference

### 🔐 Authentication & Session
- `GET /api/auth/github` — Initiates GitHub OAuth 2.0 flow with CSRF state protection.
- `GET /api/auth/github/callback` — Validates state, exchanges code for access token, encrypts with AES-256-GCM.
- `POST /api/auth/dev-login` — 1-click instant local demo authentication for testing.
- `GET /api/auth/me` — Returns current authenticated user profile & RBAC role.
- `POST /api/auth/logout` — Clears secure session cookies.

### 📦 GitHub Telemetry & Sync
- `GET /api/github/repositories` — Lists synced repositories with star counts and issue metrics.
- `GET /api/github/pull-requests?state=OPEN` — Lists PRs with review status and age calculations.
- `GET /api/github/issues` — Lists issue tracking metrics and turnaround SLAs.
- `GET /api/github/commits` — Real-time stream of codebase commits and author contributions.
- `POST /api/github/sync/all` — Idempotent master sync for repositories, PRs, issues, and commits.
- `GET /api/github/activity` — Live telemetry activity logs.

### 🤖 AI Engineering Intelligence & Code Review
- `POST /api/ai/ask` — Natural language telemetry queries answered by Google Gemini 1.5 Flash.
- `GET /api/ai/quick-prompts` — Suggested executive engineering prompts.
- `POST /api/ai/review-pr/:prId` — Automated AI PR code review & OWASP security scan with quality score (0-100).
- `GET /api/ai/reviews/:prId` — Retrieves historical reviews and security audits for a PR.

### 🚀 CI/CD & Alert Integrations
- `GET /api/deployments` — CI/CD deployment history, active pipelines, and pass rates.
- `POST /api/deployments/trigger` — Trigger or simulate deployment releases.
- `POST /api/alerts/test` — Dispatches test notification to configured Slack/Discord incoming webhooks.

### 🛡️ Webhooks (HMAC Verified)
- `POST /api/webhooks/github` — Processes GitHub events (`pull_request`, `issues`, `push`) with delivery deduplication.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js >= 18.x
- PostgreSQL database (or Neon Serverless URL)

### 1. Installation
```bash
# Clone repository
git clone https://github.com/your-org/developer-command-center.git
cd developer-command-center

# Install all monorepo dependencies
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Environment Setup
Configure `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-256-bit-jwt-secret-key"
ENCRYPTION_KEY="your-32-character-encryption-key"
WEBHOOK_SECRET="your-github-webhook-secret"
GEMINI_API_KEY="AIzaSy..." # Optional: defaults to built-in high-fidelity analytics engine
```

### 3. Run Migrations & Build
```bash
cd server
npx prisma generate
npx prisma migrate dev
npm run build

cd ../client
npm run build
```

### 4. Start Development Servers
```bash
# Start backend server (Port 5000)
cd server && npm run dev

# Start frontend client (Port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` in your browser and click **"⚡ Instant Demo Login (Dev Mode)"**!

---

## 🐳 Docker Deployment

```bash
docker-compose up --build -d
```
Runs backend on `http://localhost:5000` and frontend on `http://localhost:5173`.
