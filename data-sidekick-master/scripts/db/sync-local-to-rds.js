import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

// Load local environment variables first (source)
dotenv.config({ path: '.env.local' })
const sourceUrl = process.env.SUPABASE_URL
const sourceKey = process.env.SUPABASE_ANON_KEY

// Then load RDS environment variables (target)
dotenv.config({ path: '.env.rds', override: true })
const targetUrl = process.env.SUPABASE_URL
const targetKey = process.env.SUPABASE_ANON_KEY

if (!sourceUrl || !sourceKey) {
    console.error('Missing local Supabase credentials in .env.local')
    process.exit(1)
}

if (!targetUrl || !targetKey) {
    console.error('Missing RDS Supabase credentials in .env.rds')
    process.exit(1)
}

// Create clients
const sourceSupabase = createClient(sourceUrl, sourceKey)
const targetSupabase = createClient(targetUrl, targetKey)

async function tableExists(client, tableName) {
    const { error } = await client.from(tableName).select('count').limit(1)

    return !error || !error.message.includes('does not exist')
}

async function syncData() {
    try {
        console.log('Starting data sync from LOCAL to RDS...\n')

        // Test source connection
        const { error: sourceTestError } = await sourceSupabase.from('call_log').select('count').limit(1)
        if (sourceTestError) {
            throw new Error(`Cannot connect to local database: ${sourceTestError.message}`)
        }

        // Test target connection
        const { error: targetTestError } = await targetSupabase.from('call_log').select('count').limit(1)
        if (targetTestError) {
            throw new Error(`Cannot connect to RDS database: ${targetTestError.message}`)
        }

        // Sync Tags if they exist
        if (await tableExists(sourceSupabase, 'tags')) {
            console.log('Syncing tags...')
            const { data: tags, error: tagsError } = await sourceSupabase.from('tags').select('*').order('id')
            if (tagsError) {
                throw new Error(`Error fetching tags: ${JSON.stringify(tagsError)}`)
            }

            if (await tableExists(targetSupabase, 'tags')) {
                const { error: deleteError } = await targetSupabase.from('tags').delete().neq('id', 0)
                if (deleteError) {
                    throw new Error(`Error clearing RDS tags: ${JSON.stringify(deleteError)}`)
                }

                if (tags.length > 0) {
                    const { error: insertError } = await targetSupabase.from('tags').insert(tags)
                    if (insertError) {
                        throw new Error(`Error inserting tags: ${JSON.stringify(insertError)}`)
                    }

                    // Reset sequence to the max tag id
                    const maxId = Math.max(...tags.map((t) => t.id))
                    const { error: seqError } = await targetSupabase
                        .from('tags')
                        .select('id')
                        .limit(1)
                        .then(() => targetSupabase.from('tags').select("setval('tags_id_seq', $1)", [maxId]))
                    if (seqError) {
                        console.warn(`Warning: Could not reset sequence: ${JSON.stringify(seqError)}`)
                    }
                }
            }
            console.log(`✅ Synced ${tags.length} tags`)
        } else {
            console.log('⚠️ Tags table not found in source database, skipping...')
        }

        // Sync Call Logs
        console.log('\nSyncing call logs...')
        const { data: calls, error: callsError } = await sourceSupabase
            .from('call_log')
            .select('*')
            .order('CALL_NUMBER', { ascending: false })
            .limit(1000) // Limit to last 1000 calls for performance
        if (callsError) throw callsError

        // Process call logs to ensure array types are correct
        const processedCalls = calls.map((call) => ({
            ...call,
            TAGS_ARRAY: Array.isArray(call.TAGS_ARRAY) ? call.TAGS_ARRAY : [], // Ensure it's an array
            persona: call.persona || {}, // Ensure jsonb fields are objects
            WORD_TIMESTAMPS: call.WORD_TIMESTAMPS || {} // Ensure jsonb fields are objects
        }))

        await targetSupabase.from('call_log').delete().neq('RECORDING_URL', '')
        const { error: insertCallsError } = await targetSupabase.from('call_log').insert(processedCalls)
        if (insertCallsError) throw insertCallsError
        console.log(`✅ Synced ${calls.length} call logs`)

        // Sync Reports if they exist
        if (await tableExists(sourceSupabase, 'reports')) {
            console.log('\nSyncing reports...')
            const { data: reports, error: reportsError } = await sourceSupabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)
            if (reportsError) throw reportsError

            if (await tableExists(targetSupabase, 'reports')) {
                const { error: deleteReportsError } = await targetSupabase
                    .from('reports')
                    .delete()
                    .gte('id', '00000000-0000-0000-0000-000000000000')
                if (deleteReportsError) throw deleteReportsError

                if (reports.length > 0) {
                    const processedReports = reports.map((report) => ({
                        id: report.id || uuidv4(),
                        name: report.name,
                        content: report.content,
                        recording_ids: report.recording_ids || [],
                        custom_prompt: report.custom_prompt,
                        call_count: report.call_count,
                        created_at: report.created_at,
                        updated_at: report.updated_at
                    }))

                    const { error: insertReportsError } = await targetSupabase.from('reports').insert(processedReports)
                    if (insertReportsError) throw insertReportsError
                }
            }
            console.log(`✅ Synced ${reports.length} reports`)
        } else {
            console.log('⚠️ Reports table not found in source database, skipping...')
        }

        console.log('\n🎉 Data sync completed successfully!')
    } catch (error) {
        console.error('Sync error:', error.message)
        process.exit(1)
    }
}

// Initialize and run
syncData().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
