---
description: API Standardization - Migration from API_BASE_URL to API_HOST
---

# API Standardization: API_BASE_URL to API_HOST Migration

## Overview

This document describes the migration from `API_BASE_URL` to `API_HOST` environment variable and the standardization of API endpoint paths across the TheAnswer platform.

## Background

Previously, the codebase used `API_BASE_URL` environment variable which could include partial or complete API paths, leading to inconsistencies and potential issues with double path segments. This has been standardized to use `API_HOST` as the canonical environment variable for all API server calls.

## Changes Made

### 1. Environment Variable Standardization

**Before:**

```bash
API_BASE_URL=http://localhost:3000/api/v1
# or
API_BASE_URL=http://localhost:3000
```

**After:**

```bash
API_HOST=http://localhost:3000
```

### 2. API Endpoint Structure

All API calls now follow a consistent pattern:

```
${API_HOST}/api/v1/{endpoint}
```

**Examples:**

-   `http://localhost:3000/api/v1/billing/usage/sync`
-   `http://localhost:3000/api/v1/prediction/{chatflowId}`
-   `http://localhost:3000/api/v1/get-upload-file`

### 3. Files Modified

#### Server-side Changes

-   **`packages/server/src/utils/cron.ts`**: Updated to use `API_HOST` with `/api/v1` prefix
-   **`scripts/bws-secure/requiredVars.env`**: Updated environment variable references

#### Client-side Changes

-   **`packages-answers/ui/src/AnswersContext.tsx`**: Updated default `apiUrl` to `/api/v1`

#### Documentation Updates

-   **`packages/docs/docs/developers/API_STANDARDIZATION.md`**: This document

## Implementation Details

### Server-side Implementation

The cron job in `packages/server/src/utils/cron.ts` now uses:

```typescript
const API_HOST = process.env.API_HOST || `http://localhost:${process.env.PORT || 3000}`

// API calls now use the standardized format
const response = await axios.post(`${API_HOST}/api/v1/billing/usage/sync`, {})
```

### Client-side Implementation

The AnswersContext now defaults to the correct API path:

```typescript
export function AnswersProvider({
    // ... other props
    apiUrl = '/api/v1' // Updated default
}: AnswersProviderProps) {
    // API calls automatically include /api/v1 prefix
}
```

## Benefits

### 1. Consistency

-   Single, canonical way to reference API host (`API_HOST`)
-   All API calls explicitly include `/api/v1` prefix
-   No ambiguity about environment variables

### 2. Maintainability

-   Clear separation between host and path components
-   Easier to update API versioning in the future
-   Reduced risk of double path segments

### 3. Security

-   Consistent API endpoint structure
-   Easier to implement security policies
-   Clear audit trail for API calls

## Migration Guide

### For Developers

1. **Update Environment Variables**

    ```bash
    # Remove this
    API_BASE_URL=http://localhost:3000/api/v1

    # Use this instead
    API_HOST=http://localhost:3000
    ```

2. **Update API Calls**

    ```typescript
    // Before
    const response = await fetch(`${API_BASE_URL}/endpoint`)

    // After
    const response = await fetch(`${API_HOST}/api/v1/endpoint`)
    ```

3. **Update Configuration Files**
    - Update any deployment configurations
    - Update Docker environment variables
    - Update CI/CD pipeline variables

### For System Administrators

1. **Environment Variable Migration**

    ```bash
    # Old format (remove)
    export API_BASE_URL="https://api.example.com/api/v1"

    # New format (use)
    export API_HOST="https://api.example.com"
    ```

2. **Deployment Updates**
    - Update Kubernetes ConfigMaps
    - Update Docker Compose files
    - Update cloud platform environment variables

## Verification

### Testing Checklist

-   [ ] All API endpoints respond correctly
-   [ ] No 404 errors due to missing `/api/v1` prefix
-   [ ] No double path segments (e.g., `/api/v1/api/v1/`)
-   [ ] Environment variables are correctly set
-   [ ] Documentation is updated

### Common Issues

1. **Double Path Segments**

    ```typescript
    // ❌ Wrong - will result in /api/v1/api/v1/endpoint
    const url = `${API_HOST}/api/v1/api/v1/endpoint`

    // ✅ Correct
    const url = `${API_HOST}/api/v1/endpoint`
    ```

2. **Missing Path Prefix**

    ```typescript
    // ❌ Wrong - missing /api/v1
    const url = `${API_HOST}/endpoint`

    // ✅ Correct
    const url = `${API_HOST}/api/v1/endpoint`
    ```

## Legacy Support

The migration maintains backward compatibility by ensuring all existing API calls continue to work. However, it's recommended to update all code to use the new standardized approach.

## Future Considerations

### API Versioning

With the standardized structure, future API versioning can be easily implemented:

```
${API_HOST}/api/v2/{endpoint}
```

### Documentation

-   Update any deployment documentation to reflect the new variable
-   Update API documentation to show the standardized endpoint structure
-   Update developer onboarding materials

## Conclusion

This standardization provides a clear, consistent, and maintainable approach to API communication across the TheAnswer platform. The `API_HOST` environment variable is now the canonical way to reference the API server, and all endpoints consistently use the `/api/v1` prefix.

## Related Documentation

-   [Environment Variables](../environment-variables.md)
-   [Deployment Guide](../deployment/README.md)
-   [API Reference](../../api/README.md)
