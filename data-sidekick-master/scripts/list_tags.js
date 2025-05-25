import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.wow' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function listTags() {
    try {
        // Get all tags ordered by parent_id (null first) and then by label
        const { data: tags, error } = await supabase.from('tags').select('*').order('parent_id', { nullsFirst: true }).order('label')

        if (error) {
            console.error('Error fetching tags:', error)
            return
        }

        // Group tags by parent
        const parentTags = tags.filter((tag) => !tag.parent_id)
        const childTags = tags.filter((tag) => tag.parent_id)

        // Print in a formatted way
        console.log('\nTag Structure:\n')

        parentTags.forEach((parent) => {
            console.log(`${parent.label} (${parent.slug})`)
            console.log(`Description: ${parent.description}\n`)

            // Find and print children
            const children = childTags.filter((child) => child.parent_id === parent.id)
            children.forEach((child) => {
                console.log(`  - ${child.label} (${child.slug})`)
                console.log(`    Description: ${child.description}\n`)
            })
            console.log('---\n')
        })
    } catch (error) {
        console.error('Error in listing process:', error)
    }
}

listTags()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
