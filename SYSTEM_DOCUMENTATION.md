# Aether System Documentation

This document provides a comprehensive overview of the Aether hosting platform, explaining the system architecture, core workflows, and the purpose of key files within the codebase.

## 1. System Architecture

Aether is a monorepo-based hosting platform composed of four main services:

*   **Web (`apps/web`)**: The frontend dashboard for users to manage projects.
*   **API (`apps/api`)**: The backend REST API that handles data persistence, authentication, and orchestration.
*   **Worker (`apps/worker`)**: A background service that consumes build jobs, builds source code, and deploys artifacts.
*   **Proxy (`apps/proxy`)**: A reverse proxy that routes incoming requests (e.g., `my-app.aether.localhost`) to the appropriate running service.

### Infrastructure Components
*   **PostgreSQL**: Primary database for storing user, project, and deployment data.
*   **Redis**: Used for the build queue (BullMQ) and real-time log streaming (Pub/Sub).

---

## 2. Core Workflows

### A. Project Creation
1.  **User Action**: User enters a GitHub repository URL in the Dashboard.
2.  **Frontend**: Sends a request to `POST /projects` (API).
3.  **API**:
    *   Creates a `Project` record in Postgres.
    *   Triggers a "root detection" job (optional) or waits for manual configuration.
4.  **Result**: Project appears in the dashboard, ready for configuration (Build Command, Output Dir, etc.).

### B. Deployment Pipeline
This is the heart of the system.
1.  **Trigger**: User clicks "Deploy" or a Webhook is received from GitHub.
2.  **API**:
    *   Creates a `Deployment` record with status `QUEUED`.
    *   Adds a job to the Redis `build-queue`.
3.  **Worker**:
    *   Picks up the job from Redis.
    *   **Clones**: Fetches the source code from GitHub.
    *   **Detects**: Identifies the project type (Node.js, Python, Docker, Static).
    *   **Installs**: Runs `npm install` or equivalent.
    *   **Builds**: Runs `npm run build` or equivalent.
    *   **Deploys**: Moves artifacts to the serving directory (`/deployments/<id>`).
    *   **Updates**: Sets Deployment status to `READY` in the DB.
4.  **Logs**: Throughout this process, logs are published to Redis and streamed to the Frontend via SSE (Server-Sent Events).

### C. Request Routing (The Proxy)
1.  **Incoming Request**: A request hits `http://my-project.aether.localhost:3005`.
2.  **Proxy Service**:
    *   Extracts the subdomain (`my-project`).
    *   Queries the DB (or cache) to find the active deployment for that project.
    *   **Static Sites**: Serves files directly from the deployment folder.
    *   **Node/Python Apps**: Proxies the request to the internal port where the app is running (managed by PM2 or Docker).

---

## 3. File Structure & Responsibilities

### 📂 apps/api (Backend)
The brain of the operation.
*   `src/server.ts`: Entry point. Sets up Express, middleware (CORS, JSON), and mounts routes.
*   `src/routes/projects.ts`: CRUD endpoints for Projects. Handles creating projects, updating settings, and triggering deployments.
*   `src/routes/webhooks.ts`: Handles incoming webhooks from GitHub to auto-trigger builds on push.
*   `src/routes/auth.ts`: Authentication logic (Login/Register).
*   `src/lib/prisma.ts`: Shared Prisma Client instance for database access.
*   `src/lib/redis.ts`: Shared Redis connection for queues and Pub/Sub.
*   `prisma/schema.prisma`: Database schema definition (Projects, Users, Deployments).

### 📂 apps/web (Frontend)
The user interface.
*   `src/App.tsx`: Main application component and Router setup.
*   `src/pages/Dashboard.tsx`: Lists all user projects and shows system status.
*   `src/pages/ProjectDetails.tsx`: The main control center for a project.
    *   **Overview Tab**: App preview and recent activity.
    *   **Logs Tab**: Real-time build logs viewer.
    *   **Settings Tab**: Configuration for Build commands, Env Vars, Custom Domains, etc.
*   `src/components/LogViewer.tsx`: Component that renders the terminal-like build logs.
*   `src/lib/api.ts`: Axios instance configured with base URL and interceptors.

### 📂 apps/worker (Build System)
The muscle. Runs in the background.
*   `src/index.ts`: Worker entry point. Connects to Redis `build-queue` and processes jobs.
*   `src/detect.ts`: Logic to analyze source code and determine the framework (Next.js, React, Python, etc.).
*   `src/install.ts`: Handles dependency installation (`npm install`, `pip install`).
*   `src/build.ts`: Executes the build command (`npm run build`).
*   `src/deploy.ts`: Finalizes the deployment. Moves files to the permanent location and updates the DB.

### 📂 apps/proxy (Routing)
The traffic controller.
*   `src/index.ts`: A lightweight HTTP server. It intercepts all requests to `*.aether.localhost`, looks up the project, and routes traffic to the correct static files or internal ports.

### 📂 Root
*   `package.json`: Monorepo configuration.
*   `turbo.json`: Configuration for TurboRepo to manage build pipelines and caching.
*   `docker-compose.yml`: Defines local infrastructure (Postgres, Redis) for development.
