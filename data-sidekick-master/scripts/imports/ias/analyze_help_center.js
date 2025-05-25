/**
 * Analyze IAS Help Center Articles for FAQ Generation Script
 *
 * This script analyzes IAS help center articles to automatically extract FAQs
 * and tag them according to the IAS tag structure. It reads articles from a CSV file,
 * processes each one, and creates FAQ entries in the database.
 *
 * Usage:
 * node scripts/imports/ias/analyze_help_center.js [options]
 *
 * Options:
 * --batch-size=N    Process N articles per batch (default: 10)
 * --offset=N        Skip N articles (default: 0)
 * --id=<uuid>       Process a specific article by ID
 * --output=<path>   Output file path for FAQs JSON (default: ./ias_faqs.json)
 * --limit=N         Process only N articles total (for testing)
 * --test-mode       Run in test mode with verbose output (default: false)
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { parseArgs } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse'
import { tagStructure } from './tag_config.js'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Parse command line arguments
const args = parseArgs({
    options: {
        'batch-size': { type: 'string' },
        offset: { type: 'string' },
        id: { type: 'string' },
        output: { type: 'string' },
        limit: { type: 'string' },
        'test-mode': { type: 'boolean' }
    }
})

// Load environment variables
dotenv.config({ path: process.env.ENV_FILE || '.env.local' })

// Create Supabase client
// Try different environment variable names that might be used
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Debug output for environment variables
if (args.values['test-mode'] === true) {
    console.log('Supabase URL defined:', !!supabaseUrl)
    console.log('Supabase key length:', supabaseKey ? supabaseKey.length : 0)
    console.log('Environment variables checked:', {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY
    })

    if (!supabaseUrl || !supabaseKey) {
        console.warn('WARNING: Missing Supabase credentials!')
    }
}

const supabase = createClient(supabaseUrl, supabaseKey)

// CSV file path
const csvFilePath = path.resolve(process.cwd(), 'data/ias-help-center.csv')

// Test mode flag
const testMode = args.values['test-mode'] === true

// Constants for the script
const BATCH_SIZE = 10
const DELAY_BETWEEN_ARTICLES = 1000 // 1 second delay between articles
const OUTPUT_PATH = './ias_faqs.json'
let batchNumber = 0

/**
 * Create a flattened array of all available tags (parent and child)
 */
function flattenTagStructure() {
    const flattenedTags = []

    for (const parentTag of tagStructure) {
        // Add parent tag
        flattenedTags.push({
            id: parentTag.slug,
            label: parentTag.label,
            slug: parentTag.slug,
            color: parentTag.color,
            description: parentTag.description,
            parent_id: null
        })

        // Add children tags
        for (const childTag of parentTag.children) {
            flattenedTags.push({
                id: childTag.slug,
                label: childTag.label,
                slug: childTag.slug,
                color: childTag.color,
                description: childTag.description,
                parent_id: parentTag.slug
            })
        }
    }

    return flattenedTags
}

/**
 * Create a system prompt for FAQ extraction and tagging
 */
function createSystemPrompt(tags) {
    const tagsList = tags.map((tag) => `${tag.label} (${tag.slug}): ${tag.description}`).join('\n')

    return `You are an AI content analysis assistant for Integral Ad Science (IAS), a leading provider of digital advertising solutions. 

Please analyze the following help center article to extract 1-3 frequently asked questions (FAQs) and their answers, and assign relevant tags to each FAQ.

Available tags:
${tagsList}

When analyzing the article, please adhere to the following guidelines:

1. Content Review:
   - Carefully read and comprehend the entire article content
   - Extract the most common or important questions that the article answers
   - Structure clear, direct answers to these questions based on the article's content

2. Question Extraction:
   - Identify 1-3 most important questions that the article addresses
   - Phrase questions as a user would ask them (in first person)
   - Focus on specific, actionable questions rather than broad topics
   - Keep questions concise but clear

3. Answer Formulation:
   - Provide detailed, step-by-step answers when appropriate
   - Include specific commands, menu paths, or button sequences mentioned in the article
   - Reference exact system names, features, and terminology from the article
   - Keep answers focused and directly related to the question
   - Include any warnings, prerequisites, or important notes mentioned in the article

4. Tag Assignment:
   - Assign 1-3 most relevant tags to each FAQ from the provided list
   - Consider both parent and child tags when making assignments
   - If a child tag is highly relevant, include its parent tag as well
   - Only choose tags that strongly match the FAQ's topic

Please respond in a valid JSON format.
`
}

/**
 * Create schema for FAQ validation
 */
function createFaqSchema() {
    return 'z.object({hasFaq:z.boolean(),faqs:z.array(z.object({question:z.string(),answer:z.string(),tags:z.array(z.string()),reasoning:z.string()}))})'
}

/**
 * Read articles from the CSV file
 */
async function readArticlesFromCsv(options = {}) {
    const { limit = 10, offset = 0, id = null } = options

    return new Promise((resolve, reject) => {
        const articles = []
        let currentRow = 0
        let skipHeader = true

        fs.createReadStream(csvFilePath)
            .pipe(parse({ delimiter: ',', escape: '"', quote: '"' }))
            .on('data', (row) => {
                // Skip header row
                if (skipHeader) {
                    skipHeader = false
                    return
                }

                currentRow++

                // Skip rows before offset
                if (currentRow <= offset) {
                    return
                }

                // Stop after reading the specified limit
                if (articles.length >= limit && !id) {
                    return
                }

                const article = {
                    id: row[0],
                    docId: row[1],
                    chunkNo: Number.parseInt(row[2], 10),
                    storeId: row[3],
                    pageContent: row[4],
                    metadata: JSON.parse(row[5] || '{}'),
                    userId: row[6],
                    organizationId: row[7]
                }

                // If specific ID is requested, only include that article
                if (id && article.id === id) {
                    articles.push(article)
                } else if (!id) {
                    articles.push(article)
                }
            })
            .on('end', () => {
                console.log(`Read ${articles.length} articles from CSV`)
                resolve(articles)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

/**
 * Call the AnswerAI API for flexible analysis
 */
async function callAnswerAi(prompt) {
    try {
        // Ensure we have the necessary environment variables
        if (!process.env.ANSWERAI_ENDPOINT || !process.env.ANSWERAI_TOKEN || !process.env.ANSWERAI_ANALYSIS_CHATFLOW) {
            throw new Error('ANSWERAI_ENDPOINT, ANSWERAI_TOKEN, and ANSWERAI_ANALYSIS_CHATFLOW environment variables are required')
        }

        // Verbose logging when in test mode
        if (testMode) {
            console.log('\n=== CALLING ANSWERAI API ===')
            console.log(`Endpoint: ${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`)
            console.log(`Prompt (first 500 chars): ${prompt.substring(0, 500)}...`)
        }

        // Make the API call
        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
            },
            body: JSON.stringify({
                question: prompt,
                overrideConfig: {
                    exampleJson: createFaqSchema()
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`AnswerAI API returned status ${response.status}: ${errorText}`)
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
        console.error(`Error calling AnswerAI: ${error.message}`)
        throw error
    }
}

/**
 * Process articles and extract FAQs
 */
async function processArticles(articles) {
    const tags = flattenTagStructure()
    const systemPrompt = createSystemPrompt(tags)
    const faqSchema = createFaqSchema()
    const allFaqs = []

    console.log(`Processing ${articles.length} articles for FAQ extraction...`)

    for (const [index, article] of articles.entries()) {
        try {
            console.log(`\nProcessing article ${index + 1}/${articles.length} (ID: ${article.id})`)

            if (!article.pageContent) {
                console.log(`Skipping article ${index + 1} - no content available`)
                continue
            }

            // Extract title from pageContent if possible
            let title = 'Unknown Title'
            const titleMatch = article.pageContent.match(/title:\s*(.*?)(?:\n|$)/)
            if (titleMatch?.length > 0 && titleMatch[1]) {
                title = titleMatch[1].trim()
            } else if (article.metadata?.title) {
                title = article.metadata?.title
            }

            if (testMode) {
                console.log(`Article title: ${title}`)
            }

            // Analyze article for FAQs
            const analysis = await callAnswerAi(article.pageContent)

            if (analysis.hasFaq && analysis.faqs && analysis.faqs.length > 0) {
                // Add article metadata to each FAQ
                const faqs = analysis.faqs.map((faq) => ({
                    ...faq,
                    articleId: article.id,
                    articleTitle: title,
                    articleMetadata: article.metadata,
                    source: 'ias-help-center'
                }))

                allFaqs.push(...faqs)

                if (testMode) {
                    console.log('\n=== EXTRACTED FAQS ===')
                    console.log(`Found ${faqs.length} FAQs in article "${title}":`)

                    for (const [faqIndex, faq] of faqs.entries()) {
                        console.log(`\n[FAQ ${faqIndex + 1}]`)
                        console.log(`Q: ${faq.question}`)
                        console.log(`A: ${faq.answer.substring(0, 150)}...`)
                        console.log(`Tags: ${faq.tags.join(', ')}`)
                        console.log(`Reasoning: ${faq.reasoning}`)
                    }
                } else {
                    console.log(`Found ${faqs.length} FAQs in article "${title}" (ID: ${article.id})`)
                }
            } else {
                console.log(`No FAQs found in article "${title}" (ID: ${article.id})`)
            }
        } catch (error) {
            console.error(`Error processing article ${article.id}: ${error.message}`)
        }
    }

    return allFaqs
}

/**
 * Save FAQs to a JSON file
 */
function saveFaqsToFile(faqs, outputPath) {
    const finalPath = outputPath || './ias_faqs.json'
    const outputDir = path.dirname(finalPath)

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Save FAQs to file
    fs.writeFileSync(finalPath, JSON.stringify(faqs, null, 2))
    console.log(`Saved ${faqs.length} FAQs to ${finalPath}`)
}

/**
 * Create a document entry for an article
 */
async function createDocumentForArticle(article) {
    try {
        // Validate Supabase credentials
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
        }

        // First check if document already exists for this article
        const { data: existingDoc, error: searchError } = await supabase
            .from('aai_documents')
            .select('id')
            .eq('id', article.articleId)
            .maybeSingle()

        if (searchError) {
            if (searchError.message.includes('Invalid API key')) {
                throw new Error('Invalid Supabase API key - check your SUPABASE_SERVICE_ROLE_KEY')
            }
            throw new Error(`Error checking for existing document: ${searchError.message}`)
        }

        if (existingDoc) {
            console.log(`Document already exists for article "${article.title}" with ID: ${existingDoc.id}`)
            return existingDoc.id
        }

        // Create a new document entry
        const { data: newDocument, error: insertError } = await supabase
            .from('aai_documents')
            .insert({
                id: article.articleId,
                content: article.content,
                metadata: {
                    title: article.title,
                    source: 'help-center',
                    source_id: article.source || 'ias-help-center',
                    url: article.url || `https://integralads.zendesk.com/hc/en-us/articles/${article.source}`,
                    word_count: article.content.split(/\s+/).length
                }
            })
            .select('id')
            .single()

        if (insertError) {
            if (insertError.message.includes('Invalid API key')) {
                throw new Error('Invalid Supabase API key - check your SUPABASE_SERVICE_ROLE_KEY')
            }
            throw new Error(`Error creating document: ${insertError.message}`)
        }

        console.log(`Created document for article "${article.title}" with ID: ${newDocument.id}`)
        return newDocument.id
    } catch (error) {
        console.error(`Error creating document for article: ${error.message}`)
        return null
    }
}

/**
 * Store FAQs in the database
 */
async function storeFaqs(faqs) {
    console.log(`\nStoring ${faqs.length} FAQs in database...`)
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    // Group FAQs by article to minimize document creation operations
    const faqsByArticle = {}
    for (const faq of faqs) {
        if (!faqsByArticle[faq.articleId]) {
            faqsByArticle[faq.articleId] = {
                articleId: faq.articleId,
                title: faq.articleTitle,
                content: faq.articleContent,
                url: faq.source ? `https://integralads.zendesk.com/hc/en-us/articles/${faq.source}` : null,
                faqs: []
            }
        }
        faqsByArticle[faq.articleId].faqs.push(faq)
    }

    // Process each article and its FAQs
    for (const articleId in faqsByArticle) {
        const article = faqsByArticle[articleId]

        // Create document for this article
        const documentId = await createDocumentForArticle(article)

        if (!documentId) {
            console.warn(`Could not create document for article ${articleId}, skipping all FAQs from this article`)
            skippedCount += article.faqs.length
            continue
        }

        // Process FAQs for this article
        for (const faq of article.faqs) {
            try {
                // Check if this FAQ already exists
                const { data: existing, error: searchError } = await supabase
                    .from('faqs')
                    .select('id')
                    .eq('analyzed_doc_id', documentId)
                    .eq('question', faq.question)
                    .maybeSingle()

                if (searchError) {
                    throw new Error(`Error checking for existing FAQ: ${searchError.message}`)
                }

                if (existing) {
                    // Update existing FAQ
                    const { error: updateError } = await supabase
                        .from('faqs')
                        .update({
                            answer: faq.answer,
                            reasoning: faq.reasoning,
                            tags: faq.tags,
                            internal_notes: `Source: Help Center Article - ${faq.articleTitle}`,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existing.id)

                    if (updateError) {
                        throw new Error(`Error updating FAQ: ${updateError.message}`)
                    }
                    console.log(`Updated existing FAQ for article ${faq.articleId}`)
                } else {
                    // Insert new FAQ
                    const { error: insertError } = await supabase.from('faqs').insert({
                        question: faq.question,
                        answer: faq.answer,
                        reasoning: faq.reasoning,
                        tags: faq.tags,
                        analyzed_doc_id: documentId,
                        internal_notes: `Source: Help Center Article - ${faq.articleTitle}`,
                        recording_url: `help-center-${faq.source}`,
                        original_tags: [`source:${faq.source}`],
                        status: 'new'
                    })

                    if (insertError) {
                        throw new Error(`Error inserting FAQ: ${insertError.message}`)
                    }
                    console.log(`Inserted new FAQ for article ${faq.articleId} with document ID ${documentId}`)
                }

                successCount++
            } catch (error) {
                console.error(`Error storing FAQ for article ${faq.articleId}: ${error.message}`)
                errorCount++
            }
        }
    }

    console.log(`- Successfully stored in database: ${successCount}`)
    console.log(`- Failed to store in database: ${errorCount}`)
    console.log(`- Skipped (document creation failed): ${skippedCount}`)

    return { successCount, errorCount, skippedCount }
}

/**
 * Load existing FAQs from file if it exists
 */
async function loadExistingFaqs(outputPath) {
    if (!outputPath || !fs.existsSync(outputPath)) {
        console.log(`No existing FAQs file found at ${outputPath}`)
        return []
    }

    try {
        const content = fs.readFileSync(outputPath, 'utf8')

        // Check if content is empty
        if (!content || content.trim() === '') {
            console.log(`FAQs file at ${outputPath} is empty`)
            return []
        }

        try {
            const faqs = JSON.parse(content)
            return Array.isArray(faqs) ? faqs : []
        } catch (parseError) {
            console.error(`Error parsing FAQs JSON: ${parseError.message}`)
            // If JSON parsing fails, backup the problematic file
            const backupPath = `${outputPath}.bak`
            fs.copyFileSync(outputPath, backupPath)
            console.log(`Created backup of problematic FAQs file at ${backupPath}`)
            return []
        }
    } catch (error) {
        console.error(`Error loading existing FAQs: ${error.message}`)
        return []
    }
}

/**
 * Extract FAQs from an article
 */
async function extractFaqs(article) {
    const { id, title, content, source } = article

    // Create a simple prompt for AnswerAI
    const prompt = `
Extract the most frequently asked questions and answers from this help center article. Focus on extracting clear question-answer pairs that would be useful for customer support.

Article title: "${title}"

Article content:
${content}

Return a JSON object with these fields:
1. hasFaq: boolean - true if there are FAQs, false if not
2. faqs: array of extracted FAQs, each with:
   - question: text of the question
   - answer: complete answer to the question
   - reasoning: why this is valuable as an FAQ
   - tags: array of tags categorizing this FAQ

Ensure answers are complete, accurate, and maintain the original context from the article.`

    // Make the AnswerAI API call
    const result = await callAnswerAi(prompt)

    if (!result || !result.hasFaq) {
        return []
    }

    // Enhance the FAQs with additional metadata
    const enhancedFaqs = result.faqs.map((faq) => ({
        ...faq,
        articleId: id,
        articleTitle: title,
        articleContent: content,
        source
    }))

    return enhancedFaqs
}

/**
 * Process a single article for FAQ extraction
 */
async function processArticle(article, index, total) {
    const { id } = article
    // Extract content from pageContent field
    const content = article.pageContent || ''
    // Extract title from metadata or content
    let title = 'Unknown Title'
    if (article.metadata?.title) {
        title = article.metadata.title
    } else {
        const titleMatch = content.match(/title:\s*(.*?)(?:\n|$)/)
        if (titleMatch?.length > 0 && titleMatch[1]) {
            title = titleMatch[1].trim()
        }
    }

    console.log(`\nProcessing article ${index}/${total} (ID: ${id})`)
    console.log(`[Batch ${batchNumber}] Analyzing article ID: ${id} (${content.length} chars)`)

    try {
        // Create article object with needed properties
        const articleData = {
            id,
            title,
            content,
            source: article.metadata?.source || 'ias-help-center'
        }

        // Extract FAQs from the article
        const faqs = await extractFaqs(articleData)

        // Log results
        if (faqs.length > 0) {
            console.log(`Found ${faqs.length} FAQs in article "${title}" (ID: ${id})`)
        } else {
            console.log(`No FAQs found in article "${title}" (ID: ${id})`)
        }

        return faqs
    } catch (error) {
        console.error(`Error processing article ${id}: ${error.message}`)
        return []
    }
}

/**
 * Main function to process articles in batches
 */
async function main() {
    try {
        // Read articles from CSV
        const csvPath = `${process.cwd()}/data/ias-help-center.csv`
        console.log(`Reading articles from ${csvPath}`)
        let articles = await readArticlesFromCsv(csvPath)

        console.log(`Read ${articles.length} articles from CSV`)

        // Apply limit if specified
        if (args.limit && !Number.isNaN(Number.parseInt(args.limit))) {
            const limit = Number.parseInt(args.limit)
            articles = articles.slice(0, limit)
            console.log(`Processing ${limit} articles due to limit argument`)
        }

        // Load existing FAQs
        let allFaqs = await loadExistingFaqs(OUTPUT_PATH)
        console.log(`Loaded ${allFaqs.length} existing FAQs from ${OUTPUT_PATH}`)

        // Process articles in batches
        console.log(`\nProcessing ${articles.length} articles for FAQ extraction...`)
        let totalProcessed = 0
        let totalFaqsExtracted = 0

        // Process in batches
        for (let offset = 0; offset < articles.length; offset += BATCH_SIZE) {
            batchNumber++
            console.log(`\nProcessing batch starting at offset ${offset}`)

            const batchArticles = articles.slice(offset, offset + BATCH_SIZE)
            let batchFaqs = []

            // Process each article in the batch
            for (let i = 0; i < batchArticles.length; i++) {
                const article = batchArticles[i]
                const index = offset + i + 1

                // Process the article to extract FAQs
                const faqs = await processArticle(article, index, articles.length)
                batchFaqs = [...batchFaqs, ...faqs]

                // Wait a bit between articles to avoid rate limiting
                if (i < batchArticles.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_ARTICLES))
                }
            }

            // Add batch FAQs to all FAQs
            allFaqs = [...allFaqs, ...batchFaqs]

            // Save FAQs to file
            saveFaqsToFile(allFaqs, OUTPUT_PATH)

            // Store FAQs in database if not in test mode
            if (!testMode) {
                const { successCount, errorCount, skippedCount } = await storeFaqs(batchFaqs)
                console.log(`- Successfully stored in database: ${successCount}`)
                console.log(`- Failed to store in database: ${errorCount}`)
                console.log(`- Skipped (document creation failed): ${skippedCount}`)
            } else {
                console.log('\n=== TEST MODE: Skipping database storage ===')
            }

            // Update progress
            totalProcessed += batchArticles.length
            totalFaqsExtracted += batchFaqs.length

            console.log('\nBatch complete:')
            console.log(`- Articles processed: ${batchArticles.length}`)
            console.log(`- FAQs extracted: ${batchFaqs.length}`)

            console.log('\nOverall progress:')
            console.log(`- Total articles processed: ${totalProcessed}`)
            console.log(`- Total FAQs extracted: ${totalFaqsExtracted}`)
            console.log(`- Results saved to: ${OUTPUT_PATH}`)

            // Check if we hit the limit
            if (args.limit && totalProcessed >= Number.parseInt(args.limit)) {
                console.log(`\nReached processing limit of ${args.limit} articles.`)
                break
            }
        }

        // Save final results
        saveFaqsToFile(allFaqs, OUTPUT_PATH)

        console.log('\nIAS help center article FAQ extraction complete!')
        console.log(`- Total articles processed: ${totalProcessed}`)
        console.log(`- Total FAQs extracted: ${totalFaqsExtracted}`)
        console.log(`- Final results saved to: ${OUTPUT_PATH}`)
    } catch (error) {
        console.error(`Error in main function: ${error.message}`)
        console.error(error.stack)
        process.exit(1)
    }
}

// Run the script
main().catch(console.error)
