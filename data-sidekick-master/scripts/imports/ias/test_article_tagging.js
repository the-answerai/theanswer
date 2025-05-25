/**
 * Test script for analyzing a single IAS help center article
 *
 * This script reads a single article from the CSV file and runs it through
 * the analysis pipeline to test tagging functionality.
 *
 * Usage:
 * node scripts/imports/ias/test_article_tagging.js
 */

import dotenv from 'dotenv'
import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import { tagStructure } from './tag_config.js'

// Load environment variables
dotenv.config({ path: process.env.ENV_FILE || '.env.local' })

// CSV file path
const csvFilePath = path.resolve(process.cwd(), 'data/ias-help-center.csv')

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
 * Create a system prompt for article tagging
 */
function createSystemPrompt(tags) {
    const tagsList = tags.map((tag) => `${tag.label} (${tag.slug}): ${tag.description}`).join('\n')

    return `You are an AI content analysis assistant for Integral Ad Science (IAS), a leading provider of digital advertising solutions. 

Please analyze the following help center article to identify the most relevant tags that should be applied to it based on its content.

Available tags:
${tagsList}

When analyzing the article, please adhere to the following guidelines:

1. Content Review:
   - Carefully read and comprehend the entire article content
   - Focus on the subject matter, technical terms, and specific solutions mentioned
   - Pay attention to product names, features, and specific workflows described

2. Tag Assignment:
   - Assign 1-3 most relevant tags from the provided list
   - Consider both parent and child tags when making assignments
   - If a child tag is highly relevant, include its parent tag as well
   - Only choose tags that strongly match the article's core topics
   - Prioritize specificity - use more specific tags when possible

3. Reasoning Documentation:
   - For each assigned tag, provide a brief explanation of why it's relevant
   - Reference specific parts of the content that relate to each tag
   - Explain how the content aligns with the tag's description

Please respond in a valid JSON format.
`
}

/**
 * Call the flexible analysis endpoint to analyze an article for tagging
 */
async function analyzeArticle(articleContent, systemPrompt) {
    try {
        // Ensure we have the necessary environment variables
        if (!process.env.ANSWERAI_ENDPOINT || !process.env.ANSWERAI_TOKEN || !process.env.ANSWERAI_ANALYSIS_CHATFLOW) {
            throw new Error('ANSWERAI_ENDPOINT, ANSWERAI_TOKEN, and ANSWERAI_ANALYSIS_CHATFLOW environment variables are required')
        }

        console.log('\n=== SYSTEM PROMPT ===')
        console.log(systemPrompt)

        console.log('\n=== ARTICLE CONTENT (first 500 chars) ===')
        console.log(`${articleContent.substring(0, 500)}...`)

        console.log('\n=== CALLING ANSWERAI API ===')
        console.log(`Endpoint: ${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`)

        // Create zod schema string for the expected response format
        const exampleJsonSchema = 'z.object({assignedTags:z.array(z.object({slug:z.string(),confidence:z.number(),reasoning:z.string()}))})'

        // Direct call to the AnswerAI endpoint with authentication
        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
            },
            body: JSON.stringify({
                question: articleContent,
                overrideConfig: {
                    systemMessagePrompt: systemPrompt,
                    exampleJson: exampleJsonSchema
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Analysis API returned status ${response.status}: ${errorText}`)
        }

        console.log('API call successful, processing response...')
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
        console.error(`Error analyzing article: ${error.message}`)
        throw error
    }
}

/**
 * Read a single article from the CSV file
 */
function readSingleArticle() {
    // Read the CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf8')

    // Parse the CSV data
    const records = parse(fileContent, {
        columns: true,
        delimiter: ',',
        escape: '"',
        quote: '"'
    })

    // Return the first article (after the header)
    if (records?.length > 0) {
        const article = records[0]
        return {
            id: article.id,
            docId: article.docId,
            chunkNo: Number.parseInt(article.chunkNo, 10),
            storeId: article.storeId,
            pageContent: article.pageContent,
            metadata: JSON.parse(article.metadata || '{}'),
            userId: article.userId,
            organizationId: article.organizationId
        }
    }

    throw new Error('No articles found in CSV file')
}

/**
 * Main function to test article tagging
 */
async function testArticleTagging() {
    try {
        console.log('=== Testing IAS Help Center Article Tagging ===')

        // Get a single article from the CSV
        const article = readSingleArticle()
        console.log(`\nLoaded article: ${article.id}`)

        // Extract title from pageContent if possible
        let title = 'Unknown Title'
        const titleMatch = article.pageContent.match(/title:\s*(.*?)(?:\n|$)/)
        if (titleMatch?.length > 0 && titleMatch[1]) {
            title = titleMatch[1].trim()
        } else if (article.metadata?.title) {
            title = article.metadata?.title
        }
        console.log(`Article title: ${title}`)

        // Get tags and create system prompt
        const tags = flattenTagStructure()
        const systemPrompt = createSystemPrompt(tags)

        // Analyze article for tags
        console.log('\nAnalyzing article...')
        const analysis = await analyzeArticle(article.pageContent, systemPrompt)

        if (analysis.assignedTags?.length > 0) {
            console.log('\n=== ANALYSIS RESULTS ===')
            console.log(`Found ${analysis.assignedTags.length} tags for article "${title}":`)

            for (const tag of analysis.assignedTags) {
                console.log(`\n- Tag: ${tag.slug}`)
                console.log(`  Confidence: ${tag.confidence}`)
                console.log(`  Reasoning: ${tag.reasoning}`)
            }
        } else {
            console.log('\nNo relevant tags found for the article.')
        }

        console.log('\n=== Test Complete ===')
    } catch (error) {
        console.error(`Error testing article tagging: ${error.message}`)
        process.exit(1)
    }
}

// Run the test
testArticleTagging().catch(console.error)
