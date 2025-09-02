# Deploy

## AAI Application Workspace

**Use when**: Working in the main AAI application workspace

**Important**: Remove or comment out aliases in the manifest during deployments and manually set the API_HOST variable

```bash
copilot deploy
```

## Client App Workspace

**Use when**: Working in client-specific workspace (auto-switches app name)

### Environment Setup

```bash
# Staging environment
CLIENT_DOMAIN=staging.client.theanswer.ai
AUTH0_BASE_URL=https://staging.client.theanswer.ai

# Production environment
CLIENT_DOMAIN=client.theanswer.ai
AUTH0_BASE_URL=https://client.theanswer.ai
```

### Deploy Command

```bash
pnpm copilot deploy
```

## Quick Reference

-   **AAI workspace**: `copilot deploy` (remove aliases first, set API_HOST)
-   **Client workspace**: `pnpm copilot deploy` (auto-switching)
