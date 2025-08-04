# Repository Setup Prompts and Guidelines

## Overview
This document provides comprehensive prompts and guidelines for setting up enterprise-grade repositories following the established patterns from this project. Use these prompts with AI assistants or as checklists for manual setup.

## 1. Initial Repository Setup Prompts

### 1.1 Repository Creation Prompt
```
Please help me create a new enterprise-grade repository with the following specifications:

**Project Details:**
- Project Name: [PROJECT_NAME]
- Description: [PROJECT_DESCRIPTION]
- Technology Stack: Next.js 14, TypeScript, Docker, nginx
- Repository Type: Private/Public
- License: MIT/Proprietary

**Requirements:**
1. Initialize Git repository with main branch as default
2. Create comprehensive README.md with project overview
3. Set up proper .gitignore for Next.js and Node.js
4. Configure package.json with all necessary scripts
5. Implement enterprise-grade directory structure
6. Add proper TypeScript configuration
7. Set up ESLint and Prettier configurations

**Directory Structure to Create:**
```
project-root/
├── .github/workflows/          # CI/CD pipelines
├── Requirements/               # Documentation
├── src/                       # Source code
├── nginx/                     # Server configurations  
├── docker-compose.yml         # Development environment
├── Dockerfile                 # Container build
├── BRANCHING_STRATEGY.md      # Git workflow
└── CLAUDE.md                  # AI guidelines
```

Please create the initial setup following enterprise best practices.
```

### 1.2 CI/CD Pipeline Setup Prompt
```
Set up comprehensive CI/CD pipelines for a Next.js application with the following requirements:

**CI Pipeline Requirements:**
- Trigger on push to main/develop branches and pull requests
- Jobs: lint, test, build, security scan, type-check
- Node.js matrix testing: versions 16.x, 18.x, 20.x
- Code coverage reporting with minimum 80% threshold
- Security scanning with Snyk
- Artifact storage for build outputs

**CD Pipeline Requirements:**
- Staging deployment: Auto-deploy from main branch
- Production deployment: Manual deploy from version tags
- Docker image building with multi-platform support (AMD64, ARM64)
- Health checks after deployment
- Automatic rollback on deployment failure
- Security scanning of Docker images

**Environment Configuration:**
- Development: Port 18091
- Staging: Port 18093-18094  
- Production: Port 18090, 18095
- Testing: Port 18092

**Required Secrets:**
- DOCKER_USERNAME, DOCKER_PASSWORD
- STAGING_HOST, STAGING_USER, STAGING_SSH_KEY
- PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY
- SNYK_TOKEN, SENTRY_DSN, SLACK_WEBHOOK_URL

Create the complete GitHub Actions workflows (.github/workflows/) with proper error handling and notifications.
```

### 1.3 Docker Configuration Setup Prompt
```
Create a complete Docker setup for a Next.js application with enterprise requirements:

**Multi-Stage Dockerfile Requirements:**
- Base stage: node:18-alpine with security updates
- Dependencies stage: Production dependencies only
- Dev-dependencies stage: All dependencies for building
- Builder stage: Application build with optimizations
- Runner stage: Production runtime with non-root user

**Docker Compose Configurations:**
1. docker-compose.yml (Development)
   - nginx reverse proxy on port 18091
   - Hot reload support
   - Volume mounts for development

2. docker-compose.staging.yml (Staging)
   - Production-like environment on port 18093
   - Resource limits and health checks
   - Staging-specific environment variables

3. docker-compose.prod.yml (Production)  
   - Scaled deployment on port 18090
   - Redis for caching
   - Production security headers
   - External hostname support (ap4.humanbrain.in)

**Security Requirements:**
- Run containers as non-root user (nextjs:nodejs)
- Implement proper health checks
- Configure resource limits
- Use multi-stage builds for minimal attack surface
- Security headers in nginx configurations

Create all Docker files with enterprise-grade security and performance optimizations.
```

## 2. Branch Protection Setup Prompts

### 2.1 Main Branch Protection Prompt
```
Configure branch protection rules for the main branch with enterprise security requirements:

**Protection Rules:**
- Require pull request reviews: 2 minimum approvals
- Dismiss stale reviews when new commits are pushed
- Require status checks to pass before merging:
  * CI Pipeline / lint
  * CI Pipeline / test  
  * CI Pipeline / build
  * CI Pipeline / security
  * CI Pipeline / type-check
- Require branches to be up to date before merging
- Include administrators in branch restrictions
- Restrict pushes (no direct pushes allowed)
- Allow deletion protection

**Required Status Checks:**
- All CI jobs must pass
- Security scans must complete successfully
- Code coverage must meet minimum threshold
- No high/critical security vulnerabilities

Apply these settings to protect the main branch and ensure code quality.
```

### 2.2 Develop Branch Protection Prompt
```
Configure branch protection for the develop branch with appropriate restrictions:

**Protection Rules:**
- Require pull request reviews: 1 minimum approval
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Allow squash merging for feature branches
- Enable auto-delete head branches after merge

**Merge Strategy:**
- Feature branches: Squash and merge
- Release branches: Create merge commit
- Hotfix branches: Create merge commit

Configure develop branch to serve as the integration branch for all feature development.
```

## 3. Development Environment Setup Prompts

### 3.1 Local Development Environment Prompt
```
Set up a complete local development environment for the project:

**Prerequisites:**
- Node.js 18.x or higher
- Docker and Docker Compose
- Git with proper configuration

**Setup Steps:**
1. Clone repository and install dependencies
2. Configure environment variables for development
3. Set up pre-commit hooks with Husky
4. Configure IDE settings (VSCode recommended)
5. Start development environment with Docker Compose

**Development Scripts:**
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run type-check   # TypeScript validation
```

**Docker Development:**
```bash
docker-compose up -d              # Start development environment
docker-compose logs -f app        # View application logs
docker-compose exec app bash      # Access container shell
```

Create comprehensive development setup instructions and troubleshooting guide.
```

### 3.2 Code Quality Setup Prompt
```
Configure comprehensive code quality tools and standards:

**ESLint Configuration:**
- Extend @next/core-web-vitals and @typescript-eslint
- Custom rules for code consistency
- Integration with TypeScript
- Automatic fix on save

**Prettier Configuration:**
- Consistent code formatting
- Integration with ESLint
- Pre-commit formatting hooks
- IDE integration

**Husky Git Hooks:**
- Pre-commit: lint, format, type-check
- Commit-msg: conventional commit validation
- Pre-push: run tests and build validation

**TypeScript Configuration:**
- Strict mode enabled
- Path mapping for imports (@/components, @/utils)
- Build optimization settings
- Type checking for all files

**Testing Setup:**
- Jest with React Testing Library
- Coverage reporting with lcov
- Test utilities and mocks
- Snapshot testing for components

Configure all quality tools with enterprise-grade standards and automation.
```

## 4. Security Configuration Prompts

### 4.1 Security Scanning Setup Prompt
```
Implement comprehensive security scanning and vulnerability management:

**Dependency Scanning:**
- Snyk integration for package vulnerabilities
- Automated security updates for dependencies
- Security advisories monitoring
- Regular security audits

**Container Security:**
- Trivy scanning for Docker images
- Base image vulnerability assessment
- Security compliance checking
- Runtime security monitoring

**Code Security:**
- CodeQL security analysis
- SARIF report integration with GitHub
- Security hotspots identification
- Secret detection and prevention

**Security Headers:**
- Content Security Policy (CSP)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Security Monitoring:**
- Failed authentication attempt logging
- Suspicious activity detection
- Security event alerting
- Incident response procedures

Configure complete security scanning pipeline with automated vulnerability management.
```

### 4.2 Secrets Management Prompt
```
Set up secure secrets management for the project:

**GitHub Secrets Configuration:**
- DOCKER_USERNAME: Docker Hub username
- DOCKER_PASSWORD: Docker Hub access token
- STAGING_HOST: Staging server hostname
- STAGING_USER: Staging deployment user
- STAGING_SSH_KEY: Private key for staging access
- PRODUCTION_HOST: Production server hostname  
- PRODUCTION_USER: Production deployment user
- PRODUCTION_SSH_KEY: Private key for production access
- SNYK_TOKEN: Snyk API token for security scanning
- SENTRY_DSN: Sentry error tracking DSN
- SLACK_WEBHOOK_URL: Slack notifications webhook

**Environment Variables:**
- Separate .env files for each environment
- No secrets in version control
- Environment-specific configurations
- Secure key rotation procedures

**Access Control:**
- Least privilege principle
- Role-based access control
- Regular access reviews
- Audit trail for secret access

Configure secure secrets management with proper access controls and rotation policies.
```

## 5. Deployment Configuration Prompts

### 5.1 Staging Environment Setup Prompt
```
Configure staging environment deployment with production-like characteristics:

**Infrastructure Requirements:**
- Linux server with Docker and Docker Compose
- nginx reverse proxy configuration
- SSL certificate for HTTPS
- Monitoring and logging setup

**Staging Configuration:**
- Port 18093 for HTTP traffic
- Port 18094 for HTTPS traffic
- Environment variables for staging
- Database connection for staging data
- External service integrations (staging endpoints)

**Deployment Process:**
- Automatic deployment from main branch
- Health check validation post-deployment
- Rollback capability on failure
- Deployment notification to team channels

**Monitoring Setup:**
- Application performance monitoring
- Error tracking and alerting
- Resource usage monitoring
- User experience monitoring

**Testing Integration:**
- Automated smoke tests post-deployment
- Integration test execution
- Performance baseline validation
- Security scan verification

Configure complete staging environment with automated deployment and monitoring.
```

### 5.2 Production Environment Setup Prompt
```
Set up production environment with enterprise-grade reliability and security:

**Production Infrastructure:**
- High-availability deployment (multiple instances)
- Load balancer configuration
- Database clustering and replication
- CDN integration for static assets
- Backup and disaster recovery systems

**Production Configuration:**
- Port 18090 for HTTP traffic
- Port 18095 for HTTPS traffic
- Production environment variables
- External service production endpoints
- Performance optimization settings

**Deployment Strategy:**
- Blue-green deployment for zero downtime
- Canary deployment for gradual rollout
- Automated rollback on failure detection
- Database migration handling

**Security Hardening:**
- Web Application Firewall (WAF)
- DDoS protection
- SSL/TLS configuration
- Security headers implementation
- Regular security audits

**Monitoring and Alerting:**
- Real-time performance monitoring
- Error rate and response time tracking
- Infrastructure health monitoring
- Business metrics tracking
- 24/7 alerting system

**Backup and Recovery:**
- Automated daily backups
- Point-in-time recovery capability
- Cross-region backup replication
- Recovery procedure documentation
- Regular disaster recovery testing

Configure enterprise-grade production environment with high availability and security.
```

## 6. Documentation Setup Prompts

### 6.1 Project Documentation Prompt
```
Create comprehensive project documentation following enterprise standards:

**README.md Requirements:**
- Project overview and purpose
- Architecture diagram (Mermaid)
- Installation and setup instructions
- Development workflow
- Deployment procedures
- Contributing guidelines
- License information

**Technical Documentation:**
- API documentation with examples
- Database schema documentation
- Architecture decision records (ADRs)
- Deployment architecture diagrams
- Security architecture overview

**Developer Documentation:**
- Development environment setup
- Coding standards and conventions
- Testing strategies and guidelines
- Debugging and troubleshooting guides
- Performance optimization guidelines

**Operations Documentation:**
- Deployment procedures
- Monitoring and alerting setup
- Incident response procedures
- Backup and recovery procedures
- Security procedures and policies

**User Documentation:**
- User guide with screenshots
- API usage examples
- Integration guides
- FAQ and troubleshooting
- Feature release notes

Create complete documentation suite with regular update procedures and review processes.
```

### 6.2 AI Assistant Guidelines Prompt
```
Create CLAUDE.md file with comprehensive AI assistant guidelines:

**Project Context:**
- Detailed project overview and architecture
- Technology stack and framework choices
- Coding conventions and standards
- Development workflow and procedures

**AI Assistant Instructions:**
- Code style preferences and patterns
- Framework-specific best practices
- Security considerations and requirements
- Performance optimization guidelines
- Testing strategies and approaches

**File Structure Guidelines:**
- Directory organization principles
- File naming conventions
- Import/export patterns
- Component structure standards

**Development Workflow:**
- Git branching strategy
- Commit message conventions
- Pull request procedures
- Code review guidelines
- Release management process

**Deployment Instructions:**
- Environment configuration
- Docker container management
- CI/CD pipeline procedures
- Monitoring and logging setup

**Quality Assurance:**
- Testing requirements and coverage
- Security scanning procedures  
- Performance benchmarking
- Code quality metrics

Create comprehensive AI assistant guidelines to ensure consistent development practices and code quality.
```

## 7. Team Collaboration Setup Prompts

### 7.1 Team Workflow Setup Prompt
```
Configure team collaboration tools and workflows:

**GitHub Team Configuration:**
- Team creation and member assignment
- Repository access levels (admin, write, read)
- Code owners file (CODEOWNERS) for automatic review assignment
- Team-based branch protection rules

**Pull Request Templates:**
- Comprehensive PR template with checklists
- Issue linking requirements
- Testing verification steps
- Security checklist items
- Performance impact assessment

**Issue Templates:**
- Bug report template with reproduction steps
- Feature request template with acceptance criteria
- Security vulnerability report template
- Documentation improvement template

**Code Review Guidelines:**
- Review assignment automation
- Review criteria and standards
- Approval requirements
- Review time expectations
- Conflict resolution procedures

**Communication Channels:**
- Slack/Teams integration for notifications
- Code review discussion guidelines
- Release announcement procedures
- Incident communication protocols

Configure complete team collaboration workflow with automated processes and clear guidelines.
```

### 7.2 Knowledge Management Prompt
```
Set up comprehensive knowledge management system:

**Documentation Organization:**
- Wiki or knowledge base setup
- Document categorization and tagging
- Search functionality implementation
- Regular documentation review process

**Code Documentation:**
- Inline code comments standards
- API documentation generation
- Component documentation with examples
- Architecture documentation maintenance

**Process Documentation:**
- Standard operating procedures (SOPs)
- Runbooks for common tasks
- Troubleshooting guides
- Emergency response procedures

**Training Materials:**
- Onboarding documentation for new team members
- Technology-specific training guides
- Best practices documentation
- Code review training materials

**Knowledge Sharing:**
- Regular knowledge sharing sessions
- Code walkthrough procedures
- Architecture review meetings
- Lessons learned documentation

Create comprehensive knowledge management system to support team collaboration and knowledge transfer.
```

## 8. Monitoring and Analytics Setup Prompts

### 8.1 Application Monitoring Prompt
```
Implement comprehensive application monitoring and observability:

**Performance Monitoring:**
- Application Performance Monitoring (APM) setup
- Response time and throughput tracking
- Database query performance monitoring
- Memory and CPU usage tracking

**Error Tracking:**
- Error monitoring with Sentry or similar
- Error categorization and prioritization
- Error notification and alerting
- Error resolution tracking

**Logging Infrastructure:**
- Structured logging implementation
- Log aggregation and centralization
- Log retention and archival policies
- Log analysis and alerting rules

**Health Checks:**
- Application health endpoint implementation
- Database connectivity checks
- External service dependency checks
- Infrastructure health monitoring

**Business Metrics:**
- User engagement tracking
- Feature usage analytics
- Performance benchmarking
- Business KPI monitoring

**Alerting System:**
- Real-time alert configuration
- Alert severity levels and escalation
- On-call rotation setup
- Alert fatigue prevention

Configure comprehensive monitoring system with proactive alerting and detailed observability.
```

### 8.2 Analytics and Reporting Prompt  
```
Set up analytics and reporting infrastructure:

**Performance Analytics:**
- Application performance dashboards
- User experience metrics
- Performance trend analysis
- Capacity planning metrics

**Security Analytics:**
- Security event monitoring
- Vulnerability trend analysis
- Compliance reporting
- Security incident tracking

**Development Metrics:**
- Code quality metrics tracking
- Deployment frequency and success rates
- Lead time and cycle time measurement
- Team productivity metrics

**Business Intelligence:**
- User behavior analytics
- Feature adoption tracking
- Revenue impact analysis
- Customer satisfaction metrics

**Reporting Automation:**
- Automated daily/weekly/monthly reports
- Executive dashboard creation
- Stakeholder notification system
- Report scheduling and distribution

Configure comprehensive analytics and reporting system for data-driven decision making.
```

## Usage Instructions

### For AI Assistants:
1. Copy the relevant prompt sections based on your setup needs
2. Customize project-specific details (names, ports, domains)
3. Provide the prompt to your AI assistant
4. Review and validate the generated configurations
5. Implement following your organization's approval process

### For Manual Setup:
1. Use prompts as comprehensive checklists
2. Follow the requirements specifications exactly
3. Validate each configuration step
4. Test all integrations thoroughly
5. Document any deviations or customizations

### For Team Onboarding:
1. Share this document with new team members
2. Use as training material for Git workflows
3. Reference during code review discussions
4. Update based on team feedback and lessons learned

## Maintenance and Updates

- Review and update prompts quarterly
- Incorporate lessons learned from implementations
- Update based on technology stack changes
- Maintain compatibility with latest tooling versions
- Gather feedback from development teams for improvements