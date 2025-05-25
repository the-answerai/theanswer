import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkTagsField() {
    try {
        // First, get total count of call_log entries
        const { count: totalCount, error: totalError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (totalError) {
            console.error('Error getting total count:', totalError)
            return
        }

        console.log(`Total call_log entries: ${totalCount}`)

        // Count entries with empty TAGS text field
        const { count: emptyTagsTextCount, error: emptyTagsTextError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .or('TAGS.is.null,TAGS.eq.')

        if (emptyTagsTextError) {
            console.error('Error counting empty TAGS text:', emptyTagsTextError)
            return
        }

        const percentEmptyTagsText = ((emptyTagsTextCount / totalCount) * 100).toFixed(2)
        console.log(`Entries with empty TAGS text field: ${emptyTagsTextCount} (${percentEmptyTagsText}%)`)

        // Get a sample of entries with empty TAGS text field
        const { data: emptyTagsSample, error: sampleError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL, TAGS, TAGS_ARRAY')
            .or('TAGS.is.null,TAGS.eq.')
            .limit(10)

        if (sampleError) {
            console.error('Error fetching sample of empty TAGS:', sampleError)
            return
        }

        console.log('\nSample of entries with empty TAGS text field:')
        for (const entry of emptyTagsSample) {
            console.log(`ID: ${entry.id}, URL: ${entry.RECORDING_URL}`)
            console.log(`TAGS: "${entry.TAGS}"`)
            console.log(`TAGS_ARRAY: ${JSON.stringify(entry.TAGS_ARRAY)}`)
            console.log('---')
        }

        // Count entries with non-empty TAGS text field
        const { count: nonEmptyTagsTextCount, error: nonEmptyTagsTextError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .not('TAGS', 'is', null)
            .not('TAGS', 'eq', '')

        if (nonEmptyTagsTextError) {
            console.error('Error counting non-empty TAGS text:', nonEmptyTagsTextError)
            return
        }

        const percentNonEmptyTagsText = ((nonEmptyTagsTextCount / totalCount) * 100).toFixed(2)
        console.log(`\nEntries with non-empty TAGS text field: ${nonEmptyTagsTextCount} (${percentNonEmptyTagsText}%)`)

        // Get a sample of entries with non-empty TAGS text field
        const { data: nonEmptyTagsSample, error: nonEmptySampleError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL, TAGS, TAGS_ARRAY')
            .not('TAGS', 'is', null)
            .not('TAGS', 'eq', '')
            .limit(10)

        if (nonEmptySampleError) {
            console.error('Error fetching sample of non-empty TAGS:', nonEmptySampleError)
            return
        }

        console.log('\nSample of entries with non-empty TAGS text field:')
        for (const entry of nonEmptyTagsSample) {
            console.log(`ID: ${entry.id}, URL: ${entry.RECORDING_URL}`)
            console.log(`TAGS: "${entry.TAGS}"`)
            console.log(`TAGS_ARRAY: ${JSON.stringify(entry.TAGS_ARRAY)}`)
            console.log('---')
        }
    } catch (error) {
        console.error('Unexpected error:', error)
    }
}

checkTagsField()
    .then(() => console.log('Done checking TAGS field'))
    .catch((err) => console.error('Error:', err))
