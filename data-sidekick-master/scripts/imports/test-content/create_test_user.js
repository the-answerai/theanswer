import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { v4 as uuidv4 } from 'uuid'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified

console.log(`Using environment: ${env}`)

// Load environment variables
dotenv.config({ path: `.env.${env}` })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Missing required environment variables')
    console.error(`Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.${env}`)
    process.exit(1)
}

// Initialize Supabase client with anon key
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function createTestUser() {
    console.log('Creating a test user...')

    const userId = uuidv4()
    const testUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        auth0_id: `auth0|${uuidv4()}`,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        metadata: {}
    }

    const { data, error } = await supabase.from('users').insert([testUser]).select()

    if (error) {
        console.error('Error creating test user:', error)
        process.exit(1)
    } else {
        console.log('Test user created successfully!')
        console.log('User ID:', userId)
        console.log('\nYou can now create a research view with:')
        console.log(`node scripts/create_research_view.js "WOW Calls Analysis" "Research view for WOW calls" ${userId}`)
        return userId
    }
}

createTestUser()
