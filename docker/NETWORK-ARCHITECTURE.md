# Docker Network Architecture

This document describes the network architecture of the Docker setup where all external traffic flows through Nginx as a single entry point.

## Architecture Overview

```
Internet
    |
    v
[Nginx:80/443] <-- Only exposed ports
    |
    | (Internal Docker Network)
    |
    +--> [App:3000] (Not exposed externally)
    |
    +--> [Redis:6379] (Production only, not exposed)
```

## Key Design Principles

### 1. Single Entry Point
- **Only Nginx exposes ports** to the host/internet (80 and 443)
- All other services use `expose` directive instead of `ports`
- External traffic must go through Nginx reverse proxy

### 2. Internal Docker Networks
Each environment has its own isolated network:
- **Development**: `dev-network` (172.19.0.0/16)
- **Test**: `test-network` (172.18.0.0/16)
- **Staging**: `staging-network` (172.20.0.0/16)
- **Production**: `prod-network` (172.21.0.0/16)

### 3. Service Communication
- Services communicate using Docker's internal DNS
- Services reference each other by service name (e.g., `app`, `redis`)
- No need for port mapping or external IPs

## Environment Configurations

### Development
```yaml
nginx-dev:80 -> dev:3000
```
- Hot reload support via WebSocket proxy
- Debug logging enabled

### Test
```yaml
nginx-test:8080 -> app:3000
```
- Isolated test network
- E2E tests access app via nginx-test

### Staging
```yaml
nginx:80,443 -> app:3000
```
- SSL/TLS termination at Nginx
- Rate limiting enabled

### Production
```yaml
nginx:80,443 -> app:3000 (multiple replicas)
              -> redis:6379 (internal only)
```
- Load balancing across app replicas
- Redis for caching (internal access only)

## Security Benefits

1. **Reduced Attack Surface**: Only Nginx is exposed
2. **Network Isolation**: Services can't be accessed directly
3. **Centralized Security**: All security headers/policies at Nginx
4. **Rate Limiting**: Applied at the edge (Nginx)
5. **SSL/TLS Termination**: Handled by Nginx only

## How Services Communicate

### Internal Service Discovery
```bash
# From app container
curl http://redis:6379  # Works (internal network)
curl http://app:3000    # Works (internal network)

# From host
curl http://localhost:3000  # Fails (port not exposed)
curl http://localhost:80    # Works (via Nginx)
```

### Environment Variables
Services use internal hostnames:
```env
# Instead of: http://localhost:3000/api
NEXT_PUBLIC_API_URL=http://nginx/api

# Redis connection (production)
REDIS_URL=redis://redis:6379
```

## Network Commands

### View Networks
```bash
docker network ls
```

### Inspect Network
```bash
docker network inspect docker-compose_dev-network
```

### Test Internal Connectivity
```bash
# Enter a container
docker exec -it filename-generator-app sh

# Test internal DNS
ping app
ping nginx
ping redis  # (production only)
```

## Troubleshooting

### Service Can't Connect
1. Check service is on same network
2. Verify service name in connection string
3. Ensure target service is healthy

### External Access Issues
1. Verify only Nginx has ports exposed
2. Check Nginx upstream configuration
3. Review Nginx logs for proxy errors

### DNS Resolution
1. Use service names, not localhost
2. Ensure services are on same network
3. Check Docker's internal DNS is working