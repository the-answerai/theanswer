import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function countEmptyTagsText() {
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

        // Count entries with empty TAGS_ARRAY
        const { count: nullArrayCount, error: nullArrayError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .is('TAGS_ARRAY', null)

        if (nullArrayError) {
            console.error('Error counting null TAGS_ARRAY:', nullArrayError)
            return
        }

        // Get entries to check for empty arrays
        const { data: allEntries, error: allError } = await supabase.from('call_log').select('id, TAGS_ARRAY')

        if (allError) {
            console.error('Error fetching all entries:', allError)
            return
        }

        // Count entries with empty arrays ([], {}, or empty string)
        const emptyArrayEntries = allEntries.filter((entry) => {
            if (!entry.TAGS_ARRAY) return false // Skip null entries (already counted)

            // Check for empty arrays in various formats
            if (Array.isArray(entry.TAGS_ARRAY) && entry.TAGS_ARRAY.length === 0) return true
            if (typeof entry.TAGS_ARRAY === 'string') {
                const trimmed = entry.TAGS_ARRAY.trim()
                return trimmed === '[]' || trimmed === '{}' || trimmed === ''
            }
            return false
        })

        const emptyArrayCount = emptyArrayEntries.length
        const totalEmptyArrayCount = nullArrayCount + emptyArrayCount
        const percentEmptyArray = ((totalEmptyArrayCount / totalCount) * 100).toFixed(2)

        console.log(`Entries with null TAGS_ARRAY: ${nullArrayCount}`)
        console.log(`Entries with empty array TAGS_ARRAY: ${emptyArrayCount}`)
        console.log(`Total entries with empty TAGS_ARRAY: ${totalEmptyArrayCount} (${percentEmptyArray}%)`)

        // Compare the two counts
        console.log('\nComparison:')
        console.log(`Empty TAGS text field: ${emptyTagsTextCount}`)
        console.log(`Empty TAGS_ARRAY: ${totalEmptyArrayCount}`)
        console.log(`Difference: ${Math.abs(emptyTagsTextCount - totalEmptyArrayCount)}`)

        // Get a sample of entries with empty TAGS but non-empty TAGS_ARRAY
        if (emptyTagsTextCount > totalEmptyArrayCount) {
            const { data: mismatchSample, error: mismatchError } = await supabase
                .from('call_log')
                .select('id, RECORDING_URL, TAGS, TAGS_ARRAY')
                .or('TAGS.is.null,TAGS.eq.')
                .not('TAGS_ARRAY', 'is', null)
                .limit(10)

            if (mismatchError) {
                console.error('Error fetching mismatch sample:', mismatchError)
            } else {
                console.log('\nSample of entries with empty TAGS but non-empty TAGS_ARRAY:')
                for (const entry of mismatchSample) {
                    console.log(`ID: ${entry.id}, URL: ${entry.RECORDING_URL}`)
                    console.log(`TAGS: ${entry.TAGS}`)
                    console.log(`TAGS_ARRAY: ${JSON.stringify(entry.TAGS_ARRAY)}`)
                    console.log('---')
                }
            }
        }

        // Get a sample of entries with non-empty TAGS but empty TAGS_ARRAY
        if (totalEmptyArrayCount > emptyTagsTextCount) {
            const { data: mismatchSample, error: mismatchError } = await supabase
                .from('call_log')
                .select('id, RECORDING_URL, TAGS, TAGS_ARRAY')
                .not('TAGS', 'is', null)
                .not('TAGS', 'eq', '')
                .or('TAGS_ARRAY.is.null,TAGS_ARRAY.eq.[]')
                .limit(10)

            if (mismatchError) {
                console.error('Error fetching mismatch sample:', mismatchError)
            } else {
                console.log('\nSample of entries with non-empty TAGS but empty TAGS_ARRAY:')
                for (const entry of mismatchSample) {
                    console.log(`ID: ${entry.id}, URL: ${entry.RECORDING_URL}`)
                    console.log(`TAGS: ${entry.TAGS}`)
                    console.log(`TAGS_ARRAY: ${JSON.stringify(entry.TAGS_ARRAY)}`)
                    console.log('---')
                }
            }
        }
    } catch (error) {
        console.error('Unexpected error:', error)
    }
}

countEmptyTagsText()
    .then(() => console.log('Done checking empty tags text'))
    .catch((err) => console.error('Error:', err))
