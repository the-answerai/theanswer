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

// List of tables to sync in order (to handle foreign key dependencies)
const TABLES_TO_SYNC = [
    // First sync tables with no dependencies
    'users',
    'tags',
    // Then sync tables that depend on users
    'research_views',
    // Then sync tables that depend on research_views
    'data_sources',
    // Then sync tables that depend on data_sources
    'documents',
    // Then sync tables that depend on documents
    'document_metadata',
    'document_chunks',
    'document_categories',
    'aai_documents',
    // Other tables
    'analyzer_categories',
    'analyzer_reports',
    'call_log',
    'chat_logs',
    'reports',
    'research_files',
    'scheduled_reports',
    'tickets',
    'usage_logs'
]

async function tableExists(client, tableName) {
    const { data, error } = await client.from(tableName).select('count').limit(1)

    return !error || !error.message.includes('does not exist')
}

async function syncTable(tableName, limit = 1000) {
    console.log(`\nSyncing ${tableName}...`)

    // Check if table exists in source
    if (!(await tableExists(sourceSupabase, tableName))) {
        console.log(`⚠️ Table ${tableName} not found in source database, skipping...`)
        return
    }

    // Check if table exists in target
    if (!(await tableExists(targetSupabase, tableName))) {
        console.log(`⚠️ Table ${tableName} not found in target database, skipping...`)
        return
    }

    // Fetch data from source
    const { data, error } = await sourceSupabase.from(tableName).select('*').limit(limit)

    if (error) {
        console.error(`Error fetching ${tableName}: ${error.message}`)
        return
    }

    if (!data || data.length === 0) {
        console.log(`✅ No data to sync for ${tableName}`)
        return
    }

    // Special handling for tags table which has integer primary key
    if (tableName === 'tags') {
        try {
            const { error: deleteError } = await targetSupabase.from(tableName).delete().neq('id', 0)

            if (deleteError) {
                console.error(`Error clearing ${tableName}: ${deleteError.message}`)
            }
        } catch (err) {
            console.warn(`Warning: Could not clear table ${tableName}: ${err.message}`)
            console.warn('Will attempt to insert data anyway.')
        }
    } else {
        // Clear target table for UUID-based tables
        try {
            const { error: deleteError } = await targetSupabase.from(tableName).delete().gte('id', '00000000-0000-0000-0000-000000000000')

            if (deleteError && !deleteError.message.includes('column "id" does not exist')) {
                console.error(`Error clearing ${tableName}: ${deleteError.message}`)
                // Continue anyway, as some tables might not have an id column
            }
        } catch (err) {
            console.warn(`Warning: Could not clear table ${tableName}: ${err.message}`)
            console.warn('Will attempt to insert data anyway.')
        }
    }

    // Insert data into target
    try {
        const { error: insertError } = await targetSupabase.from(tableName).insert(data)

        if (insertError) {
            console.error(`Error inserting into ${tableName}: ${insertError.message}`)
            return
        }

        console.log(`✅ Synced ${data.length} records for ${tableName}`)
    } catch (err) {
        console.error(`Error inserting into ${tableName}: ${err.message}`)
    }
}

async function syncData() {
    try {
        console.log('Starting comprehensive data sync from LOCAL to RDS...\n')

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

        // Sync each table in order
        for (const table of TABLES_TO_SYNC) {
            await syncTable(table)
        }

        console.log('\n🎉 Comprehensive data sync completed successfully!')
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
