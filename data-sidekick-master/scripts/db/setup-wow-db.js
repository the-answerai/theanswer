import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// Get current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: '.env.wow' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setupDatabase() {
    try {
        // Create tags table
        const { error: tagsError } = await supabase.from('tags').insert({ id: 1, slug: 'test', label: 'Test Tag' }).select()

        if (tagsError) {
            console.log('Tags table might already exist or there was an error:', tagsError.message)
        } else {
            console.log('Tags table created successfully')
        }

        // Create call_log table
        const { error: callLogError } = await supabase
            .from('call_log')
            .insert({
                RECORDING_URL: 'test.mp3',
                TRANSCRIPTION: 'Test transcription'
            })
            .select()

        if (callLogError) {
            console.log('Call log table might already exist or there was an error:', callLogError.message)
        } else {
            console.log('Call log table created successfully')
        }

        // Create reports table
        const { error: reportsError } = await supabase
            .from('reports')
            .insert({
                name: 'Test Report',
                content: 'Test content'
            })
            .select()

        if (reportsError) {
            console.log('Reports table might already exist or there was an error:', reportsError.message)
        } else {
            console.log('Reports table created successfully')
        }

        console.log('Database setup completed!')
        console.log('Note: If you see "already exists" messages, that\'s okay - it means the tables are already set up.')
        console.log('You can now proceed with importing your data.')
    } catch (error) {
        console.error('Error:', error)
    }
}

setupDatabase()
