# Deployment Guide

## Overview
This project uses Firebase App Hosting (beta feature), which provides an integrated deployment pipeline with GitHub integration, Cloud Build, and Cloud Run. This is different from traditional Firebase Hosting and offers several benefits:

### Benefits
- Automated container builds using Cloud Buildpacks
- Integrated secrets management
- Preview channels for beta testing
- Automatic SSL/TLS certificate management
- Global CDN distribution
- Seamless integration with Firebase services

## Branch Strategy

### Main Branch (`main`)
- Production code
- Deploys automatically to production environment
- Protected branch, requires PR review

### Beta Branch (`beta`)
- Pre-production testing
- Deploys automatically to beta environment
- Source for production PRs

### Feature Branches
- Named `feature/[feature-name]`
- Merge into `beta` for testing
- Create PR to `main` when ready for production

### Branch Naming Conventions
```
feature/[type]-[description]

Types:
- doc-*     Documentation changes
- feat-*    New features
- fix-*     Bug fixes
- refactor-* Code restructuring

Examples:
- feature/doc-deployment  # documentation updates
- feature/feat-auth      # new auth feature
- feature/fix-token      # fix token handling
```

### Branch Flows
1. Features requiring testing:
   ```
   feature/feat-new-auth → beta → main
   ```
2. Documentation/simple fixes:
   ```
   feature/doc-update → main
   ```

### Branch Management

#### Listing Branches
```bash
# List local branches
git branch

# List all branches (including remote)
git branch -a

# List merged branches
git branch --merged
```

#### Cleaning Up Branches
```bash
# Delete remote branch
git push origin --delete branch-name

# Delete local branch
git branch -d branch-name  # Safe delete (only if merged)
git branch -D branch-name  # Force delete

# Prune deleted remote branches from local
git fetch --prune
```

#### Best Practices
1. Bundle small changes together for deployment efficiency
   - Keep feature branches until ready for a batch deployment
   - Create a single PR combining multiple features
   - Reduces unnecessary Cloud Run builds

2. Track pending branches
   - Keep a list of branches pending merge
   - Review regularly to ensure nothing is forgotten
   - Clean up after successful merges

3. Regular maintenance
   - Delete branches after merging
   - Run `git fetch --prune` periodically
   - Review old branches monthly

### Common Git Commands

#### Starting New Feature
```bash
# Save current changes if needed
git stash

# Get latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/doc-update

# Restore changes if needed
git stash pop
```

#### Working with Changes
```bash
# Stage changes
git add .

# Commit
git commit -m 'doc: update deployment guide'

# Push to remote
git push origin feature/doc-update
```

#### Feature Testing Flow
```bash
# Push feature to beta
git checkout beta
git pull origin beta
git merge feature/feat-new-auth
git push origin beta
```

#### Documentation Flow
```bash
# Create PR directly to main
# Use GitHub UI or:
gh pr create --base main --head feature/doc-update
```

## Deployment Workflow

### Beta Deployment
To deploy a beta version:
1. Create feature branch from main:
   ```bash
   git checkout -b feature/new-feature main
   ```
2. Make and test changes locally
3. Push feature branch:
   ```bash
   git push origin feature/new-feature
   ```
4. Merge to beta branch:
   ```bash
   git checkout beta
   git merge feature/new-feature
   git push origin beta
   ```
5. Firebase App Hosting automatically:
   - Builds container using Buildpacks
   - Deploys to beta channel
   - Creates preview URL: https://beta--[project-id].run.app

### Production Deployment
To deploy to production:
1. Create PR from `beta` to `main`
2. Review and test using beta URL
3. Merge PR into `main`
4. Firebase App Hosting automatically:
   - Builds production container
   - Deploys to production channel
   - Updates production URL: https://[project-id].web.app

## App Hosting Commands

### Create Beta Rollout
```bash
gcloud beta app-hosting backends create-rollout your-backend \
  --source . \
  --branch beta
```

### List Rollouts
```bash
gcloud beta app-hosting backends list-rollouts your-backend
```

### View Rollout Status
```bash
gcloud beta app-hosting backends describe-rollout your-backend rollout-id
```

## Environment Configuration
- All secrets and environment variables are managed through Google Cloud Secret Manager
- Configuration is automatically applied to both beta and production environments
- Environment-specific variables can be configured in Firebase Console

## Monitoring and Rollback
- Monitor deployments in Firebase Console > Hosting > App Hosting
- View logs in Google Cloud Console > Logging
- Rollback available through Firebase Console or CLI

## Best Practices
1. Always test changes in beta environment before production
2. Keep feature branches short-lived
3. Regular merges from main to beta to stay up-to-date
4. Monitor resource usage in both environments
5. Clean up old feature branches after merge
