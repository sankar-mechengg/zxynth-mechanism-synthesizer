# Zxynth Deployment Guide

## Architecture

- **Frontend** → Vercel (static site + SPA routing)
- **Backend API** → Railway (FastAPI container)
- **Celery Worker** → Railway (separate service, same codebase)
- **Redis** → Railway (managed Redis plugin)

---

## 1. Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (vercel.com)
- GitHub repository with the Zxynth code

### Steps

1. **Connect repository to Vercel:**
   - Go to vercel.com → New Project → Import Git Repository
   - Select the zxynth repository

2. **Configure build settings:**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

3. **Set environment variables:**
   ```
   VITE_API_URL = https://your-backend.up.railway.app/api
   ```

4. **Deploy:**
   - Vercel auto-deploys on every push to main
   - SPA routing handled by `vercel.json` rewrites

5. **Custom domain (optional):**
   - Vercel → Project Settings → Domains → Add `zxynth.xyz`
   - Configure DNS: CNAME record pointing to `cname.vercel-dns.com`

### Verify
- Visit `https://zxynth.vercel.app` (or your custom domain)
- Landing page should load with blueprint grid background
- Check browser console for API connection errors

---

## 2. Backend Deployment (Railway)

### Prerequisites
- Railway account (railway.app)
- Railway CLI (optional): `npm install -g @railway/cli`

### Step 2a: Create Redis Service

1. **Railway Dashboard → New Project → Add Service → Database → Redis**
2. Note the internal `REDIS_URL` (format: `redis://default:password@host:port`)
3. Redis is available internally to other Railway services

### Step 2b: Deploy FastAPI Service

1. **Add Service → GitHub Repo → select zxynth**

2. **Configure:**
   ```
   Root Directory: backend
   Builder: Dockerfile
   ```

3. **Environment variables:**
   ```
   REDIS_URL = redis://default:xxx@redis.railway.internal:6379
   CORS_ORIGINS = https://zxynth.vercel.app,https://zxynth.xyz
   ENVIRONMENT = production
   JOB_TIMEOUT = 120
   PORT = 8000
   ```

4. **Start command** (set in railway.toml or service settings):
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Generate domain:**
   - Railway → Service → Settings → Networking → Generate Domain
   - You'll get: `https://zxynth-backend-production.up.railway.app`

### Step 2c: Deploy Celery Worker Service

1. **Add another service from the same repo**

2. **Configure:**
   ```
   Root Directory: backend
   Builder: Dockerfile
   ```

3. **Same environment variables as the API service** (copy REDIS_URL, etc.)

4. **Override start command:**
   ```
   celery -A app.core.celery_app worker --loglevel=info --concurrency=2 -Q synthesis,export
   ```

5. **No networking needed** — the worker doesn't serve HTTP

### Verify Backend

```bash
# Health check
curl https://your-backend.up.railway.app/api/health

# Expected response:
# {"status":"healthy","api":true,"redis":true,"environment":"production"}
```

---

## 3. Local Development

### Option A: Docker Compose (recommended)

```bash
cd backend
docker-compose up --build
```

This starts all 3 services:
- FastAPI on `localhost:8000`
- Celery worker (connected to Redis)
- Redis on `localhost:6379`

In another terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `localhost:3000` with Vite proxy forwarding `/api` to `localhost:8000`.

### Option B: Manual Setup

**Terminal 1 — Redis:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Terminal 2 — FastAPI:**
```bash
cd backend
pip install -r requirements.txt
export REDIS_URL=redis://localhost:6379/0
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Celery Worker:**
```bash
cd backend
export REDIS_URL=redis://localhost:6379/0
celery -A app.core.celery_app worker --loglevel=info --concurrency=2
```

**Terminal 4 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Environment Variables Reference

### Frontend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `/api` (proxied) | Backend API base URL |

### Backend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | `redis://localhost:6379/0` | Redis connection string |
| `CORS_ORIGINS` | Yes | `http://localhost:3000` | Comma-separated allowed origins |
| `ENVIRONMENT` | No | `development` | `development` or `production` |
| `JOB_TIMEOUT` | No | `120` | Max synthesis job duration (seconds) |
| `MAX_CONCURRENCY` | No | `2` | Celery worker concurrency |

---

## 5. Monitoring

### Railway Logs
- Railway Dashboard → Service → Logs tab
- Filter by: `[Zxynth]` prefix for application logs

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli -u $REDIS_URL

# Check active jobs
KEYS job:*

# Check specific job
HGETALL job:a1b2c3d4e5f6

# Monitor real-time
MONITOR
```

### Health Checks
- API: `GET /api/health` — returns Redis connectivity status
- Queue: `GET /api/queue/status` — returns job counts by status

---

## 6. Troubleshooting

| Issue | Solution |
|---|---|
| Frontend can't reach backend | Check `VITE_API_URL` matches Railway domain; check CORS_ORIGINS includes frontend URL |
| Synthesis jobs stuck in "queued" | Verify Celery worker is running; check Redis connectivity |
| Jobs timing out | Increase `JOB_TIMEOUT`; reduce `maxGenerations` |
| Redis connection refused | Check `REDIS_URL` format; ensure Redis service is running |
| PDF export fails | Ensure ReportLab fonts are installed in Docker image |
| GIF export slow | Reduce frame count / resolution in export options |

---

## 7. Estimated Costs (Railway)

| Service | Plan | Est. Monthly |
|---|---|---|
| FastAPI (API) | Starter | ~$5 |
| Celery Worker | Starter | ~$5 |
| Redis | Plugin | ~$5 |
| **Total** | | **~$15/mo** |

Vercel frontend is free on the Hobby plan.

---

*Zxynth — Made by [Sankar Balasubramanian](https://linkedin.com/in/sankar4) · [sankar.studio](https://sankar.studio)*
