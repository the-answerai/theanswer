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

async function checkUsers() {
    console.log('Checking for users in the database...')

    const { data, error } = await supabase.from('users').select('id, email, name').limit(5)

    if (error) {
        console.error('Error fetching users:', error)
    } else {
        console.log('\nUsers found:', data.length)
        for (const user of data) {
            console.log(`User ID: ${user.id}`)
            console.log(`Email: ${user.email}`)
            console.log(`Name: ${user.name || 'N/A'}`)
            console.log('---')
        }

        if (data.length > 0) {
            console.log('\nYou can use one of these user IDs to create a research view:')
            console.log(`node scripts/create_research_view.js "WOW Calls Analysis" "Research view for WOW calls" ${data[0].id}`)
        } else {
            console.log('\nNo users found. You may need to create a user first.')
        }
    }

    // Check if research_views table exists
    try {
        const { data: views, error: viewsError } = await supabase.from('research_views').select('count').limit(1)

        if (viewsError) {
            console.error('Error checking research_views table:', viewsError)
        } else {
            console.log('\nresearch_views table exists')
        }
    } catch (err) {
        console.error('research_views table may not exist:', err.message)
    }
}

// Run the check
checkUsers().catch(console.error)
