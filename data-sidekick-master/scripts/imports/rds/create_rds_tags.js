import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tagStructure } from './tag_config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables - using local environment as requested
dotenv.config({ path: '.env.rds' })

// Debug environment variables
console.log('Environment variables loaded:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '****' : 'not set')

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

async function createTags() {
    try {
        // First, clear existing tags to avoid duplicates
        const { error: deleteError } = await supabase.from('tags').delete().neq('id', 0) // This will delete all records

        if (deleteError) {
            console.error('Error clearing existing tags:', deleteError)
            return
        }

        console.log('Cleared existing tags')

        // Create parent tags first
        for (const parentTag of tagStructure) {
            const { data: parentData, error: parentError } = await supabase
                .from('tags')
                .insert({
                    label: parentTag.label,
                    slug: parentTag.slug,
                    color: parentTag.color,
                    description: parentTag.description,
                    shade: 'base' // Adding a shade field to distinguish parent tags
                })
                .select()
                .single()

            if (parentError) {
                console.error(`Error creating parent tag ${parentTag.label}:`, parentError)
                continue
            }

            console.log(`Created parent tag: ${parentTag.label}`)

            // Create child tags with parent_id reference
            if (parentTag.children) {
                for (const childTag of parentTag.children) {
                    const { error: childError } = await supabase.from('tags').insert({
                        label: childTag.label,
                        slug: childTag.slug,
                        color: childTag.color,
                        description: childTag.description,
                        parent_id: parentData.id,
                        shade: 'light' // Adding a shade field to distinguish child tags
                    })

                    if (childError) {
                        console.error(`Error creating child tag ${childTag.label}:`, childError)
                        continue
                    }

                    console.log(`Created child tag: ${childTag.label}`)
                }
            }
        }

        console.log('RDS POS tag creation completed successfully!')
    } catch (error) {
        console.error('Error in tag creation process:', error)
    }
}

createTags()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
