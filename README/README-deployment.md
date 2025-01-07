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

## Deployment Workflow

### Beta Deployment
To deploy a beta version:
1. Create and checkout a new feature branch:
   ```bash
   git checkout -b beta/feature-name
   ```
2. Make and test your changes locally
3. Push changes to GitHub:
   ```bash
   git push origin beta/feature-name
   ```
4. Firebase App Hosting automatically:
   - Builds container using Buildpacks
   - Deploys to preview channel
   - Creates preview URL: https://beta--[project-id].web.app

### Production Deployment
To deploy to production:
1. Create a Pull Request from your beta branch to main
2. Review and test using the preview URL
3. Merge PR into main branch
4. Firebase App Hosting automatically:
   - Builds production container
   - Deploys to production channel
   - Updates production URL: https://[project-id].web.app

## Deployment Types

### Firebase App Hosting (Used in this project)
- Designed for containerized applications
- Uses Cloud Run and Buildpacks
- Configuration via Firebase Console or `gcloud beta app-hosting`
- Creates preview environments with full container builds
- Manages secrets and environment variables
- Example preview URL: `https://beta--your-project-id.run.app`

Commands:
```bash
# Create new rollout
gcloud beta app-hosting backends create-rollout your-backend \
  --source . \
  --branch beta

# List rollouts
gcloud beta app-hosting backends list-rollouts your-backend

# View rollout status
gcloud beta app-hosting backends describe-rollout your-backend rollout-id
```

### Firebase Hosting Preview Channels (Different Feature)
- Traditional Firebase Hosting feature
- For static content and simple functions
- Does not include container builds
- Example preview URL: `https://your-channel--your-project.web.app`

Commands:
```bash
# Create preview channel (NOT used in this project)
firebase hosting:channel:create channel-name

# Deploy to preview channel (NOT used in this project)
firebase hosting:channel:deploy channel-name
```

## Environment Configuration
- All secrets and environment variables are managed through Google Cloud Secret Manager
- Configuration is automatically applied to both beta and production environments
- Environment-specific variables can be configured in Firebase Console

## Monitoring and Rollback
- Monitor deployments in Firebase Console > Hosting > App Hosting
- View logs in Google Cloud Console > Logging
- Rollback available through Firebase Console or CLI

## Common Commands
```bash
# View current deployment status
firebase hosting:channel:list

# Create new preview channel
firebase hosting:channel:create beta

# Delete preview channel
firebase hosting:channel:delete beta

# View deployment history
firebase hosting:channel:deploy --only hosting
```

## Best Practices
1. Always test changes in beta channel before production
2. Use descriptive branch names (e.g., beta/auth-fix, beta/new-feature)
3. Keep beta deployments short-lived
4. Monitor resource usage in both channels
5. Clean up unused preview channels
