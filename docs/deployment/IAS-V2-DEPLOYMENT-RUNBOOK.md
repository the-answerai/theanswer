# IAS v2.0 Production Deployment Runbook

**Project:** IAS v2.0 Production Deployment
**Target Date:** February 7, 2026
**Priority:** Urgent
**Status:** Blocked - Pending @integralads account access

---

## Overview

This runbook documents the complete deployment process for AnswerAgent v2.0 to IAS (Integral Ad Science) production environment. It includes all critical bug fixes and stability improvements required for production readiness.

---

## Pre-Deployment Checklist

### 1. Access Requirements

- [ ] **@integralads Account Access** - Max needs access to @integralads platform account
  - Contact: [TBD - IAS Admin Contact]
  - Required permissions: AWS Console access, Render Dashboard, or equivalent
  - Status: **BLOCKED**

### 2. Environment Configuration

Depending on the deployment platform (Render vs AWS Copilot), prepare the appropriate configuration:

#### Option A: Render Deployment

Reference: `/render.yaml`

Required environment variables:
- [ ] `AUTH0_DOMAIN` - IAS-specific Auth0 tenant
- [ ] `AUTH0_BASE_URL` - Production URL (e.g., `https://ias.theanswer.ai`)
- [ ] `AUTH0_SECRET` - Secret for session management
- [ ] `AUTH0_CLIENT_ID` - IAS Auth0 application ID
- [ ] `AUTH0_CLIENT_SECRET` - IAS Auth0 application secret
- [ ] `AUTH0_AUDIENCE` - IAS Auth0 API audience
- [ ] `AUTH0_ISSUER_BASE_URL` - Auth0 issuer URL
- [ ] `AUTH0_ORGANIZATION_ID` - IAS organization ID
- [ ] `AUTH0_JWKS_URI` - JWKS URI for token validation
- [ ] `FLOWISE_SECRETKEY_OVERWRITE` - **CRITICAL**: Encryption key for credentials
  - Generate with: `openssl rand -base64 32`
  - Store securely - losing this invalidates all stored credentials
- [ ] `S3_STORAGE_BUCKET_NAME` - S3 bucket for file storage
- [ ] `S3_STORAGE_ACCESS_KEY_ID` - AWS access key
- [ ] `S3_STORAGE_SECRET_ACCESS_KEY` - AWS secret key
- [ ] `S3_STORAGE_REGION` - AWS region
- [ ] `AAI_DEFAULT_OPENAI_API_KEY` - OpenAI API key for AI features
- [ ] `BILLING_STRIPE_SECRET_KEY` - Stripe key (if billing enabled)

#### Option B: AWS Copilot Deployment

Reference: `/copilot/` directory

1. **Environment Files to Prepare:**
   - Copy `copilot/copilot.appName.env.template` to `copilot.ias.env`
   - Copy `copilot/copilot.appName.web.env.template` to `copilot.ias.web.env`

2. **Initialize Application:**
   ```bash
   # For production
   copilot app init --domain ias.theanswer.ai
   ```

3. **Environment Variables:**
   - Configure in `copilot.ias.env` (Flowise backend)
   - Configure in `copilot.ias.web.env` (Next.js web frontend)
   - Set `CLIENT_DOMAIN=ias.theanswer.ai`
   - Set `AUTH0_BASE_URL=https://ias.theanswer.ai`

### 3. Database Preparation

- [ ] Verify database instance is provisioned
- [ ] Run Prisma migrations: `pnpm db:deploy`
- [ ] Run TypeORM migrations: `pnpm migration:run`
- [ ] Verify pgvector extension is installed (required for vector stores)
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### 4. Auth0 Configuration

- [ ] Create or verify IAS Auth0 organization
- [ ] Configure Auth0 application with correct callback URLs:
  - `https://ias.theanswer.ai/api/auth/callback`
  - `https://api.ias.theanswer.ai/api/v1/google-auth/callback` (if Google OAuth needed)
- [ ] Configure Auth0 API with correct audience
- [ ] Add organization-specific metadata/settings
- [ ] Set up user roles: Admin, Builder, Member
- [ ] Configure Auth0 Rules/Actions if needed

### 5. DNS Configuration

- [ ] Configure DNS for `ias.theanswer.ai`
- [ ] Configure DNS for `api.ias.theanswer.ai`
- [ ] Configure DNS for `flowise.ias.theanswer.ai` (optional)
- [ ] Configure DNS for `web.ias.theanswer.ai` (optional)
- [ ] Verify SSL certificates are provisioned

---

## Known Issues to Monitor (IAS Project)

The following issues are part of the IAS v2.0 deployment project and should be verified:

### Completed (Verify in Production)
- [x] **AGENT-149:** Agent flow templates from marketplace only show start node - FIXED
- [x] **AGENT-639:** Fix queryVectorStore not finding document stores - FIXED

### In Progress (May affect deployment)
- [ ] **AGENT-660:** Session timeout error when switching organizations (High priority)

### Pending (Track for post-deployment)
- [ ] **AGENT-76:** Canvas not updated after credential modal saved (High priority)
- [ ] **AGENT-661:** Draft message loss on ArrowDown in chat input (High priority)
- [ ] **AGENT-664:** Template settings persistence feature
- [ ] **AGENT-567:** Langfuse token calculation in sub-workflows (Urgent)
- [ ] **AGENT-583:** Malformed API key edit causes 500 error (High priority)

---

## Deployment Steps

### Step 1: Verify Build

```bash
# In the repository root
pnpm install
pnpm build

# Run tests
pnpm test:auth
pnpm test:chatflows
```

### Step 2: Deploy to Staging (if available)

Test deployment in staging environment first if IAS has a staging environment.

### Step 3: Production Deployment

#### Render Deployment

1. Access Render dashboard for IAS workspace
2. Create/update web service for `aai-ias-web`
3. Create/update web service for `aai-ias-flowise`
4. Create/update Redis instance `aai-ias-redis`
5. Create/update PostgreSQL database `aai-ias-database`
6. Configure all environment variables
7. Deploy services

#### AWS Copilot Deployment

```bash
# Ensure correct app is initialized
copilot app ls

# Deploy to production
copilot deploy --env prod
```

### Step 4: Post-Deployment Verification

- [ ] Verify health check endpoints:
  - `https://api.ias.theanswer.ai/api/v1/ping` (Flowise)
  - `https://ias.theanswer.ai/healthcheck` (Web)
- [ ] Test Auth0 login flow
- [ ] Verify database connectivity
- [ ] Test creating a new chatflow
- [ ] Test credential creation and encryption
- [ ] Verify file uploads work (S3 storage)
- [ ] Test agent execution
- [ ] Check Langfuse tracing (if configured)

---

## Rollback Plan

If issues are detected post-deployment:

### Render
1. Navigate to deployment history in Render dashboard
2. Select previous working deployment
3. Click "Rollback"

### AWS Copilot
```bash
# List deployments
copilot svc show --name flowise

# Rollback (if available)
# May need to redeploy previous commit
git checkout <previous-commit>
copilot deploy
```

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Deployment Lead | Max Techera | [TBD] |
| IAS Admin | TBD | [TBD] |
| On-call Engineer | TBD | [TBD] |

---

## Security Reminders

1. **Never commit credentials** - Use environment variables or secrets management
2. **FLOWISE_SECRETKEY_OVERWRITE** - Store securely; cannot be regenerated without losing credential access
3. **Database access** - Use allowlists for database IP access
4. **Auth0 secrets** - Rotate periodically and store in secure secrets manager
5. **API keys** - Use organization-scoped keys with minimal permissions

---

## Related Documentation

- [AWS Copilot README](/copilot/README.md)
- [BWS Secure Environment Manager](/scripts/bws-secure/README.md)
- [Auth0 Setup Guide](/scripts/auth0-setup-guide.md)
- [Render Configuration Template](/render.yaml)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-05 | 1.0 | Claude Code | Initial runbook created for AGENT-662 |
