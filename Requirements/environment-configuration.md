# Environment-Based Configuration Guide

This document explains the environment-based configuration system implemented for the Docker containerized Next.js application.

## Overview

The application now supports dynamic configuration through environment files, allowing different network configurations and ports for each deployment environment (development, test, staging, production).

## Environment Files

Each environment has its own configuration file:

- `.env.development` - Development environment (default)
- `.env.test` - Testing environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Network Configuration

### Subnet Allocation

| Environment | Subnet | Gateway | Port | Purpose |
|-------------|--------|---------|------|---------|
| Development | 10.100.0.0/24 | 10.100.0.1 | 18090 | Local development |
| Test | 10.101.0.0/24 | 10.101.0.1 | 18090 | Automated testing |
| Staging | 10.102.0.0/24 | 10.102.0.1 | 18090 | Pre-production |
| Production | 10.103.0.0/24 | 10.103.0.1 | 18090 | Production |

### Container IP Assignments

Each environment follows the same IP pattern:
- Nginx: xxx.xxx.x.10
- App: xxx.xxx.x.20
- Redis: xxx.xxx.x.30 (where applicable)

## Configuration Variables

Key environment variables used across all environments:

### Network Configuration
```bash
SUBNET_PREFIX=10.100.0      # Base subnet (changes per environment)
GATEWAY_IP=10.100.0.1        # Network gateway
NGINX_IP=10.100.0.10         # Nginx container IP
APP_IP=10.100.0.20           # Application container IP
REDIS_IP=10.100.0.30         # Redis container IP
```

### Port Configuration
```bash
NGINX_PORT=18090             # External nginx port
APP_INTERNAL_PORT=3000       # Internal app port
REDIS_INTERNAL_PORT=6379     # Internal redis port
```

### Container Names
```bash
NGINX_CONTAINER=filename-generator-nginx-dev
APP_CONTAINER=filename-generator-app-dev
REDIS_CONTAINER=filename-generator-redis-dev
```

### Network Names
```bash
NETWORK_NAME=filename-generator-dev-network
BRIDGE_NAME=dev-bridge
```

### Hostnames
```bash
NGINX_HOSTNAME=nginx-dev.local
APP_HOSTNAME=app-dev.local
REDIS_HOSTNAME=redis-dev.local
```

## Usage

### Starting Environments

Use the environment startup script:

```bash
# Start development environment (default)
./scripts/start-environment.sh development
./scripts/start-environment.sh dev

# Start test environment
./scripts/start-environment.sh test
./scripts/start-environment.sh testing

# Start staging environment
./scripts/start-environment.sh staging
./scripts/start-environment.sh stage

# Start production environment
./scripts/start-environment.sh production
./scripts/start-environment.sh prod
```

### Manual Docker Compose

You can also use docker-compose directly with environment files:

```bash
# Development
docker compose --env-file .env.development -f docker-compose.yml up -d

# Test
docker compose --env-file .env.test -f docker-compose.test.yml up -d

# Staging
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d

# Production
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Access Points

Each environment is accessible on its designated port:

- **Development**: http://localhost:18090
- **Test**: http://localhost:18090
- **Staging**: http://localhost:18090
- **Production**: http://localhost:18090

## Health Checks

All environments provide health check endpoints:

- Nginx health: `http://localhost:[PORT]/health`
- Application health: `http://localhost:[PORT]/api/health`

## Network Isolation

Each environment runs in complete network isolation:

- Separate Docker networks with distinct subnets
- Static IP assignments for predictable networking
- Environment-specific hostnames and DNS resolution
- No cross-environment communication possible

## Benefits

1. **Environment Consistency**: Same configuration pattern across all environments
2. **Network Isolation**: Complete separation between environments
3. **Easy Switching**: Simple script-based environment switching
4. **Scalable Configuration**: Easy to add new environments
5. **Development Flexibility**: Local development with production-like networking
6. **Testing Support**: Isolated test environments for CI/CD

## File Structure

```
.
├── .env.development         # Development environment config
├── .env.test                # Test environment config
├── .env.staging             # Staging environment config
├── .env.production          # Production environment config
├── docker-compose.yml       # Development compose file
├── docker-compose.test.yml  # Test compose file
├── docker-compose.staging.yml # Staging compose file
├── docker-compose.prod.yml  # Production compose file
└── scripts/
    ├── start-environment.sh  # Environment startup script
    └── test-network-isolation.sh # Network testing script
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure no other services are using the configured ports
2. **Network Conflicts**: Check for existing Docker networks with same subnet
3. **Environment File Missing**: Verify the appropriate .env file exists
4. **Permission Issues**: Ensure scripts have execute permissions

### Debug Commands

```bash
# Check running containers
docker ps

# Check networks
docker network ls

# Inspect network configuration
docker network inspect [network-name]

# Check container IP assignments
docker inspect [container-name] | grep IPAddress

# Test connectivity
curl http://localhost:[PORT]/api/health
```

## Security Considerations

- All environment files should be added to `.gitignore` if they contain sensitive data
- Use separate `.env.example` files to document required variables
- Implement proper access controls for production environments
- Regular security audits of network configurations

## Migration Guide

To migrate existing deployments to use environment-based configuration:

1. Create appropriate `.env.[environment]` file
2. Update docker-compose files to use environment variables
3. Test with the startup script
4. Update deployment scripts to use new configuration
5. Update documentation and team knowledge

This configuration system provides a robust, scalable foundation for multi-environment Docker deployments with complete network isolation and consistent configuration management.