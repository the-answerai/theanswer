import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load local environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function testLocalModification() {
    try {
        // 1. First verify we're on local and in development
        console.log('Environment Check:')
        console.log('NODE_ENV:', process.env.NODE_ENV)
        console.log('Connected to Supabase URL:', process.env.SUPABASE_URL)
        console.log('Current Database Password:', process.env.SUPABASE_DB_PASSWORD)

        // 2. Delete previous test call if it exists
        await supabase.from('call_log').delete().eq('RECORDING_URL', 'local-test-recording.mp3')

        // 3. Add a new test call log with recent call number
        const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '')
        const callNumber = `${currentDate}_LOCAL_TEST_001`

        const { data: newCall, error: callError } = await supabase
            .from('call_log')
            .insert({
                RECORDING_URL: 'local-test-recording.mp3',
                CALL_DURATION: 120,
                ANSWERED_BY: 'Local Test Agent',
                EMPLOYEE_NAME: 'Local Tester',
                CALL_TYPE: 'LOCAL_TEST',
                CALLER_NAME: 'Local Test Customer',
                CALL_NUMBER: callNumber, // This should make it appear at the top
                TRANSCRIPTION: 'This is a local test call to verify we are using local database.',
                TAGS: 'test,local',
                TAGS_ARRAY: ['test', 'local'],
                sentiment_score: 1.0,
                resolution_status: 'resolved'
            })
            .select()

        if (callError) throw callError
        console.log('Added test call:', newCall)

        // 4. Verify the call was added by fetching it
        const { data: verifyCall, error: verifyError } = await supabase
            .from('call_log')
            .select('*')
            .eq('RECORDING_URL', 'local-test-recording.mp3')
            .single()

        if (verifyError) throw verifyError
        console.log('\n✅ Verified call exists in database:', verifyCall.CALL_NUMBER)

        console.log('\n✅ Successfully modified local database!')
        console.log('The test call should now appear at the top of your list with call number:', callNumber)
        console.log("If you don't see it, try:")
        console.log('1. Set NODE_ENV=development in your terminal')
        console.log('2. Restart your application')
        console.log('3. Clear your browser cache')
    } catch (error) {
        console.error('Error:', error)
    }
}

testLocalModification()
