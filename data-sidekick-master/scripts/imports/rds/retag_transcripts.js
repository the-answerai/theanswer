/**
 * Retag Transcripts Script
 *
 * This script uses the flexible analysis endpoint to recategorize transcript tags
 * based on the information in the tags database table.
 *
 * Usage:
 * node scripts/rds/retag_transcripts.js [--limit=10] [--offset=0] [--id=<uuid>] [--chunk-size=500]
 *
 * Options:
 * --limit=N        Process N transcripts (default: all transcripts)
 * --offset=N       Skip N transcripts (default: 0)
 * --id=<uuid>      Process a specific transcript by ID
 * --chunk-size=N   Number of transcripts to fetch in each database query (default: 500, max: 1000)
 * --all            Process all transcripts (overrides limit)
 * --env=<env>      Use a specific environment (local, rds, prime, wow)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { parseArgs } from 'node:util'

// Parse command line arguments
const args = parseArgs({
    options: {
        limit: { type: 'string' },
        offset: { type: 'string' },
        id: { type: 'string' },
        'chunk-size': { type: 'string' },
        all: { type: 'boolean' },
        env: { type: 'string', default: 'local' }
    }
})

// Set up environment
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

// API URL with fallback to localhost if not defined
const apiUrl = process.env.API_URL || 'http://localhost:3000'
console.log(`Using API URL: ${apiUrl}`)

/**
 * Fetch all tags from the database
 */
async function fetchTags() {
    const { data, error } = await supabase.from('tags').select('id, slug, label, description, parent_id').order('id')

    if (error) {
        throw new Error(`Error fetching tags: ${error.message}`)
    }

    // Create a mapping of parent tags
    const tagMap = {}
    for (const tag of data) {
        tagMap[tag.id] = tag
    }

    // Add parent information to each tag
    for (const tag of data) {
        if (tag.parent_id && tagMap[tag.parent_id]) {
            tag.parent_slug = tagMap[tag.parent_id].slug
            tag.parent_label = tagMap[tag.parent_id].label
        }
    }

    return data
}

/**
 * Fetch transcripts to be retagged
 */
async function fetchTranscripts(options = {}) {
    const { limit = 10, offset = 0, id = null } = options

    let query = supabase.from('call_log').select('id, RECORDING_URL, TRANSCRIPTION, TAGS, TAGS_ARRAY').not('TRANSCRIPTION', 'is', null)

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

    return data
}

/**
 * Create a system prompt with tag information
 */
function createSystemPrompt(tags) {
    // Group tags by parent
    const tagsByParent = {}

    for (const tag of tags) {
        const parentSlug = tag.parent_slug || 'root'
        if (!tagsByParent[parentSlug]) {
            tagsByParent[parentSlug] = []
        }
        tagsByParent[parentSlug].push(tag)
    }

    // Generate the system prompt
    let prompt = `
You are an AI call analysis assistant for Retail Data Systems (RDS), a leading provider of Point of Sale (POS) systems for grocery stores, retail stores, and restaurants. 

Please analyze the following call transcript and categorize it with the most relevant tags. When analyzing the transcript, please adhere to the following guidelines:

- **Ignore any segments that are hold music or automated system messages.**  
- **Only focus on portions of the transcript where a human agent interacts with the caller.**
- **Select only the most relevant tags that accurately describe the content of the call.**
- **You may select multiple tags if they apply to different aspects of the call.**

Select tags from the following categories:

`

    // Add all tag categories and their tags
    for (const [parentSlug, childTags] of Object.entries(tagsByParent)) {
        if (parentSlug !== 'root') {
            const parentTag = childTags[0] // Use the first child to get parent info
            prompt += `## ${parentTag.parent_label}\n`
        } else {
            prompt += '## General Tags\n'
        }

        for (const tag of childTags) {
            prompt += `- \`${tag.slug}\`: ${tag.label}${tag.description ? ` - ${tag.description}` : ''}\n`
        }

        prompt += '\n'
    }

    prompt += `
Please respond in JSON format with an array of tag slugs. Select only the tags that directly apply to the content of the call.
`

    return prompt
}

/**
 * Create schema for tag validation
 */
function createTagSchema(tags) {
    // Get all tag slugs for the enum
    const tagSlugs = tags.map((tag) => `"${tag.slug}"`).join(',\n      ')

    // Create a simplified Zod schema string that only includes tags
    return `z.object({tags: z.array(z.enum([${tagSlugs}])).min(1)})`
}

/**
 * Call the flexible analysis endpoint to analyze and tag a transcript
 */
async function analyzeTranscript(transcript, systemPrompt, tagSchema, batchId = '', transcriptId = '') {
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
                    exampleJson: tagSchema
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

        // Extract tags from the parsed result
        return parsedResult.tags || []
    } catch (error) {
        console.error(`Error analyzing transcript${batchId ? ` [Batch ${batchId}]` : ''}: ${error.message}`)
        throw error
    }
}

/**
 * Update transcript tags in the database
 */
async function updateTranscriptTags(transcriptId, tags) {
    const { error } = await supabase
        .from('call_log')
        .update({
            TAGS_ARRAY: tags,
            TAGS: tags.join(', ')
            // Removed 'updated_at' field as it might not exist in the table schema
        })
        .eq('id', transcriptId)

    if (error) {
        throw new Error(`Error updating transcript tags: ${error.message}`)
    }

    return { success: true, transcriptId }
}

/**
 * Count total number of transcripts with transcription
 */
async function countTranscripts() {
    const { count, error } = await supabase.from('call_log').select('id', { count: 'exact', head: true }).not('TRANSCRIPTION', 'is', null)

    if (error) {
        throw new Error(`Error counting transcripts: ${error.message}`)
    }

    return count
}

/**
 * Main function to retag transcripts
 */
async function retagTranscripts() {
    try {
        // Get command line parameters
        const initialOffset = Number.parseInt(args.values.offset || '0')
        const specificId = args.values.id
        const batchSize = 10 // Process 10 transcripts at a time within memory
        const chunkSize = Number.parseInt(args.values['chunk-size'] || '500') // Fetch from DB in chunks (max 1000)

        // Don't allow chunk size greater than 1000 due to Supabase limitations
        const actualChunkSize = Math.min(chunkSize, 1000)

        let totalLimit
        if (args.values.all) {
            totalLimit = Number.POSITIVE_INFINITY // Process all transcripts
        } else if (args.values.limit) {
            totalLimit = Number.parseInt(args.values.limit)
        } else {
            totalLimit = 10 // Default if not specified
        }

        // If processing a specific ID, no need for pagination
        if (specificId) {
            console.log(`Starting retag process for specific ID: ${specificId}`)
            // Run the existing logic for a specific ID
            const transcripts = await fetchTranscripts({
                id: specificId
            })

            if (transcripts.length === 0) {
                console.log(`No transcript found with ID: ${specificId}`)
                return
            }

            await processTranscripts(transcripts, batchSize)
            return
        }

        // If processing multiple transcripts, determine total count for progress reporting
        let totalTranscripts
        if (totalLimit === Number.POSITIVE_INFINITY) {
            console.log('Counting total transcripts with transcription...')
            totalTranscripts = await countTranscripts()
            console.log(`Total transcripts to process: ${totalTranscripts}`)
        } else {
            totalTranscripts = totalLimit
            console.log(`Will process up to ${totalTranscripts} transcripts (starting from offset ${initialOffset})`)
        }

        // Fetch all tags from the database - only needs to be done once
        console.log('Fetching tags from database...')
        const tags = await fetchTags()
        console.log(`Fetched ${tags.length} tags`)

        // Create system prompt with tag information
        const systemPrompt = createSystemPrompt(tags)
        console.log('Created system prompt with tag information')

        // Create tag schema for validation
        const tagSchema = createTagSchema(tags)
        console.log('Created tag schema for validation')

        // Process in chunks to stay within Supabase limits
        let processedCount = 0
        let currentOffset = initialOffset
        let globalSuccessCount = 0
        let globalErrorCount = 0

        while (processedCount < totalLimit) {
            // Calculate how many to fetch in this chunk
            const remainingToProcess = totalLimit - processedCount
            const currentChunkSize = Math.min(remainingToProcess, actualChunkSize)

            console.log(`\n--- Fetching chunk of ${currentChunkSize} transcripts (offset: ${currentOffset}) ---`)

            // Fetch transcripts for this chunk
            const transcripts = await fetchTranscripts({
                limit: currentChunkSize,
                offset: currentOffset
            })

            // If no more transcripts, break the loop
            if (transcripts.length === 0) {
                console.log('No more transcripts to process.')
                break
            }

            console.log(`Fetched ${transcripts.length} transcripts to process`)

            // Process this chunk of transcripts
            const { successCount, errorCount } = await processTranscripts(
                transcripts,
                batchSize,
                tags,
                systemPrompt,
                tagSchema,
                processedCount
            )

            // Update counters
            processedCount += transcripts.length
            currentOffset += transcripts.length
            globalSuccessCount += successCount
            globalErrorCount += errorCount

            console.log(
                `\n--- Progress: ${processedCount}/${
                    totalTranscripts !== Number.POSITIVE_INFINITY ? totalTranscripts : 'unknown'
                } transcripts processed ---`
            )

            // If we've processed the requested limit or all available transcripts, stop
            if (processedCount >= totalLimit || transcripts.length < currentChunkSize) {
                break
            }

            // Small delay between chunks to avoid overwhelming Supabase
            console.log('Waiting 3 seconds before next chunk...')
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }

        console.log('\nRetag process complete:')
        console.log(`- Total transcripts processed: ${processedCount}`)
        console.log(`- Successful updates: ${globalSuccessCount}`)
        console.log(`- Failed updates: ${globalErrorCount}`)
    } catch (error) {
        console.error(`Error in retagTranscripts: ${error.message}`)
        process.exit(1)
    }
}

/**
 * Process a set of transcripts using batch processing
 */
async function processTranscripts(transcripts, batchSize, tagsInput, systemPromptInput, tagSchemaInput, startIndex = 0) {
    let successCount = 0
    let errorCount = 0

    // If tags, systemPrompt, and tagSchema weren't passed in, fetch/create them
    let tags = tagsInput
    let systemPrompt = systemPromptInput
    let tagSchema = tagSchemaInput

    if (!tags) {
        console.log('Fetching tags from database...')
        tags = await fetchTags()
        console.log(`Fetched ${tags.length} tags`)

        systemPrompt = createSystemPrompt(tags)
        console.log('Created system prompt with tag information')

        tagSchema = createTagSchema(tags)
        console.log('Created tag schema for validation')
    }

    // Process transcripts in batches
    for (let batchStart = 0; batchStart < transcripts.length; batchStart += batchSize) {
        const batch = transcripts.slice(batchStart, batchStart + batchSize)
        console.log(`\nProcessing batch ${Math.floor(batchStart / batchSize) + 1} of ${Math.ceil(transcripts.length / batchSize)}`)
        console.log(`Batch size: ${batch.length} transcripts`)

        // Process each transcript in the batch concurrently
        const batchPromises = batch.map(async (transcript, index) => {
            try {
                const globalIndex = startIndex + batchStart + index + 1
                console.log(
                    `[Batch ${Math.floor(batchStart / batchSize) + 1}] Starting transcript ${batchStart + index + 1}/${
                        transcripts.length
                    } (ID: ${transcript.id}, Global #${globalIndex})`
                )

                if (!transcript.TRANSCRIPTION) {
                    console.log(
                        `[Batch ${Math.floor(batchStart / batchSize) + 1}] Skipping transcript ${
                            batchStart + index + 1
                        } - no transcription available`
                    )
                    return { success: false, error: 'No transcription available' }
                }

                // Analyze transcript and get tags
                const newTags = await analyzeTranscript(
                    transcript.TRANSCRIPTION,
                    systemPrompt,
                    tagSchema,
                    Math.floor(batchStart / batchSize) + 1,
                    transcript.id
                )

                console.log(
                    `[Batch ${Math.floor(batchStart / batchSize) + 1}] Analysis complete for transcript ${
                        batchStart + index + 1
                    }, tags: ${JSON.stringify(newTags)}`
                )

                // Update transcript tags in database
                await updateTranscriptTags(transcript.id, newTags)

                console.log(
                    `[Batch ${Math.floor(batchStart / batchSize) + 1}] Successfully updated tags for transcript ${
                        batchStart + index + 1
                    } (ID: ${transcript.id})`
                )

                return { success: true }
            } catch (error) {
                console.error(
                    `[Batch ${Math.floor(batchStart / batchSize) + 1}] Error processing transcript ${batchStart + index + 1} (ID: ${
                        transcript.id
                    }): ${error.message}`
                )
                return { success: false, error: error.message }
            }
        })

        // Wait for all transcripts in the batch to complete
        const batchResults = await Promise.all(batchPromises)

        // Count successes and failures
        for (const result of batchResults) {
            if (result.success) {
                successCount++
            } else {
                errorCount++
            }
        }

        // Wait between batches (not between individual transcripts)
        if (batchStart + batchSize < transcripts.length) {
            console.log('\nWaiting 2 seconds before next batch...')
            await new Promise((resolve) => setTimeout(resolve, 2000))
        }
    }

    return { successCount, errorCount }
}

// Run the script
retagTranscripts().catch(console.error)
