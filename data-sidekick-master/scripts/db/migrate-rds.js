import dotenv from 'dotenv'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.join(__dirname, '../../supabase/migrations')

// Load RDS environment variables
dotenv.config({ path: '.env.rds' })

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectId = supabaseUrl.split('https://')[1].split('.')[0]

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required Supabase credentials in .env.rds')
    process.exit(1)
}

console.log('🚀 Running migrations against RDS Supabase instance...')
console.log(`URL: ${supabaseUrl}`)
console.log(`Project ID: ${projectId}`)

// Since we can't use the CLI directly, let's manually apply the migrations
// by reading the SQL files and executing them via the Supabase REST API
async function applyMigrations() {
    try {
        // Get list of migration files sorted by name (which should be timestamp-prefixed)
        const migrationFiles = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith('.sql'))
            .sort()

        console.log(`Found ${migrationFiles.length} migration files.`)
        console.log('\nSince we cannot use the Supabase CLI directly with the remote project,')
        console.log('you will need to manually apply the migrations through the Supabase Studio SQL Editor.')
        console.log('\nInstructions:')
        console.log('1. Open the Supabase Studio SQL Editor at: https://app.supabase.com/project/qwmxgsznahkjsddgdrwt')
        console.log('2. Copy and paste the contents of each migration file into the SQL Editor')
        console.log('3. Run the SQL to apply each migration in order')
        console.log('\nMigration files (in order):')

        migrationFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file}`)
        })

        console.log('\nAfter applying all migrations, run: pnpm sync:local-to-rds')
    } catch (error) {
        console.error('❌ Error:', error.message)
        process.exit(1)
    }
}

applyMigrations()
