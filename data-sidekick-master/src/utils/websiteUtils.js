import fetch from 'node-fetch'
import { supabase } from '../config/db.js'
import { JSDOM } from 'jsdom'
import { processDocument } from './documentProcessor.js'
import { processTextDocument, upsertTextDocument } from '../services/answerAI/documentProcessor.js'

/**
 * Fetch content from a website data source
 * @param {Object} dataSource The data source object
 * @param {boolean} isRefresh Whether this is a refresh operation
 */
export const fetchWebsiteContent = async (dataSource, isRefresh = false) => {
    try {
        console.log(`Fetching website content for source: ${dataSource.url}`)

        // Update status to fetching
        await supabase
            .from('data_sources')
            .update({
                status: 'fetching',
                updated_at: new Date().toISOString()
            })
            .eq('id', dataSource.id)

        // If this is a refresh, we'll first clear existing documents for this source
        if (isRefresh) {
            console.log(`Refresh requested. Removing existing documents for source ${dataSource.id}`)
            const { error: deleteError } = await supabase.from('documents').delete().eq('source_id', dataSource.id)

            if (deleteError) {
                console.error(`Error deleting existing documents: ${deleteError.message}`)
                throw new Error(`Failed to delete existing documents: ${deleteError.message}`)
            }
        }

        // Start with the main URL as our first page to process
        const urlsToProcess = [dataSource.url]
        const processedUrls = new Set()
        const documentPromises = []

        // Process up to 50 pages per website to avoid too much load
        // This limit can be adjusted based on requirements
        const MAX_PAGES = 50

        while (urlsToProcess.length > 0 && processedUrls.size < MAX_PAGES) {
            const currentUrl = urlsToProcess.shift()

            // Skip if already processed
            if (processedUrls.has(currentUrl)) {
                continue
            }

            processedUrls.add(currentUrl)

            try {
                // Fetch the page
                const response = await fetch(currentUrl, {
                    headers: {
                        'User-Agent': 'Data-Sidekick-Research-Tool/1.0'
                    }
                })

                if (!response.ok) {
                    console.error(`Error fetching ${currentUrl}: ${response.status} ${response.statusText}`)
                    continue
                }

                // Get content type to verify it's HTML
                const contentType = response.headers.get('content-type') || ''
                if (!contentType.includes('text/html')) {
                    console.log(`Skipping non-HTML content at ${currentUrl}: ${contentType}`)
                    continue
                }

                const html = await response.text()

                // Parse the HTML
                const dom = new JSDOM(html)
                const document = dom.window.document

                // Extract metadata
                const title = document.querySelector('title')?.textContent || ''
                const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''

                // Try to extract publication date from meta tags
                let publicationDate = null
                const datePublished = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content')
                if (datePublished) {
                    publicationDate = new Date(datePublished).toISOString()
                }

                // Extract author
                const author = document.querySelector('meta[name="author"]')?.getAttribute('content') || ''

                // Extract the main content (simplified - a real implementation would be more robust)
                // Remove script, style, and nav elements that could contain noise
                const scripts = document.querySelectorAll(
                    'script, style, nav, header, footer, iframe, [role="banner"], [role="navigation"]'
                )

                // Use for...of instead of forEach
                for (const script of scripts) {
                    script.remove()
                }

                // Get text content from the body or article tag
                const articleContent = document.querySelector('article') || document.querySelector('main') || document.body
                const content = articleContent?.textContent || ''

                // Clean up content - remove excessive whitespace
                const cleanContent = content.replace(/\s+/g, ' ').trim()

                // Count words
                const wordCount = cleanContent.split(/\s+/).length

                // Filter by date if criteria specified
                if (dataSource.filter_date_start || dataSource.filter_date_end) {
                    if (publicationDate) {
                        const pubDate = new Date(publicationDate)

                        if (dataSource.filter_date_start) {
                            const startDate = new Date(dataSource.filter_date_start)
                            if (pubDate < startDate) {
                                console.log(`Skipping ${currentUrl} - publication date ${pubDate} is before filter start date ${startDate}`)
                                continue
                            }
                        }

                        if (dataSource.filter_date_end) {
                            const endDate = new Date(dataSource.filter_date_end)
                            if (pubDate > endDate) {
                                console.log(`Skipping ${currentUrl} - publication date ${pubDate} is after filter end date ${endDate}`)
                                continue
                            }
                        }
                    }
                }

                // Filter by path if criteria specified
                if (dataSource.filter_paths && dataSource.filter_paths.length > 0) {
                    const urlPath = new URL(currentUrl).pathname
                    const pathMatches = dataSource.filter_paths.some((path) => urlPath.startsWith(path) || urlPath === path)

                    if (!pathMatches) {
                        console.log(`Skipping ${currentUrl} - path ${urlPath} doesn't match filter paths`)
                        continue
                    }
                }

                // Create a document record
                const documentData = {
                    source_id: dataSource.id,
                    title,
                    url: currentUrl,
                    author,
                    publication_date: publicationDate,
                    content: cleanContent,
                    content_summary: metaDescription.substring(0, 200),
                    word_count: wordCount,
                    token_count: Math.ceil(wordCount * 1.3), // Rough estimate of tokens
                    file_type: 'html'
                }

                // Insert document to database
                const documentPromise = supabase
                    .from('documents')
                    .insert(documentData)
                    .select()
                    .single()
                    .then(({ data: document, error }) => {
                        if (error) {
                            console.error(`Error inserting document for ${currentUrl}:`, error)
                            return null
                        }

                        // Process document for AI analysis
                        return processDocument(document).then(async (processedDoc) => {
                            // Get the answerai_store_id from the research view
                            try {
                                // First, get the research_view_id from the data source
                                const researchViewId = dataSource.research_view_id

                                if (researchViewId) {
                                    // Query the research view to get the answerai_store_id
                                    const { data: researchView, error } = await supabase
                                        .from('research_views')
                                        .select('answerai_store_id')
                                        .eq('id', researchViewId)
                                        .single()

                                    if (error) {
                                        console.error('Error fetching research view:', error)
                                        return processedDoc
                                    }

                                    // Process with AnswerAI if the research view has a store ID
                                    if (researchView?.answerai_store_id) {
                                        try {
                                            console.log(`Processing document with AnswerAI for research view ${researchViewId}`)
                                            console.log(`Using store ID: ${researchView.answerai_store_id}`)

                                            // Prepare metadata from the document
                                            const metadata = {
                                                title: processedDoc.title,
                                                author: processedDoc.author || '',
                                                url: processedDoc.url,
                                                publication_date: processedDoc.publication_date || '',
                                                content_summary: processedDoc.content_summary || '',
                                                word_count: processedDoc.word_count,
                                                token_count: processedDoc.token_count,
                                                file_type: processedDoc.file_type || 'html'
                                            }

                                            // Process with AnswerAI passing metadata and URL as loaderName
                                            const storeId = researchView.answerai_store_id

                                            // Add storeId to metadata for better filtering
                                            const enhancedMetadata = {
                                                ...metadata,
                                                storeId // Add storeId to metadata for filtering
                                            }

                                            // Use the new upsert method instead of the process method
                                            const answerAIResult = await upsertTextDocument(
                                                storeId,
                                                processedDoc.content,
                                                {
                                                    ...enhancedMetadata,
                                                    documentId: processedDoc.id, // Include our document ID in metadata
                                                    url: processedDoc.url, // Make sure URL is included explicitly
                                                    source: 'website_content' // Mark source type
                                                },
                                                null, // Don't pass docId anymore
                                                true // Replace existing document if it exists
                                            )

                                            console.log(`AnswerAI processing result for document ${processedDoc.id}:`, {
                                                documentId: processedDoc.id,
                                                numAdded: answerAIResult.numAdded || 0,
                                                numUpdated: answerAIResult.numUpdated || 0,
                                                numSkipped: answerAIResult.numSkipped || 0
                                            })
                                        } catch (answerAIError) {
                                            console.error(`Error processing document with AnswerAI: ${answerAIError.message}`)
                                        }
                                    } else {
                                        console.log('Skipping AnswerAI processing - no store ID in research view:', researchViewId)
                                    }
                                } else {
                                    console.log('Skipping AnswerAI processing - data source not connected to a research view')
                                }
                            } catch (error) {
                                console.error('Error checking for research view store ID:', error)
                            }

                            return processedDoc
                        })
                    })
                    .catch((error) => {
                        console.error(`Error processing document for ${currentUrl}:`, error)
                    })

                documentPromises.push(documentPromise)

                // Find links to other pages on the same domain
                if (processedUrls.size < MAX_PAGES) {
                    const baseUrl = new URL(currentUrl).origin
                    const links = document.querySelectorAll('a[href]')

                    for (const link of links) {
                        try {
                            const href = link.getAttribute('href')
                            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
                                continue
                            }

                            // Resolve relative URLs
                            const resolvedUrl = new URL(href, currentUrl).href

                            // Only include links to the same domain
                            if (
                                resolvedUrl.startsWith(baseUrl) &&
                                !processedUrls.has(resolvedUrl) &&
                                !urlsToProcess.includes(resolvedUrl)
                            ) {
                                // Apply path filters if specified
                                if (dataSource.filter_paths && dataSource.filter_paths.length > 0) {
                                    const urlPath = new URL(resolvedUrl).pathname
                                    const pathMatches = dataSource.filter_paths.some((path) => urlPath.startsWith(path) || urlPath === path)

                                    if (pathMatches) {
                                        urlsToProcess.push(resolvedUrl)
                                    }
                                } else {
                                    urlsToProcess.push(resolvedUrl)
                                }
                            }
                        } catch (linkError) {
                            console.error(`Error processing link: ${linkError.message}`)
                        }
                    }
                }
            } catch (pageError) {
                console.error(`Error processing page ${currentUrl}:`, pageError)
            }
        }

        // Wait for all document insertions and processing to complete
        await Promise.all(documentPromises)

        // Update data source status to completed
        await supabase
            .from('data_sources')
            .update({
                status: 'completed',
                last_fetched_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', dataSource.id)

        console.log(`Completed fetching website ${dataSource.url}. Processed ${processedUrls.size} pages.`)
        return processedUrls.size
    } catch (error) {
        console.error('Error in fetchWebsiteContent:', error)

        // Update data source status to error
        await supabase
            .from('data_sources')
            .update({
                status: 'error',
                error_message: error.message,
                updated_at: new Date().toISOString()
            })
            .eq('id', dataSource.id)

        throw error
    }
}
