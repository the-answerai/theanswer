import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.wow' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function checkWowCalls() {
    // Count total records
    const { count: totalCount, error: countError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('Error getting count:', countError)
        return
    }

    console.log('Total records in call_log:', totalCount)

    // Get a sample of WOW records
    const { data: sampleRecords, error: sampleError } = await supabase
        .from('call_log')
        .select('*')
        .ilike('RECORDING_URL', 'wow_call_%')
        .limit(5)

    if (sampleError) {
        console.error('Error getting sample:', sampleError)
        return
    }

    console.log('\nSample WOW records:', sampleRecords)
}

checkWowCalls()
    .then(() => console.log('Check completed'))
    .catch((error) => console.error('Check failed:', error))
