#!/usr/bin/env node
/**
 * Script to sync documentation from sitemap to document store
 *
 * This script:
 * 1. Reads the sitemap from packages/docs/build/sitemap.xml
 * 2. Fetches content from each URL
 * 3. Uploads content to document store using the API
 * 4. Uses character text splitter for chunking
 *
 * Usage:
 *   npx tsx scripts/sync-docs-to-docstore.ts
 *
 * Environment Variables:
 *   DOCS_API_HOST - The API host for docs sync (default: http://localhost:3000)
 *   DOCS_API_KEY - API key for authentication (required)
 *   DOCS_STORE_ID - Document store ID to upload docs to (required)
 *
 *   Fallbacks: Also checks API_HOST, API_KEY, DOCUMENT_STORE_ID for backwards compatibility
 */

import * as fs from 'fs'
import * as path from 'path'
import * as xml2js from 'xml2js'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import dotenv from 'dotenv'
import FormData from 'form-data'

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') })

// Configuration
const DOCS_API_HOST = process.env.DOCS_API_HOST || process.env.API_HOST || 'http://localhost:3000'
const DOCS_API_KEY = process.env.DOCS_API_KEY || process.env.API_KEY
const DOCS_STORE_ID = process.env.DOCS_STORE_ID || process.env.DOCUMENT_STORE_ID
const SITEMAP_PATH = path.join(__dirname, '../packages/docs/build/sitemap.xml')
const DOMAIN = 'https://answeragent.ai'

// Character text splitter configuration
const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

interface SitemapUrl {
    loc: string[]
    changefreq?: string[]
    priority?: string[]
}

interface Sitemap {
    urlset: {
        url: SitemapUrl[]
    }
}

interface DocumentMetadata {
    source: string
    url: string
    title?: string
    description?: string
    timestamp: string
}

/**
 * Parse sitemap.xml and extract URLs
 */
async function parseSitemap(): Promise<string[]> {
    console.log(`📖 Reading sitemap from: ${SITEMAP_PATH}`)

    const xmlContent = fs.readFileSync(SITEMAP_PATH, 'utf-8')
    const parser = new xml2js.Parser()
    const result: Sitemap = await parser.parseStringPromise(xmlContent)

    const urls = result.urlset.url.map((url: SitemapUrl) => url.loc[0])
    console.log(`✅ Found ${urls.length} URLs in sitemap`)

    return urls
}

/**
 * Fetch HTML content from a URL and extract text
 */
async function fetchContent(url: string): Promise<{ content: string; metadata: DocumentMetadata }> {
    console.log(`🔍 Fetching: ${url}`)

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'AnswerAgentAI-DocSync/1.0'
            },
            timeout: 30000
        })

        const dom = new JSDOM(response.data)
        const document = dom.window.document

        // Extract title
        const title = document.querySelector('title')?.textContent || ''

        // Extract meta description
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''

        // Remove script and style tags
        document.querySelectorAll('script, style, nav, header, footer').forEach((el) => el.remove())

        // Extract main content
        const mainContent =
            document.querySelector('main')?.textContent ||
            document.querySelector('article')?.textContent ||
            document.querySelector('.markdown')?.textContent ||
            document.body.textContent ||
            ''

        // Clean up whitespace
        const content = mainContent.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim()

        const metadata: DocumentMetadata = {
            source: 'answeragent-docs',
            url,
            title: title.trim(),
            description: description.trim(),
            timestamp: new Date().toISOString()
        }

        console.log(`✅ Fetched ${content.length} characters from ${url}`)
        return { content, metadata }
    } catch (error: any) {
        console.error(`❌ Error fetching ${url}:`, error.message)
        throw error
    }
}

/**
 * Upload document to document store via API
 */
// Get the loader ID from the document store (fetch once at startup)
let LOADER_DOC_ID: string | null = null

async function getLoaderDocId(): Promise<string> {
    if (LOADER_DOC_ID) return LOADER_DOC_ID

    const response = await axios.get(`${DOCS_API_HOST}/api/v1/document-store/store/${DOCS_STORE_ID}`, {
        headers: {
            Authorization: `Bearer ${DOCS_API_KEY}`
        }
    })

    const loaders = response.data.loaders || []
    if (loaders.length === 0) {
        throw new Error('No loaders configured in document store. Please configure a Text File loader in the Flowise UI first.')
    }

    // Use the first loader (should be the Text File loader)
    LOADER_DOC_ID = loaders[0].id
    console.log(`📋 Using loader: ${loaders[0].loaderName} (${LOADER_DOC_ID})`)
    return LOADER_DOC_ID
}

async function uploadDocument(content: string, metadata: DocumentMetadata): Promise<void> {
    if (!DOCS_API_KEY) {
        throw new Error('DOCS_API_KEY environment variable is required')
    }

    if (!DOCS_STORE_ID) {
        throw new Error('DOCS_STORE_ID environment variable is required')
    }

    console.log(`📤 Uploading to document store: ${metadata.url}`)

    try {
        // Get the loader doc ID
        const docId = await getLoaderDocId()

        // Create a text file with metadata embedded
        const contentWithMetadata = `---
title: ${metadata.title}
url: ${metadata.url}
source: ${metadata.source}
timestamp: ${metadata.timestamp}
---

${content}`

        // Create form data with the text file
        const form = new FormData()

        // IMPORTANT: Pass docId to tell the API which loader to use
        form.append('docId', docId)

        form.append('files', Buffer.from(contentWithMetadata), {
            filename: `${metadata.title?.substring(0, 50).replace(/[^a-zA-Z0-9-_ ]/g, '') || 'doc'}.txt`,
            contentType: 'text/plain'
        })

        // Upload the file to the document store
        const response = await axios.post(`${DOCS_API_HOST}/api/v1/document-store/upsert/${DOCS_STORE_ID}`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${DOCS_API_KEY}`
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        })

        console.log(`✅ Successfully uploaded: ${metadata.url} (${response.data.numAdded} chunks added)`)
        return response.data
    } catch (error: any) {
        console.error(`❌ Error uploading ${metadata.url}:`, error.response?.data?.message || error.message)
        throw error
    }
}

/**
 * Process a single URL
 */
async function processUrl(url: string): Promise<void> {
    try {
        const { content, metadata } = await fetchContent(url)

        if (content.length < 100) {
            console.log(`⏭️  Skipping ${url} - content too short (${content.length} chars)`)
            return
        }

        await uploadDocument(content, metadata)
    } catch (error: any) {
        console.error(`❌ Failed to process ${url}:`, error.message)
        // Continue processing other URLs
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Starting documentation sync to document store...\n')

    // Validate environment
    if (!DOCS_API_KEY) {
        console.error('❌ DOCS_API_KEY environment variable is required')
        process.exit(1)
    }

    if (!DOCS_STORE_ID) {
        console.error('❌ DOCS_STORE_ID environment variable is required')
        process.exit(1)
    }

    console.log(`📍 API Host: ${DOCS_API_HOST}`)
    console.log(`📍 Document Store ID: ${DOCS_STORE_ID}`)
    console.log(`📍 Chunk Size: ${CHUNK_SIZE}`)
    console.log(`📍 Chunk Overlap: ${CHUNK_OVERLAP}\n`)

    // Parse sitemap
    const urls = await parseSitemap()

    // Filter to only process docs and blog pages (optional)
    const filteredUrls = urls.filter(
        (url) =>
            url.includes('/docs/') ||
            url.includes('/blog/') ||
            url === `${DOMAIN}/` ||
            url === `${DOMAIN}/how-it-works` ||
            url === `${DOMAIN}/pricing`
    )

    console.log(`📝 Processing ${filteredUrls.length} filtered URLs (${urls.length - filteredUrls.length} skipped)\n`)

    // Process URLs sequentially with delay to avoid rate limiting
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < filteredUrls.length; i++) {
        const url = filteredUrls[i]
        console.log(`\n[${i + 1}/${filteredUrls.length}] Processing: ${url}`)

        try {
            await processUrl(url)
            successCount++
        } catch (error) {
            failureCount++
        }

        // Add delay between requests to avoid overwhelming the server
        if (i < filteredUrls.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('✨ Documentation sync completed!')
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failed: ${failureCount}`)
    console.log(`📊 Total: ${filteredUrls.length}`)
    console.log('='.repeat(80))
}

// Execute
main().catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
})
