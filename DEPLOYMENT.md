# QML API Deployment Guide

This guide covers all deployment scenarios for the QML API.

## Table of Contents

1. [Database Configuration](#database-configuration)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)

## Database Configuration

The QML API supports two database types:

- **SQLite** - File-based database, perfect for development and small deployments
- **PostgreSQL** - Production-grade database for scalability and performance

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Database Configuration Options

#### SQLite Configuration

```env
DB_TYPE=sqlite
DB_SQLITE_PATH=./database/qml_database.db
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

#### PostgreSQL Configuration

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=qml_user
DB_PASSWORD=qml_password
DB_DATABASE=qml_db
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

**Important**: Set `DB_SYNCHRONIZE=false` in production and use migrations instead.

## Local Development

### Option 1: Standalone with SQLite (Recommended for Development)

1. Install dependencies:
```bash
npm install
```

2. Use the default development configuration (`.env.development`):
```bash
# No .env file needed - uses SQLite by default
```

3. Start the development server:
```bash
npm run start:dev
```

The API will start on `http://localhost:3000` using SQLite.

### Option 2: Local with External PostgreSQL

1. Install and start PostgreSQL locally

2. Create `.env` file:
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=qml_db
```

3. Start the development server:
```bash
npm run start:dev
```

## Docker Deployment

### Prerequisites

- Docker installed
- Docker Compose installed

### Option 1: Production with PostgreSQL (Recommended)

This is the recommended setup for production deployments.

```bash
# Start API + PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

**Data Persistence:**
PostgreSQL data is stored in a Docker volume named `postgres_data`.

**Architecture:**
```
┌─────────────────┐
│   QML API       │
│   (Port 3000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Port 5432)   │
└─────────────────┘
```

### Option 2: Standalone with SQLite

For simple deployments without external database:

```bash
# Start API with SQLite
docker-compose -f docker-compose.sqlite.yml up -d

# View logs
docker-compose -f docker-compose.sqlite.yml logs -f

# Stop service
docker-compose -f docker-compose.sqlite.yml down
```

**Services:**
- API: `http://localhost:3000`

**Data Persistence:**
SQLite database is stored in a Docker volume named `sqlite_data`.

### Option 3: Development with Hot Reload

For development with Docker and hot reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

**Features:**
- Hot reload on code changes
- PostgreSQL database
- Debug port exposed (9229)
- Development logging enabled

## Production Deployment

### Building the Docker Image

```bash
# Build production image
docker build -t qml-api:latest .

# Tag for registry
docker tag qml-api:latest your-registry/qml-api:latest

# Push to registry
docker push your-registry/qml-api:latest
```

### Environment Configuration

Create a production `.env` file:

```env
NODE_ENV=production
PORT=3000

# PostgreSQL (recommended)
DB_TYPE=postgres
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USERNAME=qml_user
DB_PASSWORD=strong_password_here
DB_DATABASE=qml_db

# Security: Disable auto-sync in production
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

### Docker Compose Production

Edit `docker-compose.yml` for production:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Use strong password
    volumes:
      - /path/to/persistent/storage:/var/lib/postgresql/data

  api:
    image: your-registry/qml-api:latest
    environment:
      DB_SYNCHRONIZE: "false"  # Important!
```

### Kubernetes Deployment

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qml-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: qml-api
  template:
    metadata:
      labels:
        app: qml-api
    spec:
      containers:
      - name: qml-api
        image: your-registry/qml-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_TYPE
          value: "postgres"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: qml-secrets
              key: db-host
        # ... other env vars
```

## Database Migrations (Production)

For production, use TypeORM migrations instead of `synchronize`:

1. Generate migration:
```bash
npm run typeorm migration:generate -- -n MigrationName
```

2. Run migrations:
```bash
npm run typeorm migration:run
```

3. Set `DB_SYNCHRONIZE=false` in production

## Health Checks

The API includes health check endpoints:

- **Liveness**: `GET /` - Returns 404 (application is running)
- **Database**: Check database connection through any endpoint

Docker Compose includes health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Troubleshooting

### Database Connection Issues

**SQLite:**
```bash
# Check if database file exists
ls -la database/

# Create directory if missing
mkdir -p database
```

**PostgreSQL:**
```bash
# Test connection
docker-compose exec postgres psql -U qml_user -d qml_db

# Check logs
docker-compose logs postgres
```

### Port Conflicts

If port 3000 or 5432 is already in use:

```yaml
# docker-compose.yml
services:
  api:
    ports:
      - "8080:3000"  # Use different host port
  postgres:
    ports:
      - "5433:5432"  # Use different host port
```

Update `.env`:
```env
DB_PORT=5433
```

### Volume Permissions

If you encounter permission issues:

```bash
# Fix SQLite volume permissions
docker-compose exec api chown -R node:node /app/database

# Reset PostgreSQL volume
docker-compose down -v
docker-compose up -d
```

## Scaling

### Horizontal Scaling

With PostgreSQL, you can run multiple API instances:

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 3
```

Or use a reverse proxy (nginx):

```nginx
upstream qml_api {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://qml_api;
    }
}
```

### Database Scaling

For high traffic, consider:

- Read replicas
- Connection pooling
- Caching layer (Redis)

## Backup and Restore

### SQLite Backup

```bash
# Backup
docker-compose exec api sqlite3 /app/database/qml_database.db ".backup /app/database/backup.db"

# Copy to host
docker cp qml-api:/app/database/backup.db ./backup.db

# Restore
docker cp ./backup.db qml-api:/app/database/qml_database.db
```

### PostgreSQL Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U qml_user qml_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U qml_user qml_db < backup.sql

# Automated backups with volume
docker run --rm \
  -v qml_postgres_data:/var/lib/postgresql/data \
  -v $(pwd):/backup \
  postgres:16-alpine \
  pg_dump -U qml_user qml_db > /backup/qml_backup_$(date +%Y%m%d).sql
```

## Monitoring

### Logs

```bash
# View API logs
docker-compose logs -f api

# View database logs
docker-compose logs -f postgres

# Export logs
docker-compose logs api > api-logs.txt
```

### Metrics

Consider adding:
- Prometheus for metrics
- Grafana for visualization
- APM tools (New Relic, Datadog)

## Security Checklist

Production security best practices:

- [ ] Use strong database passwords
- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Enable HTTPS/TLS
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] API authentication/authorization
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## Quick Reference

### Common Commands

```bash
# Development (SQLite)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Docker with PostgreSQL
docker-compose up -d

# Docker with SQLite
docker-compose -f docker-compose.sqlite.yml up -d

# Development with Docker
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose down

# Clean everything (including volumes)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build
```

### Port Reference

- **3000** - QML API
- **5432** - PostgreSQL
- **9229** - Node.js debug port (dev only)
