# BWS Secure Tests

This directory contains test scripts for the BWS Secure environment management system.

## Automated tests (node --test)

Run from the repo root:

```bash
npm run test:bws-env    # unit tests for parsing / serialization
npm run test:e2e        # full end-to-end runs of secureRun.js
npm test                # both suites (14 tests)
```

### `bws-env-utils.test.mjs` (unit)

Covers `parseProjectIds`, UUID validation / dedupe / invalid segments, and the multiline-safe
`serializeEnvRecordToPlaintext` <-> `parseEnvironmentOutput` round-trip used by the encrypted
`.env.secure.*` files.

### `e2e/secureRun.e2e.test.mjs` (end-to-end, Unix-only)

Spawns the real `secureRun.js` against a fake `bws` CLI in a simulated consumer repo
(`<tmp>/scripts/bws-secure/` + `<tmp>/node_modules/.bin/bws` shim + `<tmp>/.env`).
Scenarios covered:

- single UUID direct `BWS_PROJECT_ID` bypass (backward compat)
- multi-UUID direct bypass with overlay order (later wins) and `BWS_PROJECT_IDS` exposed
- invalid UUID segments skipped, valid UUIDs still load
- duplicate UUIDs deduped (case-insensitive)
- cleanup: `.env.secure*` files removed after a successful run
- `BWS_KEEP_SECURE_FILES=true` preserves `.env.secure*`
- `BWS_MULTI_PROJECT_FAIL_FAST=true` exits non-zero on partial failure
- multiline secret (private-key style) round-trips through the merge unchanged

Cross-platform: on Unix the fake `bws` is a `#!/usr/bin/env node` shebang script; on Windows
a `bws.cmd` wrapper is generated alongside a placeholder `bws` file (so
`ensureBwsInstalled()`'s existence check passes and `cmd.exe` resolves the explicit path via
`PATHEXT`). Set `E2E_DISABLE_WINDOWS=1` to skip the suite on Windows if a host misbehaves.

## Available Tests (manual integration)

### Vercel API Test

Tests connectivity with the Vercel API and helps diagnose issues with project detection by searching across all teams and personal projects.

**Usage with npm script:**

```bash
# List all projects
pnpm run vercel-api-test

# Search for a specific project
pnpm run vercel-api-test <project-name>
```

**Usage with shell script:**

```bash
# List all projects
./scripts/bws-secure/tests/test-vercel-api.sh

# Search for a specific project
./scripts/bws-secure/tests/test-vercel-api.sh <project-name>
```

### Vercel Upload Test

Tests the upload functionality to Vercel environments.

```bash
pnpm run test:vercel
```

### Netlify Upload Test

Tests the upload functionality to Netlify environments.

```bash
pnpm run test:netlify
```

## Requirements

Before running tests, ensure you have:

1. Proper authentication tokens set in your `.env` file:

   - `VERCEL_AUTH_TOKEN` for Vercel tests
   - `NETLIFY_AUTH_TOKEN` for Netlify tests

2. Required dependencies installed:
   ```bash
   pnpm install
   ```

## Troubleshooting Vercel Projects

If you're having trouble with Vercel projects not being found, the most common issue is that the project exists in a different team than the script is checking. You can run the API test to identify where the project is located:

```bash
./scripts/bws-secure/tests/test-vercel-api.sh your-project-name
```

The script will search across all teams and personal projects to help you locate your project.
