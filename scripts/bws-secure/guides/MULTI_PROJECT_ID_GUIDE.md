# Multi-Project ID Support Guide

## Overview

BWS Secure now supports loading secrets from multiple BWS project IDs simultaneously. This allows you to have a "main" source of truth for shared/common variables and load differentiating or additional variables from other projects.

## Key Features

- ✅ **Backward Compatible**: Single project IDs still work exactly as before
- ✅ **Comma-Separated Format**: Use simple comma-separated strings
- ✅ **Overlay Strategy**: Later project IDs override earlier ones for duplicate variables
- ✅ **Two Configuration Methods**: Works with both `BWS_PROJECT_ID` env var and `bwsconfig.json`

### Child process environment

After `secureRun` loads secrets, the wrapped command receives:

- **`BWS_PROJECT_ID`**: the **first** (primary) UUID in your list — safe for tools that expect a single project id.
- **`BWS_PROJECT_IDS`**: set only when multiple IDs were used; comma-separated ordered list (same overlay order as loading).

Invalid segments in a comma-separated list are skipped with a warning; duplicate UUIDs are deduped (case-insensitive) with a warning.

### Partial failures

By default, if one project fails to load (network, permissions, missing project), loading **continues** and earlier projects still apply. Warnings explain which IDs failed.

Set **`BWS_MULTI_PROJECT_FAIL_FAST=true`** (alias: **`BWS_MULTI_PROJECT_FAIL_ON_PARTIAL=true`**) to **exit immediately** on the first failed project load when multiple IDs are configured.

### Local multi-project mapping

For **multiple** project IDs, `secureRun` writes a merged encrypted file **`.env.secure.<environment>`** (e.g. `.env.secure.local`) so `update-environments/map-env-files.js` can symlink it. Single-ID setups continue to use **`.env.secure.<uuid>`** only.

## Configuration Methods

### Method 1: Direct Environment Variable

Use comma-separated project IDs in the `BWS_PROJECT_ID` environment variable:

```bash
# Single project (backward compatible)
BWS_PROJECT_ID="2d8c63de-62d5-4604-bb43-b357000e00b7" pnpm dev

# Multiple projects (new feature)
BWS_PROJECT_ID="2d8c63de-62d5-4604-bb43-b357000e00b7, 8686161e-6b41-4498-b7bf-b3390109f1d3" pnpm dev
```

### Method 2: Configuration File

Use comma-separated project IDs in your `bwsconfig.json`:

```json
{
  "projects": [
    {
      "platform": "vercel|netlify",
      "projectName": "myProject",
      "bwsProjectIds": {
        "local": "2d8c63de-62d5-4604-bb43-b357000e00b7",
        "dev": "8686161e-6b41-4498-b7bf-b3390109f1d3",
        "prod": "2d8c63de-62d5-4604-bb43-b357000e00b7, 8686161e-6b41-4498-b7bf-b3390109f1d3"
      },
      "preserveVars": ["BWS_ACCESS_TOKEN"]
    }
  ]
}
```

## Variable Overlay Strategy

When multiple project IDs are specified, secrets are loaded in order with a "last wins" strategy:

1. **Load Project ID 1** → Base set of variables
2. **Load Project ID 2** → Overlays and overrides duplicates from Project 1
3. **Load Project ID 3** → Overlays and overrides duplicates from Projects 1 & 2
4. **Result**: Later project IDs take precedence for matching variable names

### Example Scenario

**Project 1 Secrets:**
```
API_KEY=shared-key
DATABASE_URL=postgres://shared-db
SERVICE_NAME=shared-service
```

**Project 2 Secrets:**
```
DATABASE_URL=postgres://specific-db
CUSTOM_VAR=specific-value
```

**Final Merged Result:**
```
API_KEY=shared-key              # From Project 1
DATABASE_URL=postgres://specific-db  # From Project 2 (overrides Project 1)
SERVICE_NAME=shared-service     # From Project 1
CUSTOM_VAR=specific-value       # From Project 2
```

## Use Cases

### Shared Common Variables

Have 90% of variables in a "main" project and load differentiating variables from additional projects:

```json
{
  "projects": [
    {
      "platform": "vercel",
      "projectName": "myApp",
      "bwsProjectIds": {
        "local": "main-project-id, environment-specific-id"
      }
    }
  ]
}
```

### Multi-Environment Configurations

Load different combinations of secrets for different environments:

```json
{
  "bwsProjectIds": {
    "local": "shared-secrets-id",
    "dev": "shared-secrets-id, dev-specific-id",
    "prod": "shared-secrets-id, prod-specific-id, compliance-id"
  }
}
```

### Feature-Based Secret Management

Organize secrets by feature and compose them as needed:

```json
{
  "bwsProjectIds": {
    "local": "base-config-id, auth-feature-id, payment-feature-id"
  }
}
```

## Progress Indicators

When loading multiple project IDs, the tool displays progress indicators:

```
[█████████████░░░░░░░░░░░░] 67% | Environment Setup [2/3] Loading secrets from project 2
```

## Debug Logging

Enable debug logging to see detailed information about multi-project loading:

```bash
DEBUG=true BWS_PROJECT_ID="id1, id2, id3" pnpm dev
```

Debug output will show:
- Number of secrets loaded from each project
- Total merged variables
- Which project IDs are being processed

## Backward Compatibility

All existing single-project configurations continue to work without any changes:

```bash
# Still works exactly as before
BWS_PROJECT_ID="2d8c63de-62d5-4604-bb43-b357000e00b7" pnpm dev
```

```json
{
  "bwsProjectIds": {
    "local": "2d8c63de-62d5-4604-bb43-b357000e00b7"
  }
}
```

## Validation

Project IDs are validated as proper UUIDs. Invalid UUIDs in the comma-separated string are automatically filtered out with a warning:

```
Warning: BWS_PROJECT_ID is set but no valid UUIDs found
```

## Platform Builds (Netlify/Vercel)

Multi-project ID support works seamlessly with platform builds. Each environment's project IDs are loaded and merged before deployment.

## Examples

### Example 1: Simple Two-Project Setup

```bash
# Load base configuration + environment-specific overrides
BWS_PROJECT_ID="base-config-uuid, local-overrides-uuid" pnpm dev
```

### Example 2: Complex Multi-Environment

```json
{
  "projects": [
    {
      "platform": "vercel",
      "projectName": "myApp",
      "bwsProjectIds": {
        "local": "shared-id",
        "dev": "shared-id, dev-id",
        "prod": "shared-id, prod-id, monitoring-id"
      }
    }
  ]
}
```

### Example 3: Feature Composition

```bash
# Compose secrets from multiple feature-specific projects
BWS_PROJECT_ID="base-uuid, auth-uuid, payments-uuid, analytics-uuid" pnpm dev
```

## Optional: adopting multiple project IDs

There is **no required migration**. Existing single-UUID configs and `BWS_PROJECT_ID=one-uuid` continue to work unchanged. This section is only if you **choose** to split or layer secrets across more than one BWS project:

1. Keep your current project ID as the first (base) ID in the list.
2. Add any additional BWS projects you need.
3. Use a comma-separated list in `bwsconfig.json` or `BWS_PROJECT_ID` (see examples above).
4. Verify overlay order locally with `DEBUG=true` before rolling out.

## Best Practices

1. **Order Matters**: List project IDs from most general to most specific
2. **Document Intent**: Add comments in your config explaining why multiple projects are used
3. **Keep it Simple**: Don't over-complicate - use multiple IDs only when beneficial
4. **Test Overlays**: Verify that variable overrides work as expected in debug mode
5. **Monitor Loading**: Check debug logs to ensure all projects load successfully

## Troubleshooting

### No secrets loaded
- Verify all project IDs are valid UUIDs
- Check that BWS_ACCESS_TOKEN has access to all project IDs
- Enable DEBUG=true to see detailed loading information

### Unexpected variable values
- Review the order of project IDs (last wins for duplicates)
- Use DEBUG=true and SHOW_DECRYPTED=true to inspect merged results
- Verify each project contains expected secrets in BWS

### Performance concerns
- Each project ID requires an API call to BWS
- Results are cached to avoid redundant loading
- Consider consolidating if loading too many projects becomes slow

## Technical Details

### Implementation

- **Parsing**: `parseProjectIds()` function validates and extracts UUIDs
- **Loading**: Each project is loaded sequentially with retry logic
- **Merging**: `Object.assign()` provides the overlay strategy
- **Caching**: Loaded project IDs are tracked to prevent duplicate API calls

### Files Modified

- `bws-dotenv.js` - Core secret loading logic
- `secureRun.js` - Main execution and environment setup
- `testFolder/bwsconfig.json` - Example configuration

## Support

For issues, questions, or feature requests related to multi-project ID support, please refer to the main repository README or open an issue.

