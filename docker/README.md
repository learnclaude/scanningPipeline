# Docker Setup Documentation

This document describes the enterprise-grade Docker setup for the Filename Generator application.

## Overview

The Docker setup includes configurations for four environments:
- Development
- Testing
- Staging
- Production

## Architecture

### Multi-Stage Dockerfile

The main `Dockerfile` uses a multi-stage build process:

1. **Base Stage**: Common dependencies and security updates
2. **Dependencies Stage**: Production dependencies only
3. **Dev Dependencies Stage**: All dependencies for building
4. **Builder Stage**: Builds the Next.js application
5. **Runner Stage**: Minimal production image

### Key Features

- **Security**: Non-root user, minimal base image, security headers
- **Performance**: Multi-stage builds, layer caching, optimized for size
- **Health Checks**: Built-in health check endpoints
- **Monitoring**: Support for logging and metrics

## Environment-Specific Configurations

### Development (`docker-compose.dev.yml`)

- Hot reloading with volume mounts
- Development tools enabled
- Port 3000 exposed

```bash
docker-compose -f docker-compose.dev.yml up
```

### Testing (`docker-compose.test.yml`)

- Isolated test environment
- Support for unit and E2E tests
- Test result output volumes

```bash
docker-compose -f docker-compose.test.yml up test
```

### Staging (`docker-compose.staging.yml`)

- Production-like environment
- Nginx reverse proxy
- SSL/TLS configuration
- Rate limiting

```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production (`docker-compose.prod.yml`)

- High availability with replicas
- Redis caching
- Advanced Nginx configuration
- Resource limits and monitoring

```bash
docker stack deploy -c docker-compose.prod.yml filename-generator
```

## Building Images

### Development Build

```bash
docker build -f Dockerfile.dev -t filename-generator:dev .
```

### Production Build

```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg BUILD_ID=$(git rev-parse HEAD) \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VCS_REF=$(git rev-parse HEAD) \
  -t filename-generator:prod .
```

## Environment Variables

Each environment has its own `.env` file:
- `.env.development`
- `.env.test`
- `.env.staging`
- `.env.production`

## Health Checks

All containers include health checks:

```bash
curl -f http://localhost:3000/api/health
```

## Security Considerations

1. **Non-root User**: Containers run as non-root user (UID 1001)
2. **Read-only Filesystem**: Where possible, containers use read-only root filesystem
3. **Security Headers**: Nginx adds security headers (CSP, HSTS, etc.)
4. **Rate Limiting**: Implemented at Nginx level
5. **Secrets Management**: Use Docker secrets in production

## Monitoring

### Logging

- JSON format logging
- Log rotation configured
- Structured logs with correlation IDs

### Metrics

- Health check endpoints
- Performance metrics in Nginx logs
- Container resource usage

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Volume Permissions**
   ```bash
   docker-compose exec app chown -R nextjs:nodejs .next
   ```

3. **Build Cache**
   ```bash
   docker builder prune -a
   ```

## CI/CD Integration

The GitHub Actions workflow automatically:
1. Builds Docker images
2. Runs security scans
3. Pushes to registry
4. Deploys to environments
5. Performs health checks
6. Supports rollback

## Best Practices

1. Always use specific image tags in production
2. Implement proper health checks
3. Use multi-stage builds to minimize image size
4. Scan images for vulnerabilities
5. Use BuildKit for better caching
6. Implement proper logging and monitoring