/**
 * AnswerAI API Debug Tool
 *
 * This script tests the connection to the AnswerAI API endpoint.
 * It validates API connectivity and tests the chatflow.
 *
 * Run with: node src/debug-token.js
 */

import 'dotenv/config'
import fetch from 'node-fetch'

// Test connectivity to the AnswerAI API endpoint
async function testEndpoint(endpoint, chatflowId) {
    console.log('\n-------- Testing API Endpoint --------')
    console.log(`Base endpoint: ${endpoint}`)

    try {
        // Test base endpoint (GET request)
        console.log('\nTesting base endpoint with GET request...')
        const baseResponse = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })

        console.log(`Status: ${baseResponse.status} ${baseResponse.statusText}`)
        if (baseResponse.ok) {
            console.log('✅ Successfully connected to base endpoint')
        } else {
            console.log('❌ Error connecting to base endpoint')
            const errorText = await baseResponse.text()
            console.log(`Error details: ${errorText}`)
        }

        // Test chatflow endpoint (POST request)
        if (chatflowId) {
            console.log(`\nTesting chatflow endpoint: ${endpoint}/prediction/${chatflowId}`)
            const chatflowResponse = await fetch(`${endpoint}/prediction/${chatflowId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: 'This is a test message to verify API connectivity.',
                    metadata: { source: 'debug-script' }
                })
            })

            console.log(`Status: ${chatflowResponse.status} ${chatflowResponse.statusText}`)
            if (chatflowResponse.ok) {
                console.log('✅ Successfully connected to chatflow endpoint')
                const responseData = await chatflowResponse.json()
                console.log(`Response contains: ${Object.keys(responseData).join(', ')}`)
            } else {
                console.log('❌ Error connecting to chatflow endpoint')
                try {
                    const errorText = await chatflowResponse.text()
                    console.log(`Error details: ${errorText}`)
                } catch (e) {
                    console.log('Could not parse error response')
                }
            }
        } else {
            console.log('\n⚠️ No chatflow ID provided - skipping chatflow test')
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`)
        if (error.message.includes('ENOTFOUND')) {
            console.log('  The domain could not be resolved. Check your network connection and the endpoint URL.')
        }
    }
}

// Print environment variable status
function printEnvironment() {
    console.log('\n-------- Environment Variables --------')
    const endpoint = process.env.ANSWERAI_ENDPOINT
    const chatflowId = process.env.ANSWERAI_ANALYSIS_CHATFLOW

    console.log(`ANSWERAI_ENDPOINT: ${endpoint ? '✓ Set' : '✗ Missing!'}`)
    console.log(`ANSWERAI_ANALYSIS_CHATFLOW: ${chatflowId ? '✓ Set' : '✗ Missing!'}`)

    return { endpoint, chatflowId }
}

// Run all diagnostic tests
async function runTests() {
    console.log('======= AnswerAI API Diagnostic Tool =======')

    // Check environment variables
    const { endpoint, chatflowId } = printEnvironment()

    if (!endpoint) {
        console.log('\n❌ ANSWERAI_ENDPOINT is missing. Please set this variable in your .env file.')
        return
    }

    // Test endpoint connectivity
    await testEndpoint(endpoint, chatflowId)

    console.log('\n======= Diagnostics Complete =======')
}

// Execute the tests
runTests().catch((error) => {
    console.error('Unexpected error during diagnostics:', error)
})
