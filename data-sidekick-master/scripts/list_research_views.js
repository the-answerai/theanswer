import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function listResearchViews() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
        .from('research_views')
        .select('id, name, description, created_at')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching research views:', error)
        return
    }

    console.log('Research Views:')
    console.table(data)
}

listResearchViews()
