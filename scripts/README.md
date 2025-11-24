# TheAnswer Scripts

This directory contains utility scripts for the TheAnswer project.

## Table of Contents

- [Data Engine API Testing](#data-engine-api-testing)
- [OpenAPI Documentation Sync](#openapi-documentation-sync)
- [Other Scripts](#other-scripts)

## Data Engine API Testing

The `test-data-engine-api.js` script provides comprehensive testing for all Data Engine API endpoints.

### Features

- ✅ Complete CRUD operations testing (Create, Read, Update, Delete)
- ✅ Tests all 7 resource types: Domains, URLs, Calls, Tags, Documents, Tickets, Chats
- ✅ Pagination and filtering tests
- ✅ Search capabilities (including vector search for documents)
- ✅ Relationship testing (parent-child tags, domain-url associations)
- ✅ Automatic cleanup of test data
- ✅ Detailed pass/fail reporting
- ✅ **Custom domain support** - Perfect for customers with their own deployments
- ✅ **Interactive setup** - Saves configuration to .env file
- ✅ **Automatic .env loading** - No external dependencies required

### Quick Start

```bash
# Interactive setup (recommended - saves to .env)
node scripts/test-data-engine-api.js --setup

# Run all tests
node scripts/test-data-engine-api.js

# Test specific resource
node scripts/test-data-engine-api.js --resource=domains

# Test against custom domain
node scripts/test-data-engine-api.js --base-url=https://your-company.theanswer.ai/api/v1/data-engine

# Verbose output for debugging
node scripts/test-data-engine-api.js --verbose
```

### Documentation

See [test-data-engine-api.md](./test-data-engine-api.md) for complete documentation including:
- Detailed usage instructions
- All command line options
- Complete test coverage breakdown
- Troubleshooting guide
- CI/CD integration examples

## OpenAPI Documentation Sync

The `sync-openapi-docs.js` script synchronizes individual OpenAPI YAML files in the `packages/docs/openapi/` directory with the comprehensive Swagger file in `packages/api-documentation/src/yml/swagger.yml`.

### Features

-   Automatically identifies routes in the main swagger.yml that belong to each individual API file based on tags
-   Updates paths, parameters, request bodies, and responses in individual files to match the main swagger
-   Extracts and updates referenced schemas in the components section
-   Preserves the structure and formatting of individual files
-   Generates a detailed log of changes made to each file

### Usage

You can run the script in two ways:

#### Using the shell script (recommended)

```bash
./sync-openapi.sh
```

This script will:

1. Change to the scripts directory
2. Install dependencies if needed
3. Run the sync script

#### Manually

```bash
cd scripts
npm install
npm run sync-openapi
```

### Output

The script will output changes made to each file, for example:

```
Starting OpenAPI documentation synchronization...
📝 Changes for prediction.yaml:
  - Update requestBody for POST /prediction/{id}
  - Update schema: Document
✅ No changes needed for tools.yaml
...
Synchronization complete!
```

### How It Works

1. Reads the main swagger.yml file
2. For each individual YAML file in packages/docs/openapi:
    - Determines which paths in the main swagger correspond to the API (based on tags)
    - Compares and updates paths, operations, parameters, etc.
    - Extracts and updates referenced components
    - Writes the updated YAML if changes were detected

### Maintaining API Documentation

1. Make changes to the main swagger.yml file
2. Run this script to propagate those changes to individual files
3. Commit both the changes to swagger.yml and the updated individual files

This ensures the consistency of API documentation across the codebase.

## Other Scripts

### Auth0 Setup

- `export-auth0-users.js` - Export users from Auth0 tenant
- `auth0-setup-guide.md` - Guide for Auth0 configuration

### Database & Testing

- `generate-uuid.js` - Generate UUIDs for testing
- `dbeaver-detailed-analysis.sql` - Database analysis queries
- `dbeaver-improved-deletes.sql` - Safe deletion queries
- `test-race-condition.sh` - Test for race conditions in API

### Dependabot Management

- `dependabot-batch-processing-playbook.md` - Guide for handling Dependabot PRs
- `test-dependabot-updates.sh` - Test dependency updates before merging
- `compare-package-versions.js` - Compare package versions across workspace

### Security & Credentials

- `bws-secure/` - Bitwarden Secrets integration scripts
- `seed-credentials/` - Scripts for seeding test credentials

### Testing Utilities

- `testing-chatflows/` - Scripts for testing chatflow functionality

For more details on any script, check the individual script files or accompanying documentation files.
