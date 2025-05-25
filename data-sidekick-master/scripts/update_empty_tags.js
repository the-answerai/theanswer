import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function updateEmptyTags() {
    try {
        // First, get total count of call_log entries
        const { count: totalCount, error: totalError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (totalError) {
            console.error('Error getting total count:', totalError)
            return
        }

        console.log(`Total call_log entries: ${totalCount}`)

        // Get entries with empty TAGS text field but non-empty TAGS_ARRAY
        const { data: entriesToUpdate, error: fetchError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL, TAGS, TAGS_ARRAY')
            .or('TAGS.is.null,TAGS.eq.')
            .not('TAGS_ARRAY', 'is', null)

        if (fetchError) {
            console.error('Error fetching entries to update:', fetchError)
            return
        }

        console.log(`Found ${entriesToUpdate.length} entries with empty TAGS but non-empty TAGS_ARRAY`)

        // Process entries in batches
        const batchSize = 50
        let updatedCount = 0
        let errorCount = 0

        for (let i = 0; i < entriesToUpdate.length; i += batchSize) {
            const batch = entriesToUpdate.slice(i, i + batchSize)
            console.log(
                `Processing batch ${i / batchSize + 1} of ${Math.ceil(entriesToUpdate.length / batchSize)} (entries ${i + 1}-${Math.min(
                    i + batchSize,
                    entriesToUpdate.length
                )})`
            )

            for (const entry of batch) {
                try {
                    // Skip if TAGS_ARRAY is empty
                    if (
                        !entry.TAGS_ARRAY ||
                        (Array.isArray(entry.TAGS_ARRAY) && entry.TAGS_ARRAY.length === 0) ||
                        (typeof entry.TAGS_ARRAY === 'string' &&
                            (entry.TAGS_ARRAY.trim() === '[]' || entry.TAGS_ARRAY.trim() === '{}' || entry.TAGS_ARRAY.trim() === ''))
                    ) {
                        console.log(`Skipping entry ${entry.id} (${entry.RECORDING_URL}): TAGS_ARRAY is empty`)
                        continue
                    }

                    // Convert TAGS_ARRAY to string for TAGS field
                    let tagsString = ''
                    if (Array.isArray(entry.TAGS_ARRAY)) {
                        tagsString = entry.TAGS_ARRAY.join(',')
                    } else if (typeof entry.TAGS_ARRAY === 'string') {
                        // Try to parse JSON string
                        try {
                            const tagsArray = JSON.parse(entry.TAGS_ARRAY)
                            if (Array.isArray(tagsArray)) {
                                tagsString = tagsArray.join(',')
                            } else {
                                tagsString = entry.TAGS_ARRAY
                            }
                        } catch (e) {
                            // If not valid JSON, use as is
                            tagsString = entry.TAGS_ARRAY
                        }
                    } else {
                        tagsString = String(entry.TAGS_ARRAY)
                    }

                    // Update the TAGS field
                    const { error: updateError } = await supabase.from('call_log').update({ TAGS: tagsString }).eq('id', entry.id)

                    if (updateError) {
                        console.error(`Error updating entry ${entry.id} (${entry.RECORDING_URL}):`, updateError)
                        errorCount++
                        continue
                    }

                    console.log(`Updated entry ${entry.id} (${entry.RECORDING_URL}): TAGS = "${tagsString}"`)
                    updatedCount++
                } catch (err) {
                    console.error(`Error processing entry ${entry.id} (${entry.RECORDING_URL}):`, err)
                    errorCount++
                }
            }

            // Wait a bit between batches to avoid rate limiting
            if (i + batchSize < entriesToUpdate.length) {
                console.log('Waiting 1 second before next batch...')
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
        }

        console.log(`\nUpdate complete. Updated ${updatedCount} entries with ${errorCount} errors.`)

        // Get entries with empty TAGS and empty TAGS_ARRAY
        const { data: emptyBothEntries, error: emptyBothError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL')
            .or('TAGS.is.null,TAGS.eq.')
            .is('TAGS_ARRAY', null)

        if (emptyBothError) {
            console.error('Error fetching entries with both empty:', emptyBothError)
            return
        }

        console.log(`\nFound ${emptyBothEntries.length} entries with both TAGS and TAGS_ARRAY empty`)

        // Get entries with empty TAGS and empty array in TAGS_ARRAY
        const { data: allEmptyTagsEntries, error: allEmptyError } = await supabase
            .from('call_log')
            .select('id, RECORDING_URL, TAGS_ARRAY')
            .or('TAGS.is.null,TAGS.eq.')

        if (allEmptyError) {
            console.error('Error fetching all empty TAGS entries:', allEmptyError)
            return
        }

        // Count entries with empty arrays
        const emptyArrayEntries = allEmptyTagsEntries.filter((entry) => {
            if (!entry.TAGS_ARRAY) return true // null is considered empty

            if (Array.isArray(entry.TAGS_ARRAY) && entry.TAGS_ARRAY.length === 0) return true

            if (typeof entry.TAGS_ARRAY === 'string') {
                const trimmed = entry.TAGS_ARRAY.trim()
                return trimmed === '[]' || trimmed === '{}' || trimmed === ''
            }

            return false
        })

        console.log(`Found ${emptyArrayEntries.length} entries with empty TAGS and empty array in TAGS_ARRAY`)
    } catch (error) {
        console.error('Unexpected error:', error)
    }
}

updateEmptyTags()
    .then(() => console.log('Done updating empty tags'))
    .catch((err) => console.error('Error:', err))
