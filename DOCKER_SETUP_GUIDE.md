# TrustAI Docker Setup Guide

## Overview

TrustAI is now fully containerized using Docker and Docker Compose. All services run in isolated containers with automatic networking, volume management, and service orchestration.

**One command to start everything:**
```bash
docker compose up --build
```

---

## Prerequisites

### Install Docker and Docker Compose

#### macOS (using Homebrew)
```bash
brew install docker docker-compose
# Or install Docker Desktop which includes both
open "https://www.docker.com/products/docker-desktop"
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER  # Add user to docker group
newgrp docker                   # Apply new group
```

#### Windows
- Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- Enable WSL 2 backend during installation

**Verify installation:**
```bash
docker --version
docker compose --version
```

---

## Quick Start

### First-Time Setup

1. **Navigate to project root:**
   ```bash
   cd trustai
   ```

2. **Start all services:**
   ```bash
   docker compose up --build
   ```

   This will:
   - Build all Docker images
   - Create and start all containers
   - Initialize the PostgreSQL database
   - Set up Redis
   - Start all services with proper networking

3. **Wait for services to be ready:**
   ```
   ✓ Backend ready on :5000
   ✓ Frontend ready on :5173
   ✓ AI Service ready on :8000
   ✓ PostgreSQL ready on :5432
   ✓ Redis ready on :6379
   ```

4. **Access the application:**
   - **Frontend:** http://localhost:5173
   - **Backend:** http://localhost:5000
   - **Backend Docs:** http://localhost:5000/docs (if Swagger enabled)
   - **AI Service Docs:** http://localhost:8000/docs

---

## Services Architecture

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **postgres** | postgres:15-alpine | 5432 | PostgreSQL database |
| **redis** | redis:7-alpine | 6379 | In-memory cache & session store |
| **backend** | Custom (Node.js) | 5000 | Express API server |
| **frontend** | Custom (Node.js) | 5173 | Vite dev server |
| **ai-service** | Custom (Python) | 8000 | FastAPI microservice |

### Networking

All services are connected via `trustai-network` bridge network. They can communicate using service names:

```
backend ←→ postgres (DATABASE_URL=postgres://...)
backend ←→ redis (REDIS_URL=redis://...)
frontend ←→ backend (VITE_API_URL=http://backend:5000)
frontend ←→ ai-service (VITE_AI_SERVICE_URL=http://ai-service:8000)
```

---

## Common Commands

### Start All Services
```bash
docker compose up --build
```

### Stop All Services
```bash
docker compose down
```

### Stop and Remove Volumes (Clean Slate)
```bash
docker compose down -v
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ai-service

# Last 100 lines
docker compose logs --tail=100
```

### Run Commands in a Container
```bash
# Backend
docker compose exec backend npm run db:migrate
docker compose exec backend npm test

# Frontend
docker compose exec frontend npm run lint

# AI Service
docker compose exec ai-service python -m pytest
```

### Rebuild Images
```bash
docker compose build --no-cache
```

### View Running Containers
```bash
docker compose ps
```

### Inspect Container
```bash
docker compose exec backend sh    # Backend shell
docker compose exec frontend sh   # Frontend shell
docker compose exec ai-service sh # AI service shell
```

---

## Environment Configuration

### Database Setup

The PostgreSQL container:
- Username: `trustai_user`
- Password: `trustai_password`
- Database: `trustai`
- Auto-restores from `database/trustai_dump.sql` on first run

**Modify credentials in docker-compose.yml:**
```yaml
postgres:
  environment:
    POSTGRES_USER: your_user
    POSTGRES_PASSWORD: your_password
    POSTGRES_DB: your_db
```

### Service URLs (Internal to Docker)

Services use these internal URLs to communicate:
```
Database:    postgres://trustai_user:trustai_password@postgres:5432/trustai
Redis:       redis://redis:6379
Backend:     http://backend:5000
Frontend:    http://frontend:5173
AI Service:  http://ai-service:8000
```

### Frontend Environment Variables

Edit `apps/frontend/vite.config.ts` or `.env`:
```
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

### Backend Environment Variables

Set in `docker-compose.yml` or `apps/backend/.env`:
```
NODE_ENV=development
DATABASE_URL=postgres://trustai_user:trustai_password@postgres:5432/trustai
REDIS_URL=redis://redis:6379
```

---

## Volume Management

### Volumes

- **postgres_data** - Persistent PostgreSQL data
- **redis_data** - Redis persistence
- **src mounts** - Hot reload for development

### Persist Data Across Restarts
```bash
# Data automatically persists
docker compose down
docker compose up
# Your data is still there!
```

### Clean Everything (Fresh Start)
```bash
docker compose down -v
docker compose up --build
```

---

## Development Workflow

### Hot Reload Enabled

All services have hot reload enabled:

#### Backend (npm run dev)
- Changes to `/src` trigger TypeScript recompilation
- No container restart needed

#### Frontend (npm run dev)
- Changes to `/src` trigger Vite hot reload
- Browser auto-refreshes

#### AI Service (uvicorn --reload)
- Changes to Python files trigger auto-reload
- No container restart needed

### Making Code Changes

1. **Edit source files** as you normally would
2. **Changes auto-reload** in running containers
3. **No rebuild needed** unless dependencies change

### Installing New Dependencies

**Backend:**
```bash
docker compose exec backend npm install package-name
# Restart to apply
docker compose restart backend
```

**Frontend:**
```bash
docker compose exec frontend npm install package-name
# Restart to apply
docker compose restart frontend
```

**AI Service:**
```bash
docker compose exec ai-service pip install package-name
# Rebuild image to persist
docker compose down
docker compose up --build
```

---

## Debugging

### View Container Logs

```bash
# Real-time logs for backend
docker compose logs -f backend

# Last 50 lines of backend logs
docker compose logs --tail=50 backend

# All service logs
docker compose logs -f
```

### Connect to Containers

```bash
# Backend shell
docker compose exec backend sh
npm run dev  # Run commands manually

# Frontend shell
docker compose exec frontend sh

# AI service shell
docker compose exec ai-service bash
python main.py  # Run commands manually

# PostgreSQL shell
docker compose exec postgres psql -U trustai_user -d trustai
```

### Database Inspection

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U trustai_user -d trustai

# List tables
\dt

# View schema
\d+ table_name

# Exit
\q
```

### Network Troubleshooting

```bash
# Test connectivity
docker compose exec backend ping redis
docker compose exec backend ping postgres

# Check service status
docker compose ps

# View network
docker network inspect trustai_trustai-network
```

---

## Production Considerations

### Current Setup: Development

- Hot reload enabled
- Source code mounted as volumes
- Development dependencies included

### For Production

Modify docker-compose.yml:

1. Remove volume mounts for source code
2. Use `-f docker-compose.prod.yml` with production config
3. Build final images without development dependencies
4. Use health checks for orchestration

Example production changes:
```yaml
backend:
  build:
    context: .
    dockerfile: apps/backend/Dockerfile.prod
  environment:
    NODE_ENV: production
  # Remove volumes
  # Use 1 replica
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Restart service
docker compose restart backend

# Remove and recreate
docker compose down
docker compose up --build
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose logs postgres

# Verify credentials in docker-compose.yml
# Restart database
docker compose restart postgres
```

### Redis Connection Failed

```bash
# Check Redis is running
docker compose logs redis

# Test connection
docker compose exec backend redis-cli -h redis ping
# Should return: PONG
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
# Or stop other services using the port

# Find what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Out of Space

```bash
# Clean up unused images/volumes
docker system prune -a --volumes

# Or selectively
docker compose down -v
```

### Rebuild Everything

```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

---

## File Structure

```
trustai/
├── docker-compose.yml              ← Main orchestration (this replaces start.sh)
│
├── apps/
│   ├── backend/
│   │   ├── Dockerfile               ← Backend image definition
│   │   ├── .dockerignore            ← Build context exclusions
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── frontend/
│   │   ├── Dockerfile               ← Frontend image definition
│   │   ├── .dockerignore            ← Build context exclusions
│   │   ├── package.json
│   │   └── src/
│   │
│   └── ai-service/
│       ├── Dockerfile               ← AI service image definition
│       ├── .dockerignore            ← Build context exclusions
│       ├── requirements.txt
│       └── main.py
│
├── database/
│   └── trustai_dump.sql             ← Auto-restored on first run
│
└── DOCKER_SETUP_GUIDE.md            ← This file
```

---

## Migration from start.sh

### Before (Old Way)
```bash
./start.sh    # Single script, all manual
```

### After (Docker Way)
```bash
docker compose up --build    # Everything containerized
```

### Benefits

| Aspect | start.sh | Docker Compose |
|--------|----------|---|
| **Dependency Check** | ✓ Manual | ✓ Automatic in images |
| **Installation** | ✓ Manual npm/pip | ✓ In Dockerfiles |
| **Consistency** | ✓ Local OS dependent | ✓ Same everywhere |
| **Deployment** | ✓ Locally dependent | ✓ From dev to prod |
| **Team Onboarding** | ✓ Manual setup needed | ✓ One command |
| **CI/CD** | ✓ Complex | ✓ Simple |
| **Scaling** | ✓ Not possible | ✓ Kubernetes ready |

---

## Next Steps

1. **Ensure Docker is installed** (see Prerequisites)
2. **Run:** `docker compose up --build`
3. **Access:** http://localhost:5173
4. **View logs:** `docker compose logs -f`
5. **Share with team:** Point them to this guide

---

## Support & Documentation

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
- [Redis Docker Guide](https://hub.docker.com/_/redis)

---

## Summary

**Go from nothing to working system:** 3 minutes
```bash
# Install Docker
brew install docker-compose

# Clone/navigate to project
cd trustai

# Start everything
docker compose up --build

# Open browser
open http://localhost:5173
```

That's it! Docker Compose handles all the complexity. 🐳

---

**Next Update:** March 14, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
