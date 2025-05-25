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

// Define new color mapping for parent categories
const colorMapping = {
    'Payment & Billing': '#E53E3E', // Bold red
    'Services & Plans': '#2B6CB0', // Bold blue
    'Technical Issues': '#2C7A7B', // Bold teal
    'Account Management': '#2F855A', // Bold green
    'Customer Service & Sentiment': '#805AD5', // Bold purple
    'Additional / Specialized Categories': '#6B46C1', // Deep purple
    'Sales Interactions': '#1A365D', // Navy blue
    'Customer Questions': '#C53030' // Deep red
}

// Define child color variations (slightly different shades but still bold)
const getChildColor = (parentColor) => {
    // Convert hex to RGB, adjust, and convert back to hex
    const hex = parentColor.replace('#', '')
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Make slightly lighter but still bold
    const newR = Math.min(255, r + 20)
    const newG = Math.min(255, g + 20)
    const newB = Math.min(255, b + 20)

    return '#' + newR.toString(16).padStart(2, '0') + newG.toString(16).padStart(2, '0') + newB.toString(16).padStart(2, '0')
}

async function updateTagColors() {
    try {
        console.log('Starting tag color update...')

        // Update parent tags
        for (const [label, color] of Object.entries(colorMapping)) {
            const { data: parentTag, error: parentFetchError } = await supabase.from('tags').select('*').eq('label', label).single()

            if (parentFetchError) {
                console.error(`Error fetching parent tag ${label}:`, parentFetchError)
                continue
            }

            if (parentTag) {
                const { error: updateError } = await supabase.from('tags').update({ color: color }).eq('id', parentTag.id)

                if (updateError) {
                    console.error(`Error updating parent tag ${label}:`, updateError)
                    continue
                }

                console.log(`Updated parent tag ${label} with color ${color}`)

                // Update child tags
                const { data: childTags, error: childFetchError } = await supabase.from('tags').select('*').eq('parent_id', parentTag.id)

                if (childFetchError) {
                    console.error(`Error fetching children of ${label}:`, childFetchError)
                    continue
                }

                for (const childTag of childTags) {
                    const childColor = getChildColor(color)
                    const { error: childUpdateError } = await supabase.from('tags').update({ color: childColor }).eq('id', childTag.id)

                    if (childUpdateError) {
                        console.error(`Error updating child tag ${childTag.label}:`, childUpdateError)
                        continue
                    }

                    console.log(`Updated child tag ${childTag.label} with color ${childColor}`)
                }
            }
        }

        console.log('Color update completed successfully!')
    } catch (error) {
        console.error('Error in update process:', error)
        process.exit(1)
    }
}

updateTagColors()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
