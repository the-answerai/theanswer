/**
 * Test script for Unstructured Integration
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { processFile, checkApiStatus, extractText } from './src/services/unstructured/index.js'

// Load appropriate .env file
const NODE_ENV = process.env.NODE_ENV || 'local'
if (NODE_ENV === 'local') {
    dotenv.config({ path: '.env.local' })
} else if (NODE_ENV === 'prime') {
    dotenv.config({ path: '.env.prime' })
} else if (NODE_ENV === 'wow') {
    dotenv.config({ path: '.env.wow' })
}

// Get current file directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
}

// Create a sample text file for testing
async function createSampleFile() {
    const sampleText = `
This is a sample text file created for testing Unstructured.
It contains multiple paragraphs of text that Unstructured can process.

Unstructured is a powerful library for extracting structured content from
unstructured documents like PDFs, Word documents, and more.

This file will be processed using the Unstructured library running in a Docker container.
`

    const filePath = path.join(__dirname, 'uploads', 'sample-test.txt')
    await fs.promises.writeFile(filePath, sampleText)
    return filePath
}

async function main() {
    console.log(`${colors.magenta}==== Unstructured Integration Test =====${colors.reset}`)
    console.log(`${colors.blue}Environment: ${NODE_ENV}${colors.reset}`)

    // Step 1: Check if the Unstructured container is running
    console.log(`\n${colors.cyan}Checking Unstructured container status...${colors.reset}`)
    const isAvailable = await checkApiStatus()

    if (!isAvailable) {
        console.log(`${colors.red}Error: Unstructured container is not running${colors.reset}`)
        console.log(`${colors.yellow}Start the container with: npm run unstructured:start${colors.reset}`)
        process.exit(1)
    }

    console.log(`${colors.green}✓ Unstructured container is running${colors.reset}`)

    // Step 2: Create a sample file for testing
    console.log(`\n${colors.cyan}Creating sample file for testing...${colors.reset}`)
    const sampleFilePath = await createSampleFile()
    console.log(`${colors.green}✓ Created sample file: ${sampleFilePath}${colors.reset}`)

    // Step 3: Process the file
    console.log(`\n${colors.cyan}Processing file with Unstructured...${colors.reset}`)
    try {
        const elements = await processFile(sampleFilePath)
        console.log(`${colors.green}✓ Successfully processed file${colors.reset}`)
        console.log(`${colors.blue}Found ${elements.length} elements${colors.reset}`)

        // Print a sample of the elements
        console.log(`\n${colors.cyan}Sample of extracted elements:${colors.reset}`)
        elements.slice(0, 3).forEach((element, index) => {
            console.log(`\n${colors.yellow}Element ${index + 1} (Type: ${element.type})${colors.reset}`)
            console.log(element.text)
        })

        // Step 4: Extract text from the file
        console.log(`\n${colors.cyan}Extracting text from file...${colors.reset}`)
        const text = await extractText(sampleFilePath)
        console.log(`${colors.green}✓ Successfully extracted text${colors.reset}`)
        console.log(`\n${colors.yellow}Extracted text:${colors.reset}\n${text}`)

        console.log(`\n${colors.green}All tests passed!${colors.reset}`)
    } catch (error) {
        console.error(`${colors.red}Error during test: ${error.message}${colors.reset}`)
        console.error(error)
        process.exit(1)
    }
}

main().catch((error) => {
    console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`)
    console.error(error)
    process.exit(1)
})
