# Copilot Deployment

## Required Environment Variables

Export these locally or add to your `.env` file:

```bash
# For staging
CLIENT_DOMAIN=staging.client.theanswer.ai
AUTH0_BASE_URL=https://staging.client.theanswer.ai

# For production
CLIENT_DOMAIN=client.theanswer.ai
AUTH0_BASE_URL=https://client.theanswer.ai
```

## Deployment Options

**Option 1**: Load dotenv manually

```bash
source .env && copilot deploy
```

**Option 2**: Use pnpm precopilot (recommended)

```bash
pnpm precopilot
copilot deploy
```

**Option 3**: Auto-deploy with prompts

```bash
pnpm copilot:auto
```

## Note

All copilot commands now require either manual dotenv loading or the `pnpm` prefix to ensure the two required environment variables are properly loaded.
