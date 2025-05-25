import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load local environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('Testing Supabase Connection...\n')

    try {
        // Test 1: Basic Connection
        console.log('1. Testing basic connection...')
        const { data, error } = await supabase.from('tags').select('count')
        if (error) throw error
        console.log('✅ Connection successful!\n')

        // Test 2: Check Tags Table
        console.log('2. Testing tags table...')
        const { data: tags, error: tagsError } = await supabase.from('tags').select('*')

        if (tagsError) throw tagsError
        console.log(`✅ Found ${tags.length} tags in the database`)
        console.log('Sample tags:', tags.slice(0, 2), '\n')

        // Test 3: Check Call Logs
        console.log('3. Testing call_log table...')
        const { data: calls, error: callsError } = await supabase.from('call_log').select('*')

        if (callsError) throw callsError
        console.log(`✅ Found ${calls.length} call logs in the database`)
        console.log('Sample call:', calls[0]?.CALL_TYPE, '\n')

        // Test 4: Check Reports
        console.log('4. Testing reports table...')
        const { data: reports, error: reportsError } = await supabase.from('reports').select('*')

        if (reportsError) throw reportsError
        console.log(`✅ Found ${reports.length} reports in the database`)
        console.log('Sample report name:', reports[0]?.report_name, '\n')

        console.log('🎉 All tests passed successfully!')
    } catch (error) {
        console.error('❌ Error during testing:', error.message)
        process.exit(1)
    }
}

testConnection()
