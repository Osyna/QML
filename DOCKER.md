# Docker Quick Start Guide

This guide provides quick commands for deploying QML API with Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Deployment Options

### 1. Production with PostgreSQL (Recommended)

**Best for:** Production environments, high traffic, scalability

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**What's included:**
- QML API (port 3000)
- PostgreSQL 16 (port 5432)
- Persistent data volumes
- Health checks
- Auto-restart

**Access:**
- API: http://localhost:3000
- Database: localhost:5432

### 2. Standalone with SQLite

**Best for:** Simple deployments, testing, demos

```bash
# Start service
docker-compose -f docker-compose.sqlite.yml up -d

# Check status
docker-compose -f docker-compose.sqlite.yml ps

# View logs
docker-compose -f docker-compose.sqlite.yml logs -f

# Stop service
docker-compose -f docker-compose.sqlite.yml down
```

**What's included:**
- QML API (port 3000)
- SQLite database (persistent volume)
- Health check
- Auto-restart

**Access:**
- API: http://localhost:3000

### 3. Development with Hot Reload

**Best for:** Active development, debugging

```bash
# Start dev environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

**What's included:**
- QML API with hot reload (port 3000)
- PostgreSQL 16 (port 5432)
- Debug port (9229)
- Source code mounted
- Development logging

**Access:**
- API: http://localhost:3000
- Debug: localhost:9229
- Database: localhost:5432

## Common Commands

### Build and Start

```bash
# Build and start (PostgreSQL)
docker-compose up -d --build

# Build and start (SQLite)
docker-compose -f docker-compose.sqlite.yml up -d --build

# Force recreate
docker-compose up -d --force-recreate
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100
```

### Status and Health

```bash
# Check status
docker-compose ps

# Check API health
curl http://localhost:3000/questions

# Check database connection (PostgreSQL)
docker-compose exec postgres psql -U qml_user -d qml_db -c "SELECT 1"
```

### Stop and Clean

```bash
# Stop services (keep data)
docker-compose down

# Stop and remove volumes (delete data)
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

### Maintenance

```bash
# Restart API only
docker-compose restart api

# Rebuild API
docker-compose up -d --build api

# View resource usage
docker stats qml-api qml-postgres

# Access container shell
docker-compose exec api sh
docker-compose exec postgres bash
```

## Configuration

### Environment Variables

Edit `docker-compose.yml` to change configuration:

```yaml
services:
  api:
    environment:
      PORT: 3000
      DB_TYPE: postgres
      DB_SYNCHRONIZE: "true"  # false in production
      DB_LOGGING: "false"
```

### Custom PostgreSQL Settings

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: custom_user
      POSTGRES_PASSWORD: custom_password
      POSTGRES_DB: custom_db
```

Update API environment to match:

```yaml
services:
  api:
    environment:
      DB_USERNAME: custom_user
      DB_PASSWORD: custom_password
      DB_DATABASE: custom_db
```

### Ports

Change exposed ports in `docker-compose.yml`:

```yaml
services:
  api:
    ports:
      - "8080:3000"  # Access on port 8080
  postgres:
    ports:
      - "5433:5432"  # PostgreSQL on port 5433
```

## Data Management

### Backup

**PostgreSQL:**
```bash
# Create backup
docker-compose exec postgres pg_dump -U qml_user qml_db > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U qml_user qml_db
```

**SQLite:**
```bash
# Copy database file
docker cp qml-api-sqlite:/app/database/qml_database.db ./backup.db

# Restore database
docker cp ./backup.db qml-api-sqlite:/app/database/qml_database.db
docker-compose restart api
```

### Reset Database

**PostgreSQL:**
```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

**SQLite:**
```bash
# Stop and remove volumes
docker-compose -f docker-compose.sqlite.yml down -v

# Start fresh
docker-compose -f docker-compose.sqlite.yml up -d
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Or kill the process
kill -9 $(lsof -t -i:3000)

# Or change port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Check if image exists
docker images | grep qml

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Failed

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Wait for PostgreSQL to be ready
docker-compose logs postgres | grep "database system is ready"

# Restart services
docker-compose restart
```

### Permission Denied

```bash
# Fix volume permissions (SQLite)
docker-compose exec api chown -R node:node /app/database

# Or reset volumes
docker-compose down -v
docker-compose up -d
```

## Production Tips

1. **Use strong passwords:**
   ```yaml
   environment:
     POSTGRES_PASSWORD: $(openssl rand -base64 32)
   ```

2. **Disable auto-sync:**
   ```yaml
   DB_SYNCHRONIZE: "false"
   ```

3. **Use secrets:**
   ```yaml
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

4. **Enable resource limits:**
   ```yaml
   services:
     api:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

5. **Use external volumes for data persistence:**
   ```yaml
   volumes:
     postgres_data:
       driver: local
       driver_opts:
         type: none
         o: bind
         device: /data/postgres
   ```

## Health Monitoring

### Check Service Health

```bash
# API health
curl http://localhost:3000/questions

# Database health (PostgreSQL)
docker-compose exec postgres pg_isready -U qml_user

# Container health status
docker inspect --format='{{.State.Health.Status}}' qml-api
```

### Monitor Resources

```bash
# Live resource monitoring
docker stats

# Check logs for errors
docker-compose logs -f | grep -i error

# Database connections
docker-compose exec postgres psql -U qml_user -d qml_db -c "SELECT count(*) FROM pg_stat_activity;"
```

## Scaling

### Multiple API Instances

```yaml
services:
  api:
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
```

### Load Balancer (nginx)

Create `nginx.conf` and add nginx service to `docker-compose.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop services |
| `docker-compose logs -f` | Follow logs |
| `docker-compose ps` | Check status |
| `docker-compose restart api` | Restart API |
| `docker-compose exec api sh` | Access container |
| `docker-compose build --no-cache` | Rebuild from scratch |

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide
- Check [API_GUIDE.md](API_GUIDE.md) for API documentation
- See [NEW_FEATURES.md](NEW_FEATURES.md) for feature documentation
