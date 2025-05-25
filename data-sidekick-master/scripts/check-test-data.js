import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

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

async function checkData() {
    console.log('Checking tickets...')
    const { data: tickets, error: ticketsError } = await supabase.from('jira_tickets').select('*')

    if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError)
    } else {
        console.log(`Found ${tickets.length} tickets`)
    }

    console.log('\nChecking chats...')
    // Use chat_logs table for RDS environment, chats table for other environments
    const chatTable = 'chat_logs'
    const { data: chats, error: chatsError } = await supabase.from(chatTable).select('*')

    if (chatsError) {
        console.error(`Error fetching chats from ${chatTable}:`, chatsError)
    } else {
        console.log(`Found ${chats ? chats.length : 0} chats in ${chatTable} table`)
    }
}

checkData()
