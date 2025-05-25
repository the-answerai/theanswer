import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'

// Load the appropriate .env file based on environment
const envFile = process.env.NODE_ENV === 'wow' ? '.env.wow' : '.env.prime'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Required environment variables are missing!')
    process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function migrateTagColors() {
    try {
        console.log('Starting tag color migration...')

        // Get all tags that have a shade value but no color value
        const { data: tags, error: fetchError } = await supabase.from('tags').select('*').not('shade', 'is', null).is('color', null)

        if (fetchError) throw fetchError

        console.log(`Found ${tags.length} tags with shade values but no color to migrate`)

        // Update each tag's color with its shade value
        for (const tag of tags) {
            const { error: updateError } = await supabase.from('tags').update({ color: tag.shade }).eq('id', tag.id)

            if (updateError) {
                console.error(`Error updating tag ${tag.id}:`, updateError)
                continue
            }

            console.log(`Updated tag ${tag.label} (${tag.id}): shade ${tag.shade} -> color ${tag.shade}`)
        }

        console.log('Migration completed successfully!')
    } catch (error) {
        console.error('Error in migration process:', error)
        process.exit(1)
    }
}

migrateTagColors()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
