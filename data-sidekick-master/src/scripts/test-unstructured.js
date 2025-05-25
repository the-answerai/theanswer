/**
 * Test script for Unstructured API integration
 *
 * This script tests the connection to the Unstructured API by checking its health endpoint
 * and then trying to process a sample file if available.
 */

import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FormData } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'
import dotenv from 'dotenv'

// Load environment variables based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'local'
if (NODE_ENV === 'local') {
    dotenv.config({ path: '.env.local' })
} else if (NODE_ENV === 'prime') {
    dotenv.config({ path: '.env.prime' })
} else if (NODE_ENV === 'wow') {
    dotenv.config({ path: '.env.wow' })
}

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')

// Unstructured API URL
const UNSTRUCTURED_API_URL = process.env.UNSTRUCTURED_API_URL || 'http://localhost:8000/general/v0/general'
const HEALTH_URL = UNSTRUCTURED_API_URL.replace('/general/v0/general', '/health')

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
}

async function testUnstructuredHealth() {
    console.log(`${colors.cyan}Testing Unstructured API health...${colors.reset}`)

    try {
        const response = await fetch(HEALTH_URL)

        if (response.ok) {
            console.log(`${colors.green}✓ Unstructured API is running and healthy${colors.reset}`)
            return true
        }

        console.log(`${colors.red}✗ Unstructured API health check failed: ${response.status} ${response.statusText}${colors.reset}`)
        return false
    } catch (error) {
        return false
    }
}

async function testFileParsing() {
    console.log(`\n${colors.cyan}Testing file parsing...${colors.reset}`)

    // Look for sample files
    const sampleDir = path.join(rootDir, 'uploads')
    let sampleFiles = []

    try {
        const files = fs.readdirSync(sampleDir)
        sampleFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase()
            return ['.pdf', '.docx', '.txt'].includes(ext)
        })
    } catch (error) {
        console.log(`${colors.yellow}Warning: Could not read sample directory: ${error.message}${colors.reset}`)
    }

    if (sampleFiles.length === 0) {
        console.log(`${colors.yellow}No sample files found in uploads/ directory.${colors.reset}`)
        console.log(`${colors.yellow}Place a PDF, DOCX, or TXT file in the uploads/ directory to test file parsing.${colors.reset}`)
        return
    }

    // Use the first sample file
    const sampleFile = path.join(sampleDir, sampleFiles[0])
    console.log(`${colors.blue}Using sample file: ${sampleFile}${colors.reset}`)

    try {
        // Create a FormData instance
        const formData = new FormData()

        // Add the file to the form data
        const file = await fileFromPath(sampleFile)
        formData.append('files', file)

        // Make API request to Unstructured
        console.log(`${colors.blue}Sending request to Unstructured API...${colors.reset}`)
        const response = await fetch(UNSTRUCTURED_API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                ...(process.env.UNSTRUCTURED_API_KEY && {
                    'unstructured-api-key': process.env.UNSTRUCTURED_API_KEY
                })
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.log(`${colors.red}✗ Failed to process file: ${response.status} ${response.statusText}${colors.reset}`)
            console.log(`${colors.red}Error details: ${errorText}${colors.reset}`)
            return
        }

        const data = await response.json()
        console.log(`${colors.green}✓ File processed successfully!${colors.reset}`)
        console.log(`${colors.blue}Extracted ${data.length} elements${colors.reset}`)

        // Show a preview of the extracted content
        console.log(`\n${colors.cyan}Preview of extracted content:${colors.reset}`)
        data.slice(0, 3).forEach((element, index) => {
            console.log(`\n${colors.yellow}Element ${index + 1} (Type: ${element.type}):${colors.reset}`)
            if (element.text) {
                console.log(element.text.substring(0, 150) + (element.text.length > 150 ? '...' : ''))
            }
        })

        console.log(`\n${colors.green}✓ Unstructured integration test completed successfully!${colors.reset}`)
    } catch (error) {
        console.log(`${colors.red}✗ Error processing file: ${error.message}${colors.reset}`)
    }
}

async function main() {
    console.log(`${colors.magenta}==== Unstructured Integration Test =====${colors.reset}`)
    console.log(`${colors.blue}Environment: ${NODE_ENV}${colors.reset}`)
    console.log(`${colors.blue}Unstructured API URL: ${UNSTRUCTURED_API_URL}${colors.reset}`)

    const isHealthy = await testUnstructuredHealth()

    if (isHealthy) {
        await testFileParsing()
    } else {
        console.log(`${colors.yellow}Skipping file parsing test due to failed health check${colors.reset}`)
    }
}

main().catch((error) => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error)
    process.exit(1)
})
