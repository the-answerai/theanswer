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
