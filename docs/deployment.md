# ForgeQuote — Deployment and Operations Guide

This guide provides complete instructions for running ForgeQuote locally via Docker Compose, running in local development mode without Docker, and deploying to cloud production platforms (Vercel, Render, and Neon PostgreSQL).

All terminal commands are tested and formatted for **Windows PowerShell** as well as standard POSIX shells.

---

## 1. Prerequisites & System Requirements

Before running ForgeQuote, ensure your system has the following installed:
* **Node.js**: `v20.0.0` or higher (verified on Node `v24.13.0`)
* **npm**: `v10.0.0` or higher (verified on npm `11.6.2`)
* **Docker Engine**: `v24.0.0` or higher (verified on Docker `29.8.0`)
* **Docker Compose**: `v2.20.0` or higher (verified on Docker Compose `v5.5.1`)
* **PostgreSQL**: `v16.0` (required only if running backend outside Docker)
* **OpenAI API Key**: Required for AI Extraction module (`OPENAI_API_KEY`)

---

## 2. Environment Variables Configuration

ForgeQuote uses environment variables for all configurations.
Create a `.env` file in the project root by copying `.env.example`:

```powershell
Copy-Item .env.example .env
```

### Environment Variables Reference Table
| Variable | Required | Default / Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | Yes | `4000` | Express backend listening port |
| `DATABASE_URL` | Yes | `postgresql://forgequote:changeme@postgres:5432/forgequote?schema=public` | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | *Random 32+ char string* | Used for cryptographic session signing and hashing |
| `SESSION_EXPIRY_HOURS` | Yes | `24` | Session lifetime in hours |
| `COOKIE_SECURE` | Yes | `false` (dev) / `true` (prod) | Enforce HTTPS-only cookie transmission |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS headers |
| `OPENAI_API_KEY` | Yes | `sk-proj-...` | OpenAI API key for structured intake |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Target OpenAI model |
| `APP_TIMEZONE` | No | `Asia/Kolkata` | Application timezone for due date and overdue logic |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 mins) | Rate limiting window |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per IP per window |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max login attempts per IP per window |
| `SEED_ESTIMATOR_PASSWORD` | No | `Estimator@123` | Password for seeded estimator account |
| `SEED_SALES_PASSWORD` | No | `Sales@123` | Password for seeded sales head account |
| `APPROVAL_THRESHOLD` | No | `2500000` | Approval threshold in INR (₹25,00,000) |
| `VITE_API_URL` | Yes (FE) | `http://localhost:4000` | Backend API base URL consumed by Vite client |

> [!CAUTION]
> Never commit `.env` files to git. Only commit `.env.example` with sanitized placeholders.

---

## 3. Docker Compose Local Deployment (Recommended)

ForgeQuote provides a production-grade multi-container Docker Compose stack containing:
1. `forgequote_postgres`: PostgreSQL 16 Alpine with persistent volume `pgdata`.
2. `forgequote_server`: Node.js Express backend API with health check.
3. `forgequote_client`: React + Vite frontend served via Vite / Nginx.

### 3.1 Single-Command Startup
To start the entire application stack:
```powershell
docker compose up --build -d
```

### 3.2 Verification & Health Checks
Check container status:
```powershell
docker compose ps
```
Both `server` and `postgres` containers have built-in health checks:
* PostgreSQL: `pg_isready -U forgequote -d forgequote`
* Express Server: HTTP check against `http://localhost:4000/api/v1/health`

### 3.3 Running Database Migrations & Seeds Inside Docker
Once containers are running and healthy:
```powershell
# Run Prisma Migrations
docker compose exec server npx prisma migrate deploy

# Seed Demonstration Data
docker compose exec server node prisma/seed.js
```

### 3.4 Accessing the Application
* **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
* **Backend Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
* **Database Connection**: `localhost:5432` (User: `forgequote`, Pass: `changeme`, DB: `forgequote`)

---

## 4. Docker Management Command Reference (PowerShell)

### Build Images
```powershell
docker compose build --no-cache
```

### Start Containers
```powershell
# Foreground with logs
docker compose up

# Background (detached)
docker compose up -d
```

### Stop Containers
```powershell
docker compose stop
```

### Restart Containers
```powershell
docker compose restart
```

### View Live Logs
```powershell
# All services
docker compose logs -f

# Backend server only
docker compose logs -f server

# Frontend client only
docker compose logs -f client

# Database only
docker compose logs -f postgres
```

### Complete Teardown & Volume Cleanup
```powershell
# Stop and remove containers and networks
docker compose down

# Stop and remove containers, networks, and persistent data volumes (RESET ALL DATA)
docker compose down -v
```

---

## 5. Local Development Setup (Without Docker)

If you prefer running Node.js processes directly on the host machine:

### 5.1 Start PostgreSQL
Ensure a local PostgreSQL instance is running on port 5432, or use a Dockerized PostgreSQL:
```powershell
docker run --name forgequote-db -e POSTGRES_USER=forgequote -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=forgequote -p 5432:5432 -d postgres:16-alpine
```

### 5.2 Server Setup & Initialization
```powershell
cd server

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init

# Seed database
node prisma/seed.js

# Start backend server with file watching
npm run dev
```
Backend will be live at `http://localhost:4000`.

### 5.3 Client Setup & Initialization
Open a second PowerShell terminal:
```powershell
cd client

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 6. Production Cloud Deployment Strategy

ForgeQuote is architected to deploy seamlessly across modern cloud infrastructure:
* **Frontend**: Vercel (Edge CDN + Static SPA hosting)
* **Backend**: Render (Docker Web Service)
* **Database**: Neon (Managed Serverless PostgreSQL)

```
        Production Network Architecture
┌─────────────────┐             ┌─────────────────┐
│     Vercel      │             │     Render      │
│  React SPA Edge │  HTTPS/API  │   Dockerized    │   TCP/SSL   ┌─────────────────┐
│  Custom Domain  ├────────────►│  Express API    ├────────────►│ Neon PostgreSQL │
│  forgequote.com │  SameSite   │  backend-url    │             │  Serverless DB  │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

### 6.1 Database Deployment: Neon PostgreSQL
1. Create a project on [Neon Console](https://neon.tech).
2. Provision a PostgreSQL 16 database named `forgequote`.
3. Obtain the pooled connection string:
   `postgresql://user:password@ep-project-pooler.us-east-2.aws.neon.tech/forgequote?sslmode=require`
4. Set this as `DATABASE_URL` in backend environment variables.

### 6.2 Backend Deployment: Render Docker Web Service
1. Create a **New Web Service** on Render.
2. Connect your GitHub repository.
3. Select **Docker** as the runtime environment:
   * **Root Directory**: `server`
   * **Dockerfile Path**: `Dockerfile`
   * **Docker Context**: `server`
4. Configure Environment Variables in Render:
   * `NODE_ENV`: `production`
   * `PORT`: `4000`
   * `DATABASE_URL`: *Neon connection string with `?sslmode=require`*
   * `SESSION_SECRET`: *Cryptographically secure 64-char string*
   * `COOKIE_SECURE`: `true`
   * `CORS_ORIGIN`: `https://your-app.vercel.app`
   * `OPENAI_API_KEY`: `sk-proj-...`
   * `APPROVAL_THRESHOLD`: `2500000`
5. Configure Health Check Path: `/api/v1/health`
6. Render will automatically build the multi-stage production Docker image and run non-root.

### 6.3 Frontend Deployment: Vercel SPA
1. Import your GitHub repository in the [Vercel Dashboard](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variables in Vercel:
   * `VITE_API_URL`: `https://your-render-backend.onrender.com`
5. Add a `vercel.json` rewrite rule to support React Router HTML5 pushState:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
6. Deploy.

---

## 7. Critical Production Security & Networking Considerations

### 7.1 Cross-Site Cookie & CORS Configuration
When hosting frontend (`vercel.app`) and backend (`onrender.com`) on separate domains:
1. **Cookie SameSite Policy**: Set `SameSite=None` and `Secure=true` in `server/src/modules/auth/auth.controller.js` so browsers include the session cookie across domains.
2. **CORS Allowlist**: Set `CORS_ORIGIN=https://your-frontend.vercel.app` and ensure `credentials: true` is enabled in Express CORS middleware.
3. **Public Suffix Caution**: Modern browsers restrict cross-domain cookies across top-level public suffixes (`.onrender.com` to `.vercel.app`). For production enterprise use, configure custom subdomains under a single root domain (e.g., `app.forgequote.com` and `api.forgequote.com`).

---

## 8. Troubleshooting & Diagnostics

### Problem 1: `connect ECONNREFUSED 127.0.0.1:5432`
* **Cause**: Backend server is attempting to connect to localhost instead of Docker service name `postgres`.
* **Fix**: In `.env`, ensure `DATABASE_URL` uses `@postgres:5432` inside Docker, or `@localhost:5432` when running locally outside Docker.

### Problem 2: `PrismaClientInitializationError: Can't reach database server`
* **Cause**: PostgreSQL container has not finished initializing tables when backend starts.
* **Fix**: Ensure Docker Compose `depends_on` uses `condition: service_healthy` on `postgres`.

### Problem 3: Session cookie not persisting in browser
* **Cause**: `COOKIE_SECURE=true` is set over unencrypted HTTP (localhost).
* **Fix**: Ensure `COOKIE_SECURE=false` in local development `.env`.

### Problem 4: OpenAI API Extraction returns 503
* **Cause**: Missing or invalid `OPENAI_API_KEY`.
* **Fix**: Check `server` logs (`docker compose logs server`). The system automatically falls back to manual data entry without crashing the application.
