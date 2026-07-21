<p align="center">
  <img src="assets/banner.png" alt="CodeMapAI Banner" width="100%" />
</p>

<h1 align="center">CodeMapAI</h1>

<p align="center">
  <b>Next-Generation AI Developer Tooling & Interactive Codebase Visualization</b>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#devops--deployment">DevOps</a> •
  <a href="#testing">Testing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/OpenRouter-AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter AI" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Vitest-Tested-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## 🌟 Overview

**CodeMapAI** transforms complex repositories into interactive, visual dependency graphs and equips developers with agentic AI tools for code comprehension, security auditing, and automated refactoring.

Whether onboarding onto a legacy project or conducting code reviews, CodeMapAI allows you to explore code visually, trace multi-node data flows, perform security scans, and refactor code directly from the map interface.

---

## 🚀 Key Features

### 🗺️ Interactive Mind Map Engine
- **Visual Dependency Graph**: Renders GitHub repositories or local ZIP files as navigable React Flow node diagrams.
- **Complexity Heatmaps**: Color-coded nodes indicating file size, language depth, and architectural complexity.

### 🤖 OpenRouter AI & Agentic Developer Workflows
- **OpenRouter AI Integration**: Connects to OpenRouter's free and premium models with automatic `.env` configuration auto-loading.
- **Node Explanations**: Instant breakdown of what a file or function does, why it exists, and key developer insights.

### 🛡️ AI Security & Vulnerability Audits
- **Automated Security Scans**: Analyzes selected code nodes for SQL injections, XSS risks, hardcoded secrets, and memory leaks.
- **Security Score Card**: Produces an overall security posture score (0–100), severity-rated vulnerability lists, and line-by-line remediation steps.

### 🛠️ AI Code Refactoring & Optimization
- **Modernization Engine**: Rewrites selected code snippets for improved readability, modern syntax, and performance optimization.
- **Key Improvements Summary**: Generates concise bullet-point highlights of applied code improvements.

### 🔀 Multi-Node Flow Tracing
- **Dependency Flow**: Select 2 or more nodes to trace step-by-step data transformation and call paths across modules.

### 🗺️ Guided Onboarding Learning Paths
- **Reading Order Generator**: AI recommends the optimal file-by-file reading path for new contributors joining the project.

### 🎙️ Voice Controls & Speech Synthesis
- **Voice Commands & TTS**: Hands-free map navigation powered by ElevenLabs text-to-speech synthesis.

### 🔒 Enterprise HTTP Security & Rate Limiting
- **Helmet Security**: HTTP security headers protecting against XSS, clickjacking, and MIME sniffing.
- **Express Rate Limiting**: Global rate limiters (200 reqs/15 min) and dedicated AI rate limits (30 reqs/min) to prevent API abuse.

---

## 🏗️ Architecture & Workspace Structure

CodeMapAI is engineered as a high-performance **pnpm monorepo**:

```text
.
├── apps/
│   ├── api/                # Express backend API server (Security, AI, Parser)
│   └── web/                # React 19 + Vite + Tailwind CSS v4 frontend web app
├── packages/
│   ├── api-client/         # Generated TanStack Query client & fetch wrappers
│   ├── api-contracts/      # Zod request/response contracts & TypeScript schemas
│   ├── api-spec/           # OpenAPI specifications & Orval code generator
│   ├── database/           # Drizzle ORM setup & PostgreSQL schemas
│   ├── openai-react/       # Client-side AI utility hooks
│   └── openai-server/      # Server-side OpenRouter AI client configuration
├── assets/                 # Brand assets & documentation graphics
├── .github/workflows/      # Automated CI/CD pipeline (GitHub Actions)
├── Dockerfile              # Production multi-stage Docker build
└── docker-compose.yml      # Local orchestration (API + PostgreSQL)
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v10.32.1` or higher
- **PostgreSQL**: `v16.x` (or use the included `docker-compose`)

### 1. Clone & Install
```bash
git clone https://github.com/sandman-sh/codemap.git
cd codemap
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
PORT=3001
WEB_PORT=5174
BASE_PATH=/
LOG_LEVEL=info
DATABASE_URL=postgres://postgres:postgres@localhost:5432/codemapai

# OpenRouter AI Credentials
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
AI_CHAT_MODEL=openrouter/free

# Speech Synthesis (Optional)
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 3. Launch Development Servers
Start both backend API and frontend Vite servers concurrently:

```bash
# Terminal 1: Start API Service (Port 3001)
pnpm dev:api

# Terminal 2: Start Web Application (Port 5174)
pnpm dev:web
```

Visit `http://localhost:5174` in your browser.

---

## 📡 API Reference

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/health` | `GET` | Healthcheck endpoint returning server status |
| `/api/ai/explain-node` | `POST` | Generates AI breakdown and complexity for a selected node |
| `/api/ai/explain-flow` | `POST` | Traces step-by-step data flow across multiple nodes |
| `/api/ai/learning-path` | `POST` | Generates guided file reading order for onboarding |
| `/api/ai/ask` | `POST` | Answers contextual architectural questions about the repository |
| `/api/ai/security-audit` | `POST` | Audits code for vulnerabilities, secrets, and security score |
| `/api/ai/refactor` | `POST` | Refactors code for performance and modern best practices |
| `/api/ai/voice/speak` | `POST` | Synthesizes voice audio from text via ElevenLabs |

---

## 🐳 DevOps & Deployment

### Containerized Environment (Docker)
Build and run the entire stack locally using Docker Compose:

```bash
# Start PostgreSQL & API container
docker-compose up --build -d
```

### Production Docker Build
Build a production container for `apps/api`:

```bash
docker build -t codemapai-api:latest .
docker run -p 3001:3001 --env-file .env codemapai-api:latest
```

### CI/CD Pipeline
Every push and pull request triggers `.github/workflows/ci.yml` which executes:
1. `pnpm typecheck` (Monorepo-wide typechecking)
2. `pnpm test` (Vitest unit test suite)
3. `pnpm build` (Production compilation)

---

## 🧪 Testing

Execute automated Vitest unit tests:

```bash
# Run all tests in workspace
pnpm test

# Run typechecks across all packages
pnpm typecheck

# Build all packages & web assets
pnpm build
```

---

## 📄 License

This project is licensed under the MIT License.
