<p align="center">
  <img src="assets/banner.png" alt="CodeMapAI Banner" width="100%" />
</p>

<h1 align="center">CodeMapAI</h1>

<p align="center">
  <b>Next-Generation AI Developer Tooling & Interactive Codebase Visualization</b>
</p>

<p align="center">
  <a href="https://github.com/sandman-sh/codemap.git"><b>📦 Repository URL: https://github.com/sandman-sh/codemap.git</b></a>
</p>

<p align="center">
  <a href="#built-with-codex-ide-gpt-55--gpt-56">Built with Codex (GPT-5.5 & 5.6)</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#devops--deployment">DevOps</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built%20With-Codex%20IDE-8A2BE2?style=for-the-badge&logo=openai&logoColor=white" alt="Codex IDE" />
  <img src="https://img.shields.io/badge/AI%20Models-GPT--5.5%20%7C%20GPT--5.6-00A67E?style=for-the-badge&logo=openai&logoColor=white" alt="GPT-5.5 and GPT-5.6" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 🌟 Overview

**CodeMapAI** transforms complex repositories into interactive, visual dependency graphs and equips developers with agentic AI tools for code comprehension, security auditing, and automated refactoring.

Built using the **Codex AI coding editor**, CodeMapAI allows developers to explore code visually, run automated vulnerability scans, trace multi-node data flows, and refactor code directly from the visual map interface.

---

## 🧠 Built with Codex IDE (GPT-5.5 & GPT-5.6)

This repository was crafted using the **Codex AI Coding Editor**, leveraging a two-phase AI model workflow:

### 1. 🏗️ Phase 1: Project Scaffolding & Core Architecture (GPT-5.5 in Codex)
- **Model Selected**: `GPT-5.5`
- **What Was Built**:
  - We started the project inside the **Codex editor** selecting the **GPT-5.5** model to design the pnpm monorepo structure (`apps/api`, `apps/web`, `packages/database`, `packages/openai-server`, `packages/api-client`).
  - Generated the **React 19 + React Flow** visual node graph canvas, Zustand state management store, and interactive side panel components.
  - Implemented initial repository parsing logic (cloning GitHub repos and extracting directory structure AST nodes).

### 2. 🐞 Phase 2: Bug Fixing, Refactoring & Security Audit (GPT-5.6 in Codex)
- **Model Selected**: `GPT-5.6`
- **What Was Built**:
  - We switched to the **GPT-5.6** model inside Codex to perform deep bug fixing, cross-platform build resolution (Linux musl Rollup Docker dependencies), and error handling logic.
  - Implemented the **AI Security Audit Scanner (`/api/ai/security-audit`)** to detect SQL injections, XSS vulnerabilities, hardcoded secrets, and memory leaks with security score cards ($S \in [0, 100]$).
  - Engineered the **AI Code Refactoring Engine (`/api/ai/refactor`)** to modernize legacy code snippets into type-safe TypeScript.
  - Authored the OpenRouter AI completion fallback wrapper to handle model JSON schema constraints gracefully.

---

## 🚀 Key Features

### 🗺️ Interactive Mind Map Engine
- **Visual Dependency Graph**: Renders GitHub repositories or local ZIP files as navigable React Flow node diagrams.
- **Complexity Heatmaps**: Color-coded nodes indicating file size, language depth, and architectural complexity.

### 🤖 Agentic AI Developer Workflows
- **OpenRouter & AI Integration**: Connects to OpenRouter AI endpoints with dynamic `.env` auto-loading.
- **Node Explanations**: Instant breakdown of what a file or function does, why it exists, and key developer insights.

### 🛡️ AI Security & Vulnerability Audits
- **Automated Security Scans**: Analyzes selected code nodes for SQL injections, XSS risks, hardcoded secrets, and memory leaks.
- **Security Score Card**: Produces an overall security posture score (0–100), severity-rated vulnerability lists, and line-by-line remediation steps.

### 🛠️ AI Code Refactoring & Optimization
- **Modernization Engine**: Rewrites selected code snippets for improved readability, modern syntax, and performance optimization.
- **Key Improvements Summary**: Generates concise bullet-point highlights of applied code improvements.

### 🔀 Multi-Node Flow Tracing
- **Dependency Flow**: Select 2 or more nodes to trace step-by-step data transformation and call paths across modules.

---

## 🏗️ Architecture & Workspace Structure

```text
.
├── apps/
│   ├── api/                # Express backend API server (Security, AI, Parser)
│   └── web/                # React 19 + Vite + Tailwind CSS v4 frontend web app
├── packages/
│   ├── api-client/         # Generated TanStack Query client & fetch wrappers
│   ├── api-contracts/      # Zod request/response contracts & TypeScript schemas
│   ├── api-spec/           # OpenAPI specifications & Orval code generator
│   ├── database/           # Drizzle ORM setup & Supabase PostgreSQL schemas
│   ├── openai-react/       # Client-side AI utility hooks
│   └── openai-server/      # Server-side OpenRouter client configuration
├── api/                    # Vercel serverless API entry point
├── assets/                 # Brand assets & documentation graphics
├── .github/workflows/      # Automated CI/CD pipeline (GitHub Actions)
├── Dockerfile              # Production multi-stage Docker build
├── docker-compose.yml      # Local orchestration (API + PostgreSQL)
└── vercel.json             # Vercel deployment configuration
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `v20.x` or higher
- **pnpm**: `v10.32.1` or higher

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

# Database & Supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter Credentials
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=your-openrouter-api-key
AI_CHAT_MODEL=openrouter/free
OPENROUTER_HTTP_REFERER=http://localhost:5174
OPENROUTER_APP_TITLE=CodeMapAI
```

### 3. Launch Development Servers
Start both backend API and frontend Vite servers concurrently:

```bash
pnpm dev
```

Visit `http://localhost:5174` in your browser.

---

## 📡 API Reference

| Endpoint | Method | Powered By | Description |
| --- | --- | --- | --- |
| `/api/health` | `GET` | System | Healthcheck endpoint returning server status |
| `/api/ai/explain-node` | `POST` | AI Engine | Generates AI breakdown and complexity for a selected node |
| `/api/ai/explain-flow` | `POST` | AI Engine | Traces step-by-step data flow across multiple nodes |
| `/api/ai/learning-path` | `POST` | AI Engine | Generates guided file reading order for onboarding |
| `/api/ai/ask` | `POST` | AI Engine | Answers contextual architectural questions about the repository |
| `/api/ai/security-audit` | `POST` | AI Engine | Audits code for vulnerabilities, secrets, and security score |
| `/api/ai/refactor` | `POST` | AI Engine | Refactors code for performance and modern best practices |
| `/api/ai/voice/speak` | `POST` | ElevenLabs | Synthesizes voice audio from text |

---

## 🐳 DevOps & Deployment

### Vercel (Frontend Deployment)
The frontend web app is configured for instant deployment on Vercel via [vercel.json](file:///e:/project/codemap/vercel.json):
- **Framework**: `Vite`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_URL=https://your-backend.onrender.com`

### Render / Railway (Backend API Deployment)
The backend container is built using the multi-stage [Dockerfile](file:///e:/project/codemap/Dockerfile):
```bash
docker build -t codemapai-api:latest .
docker run -p 3001:3001 --env-file .env codemapai-api:latest
```

---

## 🧪 Testing & Verification

Execute automated Vitest unit tests and workspace typechecks:

```bash
# Run unit tests
pnpm test

# Run monorepo typecheck
pnpm typecheck

# Build workspace packages & apps
pnpm build
```

---

## 📄 License

This project is licensed under the MIT License.
