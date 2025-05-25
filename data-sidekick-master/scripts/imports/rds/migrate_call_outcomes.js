/**
 * Migrate Call Outcomes Script
 *
 * This script migrates the 'Call Outcome' tags to the resolution_status field
 * in the call_log table. It will:
 * 1. Map existing call outcome tags to resolution status values
 * 2. Update call_log records with new resolution status
 * 3. Remove call outcome tags from TAGS and TAGS_ARRAY fields
 *
 * Usage:
 * node scripts/imports/rds/migrate_call_outcomes.js [--dry-run] [--batch-size=100]
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { parseArgs } from 'node:util'

// Parse command line arguments
const args = parseArgs({
    options: {
        'dry-run': { type: 'boolean' },
        'batch-size': { type: 'string' }
    }
})

// Load environment variables
dotenv.config({ path: process.env.ENV_FILE || '.env.local' })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Mapping of call outcome tags to resolution status values
const OUTCOME_TO_RESOLUTION_MAP = {
    'outcome-resolved': 'resolved',
    'outcome-dispatch-no-troubleshoot': 'dispatch',
    'outcome-reboot-fix': 'resolved',
    'outcome-escalated-tier2': 'escalated',
    'outcome-repeat-call': 'followup'
}

// List of all call outcome tags to remove
const OUTCOME_TAGS = Object.keys(OUTCOME_TO_RESOLUTION_MAP)

/**
 * Process a batch of call logs
 */
async function processBatch(calls, dryRun = false) {
    let successCount = 0
    let errorCount = 0

    for (const call of calls) {
        try {
            // Skip if no tags
            if (!call.TAGS_ARRAY || !Array.isArray(call.TAGS_ARRAY)) {
                continue
            }

            // Find matching outcome tag
            const outcomeTag = call.TAGS_ARRAY.find((tag) => OUTCOME_TAGS.includes(tag))
            if (!outcomeTag) {
                continue
            }

            // Get new resolution status
            const newResolutionStatus = OUTCOME_TO_RESOLUTION_MAP[outcomeTag]

            // Remove outcome tag from arrays
            const newTagsArray = call.TAGS_ARRAY.filter((tag) => !OUTCOME_TAGS.includes(tag))
            const newTags = newTagsArray.join(',')

            console.log(`Processing call ${call.id}:`)
            console.log(`- Old tags: ${call.TAGS_ARRAY.join(', ')}`)
            console.log(`- New tags: ${newTagsArray.join(', ')}`)
            console.log(`- New resolution status: ${newResolutionStatus}`)

            if (!dryRun) {
                const { error } = await supabase
                    .from('call_log')
                    .update({
                        TAGS_ARRAY: newTagsArray,
                        TAGS: newTags,
                        resolution_status: newResolutionStatus
                    })
                    .eq('id', call.id)

                if (error) throw error
            }

            successCount++
        } catch (error) {
            console.error(`Error processing call ${call.id}:`, error.message)
            errorCount++
        }
    }

    return { successCount, errorCount }
}

/**
 * Main migration function
 */
async function migrateCallOutcomes() {
    try {
        const dryRun = args.values['dry-run'] || false
        const batchSize = Number(args.values['batch-size'] || '100')

        console.log(`Starting migration${dryRun ? ' (DRY RUN)' : ''}...`)
        console.log(`Batch size: ${batchSize}`)

        // Get total count of calls with outcome tags
        const { count, error: countError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .overlaps('TAGS_ARRAY', OUTCOME_TAGS)

        if (countError) throw countError

        console.log(`Found ${count} calls with outcome tags to process`)

        let processedCount = 0
        let totalSuccessCount = 0
        let totalErrorCount = 0

        // Process in batches
        while (processedCount < count) {
            console.log(`\nProcessing batch starting at offset ${processedCount}...`)

            const { data: calls, error: fetchError } = await supabase
                .from('call_log')
                .select('id, TAGS, TAGS_ARRAY')
                .overlaps('TAGS_ARRAY', OUTCOME_TAGS)
                .range(processedCount, processedCount + batchSize - 1)

            if (fetchError) throw fetchError

            if (!calls || calls.length === 0) {
                console.log('No more calls to process')
                break
            }

            const { successCount, errorCount } = await processBatch(calls, dryRun)

            processedCount += calls.length
            totalSuccessCount += successCount
            totalErrorCount += errorCount

            console.log('\nBatch results:')
            console.log(`- Processed: ${calls.length}`)
            console.log(`- Successful: ${successCount}`)
            console.log(`- Failed: ${errorCount}`)
            console.log(`\nOverall progress: ${processedCount}/${count}`)

            // Small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        console.log('\nMigration complete!')
        console.log(`- Total processed: ${processedCount}`)
        console.log(`- Total successful: ${totalSuccessCount}`)
        console.log(`- Total failed: ${totalErrorCount}`)
    } catch (error) {
        console.error('Migration failed:', error.message)
        process.exit(1)
    }
}

// Run the migration
migrateCallOutcomes().catch(console.error)
