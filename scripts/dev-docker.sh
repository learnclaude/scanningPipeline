#!/bin/bash

# Development Docker management script
# Automatically updates user permissions and manages dev containers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     - Update permissions and build dev containers"
    echo "  up        - Update permissions, build, and start dev containers"
    echo "  down      - Stop dev containers"
    echo "  restart   - Stop, rebuild, and start dev containers"
    echo "  clean     - Clean up dev containers, images, and volumes"
    echo "  logs      - Show container logs"
    echo "  status    - Show container status"
    echo ""
    echo "Examples:"
    echo "  $0 up       # Start development environment"
    echo "  $0 restart  # Restart with fresh build"
    echo "  $0 clean    # Clean up everything"
}

# Function to update user permissions
update_permissions() {
    print_action "Updating user permissions..."
    "$SCRIPT_DIR/update-user-permissions.sh"
}

# Function to build containers
build_containers() {
    print_action "Building development containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.dev.yml build
}

# Function to start containers
start_containers() {
    print_action "Starting development containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait a moment and show status
    sleep 5
    show_status
    
    # Show access information
    print_status "Development environment is starting up..."
    print_status "Nginx will be available at: http://172.20.23.99:8090"
    print_status "Use '$0 logs' to monitor startup progress"
}

# Function to stop containers
stop_containers() {
    print_action "Stopping development containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.dev.yml down
}

# Function to clean up
clean_up() {
    print_action "Cleaning up development environment..."
    cd "$PROJECT_ROOT"
    
    # Stop containers and remove volumes
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
    
    # Remove dev images
    docker rmi filename-generator:dev 2>/dev/null || true
    
    # Clean up networks
    docker network prune -f
    
    print_status "Development environment cleaned up"
}

# Function to show logs
show_logs() {
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.dev.yml logs -f
}

# Function to show status
show_status() {
    print_status "Container Status:"
    docker ps --filter name=filename-generator --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Test nginx connectivity
    echo ""
    print_status "Testing connectivity..."
    if curl -s -I http://172.20.23.99:8090 >/dev/null 2>&1; then
        print_status "✅ Nginx accessible at http://172.20.23.99:8090"
    else
        print_warning "⚠️  Nginx not yet accessible at http://172.20.23.99:8090"
    fi
}

# Main script logic
case "${1:-}" in
    build)
        update_permissions
        build_containers
        ;;
    up)
        update_permissions
        build_containers
        start_containers
        ;;
    down)
        stop_containers
        ;;
    restart)
        print_action "Restarting development environment..."
        stop_containers
        update_permissions
        build_containers
        start_containers
        ;;
    clean)
        clean_up
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac