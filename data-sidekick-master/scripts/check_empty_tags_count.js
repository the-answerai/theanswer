import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.rds' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function countEmptyTags() {
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

        // Count entries with empty TAGS_ARRAY (empty array)
        const { data: emptyArrayData, error: emptyArrayError } = await supabase
            .from('call_log')
            .select('COUNT(*)')
            .neq('TAGS_ARRAY', null)
            .eq('TAGS_ARRAY', '[]')

        if (emptyArrayError) {
            console.error('Error counting empty array tags:', emptyArrayError)
            return
        }

        const emptyArrayCount = emptyArrayData[0]?.count || 0
        const emptyCount = nullCount + Number.parseInt(emptyArrayCount)
        const percentEmpty = ((emptyCount / totalCount) * 100).toFixed(2)

        console.log(`Entries with null TAGS_ARRAY: ${nullCount}`)
        console.log(`Entries with empty array TAGS_ARRAY: ${emptyArrayCount}`)
        console.log(`Total entries with empty TAGS_ARRAY: ${emptyCount} (${percentEmpty}%)`)

        // Count entries with analysis_failed tag
        const { data: failedData, error: failedError } = await supabase
            .from('call_log')
            .select('COUNT(*)')
            .contains('TAGS_ARRAY', ['analysis_failed'])

        if (failedError) {
            console.error('Error counting failed analysis:', failedError)
            return
        }

        const failedCount = failedData[0]?.count || 0
        const percentFailed = ((Number.parseInt(failedCount) / totalCount) * 100).toFixed(2)

        console.log(`Entries with analysis_failed tag: ${failedCount} (${percentFailed}%)`)

        // Count entries with general tags
        const { data: generalTechnicalData, error: generalTechnicalError } = await supabase
            .from('call_log')
            .select('COUNT(*)')
            .contains('TAGS_ARRAY', ['general-technical-issue'])

        if (generalTechnicalError) {
            console.error('Error counting general-technical-issue tags:', generalTechnicalError)
            return
        }

        const { data: generalInquiryData, error: generalInquiryError } = await supabase
            .from('call_log')
            .select('COUNT(*)')
            .contains('TAGS_ARRAY', ['general-inquiry'])

        if (generalInquiryError) {
            console.error('Error counting general-inquiry tags:', generalInquiryError)
            return
        }

        const { data: unclassifiedData, error: unclassifiedError } = await supabase
            .from('call_log')
            .select('COUNT(*)')
            .contains('TAGS_ARRAY', ['unclassified-issue'])

        if (unclassifiedError) {
            console.error('Error counting unclassified-issue tags:', unclassifiedError)
            return
        }

        const generalTechnicalCount = Number.parseInt(generalTechnicalData[0]?.count || 0)
        const generalInquiryCount = Number.parseInt(generalInquiryData[0]?.count || 0)
        const unclassifiedCount = Number.parseInt(unclassifiedData[0]?.count || 0)
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

countEmptyTags()
