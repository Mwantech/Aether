# Aether - Mini Hosting Platform

Aether is a self-hosted platform for deploying applications to a Kubernetes cluster (k3s) using Git-based workflows.

## Quick Start (POC)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- k3s (or any K8s cluster)
- `kubectl` configured

### 1. Start Infrastructure
```bash
cd infra
docker-compose up -d
```
This starts Postgres, Redis, Docker Registry (localhost:32000), and MinIO.

### 2. Install Dependencies
```bash
npm install
cd apps/web && npm install
```

### 3. Run Development Servers
You can run all services concurrently:

**Backend (API):**
```bash
cd apps/api
npm run dev
```

**Worker:**
```bash
cd apps/worker
npm run dev
```

**Frontend:**
```bash
cd apps/web
npm run dev
```
Access the dashboard at [http://localhost:5173](http://localhost:5173).

### 4. Local DNS Setup (Optional)
To access deployed apps via custom domains locally, add entries to your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):
```
127.0.0.1 aether.local
127.0.0.1 myapp.local
```

### 5. Trigger a Build (Manual POC)
Since we don't have a live Git webhook in local dev, you can trigger a build via API:

```bash
# Register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@aether.local\", \"password\":\"password123\"}"

# Login (get token)
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@aether.local\", \"password\":\"password123\"}"

# Create Project (replace TOKEN)
curl -X POST http://localhost:3000/projects -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"name\":\"demo-app\", \"repoUrl\":\"https://github.com/example/demo-app.git\"}"

# Deploy
curl -X POST http://localhost:3000/projects/PROJECT_ID/deploy -H "Authorization: Bearer TOKEN"
```

## Architecture
- **API**: Node.js/Express + Prisma + Postgres
- **Worker**: BullMQ + Docker/BuildKit
- **Web**: React + Vite + Tailwind
