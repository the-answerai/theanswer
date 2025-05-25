# Deploying to Render

This document provides information about deploying the application to Render.

## Build Process

The application uses a custom build script (`build-render.sh`) for deployment on Render. This script:

1. Copies Render-specific `.npmrc` configuration
2. Installs server dependencies
3. Approves builds for specific packages that require build scripts
4. Updates the client's pnpm-lock.yaml file to match package.json
5. Installs client dependencies with `--no-frozen-lockfile` to handle mismatches
6. Builds the client application

## Troubleshooting

### Package.json and pnpm-lock.yaml Mismatch

If you encounter an error like this during deployment:

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json
```

You can fix it by:

1. Running `pnpm run update-client-lock` locally to update the client's lock file
2. Committing the updated lock file to your repository
3. Redeploying to Render

### Build Script Approval

The build process automatically approves build scripts for these packages:

-   @ffmpeg-installer/linux-x64
-   es5-ext
-   ngrok

If you need to approve additional packages, add them to the `pnpm approve-builds` command in `build-render.sh`.

## Environment Configuration

The application supports multiple environments:

-   local
-   prime
-   wow
-   rds

Render deployments typically use the production environment, which loads environment variables from `.env` or directly from Render's environment variables configuration.

## Memory Configuration

The client build process uses increased memory allocation (4GB) to prevent out-of-memory errors during the build:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

If you encounter memory-related issues during deployment, you may need to adjust this value or upgrade your Render instance type.
