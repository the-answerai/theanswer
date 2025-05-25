import fetch from 'node-fetch'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v4 as uuidv4 } from 'uuid'

// Setup to allow __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the appropriate .env file
const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env'
        : process.env.NODE_ENV === 'wow'
        ? '.env.wow'
        : process.env.NODE_ENV === 'prime'
        ? '.env.prime'
        : '.env.local'

console.log(`Loading environment from ${envFile}`)
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) })

// AnswerAI API endpoint from environment variables
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_TOKEN = process.env.ANSWERAI_TOKEN

/**
 * Validate JWT token format
 * @param {string} token The JWT token to validate
 * @returns {boolean} Whether the token is valid
 */
const isValidJWT = (token) => {
    if (!token) return false

    // Check if token starts with 'ia-' prefix, which indicates it's an AnswerAI API key format
    if (token.startsWith('ia-')) {
        return true // Accept AnswerAI API key format
    }

    // A JWT consists of three parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
        console.error('JWT token does not have 3 parts')
        return false
    }

    // Each part should be base64url encoded
    try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())

        // Check if header has typical JWT fields
        if (!header.alg) {
            console.error('JWT token header missing algorithm')
            return false
        }

        // Signature exists (we don't validate it cryptographically here)
        if (!parts[2]) {
            console.error('JWT token missing signature')
            return false
        }

        return true
    } catch (error) {
        console.error('Error parsing JWT token:', error.message)
        return false
    }
}

/**
 * Log details about the environment and configuration
 */
const logConfigDetails = () => {
    const config = {
        endpointConfigured: !!ANSWERAI_ENDPOINT,
        tokenConfigured: !!ANSWERAI_TOKEN,
        endpointPrefix: ANSWERAI_ENDPOINT ? `${ANSWERAI_ENDPOINT.substring(0, 10)}...` : 'Not set',
        tokenPrefix: ANSWERAI_TOKEN ? `${ANSWERAI_TOKEN.substring(0, 5)}...` : 'Not set',
        tokenLength: ANSWERAI_TOKEN ? ANSWERAI_TOKEN.length : 0
    }

    console.log('AnswerAI Configuration:', config)
    return config
}

/**
 * Test the connection to the AnswerAI API
 */
const testConnection = async () => {
    try {
        console.log('Starting AnswerAI connection test...')
        const config = logConfigDetails()

        if (!ANSWERAI_ENDPOINT) {
            console.error('ANSWERAI_ENDPOINT environment variable is not set')
            return { success: false, error: 'ANSWERAI_ENDPOINT environment variable is not set', config }
        }

        if (!ANSWERAI_TOKEN) {
            console.error('ANSWERAI_TOKEN environment variable is not set')
            return { success: false, error: 'ANSWERAI_TOKEN environment variable is not set', config }
        }

        // Ensure ANSWERAI_ENDPOINT is properly formatted
        let baseEndpoint = ANSWERAI_ENDPOINT
        if (baseEndpoint.endsWith('/')) {
            baseEndpoint = baseEndpoint.slice(0, -1)
        }

        // Try to get a list of document stores as a simple test
        const url = baseEndpoint.includes('/api/v1')
            ? `${baseEndpoint}/document-store/stores`
            : `${baseEndpoint}/api/v1/document-store/stores`

        console.log('Testing AnswerAI connection at URL:', url)

        // Prepare token with Bearer prefix
        const tokenValue = ANSWERAI_TOKEN.trim()
        const authHeader = `Bearer ${tokenValue}`

        console.log('Using authorization format: Bearer [token]')
        console.log('Token validation check:', isValidJWT(tokenValue) ? 'Token format looks valid' : 'Token format is invalid')

        // Make a GET request
        console.log('Sending test request to AnswerAI API...')
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: authHeader
            }
        })

        console.log('Received response with status:', response.status, response.statusText)

        if (!response.ok) {
            let errorText
            try {
                errorText = await response.text()
                console.log('Error response body:', errorText)
            } catch (e) {
                errorText = 'Could not read error response'
                console.error('Failed to read error response:', e)
            }

            console.error('AnswerAI API error response:', {
                status: response.status,
                statusText: response.statusText,
                url,
                body: errorText
            })

            return {
                success: false,
                error: `AnswerAI API returned ${response.status}: ${errorText}`,
                status: response.status,
                isValidToken: isValidJWT(tokenValue),
                config
            }
        }

        const result = await response.json()
        console.log('AnswerAI API test successful!')
        console.log('Response:', JSON.stringify(result, null, 2))

        return {
            success: true,
            data: result,
            isValidToken: isValidJWT(tokenValue),
            config
        }
    } catch (error) {
        console.error('Error testing AnswerAI connection:', error)
        return {
            success: false,
            error: error.message,
            stack: error.stack,
            config: logConfigDetails()
        }
    }
}

/**
 * Test the document processing endpoint
 * @param {string} [existingStoreId] - Optional existing store ID to use instead of generating a new one
 */
const testDocumentProcessing = async (existingStoreId) => {
    try {
        console.log('Testing AnswerAI document processing...')
        const config = logConfigDetails()

        if (!ANSWERAI_ENDPOINT || !ANSWERAI_TOKEN) {
            console.error('ANSWERAI_ENDPOINT or ANSWERAI_TOKEN environment variable is not set')
            return { success: false, error: 'Missing required environment variables', config }
        }

        // Ensure ANSWERAI_ENDPOINT is properly formatted
        let baseEndpoint = ANSWERAI_ENDPOINT
        if (baseEndpoint.endsWith('/')) {
            baseEndpoint = baseEndpoint.slice(0, -1)
        }

        // Construct the URL properly
        const url = baseEndpoint.includes('/api/v1')
            ? `${baseEndpoint}/document-store/loader/process`
            : `${baseEndpoint}/api/v1/document-store/loader/process`

        console.log('Testing document processing at URL:', url)

        // Use provided store ID or generate a valid UUID (not a timestamp-based ID)
        const storeId = existingStoreId || uuidv4()
        console.log(`Using store ID: ${storeId}${existingStoreId ? ' (provided)' : ' (generated UUID)'}`)

        // Sample request data based on your example
        const testData = {
            loaderId: 'plainText',
            storeId: storeId,
            loaderName: 'Plain Text',
            loaderConfig: {
                text: 'This is a test document for the AnswerAI API. It should be processed into chunks.',
                textSplitter: '',
                metadata: JSON.stringify({ source: 'test-script' }),
                omitMetadataKeys: ''
            },
            splitterId: 'recursiveCharacterTextSplitter',
            splitterConfig: {
                chunkSize: '30',
                chunkOverlap: '0',
                separators: JSON.stringify(['\n'])
            },
            splitterName: 'Recursive Character Text Splitter'
        }

        // Prepare authorization header
        const tokenValue = ANSWERAI_TOKEN.trim()
        const authHeader = `Bearer ${tokenValue}`

        console.log('Request parameters:', {
            storeId: testData.storeId,
            loaderId: testData.loaderId,
            loaderName: testData.loaderName,
            hasLoaderConfig: !!testData.loaderConfig,
            splitterId: testData.splitterId,
            splitterName: testData.splitterName,
            hasSplitterConfig: !!testData.splitterConfig
        })

        // Make the API request
        console.log('Sending document processing request...')
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: authHeader
            },
            body: JSON.stringify(testData)
        })

        console.log('Received response with status:', response.status, response.statusText)

        if (!response.ok) {
            let errorText
            try {
                errorText = await response.text()
                console.log('Error response body:', errorText)
            } catch (e) {
                errorText = 'Could not read error response'
                console.error('Failed to read error response:', e)
            }

            console.error('Document processing API error response:', {
                status: response.status,
                statusText: response.statusText,
                url,
                body: errorText
            })

            return {
                success: false,
                error: `API returned ${response.status}: ${errorText}`,
                status: response.status
            }
        }

        const result = await response.json()
        console.log('Document processing test successful!')

        // Extract and display key information
        if (result.file) {
            console.log('\nDocument Details:')
            console.log(`- Document ID: ${result.file.id}`)
            console.log(`- Status: ${result.file.status}`)
            console.log(`- Store Name: ${result.storeName}`)
            console.log(`- Total Characters: ${result.file.totalChars}`)
            console.log(`- Total Chunks: ${result.file.totalChunks} (may be 0 if still processing)`)

            // Log the first few characters of the text for confirmation
            if (result.file?.loaderConfig?.text) {
                const previewText =
                    result.file.loaderConfig.text.length > 50
                        ? `${result.file.loaderConfig.text.substring(0, 50)}...`
                        : result.file.loaderConfig.text
                console.log(`- Text Preview: "${previewText}"`)
            }
        }

        // Still log the full response, but with better formatting
        console.log('\nFull Response:', JSON.stringify(result, null, 2))

        return {
            success: true,
            data: result
        }
    } catch (error) {
        console.error('Error testing document processing:', error)
        return {
            success: false,
            error: error.message,
            stack: error.stack
        }
    }
}

// Main function to run tests
const runTests = async () => {
    console.log('=== ANSWERAI CONNECTION TEST TOOL ===')
    console.log('Testing connection to AnswerAI API...')

    // Check for store ID argument
    const existingStoreId = process.argv[2]
    if (existingStoreId) {
        console.log(`Using provided store ID: ${existingStoreId}`)
    }

    // Test basic connection
    console.log('\n=== CONNECTION TEST ===')
    const connectionResult = await testConnection()
    console.log('\nConnection test result:', connectionResult.success ? 'SUCCESS' : 'FAILED')

    // Define processingResult in the outer scope
    let processingResult

    // If connection is successful, test document processing
    if (connectionResult.success) {
        console.log('\n=== DOCUMENT PROCESSING TEST ===')
        processingResult = await testDocumentProcessing(existingStoreId)
        console.log('\nDocument processing test result:', processingResult.success ? 'SUCCESS' : 'FAILED')

        // Explain the SYNC status if successful
        if (processingResult.success && processingResult.data?.file?.status === 'SYNC') {
            console.log('\n📋 About the "SYNC" status:')
            console.log('- "SYNC" means the document was accepted and is being processed in the background')
            console.log('- The chunks are generated asynchronously and will not appear immediately')
            console.log('- This is expected behavior - the API starts a background job to process the document')
            console.log('- You can check the status later using the document store API')
        }
    } else {
        console.log('\nSkipping document processing test due to connection failure.')
    }

    console.log('\n=== TEST SUMMARY ===')
    console.log('Connection Test:', connectionResult.success ? 'PASSED' : 'FAILED')
    if (connectionResult.success) {
        console.log('Document Processing Test:', processingResult?.success ? 'PASSED' : 'FAILED')
    }
    console.log('\nTesting completed.')
}

// Run the tests
runTests().catch((error) => {
    console.error('Unhandled error in tests:', error)
    process.exit(1)
})
