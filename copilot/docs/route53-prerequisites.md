## Overview

Before the `pnpm copilot:auto` will work properly, you must pre-configure your Route53 Hosted Zones.

## Base Domain Setup

**Primary Domain:** `example.theanswer.ai`

-   Create the main hosted zone in Route53
-   Must be in the same AWS account as your application
-   This serves as the base domain for all environments

## Environment-Specific Hosted Zones

Create separate hosted zones for each environment:

### Staging Environment

-   **Hosted Zone Name:** `staging.example.theanswer.ai`
-   **Purpose:** Staging/testing deployments
-   **NS Records:** Configure in both `example.theanswer.ai` and `theanswer.ai`

### Production Environment

-   **Hosted Zone Name:** `prod.example.theanswer.ai`
-   **Purpose:** Production deployments
-   **NS Records:** Configure in both `example.theanswer.ai` and `theanswer.ai`

### Optional Environments

Additional environments you can create:

-   `preview.example.theanswer.ai`, `dev.example.theanswer.ai`, `test.example.theanswer.ai`

## Required DNS Configuration Steps

1. **Create base hosted zone for prod** for `example.theanswer.ai`
2. **Create staging environment-specific hosted zone** (e.g., `staging.example.theanswer.ai`)
3. **Configure NS records** in **parent** domains to delegate to new hosted zones
4. **Verify DNS propagation** before proceeding ( https://www.whatsmydns.net/ )

Once these Route53 configurations are complete, the auto-generation process should be able to proceed fully.
