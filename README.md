# Filename Generator

A Next.js application for generating filenames based on Brain ID, series type, and section information.

## Features

- React/Next.js frontend
- Node.js/Next.js API backend
- Filename generation based on Brain ID, series type, and section
- Editable filename output
- Copy to clipboard functionality
- Enterprise-grade Git workflow
- Comprehensive CI/CD pipeline

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd sivaDemo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up pre-commit hooks

```bash
npx husky install
```

### 4. Initialize the Next.js project

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

### 5. Start development server

```bash
npm run dev
```

## Git Workflow

This project follows Git Flow. See [BRANCHING_STRATEGY.md](./BRANCHING_STRATEGY.md) for details.

### Quick Start:
```bash
# Create a feature branch
git checkout -b feature/your-feature-name develop

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests

## CI/CD

GitHub Actions workflows handle:
- Automated testing and linting
- Security scanning
- Staging deployments (main branch)
- Production deployments (version tags)
- Docker image building

## Docker

### Development
```bash
docker-compose up dev
```

### Production
```bash
docker-compose up app
```

## Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request
5. Wait for code review

## License

[Your License Here]