import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { tagStructure } from './tag_config_updated.js'
import { parseArgs } from 'node:util'

// Parse command line arguments
const args = parseArgs({
    options: {
        env: { type: 'string', default: 'local' }
    }
})

const environment = args.values.env
const envFile =
    environment === 'local'
        ? '.env.local'
        : environment === 'rds'
        ? '.env.rds'
        : environment === 'prime'
        ? '.env.prime'
        : environment === 'wow'
        ? '.env.wow'
        : '.env.local'

console.log(`Using environment: ${environment} (${envFile})`)

// Load environment variables
dotenv.config({ path: envFile })

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error(`Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in ${envFile}`)
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateTags() {
    try {
        console.log(`Starting tag update process for ${environment} environment...`)

        // Step 1: Delete all existing tags
        console.log('Deleting existing tags...')

        // First, delete child tags
        const { error: childDeleteError } = await supabase.from('tags').delete().not('parent_id', 'is', null)

        if (childDeleteError) {
            throw new Error(`Error deleting child tags: ${childDeleteError.message}`)
        }

        // Then delete parent tags
        const { error: parentDeleteError } = await supabase.from('tags').delete().is('parent_id', null)

        if (parentDeleteError) {
            throw new Error(`Error deleting parent tags: ${parentDeleteError.message}`)
        }

        console.log('All existing tags deleted successfully')

        // Step 2: Insert parent categories
        console.log('Inserting new tag categories...')

        const parentCategories = []
        const parentCategoryMap = {}

        for (const category of tagStructure) {
            const parentCategory = {
                label: category.label,
                description: category.description,
                slug: category.slug,
                color: category.color,
                parent_id: null
            }

            parentCategories.push(parentCategory)
        }

        const { data: insertedParents, error: parentInsertError } = await supabase.from('tags').insert(parentCategories).select()

        if (parentInsertError) {
            throw new Error(`Error inserting parent categories: ${parentInsertError.message}`)
        }

        console.log(`Inserted ${insertedParents.length} parent categories`)

        // Create a mapping of slug to id for parent categories
        for (const parent of insertedParents) {
            parentCategoryMap[parent.slug] = parent.id
        }

        // Step 3: Insert subcategories
        console.log('Inserting subcategories...')

        const subcategories = []

        for (const category of tagStructure) {
            const parentId = parentCategoryMap[category.slug]

            if (!parentId) {
                console.warn(`Warning: Could not find parent ID for slug ${category.slug}`)
                continue
            }

            if (category.children && Array.isArray(category.children)) {
                for (const child of category.children) {
                    const subcategory = {
                        label: child.label,
                        description: child.description,
                        slug: child.slug,
                        color: child.color,
                        parent_id: parentId
                    }

                    subcategories.push(subcategory)
                }
            }
        }

        const { data: insertedSubcategories, error: subInsertError } = await supabase.from('tags').insert(subcategories).select()

        if (subInsertError) {
            throw new Error(`Error inserting subcategories: ${subInsertError.message}`)
        }

        console.log(`Inserted ${insertedSubcategories.length} subcategories`)
        console.log(`Tag update completed successfully for ${environment} environment!`)
    } catch (error) {
        console.error(`Error updating tags for ${environment}:`, error)
        process.exit(1)
    }
}

// Run the update
updateTags()
