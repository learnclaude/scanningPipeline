#!/bin/bash

# Auto-update USER_ID and GROUP_ID in environment files before Docker operations
# This ensures Docker containers run with correct user permissions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
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

# Get current user and group IDs
CURRENT_USER_ID=$(id -u)
CURRENT_GROUP_ID=$(id -g)

print_status "Current user: $(whoami) (UID: $CURRENT_USER_ID, GID: $CURRENT_GROUP_ID)"

# Function to update env file
update_env_file() {
    local env_file="$1"
    
    if [[ ! -f "$env_file" ]]; then
        print_warning "Environment file not found: $env_file"
        return 1
    fi
    
    print_status "Updating $env_file with current user permissions..."
    
    # Remove existing USER_ID and GROUP_ID lines
    sed -i '/^USER_ID=/d' "$env_file"
    sed -i '/^GROUP_ID=/d' "$env_file"
    
    # Add current user and group IDs
    echo "" >> "$env_file"
    echo "# Auto-updated user permissions" >> "$env_file"
    echo "USER_ID=$CURRENT_USER_ID" >> "$env_file"
    echo "GROUP_ID=$CURRENT_GROUP_ID" >> "$env_file"
    
    print_status "Updated $env_file with USER_ID=$CURRENT_USER_ID and GROUP_ID=$CURRENT_GROUP_ID"
}

# Update environment files
ENVIRONMENTS=("development" "test" "staging" "production")

for env in "${ENVIRONMENTS[@]}"; do
    env_file="$PROJECT_ROOT/.env.$env"
    if [[ -f "$env_file" ]]; then
        update_env_file "$env_file"
    fi
done

# Also update .env.example
if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
    print_status "Updating .env.example with example user permissions..."
    sed -i '/^USER_ID=/d' "$PROJECT_ROOT/.env.example"
    sed -i '/^GROUP_ID=/d' "$PROJECT_ROOT/.env.example"
    
    # Add example values to .env.example
    if ! grep -q "USER_ID=" "$PROJECT_ROOT/.env.example"; then
        echo "" >> "$PROJECT_ROOT/.env.example"
        echo "# User permissions (will be auto-updated by scripts)" >> "$PROJECT_ROOT/.env.example"
        echo "USER_ID=1000" >> "$PROJECT_ROOT/.env.example"
        echo "GROUP_ID=1000" >> "$PROJECT_ROOT/.env.example"
    fi
fi

print_status "User permission update completed!"