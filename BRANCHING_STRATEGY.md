# Git Branching Strategy

## Overview
This document outlines the Git branching strategy for enterprise-level development, ensuring code quality, collaboration, and reliable deployments.

## Branch Types

### 1. Main Branches
- **main** (or master): Production-ready code. Protected branch with strict merge requirements.
- **develop**: Integration branch for features. All feature branches merge here first.

### 2. Supporting Branches

#### Feature Branches
- **Naming**: `feature/JIRA-123-description` or `feature/description`
- **Created from**: `develop`
- **Merge back to**: `develop`
- **Purpose**: New features or enhancements

#### Release Branches
- **Naming**: `release/v1.2.0`
- **Created from**: `develop`
- **Merge back to**: `main` and `develop`
- **Purpose**: Prepare for production release

#### Hotfix Branches
- **Naming**: `hotfix/JIRA-456-description` or `hotfix/v1.2.1`
- **Created from**: `main`
- **Merge back to**: `main` and `develop`
- **Purpose**: Critical production fixes

#### Bugfix Branches
- **Naming**: `bugfix/JIRA-789-description`
- **Created from**: `develop`
- **Merge back to**: `develop`
- **Purpose**: Non-critical bug fixes

## Branch Protection Rules

### Main Branch
- Require pull request reviews (minimum 2 approvals)
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions
- Restrict who can push to matching branches

### Develop Branch
- Require pull request reviews (minimum 1 approval)
- Require status checks to pass before merging
- Require branches to be up to date before merging

## Workflow

### Feature Development
```bash
# Create feature branch
git checkout -b feature/JIRA-123-new-feature develop

# Work on feature
git add .
git commit -m "feat: implement new feature"

# Keep branch updated
git checkout develop
git pull origin develop
git checkout feature/JIRA-123-new-feature
git rebase develop

# Push and create PR
git push origin feature/JIRA-123-new-feature
```

### Release Process
```bash
# Create release branch
git checkout -b release/v1.2.0 develop

# Bump version numbers, update changelog
git commit -m "chore: bump version to 1.2.0"

# After testing, merge to main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.2.0
```

### Hotfix Process
```bash
# Create hotfix from main
git checkout -b hotfix/v1.2.1 main

# Fix the issue
git commit -m "fix: critical production issue"

# Merge to main
git checkout main
git merge --no-ff hotfix/v1.2.1
git tag -a v1.2.1 -m "Hotfix version 1.2.1"

# Merge to develop
git checkout develop
git merge --no-ff hotfix/v1.2.1
```

## Commit Message Convention

Follow the Conventional Commits specification:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements

Format: `<type>(<scope>): <subject>`

Example: `feat(auth): add OAuth2 integration`

## Pull Request Guidelines

1. Fill out the PR template completely
2. Link related issues
3. Ensure all CI checks pass
4. Request reviews from appropriate team members
5. Address all review comments
6. Squash commits if necessary before merging

## Merge Strategies

- **Feature → Develop**: Squash and merge
- **Release → Main**: Create a merge commit (--no-ff)
- **Hotfix → Main**: Create a merge commit (--no-ff)
- **Main → Develop**: Create a merge commit (--no-ff)