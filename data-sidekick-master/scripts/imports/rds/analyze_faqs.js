/**
 * Analyze Transcripts for FAQs Script
 *
 * This script analyzes call transcripts to identify potential FAQs and their answers.
 * It uses the flexible analysis endpoint to detect reusable information and troubleshooting steps.
 *
 * Usage:
 * node scripts/rds/analyze_faqs.js [--batch-size=10] [--offset=0] [--id=<uuid>] [--output=<path>] [--config=<path>]
 *
 * Options:
 * --batch-size=N    Process N transcripts per batch (default: 10)
 * --offset=N       Skip N transcripts (default: 0)
 * --id=<uuid>      Process a specific transcript by ID
 * --output=<path>  Output file path for FAQ JSON (default: ./faqs.json)
 * --config=<path>  Path to config file for filters (default: ./faq-filters.json)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { parseArgs } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

// Helper function to get filename from URL
function getRecordingFilename(url) {
    if (!url) return null
    const parts = url.split('/')
    return parts[parts.length - 1]
}

// Default filter configuration
const DEFAULT_FILTERS = {
    resolution_status: 'resolved',
    required_tags: ['coaching-successful-troubleshoot', 'gap-basic-howto'],
    match_any_tag: true // if true, matches if any tag is present; if false, requires all tags
}

// Load custom filter configuration if provided
function loadFilterConfig(configPath) {
    if (!configPath || !fs.existsSync(configPath)) {
        return DEFAULT_FILTERS
    }
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return {
            ...DEFAULT_FILTERS,
            ...config
        }
    } catch (error) {
        console.error(`Error loading filter config: ${error.message}`)
        return DEFAULT_FILTERS
    }
}

// Parse command line arguments
const args = parseArgs({
    options: {
        'batch-size': { type: 'string' },
        offset: { type: 'string' },
        id: { type: 'string' },
        output: { type: 'string' },
        config: { type: 'string' }
    }
})

// Load environment variables
dotenv.config({ path: process.env.ENV_FILE || '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Create a system prompt for FAQ detection
 */
function createSystemPrompt() {
    return `You are an AI call analysis assistant for Retail Data Systems (RDS), a leading provider of Point of Sale (POS) systems for grocery stores, retail stores, and restaurants. 

Please analyze the following call transcript to identify potential Frequently Asked Questions (FAQs) and their solutions. When analyzing the transcript, please adhere to the following guidelines:

1. Question Identification:
   - Extract the actual question or problem as presented by the customer
   - Include specific details about devices, software versions, or error messages mentioned
   - Preserve the technical context and specific terminology used
   - Note any unique circumstances or prerequisites

2. Answer Formulation:
   - Provide detailed, step-by-step solutions
   - Include specific commands, menu paths, or button sequences when relevant
   - Reference exact system names, device models, and software versions
   - Document any required permissions or preconditions
   - Note any alternative approaches discussed
   - Include verification steps to confirm the solution worked

3. Reasoning Documentation:
   - Explain why this is a reusable FAQ
   - Reference specific parts of the transcript that demonstrate the solution's effectiveness
   - Note any unique troubleshooting steps that were particularly effective
   - Identify patterns or common scenarios where this solution applies
   - Document any root cause analysis performed

4. Internal Notes:
   - Include relevant employee names and their effective approaches
   - Note any internal tools or systems referenced
   - Document any escalation paths or internal procedures followed
   - Highlight any customer-specific context that was helpful
   - Record any relevant ticket numbers or reference materials used
   - Note any follow-up actions or preventive measures suggested

5. Quality Criteria:
   - Solutions must be complete and independently actionable
   - Include specific error messages, system responses, or expected behaviors
   - Document both successful and unsuccessful attempts in the transcript
   - Note any limitations or scenarios where the solution may not apply
   - Include relevant warnings or precautions

6. Tags and Categorization:
   - Tag specific devices or systems involved
   - Note the type of issue (hardware, software, configuration, etc.)
   - Identify the business impact level
   - Mark any prerequisites or required access levels

Please respond in JSON format
`
}

/**
 * Create schema for FAQ validation
 */
function createFaqSchema() {
    return 'z.object({hasFaq:z.boolean(),faqs:z.array(z.object({question:z.string(),answer:z.string(),reasoning:z.string(),internalNotes:z.string(),tags:z.array(z.string())}))})'
}

/**
 * Fetch transcripts to be analyzed
 */
async function fetchTranscripts(options = {}) {
    const { limit = 1, offset = 0, id = null } = options
    const filters = loadFilterConfig(args.values.config)

    console.log('\nApplying filters:', JSON.stringify(filters, null, 2))

    let query = supabase
        .from('call_log')
        .select('id, RECORDING_URL, TRANSCRIPTION, TAGS, TAGS_ARRAY, resolution_status')
        .not('TRANSCRIPTION', 'is', null)
        .eq('resolution_status', filters.resolution_status)

    // Add tag filtering
    if (filters.required_tags && filters.required_tags.length > 0) {
        if (filters.match_any_tag) {
            // Match any of the required tags
            console.log('Filtering for calls with ANY of these tags:', filters.required_tags)
            query = query.overlaps('TAGS_ARRAY', filters.required_tags)
        } else {
            // Match all required tags
            console.log('Filtering for calls with ALL of these tags:', filters.required_tags)
            for (const tag of filters.required_tags) {
                query = query.contains('TAGS_ARRAY', [tag])
            }
        }
    }

    // If specific ID provided, filter by that ID
    if (id) {
        query = query.eq('id', id)
    } else {
        // Otherwise use limit and offset
        query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Error fetching transcripts: ${error.message}`)
    }

    console.log(`\nFound ${data?.length || 0} matching transcripts`)
    if (data?.length > 0) {
        console.log('Sample transcript tags:', data[0].TAGS_ARRAY)
        console.log('Sample transcript resolution status:', data[0].resolution_status)
    }

    return data
}

/**
 * Call the flexible analysis endpoint to analyze a transcript for FAQs
 */
async function analyzeTranscript(transcript, systemPrompt, faqSchema, batchId = '', transcriptId = '') {
    try {
        // Ensure we have the necessary environment variables
        if (!process.env.ANSWERAI_ENDPOINT || !process.env.ANSWERAI_TOKEN || !process.env.ANSWERAI_ANALYSIS_CHATFLOW) {
            throw new Error('ANSWERAI_ENDPOINT, ANSWERAI_TOKEN, and ANSWERAI_ANALYSIS_CHATFLOW environment variables are required')
        }

        // Compact logging that works well with batch processing
        if (batchId) {
            console.log(`[Batch ${batchId}] Analyzing transcript ID: ${transcriptId} (${transcript.length} chars)`)
        }

        // Direct call to the AnswerAI endpoint with authentication
        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
            },
            body: JSON.stringify({
                question: transcript,
                overrideConfig: {
                    systemMessagePrompt: systemPrompt,
                    exampleJson: faqSchema
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Analysis API returned status ${response.status}: ${errorText}`)
        }

        const result = await response.json()

        // Handle various response formats
        let parsedResult
        if (result.json) {
            parsedResult = typeof result.json === 'string' ? JSON.parse(result.json) : result.json
        } else if (result.text) {
            const rawReply = result.text.trim()
            try {
                parsedResult = JSON.parse(rawReply)
            } catch (e) {
                // Try to extract JSON from markdown code blocks
                const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                if (jsonMatch) {
                    parsedResult = JSON.parse(jsonMatch[1].trim())
                } else {
                    throw new Error(`Could not parse JSON from response: ${rawReply}`)
                }
            }
        } else {
            parsedResult = result
        }

        return parsedResult
    } catch (error) {
        console.error(`Error analyzing transcript${batchId ? ` [Batch ${batchId}]` : ''}: ${error.message}`)
        throw error
    }
}

/**
 * Process transcripts and extract FAQs
 */
async function processTranscripts(transcripts) {
    const systemPrompt = createSystemPrompt()
    const faqSchema = createFaqSchema()
    const allFaqs = []

    console.log(`Processing ${transcripts.length} transcripts for FAQs...`)

    for (const [index, transcript] of transcripts.entries()) {
        try {
            console.log(`\nProcessing transcript ${index + 1}/${transcripts.length} (ID: ${transcript.id})`)

            if (!transcript.TRANSCRIPTION) {
                console.log(`Skipping transcript ${index + 1} - no transcription available`)
                continue
            }

            // Analyze transcript for FAQs
            const analysis = await analyzeTranscript(transcript.TRANSCRIPTION, systemPrompt, faqSchema, 1, transcript.id)

            if (analysis.hasFaq) {
                // Add transcript metadata to each FAQ
                const faqs = analysis.faqs.map((faq) => ({
                    ...faq,
                    transcriptId: transcript.id,
                    recordingUrl: transcript.RECORDING_URL,
                    originalTags: transcript.TAGS_ARRAY || []
                }))

                allFaqs.push(...faqs)
                console.log(`Found ${faqs.length} FAQs in transcript ${transcript.id}`)
            } else {
                console.log(`No FAQs found in transcript ${transcript.id}`)
            }
        } catch (error) {
            console.error(`Error processing transcript ${transcript.id}: ${error.message}`)
        }
    }

    return allFaqs
}

/**
 * Save FAQs to a JSON file
 */
async function saveFaqs(faqs, outputPath) {
    const finalPath = outputPath || './faqs.json'
    const outputDir = path.dirname(finalPath)

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save FAQs to file
    fs.writeFileSync(finalPath, JSON.stringify(faqs, null, 2))
    console.log(`\nSaved ${faqs.length} FAQs to ${finalPath}`)
}

/**
 * Store FAQs in the database
 */
async function storeFaqs(faqs) {
    console.log(`\nStoring ${faqs.length} FAQs in database...`)
    let successCount = 0
    let errorCount = 0

    for (const faq of faqs) {
        try {
            // Check if this FAQ already exists for this transcript
            const { data: existing, error: searchError } = await supabase
                .from('faqs')
                .select('id')
                .eq('transcript_id', faq.transcriptId)
                .eq('question', faq.question)
                .maybeSingle()

            if (searchError) {
                throw new Error(`Error checking for existing FAQ: ${searchError.message}`)
            }

            // Extract just the filename from the recording URL
            const recordingFilename = getRecordingFilename(faq.recordingUrl)

            if (existing) {
                // Update existing FAQ
                const { error: updateError } = await supabase
                    .from('faqs')
                    .update({
                        answer: faq.answer,
                        reasoning: faq.reasoning,
                        internal_notes: faq.internalNotes,
                        tags: faq.tags,
                        original_tags: faq.originalTags,
                        recording_url: recordingFilename,
                        updated_at: new Date().toISOString()
                        // Don't update status if FAQ already exists
                    })
                    .eq('id', existing.id)

                if (updateError) {
                    throw new Error(`Error updating FAQ: ${updateError.message}`)
                }
                console.log(`Updated existing FAQ for transcript ${faq.transcriptId}`)
            } else {
                // Insert new FAQ
                const { error: insertError } = await supabase.from('faqs').insert({
                    question: faq.question,
                    answer: faq.answer,
                    reasoning: faq.reasoning,
                    internal_notes: faq.internalNotes,
                    tags: faq.tags,
                    transcript_id: faq.transcriptId,
                    recording_url: recordingFilename,
                    original_tags: faq.originalTags,
                    status: 'new' // All new FAQs start with 'new' status
                })

                if (insertError) {
                    throw new Error(`Error inserting FAQ: ${insertError.message}`)
                }
                console.log(`Inserted new FAQ for transcript ${faq.transcriptId}`)
            }

            successCount++
        } catch (error) {
            console.error(`Error storing FAQ for transcript ${faq.transcriptId}: ${error.message}`)
            errorCount++
        }
    }

    return { successCount, errorCount }
}

/**
 * Load existing FAQs from file if it exists
 */
async function loadExistingFaqs(outputPath) {
    if (!outputPath || !fs.existsSync(outputPath)) {
        return []
    }
    try {
        const content = fs.readFileSync(outputPath, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`Error loading existing FAQs: ${error.message}`)
        return []
    }
}

/**
 * Get total count of transcripts to process
 */
async function getTotalTranscripts() {
    const { count, error } = await supabase.from('call_log').select('*', { count: 'exact', head: true }).not('TRANSCRIPTION', 'is', null)

    if (error) {
        throw new Error(`Error getting total transcript count: ${error.message}`)
    }

    return count
}

/**
 * Main function to analyze transcripts for FAQs
 */
async function analyzeFaqs() {
    try {
        // Get command line parameters
        const batchSize = Number.parseInt(args.values['batch-size'] || '10')
        const offset = Number.parseInt(args.values.offset || '0')
        const specificId = args.values.id
        const outputPath = args.values.output

        // Load existing FAQs if output file exists
        const existingFaqs = await loadExistingFaqs(outputPath)
        console.log(`Loaded ${existingFaqs.length} existing FAQs from ${outputPath}`)

        if (specificId) {
            // If specific ID provided, just process that one
            console.log(`Processing single transcript with ID: ${specificId}`)
            const transcripts = await fetchTranscripts({ id: specificId })
            const faqs = await processTranscripts(transcripts)
            await storeFaqs(faqs)
            if (outputPath) {
                await saveFaqs([...existingFaqs, ...faqs], outputPath)
            }
            return
        }

        // Get total number of transcripts to process
        const totalTranscripts = await getTotalTranscripts()
        console.log(`Total transcripts to process: ${totalTranscripts}`)

        let currentOffset = offset
        let totalProcessed = 0
        const allFaqs = [...existingFaqs]

        // Process in batches
        while (currentOffset < totalTranscripts) {
            console.log(`\nProcessing batch starting at offset ${currentOffset}`)

            // Fetch batch of transcripts
            const transcripts = await fetchTranscripts({
                limit: batchSize,
                offset: currentOffset
            })

            if (transcripts.length === 0) {
                console.log('No more transcripts to process.')
                break
            }

            // Process the batch
            const batchFaqs = await processTranscripts(transcripts)

            // Store FAQs in database
            const { successCount, errorCount } = await storeFaqs(batchFaqs)

            // Add to our collection
            allFaqs.push(...batchFaqs)

            // Save to file if specified
            if (outputPath) {
                await saveFaqs(allFaqs, outputPath)
            }

            // Update progress
            totalProcessed += transcripts.length
            currentOffset += batchSize

            // Log batch results
            console.log('\nBatch complete:')
            console.log(`- Transcripts processed: ${transcripts.length}`)
            console.log(`- FAQs found: ${batchFaqs.length}`)
            console.log(`- Successfully stored in database: ${successCount}`)
            console.log(`- Failed to store in database: ${errorCount}`)
            console.log('\nOverall progress:')
            console.log(`- Total transcripts processed: ${totalProcessed}/${totalTranscripts}`)
            console.log(`- Total FAQs found: ${allFaqs.length}`)
            if (outputPath) {
                console.log(`- Results saved to: ${outputPath}`)
            }
        }

        console.log('\nFAQ analysis complete!')
        console.log(`- Total transcripts processed: ${totalProcessed}`)
        console.log(`- Total FAQs found: ${allFaqs.length}`)
        if (outputPath) {
            console.log(`- Final results saved to: ${outputPath}`)
        }
    } catch (error) {
        console.error(`Error in analyzeFaqs: ${error.message}`)
        process.exit(1)
    }
}

// Run the script
analyzeFaqs().catch(console.error)
