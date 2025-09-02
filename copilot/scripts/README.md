# Copilot Scripts Documentation

This directory contains the automated deployment scripts for TheAnswerAI Copilot infrastructure. These scripts provide a comprehensive, guided deployment experience with DNS management, environment configuration, and service deployment.

## 📁 Script Overview

```
copilot/scripts/
├── copilot-auto-deploy.sh              # Main automated deployment script
├── route53-zone-manager.sh             # Route53 DNS zone management
├── copilot-switch-app.sh               # Domain-based app context switching
├── create-env-files.js                 # Environment file creation & validation
└── tests/                              # Script validation and testing
    └── test-copilot-auto-deploy.sh     # Comprehensive script validation
```

## 🚀 Quick Start

```bash
# Run the complete automated deployment
pnpm copilot:auto

# Or run directly
bash ./copilot/scripts/copilot-auto-deploy.sh
```

## 📋 Prerequisites

### Required Tools

-   **AWS CLI** - Configured with appropriate credentials
-   **Copilot CLI** - Latest version installed
-   **jq** - JSON processor for script operations
-   **Node.js** - For environment file creation (v16+)

### Required Permissions

-   **Route53** - Full access for zone management
-   **CloudFormation** - For Copilot infrastructure deployment
-   **ECS** - For service deployment
-   **IAM** - For service roles and policies
-   **S3** - For environment file storage (if using S3 integration)

### Environment Variables

```bash
# Required for AWS authentication
export AWS_PROFILE=your-profile-name

# Optional: Set region explicitly
export AWS_REGION=us-east-1

# Note: AUTH0_BASE_URL is automatically set by the script
# based on your domain selection (staging vs prod)
```

## 📋 Complete Deployment Flow

### Phase 1: PREREQUISITES & SETUP

```
├── Verify AWS account and credentials
│   ├── Check AWS_PROFILE environment variable
│   ├── Display AWS account information
│   ├── Verify AWS SSO token validity
│   ├── Handle token expiration gracefully
│   └── Confirm correct AWS account
├── Validate required tools
│   ├── Check aws CLI availability
│   ├── Check jq availability
│   ├── Check copilot CLI availability
│   └── Exit if any tool missing
└── Set up error handling and cleanup
```

### Phase 2: CLIENT DOMAIN SELECTION

```
├── Prompt for client domain key
│   ├── Accept subdomain input (e.g., "acme")
│   ├── Validate subdomain format
│   │   ├── Allow letters, numbers, hyphens
│   │   ├── Prevent leading/trailing hyphens
│   │   ├── Prevent double hyphens
│   │   └── Convert to lowercase
│   └── Store validated subdomain
└── Prepare for environment selection
```

### Phase 3: ENVIRONMENT SELECTION

```
├── Present environment options
│   ├── Option 1: staging
│   ├── Option 2: prod
│   └── Accept numeric or text input
├── Construct domain names
│   ├── For staging: staging.{subdomain}.theanswer.ai
│   ├── For prod: {subdomain}.theanswer.ai
│   └── Set AUTH0_BASE_URL automatically
├── Validate configuration
│   ├── Display selected environment
│   ├── Display constructed domain
│   ├── Display Auth0 base URL
│   └── Confirm configuration
└── Export environment variables
```

### Phase 4: APPLICATION SETUP

```
├── Switch to correct app context
│   ├── Call copilot-switch-app.sh
│   ├── Generate app name from domain
│   ├── Create .workspace file
│   └── Set Copilot application context
├── Check environment files
│   ├── Determine app name from workspace
│   ├── Check if app exists in Copilot
│   ├── If app exists: Normal flow
│   └── If app doesn't exist: Auto-templates
├── Create environment files
│   ├── Call create-env-files.js
│   ├── Pass environment parameter
│   ├── Handle guided vs empty creation
│   └── Validate file creation success
└── Confirm environment setup
```

### Phase 5: COPILOT APPLICATION

```
├── Check if app exists
│   ├── Run copilot app show
│   ├── Set APP_EXISTS flag
│   └── Handle app existence status
├── If app exists:
│   └── Continue to environment management
├── If app doesn't exist:
│   ├── Ask: "Create new Copilot app with domain 'CLIENT_DOMAIN'? (y/N):"
│   ├── If yes:
│   │   ├── [NEW] Call Route53 zone manager script
│   │   │   ├── List all Route53 zones
│   │   │   ├── Determine target domain (prod: subdomain.theanswer.ai, staging: staging.subdomain.theanswer.ai)
│   │   │   ├── Check if target zone exists
│   │   │   ├── Check parent zone access permissions
│   │   │   ├── If zone doesn't exist:
│   │   │   │   ├── Prompt: "Create zone for 'TARGET_DOMAIN'? (y/N):"
│   │   │   │   ├── If yes: Create hosted zone
│   │   │   │   └── If no: Exit with error
│   │   │   ├── If parent zone accessible:
│   │   │   │   ├── Auto-create NS records in parent zone
│   │   │   │   └── Continue to app creation
│   │   │   ├── If parent zone not accessible:
│   │   │   │   ├── For staging: Offer to create parent zone
│   │   │   │   │   ├── If yes: Create parent zone in same account
│   │   │   │   │   └── If no: Display formatted NS records
│   │   │   │   ├── For prod: Display formatted NS records
│   │   │   │   ├── Show manual configuration instructions
│   │   │   │   ├── Pause: "Press Enter when DNS is configured..."
│   │   │   │   └── Wait for user confirmation
│   │   │   └── Return to main script
│   │   ├── copilot app init --domain "$CLIENT_DOMAIN"
│   │   └── Continue with deployment
│   └── If no: Abort deployment
└── If exists: Continue
```

### Phase 6: ENVIRONMENT MANAGEMENT

```
├── Check environment status
│   ├── Run copilot env show --name "$ENV"
│   ├── Set ENV_EXISTS flag
│   └── Handle environment existence
├── If environment exists:
│   ├── Deploy existing environment
│   ├── Run copilot env deploy --name "$ENV"
│   └── Handle deployment success/failure
├── If environment doesn't exist:
│   ├── Ask: "Create environment '$ENV'? (y/N):"
│   ├── If yes:
│   │   ├── Initialize environment
│   │   ├── Run copilot env init --name "$ENV"
│   │   ├── Deploy environment
│   │   ├── Run copilot env deploy --name "$ENV"
│   │   └── Confirm environment creation
│   └── If no: Abort deployment
└── Confirm environment readiness
```

### Phase 7: SERVICE SELECTION

```
├── Present service options
│   ├── Option 1: Both (flowise and web) - default
│   ├── Option 2: flowise only
│   ├── Option 3: web only
│   └── Option 4: exit
├── Handle user input
│   ├── Accept choice input
│   ├── Set 15-second timeout
│   ├── Default to "both" if no input
│   └── Validate choice selection
├── Configure service array
│   ├── Case 1: SERVICES=("flowise" "web")
│   ├── Case 2: SERVICES=("flowise")
│   ├── Case 3: SERVICES=("web")
│   └── Case 4: Exit deployment
└── Confirm service selection
```

### Phase 8: SERVICE DEPLOYMENT

```
├── Deploy each selected service
│   ├── Loop through SERVICES array
│   ├── For each service:
│   │   ├── Display deployment step
│   │   ├── Run copilot deploy --name "$svc" --env "$ENV"
│   │   ├── Handle deployment success
│   │   └── Display health check URLs
├── Generate health check URLs
│   ├── For flowise: https://api.${CLIENT_DOMAIN}/api/v1/ping
│   ├── For web: https://${CLIENT_DOMAIN}/healthcheck
│   └── Display formatted success message
├── Display deployment summary
│   ├── Show all deployed services
│   ├── List health check URLs
│   └── Provide environment variables for future use
└── Complete deployment process
```

## 🔧 Script Details

### copilot-auto-deploy.sh

**Purpose**: Main orchestration script for complete deployment workflow
**Features**:

-   8-phase deployment process
-   AWS credential validation
-   Domain and environment selection
-   Route53 integration
-   Service deployment automation
-   Error handling and recovery

**Usage**:

```bash
bash ./copilot/scripts/copilot-auto-deploy.sh
```

### route53-zone-manager.sh

**Purpose**: Manage Route53 hosted zones for Copilot deployments
**Features**:

-   Zone existence checking
-   Permission validation
-   Automatic zone creation
-   NS record management
-   Manual configuration guidance
-   Parameter validation with helpful error messages

**Usage**:

```bash
bash ./copilot/scripts/route53-zone-manager.sh <subdomain> <env> <base_domain>
```

**Parameter Validation**:

-   Validates subdomain format (letters, numbers, hyphens only)
-   Validates environment (staging or prod only)
-   Provides clear error messages and usage examples
-   Graceful exit with helpful guidance

### copilot-switch-app.sh

**Purpose**: Switch Copilot application context based on domain
**Features**:

-   Domain-based app naming
-   Workspace file generation
-   Context switching automation
-   Parameter validation with helpful error messages

**Usage**:

```bash
CLIENT_DOMAIN=abc.theanswer.ai bash ./copilot/scripts/copilot-switch-app.sh
```

**Parameter Validation**:

-   Validates domain format (no HTTP/HTTPS protocols)
-   Defaults to 'aai' if no domain provided (with warning)
-   Provides clear error messages and usage examples
-   Graceful fallback with helpful guidance

### create-env-files.js

**Purpose**: Create and validate environment files
**Features**:

-   Template-based file creation
-   Guided configuration
-   Validation and error checking
-   S3 integration for existing deployments
-   Parameter validation with helpful error messages

**Usage**:

```bash
node ./copilot/scripts/create-env-files.js [environment] [--auto-templates]
```

**Parameter Validation**:

-   Validates application name or workspace file existence
-   Provides clear error messages and usage examples
-   Graceful exit with helpful guidance

## 🧪 Testing

### test-copilot-auto-deploy.sh

**Purpose**: Comprehensive validation of all scripts
**Features**:

-   Syntax validation
-   Function testing
-   Edge case testing
-   Security checks
-   Documentation validation

**Usage**:

```bash
bash ./copilot/scripts/tests/test-copilot-auto-deploy.sh
```

## 🔍 Error Handling

### Enhanced Parameter Validation

All scripts now include comprehensive parameter validation with helpful error messages:

**When scripts are run manually without proper parameters:**

-   ✅ Clear error messages explaining what's missing
-   ✅ Usage examples and parameter descriptions
-   ✅ Guidance to use the auto-deploy script instead
-   ✅ Graceful exit with helpful information

**Validation Features:**

-   **route53-zone-manager.sh**: Validates subdomain format, environment values, and base domain
-   **copilot-switch-app.sh**: Validates domain format and presence
-   **create-env-files.js**: Validates application name and workspace file existence

**Example Error Output:**

```bash
❌ Invalid arguments

Route53 Zone Manager Script
Purpose: Manage Route53 hosted zones for TheAnswer Copilot deployments

Usage:
  ./route53-zone-manager.sh <subdomain> <env> <base_domain>

Parameters:
  subdomain    - Client subdomain (e.g., 'acme' for acme.theanswer.ai)
  env          - Environment ('staging' or 'prod')
  base_domain  - Base domain (e.g., 'theanswer.ai')

Examples:
  ./route53-zone-manager.sh acme staging theanswer.ai
  ./route53-zone-manager.sh acme prod theanswer.ai

Note: This script is designed to be called by the auto-deploy script.
For manual deployment, use: pnpm copilot:auto
```

### Exit Codes

-   **0** - Success, deployment completed
-   **1** - General error, check logs
-   **130** - Interrupted by user (Ctrl+C)
-   **255** - AWS credential/permission error

### Common Error Scenarios

1. **AWS Credentials Expired**

    - Automatic detection of SSO token expiration
    - Clear instructions for re-authentication
    - Graceful exit with helpful guidance

2. **Route53 Zone Creation Failed**

    - Permission validation upfront
    - Fallback to manual configuration
    - Clear NS record display

3. **Environment File Issues**

    - Validation of required variables
    - Guided creation process
    - S3 download for existing deployments

4. **Service Deployment Failures**
    - Individual service error handling
    - Health check validation
    - Rollback guidance

## 🚨 Troubleshooting

### Debugging and Logging

```bash
# Enable debug mode for detailed output
export DEBUG=true
bash ./copilot/scripts/copilot-auto-deploy.sh

# Check script syntax without execution
bash -n ./copilot/scripts/copilot-auto-deploy.sh

# Run with verbose AWS CLI output
export AWS_CLI_DEBUG=1
bash ./copilot/scripts/copilot-auto-deploy.sh
```

### Performance Expectations

-   **Initial deployment**: 15-30 minutes (includes infrastructure creation)
-   **Subsequent deployments**: 5-15 minutes (service updates only)
-   **DNS propagation**: 5-30 minutes after NS record configuration
-   **Environment creation**: 10-20 minutes (first time only)

### Script Validation

```bash
# Run comprehensive script tests
bash ./copilot/scripts/tests/test-copilot-auto-deploy.sh
```

### Manual DNS Configuration

If Route53 zone creation fails:

1. Check AWS permissions
2. Verify domain ownership
3. Configure NS records manually
4. Wait for DNS propagation

### Environment File Issues

If environment files are missing:

1. Run create-env-files.js manually
2. Check template files exist
3. Verify app context is correct
4. Review validation output

## 📚 Additional Resources

-   [Main Copilot README](../README.md) - Complete deployment documentation
-   [AWS Copilot Documentation](https://aws.github.io/copilot-cli/)
-   [Route53 Documentation](https://docs.aws.amazon.com/route53/)
-   [TheAnswerAI Documentation](https://docs.theanswer.ai/)

## 🔄 Maintenance and Updates

### Script Updates

-   Scripts are versioned with the main repository
-   Check for updates before major deployments
-   Test in staging environment first
-   Review changelog for breaking changes

### Best Practices

-   Always test in staging before production
-   Keep AWS credentials current
-   Monitor deployment logs for issues
-   Use environment files for configuration
-   Validate DNS configuration after deployment

## 🤝 Contributing

When modifying scripts:

1. **Test thoroughly** - Run validation tests
2. **Update documentation** - Keep this README current
3. **Follow patterns** - Maintain consistent error handling
4. **Validate syntax** - Use bash -n for syntax checking
5. **Test edge cases** - Include comprehensive test scenarios
