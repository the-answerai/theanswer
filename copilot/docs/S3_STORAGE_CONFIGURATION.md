# S3 Storage Configuration for Flowise

## Overview

This document explains how S3 storage is configured for Flowise in the Copilot deployment.

## Configuration Summary

### Required Environment Variables

-   **`STORAGE_TYPE`**: Must be set to `'s3'` to enable S3 storage (now set in manifest.yml)
-   **`S3_STORAGE_BUCKET_NAME`**: The S3 bucket name (provided by CloudFormation)

### Optional Environment Variables

-   **`S3_STORAGE_REGION`**: AWS region for the S3 bucket (defaults to `'us-east-1'` if not set)
-   **`S3_STORAGE_ACCESS_KEY_ID`**: AWS Access Key ID (optional - uses IAM role if not set)
-   **`S3_STORAGE_SECRET_ACCESS_KEY`**: AWS Secret Access Key (optional - uses IAM role if not set)
-   **`S3_ENDPOINT_URL`**: Custom S3-compatible endpoint (for MinIO, etc.)
-   **`S3_FORCE_PATH_STYLE`**: Set to `'true'` for path-style URLs (mainly for custom endpoints)

## Key Changes Made

### 1. Fixed CloudFormation Reference

-   Changed from incorrect `theansweraiserverstorageName` to correct `theansweraiserverstorageBucketName`
-   This matches the actual CloudFormation export name in the addon

### 2. Moved STORAGE_TYPE to manifest.yml

-   Prevents timing issues where logger checks for S3 before bucket name is available
-   Ensures STORAGE_TYPE and S3_STORAGE_BUCKET_NAME are always set together

### 3. Made S3_STORAGE_REGION Optional

-   The code defaults to `'us-east-1'` if not provided
-   Commented out in manifest.yml since it's optional

### 4. Added Enhanced Debugging

-   Created `s3-debug.ts` utility for detailed S3 configuration logging
-   Integrated debug output into startup process when DEBUG=true or VERBOSE=true
-   Enhanced error messages in logger.ts with troubleshooting steps

## Authentication Methods

### 1. IAM Role (Recommended for ECS/EC2)

-   Don't set `S3_STORAGE_ACCESS_KEY_ID` or `S3_STORAGE_SECRET_ACCESS_KEY`
-   The AWS SDK will automatically use the task/instance IAM role
-   This is the most secure method for AWS deployments

### 2. Explicit Credentials

-   Set both `S3_STORAGE_ACCESS_KEY_ID` and `S3_STORAGE_SECRET_ACCESS_KEY`
-   Both must be set together or neither should be set
-   Use AWS Secrets Manager for production deployments

## Troubleshooting

### Enable Debug Output

Set these in manifest.yml (already configured):

```yaml
DEBUG: 'true'
VERBOSE: 'true'
LOG_LEVEL: 'debug'
```

### Common Issues

1. **"S3 storage bucket configuration is missing"**

    - Cause: STORAGE_TYPE is 's3' but S3_STORAGE_BUCKET_NAME is not set
    - Fix: Ensure CloudFormation outputs are properly referenced in manifest.yml

2. **"Incomplete credential configuration"**

    - Cause: Only one of ACCESS_KEY_ID or SECRET_ACCESS_KEY is set
    - Fix: Either set both or neither (to use IAM role)

3. **Region Issues**
    - S3_STORAGE_REGION is optional and defaults to 'us-east-1'
    - Only set if your bucket is in a different region

### Debug Output Example

When DEBUG=true, you'll see output like:

```
=== S3 Storage Configuration Debug ===
STORAGE_TYPE: s3
S3 Storage is enabled, checking configuration...
✅ S3_STORAGE_BUCKET_NAME: my-bucket-name
ℹ️  S3_STORAGE_REGION: NOT SET (will default to 'us-east-1')
ℹ️  S3 Credentials: Using IAM role or instance profile (no explicit credentials set)
=== S3 Configuration Summary ===
✅ S3 configuration appears valid
   Bucket: my-bucket-name
   Region: us-east-1 (default)
   Auth: IAM role/instance profile
=== End S3 Configuration Debug ===
```

## Files Modified

1. **`copilot/flowise/manifest.yml`**

    - Fixed S3_STORAGE_BUCKET_NAME reference
    - Added STORAGE_TYPE to variables section
    - Made S3_STORAGE_REGION optional (commented out)

2. **`copilot/copilot.appName.env.template`**

    - Commented out STORAGE_TYPE (moved to manifest.yml)
    - Added note explaining the change

3. **`packages/server/src/utils/s3-debug.ts`** (NEW)

    - Comprehensive S3 configuration debugging utility
    - Validation functions for S3 configuration

4. **`packages/server/src/commands/start.ts`**

    - Integrated S3 debug output during startup
    - Added configuration validation warnings

5. **`packages/server/src/DataSource.ts`**

    - Added early S3 configuration logging

6. **`packages/server/src/utils/logger.ts`**
    - Enhanced error messages with troubleshooting information

## Deployment Steps

1. **Update existing .env files**: Remove `STORAGE_TYPE=s3` line (now in manifest.yml)
2. **Deploy the addon**: Ensure the S3 bucket CloudFormation stack is deployed
3. **Deploy Flowise service**: The service will now properly configure S3 storage

## Validation

To validate S3 is working after deployment:

1. Check CloudWatch logs for the debug output
2. Look for "✅ S3 configuration appears valid" message
3. Test file upload functionality in Flowise UI
