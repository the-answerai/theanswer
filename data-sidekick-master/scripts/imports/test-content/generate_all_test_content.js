import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified

console.log(`=== Generating test content for ${env.toUpperCase()} environment ===\n`)

try {
    // Step 1: Generate test tags
    console.log('Step 1: Generating test tags...')
    execSync(`node ${path.join(__dirname, 'generate_test_tags.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 2: Generate test tickets
    console.log('Step 2: Generating test tickets...')
    execSync(`node ${path.join(__dirname, 'generate_test_tickets.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 3: Generate test call logs
    console.log('Step 3: Generating test call logs...')
    execSync(`node ${path.join(__dirname, 'generate_test_call_logs.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 4: Generate test users
    console.log('Step 4: Generating test users...')
    execSync(`node ${path.join(__dirname, 'generate_test_users.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 5: Generate test documents
    console.log('Step 5: Generating test documents...')
    execSync(`node ${path.join(__dirname, 'generate_test_documents.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 6: Generate test chats
    console.log('Step 6: Generating test chats...')
    execSync(`node ${path.join(__dirname, 'generate_test_chats.js')} ${env}`, { stdio: 'inherit' })
    console.log('\n')

    // Step 7: Check test data
    console.log('Step 7: Checking test data...')
    execSync(`node ${path.join(__dirname, '../../../scripts/check-test-data.js')} ${env}`, { stdio: 'inherit' })

    console.log('\n=== Test content generation complete! ===')
} catch (error) {
    console.error('Error generating test content:', error.message)
    process.exit(1)
}
