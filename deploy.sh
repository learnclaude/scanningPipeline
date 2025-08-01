#!/bin/bash

# Brain Section Generator - Deployment Script
# Usage: ./deploy.sh [environment] [action]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
load_env() {
    local env_file=".env.${1:-ci}"
    if [[ -f "$env_file" ]]; then
        print_status "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    fi
}

# Show usage information
show_usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev        - Development environment (port 18091)"
    echo "  test       - Test environment (port 18092) - Git-based builds"
    echo "  staging    - Staging environment (port 18093) - Auto-deploy from test"
    echo "  prod       - Production environment (port 18090) - Manual approval"
    echo ""
    echo "Actions:"
    echo "  up         - Start the environment"
    echo "  down       - Stop the environment"
    echo "  restart    - Restart the environment"
    echo "  logs       - Show logs"
    echo "  status     - Show container status"
    echo "  clean      - Clean up containers and volumes"
    echo "  build      - Force rebuild images"
    echo ""
    echo "Examples:"
    echo "  $0 dev up           # Start development environment"
    echo "  $0 test up          # Run full test pipeline"
    echo "  $0 staging status   # Check staging status"
    echo "  $0 prod restart     # Restart production (requires approval)"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Start environment
start_env() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    if [[ ! -f "$compose_file" ]]; then
        print_error "Compose file $compose_file not found!"
        exit 1
    fi
    
    print_status "Starting $env environment..."
    load_env "$env"
    
    case $env in
        "dev")
            print_status "Starting development environment with code mounting..."
            docker compose -f "$compose_file" up -d
            print_success "Development environment started on http://localhost:18091"
            ;;
        "test")
            print_status "Starting test pipeline (Git clone -> Test -> Build -> Publish)..."
            docker compose -f "$compose_file" up --abort-on-container-exit
            print_success "Test pipeline completed. Check logs for results."
            ;;
        "staging")
            print_status "Starting staging environment with auto-deployment..."
            docker compose -f "$compose_file" up -d
            print_success "Staging environment started on http://localhost:18093"
            print_warning "Image watcher will auto-deploy when new test images are available."
            ;;
        "prod")
            print_warning "Starting production environment requires manual approval for deployments."
            docker compose -f "$compose_file" up -d
            print_success "Production environment started on http://localhost:18090"
            print_warning "Production watcher will notify when new prod images are available."
            ;;
    esac
}

# Stop environment
stop_env() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    print_status "Stopping $env environment..."
    docker compose -f "$compose_file" down
    print_success "$env environment stopped."
}

# Restart environment
restart_env() {
    local env=$1
    stop_env "$env"
    sleep 2
    start_env "$env"
}

# Show logs
show_logs() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    print_status "Showing logs for $env environment..."
    docker compose -f "$compose_file" logs -f
}

# Show status
show_status() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    print_status "Status for $env environment:"
    docker compose -f "$compose_file" ps
    
    case $env in
        "dev")
            echo -e "\n${BLUE}Access URL:${NC} http://localhost:18091"
            ;;
        "test")
            echo -e "\n${BLUE}Access URL:${NC} http://localhost:18092"
            ;;
        "staging")
            echo -e "\n${BLUE}Access URL:${NC} http://localhost:18093"
            ;;
        "prod")
            echo -e "\n${BLUE}Access URL:${NC} http://localhost:18090"
            ;;
    esac
}

# Clean up
clean_env() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    print_warning "This will remove all containers and volumes for $env environment."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up $env environment..."
        docker compose -f "$compose_file" down -v --remove-orphans
        docker system prune -f
        print_success "$env environment cleaned up."
    fi
}

# Force rebuild
build_env() {
    local env=$1
    local compose_file="docker-compose.${env}.yml"
    
    print_status "Force rebuilding $env environment..."
    docker compose -f "$compose_file" build --no-cache
    print_success "$env environment rebuilt."
}

# Promote image from staging to production
promote_to_prod() {
    print_status "Promoting staging image to production..."
    
    if [[ -z "$DOCKER_USERNAME" ]] || [[ -z "$DOCKER_PASSWORD" ]]; then
        print_error "Docker credentials not set. Please set DOCKER_USERNAME and DOCKER_PASSWORD."
        exit 1
    fi
    
    # Login to Docker Hub
    echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    
    # Pull staging image
    docker pull "$DOCKER_REGISTRY/$DOCKER_IMAGE:test-latest"
    
    # Tag for production
    docker tag "$DOCKER_REGISTRY/$DOCKER_IMAGE:test-latest" "$DOCKER_REGISTRY/$DOCKER_IMAGE:prod"
    docker tag "$DOCKER_REGISTRY/$DOCKER_IMAGE:test-latest" "$DOCKER_REGISTRY/$DOCKER_IMAGE:prod-$(date +%s)"
    
    # Push production tags
    docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE:prod"
    docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE:prod-$(date +%s)"
    
    print_success "Image promoted to production. Production watcher will detect the new image."
}

# Main script logic
main() {
    check_docker
    
    local environment=${1:-}
    local action=${2:-}
    
    if [[ -z "$environment" ]] || [[ -z "$action" ]]; then
        show_usage
        exit 1
    fi
    
    case $action in
        "up")
            start_env "$environment"
            ;;
        "down")
            stop_env "$environment"
            ;;
        "restart")
            restart_env "$environment"
            ;;
        "logs")
            show_logs "$environment"
            ;;
        "status")
            show_status "$environment"
            ;;
        "clean")
            clean_env "$environment"
            ;;
        "build")
            build_env "$environment"
            ;;
        "promote")
            if [[ "$environment" == "prod" ]]; then
                promote_to_prod
            else
                print_error "Promote action is only available for prod environment."
                exit 1
            fi
            ;;
        *)
            print_error "Unknown action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"