import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function countTags() {
    try {
        // First, get total count of call_log entries
        const { count: totalCount, error: totalError } = await supabase.from('call_log').select('*', { count: 'exact', head: true })

        if (totalError) {
            console.error('Error getting total count:', totalError)
            return
        }

        console.log(`Total call_log entries: ${totalCount}`)

        // Count entries with empty TAGS_ARRAY (null)
        const { count: nullCount, error: nullError } = await supabase
            .from('call_log')
            .select('*', { count: 'exact', head: true })
            .is('TAGS_ARRAY', null)

        if (nullError) {
            console.error('Error counting null tags:', nullError)
            return
        }

        // Get a sample of entries to check their TAGS_ARRAY format
        const { data: sampleData, error: sampleError } = await supabase.from('call_log').select('TAGS_ARRAY').limit(10)

        if (sampleError) {
            console.error('Error getting sample data:', sampleError)
            return
        }

        console.log('Sample TAGS_ARRAY formats:')
        sampleData.forEach((item, index) => {
            console.log(`Sample ${index + 1}:`, item.TAGS_ARRAY, typeof item.TAGS_ARRAY)
        })

        // Count entries with empty arrays using a different approach
        const { data: allEntries, error: allError } = await supabase.from('call_log').select('id, TAGS_ARRAY')

        if (allError) {
            console.error('Error fetching all entries:', allError)
            return
        }

        // Count entries with empty arrays ([], {}, or empty string)
        const emptyArrayEntries = allEntries.filter((entry) => {
            if (!entry.TAGS_ARRAY) return false // Skip null entries (already counted)

            // Check for empty arrays in various formats
            if (Array.isArray(entry.TAGS_ARRAY) && entry.TAGS_ARRAY.length === 0) return true
            if (typeof entry.TAGS_ARRAY === 'string') {
                const trimmed = entry.TAGS_ARRAY.trim()
                return trimmed === '[]' || trimmed === '{}' || trimmed === ''
            }
            return false
        })

        const emptyArrayCount = emptyArrayEntries.length
        const emptyCount = nullCount + emptyArrayCount
        const percentEmpty = ((emptyCount / totalCount) * 100).toFixed(2)

        console.log(`Entries with null TAGS_ARRAY: ${nullCount}`)
        console.log(`Entries with empty array TAGS_ARRAY: ${emptyArrayCount}`)
        console.log(`Total entries with empty TAGS_ARRAY: ${emptyCount} (${percentEmpty}%)`)

        // Count entries with specific tags
        const entriesWithTags = {
            analysis_failed: 0,
            'general-technical-issue': 0,
            'general-inquiry': 0,
            'unclassified-issue': 0
        }

        allEntries.forEach((entry) => {
            if (!entry.TAGS_ARRAY) return

            let tags = entry.TAGS_ARRAY
            if (typeof tags === 'string') {
                try {
                    tags = JSON.parse(tags)
                } catch (e) {
                    // If it's not valid JSON, try to parse it as a PostgreSQL array
                    if (tags.startsWith('{') && tags.endsWith('}')) {
                        tags = tags
                            .slice(1, -1)
                            .split(',')
                            .map((t) => t.trim().replace(/^"(.*)"$/, '$1'))
                    } else {
                        return // Can't parse, skip
                    }
                }
            }

            if (!Array.isArray(tags)) return

            if (tags.includes('analysis_failed')) entriesWithTags['analysis_failed']++
            if (tags.includes('general-technical-issue')) entriesWithTags['general-technical-issue']++
            if (tags.includes('general-inquiry')) entriesWithTags['general-inquiry']++
            if (tags.includes('unclassified-issue')) entriesWithTags['unclassified-issue']++
        })

        const failedCount = entriesWithTags['analysis_failed']
        const percentFailed = ((failedCount / totalCount) * 100).toFixed(2)
        console.log(`Entries with analysis_failed tag: ${failedCount} (${percentFailed}%)`)

        const generalTechnicalCount = entriesWithTags['general-technical-issue']
        const generalInquiryCount = entriesWithTags['general-inquiry']
        const unclassifiedCount = entriesWithTags['unclassified-issue']
        const generalCount = generalTechnicalCount + generalInquiryCount + unclassifiedCount
        const percentGeneral = ((generalCount / totalCount) * 100).toFixed(2)

        console.log(`Entries with general-technical-issue tag: ${generalTechnicalCount}`)
        console.log(`Entries with general-inquiry tag: ${generalInquiryCount}`)
        console.log(`Entries with unclassified-issue tag: ${unclassifiedCount}`)
        console.log(`Total entries with general tags: ${generalCount} (${percentGeneral}%)`)
    } catch (error) {
        console.error('Unexpected error:', error)
    }
}

countTags()
