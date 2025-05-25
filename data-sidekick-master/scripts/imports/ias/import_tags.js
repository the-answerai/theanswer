import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tagStructure } from './tag_config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Process command line arguments
const args = process.argv.slice(2)
const env = args[0] || 'local' // Default to local if not specified

console.log(`Importing IAS tags to ${env} environment...`)

// Load environment variables
dotenv.config({ path: `.env.${env}` })

// Create Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function importTags() {
    try {
        // Create a flat list of all tags with parent-child relationships
        const tags = []
        let tagId = 1

        // Process each parent tag and its children
        for (const parentTag of tagStructure) {
            const parentId = tagId++

            // Add parent tag
            tags.push({
                id: parentId,
                label: parentTag.label,
                slug: parentTag.slug,
                color: parentTag.color,
                description: parentTag.description,
                parent_id: null
            })

            // Add children tags
            for (const childTag of parentTag.children) {
                tags.push({
                    id: tagId++,
                    label: childTag.label,
                    slug: childTag.slug,
                    color: childTag.color,
                    description: childTag.description,
                    parent_id: parentId
                })
            }
        }

        // Clear existing tags
        console.log('Clearing existing tags...')
        const { error: deleteError } = await supabase.from('tags').delete().neq('id', 0)

        if (deleteError) {
            console.error('Error deleting existing tags:', deleteError.message)
            return
        }

        // Insert new tags
        console.log('Inserting IAS tags...')
        const { error: insertError } = await supabase.from('tags').insert(tags)

        if (insertError) {
            console.error('Error inserting IAS tags:', insertError.message)
            return
        }

        console.log(`Successfully imported ${tags.length} IAS tags!`)
    } catch (error) {
        console.error('Error importing IAS tags:', error)
    }
}

importTags()
