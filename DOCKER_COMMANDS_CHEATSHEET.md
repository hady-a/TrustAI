# Docker Compose - Quick Commands Cheat Sheet

## Start & Stop

```bash
# Start all services (build if needed)
docker compose up --build

# Start in background
docker compose up -d --build

# Start without rebuilding (if images exist)
docker compose up

# Stop all services (keep volumes)
docker compose stop

# Stop and remove containers (keep volumes)
docker compose down

# Stop, remove containers, AND remove volumes (clean slate)
docker compose down -v
```

---

## Viewing Logs

```bash
# See all logs in real-time
docker compose logs -f

# Follow backend logs
docker compose logs -f backend

# Follow frontend logs
docker compose logs -f frontend

# Follow AI service logs
docker compose logs -f ai-service

# Last 100 lines of all logs
docker compose logs --tail=100

# Last 50 lines of backend
docker compose logs backend --tail=50

# Grep for errors
docker compose logs | grep ERROR

# Timestamp logs (more detailed)
docker compose logs --timestamps
```

---

## Container Management

```bash
# List all running containers
docker compose ps

# List all containers (including stopped)
docker compose ps -a

# View container details
docker compose ps backend

# Restart a service
docker compose restart backend

# Restart all services
docker compose restart

# Stop specific service
docker compose stop backend

# Start specific service
docker compose start backend

# Remove containers (careful!)
docker compose rm -f backend
```

---

## Executing Commands

```bash
# Run command in backend container
docker compose exec backend npm test

# Run command in frontend
docker compose exec frontend npm run lint

# Run command in AI service
docker compose exec ai-service python -m pytest

# Interactive shell in backend
docker compose exec backend sh

# Interactive shell in frontend
docker compose exec frontend sh

# Interactive shell in AI service
docker compose exec ai-service bash

# Connect to PostgreSQL
docker compose exec postgres psql -U trustai_user -d trustai

# Connect to Redis CLI
docker compose exec redis redis-cli
```

---

## Building & Images

```bash
# Build all images
docker compose build

# Build specific service image
docker compose build backend

# Build without cache (fresh build)
docker compose build --no-cache

# View built images
docker images | grep trustai

# Remove unused images
docker image prune

# Clean up everything unused
docker system prune -a --volumes
```

---

## Database Operations

```bash
# Connect to database
docker compose exec postgres psql -U trustai_user -d trustai

# Dump database to file
docker compose exec postgres pg_dump -U trustai_user -d trustai > backup.sql

# Restore database from file
docker compose exec -T postgres psql -U trustai_user -d trustai < backup.sql

# View database connections
docker compose exec postgres psql -U trustai_user -d trustai -c "SELECT * FROM pg_stat_activity;"

# Run migrations
docker compose exec backend npm run db:migrate

# Reset database
docker compose down -v
docker compose up postgres
# Wait for DB to start
docker compose exec postgres psql -U trustai_user -d trustai < database/trustai_dump.sql
```

---

## Redis Operations

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# View all keys
docker compose exec redis redis-cli KEYS "*"

# Clear Redis
docker compose exec redis redis-cli FLUSHALL

# View memory usage
docker compose exec redis redis-cli INFO memory

# Monitor commands in real-time
docker compose exec redis redis-cli MONITOR
```

---

## Networking & Debugging

```bash
# View container IP addresses
docker compose exec backend hostname -I

# Test connectivity between services
docker compose exec backend ping redis
docker compose exec backend ping postgres

# View Docker network
docker network inspect trustai_trustai-network

# DNS resolution test
docker compose exec backend nslookup postgres

# Port forwarding test
docker compose exec backend curl http://backend:5000/api/health
```

---

## Development Workflow

```bash
# Full setup (clean slate)
docker compose down -v
docker compose up --build

# Hot reload (don't restart)
# Just edit your files, changes are auto-detected

# After installing npm dependencies
docker compose exec backend npm install package-name
docker compose restart backend

# After adding Python dependencies
docker compose exec ai-service pip install package-name
docker compose down
docker compose up --build

# Run tests
docker compose exec backend npm test
docker compose exec frontend npm run test:ui
docker compose exec ai-service python -m pytest

# Format code
docker compose exec backend npm run format
docker compose exec frontend npm run lint:fix
```

---

## Production Preview

```bash
# Build for production
docker compose -f docker-compose.yml build --no-cache

# Run in production mode
docker compose -f docker-compose.yml up

# View resource usage
docker stats

# Limit resource usage in docker-compose.yml
# Add under service:
# deploy:
#   resources:
#     limits:
#       cpus: '0.5'
#       memory: 512M
```

---

## Cleanup & Maintenance

```bash
# Remove dangling images
docker image prune

# Remove dangling volumes
docker volume prune

# Remove all stopped containers
docker container prune

# Full cleanup (be careful!)
docker system prune -a --volumes

# View disk usage
docker system df

# Restart Docker daemon
docker system restart

# Check Docker status
docker info
```

---

## Troubleshooting

```bash
# Container logs with timestamps
docker compose logs --timestamps backend

# View container details
docker inspect container-id
docker compose exec backend env  # See environment variables

# Check resource limits
docker stats

# Debug network issues
docker network create test-network
docker run -it --network test-network --name test busybox
# Inside container: ping redis, etc.

# Check what filesystems are mounted
docker compose exec backend df -h

# View running processes
docker compose exec backend ps aux
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Port already in use" | Change port in docker-compose.yml |
| "Can't connect to DB" | Check `docker compose logs postgres` |
| "Services can't reach each other" | Verify network name in docker-compose.yml |
| "Changes not hot-reloading" | Check volume mounts, restart service |
| "Out of disk space" | Run `docker system prune -a --volumes` |
| "Service keeps crashing" | Check logs: `docker compose logs service-name` |
| "Database won't initialize" | Verify dump.sql path, check postgres logs |

---

## Tips & Tricks

```bash
# Useful aliases (add to ~/.bashrc or ~/.zshrc)
alias dc='docker compose'
alias dcup='docker compose up --build -d'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'
alias dcexec='docker compose exec'

# Then use:
dcup                    # Start
dcdown                  # Stop
dclogs backend          # Logs
dcexec backend sh       # Shell
```

---

## Getting Help

```bash
# Docker Compose help
docker compose --help
docker compose up --help

# Service-specific help
docker compose ps --help
docker compose exec --help
docker compose logs --help
```

---

**One Command to Remember:**
```bash
docker compose up --build
```

Everything else is built on top of this! 🐳

---

**Last Updated:** March 14, 2026
