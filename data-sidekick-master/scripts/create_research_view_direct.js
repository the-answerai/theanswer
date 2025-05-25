import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'

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
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
)

async function createResearchViewDirect() {
    console.log('Creating a research view directly...')

    const researchViewId = uuidv4()
    const researchView = {
        id: researchViewId,
        name: 'WOW Calls Analysis',
        description: 'Research view for analyzing WOW customer service calls',
        user_id: null, // No user association required
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('research_views').insert([researchView]).select()

    if (error) {
        console.error('Error creating research view:', error)
        process.exit(1)
    } else {
        console.log('Research view created successfully!')
        console.log(`Research View ID: ${researchViewId}`)
        console.log('\nNow run the WOW calls import with:')
        console.log(`node scripts/import_wow_calls_test.js ${researchViewId}`)

        return researchViewId
    }
}

// Run the function
createResearchViewDirect().catch(console.error)
