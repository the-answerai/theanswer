# AnswerAI Chatflow Testing

Test your AnswerAI chatflows with multi-turn conversations and file uploads.

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create `.env` file in project root:

    ```bash
    TESTING_CHATFLOWS_API_URL=https://prod.studio.theanswer.ai/
    TESTING_CHATFLOWS_AUTH_TOKEN=your_jwt_token
    TESTING_CHATFLOWS_REQUEST_DELAY_MS=50
    ```

3. Run tests:
    ```bash
    npm test
    ```

## Usage

```bash
# Basic run
node testingChatflows.js

# With options
node testingChatflows.js --verbose --output results.json
node testingChatflows.js --file my-tests.js --no-delay
```

**Options:**

-   `--file, -f`: Test file path (default: `./chatflows.js`)
-   `--verbose, -v`: Detailed logging
-   `--output, -o`: Save JSON results
-   `--no-delay`: Skip request delays
-   `--retries, -r`: Retry attempts (default: 2)
-   `--timeout, -t`: Request timeout ms (default: 30000)

## Test Format

```javascript
// chatflows.js
module.exports = [
    {
        id: 'your-chatflow-uuid',
        enabled: true,
        internalName: 'My Test',
        conversation: [
            {
                input: 'Hello!',
                files: []
            },
            {
                input: 'Analyze this image',
                files: [{ path: './assets/image.png', type: 'image/png' }]
            }
        ]
    }
]
```

**Properties:**

-   `id`: Chatflow UUID (required)
-   `enabled`: Run this test (default: true)
-   `internalName`: Display name
-   `conversation`: Array of turns
-   `input`: Message to send
-   `files`: Files to upload (path relative to project root)

## Common Issues

-   **Missing env vars**: Create `.env` with required variables
-   **404 errors**: Check chatflow UUID and ensure it's published
-   **401 errors**: Verify auth token is valid
-   **File errors**: Check file paths are correct and files exist
-   **Rate limits**: Increase `TESTING_CHATFLOWS_REQUEST_DELAY_MS`

## New Rate Limiting Features

### Image Generation Support

-   **Automatic Detection**: Script detects image generation requests and applies longer delays
-   **Extended Timeouts**: Image generation requests get 60+ second timeouts automatically
-   **Exponential Backoff**: Special rate limiting handling with up to 5-minute delays
-   **Skip Option**: Use `--skip-image-generation` to skip image generation turns entirely

### Rate Limiting Troubleshooting

If you encounter OpenAI rate limiting errors (Error 1015):

1. **Use Skip Option**: `--skip-image-generation` to avoid image generation
2. **Increase Delays**: Set higher `TESTING_CHATFLOWS_REQUEST_DELAY_MS` (e.g., 5000ms)
3. **Different Environment**: Test against staging instead of production
4. **Different API Key**: Use a separate OpenAI API key for testing

### Example Commands

```bash
# Skip image generation to avoid rate limits
pnpm test:chatflows -- --skip-image-generation

# Use longer delays with verbose logging
TESTING_CHATFLOWS_REQUEST_DELAY_MS=5000 pnpm test:chatflows -- --verbose

# Test against different environment
TESTING_CHATFLOWS_API_URL=https://staging.studio.theanswer.ai pnpm test:chatflows

# Save results to file for analysis
pnpm test:chatflows -- --output results.json --verbose
```

## Environment Variables

-   `TESTING_CHATFLOWS_API_URL` - API base URL (takes precedence over API_HOST)
-   `API_HOST` - Fallback API base URL
-   `TESTING_CHATFLOWS_AUTH_TOKEN` - Bearer token for authentication
-   `TESTING_CHATFLOWS_REQUEST_DELAY_MS` - Delay between requests (increase for rate limiting)
-   `AAI_DEFAULT_OPENAI_API_KEY` - OpenAI API key used by the chatflows

## Command Line Options

-   `--file, -f`: Path to JS file (default: ./chatflows.js)
-   `--no-delay`: Disable delay between requests
-   `--retries, -r`: Number of retry attempts (default: 2)
-   `--timeout, -t`: Request timeout in milliseconds (default: 30000)
-   `--output, -o`: Save results to JSON file
-   `--verbose, -v`: Enable detailed logging
-   `--skip-image-generation`: Skip image generation turns to avoid rate limiting
-   `--help, -h`: Show help
