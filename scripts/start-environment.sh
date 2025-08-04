#!/bin/bash

# Environment Startup Script
# Usage: ./scripts/start-environment.sh [development|test|staging|production]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Default environment
ENVIRONMENT=${1:-development}

# Validate environment
case $ENVIRONMENT in
    development|dev)
        ENV_FILE=".env.development"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    test|testing)
        ENV_FILE=".env.test"
        COMPOSE_FILE="docker-compose.test.yml"
        ;;
    staging|stage)
        ENV_FILE=".env.staging"
        COMPOSE_FILE="docker-compose.staging.yml"
        ;;
    production|prod)
        ENV_FILE=".env.production"
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    *)
        error "Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [development|test|staging|production]"
        exit 1
        ;;
esac

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file $ENV_FILE not found"
    exit 1
fi

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Docker compose file $COMPOSE_FILE not found"
    exit 1
fi

log "Starting $ENVIRONMENT environment"
log "Using environment file: $ENV_FILE"
log "Using compose file: $COMPOSE_FILE"

# Load environment variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Display configuration
log "Configuration:"
echo "  - Environment: $ENVIRONMENT"
echo "  - Subnet: ${SUBNET_PREFIX}.0/24"
echo "  - Nginx Port: $NGINX_PORT"
echo "  - Network: $NETWORK_NAME"
echo "  - Bridge: $BRIDGE_NAME"

# Start the environment
log "Starting Docker containers..."
docker compose --env-file $ENV_FILE -f $COMPOSE_FILE up -d

if [ $? -eq 0 ]; then
    success "$ENVIRONMENT environment started successfully"
    log "Services available at:"
    echo "  - Application: http://localhost:$NGINX_PORT"
    echo "  - Health Check: http://localhost:$NGINX_PORT/api/health"
    
    # Wait for health checks
    log "Waiting for services to be healthy..."
    sleep 5
    
    # Check service status
    log "Service status:"
    docker compose --env-file $ENV_FILE -f $COMPOSE_FILE ps
else
    error "Failed to start $ENVIRONMENT environment"
    exit 1
fi