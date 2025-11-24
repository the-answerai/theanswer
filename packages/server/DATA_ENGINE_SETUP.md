# Data Engine API Integration - Setup Guide

## Overview

The Data Engine API integration provides a secure gateway between TheAnswer and the Data Engine (data-sidekick) service, enabling CRUD operations for 7 key resources: Domains, URLs, Calls, Tags, Documents, Tickets, and Chats.

## Security Architecture

### Authentication Layers

1. **TheAnswer Authentication** (`enforceAbility` middleware)
   - Validates API keys or JWT tokens
   - Associates requests with users and organizations
   - Enforces resource-level permissions via CASL

2. **Data Engine Authentication** (M2M or Service Key)
   - Auth0 Machine-to-Machine (recommended for production)
   - Service Key (legacy, backward compatible)
   - Configurable fallback behavior

### Multi-Tenancy

All requests automatically include user context headers:
- `X-Organization-Id`: User's organization
- `X-User-Id`: User's unique ID
- `X-User-Email`: User's email address

## Permission Setup (CRITICAL)

### Required CASL Permissions

The following resource types must be added to your CASL permissions configuration:

```typescript
// Required permission resource names
'DataEngineDomain'
'DataEngineUrl'
'DataEngineCall'
'DataEngineTag'
'DataEngineDocument'
'DataEngineTicket'
'DataEngineChat'
```

### How to Add Permissions

**Option A: Admin Configuration** (Recommended)
1. Log in as an admin user
2. Navigate to Settings → Permissions
3. Add each Data Engine resource type
4. Assign permissions to appropriate roles

**Option B: Database Configuration**
Add to your CASL abilities configuration:

```sql
-- Example: Grant full access to admin role
INSERT INTO abilities (role, resource, action)
VALUES
  ('admin', 'DataEngineDomain', 'manage'),
  ('admin', 'DataEngineUrl', 'manage'),
  ('admin', 'DataEngineCall', 'manage'),
  ('admin', 'DataEngineTag', 'manage'),
  ('admin', 'DataEngineDocument', 'manage'),
  ('admin', 'DataEngineTicket', 'manage'),
  ('admin', 'DataEngineChat', 'manage');

-- Example: Grant read-only access to user role
INSERT INTO abilities (role, resource, action)
VALUES
  ('user', 'DataEngineDomain', 'read'),
  ('user', 'DataEngineUrl', 'read'),
  -- etc.
```

### Testing Permissions

Use an admin account for initial testing:

```bash
# Test with admin API key
export DATA_ENGINE_API_KEY="admin-api-key-here"
node scripts/test-data-engine-api.js
```

## Environment Configuration

### Required Variables

Add to your `.env` file:

```bash
# Data Engine Base URL
DATA_SIDEKICK_URL=http://localhost:3001

# Option 1: Service Key (legacy)
DATA_ENGINE_SERVICE_KEY=your-shared-secret

# Option 2: Auth0 M2M (recommended)
DATA_SIDEKICK_CLIENT_ID=your-client-id
DATA_SIDEKICK_CLIENT_SECRET=your-client-secret
DATA_SIDEKICK_AUDIENCE=https://data-sidekick-api

# Optional: Disable auth fallback for strict M2M-only
# DATA_ENGINE_AUTH_ALLOW_FALLBACK=false
```

### Authentication Modes

| Mode | When to Use | Configuration |
|------|-------------|---------------|
| **M2M Only** | Production, strict security | Set M2M vars, `DATA_ENGINE_AUTH_ALLOW_FALLBACK=false` |
| **M2M with Fallback** | Production, backward compat | Set both M2M and service key |
| **Service Key Only** | Development, legacy systems | Set only `DATA_ENGINE_SERVICE_KEY` |

## Metadata Handling

### Resources with Metadata Support

The following resources support the `metadata` field with audit tracking:

- ✅ **Domains** - Full metadata support
- ✅ **URLs** - Full metadata support
- ✅ **Calls** - Full metadata support

Metadata structure:
```json
{
  "source_system": "theanswer",
  "source_organization_id": "org-uuid",
  "source_user_id": "user-uuid",
  "created_by": "user@example.com",
  "last_updated_by": "user@example.com",
  "last_updated_from": "theanswer"
}
```

### Resources WITHOUT Metadata

The following resources **do not** have metadata columns in the database schema:

- ❌ **Tags** - Database schema limitation
- ❌ **Documents** - Simplified schema (metadata stored differently)
- ❌ **Tickets** - Legacy schema without metadata column
- ❌ **Chats** - Legacy schema without metadata column

**Why?** These resources were designed before the metadata pattern was standardized, or use alternative audit mechanisms.

**Workaround:** User context is still passed via headers (`X-User-Id`, `X-Organization-Id`) so the Data Engine service can track ownership and operations server-side.

### Future Considerations

To add metadata support to these resources:

1. **Database Migration:** Add `metadata JSONB` column to data-sidekick tables
2. **Schema Update:** Update data-sidekick API to accept metadata field
3. **Service Update:** Enable `buildMetadata()` calls for these resources

## Input Validation

All routes include comprehensive validation:

### Field Validation
- **Required fields:** Verified before processing
- **Type checking:** Strings, numbers, arrays validated
- **Format validation:** URLs, emails, UUIDs checked
- **Enum validation:** Status values, priorities validated

### Pagination Safety
- **Maximum page size:** 100 items (prevents resource exhaustion)
- **Type validation:** Page numbers must be non-negative integers
- **Default values:** Sensible defaults applied when not provided

### Examples

```javascript
// Valid request
POST /api/v1/data-engine/domains
{
  "domain_name": "example.com",
  "is_valid": true,
  "metadata": {...}
}

// Invalid - missing required field
POST /api/v1/data-engine/domains
{
  "is_valid": true  // ❌ Missing domain_name
}
// Response: 400 - Missing required fields: domain_name

// Invalid - exceeds page size limit
GET /api/v1/data-engine/domains?pageSize=500
// Response: 400 - pageSize cannot exceed 100
```

## Error Handling

### Development vs Production

**Development Mode:**
- Detailed error messages with context
- Stack traces included for debugging
- Internal paths visible

**Production Mode:**
- Generic error messages for 5xx errors
- Sensitive data redacted
- Full details logged server-side only

### Error Sanitization

The following information is automatically redacted from client-facing errors:

- File paths: `/path/to/file.ts` → `[file]`
- Absolute paths: Removed entirely
- Stack traces: Stripped from client responses
- Database details: `Table "users"` → `Table [redacted]`
- Message truncation: Limited to 200 characters

### Error Response Format

```json
{
  "error": "Error: dataEngineService.postDomains - [sanitized message]"
}
```

Server logs contain full details for debugging.

## Monitoring & Alerts

### Authentication Metrics

The service logs authentication method usage:

```json
{
  "timestamp": "2025-01-20T12:00:00Z",
  "method": "m2m",
  "success": true
}
```

Methods tracked:
- `m2m` - Auth0 M2M authentication
- `service-key` - Service key authentication
- `service-key-fallback` - Fallback from M2M to service key

### Recommended Alerts

Set up alerts for:

1. **M2M Authentication Failures**
   - Log pattern: `[DataEngineService] M2M authentication failed`
   - Action: Check Auth0 credentials, token expiration

2. **Fallback Usage in Production**
   - Log pattern: `⚠️ FALLBACK: Using service key authentication`
   - Action: Investigate why M2M is failing

3. **Authorization Failures**
   - Status code: 401/403
   - Action: Review CASL permissions, user roles

## Testing

### Test Script

Comprehensive test suite available:

```bash
# Run all tests
node scripts/test-data-engine-api.js

# Test specific resource
node scripts/test-data-engine-api.js --resource=domains

# Keep test data for verification
node scripts/test-data-engine-api.js --no-cleanup

# Enable verbose logging
node scripts/test-data-engine-api.js --verbose
```

### Expected Test Failures (Before Permission Setup)

Until CASL permissions are configured, tests will fail with:
```
❌ Domain tests: Internal server error
```

This is **expected** - the `enforceAbility` middleware is correctly rejecting requests without proper permissions.

### After Permission Setup

All tests should pass:
```
✅ Passed: 56
❌ Failed: 0
⏭️ Skipped: 2 (known Data Engine bugs)
```

## Troubleshooting

### "Internal server error" on all requests

**Cause:** Missing CASL permissions for Data Engine resources

**Solution:** Add permissions as described in "Permission Setup" section above

### "M2M authentication failed"

**Cause:** Invalid Auth0 credentials or misconfigured audience

**Solutions:**
1. Verify `DATA_SIDEKICK_CLIENT_ID` and `DATA_SIDEKICK_CLIENT_SECRET`
2. Check `DATA_SIDEKICK_AUDIENCE` matches Data Engine configuration
3. Ensure M2M app has correct API permissions in Auth0
4. Allow fallback temporarily: Remove `DATA_ENGINE_AUTH_ALLOW_FALLBACK=false`

### "Neither M2M nor service key authentication configured"

**Cause:** No authentication method configured

**Solution:** Set at minimum `DATA_ENGINE_SERVICE_KEY` in `.env`

### Validation errors on valid requests

**Cause:** Schema mismatch between TheAnswer and Data Engine

**Solutions:**
1. Check Data Engine API documentation for current schema
2. Verify required vs optional fields
3. Check field name spelling (e.g., `domain_name` not `domainName`)

## Migration from Legacy Systems

If migrating from direct Data Engine integration:

1. **Add TheAnswer Authentication:**
   - Generate API keys for existing users
   - Configure CASL permissions
   - Update client code to use TheAnswer API endpoints

2. **Update Endpoints:**
   ```
   Old: POST http://data-engine:3001/api/external/domains
   New: POST https://theanswer.com/api/v1/data-engine/domains
   ```

3. **Authentication Headers:**
   ```
   Old: X-Service-Key: shared-secret
   New: Authorization: Bearer <api-key>
   ```

4. **Test Thoroughly:**
   - Run test script against production
   - Verify all CRUD operations
   - Check audit logs for user tracking

## Support

For issues or questions:

1. Check server logs: `[DataEngineService]` prefix
2. Review CASL permissions configuration
3. Test with admin account first
4. Verify Data Engine service is reachable
5. Create GitHub issue with logs and configuration (redact secrets!)

## Additional Resources

- **API Documentation:** `/packages/docs/openapi/data-engine.yaml`
- **Test Script:** `/scripts/test-data-engine-api.js`
- **Test Documentation:** `/scripts/test-data-engine-api.md`
- **TypeScript Interfaces:** `/packages/server/src/Interface.DataEngine.ts`
- **Validation Logic:** `/packages/server/src/middlewares/validation/dataEngineValidation.ts`
