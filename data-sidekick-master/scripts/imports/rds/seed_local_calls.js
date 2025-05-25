/**
 * Seed Local Environment with Recent Calls
 *
 * This script fetches the most recent calls from RDS environment and seeds them into the local database.
 *
 * Usage:
 * node scripts/imports/rds/seed_local_calls.js [--limit=20] [--env=rds]
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { parseArgs } from 'node:util'

// Parse command line arguments
const args = parseArgs({
    options: {
        limit: { type: 'string' },
        env: { type: 'string' }
    }
})

// Get parameters
const limit = Number.parseInt(args.values.limit || '20')
const sourceEnv = args.values.env || 'rds'

// Load source environment variables (RDS)
dotenv.config({ path: `.env.${sourceEnv}` })

// Create source Supabase client (RDS)
const sourceSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Load local environment variables
dotenv.config({ path: '.env.local', override: true })

// Create local Supabase client
const localSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fetchRecentCalls() {
    console.log(`Fetching ${limit} most recent calls from ${sourceEnv} environment...`)

    const { data: calls, error } = await sourceSupabase
        .from('call_log')
        .select(
            `
            id,
            recording_url,
            transcription,
            tags,
            tags_array,
            summary,
            coaching,
            persona,
            sentiment_score,
            resolution_status,
            escalated,
            call_type,
            created_at,
            updated_at
        `
        )
        .not('transcription', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(`Error fetching calls: ${error.message}`)
    }

    console.log(`Found ${calls?.length || 0} calls`)
    return calls || []
}

async function seedLocalDatabase(calls) {
    console.log('\nSeeding local database...')
    let successCount = 0
    let errorCount = 0

    for (const call of calls) {
        try {
            // Check if call already exists
            const { data: existing, error: searchError } = await localSupabase.from('call_log').select('id').eq('id', call.id).maybeSingle()

            if (searchError) {
                throw new Error(`Error checking for existing call: ${searchError.message}`)
            }

            // Prepare the call data
            const callData = {
                id: call.id,
                recording_url: call.recording_url,
                transcription: call.transcription,
                tags: call.tags,
                tags_array: call.tags_array || [],
                summary: call.summary,
                coaching: call.coaching,
                persona: call.persona,
                sentiment_score: call.sentiment_score,
                resolution_status: call.resolution_status,
                escalated: call.escalated,
                call_type: call.call_type,
                created_at: call.created_at ? new Date(call.created_at).toISOString() : new Date().toISOString(),
                updated_at: call.updated_at ? new Date(call.updated_at).toISOString() : new Date().toISOString()
            }

            if (existing) {
                // Update existing call
                const { error: updateError } = await localSupabase.from('call_log').update(callData).eq('id', call.id)

                if (updateError) {
                    throw new Error(`Error updating call: ${updateError.message}`)
                }
                console.log(`Updated existing call ${call.id}`)
            } else {
                // Insert new call
                const { error: insertError } = await localSupabase.from('call_log').insert(callData)

                if (insertError) {
                    throw new Error(`Error inserting call: ${insertError.message}`)
                }
                console.log(`Inserted new call ${call.id}`)
            }

            successCount++
        } catch (error) {
            console.error(`Error processing call ${call.id}: ${error.message}`)
            errorCount++
        }
    }

    return { successCount, errorCount }
}

async function main() {
    try {
        // Verify we can connect to both databases
        console.log('Verifying database connections...')

        // Test RDS connection
        const { error: rdsError } = await sourceSupabase.from('call_log').select('id').limit(1)

        if (rdsError) {
            throw new Error(`Cannot connect to RDS database: ${rdsError.message}`)
        }
        console.log('✓ Connected to RDS database')

        // Test local connection
        const { error: localError } = await localSupabase.from('call_log').select('id').limit(1)

        if (localError) {
            throw new Error(`Cannot connect to local database: ${localError.message}`)
        }
        console.log('✓ Connected to local database')

        // Fetch calls from source environment
        const calls = await fetchRecentCalls()

        if (calls.length === 0) {
            console.log('No calls found to import. Exiting.')
            return
        }

        // Seed local database
        const { successCount, errorCount } = await seedLocalDatabase(calls)

        console.log('\nSeeding complete:')
        console.log(`- Total calls processed: ${calls.length}`)
        console.log(`- Successfully seeded: ${successCount}`)
        console.log(`- Failed to seed: ${errorCount}`)
    } catch (error) {
        console.error(`Error in main: ${error.message}`)
        process.exit(1)
    }
}

// Run the script
main().catch(console.error)
