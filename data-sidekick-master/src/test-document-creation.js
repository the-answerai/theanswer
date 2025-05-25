/**
 * Test script for document creation
 *
 * This script tests the document creation functionality without requiring AnswerAI analysis.
 * It directly inserts a document into the database and creates related metadata.
 *
 * Usage: node src/test-document-creation.js <sourceId>
 *
 * Note: This script should be run from the project root and requires proper environment variables.
 */
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role key for direct DB access
)

async function createTestDocument() {
    try {
        // Get source ID from command line arguments or use a default for testing
        const sourceId = process.argv[2]

        if (!sourceId) {
            console.error('Error: Source ID is required')
            console.log('Usage: node src/test-document-creation.js <sourceId>')
            process.exit(1)
        }

        // Verify the source exists
        const { data: source, error: sourceError } = await supabase
            .from('data_sources')
            .select('id, research_view_id')
            .eq('id', sourceId)
            .single()

        if (sourceError) {
            console.error('Error: Source not found', sourceError)
            process.exit(1)
        }

        console.log('Source found:', source)

        // Sample transcript text
        const text = `
        This is a test transcript for document creation.
        It simulates a conversation that would normally be processed through AnswerAI.
        We're testing the direct document creation functionality without requiring analysis.
        The document should be stored properly with this content.
        `

        // Calculate word and token counts
        const wordCount = text.split(/\s+/).filter(Boolean).length
        const tokenCount = Math.ceil(wordCount * 1.3) // Rough estimate

        // Create document record
        const documentId = uuidv4()
        const document = {
            id: documentId,
            source_id: sourceId,
            title: 'Test Transcript',
            content: text,
            content_summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            token_count: tokenCount,
            word_count: wordCount,
            file_type: 'transcript',
            status: 'processed', // Mark as processed immediately
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Insert document record
        const { data: documentData, error: documentError } = await supabase.from('documents').insert([document]).select().single()

        if (documentError) {
            console.error('Error creating document record:', documentError)
            process.exit(1)
        }

        console.log('Document created successfully:', {
            id: documentData.id,
            title: documentData.title,
            status: documentData.status
        })

        // Create some sample metadata
        const metadata = [
            {
                document_id: documentId,
                field_name: 'summary',
                field_value: 'This is a test transcript for document creation without AnswerAI analysis.',
                field_prompt: 'Generate summary',
                is_predefined: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                document_id: documentId,
                field_name: 'test_metadata',
                field_value: 'This is a test metadata field to verify the direct creation functionality.',
                field_prompt: 'Test metadata',
                is_predefined: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ]

        // Insert metadata
        const { data: metadataData, error: metadataError } = await supabase.from('document_metadata').insert(metadata)

        if (metadataError) {
            console.error('Error creating metadata:', metadataError)
        } else {
            console.log(`Created ${metadata.length} metadata entries for document`)
        }

        console.log('Test complete. Document created with ID:', documentId)

        return { success: true, documentId }
    } catch (error) {
        console.error('Error in test script:', error)
        return { success: false, error: error.message }
    }
}

// Run the test
createTestDocument().then((result) => {
    console.log('Test result:', result)
    process.exit(result.success ? 0 : 1)
})
