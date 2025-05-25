import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Create a new research view
 */
async function createResearchView(name, description, userId) {
    try {
        // Create the research view
        const { data, error } = await supabase
            .from('research_views')
            .insert({
                name,
                description,
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating research view:', error)
            process.exit(1)
        }

        console.log(`Created research view: ${data.id}`)
        console.log(`Name: ${data.name}`)
        console.log(`Description: ${data.description}`)
        console.log('\nYou can now use this ID when running the import script:')
        console.log(`node scripts/import_wow_calls.js ${data.id}`)

        return data.id
    } catch (error) {
        console.error('Error creating research view:', error)
        process.exit(1)
    }
}

/**
 * Main function
 */
async function main() {
    // Get arguments
    const args = process.argv.slice(2)
    const name = args[0] || 'WOW Calls Analysis'
    const description = args[1] || 'Research view for analyzing WOW customer service calls'
    const userId = args[2]

    if (!userId) {
        console.error('Please provide a user ID as the third argument')
        console.error('Usage: node create_research_view.js [name] [description] <user_id>')
        process.exit(1)
    }

    // Create the research view
    await createResearchView(name, description, userId)
}

// Run the script
main()
