import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from local environment
dotenv.config({ path: '.env.local' })

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkData() {
    console.log('Checking database for WOW calls data...')

    // Check data sources
    const { data: sources, error: sourceError } = await supabase.from('data_sources').select('*').ilike('file_path', '%wow-calls%').limit(5)

    if (sourceError) {
        console.error('Error fetching data sources:', sourceError)
    } else {
        console.log('\nData sources found:', sources.length)
        console.log(sources)
    }

    // Check documents
    const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('id, title, content, file_type, category_ai, status')
        .limit(5)

    if (docsError) {
        console.error('Error fetching documents:', docsError)
    } else {
        console.log('\nDocuments found:', docs.length)
        for (const d of docs) {
            console.log(`\nDocument: ${d.id}`)
            console.log(`Title: ${d.title}`)
            console.log(`Content length: ${d.content ? d.content.length : 0} characters`)
            console.log(`Content preview: ${d.content ? `${d.content.substring(0, 100)}...` : 'NO CONTENT'}`)
            console.log(`File type: ${d.file_type}`)
            console.log(`Category: ${d.category_ai}`)
            console.log(`Status: ${d.status}`)
        }
    }
}

// Run the check
checkData().catch(console.error)
