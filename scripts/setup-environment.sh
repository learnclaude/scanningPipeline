#!/bin/bash

# Environment setup script for scanning application
# This script configures the environment based on the EXTERNAL_INTERFACE_IP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        IFS='.' read -ra ADDR <<< "$ip"
        for i in "${ADDR[@]}"; do
            if [[ $i -gt 255 ]]; then
                return 1
            fi
        done
        return 0
    else
        return 1
    fi
}

# Function to check if IP is available on system
check_ip_available() {
    local ip=$1
    if ip addr show | grep -q "$ip"; then
        return 0
    else
        return 1
    fi
}

# Main function
main() {
    local environment=${1:-"development"}
    local env_file="${PROJECT_ROOT}/.env.${environment}"
    
    print_status "Setting up environment: $environment"
    
    # Check if .env file exists
    if [[ ! -f "$env_file" ]]; then
        print_warning ".env file not found at $env_file"
        print_status "Creating from .env.example..."
        cp "${PROJECT_ROOT}/.env.example" "$env_file"
    fi
    
    # Source the environment file
    if [[ -f "$env_file" ]]; then
        source "$env_file"
    else
        print_error "Environment file $env_file not found"
        exit 1
    fi
    
    # Validate EXTERNAL_INTERFACE_IP
    if [[ -z "$EXTERNAL_INTERFACE_IP" ]]; then
        print_error "EXTERNAL_INTERFACE_IP not set in $env_file"
        print_status "Please set EXTERNAL_INTERFACE_IP to your desired sub-interface IP"
        exit 1
    fi
    
    if ! validate_ip "$EXTERNAL_INTERFACE_IP"; then
        print_error "Invalid IP address: $EXTERNAL_INTERFACE_IP"
        exit 1
    fi
    
    print_status "Using external interface IP: $EXTERNAL_INTERFACE_IP"
    
    # Check if IP is available on the system
    if ! check_ip_available "$EXTERNAL_INTERFACE_IP"; then
        print_warning "IP $EXTERNAL_INTERFACE_IP is not configured on any network interface"
        print_status "You may need to configure this IP on a sub-interface first"
        print_status "Example: sudo ip addr add $EXTERNAL_INTERFACE_IP/24 dev eth0:1"
    else
        print_status "IP $EXTERNAL_INTERFACE_IP is available on the system"
    fi
    
    # Display the configuration
    print_status "Environment configuration:"
    echo "  Environment: $environment"
    echo "  External IP: $EXTERNAL_INTERFACE_IP"
    
    case $environment in
        "development")
            echo "  Nginx port: ${NGINX_DEV_PORT:-8090}"
            ;;
        "test")
            echo "  Nginx port: ${NGINX_TEST_PORT:-18092}"
            ;;
        "staging")
            echo "  Nginx port: ${NGINX_STAGING_PORT:-18093}"
            echo "  Nginx HTTPS port: ${NGINX_STAGING_HTTPS_PORT:-18094}"
            ;;
        "production")
            echo "  Nginx port: ${NGINX_EXTERNAL_PORT:-80}"
            echo "  Nginx HTTPS port: ${NGINX_EXTERNAL_HTTPS_PORT:-443}"
            ;;
    esac
    
    print_status "Environment setup complete!"
    print_status "You can now run: docker-compose -f docker-compose.$environment.yml up -d"
}

# Show usage if no arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <environment>"
    echo "Environments: development, test, staging, production"
    exit 1
fi

main "$@"