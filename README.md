# 🚀 CodeCraft — Open Source AI Web Application & Website Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Docker Compose](https://img.shields.io/badge/Docker-Supported-blue.svg)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)

**CodeCraft** is a powerful, self-hostable, open-source AI web application builder. Describe any web application, dashboard, landing page, or SaaS prototype in natural language, and CodeCraft will plan, generate code, edit workspace files, install dependencies, and run live interactive browser previews inside isolated Docker sandboxes.

---

## ✨ Key Features

- 🤖 **Multi-Provider LLM Integration:** Full support for **Google Gemini 3.5 Flash / 2.5 Flash** (with native thinking signature handling), **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, and **OpenRouter**.
- 🐳 **Isolated Docker Sandboxes:** Code is executed and previews are rendered inside secure, resource-limited Docker containers.
- ⚡ **Live Interactive Preview:** Real-time hot-reloading dev server rendered directly within an iframe in the CodeCraft IDE.
- 🔄 **Git Checkpoint Versioning:** Automatic git snapshots before and after agent modifications allow instant zero-data-loss rollbacks.
- 🔐 **Enterprise-Grade Security:**
  - Fastify Authentication Guard protecting all backend APIs.
  - AES-256-GCM encryption at rest for stored LLM API keys.
  - Path traversal sanitization & container capability dropping (`CapDrop: ALL`).
  - Redaction of sensitive credentials in telemetry and SSE activity streams.
- 📦 **Monorepo Architecture:** Built with Turborepo, Next.js 16, Fastify, Drizzle ORM, and Tailwind CSS.

---

## 🏗️ Architecture Overview

```
CodeCraft Monorepo
├── apps/
│   ├── web/          # Next.js 16 Frontend IDE (Code editor, chat UI, live iframe preview)
│   └── server/       # Fastify Backend API (Authentication, project management, SSE log stream)
└── packages/
    ├── agent/        # AI Agent orchestration engine & tool execution (file write, edit, exec)
    ├── ai/           # Unified LLM provider layer (Gemini, OpenAI, Anthropic, OpenRouter)
    ├── sandbox/      # Docker container lifecycle & runner manager
    ├── db/           # Drizzle ORM + SQLite schema with AES-256 key encryption
    └── shared/       # Shared TypeScript schemas (Zod) and secret sanitizers
```

---

## 💻 Local Quickstart (Development)

### Prerequisites
- **Node.js:** v20.x or higher
- **pnpm:** v9.x or higher (`npm install -g pnpm`)
- **Docker & Docker Compose:** Installed and running

### 1. Clone the repository & Install dependencies
```bash
git clone https://github.com/your-username/codecraft.git
cd codecraft
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Add your preferred `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY` to `.env`, or configure them interactively via the onboarding UI.)*

### 3. Start Development Services via Docker Compose
```bash
docker compose up -d
```

Access the UI at **http://localhost:3000**. On first access, complete the 1-minute onboarding wizard to set up your Super Admin credentials and select your AI provider.

---

## 🌐 Setting Up CodeCraft on a VPS (Production / Self-Hosting Guide)

This guide walks you through deploying CodeCraft on a Virtual Private Server (VPS) such as **DigitalOcean, Hetzner, AWS EC2, Linode, or Vultr** running **Ubuntu 22.04 / 24.04 LTS**.

### Recommended VPS Specifications
- **CPU:** 2+ Cores (4 Cores recommended for faster Vite build previews)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 25GB+ SSD / NVMe
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS

---

### Step 1: VPS Initial Server Setup & Docker Installation

Log into your VPS via SSH:
```bash
ssh root@your-vps-ip
```

Update system packages and install Docker & Docker Compose:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install prerequisite tools
sudo apt install -y curl git ufw ca-certificates gnupg

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify Docker installation
docker --version
docker compose version
```

---

### Step 2: Clone CodeCraft Repository

Create a directory for CodeCraft and clone the codebase:
```bash
cd /opt
sudo git clone https://github.com/your-username/codecraft.git
cd codecraft
```

---

### Step 3: Configure Production Environment Variables

Create the production `.env` file:
```bash
cp .env.example .env
nano .env
```

Set the following critical production environment variables in `.env`:

```env
# Application Host & Port Settings
NODE_ENV=production
PORT=3001
PUBLIC_HOST=yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Security & Encryption Secrets (Generate random 32+ char strings)
JWT_SECRET=replace_with_a_random_secure_secret_string_32_chars
ENCRYPTION_KEY=replace_with_another_random_secret_key_32_chars
ADMIN_DEFAULT_PASSWORD=YourSecureAdminPassword123!

# Optional: Default AI Provider API Keys (Can also be set in web UI onboarding)
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
# OPENROUTER_API_KEY=sk-or-v1-YourOpenRouterKeyHere
```

> 🔑 **Tip:** Generate secure secret strings using `openssl rand -hex 32`.

---

### Step 4: Configure Firewall (UFW)

Secure your server by allowing SSH, HTTP, and HTTPS ports:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Step 5: Reverse Proxy Setup (Nginx + Let's Encrypt SSL)

Install Nginx and Certbot for automatic HTTPS certificates:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create an Nginx configuration file for CodeCraft:
```bash
sudo nano /etc/nginx/sites-available/codecraft
```

Paste the following Nginx reverse proxy configuration (replace `yourdomain.com` with your real domain or IP):

```nginx
server {
    server_name yourdomain.com;

    # Web UI Proxy (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Server Proxy (Fastify + Server-Sent Events stream)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Disable buffering for live Server-Sent Events (SSE) AI logs
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

Enable the Nginx site and test the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/codecraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain a free Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

### Step 6: Launch CodeCraft via Docker Compose

Start the CodeCraft application stack in detached mode:
```bash
docker compose up -d --build
```

Verify that the containers are healthy and running:
```bash
docker compose ps
```

You should see `codecraft-app` and `codecraft-inngest` running smoothly.

---

### Step 7: Complete Web Onboarding

1. Open **`https://yourdomain.com`** in your browser.
2. Complete the onboarding wizard:
   - Create your Super Admin name, email, and password.
   - Choose your preferred AI Provider (**Google Gemini 3.5 / 2.5**, **OpenRouter**, **OpenAI**, or **Anthropic**).
   - Enter your API Key.
3. Start building web applications instantly!

---

## 🛠️ Maintenance & Useful Commands

### Viewing Logs
```bash
# View real-time container logs
docker compose logs -f codecraft

# View backend API logs
docker compose exec codecraft tail -f /app/apps/server/logs/app.log
```

### Updating CodeCraft to Latest Version
```bash
cd /opt/codecraft
git pull origin main
docker compose up -d --build
```

### Backing Up SQLite Database & Workspaces
```bash
# Backup SQLite database
cp ./data/db.sqlite ./data/db.sqlite.bak-$(date +%F)

# Backup generated project workspaces
tar -czvf workspace-backup-$(date +%F).tar.gz ./data/workspaces/
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
