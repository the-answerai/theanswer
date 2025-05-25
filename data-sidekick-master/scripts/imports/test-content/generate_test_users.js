import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to 'local' if no environment is specified

console.log(`Using environment: ${env}`)

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

// Define test users with deterministic UUIDs
const testUsers = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'agent1@example.com',
        name: 'Agent One',
        auth0_id: 'auth0|agent1',
        picture: 'https://i.pravatar.cc/150?u=agent1@example.com',
        metadata: { role: 'agent', department: 'customer_service' }
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'agent2@example.com',
        name: 'Agent Two',
        auth0_id: 'auth0|agent2',
        picture: 'https://i.pravatar.cc/150?u=agent2@example.com',
        metadata: { role: 'agent', department: 'technical_support' }
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'agent3@example.com',
        name: 'Agent Three',
        auth0_id: 'auth0|agent3',
        picture: 'https://i.pravatar.cc/150?u=agent3@example.com',
        metadata: { role: 'agent', department: 'sales' }
    }
]

async function generateTestUsers() {
    // First, delete existing test users
    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in(
            'id',
            testUsers.map((user) => user.id)
        )

    if (deleteError) {
        console.error('Error deleting existing test users:', deleteError)
        return
    }

    // Insert test users
    for (const user of testUsers) {
        const { error } = await supabase.from('users').insert(user)

        if (error) {
            console.error(`Error inserting user ${user.name}:`, error)
        } else {
            console.log(`Successfully created test user: ${user.name}`)
        }
    }
}

// Export test users for use in other scripts
export const TEST_USER_IDS = testUsers.map((user) => user.id)

generateTestUsers()
    .then(() => console.log('Test user generation complete'))
    .catch(console.error)
