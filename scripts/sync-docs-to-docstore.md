# Documentation Sync to Document Store

This script and GitHub Action automatically sync the documentation from the `packages/docs` sitemap to a document store using the Flowise API.

## Overview

The sync process:
1. Reads the sitemap from `packages/docs/build/sitemap.xml`
2. Fetches HTML content from each URL
3. Extracts text content (removing scripts, styles, navigation)
4. Uploads content to document store using the Plain Text loader
5. Applies Character Text Splitter for chunking

## Local Usage

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Build the documentation site to generate the sitemap:
```bash
pnpm --filter flowise-docs build
```

3. Set environment variables:
```bash
export DOCS_API_HOST="http://localhost:3000"  # or production URL
export DOCS_API_KEY="your-api-key"
export DOCS_STORE_ID="your-document-store-id"
```

### Running the Script

```bash
# Using pnpm script
pnpm sync-docs

# Or directly with tsx
npx tsx scripts/sync-docs-to-docstore.ts
```

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DOCS_API_HOST` | Flowise API host URL for documentation sync | No | `http://localhost:3000` |
| `DOCS_API_KEY` | API key for authentication | Yes | - |
| `DOCS_STORE_ID` | Documentation-specific document store ID | Yes | - |

**Note:** The script also checks fallback environment variables (`API_HOST`, `API_KEY`, `DOCUMENT_STORE_ID`) for backwards compatibility.

### Configuration

Edit the script constants to customize behavior:

```typescript
// In scripts/sync-docs-to-docstore.ts

const CHUNK_SIZE = 1000        // Characters per chunk
const CHUNK_OVERLAP = 200      // Overlap between chunks
const DOMAIN = 'https://answeragent.ai'
```

### URL Filtering

By default, the script filters URLs to only process:
- Documentation pages (`/docs/*`)
- Blog posts (`/blog/*`)
- Key landing pages (homepage, how-it-works, pricing)

To modify filtering, edit the `filteredUrls` logic in the script:

```typescript
const filteredUrls = urls.filter(url =>
    url.includes('/docs/') ||
    url.includes('/blog/') ||
    url === `${DOMAIN}/` ||
    url === `${DOMAIN}/how-it-works`
)
```

## GitHub Action

The GitHub Action (`sync-docs-to-docstore.yml`) automatically syncs documentation when:
- Changes are pushed to `staging` or `main` branches
- Changes affect `packages/docs/**` files
- Manually triggered via workflow dispatch

### Setup

1. Add GitHub Secrets:
   - `DOCS_API_KEY` - Your Flowise API key for documentation sync
   - `DOCS_STORE_ID` - Documentation-specific document store ID
   - `DOCS_API_HOST` (optional) - Defaults to production URL

2. The action will:
   - Build the documentation
   - Verify sitemap exists
   - Sync all documentation
   - Upload logs as artifacts

### Manual Trigger

You can manually trigger the sync from GitHub Actions:

1. Go to Actions → "Sync Documentation to Document Store"
2. Click "Run workflow"
3. Optionally provide a custom Document Store ID
4. Click "Run workflow"

### Viewing Results

After the action completes:
- Check the action logs for sync status
- Download "sync-logs" artifact for detailed logs
- Success summary shows total URLs processed

## Document Store Setup

### Creating a Document Store

1. Log into Flowise
2. Navigate to Document Stores
3. Create a new document store
4. Note the Document Store ID (UUID)
5. Configure vector store (if needed)

### Loader Configuration

The script uses the **Plain Text** loader with these settings:
- **Text Splitter:** Character Text Splitter
- **Chunk Size:** 1000 characters
- **Chunk Overlap:** 200 characters
- **Separators:** `["\n\n", "\n", " ", ""]`

### Metadata

Each document includes metadata:
```json
{
    "source": "answeragent-docs",
    "url": "https://answeragent.ai/docs/...",
    "title": "Page Title",
    "description": "Meta description",
    "timestamp": "2025-11-24T12:00:00.000Z"
}
```

## Troubleshooting

### Sitemap Not Found

```bash
❌ Sitemap not found at packages/docs/build/sitemap.xml
```

**Solution:** Build the docs first:
```bash
pnpm --filter flowise-docs build
```

### API Authentication Failed

```bash
❌ Error uploading: 401 Unauthorized
```

**Solution:** Verify your API key:
```bash
echo $DOCS_API_KEY
```

### Document Store Not Found

```bash
❌ Error uploading: Document store not found
```

**Solution:** Verify the document store ID exists and is accessible with your API key.

### Rate Limiting

The script includes a 1-second delay between requests. If you still hit rate limits:
1. Increase the delay in `main()`:
```typescript
await new Promise(resolve => setTimeout(resolve, 2000))  // 2 seconds
```

### Content Too Short

```bash
⏭️  Skipping https://answeragent.ai/some-page - content too short (50 chars)
```

This is normal for pages with minimal content. Adjust the threshold if needed:
```typescript
if (content.length < 100) {  // Change from 100 to lower value
    console.log(`⏭️  Skipping ${url} - content too short`)
    return
}
```

## Performance

### Timing

- ~1-2 seconds per URL (fetch + upload)
- 1 second delay between requests
- ~200 URLs = 6-10 minutes total

### Optimization

To process faster (with caution):
1. Reduce delay between requests
2. Process URLs in parallel (batches of 5-10)
3. Skip non-essential pages

**Example parallel processing:**
```typescript
// Process in batches of 5
const BATCH_SIZE = 5
for (let i = 0; i < filteredUrls.length; i += BATCH_SIZE) {
    const batch = filteredUrls.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(processUrl))
}
```

## Maintenance

### Regular Sync

Run the sync script:
- After documentation updates
- Weekly to catch any changes
- Before major releases

### Monitoring

Check for:
- Failed URL fetches
- API errors
- Content extraction issues
- Missing or truncated text

### Updates

Update the script when:
- Documentation structure changes
- New page types need inclusion
- Chunking strategy needs adjustment
- Metadata requirements change

## Advanced Usage

### Custom Loaders

To use a different loader (e.g., Markdown, HTML):

1. Change `loaderId` and `loaderName`:
```typescript
loaderId: 'markdown',
loaderName: 'Markdown File',
```

2. Adjust `loaderConfig` for the specific loader
3. Update `splitterId` if needed

### Custom Text Splitters

Available splitters:
- `characterTextSplitter` - Generic text
- `recursiveCharacterTextSplitter` - Better for code/structured text
- `markdownTextSplitter` - Markdown-aware
- `htmlToMarkdownTextSplitter` - HTML to Markdown conversion

### Incremental Updates

To only update changed documents:
1. Track processed URLs in a JSON file
2. Compare current sitemap with tracked URLs
3. Only process new/modified URLs

### Error Recovery

For failed URLs, the script continues processing. To retry failed URLs:
1. Save failed URLs to a file
2. Create a separate script to retry them
3. Use exponential backoff for retries

## Security

### API Keys

- Never commit API keys to git
- Use environment variables or secrets
- Rotate keys regularly
- Use restricted API keys when possible

### Content Validation

The script:
- Removes `<script>` and `<style>` tags
- Strips navigation and headers
- Validates content length
- Sanitizes metadata

### Network Security

- Uses HTTPS for all requests
- Sets appropriate timeouts
- Validates response status
- Handles rate limiting gracefully

## Support

For issues or questions:
1. Check GitHub Action logs
2. Review script output
3. Verify environment variables
4. Check document store configuration
5. Test with a small subset of URLs first
