import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load local environment variables
dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testLocalDb() {
    try {
        console.log('Testing local database connection...')
        console.log('Connected to:', supabaseUrl)

        // Add a test call
        const testCall = {
            RECORDING_URL: 'test-recording-url',
            CALL_DURATION: '120',
            ANSWERED_BY: 'Local Test',
            CALL_NUMBER: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
                new Date().getDate()
            ).padStart(2, '0')}_LOCAL_TEST_001`,
            TAGS: ['test', 'local'],
            TAGS_ARRAY: ['test', 'local'],
            sentiment_score: 0.8,
            resolution_status: 'resolved'
        }

        // Delete any existing test calls with same recording URL
        await supabase.from('call_log').delete().eq('RECORDING_URL', testCall.RECORDING_URL)

        // Insert new test call
        const { error: insertError } = await supabase.from('call_log').insert(testCall)

        if (insertError) throw insertError

        console.log('✅ Test call added successfully:', testCall)

        // Verify the call was added
        const { data: verifyCall, error: verifyError } = await supabase
            .from('call_log')
            .select('*')
            .eq('RECORDING_URL', testCall.RECORDING_URL)
            .single()

        if (verifyError) throw verifyError

        console.log('\nVerified call in database:', verifyCall)
        console.log('\n🎉 Local database test completed successfully!')
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

await testLocalDb()
