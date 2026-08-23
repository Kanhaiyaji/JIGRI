# JIGRI — Online Compiler, Interpreter & Python Notebook Platform

**JIGRI** is a cloud-based, browser-only coding platform combining:
- ⚡ **Online Compiler/Interpreter** for 12+ languages with isolated Docker sandboxing
- 📓 **Python Notebook** with persistent REPL session, Monaco cells, and matplotlib/rich output
- 👤 **User Accounts & Dashboard** (JWT auth, saved projects, notebooks, execution history)
- 🌐 **Live Web & Markdown Preview** (real-time iframe and parsed markdown rendering)
- 🚀 **Real-time Feedback** via Socket.IO streaming

---

## 🏛 Architecture

```
Browser (React + Vite + Tailwind + Monaco Editor)
      │
      │ HTTP / Socket.IO
      ▼
Express API Server (Node.js + TypeScript)
      │
      ├── ExecutionQueue (concurrency limits & rate limiting)
      │      ▼
      │   Docker SDK (dockerode) ── spawns isolated containers
      │      ▼
      │   Language Runners (Python, Node, C++, Java, Go, Ruby, PHP, Rust, etc.)
      │
      └── RuntimeManager (Persistent Python Sessions)
             ▼
          REPL Bridge (interactive JSON-based stdin/stdout stream)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Docker Desktop or Docker Engine
- Node.js 18+ (for local development)

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Build Language Runner Images
Before executing code, build the sandboxed runner images:

**On Windows (PowerShell):**
```powershell
.\docker\build-runners.ps1
```

**On Linux / macOS:**
```bash
chmod +x ./docker/build-runners.sh
./docker/build-runners.sh
```

### 4. Start Application with Docker Compose
```bash
docker compose up --build
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 📦 Supported Languages & Runtimes

| Language | Version / Base Image | Execution Model |
|---|---|---|
| **Python** | Python 3.11 Alpine | Interpreted |
| **JavaScript** | Node.js 20 Alpine | Interpreted |
| **TypeScript** | ts-node / Node 20 | Interpreted / Transpiled |
| **C++** | GCC 13 (C++17, -O2) | Compiled |
| **C** | GCC 13 (C11, -O2) | Compiled |
| **Java** | OpenJDK 21 Alpine | Compiled |
| **Go** | Go 1.22 Alpine | Compiled |
| **Ruby** | Ruby 3.3 Alpine | Interpreted |
| **PHP** | PHP 8.3 CLI Alpine | Interpreted |
| **Rust** | Rust 1.78 Slim | Compiled |
| **Bash** | Bash Shell | Script |
| **HTML/CSS/JS** | Sandboxed IFrame Preview | Browser Native |
| **Markdown** | Real-time Markdown Renderer | Browser Native |
| **Python Notebook** | Python 3.11 + NumPy/Pandas/Matplotlib | Persistent REPL Session |

---

## 🛡 Security & Sandboxing

- **Network Isolation**: `NetworkMode: "none"` prevents outbound requests from sandbox containers.
- **Resource Constraints**: Strict memory limits (128MB–512MB) and CPU quotas (0.5 CPU) per run.
- **Capability Dropping**: Container privileges dropped via `CapDrop: ['ALL']` and `no-new-privileges`.
- **PID Limits**: Process fork bomb protection with `PidsLimit`.
- **Rate Limiting**: IP-based rate limiting on execution endpoints and authentication.

---

## 🛠 Local Development Setup

### Backend (Server)
```bash
cd server
npm install
npm run dev
```

### Frontend (Client)
```bash
cd client
npm install
npm run dev
```

---

## 📄 License
MIT License
