// check_metadata_issue.js
// Run with: ENV_FILE=.env.rds node check_metadata_issue.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Setup ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envFile = process.env.ENV_FILE || '.env.local'
const envPath = path.resolve(process.cwd(), envFile)
console.log(`Loading environment from: ${envPath}`)
dotenv.config({ path: envPath })

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkMetadataIssue() {
    try {
        // Get all metadata entries with field_name 'analysis_status'
        const { data: metadataEntries, error: metadataError } = await supabase
            .from('document_metadata')
            .select('id, document_id, field_name, field_value, created_at')
            .eq('field_name', 'analysis_status')

        if (metadataError) {
            console.error(`Error fetching metadata: ${metadataError.message}`)
            return
        }

        console.log(`Found ${metadataEntries.length} metadata entries with field_name 'analysis_status'`)

        // Group by field_value
        const valueGroups = {}
        for (const entry of metadataEntries) {
            const value = entry.field_value
            if (!valueGroups[value]) {
                valueGroups[value] = []
            }
            valueGroups[value].push(entry)
        }

        console.log('\nBreakdown by field_value:')
        for (const [value, entries] of Object.entries(valueGroups)) {
            console.log(`- ${value}: ${entries.length} entries`)
        }

        // Check for duplicate entries for the same document
        const documentCounts = {}
        for (const entry of metadataEntries) {
            const docId = entry.document_id
            if (!documentCounts[docId]) {
                documentCounts[docId] = 0
            }
            documentCounts[docId]++
        }

        const duplicateDocs = Object.entries(documentCounts)
            .filter(([_, count]) => count > 1)
            .map(([docId, count]) => ({ docId, count }))

        if (duplicateDocs.length > 0) {
            console.log(`\nFound ${duplicateDocs.length} documents with multiple 'analysis_status' entries:`)
            for (let i = 0; i < Math.min(5, duplicateDocs.length); i++) {
                const { docId, count } = duplicateDocs[i]
                console.log(`- Document ${docId} has ${count} entries`)

                // Get the entries for this document
                const entries = metadataEntries.filter((e) => e.document_id === docId)
                for (const entry of entries) {
                    console.log(`  - ID: ${entry.id}, Value: ${entry.field_value}, Created: ${entry.created_at}`)
                }
            }
        } else {
            console.log('\nNo documents with duplicate analysis_status entries found.')
        }

        // Check for documents that were just updated
        const recentEntries = metadataEntries.filter((e) => {
            const createdAt = new Date(e.created_at)
            const now = new Date()
            const diffMs = now - createdAt
            const diffMins = diffMs / (1000 * 60)
            return diffMins < 10 // Entries created in the last 10 minutes
        })

        console.log(`\nFound ${recentEntries.length} entries created in the last 10 minutes`)

        // Check if any of the recently added entries have field_value other than 'completed'
        const recentNonCompleted = recentEntries.filter((e) => e.field_value !== 'completed')
        if (recentNonCompleted.length > 0) {
            console.log(`Found ${recentNonCompleted.length} recent entries with field_value other than 'completed':`)
            for (const entry of recentNonCompleted) {
                console.log(`- ID: ${entry.id}, Document: ${entry.document_id}, Value: ${entry.field_value}`)
            }
        }

        // Check for case sensitivity issues
        const completedLowercase = metadataEntries.filter((e) => e.field_value === 'completed')
        const completedUppercase = metadataEntries.filter((e) => e.field_value === 'Completed')
        const completedMixedCase = metadataEntries.filter(
            (e) => e.field_value.toLowerCase() === 'completed' && e.field_value !== 'completed' && e.field_value !== 'Completed'
        )

        console.log('\nCase sensitivity check:')
        console.log(`- 'completed' (lowercase): ${completedLowercase.length} entries`)
        console.log(`- 'Completed' (capitalized): ${completedUppercase.length} entries`)
        console.log(`- Other variations of 'completed': ${completedMixedCase.length} entries`)

        if (completedMixedCase.length > 0) {
            console.log('\nOther variations found:')
            const variations = [...new Set(completedMixedCase.map((e) => e.field_value))]
            for (const variation of variations) {
                console.log(`- '${variation}': ${completedMixedCase.filter((e) => e.field_value === variation).length} entries`)
            }
        }

        // Get total count of documents in the data source
        const { count: totalDocs, error: totalError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('source_id', '19373c6f-95a0-48c0-bc0b-35ea8a1c7b50')
            .eq('status', 'processed')

        if (totalError) {
            console.error(`Error fetching total document count: ${totalError.message}`)
            return
        }

        console.log(`\nTotal documents in data source: ${totalDocs}`)
        console.log(`Documents with any analysis_status metadata: ${Object.keys(documentCounts).length}`)
        console.log(`Documents with analysis_status=completed (lowercase): ${completedLowercase.length}`)
        console.log(`Documents that need analysis: ${totalDocs - completedLowercase.length}`)
    } catch (error) {
        console.error('Error checking metadata issue:', error)
    }
}

checkMetadataIssue()
