require('dotenv').config({ path: process.env.ENV_FILE || '.env.rds' })
const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// API URL with fallback to localhost if not defined
const apiUrl = process.env.API_URL || 'http://localhost:3000'
console.log(`Using API URL: ${apiUrl}`)

async function reanalyzeEmptyTags() {
    try {
        // Get total count of call_log entries
        const { count: totalCount, error: countError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (countError) {
            throw new Error(`Error getting total count: ${countError.message}`)
        }

        console.log(`Total call_log entries: ${totalCount}`)

        // Fetch entries with empty TAGS and empty TAGS_ARRAY
        const { data: emptyTagsEntries, error: emptyTagsError } = await supabase
            .from('call_log')
            .select('id, filename')
            .or('TAGS.is.null,TAGS.eq.')
            .is('TAGS_ARRAY', null)

        if (emptyTagsError) {
            throw new Error(`Error fetching empty tags entries: ${emptyTagsError.message}`)
        }

        console.log(`Found ${emptyTagsEntries.length} entries with empty TAGS and empty TAGS_ARRAY`)

        // Process entries in batches
        const batchSize = 10
        const totalBatches = Math.ceil(emptyTagsEntries.length / batchSize)
        let successCount = 0
        let errorCount = 0

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * batchSize
            const end = Math.min(start + batchSize, emptyTagsEntries.length)
            const batch = emptyTagsEntries.slice(start, end)

            console.log(`Processing batch ${batchIndex + 1} of ${totalBatches} (entries ${start + 1}-${end})`)

            // Process each entry in the batch
            const batchPromises = batch.map(async (entry) => {
                try {
                    const reanalyzeUrl = `${apiUrl}/api/call-log/reanalyze/${entry.id}`
                    console.log(`Reanalyzing entry ${entry.id} (${entry.filename})`)

                    const response = await fetch(reanalyzeUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(`Failed to reanalyze entry: ${errorText}`)
                    }

                    const result = await response.json()
                    console.log(`Successfully reanalyzed entry ${entry.id}: ${JSON.stringify(result)}`)
                    successCount++
                    return { success: true, id: entry.id }
                } catch (error) {
                    console.error(`Error reanalyzing entry ${entry.id}: ${error.message}`)
                    errorCount++
                    return { success: false, id: entry.id, error: error.message }
                }
            })

            // Wait for all entries in the batch to be processed
            await Promise.all(batchPromises)

            // Wait a bit between batches to avoid overwhelming the API
            if (batchIndex < totalBatches - 1) {
                console.log('Waiting 2 seconds before next batch...')
                await new Promise((resolve) => setTimeout(resolve, 2000))
            }
        }

        console.log(`\nReanalysis complete:`)
        console.log(`- Total entries processed: ${emptyTagsEntries.length}`)
        console.log(`- Successful reanalyses: ${successCount}`)
        console.log(`- Failed reanalyses: ${errorCount}`)
    } catch (error) {
        console.error(`Error in reanalyzeEmptyTags: ${error.message}`)
    }
}

// Run the function
reanalyzeEmptyTags().catch(console.error)
