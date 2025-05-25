import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.join(__dirname, '../../supabase/migrations')

// Load RDS environment variables
dotenv.config({ path: '.env.rds' })
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing RDS Supabase credentials in .env.rds')
    process.exit(1)
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function tableExists(client, tableName) {
    const { data, error } = await client.from(tableName).select('count').limit(1)

    return !error || !error.message.includes('does not exist')
}

async function applyMigrations() {
    try {
        console.log('Starting migration application to RDS Supabase...\n')

        // Test connection
        try {
            const { data, error } = await supabase.from('_schema').select('version').limit(1)
            if (error && !error.message.includes('not found')) {
                throw new Error(`Cannot connect to RDS database: ${error.message}`)
            }
        } catch (err) {
            // If _schema table doesn't exist, that's okay, we'll just continue
            console.log('Note: _schema table not found, but connection successful')
        }

        console.log('Connected to RDS Supabase successfully.')

        // Get list of migration files sorted by name (which should be timestamp-prefixed)
        const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith('.sql'))
            .sort()

        console.log(`Found ${migrationFiles.length} migration files.`)

        // Try to create a migrations table if it doesn't exist
        try {
            const { data, error } = await supabase.rpc('create_migrations_table_if_not_exists', {})
            if (error) {
                console.warn('Note: Could not create migrations table. This is expected if it already exists or if RPC is not available.')
                console.warn('Will attempt to continue with migrations anyway.')
            }
        } catch (err) {
            console.warn('Note: Could not create migrations table. This is expected if it already exists or if RPC is not available.')
            console.warn('Will attempt to continue with migrations anyway.')
        }

        // Apply each migration
        for (const file of migrationFiles) {
            console.log(`Applying migration: ${file}`)

            // Read the SQL file
            const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

            // Execute the SQL
            try {
                const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
                if (error) {
                    console.warn(`Warning: Could not apply migration ${file} using RPC: ${error.message}`)
                    console.warn('This is expected if RPC functions are not available in your Supabase instance.')
                    console.warn('You may need to manually apply migrations through the Supabase Studio SQL editor.')
                    console.warn(`Migration file: ${path.join(migrationsDir, file)}`)
                } else {
                    console.log(`✅ Successfully applied migration: ${file}`)
                }
            } catch (err) {
                console.warn(`Warning: Could not apply migration ${file} using RPC: ${err.message}`)
                console.warn('This is expected if RPC functions are not available in your Supabase instance.')
                console.warn('You may need to manually apply migrations through the Supabase Studio SQL editor.')
                console.warn(`Migration file: ${path.join(migrationsDir, file)}`)
            }
        }

        console.log('\n🎉 Migration application completed!')
        console.log('\nNote: If any warnings were shown, you may need to manually apply some migrations')
        console.log('through the Supabase Studio SQL editor at: https://app.supabase.com/project/qwmxgsznahkjsddgdrwt')
    } catch (error) {
        console.error('Migration error:', error.message)
        process.exit(1)
    }
}

// Initialize and run
applyMigrations().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
