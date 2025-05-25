import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Sample of recording URLs to check
const recordingUrls = [
    // Previously checked URLs
    'retaildatasystems_rec-1011_12162467258-20250206T221411Z.mp3',
    'retaildatasystems_rec-1011_15597057599-20250203T192226Z.mp3',
    'retaildatasystems_rec-1015_15033972288-20250203T183810Z.mp3',
    'retaildatasystems_rec-1015_15412560978-20250212T182139Z.mp3',

    // New sample of URLs to check - let's get a random sample
    'retaildatasystems_rec-1011_15597460832-20250212T200041Z.mp3',
    'retaildatasystems_rec-1015_15033972288-20250203T183810Z.mp3',
    'retaildatasystems_rec-1011_15597057599-20250203T192226Z.mp3',
    'retaildatasystems_rec-1015_15412560978-20250212T182139Z.mp3',
    'retaildatasystems_rec-1011_15597460832-20250212T200041Z.mp3'
]

async function checkTags() {
    console.log('Checking tags for recording URLs...')

    for (const url of recordingUrls) {
        try {
            const { data, error } = await supabase.from('call_log').select('TAGS_ARRAY').eq('RECORDING_URL', url).single()

            if (error) {
                console.error(`Error fetching tags for ${url}:`, error)
                continue
            }

            console.log(`Tags for ${url}:`, JSON.stringify(data.TAGS_ARRAY))
        } catch (err) {
            console.error(`Error processing ${url}:`, err)
        }
    }
}

checkTags()
    .then(() => console.log('Done checking tags'))
    .catch((err) => console.error('Error:', err))
