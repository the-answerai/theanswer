/**
 * Simple API verification script
 * Run with: node src/verify-token.js
 */
import 'dotenv/config'
import fetch from 'node-fetch'

// Main validation function
async function validateAnswerAISetup() {
    console.log('=== AnswerAI API Verification ===\n')

    // Check environment variables
    const endpoint = process.env.ANSWERAI_ENDPOINT
    const chatflowId = process.env.ANSWERAI_ANALYSIS_CHATFLOW

    console.log('Environment Check:')
    console.log(`ANSWERAI_ENDPOINT: ${endpoint ? '✓ Set' : '✗ Not set!'}`)
    console.log(`ANSWERAI_ANALYSIS_CHATFLOW: ${chatflowId ? `✓ Set (${chatflowId})` : '✗ Not set!'}`)

    if (!endpoint) {
        console.log('\n❌ Required environment variable ANSWERAI_ENDPOINT is missing. Please check your .env file.')
        return
    }

    // Test API connection
    console.log('\nTesting connection to the API...')
    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        console.log(`Status: ${response.status} ${response.statusText}`)

        if (response.ok) {
            console.log('✅ Successfully connected to the API endpoint!')
        } else {
            console.log('❌ Failed to connect to the API endpoint.')
            const errorText = await response.text()
            console.log(`Error: ${errorText}`)
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`)
        if (error.message.includes('ENOTFOUND')) {
            console.log('\nThe endpoint domain cannot be reached. Please check:')
            console.log('- The URL is correct')
            console.log('- Your internet connection')
            console.log('- VPN settings if applicable')
        }
    }

    // Test chatflow endpoint if available
    if (chatflowId) {
        console.log('\nTesting specific chatflow endpoint...')
        try {
            const chatflowUrl = `${endpoint}/prediction/${chatflowId}`
            console.log(`Endpoint: ${chatflowUrl}`)

            const response = await fetch(chatflowUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: 'This is a test message to verify the API connection.',
                    metadata: {
                        source: 'verification-script'
                    }
                })
            })

            console.log(`Status: ${response.status} ${response.statusText}`)

            if (response.ok) {
                console.log('✅ Successfully connected to the chatflow endpoint!')
                const data = await response.json()
                console.log(`Response contains: ${Object.keys(data).join(', ')}`)
            } else {
                console.log('❌ Failed to connect to the chatflow endpoint.')
                const errorText = await response.text()
                console.log(`Error: ${errorText}`)

                if (response.status === 404) {
                    console.log('\nPossible issue: The chatflow ID may be incorrect or not exist')
                }
            }
        } catch (error) {
            console.log(`❌ Network error: ${error.message}`)
        }
    }

    console.log('\n=== Verification Complete ===')
}

// Run the validation
validateAnswerAISetup().catch((error) => {
    console.error('Unexpected error during validation:', error)
})
