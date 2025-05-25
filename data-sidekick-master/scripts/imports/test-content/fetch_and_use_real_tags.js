import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import path from 'node:path'
import readline from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified
const shouldClearData = args.includes('--clear') || args.includes('-c')

console.log(`=== Generating realistic test content for ${env.toUpperCase()} environment ===\n`)
console.log(`Clear existing data: ${shouldClearData ? 'Yes' : 'No'}\n`)

// Load environment variables
dotenv.config({ path: `.env.${env}` })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Required environment variables are missing!')
    console.error(`Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.${env}`)
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Function to fetch all tags from the database
async function fetchAllTags() {
    try {
        console.log('Fetching all tags from the database...')

        const { data: tags, error } = await supabase.from('tags').select('*').order('parent_id', { nullsFirst: true })

        if (error) {
            console.error('Error fetching tags:', error)
            return null
        }

        console.log(`Successfully fetched ${tags.length} tags!`)
        return tags
    } catch (error) {
        console.error('Error in fetchAllTags:', error)
        return null
    }
}

// Function to organize tags into a structured format
function organizeTagsForContent(tags) {
    // Group tags by parent_id
    const parentTags = tags.filter((tag) => !tag.parent_id)
    const childTagsByParentId = {}

    for (const childTag of tags.filter((tag) => tag.parent_id)) {
        if (!childTagsByParentId[childTag.parent_id]) {
            childTagsByParentId[childTag.parent_id] = []
        }
        childTagsByParentId[childTag.parent_id].push(childTag)
    }

    // Create combinations of parent and child tags for realistic tag sets
    const tagCombinations = {}

    for (const parent of parentTags) {
        const children = childTagsByParentId[parent.id] || []

        if (children.length === 0) {
            // If parent has no children, use it as a standalone tag
            tagCombinations[parent.slug] = [parent.slug]
        } else {
            // Create combinations with parent and each child
            for (const child of children) {
                tagCombinations[`${parent.slug}_${child.slug}`] = [parent.slug, child.slug]
            }

            // Also create some combinations with just the parent
            tagCombinations[parent.slug] = [parent.slug]
        }
    }

    return {
        allTags: tags,
        parentTags,
        childTagsByParentId,
        tagCombinations
    }
}

// Function to clean the database before generating new test content
async function clearExistingData() {
    try {
        const tables = ['call_log', 'documents', 'jira_tickets', 'jira_projects', 'chats']

        console.log('Clearing existing data from the database...')

        for (const table of tables) {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')

            if (error) {
                console.error(`Error clearing ${table}:`, error)
            } else {
                console.log(`Cleared ${table} table`)
            }
        }

        console.log('Database cleanup completed')
    } catch (error) {
        console.error('Error in clearExistingData:', error)
    }
}

// Function to create a temporary file with tag data for generator scripts
async function createTagDataFile(tagData) {
    try {
        const fs = await import('node:fs/promises')
        const tempFilePath = path.join(__dirname, 'temp_tag_data.json')

        await fs.writeFile(tempFilePath, JSON.stringify(tagData, null, 2))

        console.log(`Tag data saved to ${tempFilePath}`)
        return tempFilePath
    } catch (error) {
        console.error('Error in createTagDataFile:', error)
        return null
    }
}

// Main function to orchestrate the process
async function generateRealisticTestContent() {
    try {
        // Step 1: Clear existing data if requested
        if (shouldClearData) {
            await clearExistingData()
        }

        // Step 2: Fetch all tags from the database
        const tags = await fetchAllTags()
        if (!tags || tags.length === 0) {
            console.error('No tags found in the database!')
            console.log('First run the create_tags.js script to populate tags.')
            return
        }

        // Step 3: Organize tags for content generation
        const tagData = organizeTagsForContent(tags)

        // Step 4: Create a temporary file with tag data
        const tagDataFilePath = await createTagDataFile(tagData)
        if (!tagDataFilePath) {
            console.error('Failed to create tag data file!')
            return
        }

        console.log('\n=== Starting test content generation with real tags ===\n')

        // Step 5: Generate test users
        console.log('Step 1: Generating test users...')
        execSync(`node ${path.join(__dirname, 'generate_test_users.js')} ${env}`, { stdio: 'inherit' })
        console.log('\n')

        // Step 6: Generate test tickets with real tags
        console.log('Step 2: Generating test tickets with real tags...')
        execSync(`node ${path.join(__dirname, 'generate_test_tickets.js')} ${env} --tag-file=${tagDataFilePath}`, {
            stdio: 'inherit',
            env: { ...process.env, USE_REAL_TAGS: 'true', TAG_DATA_PATH: tagDataFilePath }
        })
        console.log('\n')

        // Step 7: Generate test call logs with real tags
        console.log('Step 3: Generating test call logs with real tags...')
        execSync(`node ${path.join(__dirname, 'generate_test_call_logs.js')} ${env} --tag-file=${tagDataFilePath}`, {
            stdio: 'inherit',
            env: { ...process.env, USE_REAL_TAGS: 'true', TAG_DATA_PATH: tagDataFilePath }
        })
        console.log('\n')

        // Step 8: Generate test documents with real tags
        console.log('Step 4: Generating test documents with real tags...')
        execSync(`node ${path.join(__dirname, 'generate_test_documents.js')} ${env} --tag-file=${tagDataFilePath}`, {
            stdio: 'inherit',
            env: { ...process.env, USE_REAL_TAGS: 'true', TAG_DATA_PATH: tagDataFilePath }
        })
        console.log('\n')

        // Step 9: Generate test chats with real tags
        console.log('Step 5: Generating test chats with real tags...')
        execSync(`node ${path.join(__dirname, 'generate_test_chats.js')} ${env} --tag-file=${tagDataFilePath}`, {
            stdio: 'inherit',
            env: { ...process.env, USE_REAL_TAGS: 'true', TAG_DATA_PATH: tagDataFilePath }
        })
        console.log('\n')

        // Step 10: Clean up temporary file
        const fs = await import('node:fs/promises')
        await fs.unlink(tagDataFilePath)
        console.log(`Removed temporary tag data file: ${tagDataFilePath}`)

        // Step 11: Check test data
        console.log('Step 6: Checking test data...')
        execSync(`node ${path.join(__dirname, '../../../scripts/check-test-data.js')} ${env}`, { stdio: 'inherit' })

        console.log('\n=== Realistic test content generation complete! ===')
    } catch (error) {
        console.error('Error generating realistic test content:', error)
    }
}

// Function to confirm data clearing
function confirmDataClearing() {
    if (!shouldClearData) {
        // No need to confirm if not clearing data
        generateRealisticTestContent()
        return
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.question(`Are you sure you want to clear all existing data in the ${env.toUpperCase()} environment? (y/N) `, (answer) => {
        rl.close()

        if (answer.toLowerCase() === 'y') {
            console.log('Proceeding with data clearing and generation...\n')
            generateRealisticTestContent()
        } else {
            console.log('Operation cancelled.')
            process.exit(0)
        }
    })
}

// Start the process
confirmDataClearing()
