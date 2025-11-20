# Data Engine API Test Suite

Comprehensive testing script for all Data Engine API endpoints including CRUD operations, pagination, filtering, and search capabilities.

## Features

✅ **Complete CRUD Testing** - Create, Read, Update (full & partial), Delete  
✅ **All Resources** - Domains, URLs, Calls, Tags, Documents, Tickets, Chats  
✅ **Pagination Testing** - Tests page and pageSize parameters  
✅ **Filter Testing** - Tests resource-specific filters  
✅ **Search Testing** - Tests search terms and vector search  
✅ **Relationship Testing** - Tests parent-child relationships (domains/urls, tags hierarchy)  
✅ **Cleanup** - Automatically cleans up created test data  
✅ **Detailed Reporting** - Clear pass/fail indicators with summaries

## Prerequisites

1. **Running Data Engine API** - The API must be accessible at the configured base URL
2. **Valid API Key** - You need a valid API key with permissions to create/delete resources
3. **Node.js** - Version 14+ (uses built-in modules, no external dependencies)

## Usage

### Quick Start (Recommended)

```bash
# Interactive setup - saves configuration to .env file
node scripts/test-data-engine-api.js --setup

# Then run tests
node scripts/test-data-engine-api.js
```

The setup command will:
- Prompt for your API key
- Prompt for your API base URL (supports custom domains!)
- Save configuration to the project's `.env` file
- Work automatically for future test runs

### Manual Configuration

```bash
# Option 1: Add to .env file (recommended for persistent config)
echo 'DATA_ENGINE_API_KEY="your-api-key-here"' >> .env
echo 'DATA_ENGINE_BASE_URL="http://localhost:3000/api/v1/data-engine"' >> .env

# Option 2: Set environment variables for current session
export DATA_ENGINE_API_KEY="your-api-key-here"
export DATA_ENGINE_BASE_URL="http://localhost:3000/api/v1/data-engine"

# Run all tests
node scripts/test-data-engine-api.js
```

### Command Line Options

```bash
# Interactive setup (saves to .env)
node scripts/test-data-engine-api.js --setup

# Test with command line arguments (overrides .env)
node scripts/test-data-engine-api.js \
  --api-key=your-api-key \
  --base-url=http://localhost:3000/api/v1/data-engine \
  --verbose

# Test only specific resource
node scripts/test-data-engine-api.js --resource=domains
node scripts/test-data-engine-api.js --resource=calls

# Verbose mode (shows request/response details)
node scripts/test-data-engine-api.js --verbose

# Custom domain example
node scripts/test-data-engine-api.js \
  --base-url=https://your-company.theanswer.ai/api/v1/data-engine

# Get help
node scripts/test-data-engine-api.js --help
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--setup` | Interactive setup (saves to .env) | - |
| `--api-key=<key>` | API key for authentication | `DATA_ENGINE_API_KEY` env var |
| `--base-url=<url>` | Base URL for the API | `http://localhost:3000/api/v1/data-engine` |
| `--resource=<name>` | Test only specific resource | All resources |
| `--verbose` | Show detailed request/response info | `false` |
| `--help, -h` | Show help message | - |

### Valid Resource Names

- `domains` - Domain management
- `urls` - URL tracking and analysis
- `calls` - Call logs and transcripts
- `tags` - Tag taxonomy and hierarchy
- `documents` - Documents with vector embeddings
- `tickets` - Support ticket management
- `chats` - Chat conversation logs

## Test Coverage

### Domains API
- ✅ Create domain with all fields (domain_name, is_valid, meta_title, meta_description, custom_data, metadata)
- ✅ Get domain by ID
- ✅ Update domain (all fields)
- ✅ Update domain (partial)
- ✅ List domains with pagination
- ✅ List domains with search term
- ✅ List domains with filters (isValid, hasAnalysis)
- ✅ Delete domain
- ✅ Verify deletion (404)

### URLs API
- ✅ Create domain (prerequisite)
- ✅ Create URL with all fields (domain_id, url, http_status, page_title, custom_data, etc.)
- ✅ Get URL by ID
- ✅ Update URL (all fields)
- ✅ Update URL (partial)
- ✅ List URLs with pagination
- ✅ List URLs with status filter
- ✅ Delete URL
- ✅ Cleanup domain

### Calls API
- ✅ Create call with all fields (transcript, transcript_json, recording_url, duration, sentiment, ai_analysis, ai_coaching)
- ✅ Get call by ID
- ✅ Update call (all fields)
- ✅ Update call (partial)
- ✅ List calls with pagination
- ✅ List calls with sentiment filter (sentimentMin, sentimentMax)
- ✅ List calls with date range filter
- ✅ List calls with transcript filter
- ✅ Delete call

### Tags API
- ✅ Create parent tag
- ✅ Create child tag with parent relationship
- ✅ Get tag by ID
- ✅ Update tag
- ✅ List all tags
- ✅ Get tag hierarchy
- ✅ Delete child tag
- ✅ Delete parent tag

### Documents API
- ✅ Create document with embedding and metadata
- ✅ Get document by ID
- ✅ Update document (all fields)
- ✅ Update document (partial)
- ✅ List documents with pagination
- ✅ Search documents (vector similarity search)
- ✅ Delete document

### Tickets API
- ✅ Create ticket with all fields (title, description, status, priority, assigned_to, tags_array)
- ✅ Get ticket by ID
- ✅ Update ticket (all fields)
- ✅ Update ticket (partial)
- ✅ List tickets with pagination
- ✅ List tickets with status filter
- ✅ List tickets with tags filter
- ✅ Delete ticket

### Chats API
- ✅ Create chat with all fields (chatbot_name, ai_model, conversation_id, messages, sentiment)
- ✅ Get chat by ID
- ✅ Update chat (all fields)
- ✅ Update chat (partial)
- ✅ List chats with pagination
- ✅ List chats with filters (chatbotName, aiModel, sentimentMin)
- ✅ Delete chat

## Output Format

The script provides clear visual feedback:

```
📦 Testing Domains API
────────────────────────────────────────────────────────────
  ✅ Create domain with all fields: ID: abc-123
  ✅ Get domain by ID
  ✅ Update domain (all fields)
  ✅ Update domain (partial)
  ✅ List domains with pagination: Found 5 total
  ✅ List domains with search
  ✅ Delete domain
  ✅ Verify deletion

╔════════════════════════════════════════════════════════════╗
║                       Test Summary                         ║
╚════════════════════════════════════════════════════════════╝

  ✅ Passed:  56
  ❌ Failed:  0
  ⏭️  Skipped: 0
  📊 Total:   56

🎉 All tests passed!
```

## Error Handling

The script includes comprehensive error handling:

1. **Network Errors** - Catches connection failures
2. **API Errors** - Reports HTTP status codes and error messages
3. **Cleanup** - Always attempts to delete created test data
4. **Verbose Mode** - Shows full request/response details for debugging

## Examples

### First Time Setup

```bash
# Run interactive setup (recommended)
node scripts/test-data-engine-api.js --setup

# Follow prompts to enter:
# - Your API key
# - Your base URL (e.g., https://your-domain.theanswer.ai/api/v1/data-engine)
```

### Test Against Local Development Server

```bash
# If you've run setup with localhost config
node scripts/test-data-engine-api.js

# Or set explicitly
export DATA_ENGINE_API_KEY="local-dev-key"
export DATA_ENGINE_BASE_URL="http://localhost:3000/api/v1/data-engine"
node scripts/test-data-engine-api.js
```

### Test Against Custom Domain

```bash
# Production with custom domain
node scripts/test-data-engine-api.js \
  --api-key=prod-api-key \
  --base-url=https://your-company.theanswer.ai/api/v1/data-engine

# Staging server
node scripts/test-data-engine-api.js \
  --base-url=https://staging.studio.theanswer.ai/api/v1/data-engine \
  --resource=domains
```

### Debug Failed Tests

```bash
# Run with verbose output to see request/response details
node scripts/test-data-engine-api.js --verbose --resource=calls

# Test specific resource against custom domain with verbose logging
node scripts/test-data-engine-api.js \
  --base-url=https://your-domain.com/api/v1/data-engine \
  --resource=documents \
  --verbose
```

## Custom Domain Support

This script fully supports custom domains, making it perfect for customers with their own TheAnswer deployments:

```bash
# Setup for custom domain
node scripts/test-data-engine-api.js --setup

# Enter when prompted:
API Key: your-customer-api-key
Base URL: https://company-name.theanswer.ai/api/v1/data-engine

# Or use directly
node scripts/test-data-engine-api.js \
  --api-key=customer-key \
  --base-url=https://company-name.theanswer.ai/api/v1/data-engine
```

**Note**: The base URL must include the full path to the Data Engine API:
- ✅ `https://your-domain.com/api/v1/data-engine`
- ❌ `https://your-domain.com` (missing path)
- ❌ `https://your-domain.com/api/data-engine` (missing /v1)

## Troubleshooting

### API Key Issues

```
❌ Error: API key is required
   Option 1: Run setup to save configuration
   Option 2: Set environment variable
   Option 3: Use command line option
```

**Solutions**:
1. Run `node scripts/test-data-engine-api.js --setup` for interactive configuration
2. Add `DATA_ENGINE_API_KEY="your-key"` to your `.env` file
3. Use `--api-key=your-key` command line option

### .env File Not Loading

If you've added the API key to `.env` but it's not being read:

**Solutions**:
- Ensure the `.env` file is in the project root (not in scripts/ directory)
- Check that the file is not in `.gitignore` or `.cursorignore`
- Verify the format: `DATA_ENGINE_API_KEY="your-key"` (with quotes)
- Try running from project root: `node scripts/test-data-engine-api.js`

### Connection Refused

```
❌ Network error: connect ECONNREFUSED
```

**Solution**: Ensure the API server is running and accessible at the configured base URL.

### 401 Unauthorized

```
❌ Status: 401 - Unauthorized
```

**Solution**: Check that your API key is valid and has the necessary permissions.

### 404 Not Found

If getting 404s on all endpoints:

**Solution**: Verify the base URL is correct and includes the full path with `/api/v1/data-engine`.

Correct formats:
- Local: `http://localhost:3000/api/v1/data-engine` (default)
- Local (alternative): `http://localhost:4000/api/v1/data-engine` (if your server uses port 4000)
- Production: `https://prod.studio.theanswer.ai/api/v1/data-engine`
- Custom: `https://your-domain.com/api/v1/data-engine`

**Note**: Check your server's actual port if testing locally. TheAnswer typically runs on port 3000, but some configurations may use port 4000. The script will detect and warn about redirects if you use the wrong port.

## Integration with CI/CD

This script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test Data Engine API
  env:
    DATA_ENGINE_API_KEY: ${{ secrets.API_KEY }}
    DATA_ENGINE_BASE_URL: ${{ secrets.API_BASE_URL }}
  run: node scripts/test-data-engine-api.js
```

The script exits with:
- **Exit code 0** - All tests passed
- **Exit code 1** - One or more tests failed

## Development Notes

- **No External Dependencies** - Uses only Node.js built-in modules (http, https, url)
- **Cleanup Guaranteed** - Each test cleans up its own data
- **Isolated Tests** - Tests don't depend on each other
- **Unique Data** - Uses timestamps to ensure unique test data
- **Safe to Run Repeatedly** - Tests are idempotent

## Future Enhancements

Potential improvements:

- [ ] Add performance timing measurements
- [ ] Generate JSON test report for CI/CD
- [ ] Add load testing capabilities
- [ ] Support for bulk operations testing
- [ ] Add data validation against OpenAPI schema
- [ ] Support for authentication token refresh
- [ ] Add concurrent request testing

## Related Documentation

- OpenAPI Spec: `packages/docs/openapi/data-engine.yaml`
- Implementation Guide: `THEANSWER_ANT_DATA_ENGINE_IMPLEMENTATION.md`
- API Documentation: Generated from OpenAPI spec in docs package

