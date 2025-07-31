# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Next.js-based Filename Generator application with the following features:
- React/Next.js frontend with TypeScript
- Node.js/Next.js API backend
- Generates filenames based on Brain ID, Series Type, and Section
- Editable filename output with copy-to-clipboard functionality
- Enterprise-grade Git workflow with CI/CD pipelines

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/types/` - TypeScript type definitions
- `src/__tests__/` - Jest test files
- `.github/workflows/` - CI/CD pipeline configurations

## Git Workflow

This project follows an enterprise Git Flow branching strategy:
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: New features (merge to develop)
- **release/***: Release preparation (merge to main and develop)
- **hotfix/***: Critical fixes (merge to main and develop)

See `BRANCHING_STRATEGY.md` for detailed workflow instructions.

## CI/CD Pipeline

GitHub Actions workflows are configured for:
1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Linting (ESLint, Prettier)
   - Type checking (TypeScript)
   - Unit tests with coverage
   - Security scanning
   - Multi-version Node.js testing

2. **CD Pipeline** (`.github/workflows/cd.yml`):
   - Automatic staging deployment on main branch
   - Production deployment on version tags
   - Docker image building and pushing
   - GitHub release creation

3. **Security** (`.github/workflows/codeql.yml`):
   - CodeQL security analysis
   - Scheduled vulnerability scanning

## Pre-commit Hooks

Pre-commit hooks are configured to ensure code quality:
- Code formatting (Prettier)
- Linting (ESLint)
- Commit message validation (Conventional Commits)
- Type checking
- Prevent commits to protected branches

Install hooks after cloning: `npm install && npx husky install`

## Development Commands

Once the Next.js project is initialized, use these commands:
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Run Prettier
npm run format:check # Check Prettier formatting
npm run type-check   # Run TypeScript compiler
npm test             # Run tests
npm test:watch       # Run tests in watch mode
npm test:coverage    # Run tests with coverage
```

## Architecture Overview

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React useState hooks
- **Notifications**: react-hot-toast

### Backend
- **API**: Next.js API Routes
- **Endpoint**: `/api/generate-filename` - POST endpoint that accepts Brain ID, Series Type, and Section
- **Health Check**: `/api/health` - GET endpoint for Docker health checks

### Filename Generation Logic
The API generates filenames in the format: `BRAINID_SERIESTYPE_section_TIMESTAMP`
- Brain ID: Uppercase, alphanumeric only
- Series Type: Uppercase, alphanumeric only  
- Section: Lowercase, alphanumeric only
- Timestamp: ISO 8601 format without special characters

### Testing
- **Framework**: Jest with React Testing Library
- **Coverage**: API endpoints and React components
- **Run Tests**: `npm test`