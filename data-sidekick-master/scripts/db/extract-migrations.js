import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.join(__dirname, '../../supabase/migrations')
const outputDir = path.join(__dirname, '../../migrations-for-rds')
const outputFile = path.join(__dirname, '../../all-migrations.sql')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
}

// Get list of migration files sorted by name (which should be timestamp-prefixed)
const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

console.log(`Found ${migrationFiles.length} migration files.`)

// Create a combined SQL file
let combinedSQL = '-- Combined migrations for RDS Supabase\n\n'
let migrationsList = ''

// Add each migration to the combined file and create individual files
for (const file of migrationFiles) {
    console.log(`Processing migration: ${file}`)

    // Read the SQL file
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    // Add to combined SQL with a header
    combinedSQL += `-- Migration: ${file}\n`
    combinedSQL += sqlContent
    combinedSQL += '\n\n'

    // Create individual file
    const outputPath = path.join(outputDir, file)
    fs.writeFileSync(outputPath, sqlContent)

    // Add to migrations list
    migrationsList += `${file}\n`
}

// Write the combined SQL to a file
fs.writeFileSync(outputFile, combinedSQL)

// Write the migrations list to a file
fs.writeFileSync(path.join(outputDir, 'migrations-list.txt'), migrationsList)

console.log(`\n✅ All migrations extracted to: ${outputFile}`)
console.log(`✅ Individual migration files extracted to: ${outputDir}`)
console.log('\nInstructions:')
console.log('1. Open the Supabase Studio SQL Editor at: https://app.supabase.com/project/qwmxgsznahkjsddgdrwt')
console.log('2. Apply each migration file in order:')

migrationFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`)
})

console.log('\n3. After applying all migrations, run: pnpm sync:local-to-rds')
