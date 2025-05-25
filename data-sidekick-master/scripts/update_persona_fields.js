import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase()
if (!env || !['wow', 'prime'].includes(env)) {
    console.error('[ERROR] Please specify environment: node update_persona_fields.js [wow|prime]')
    process.exit(1)
}

// Load the environment variables based on environment
config({ path: resolve(process.cwd(), `.env.${env}`) })

console.log(`[${new Date().toISOString()}] Running in ${env.toUpperCase()} environment`)

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

// Verify Supabase credentials
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error(`[ERROR] Missing Supabase credentials in .env.${env} file.`)
    process.exit(1)
}

// Database tables
const DATABASE_TABLES = {
    CALLS: 'call_log'
}

// Optional test mode (process limited number of records if true)
const TEST_MODE = process.argv[3] === 'test'
const TEST_LIMIT = Number.parseInt(process.argv[4], 10) || 10

/**
 * Updates persona fields for a single record
 */
async function updatePersonaFields(record, currentCount, totalCount) {
    console.log(`[${new Date().toISOString()}] Updating record ${currentCount}/${totalCount} - ID: ${record.id}`)

    try {
        // Get existing persona or create a new one
        const persona = {
            ...(record.persona || {}),
            // Add default values for new fields if they don't exist
            identifySalesCalls: record.persona?.identifySalesCalls || 'No sales call identification available',
            productFeatureMentions: record.persona?.productFeatureMentions || 'No product feature mentions identified',
            sentimentAndHighlights: record.persona?.sentimentAndHighlights || 'No sentiment highlights available',
            agentPitchEffectiveness: record.persona?.agentPitchEffectiveness || 'No agent pitch effectiveness analysis available',
            dataValidationAndMissedCalls:
                record.persona?.dataValidationAndMissedCalls || 'No data validation or missed calls analysis available',
            campaignPerformance: record.persona?.campaignPerformance || 'No campaign performance analysis available'
        }

        // Update the record with the new persona fields
        const { error: updateError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .update({
                persona: persona
            })
            .eq('id', record.id)

        if (updateError) {
            throw new Error(`Failed to update record ${record.id}: ${updateError.message}`)
        }

        console.log(`[${new Date().toISOString()}] Updated record ${currentCount}/${totalCount}`)
    } catch (error) {
        console.error(
            `[${new Date().toISOString()}] Error updating record ${currentCount}/${totalCount} (ID: ${record.id}):`,
            error.message
        )
    }
}

/**
 * Process a batch of records
 */
async function processBatch(records, startIndex, totalRecords) {
    const promises = records.map((record, index) => updatePersonaFields(record, startIndex + index + 1, totalRecords))
    await Promise.all(promises)
}

/**
 * Main function to update persona fields for existing records
 */
async function main() {
    const startTime = new Date()
    console.log(`[${startTime.toISOString()}] Starting persona fields update...`)
    console.log(`Test mode: ${TEST_MODE ? 'ON' : 'OFF'}`)
    if (TEST_MODE) {
        console.log(`Test limit: ${TEST_LIMIT}`)
    }

    try {
        // Query records that have analysis data
        let query = supabase.from(DATABASE_TABLES.CALLS).select('id, persona').not('summary', 'is', null).order('id', { ascending: true })

        // Apply test limit if in test mode
        if (TEST_MODE) {
            query = query.limit(TEST_LIMIT)
        }

        const { data: records, error } = await query

        if (error) {
            throw new Error(`Failed to fetch records: ${error.message}`)
        }

        const totalRecords = records.length
        console.log(`[${new Date().toISOString()}] Found ${totalRecords} records to update`)

        // Process records in batches of 10
        const BATCH_SIZE = 10
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE)
            await processBatch(batch, i, totalRecords)
            console.log(
                `[${new Date().toISOString()}] Completed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)}`
            )
        }

        const endTime = new Date()
        const duration = (endTime - startTime) / 1000 / 60 // Convert to minutes
        console.log(`[${endTime.toISOString()}] Processing complete!`)
        console.log(`Total time: ${duration.toFixed(2)} minutes`)
        console.log(`Records processed: ${totalRecords}`)
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Unhandled error in main process:`, err)
    }
}

// Start the script
main()
