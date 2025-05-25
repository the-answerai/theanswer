import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

// Get environment from command line argument
const env = process.argv[2]
if (!env || !['prime', 'wow', 'rds'].includes(env)) {
    console.error('Please specify environment: node sync-prod-data.js [prime|wow|rds]')
    process.exit(1)
}

// Load source environment variables first
dotenv.config({ path: `.env.${env}` })
const sourceUrl = process.env.SUPABASE_URL
const sourceKey = process.env.SUPABASE_ANON_KEY

// Then load local environment variables, with override to ensure we get local values
dotenv.config({ path: '.env.local', override: true })
const localUrl = process.env.SUPABASE_URL
const localKey = process.env.SUPABASE_ANON_KEY

if (!sourceUrl || !sourceKey) {
    console.error(`Missing Supabase credentials for ${env} environment`)
    process.exit(1)
}

if (!localUrl || !localKey) {
    console.error('Missing local Supabase credentials in .env.local')
    process.exit(1)
}

// Create clients
const sourceSupabase = createClient(sourceUrl, sourceKey)
const localSupabase = createClient(localUrl, localKey)

async function tableExists(client, tableName) {
    const { error } = await client.from(tableName).select('count').limit(1)

    return !error || !error.message.includes('does not exist')
}

// Helper function to sync a table
async function syncTable(tableName, orderBy = 'id', limit = 1000, processFunction = null) {
    console.log(`\nSyncing ${tableName}...`)

    if (!(await tableExists(sourceSupabase, tableName))) {
        console.log(`⚠️ ${tableName} table not found in source database, skipping...`)
        return
    }

    if (!(await tableExists(localSupabase, tableName))) {
        console.log(`⚠️ ${tableName} table not found in local database, skipping...`)
        return
    }

    // Fetch data from source
    const { data, error } = await sourceSupabase.from(tableName).select('*').order(orderBy, { ascending: false }).limit(limit)

    if (error) {
        throw new Error(`Error fetching ${tableName}: ${JSON.stringify(error)}`)
    }

    if (!data || data.length === 0) {
        console.log(`ℹ️ No data found in ${tableName} table, skipping...`)
        return 0
    }

    // Process data if needed
    const processedData = processFunction ? data.map(processFunction) : data

    // Clear local table - use appropriate condition based on table
    let deleteError

    if (tableName === 'tags') {
        // Tags table has numeric IDs
        const { error } = await localSupabase.from(tableName).delete().neq('id', 0)
        deleteError = error
    } else if (tableName === 'call_log') {
        // Call log has special handling
        const { error } = await localSupabase.from(tableName).delete().neq('RECORDING_URL', '')
        deleteError = error
    } else {
        // For UUID-based tables or others
        try {
            // First try with UUID comparison
            const { error } = await localSupabase.from(tableName).delete().gte('id', '00000000-0000-0000-0000-000000000000')
            deleteError = error

            // If that fails, try with a simpler approach
            if (error && error.code === '22P02') {
                const { error: fallbackError } = await localSupabase.from(tableName).delete()
                deleteError = fallbackError
            }
        } catch (err) {
            // Last resort - just try to delete everything
            try {
                const { error: fallbackError } = await localSupabase.from(tableName).delete()
                deleteError = fallbackError
            } catch (finalErr) {
                deleteError = finalErr
            }
        }
    }

    if (deleteError) {
        throw new Error(`Error clearing local ${tableName}: ${JSON.stringify(deleteError)}`)
    }

    // Insert data if we have any
    if (processedData.length > 0) {
        // Try to insert the data
        try {
            const { error: insertError } = await localSupabase.from(tableName).insert(processedData)

            if (insertError) {
                // Handle foreign key constraint violations
                if (insertError.code === '23503' && insertError.message.includes('violates foreign key constraint')) {
                    console.log('⚠️ Foreign key constraint violation detected, attempting to adapt data...')

                    // Extract the constraint name from the error message
                    const constraintMatch = insertError.message.match(/constraint "([^"]+)"/)
                    const columnMatch = insertError.details?.match(/Key \(([^)]+)\)/)

                    if (constraintMatch && columnMatch) {
                        const constraint = constraintMatch[1]
                        const column = columnMatch[1]
                        console.log(`⚠️ Constraint violation on column '${column}' (${constraint})`)

                        // Check if the column is a foreign key to documents table
                        if (column === 'document_id' || column === 'source_id') {
                            // For document-related tables, we need to filter records to only include those
                            // that reference documents we've already synced
                            console.log(`⚠️ Filtering records to only include valid ${column} references...`)

                            // Get the list of valid IDs from the referenced table
                            const referencedTable = column === 'document_id' ? 'documents' : 'data_sources'
                            const { data: validIds, error: idsError } = await localSupabase.from(referencedTable).select('id')

                            if (idsError) {
                                throw new Error(`Error fetching valid IDs from ${referencedTable}: ${JSON.stringify(idsError)}`)
                            }

                            const validIdSet = new Set(validIds.map((item) => item.id))
                            console.log(`ℹ️ Found ${validIdSet.size} valid IDs in ${referencedTable}`)

                            // Filter records to only include those with valid foreign keys
                            const filteredData = processedData.filter((record) => validIdSet.has(record[column]))
                            console.log(`ℹ️ Filtered from ${processedData.length} to ${filteredData.length} records`)

                            if (filteredData.length === 0) {
                                console.log('⚠️ No valid records remain after filtering, skipping table...')
                                return 0
                            }

                            // Try inserting the filtered data
                            const { error: retryError } = await localSupabase.from(tableName).insert(filteredData)

                            if (retryError) {
                                throw new Error(`Error inserting ${tableName} after filtering: ${JSON.stringify(retryError)}`)
                            }

                            console.log('✅ Successfully inserted data after filtering invalid references')
                            console.log(`✅ Synced ${filteredData.length} ${tableName} records`)
                            return filteredData.length
                        }

                        // For other tables, set the foreign key to null if possible
                        console.log(`⚠️ Setting ${column} to null for all records`)

                        // Set the foreign key to null for all records
                        const adaptedData = processedData.map((record) => {
                            const newRecord = { ...record }
                            newRecord[column] = null
                            return newRecord
                        })

                        // Try inserting again with adapted data
                        const { error: retryError } = await localSupabase.from(tableName).insert(adaptedData)

                        if (retryError) {
                            // If we get a not-null constraint violation, filter out those records
                            if (retryError.code === '23502' && retryError.message.includes('violates not-null constraint')) {
                                console.log(`⚠️ Not-null constraint detected, filtering out records with null ${column}...`)

                                // Keep only records where the column was already null in the source
                                const filteredData = processedData.filter((record) => record[column] !== null)
                                console.log(`ℹ️ Filtered from ${processedData.length} to ${filteredData.length} records`)

                                if (filteredData.length === 0) {
                                    console.log('⚠️ No valid records remain after filtering, skipping table...')
                                    return 0
                                }

                                // Try inserting the filtered data
                                const { error: finalError } = await localSupabase.from(tableName).insert(filteredData)

                                if (finalError) {
                                    throw new Error(`Error inserting ${tableName} after filtering nulls: ${JSON.stringify(finalError)}`)
                                }

                                console.log('✅ Successfully inserted data after filtering null values')
                                console.log(`✅ Synced ${filteredData.length} ${tableName} records`)
                                return filteredData.length
                            }

                            throw new Error(`Error inserting ${tableName} after FK adaptation: ${JSON.stringify(retryError)}`)
                        }

                        console.log('✅ Successfully inserted data after removing foreign key references')
                        console.log(`✅ Synced ${adaptedData.length} ${tableName} records`)
                        return adaptedData.length
                    }
                }

                // If we get a column not found error, try to adapt the data
                if (insertError.code === 'PGRST204' && insertError.message.includes('could not find the')) {
                    console.log('⚠️ Column mismatch detected, attempting to adapt data...')

                    // Get the column that's causing the issue
                    const missingColumnMatch = insertError.message.match(/'([^']+)'/)
                    if (missingColumnMatch?.[1]) {
                        const missingColumn = missingColumnMatch[1]
                        console.log(`⚠️ Removing column '${missingColumn}' from data...`)

                        // Remove the problematic column from all records
                        const adaptedData = processedData.map((record) => {
                            const newRecord = { ...record }
                            delete newRecord[missingColumn]
                            return newRecord
                        })

                        // Try inserting again with adapted data
                        const { error: retryError } = await localSupabase.from(tableName).insert(adaptedData)

                        if (retryError) {
                            // If we still have issues, try a more aggressive approach
                            if (retryError.code === 'PGRST204' && retryError.message.includes('could not find the')) {
                                console.log('⚠️ Still having column issues, trying more aggressive adaptation...')

                                // Get a sample of the local table structure
                                const { data: sampleData, error: sampleError } = await localSupabase.from(tableName).select('*').limit(1)

                                if (!sampleError && sampleData) {
                                    // If we have a sample, use its keys as a template
                                    if (sampleData.length > 0) {
                                        const validColumns = Object.keys(sampleData[0])
                                        console.log(`ℹ️ Valid columns for ${tableName}: ${validColumns.join(', ')}`)

                                        // Create new records with only the valid columns
                                        const strictlyAdaptedData = processedData.map((record) => {
                                            const newRecord = {}
                                            for (const column of validColumns) {
                                                if (record[column] !== undefined) {
                                                    newRecord[column] = record[column]
                                                }
                                            }
                                            return newRecord
                                        })

                                        const { error: finalError } = await localSupabase.from(tableName).insert(strictlyAdaptedData)

                                        if (finalError) {
                                            throw new Error(
                                                `Error inserting ${tableName} after strict adaptation: ${JSON.stringify(finalError)}`
                                            )
                                        }

                                        console.log('✅ Successfully inserted data after strict column filtering')
                                        console.log(`✅ Synced ${strictlyAdaptedData.length} ${tableName} records`)
                                        return strictlyAdaptedData.length
                                    }
                                }

                                // If we can't get a sample, try to guess the structure based on the error messages
                                const allMissingColumns = []
                                let currentError = retryError
                                let currentData = adaptedData

                                // Keep trying to insert and collecting error messages until we succeed or run out of columns
                                while (
                                    currentError &&
                                    currentError.code === 'PGRST204' &&
                                    currentError.message.includes('could not find the')
                                ) {
                                    const match = currentError.message.match(/'([^']+)'/)
                                    if (!match || !match[1]) break

                                    const missingCol = match[1]
                                    allMissingColumns.push(missingCol)
                                    console.log(`⚠️ Removing another column '${missingCol}'...`)

                                    currentData = currentData.map((record) => {
                                        const newRecord = { ...record }
                                        delete newRecord[missingCol]
                                        return newRecord
                                    })

                                    const { error: nextError } = await localSupabase.from(tableName).insert(currentData)

                                    if (!nextError) {
                                        console.log(
                                            `✅ Successfully inserted data after removing multiple columns: ${allMissingColumns.join(', ')}`
                                        )
                                        console.log(`✅ Synced ${currentData.length} ${tableName} records`)
                                        return currentData.length
                                    }

                                    currentError = nextError
                                }
                            }

                            throw new Error(`Error inserting ${tableName} after adaptation: ${JSON.stringify(retryError)}`)
                        }

                        console.log(`✅ Successfully inserted data after removing '${missingColumn}' column`)
                        console.log(`✅ Synced ${adaptedData.length} ${tableName} records`)
                        return adaptedData.length
                    }
                }

                throw new Error(`Error inserting ${tableName}: ${JSON.stringify(insertError)}`)
            }
        } catch (err) {
            if (
                err.message.includes('after adaptation') ||
                err.message.includes('after strict adaptation') ||
                err.message.includes('after FK adaptation') ||
                err.message.includes('after filtering')
            ) {
                throw err // Re-throw our custom error
            }
            throw new Error(`Error inserting ${tableName}: ${err.message}`)
        }

        // Try to reset sequence if it's a numeric id
        if (typeof processedData[0].id === 'number') {
            try {
                const maxId = Math.max(...processedData.map((item) => item.id))
                await localSupabase.from(tableName).select(`setval('${tableName}_id_seq', ${maxId}, true)`)
            } catch (seqError) {
                console.warn(`Warning: Could not reset sequence for ${tableName}: ${seqError.message}`)
            }
        }
    }

    console.log(`✅ Synced ${processedData.length} ${tableName} records`)
    return processedData.length
}

async function syncData() {
    try {
        console.log(`Starting data sync from ${env.toUpperCase()} to local...\n`)

        // Test source connection
        const { error: sourceTestError } = await sourceSupabase.from('call_log').select('count').limit(1)
        if (sourceTestError) {
            throw new Error(`Cannot connect to ${env} database: ${sourceTestError.message}`)
        }

        // Test local connection
        const { error: localTestError } = await localSupabase.from('call_log').select('count').limit(1)
        if (localTestError) {
            throw new Error(`Cannot connect to local database: ${localTestError.message}`)
        }

        // ===== SYNC TABLES IN DEPENDENCY ORDER =====

        console.log('\n=== Syncing Base Tables ===')

        // First, sync user-related tables if they exist
        // Note: auth.users is managed by Supabase Auth and might not be directly accessible
        // We'll try to sync it but continue if it fails
        try {
            await syncTable('users', 'created_at', 1000)
        } catch (error) {
            console.log('⚠️ Could not sync users table, continuing with other tables...')
        }

        // Sync basic tables with no dependencies
        await syncTable('tags', 'id', 1000)
        await syncTable('settings', 'id', 100)
        await syncTable('employees', 'id', 1000)
        await syncTable('prompts', 'created_at', 100)

        // Sync call logs
        await syncTable('call_log', 'CALL_NUMBER', 1000, (call) => ({
            ...call,
            TAGS_ARRAY: Array.isArray(call.TAGS_ARRAY) ? call.TAGS_ARRAY : [], // Ensure it's an array
            persona: call.persona || {}, // Ensure jsonb fields are objects
            WORD_TIMESTAMPS: call.WORD_TIMESTAMPS || {} // Ensure jsonb fields are objects
        }))

        // Sync reports (depends on call_log)
        await syncTable('reports', 'created_at', 100, (report) => ({
            id: report.id || uuidv4(),
            name: report.name,
            content: report.content,
            recording_ids: report.recording_ids || [],
            custom_prompt: report.custom_prompt,
            call_count: report.call_count,
            created_at: report.created_at,
            updated_at: report.updated_at
        }))

        // ===== SYNC DATA ANALYZER TABLES =====

        console.log('\n=== Syncing Data Analyzer Tables ===')

        // 1. First level: Tables with no dependencies or only user dependencies
        // Use the specific user ID for research_views
        await syncTable('research_views', 'created_at', 100, (view) => ({
            ...view,
            user_id: '265acab7-e497-4d8c-bd10-5dc3d1de7b49' // Use the provided user ID
        }))

        // 2. Second level: Tables that depend on research_views
        await syncTable('data_sources', 'created_at', 500)
        await syncTable('analyzer_categories', 'created_at', 500)

        // 3. Third level: Tables that depend on data_sources
        await syncTable('documents', 'created_at', 1000, (doc) => {
            // Create a clean document object without embedding or metadata fields
            return {
                id: doc.id,
                source_id: doc.source_id,
                title: doc.title,
                url: doc.url,
                author: doc.author,
                publication_date: doc.publication_date,
                content: doc.content,
                content_summary: doc.content_summary,
                token_count: doc.token_count,
                word_count: doc.word_count,
                file_type: doc.file_type,
                category_ai: doc.category_ai,
                category_user: doc.category_user,
                status: doc.status,
                created_at: doc.created_at,
                updated_at: doc.updated_at
            }
        })

        // 4. Fourth level: Tables that depend on documents
        await syncTable('document_metadata', 'created_at', 1000, (metadata) => ({
            id: metadata.id,
            document_id: metadata.document_id,
            field_name: metadata.field_name,
            field_prompt: metadata.field_prompt,
            field_value: metadata.field_value,
            is_predefined: metadata.is_predefined,
            created_at: metadata.created_at,
            updated_at: metadata.updated_at
        }))

        await syncTable('document_chunks', 'created_at', 2000)

        // 5. Fifth level: Tables with multiple dependencies
        await syncTable('document_categories', 'created_at', 1000)
        await syncTable('analyzer_reports', 'created_at', 100)

        // 6. Usage logs (can reference multiple tables)
        await syncTable('usage_logs', 'created_at', 500)

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
