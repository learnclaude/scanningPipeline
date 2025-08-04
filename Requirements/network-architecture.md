# Network Architecture - Multi-Environment Isolation

## Overview
This document defines the network architecture with separate network interfaces and IP address ranges for each environment to ensure complete isolation between development, testing, staging, and production environments.

## Network Segmentation Design

### Environment-Specific Subnets

| Environment | Subnet Range | Gateway | Network Interface | Port Range |
|-------------|--------------|---------|-------------------|------------|
| Development | 10.100.0.0/24 | 10.100.0.1 | dev-bridge | 18091 |
| Testing | 10.101.0.0/24 | 10.101.0.1 | test-bridge | 18092 |
| Staging | 10.102.0.0/24 | 10.102.0.1 | staging-bridge | 18093-18094 |
| Production | 10.103.0.0/24 | 10.103.0.1 | prod-bridge | 18090, 18095 |

### Container IP Assignments

#### Development Environment (10.100.0.0/24)
- **nginx**: 10.100.0.10
- **app**: 10.100.0.20
- **redis** (if needed): 10.100.0.30

#### Testing Environment (10.101.0.0/24)
- **nginx**: 10.101.0.10
- **app**: 10.101.0.20
- **redis** (if needed): 10.101.0.30

#### Staging Environment (10.102.0.0/24)
- **nginx**: 10.102.0.10
- **app**: 10.102.0.20
- **redis**: 10.102.0.30

#### Production Environment (10.103.0.0/24)
- **nginx**: 10.103.0.10
- **app-1**: 10.103.0.20
- **app-2**: 10.103.0.21 (scaled)
- **redis**: 10.103.0.30

## Network Isolation Features

### Inter-Environment Isolation
- Complete network segregation between environments
- No cross-environment container communication
- Separate DNS resolution per environment
- Independent routing tables

### Security Benefits
- Prevents accidental cross-environment data access
- Isolates security vulnerabilities per environment
- Enables environment-specific firewall rules
- Supports compliance requirements for data segregation

### Monitoring and Logging
- Environment-specific network monitoring
- Separate log aggregation per subnet
- Network traffic analysis per environment
- Performance metrics isolation

## Port Mapping Strategy

### External Access Points
```bash
# Development Environment
http://localhost:18091 → 10.100.0.10:80 (nginx) → 10.100.0.20:3000 (app)

# Testing Environment  
http://localhost:18092 → 10.101.0.10:80 (nginx) → 10.101.0.20:3000 (app)

# Staging Environment
http://localhost:18093 → 10.102.0.10:80 (nginx) → 10.102.0.20:3000 (app)
https://localhost:18094 → 10.102.0.10:443 (nginx) → 10.102.0.20:3000 (app)

# Production Environment
http://localhost:18090 → 10.103.0.10:80 (nginx) → 10.103.0.20:3000 (app)
https://localhost:18095 → 10.103.0.10:443 (nginx) → 10.103.0.20:3000 (app)
```

## DNS Resolution

### Internal DNS per Environment
- **Development**: dev.local, app-dev.local
- **Testing**: test.local, app-test.local  
- **Staging**: staging.local, app-staging.local
- **Production**: prod.local, app-prod.local

### External DNS (Production)
- **Production**: ap4.humanbrain.in:18090
- **Production HTTPS**: ap4.humanbrain.in:18095

## Implementation Requirements

### Docker Network Configuration
Each environment requires:
1. Custom bridge network with specified subnet
2. Static IP assignments for containers
3. Isolated DNS resolver
4. Network-specific labels and metadata

### Host Network Interface Requirements
1. Multiple bridge interfaces on host system
2. Proper routing configuration
3. Firewall rules per environment
4. Network monitoring setup

### Container Requirements
1. Static IP configuration in docker-compose
2. Environment-specific hostnames
3. Network-aware health checks
4. Inter-container communication within subnet only

## Security Considerations

### Network Access Control
- Ingress rules: Only specified ports exposed externally
- Egress rules: Environment-specific external access
- Inter-environment: Complete isolation (no communication)
- Container-to-container: Within same environment only

### Monitoring and Alerting
- Network traffic anomaly detection
- Cross-environment access attempt alerts
- Performance degradation monitoring
- Security event correlation per environment

## Disaster Recovery

### Network Backup Strategy
- Network configuration versioning
- Container IP assignment documentation
- Routing table snapshots
- DNS configuration backups

### Recovery Procedures
- Environment-specific network restoration
- Container IP conflict resolution
- DNS resolution verification
- Cross-environment isolation validation