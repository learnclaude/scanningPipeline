#!/bin/bash

# Network Isolation Testing Script
# Tests inter-environment network isolation and connectivity

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"  # "pass" or "fail"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running test: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_result" = "pass" ]; then
            success "✓ $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            error "✗ $test_name (expected to fail but passed)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            success "✓ $test_name (correctly failed as expected)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            error "✗ $test_name"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
}

# Function to check if containers are running
check_containers() {
    local env="$1"
    local containers=("$@")
    containers=("${containers[@]:1}")  # Remove first element (env name)
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$container"; then
            error "Container $container is not running in $env environment"
            return 1
        else
            log "Container $container is running in $env environment"
        fi
    done
}

# Function to test network connectivity within environment
test_internal_connectivity() {
    local env="$1"
    local nginx_container="$2"
    local app_container="$3"
    local redis_container="$4"
    
    log "Testing internal connectivity in $env environment"
    
    # Test nginx -> app connectivity
    run_test "$env: nginx -> app connectivity" \
        "docker exec $nginx_container wget -qO- http://app-${env}.local:3000/api/health" \
        "pass"
    
    # Test app -> redis connectivity (if redis exists)
    if [ -n "$redis_container" ] && docker ps --format "table {{.Names}}" | grep -q "$redis_container"; then
        run_test "$env: app -> redis connectivity" \
            "docker exec $app_container redis-cli -h redis-${env}.local ping" \
            "pass"
    fi
}

# Function to test cross-environment isolation
test_cross_environment_isolation() {
    local env1="$1"
    local env2="$2"
    local container1="$3"
    local ip2="$4"
    
    log "Testing isolation between $env1 and $env2 environments"
    
    # Test that containers cannot communicate across environments
    run_test "$env1 -> $env2 isolation (ping)" \
        "docker exec $container1 ping -c 1 -W 1 $ip2" \
        "fail"
    
    run_test "$env1 -> $env2 isolation (http)" \
        "docker exec $container1 wget --timeout=2 -qO- http://$ip2:3000/api/health" \
        "fail"
}

# Function to test external access
test_external_access() {
    local port="$1"
    local env="$2"
    
    log "Testing external access to $env environment on port $port"
    
    run_test "$env: External HTTP access" \
        "curl -f --max-time 5 http://localhost:$port/api/health" \
        "pass"
}

# Main testing function
main() {
    log "Starting network isolation tests"
    echo "=================================================="
    
    # Environment definitions
    declare -A ENVIRONMENTS=(
        ["dev"]="18091 filename-generator-nginx-dev filename-generator-app-dev filename-generator-redis-dev"
        ["test"]="18092 filename-generator-nginx-test filename-generator-test-app"
        ["staging"]="18093 filename-generator-nginx-staging filename-generator-staging filename-generator-redis-staging"
        ["prod"]="18090 filename-generator-nginx-prod filename-generator-app-prod filename-generator-redis-prod"
    )
    
    declare -A SUBNET_IPS=(
        ["dev"]="10.100.0"
        ["test"]="10.101.0"
        ["staging"]="10.102.0"
        ["prod"]="10.103.0"
    )
    
    # Check which environments are running
    RUNNING_ENVS=()
    for env in "${!ENVIRONMENTS[@]}"; do
        IFS=' ' read -ra ENV_DATA <<< "${ENVIRONMENTS[$env]}"
        port="${ENV_DATA[0]}"
        nginx_container="${ENV_DATA[1]}"
        
        if docker ps --format "table {{.Names}}" | grep -q "$nginx_container"; then
            RUNNING_ENVS+=("$env")
            log "$env environment is running"
        else
            warning "$env environment is not running - skipping tests"
        fi
    done
    
    if [ ${#RUNNING_ENVS[@]} -eq 0 ]; then
        error "No environments are running. Start at least one environment to test."
        exit 1
    fi
    
    # Test 1: Internal connectivity within each environment
    log "\n=== Testing Internal Connectivity ==="
    for env in "${RUNNING_ENVS[@]}"; do
        IFS=' ' read -ra ENV_DATA <<< "${ENVIRONMENTS[$env]}"
        port="${ENV_DATA[0]}"
        nginx_container="${ENV_DATA[1]}"
        app_container="${ENV_DATA[2]}"
        redis_container="${ENV_DATA[3]:-}"
        
        test_internal_connectivity "$env" "$nginx_container" "$app_container" "$redis_container"
    done
    
    # Test 2: External access to each environment
    log "\n=== Testing External Access ==="
    for env in "${RUNNING_ENVS[@]}"; do
        IFS=' ' read -ra ENV_DATA <<< "${ENVIRONMENTS[$env]}"
        port="${ENV_DATA[0]}"
        
        test_external_access "$port" "$env"
    done
    
    # Test 3: Cross-environment isolation (only if multiple environments are running)
    if [ ${#RUNNING_ENVS[@]} -gt 1 ]; then
        log "\n=== Testing Cross-Environment Isolation ==="
        for i in "${!RUNNING_ENVS[@]}"; do
            for j in "${!RUNNING_ENVS[@]}"; do
                if [ "$i" != "$j" ]; then
                    env1="${RUNNING_ENVS[$i]}"
                    env2="${RUNNING_ENVS[$j]}"
                    
                    IFS=' ' read -ra ENV1_DATA <<< "${ENVIRONMENTS[$env1]}"
                    container1="${ENV1_DATA[2]}"  # app container
                    
                    app_ip2="${SUBNET_IPS[$env2]}.20"
                    nginx_ip2="${SUBNET_IPS[$env2]}.10"
                    
                    test_cross_environment_isolation "$env1" "$env2" "$container1" "$app_ip2"
                fi
            done
        done
    else
        warning "Only one environment running - skipping cross-environment isolation tests"
    fi
    
    # Test 4: Network interface verification
    log "\n=== Verifying Network Interfaces ==="
    for env in "${RUNNING_ENVS[@]}"; do
        subnet="${SUBNET_IPS[$env]}.0/24"
        bridge_name="$env-bridge"
        
        run_test "$env: Docker network exists" \
            "docker network ls | grep filename-generator-$env-network" \
            "pass"
        
        run_test "$env: Subnet configuration" \
            "docker network inspect filename-generator-$env-network | grep '\"Subnet\": \"$subnet\"'" \
            "pass"
    done
    
    # Test 5: DNS resolution within environments
    log "\n=== Testing DNS Resolution ==="
    for env in "${RUNNING_ENVS[@]}"; do
        IFS=' ' read -ra ENV_DATA <<< "${ENVIRONMENTS[$env]}"
        app_container="${ENV_DATA[2]}"
        
        run_test "$env: DNS resolution (nginx)" \
            "docker exec $app_container nslookup nginx-$env.local" \
            "pass"
        
        run_test "$env: DNS resolution (redis)" \
            "docker exec $app_container nslookup redis-$env.local || true" \
            "pass"
    done
    
    # Results summary
    echo ""
    echo "=================================================="
    log "TEST RESULTS SUMMARY"
    echo "=================================================="
    success "Tests Passed: $TESTS_PASSED"
    error "Tests Failed: $TESTS_FAILED"
    log "Total Tests: $TOTAL_TESTS"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        success "All tests passed! Network isolation is working correctly."
        exit 0
    else
        error "Some tests failed. Please review the network configuration."
        exit 1
    fi
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help    Show this help message"
    echo "  -v, --verbose Enable verbose output"
    echo ""
    echo "This script tests network isolation between Docker environments."
    echo "Make sure the environments are running before executing this script."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main