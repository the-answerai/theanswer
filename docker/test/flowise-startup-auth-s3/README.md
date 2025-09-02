# Flowise Startup Testing (Auth & S3)

Test Flowise startup with Auth0 authentication and S3 storage configuration locally.

## Quick Start

```bash
cd docker/test/flowise-startup-auth-s3

# Copy and edit environment file
cp test-s3-config.env.example test-s3-config.env
# Edit test-s3-config.env with your values

# Run test
docker-compose -f docker-compose.s3-test.yml up flowise-s3-test
```

## Files

-   `docker-compose.s3-test.yml` - Test environment setup
-   `test-s3-config.env.example` - Template for environment variables
-   `test-s3-configuration.sh` - Automated test scenarios
-   `.gitignore` - Excludes logs and volumes

## Test Scenarios

-   Auth0 RS256 authentication
-   S3 storage configuration
-   Missing S3 bucket name
-   Incomplete credentials
-   Local storage fallback
-   Custom region config
-   Production config (no debug)

## Environment Variables

Update `test-s3-config.env` with your actual values for:

-   Auth0 configuration (RS256 JWT validation)
-   Database credentials
-   S3 bucket details
