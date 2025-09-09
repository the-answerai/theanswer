## Quick Reference

-   **AAI workspace**: `copilot deploy` (remove aliases first, set API_HOST)
-   **Client workspace**: `pnpm copilot deploy` (auto-switching)

## Environment Variables

-   Web: `copilot.appName.web.env`
-   Flowise: `copilot.appName.env`

## Environment Setup

### Staging Environment

```bash
CLIENT_DOMAIN=staging.client.theanswer.ai
AUTH0_BASE_URL=https://staging.client.theanswer.ai
```

### Production Environment

```bash
CLIENT_DOMAIN=client.theanswer.ai
AUTH0_BASE_URL=https://client.theanswer.ai
```

## AAI Application Workspace

**Use when**: Working in the main AAI application workspace

**Important**: Remove or comment out aliases in the manifest during deployments and manually set the API_HOST variable

```bash
copilot deploy
```

## Workspace Switching & App Initialization

Use the workspace switching method to align all URLs and Route53 zones:

-   **Staging**: `staging.client.theanswer.ai` → Route53 zone: `staging.client.theanswer.ai`
-   **Production**: `client.theanswer.ai` → Route53 zone: `client.theanswer.ai`

This ensures consistent domain naming across all services and eliminates URL conflicts.

### App Initialization Commands

```bash
# Staging Environment
copilot app init --domain staging.client.theanswer.ai

# Production Environment
copilot app init --domain client.theanswer.ai
```

## Client App Workspace

**Use when**: Working in client-specific workspace (auto-switches app name)

### Deploy Command

```bash
pnpm copilot deploy
```

## AWS Secrets Manager Integration

For enhanced security, configure AWS Secrets Manager to store the Flowise encryption key:

### Setup Commands

```bash
# Create the encryption key secret (if it doesn't exist)
aws secretsmanager create-secret \
  --name FlowiseEncryptionKey \
  --secret-string 'your-secure-encryption-key-here'

# Update an existing secret
aws secretsmanager put-secret-value \
  --secret-id FlowiseEncryptionKey \
  --secret-string 'your-new-encryption-key-here'
```

### Environment Configuration

Add to your `copilot.appName.env` file:

```bash
# Flowise Encryption Key Override - AWS Secrets Manager
SECRETKEY_STORAGE_TYPE="aws"
SECRETKEY_AWS_REGION="us-east-1"
SECRETKEY_AWS_NAME="FlowiseEncryptionKey"
```
