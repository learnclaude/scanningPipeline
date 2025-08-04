#!/bin/bash

# Universal Docker management script for all environments
# Automatically updates user permissions and manages containers across environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_action() {
    echo -e "${BLUE}[ACTION]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_env() {
    echo -e "${CYAN}[ENV]${NC} $1"
}

# Available environments and their compose files
declare -A ENVIRONMENTS=(
    ["dev"]="docker-compose.dev.yml"
    ["test"]="docker-compose.test.yml"
    ["staging"]="docker-compose.staging.yml"
    ["prod"]="docker-compose.yml"
    ["production"]="docker-compose.yml"
)

# Function to show usage
show_usage() {
    echo "Usage: $0 <environment> <command> [options]"
    echo ""
    echo "Environments:"
    echo "  dev          - Development environment"
    echo "  test         - Test environment"
    echo "  staging      - Staging environment"
    echo "  prod         - Production environment"
    echo ""
    echo "Commands:"
    echo "  build        - Update permissions and build containers"
    echo "  up           - Update permissions, build, and start containers"
    echo "  down         - Stop containers"
    echo "  restart      - Stop, rebuild, and start containers"
    echo "  clean        - Clean up containers, images, and volumes"
    echo "  logs         - Show container logs"
    echo "  status       - Show container status"
    echo ""
    echo "Examples:"
    echo "  $0 dev up           # Start development environment"
    echo "  $0 test restart     # Restart test environment"
    echo "  $0 staging clean    # Clean staging environment"
    echo "  $0 prod status      # Check production status"
}

# Function to get environment config
get_env_config() {
    local env="$1"
    local compose_file="${ENVIRONMENTS[$env]}"
    local env_file=""
    
    case "$env" in
        "dev")
            env_file=".env.development"
            ;;
        "test")
            env_file=".env.test"
            ;;
        "staging")
            env_file=".env.staging"
            ;;
        "prod"|"production")
            env_file=".env.production"
            ;;
        *)
            print_error "Unknown environment: $env"
            exit 1
            ;;
    esac
    
    if [[ ! -f "$PROJECT_ROOT/$compose_file" ]]; then
        print_error "Compose file not found: $compose_file"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/$env_file" ]]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    echo "$compose_file $env_file"
}

# Function to update user permissions
update_permissions() {
    print_action "Updating user permissions for all environments..."
    "$SCRIPT_DIR/update-user-permissions.sh"
}

# Function to build containers
build_containers() {
    local env="$1"
    local config=($(get_env_config "$env"))
    local compose_file="${config[0]}"
    local env_file="${config[1]}"
    
    print_action "Building $env containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" --env-file "$env_file" build
}

# Function to start containers
start_containers() {
    local env="$1"
    local config=($(get_env_config "$env"))
    local compose_file="${config[0]}"
    local env_file="${config[1]}"
    
    print_action "Starting $env containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" --env-file "$env_file" up -d
    
    # Wait a moment and show status
    sleep 5
    show_status "$env"
    
    # Show access information based on environment
    local external_ip=$(grep "EXTERNAL_INTERFACE_IP" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2)
    local port=""
    
    case "$env" in
        "dev")
            port=$(grep "NGINX_DEV_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "8090")
            ;;
        "test")
            port=$(grep "NGINX_TEST_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "18092")
            ;;
        "staging")
            port=$(grep "NGINX_STAGING_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "18093")
            ;;
        "prod"|"production")
            port=$(grep "NGINX_EXTERNAL_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "80")
            ;;
    esac
    
    print_env "$env environment is starting up..."
    print_env "Access URL: http://${external_ip:-localhost}:${port}"
    print_status "Use '$0 $env logs' to monitor startup progress"
}

# Function to stop containers
stop_containers() {
    local env="$1"
    local config=($(get_env_config "$env"))
    local compose_file="${config[0]}"
    local env_file="${config[1]}"
    
    print_action "Stopping $env containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" --env-file "$env_file" down
}

# Function to clean up
clean_up() {
    local env="$1"
    local config=($(get_env_config "$env"))
    local compose_file="${config[0]}"
    local env_file="${config[1]}"
    
    print_action "Cleaning up $env environment..."
    cd "$PROJECT_ROOT"
    
    # Stop containers and remove volumes
    docker-compose -f "$compose_file" --env-file "$env_file" down --volumes --remove-orphans
    
    # Remove environment-specific images
    case "$env" in
        "dev")
            docker rmi filename-generator:dev 2>/dev/null || true
            ;;
        "test")
            docker rmi filename-generator:test filename-generator:test-app filename-generator:e2e-test 2>/dev/null || true
            ;;
        "staging")
            docker images | grep filename-generator | grep staging | awk '{print $1":"$2}' | xargs docker rmi 2>/dev/null || true
            ;;
        "prod"|"production")
            docker images | grep filename-generator | grep -v staging | grep -v dev | grep -v test | awk '{print $1":"$2}' | xargs docker rmi 2>/dev/null || true
            ;;
    esac
    
    # Clean up networks
    docker network prune -f
    
    print_status "$env environment cleaned up"
}

# Function to show logs
show_logs() {
    local env="$1"
    local config=($(get_env_config "$env"))
    local compose_file="${config[0]}"
    local env_file="${config[1]}"
    
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" --env-file "$env_file" logs -f
}

# Function to show status
show_status() {
    local env="$1"
    
    print_env "$env Environment Status:"
    docker ps --filter name=filename-generator --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Test connectivity for web environments
    if [[ "$env" != "test" ]]; then
        local config=($(get_env_config "$env"))
        local env_file="${config[1]}"
        local external_ip=$(grep "EXTERNAL_INTERFACE_IP" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2)
        local port=""
        
        case "$env" in
            "dev")
                port=$(grep "NGINX_DEV_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "8090")
                ;;
            "staging")
                port=$(grep "NGINX_STAGING_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "18093")
                ;;
            "prod"|"production")
                port=$(grep "NGINX_EXTERNAL_PORT" "$PROJECT_ROOT/$env_file" | cut -d'=' -f2 || echo "80")
                ;;
        esac
        
        if [[ -n "$port" ]]; then
            echo ""
            print_status "Testing connectivity..."
            if curl -s -I "http://${external_ip:-localhost}:${port}" >/dev/null 2>&1; then
                print_status "✅ Nginx accessible at http://${external_ip:-localhost}:${port}"
            else
                print_warning "⚠️  Nginx not yet accessible at http://${external_ip:-localhost}:${port}"
            fi
        fi
    fi
}

# Main script logic
if [[ $# -lt 2 ]]; then
    show_usage
    exit 1
fi

ENVIRONMENT="$1"
COMMAND="$2"

# Validate environment
if [[ -z "${ENVIRONMENTS[$ENVIRONMENT]}" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo ""
    show_usage
    exit 1
fi

# Execute command
case "$COMMAND" in
    build)
        update_permissions
        build_containers "$ENVIRONMENT"
        ;;
    up)
        update_permissions
        build_containers "$ENVIRONMENT"
        start_containers "$ENVIRONMENT"
        ;;
    down)
        stop_containers "$ENVIRONMENT"
        ;;
    restart)
        print_action "Restarting $ENVIRONMENT environment..."
        stop_containers "$ENVIRONMENT"
        update_permissions
        build_containers "$ENVIRONMENT"
        start_containers "$ENVIRONMENT"
        ;;
    clean)
        clean_up "$ENVIRONMENT"
        ;;
    logs)
        show_logs "$ENVIRONMENT"
        ;;
    status)
        show_status "$ENVIRONMENT"
        ;;
    *)
        print_error "Invalid command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac