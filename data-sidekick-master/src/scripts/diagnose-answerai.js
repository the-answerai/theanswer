/**
 * AnswerAI Diagnostic Tool
 * This script helps diagnose issues with the AnswerAI integration
 */

import fetch from 'node-fetch'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import dns from 'node:dns'
import { promisify } from 'node:util'

// Setup to allow __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from the appropriate .env file
const getEnvFilePath = (env) => {
    switch (env) {
        case 'production':
            return '.env'
        case 'wow':
            return '.env.wow'
        case 'prime':
            return '.env.prime'
        default:
            return '.env.local'
    }
}

const envFile = getEnvFilePath(process.env.NODE_ENV)
const envPath = path.resolve(__dirname, '../../', envFile)

// Check if env file exists
if (!fs.existsSync(envPath)) {
    console.log(`[WARNING] Environment file ${envPath} does not exist.`)
} else {
    console.log(`Loading environment from ${envFile}`)
    dotenv.config({ path: envPath })
}

// Get environment variables
const ANSWERAI_ENDPOINT = process.env.ANSWERAI_ENDPOINT
const ANSWERAI_TOKEN = process.env.ANSWERAI_TOKEN

// Helper for DNS lookup
const lookup = promisify(dns.lookup)

/**
 * Check basic connectivity to a host
 */
async function checkConnectivity(url) {
    try {
        // Extract hostname from URL
        const hostname = new URL(url).hostname
        console.log(`Checking DNS resolution for ${hostname}...`)

        // Try DNS lookup
        const dnsResult = await lookup(hostname)
        console.log(`DNS resolution successful: ${hostname} -> ${dnsResult.address}`)

        // Try basic HTTP request
        console.log(`Testing HTTP connectivity to ${url}...`)
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' }
        })

        console.log(`HTTP connectivity test result: ${response.status} ${response.statusText}`)
        return { success: true, status: response.status }
    } catch (error) {
        console.error('Connectivity check failed:', error.message)
        return { success: false, error: error.message }
    }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
    console.log('=== ANSWERAI DIAGNOSTIC TOOL ===')

    // Environment variables check
    console.log('\n1. Checking environment variables:')
    const envStatus = {
        ANSWERAI_ENDPOINT: {
            set: !!ANSWERAI_ENDPOINT,
            value: ANSWERAI_ENDPOINT ? ANSWERAI_ENDPOINT : 'Not set'
        },
        ANSWERAI_TOKEN: {
            set: !!ANSWERAI_TOKEN,
            value: ANSWERAI_TOKEN ? `${ANSWERAI_TOKEN.substring(0, 5)}... (${ANSWERAI_TOKEN.length} characters)` : 'Not set'
        },
        ENV_FILE: {
            path: envPath,
            exists: fs.existsSync(envPath)
        }
    }

    console.log('Environment variables status:')
    console.log(`- ANSWERAI_ENDPOINT: ${envStatus.ANSWERAI_ENDPOINT.set ? 'Set ✅' : 'Not set ❌'}`)
    console.log(`  Value: ${envStatus.ANSWERAI_ENDPOINT.value}`)
    console.log(`- ANSWERAI_TOKEN: ${envStatus.ANSWERAI_TOKEN.set ? 'Set ✅' : 'Not set ❌'}`)
    console.log(`  Value: ${envStatus.ANSWERAI_TOKEN.value}`)
    console.log(`- Environment file: ${envStatus.ENV_FILE.exists ? 'Exists ✅' : 'Missing ❌'}`)
    console.log(`  Path: ${envStatus.ENV_FILE.path}`)

    // Skip further checks if endpoint is not set
    if (!ANSWERAI_ENDPOINT) {
        console.log('\n❌ Cannot proceed with network checks: ANSWERAI_ENDPOINT is not set')
        return
    }

    // Connectivity checks
    console.log('\n2. Testing connectivity:')

    // Check basic connectivity to the domain
    const baseUrl = new URL(ANSWERAI_ENDPOINT).origin
    const connectivityResult = await checkConnectivity(baseUrl)

    // If base connectivity works, test the actual API endpoint
    if (connectivityResult.success) {
        console.log('\n3. Testing AnswerAI API endpoint:')

        // Get proper API endpoint URL
        let baseEndpoint = ANSWERAI_ENDPOINT
        if (baseEndpoint.endsWith('/')) {
            baseEndpoint = baseEndpoint.slice(0, -1)
        }

        console.log(`Testing API endpoint: ${apiUrl}`)

        try {
            // Test with actual token
            if (ANSWERAI_TOKEN) {
                console.log('Sending authenticated request...')
                const tokenValue = ANSWERAI_TOKEN.trim()
                const authHeader = `Bearer ${tokenValue}`

                const apiResponse = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: authHeader
                    }
                })

                console.log(`API test result: ${apiResponse.status} ${apiResponse.statusText}`)

                if (apiResponse.ok) {
                    console.log('✅ API connection successful!')
                    const data = await apiResponse.json()
                    console.log(`Retrieved ${Array.isArray(data) ? data.length : 0} document stores.`)

                    // Show first store ID if available
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`First store ID: ${data[0].id}`)
                        console.log('You can use this ID for testing document processing.')

                        // Test document processing endpoint specifically
                        console.log('\n4. Testing document processing endpoint:')
                        const processEndpoint = baseEndpoint.includes('/api/v1')
                            ? `${baseEndpoint}/document-store/loader/process`
                            : `${baseEndpoint}/api/v1/document-store/loader/process`

                        console.log(`Testing process endpoint: ${processEndpoint}`)

                        try {
                            // Prepare a minimal test request
                            const testPayload = {
                                loaderId: 'plainText',
                                storeId: data[0].id, // Use the first store ID
                                loaderName: 'Plain Text',
                                loaderConfig: {
                                    text: 'Test document for diagnostic',
                                    textSplitter: '',
                                    metadata: JSON.stringify({ source: 'diagnostic' }),
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

                            console.log('Sending test processing request...')
                            console.log(`Target store ID: ${data[0].id}`)
                            console.log('Request method: POST')

                            const processResponse = await fetch(processEndpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Accept: 'application/json',
                                    Authorization: authHeader
                                },
                                body: JSON.stringify(testPayload)
                            })

                            console.log(`Process endpoint test result: ${processResponse.status} ${processResponse.statusText}`)

                            if (processResponse.ok) {
                                const processData = await processResponse.json()
                                console.log('✅ Process endpoint test successful!')
                                console.log(`Response contains file ID: ${processData.file?.id || 'Not found'}`)
                                console.log(`Status: ${processData.file?.status || 'Not found'}`)
                            } else {
                                console.log('❌ Process endpoint test failed!')
                                const errorText = await processResponse.text()
                                console.log(`Error: ${errorText}`)
                            }
                        } catch (processError) {
                            console.error('❌ Process endpoint test failed:', processError.message)
                        }
                    }
                } else {
                    console.log('❌ API request failed!')
                    const errorText = await apiResponse.text()
                    console.log(`Error: ${errorText}`)
                }
            } else {
                console.log('❌ Cannot test API authentication: ANSWERAI_TOKEN is not set')
            }
        } catch (error) {
            console.error('❌ API endpoint test failed:', error.message)
        }
    }

    console.log('\n=== DIAGNOSTICS SUMMARY ===')
    console.log(
        `Environment variables: ${envStatus.ANSWERAI_ENDPOINT.set && envStatus.ANSWERAI_TOKEN.set ? 'Complete ✅' : 'Incomplete ❌'}`
    )
    console.log(`Basic connectivity: ${connectivityResult.success ? 'Success ✅' : 'Failed ❌'}`)

    // Suggest fixes
    console.log("\nPossible solutions if you're having issues:")
    console.log('1. Verify that the AnswerAI server is running and accessible')
    console.log('2. Check your .env file to ensure ANSWERAI_ENDPOINT and ANSWERAI_TOKEN are correctly set')
    console.log('3. Make sure the endpoint includes "/api/v1" if required by your AnswerAI server')
    console.log('4. Check network connectivity and firewall settings')
    console.log('5. Verify that your AnswerAI token is valid and has not expired')
}

runDiagnostics().catch((error) => {
    console.error('Unhandled error in diagnostics:', error)
    process.exit(1)
})
