import { supabase } from '../config/db.js'
import fetch from 'node-fetch'
import { API_CALL_TIMEOUT } from '../config/db.js'

/**
 * Perform vector search for a given query
 */
const performVectorSearch = async (query, token, storeId) => {
    try {
        console.log('Performing vector search with:', { storeId, query })

        if (!token) {
            throw new Error('Authorization token is required')
        }

        if (!storeId) {
            throw new Error('Store ID is required')
        }

        const response = await fetch(`${process.env.ANSWERAI_ENDPOINT}/document-store/vectorstore/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                storeId: storeId,
                query: query,
                topK: 10 // Ensure we get enough results
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Vector search API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            })
            throw new Error(`Vector search failed: ${response.status} ${response.statusText}`)
        }

        const results = await response.json()

        // Handle the new response format
        if (!results || typeof results !== 'object') {
            console.error('Invalid vector search response:', results)
            throw new Error('Vector search returned invalid results format')
        }

        // Extract docs from the response
        const docs = results.docs || []
        if (!Array.isArray(docs)) {
            console.error('Invalid docs format in response:', docs)
            throw new Error('Vector search returned invalid docs format')
        }

        // Transform the docs into the expected format
        const transformedResults = docs.map((doc) => ({
            title: doc.metadata?.title || 'Untitled',
            content: doc.pageContent || '',
            score: doc.metadata?.score || 0,
            metadata: {
                ...doc.metadata,
                id: doc.metadata?.documentId || doc.id, // Try to get the correct document ID
                chunkNo: doc.metadata?.chunkNo || doc.chunkNo
            }
        }))

        console.log(
            `Vector search returned ${transformedResults.length} results with IDs:`,
            transformedResults.map((r) => r.metadata?.id).filter(Boolean)
        )
        return transformedResults
    } catch (error) {
        console.error('Vector search error:', error)
        throw error
    }
}

/**
 * Generate a new report for a research view
 */
export const generateReport = async (req, res) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Ensure we have the necessary environment variables
        if (!process.env.ANSWERAI_ENDPOINT || !process.env.ANSWERAI_TOKEN || !process.env.ANSWERAI_ANALYSIS_CHATFLOW) {
            throw new Error('Missing required environment variables')
        }

        const { viewId } = req.params
        const { id, name, customPrompt, report_config, promptVariations = [], status = 'generating' } = req.body

        // Fetch the research view to get the document store ID
        const { data: researchView, error: viewError } = await supabase.from('research_views').select('*').eq('id', viewId).single()

        if (viewError || !researchView) {
            throw new Error(`Error fetching research view: ${viewError?.message || 'Research view not found'}`)
        }

        if (!researchView.answerai_store_id) {
            throw new Error('Research view does not have a document store ID')
        }

        // If we're just creating/updating a configuring report
        if (status === 'configuring') {
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .insert({
                    research_view_id: viewId,
                    name: name,
                    status: 'configuring',
                    custom_prompt: customPrompt,
                    prompt_variations: promptVariations,
                    report_config: report_config || [],
                    content: null,
                    documents_analyzed: null,
                    version: 1
                })
                .select()
                .single()

            if (reportError) {
                throw new Error(`Error creating report: ${reportError.message}`)
            }

            return res.json({
                success: true,
                data: report
            })
        }

        // If we're updating an existing report
        if (id) {
            const { data: existingReport, error: getError } = await supabase.from('reports').select('*').eq('id', id).single()

            if (getError || !existingReport) {
                throw new Error(`Error fetching existing report: ${getError?.message || 'Report not found'}`)
            }
        }

        // First, perform vector search for each section to collect relevant documents
        const vectorSearchResults = []
        const sectionAnalyses = []

        if (!report_config || !Array.isArray(report_config)) {
            throw new Error('Invalid report configuration')
        }

        // Process each section
        for (const section of report_config) {
            try {
                console.log(`Processing section: ${section.title}`)

                if (!section.focus_areas || !Array.isArray(section.focus_areas)) {
                    console.warn(`Section ${section.title} has invalid focus_areas, using empty array`)
                    section.focus_areas = []
                }

                const searchQuery = `${section.title}\n${section.description}\nFocus areas: ${section.focus_areas.join(', ')}`
                console.log(`Generated search query for section ${section.title}:`, searchQuery)

                const searchResults = await performVectorSearch(searchQuery, process.env.ANSWERAI_TOKEN, researchView.answerai_store_id)

                // Ensure searchResults is always an array
                const validatedResults = Array.isArray(searchResults) ? searchResults : []
                console.log(`Received ${validatedResults.length} results for section ${section.title}`)

                // Store vector search results for reference
                vectorSearchResults.push({
                    sectionId: section.id,
                    sectionTitle: section.title,
                    results: validatedResults
                })

                // Fetch full document content for each result
                const documentsWithFullContent = []
                for (const result of validatedResults) {
                    const documentId = result.metadata?.id
                    console.log(`Processing result with metadata:`, result.metadata)

                    if (!documentId) {
                        console.warn('No document ID found in result metadata:', result)
                        continue
                    }

                    console.log(`Fetching document with ID: ${documentId}`)
                    const { data: fullDocument, error: docError } = await supabase
                        .from('documents')
                        .select('*')
                        .eq('id', documentId)
                        .single()

                    if (docError) {
                        console.error(`Error fetching document ${documentId}:`, docError)
                        continue
                    }

                    if (!fullDocument) {
                        console.warn(`No document found with ID ${documentId}`)
                        continue
                    }

                    console.log(`Successfully fetched document ${documentId}: ${fullDocument.title}`)
                    documentsWithFullContent.push({
                        id: documentId,
                        title: result.title || fullDocument.title || 'Untitled',
                        content: fullDocument.content,
                        score: result.score,
                        metadata: {
                            ...result.metadata,
                            ...fullDocument.metadata
                        }
                    })
                }

                // Log the documents we found
                console.log(
                    `Found ${documentsWithFullContent.length} documents for section ${section.title}:`,
                    documentsWithFullContent.map((d) => ({ id: d.id, title: d.title }))
                )

                // Only proceed with analysis if we have documents
                if (documentsWithFullContent.length === 0) {
                    console.warn(`No documents found for section ${section.title}`)
                    sectionAnalyses.push({
                        sectionId: section.id,
                        sectionTitle: section.title,
                        analysis:
                            'No relevant documents were found for this section. This could indicate either a gap in the available documentation or that the search criteria need to be adjusted.',
                        documents: []
                    })
                    continue
                }

                // Generate section-specific analysis
                const sectionAnalysisPrompt = `
You are an expert research analyst. Your task is to analyze the provided documents and generate a detailed analysis for the following section:

Section: ${section.title}
Description: ${section.description}
Focus Areas: ${section.focus_areas.join(', ')}

Below are the relevant documents for analysis:

${documentsWithFullContent
    .map(
        (doc, index) => `
Document ${index + 1}: ${doc.title}
Relevance Score: ${(doc.score * 100).toFixed(1)}%
Content:
${doc.content}
---
`
    )
    .join('\n')}

Please provide:
1. A detailed analysis of how each document relates to the section topic
2. Key findings and insights specific to this section
3. Supporting evidence and quotes from the documents
4. How the documents address the focus areas
5. Any gaps or areas needing further research

Format your response in markdown with proper headings and structure.`.trim()

                // Create a separate AbortController for the section analysis
                const sectionController = new AbortController()
                const sectionTimeoutId = setTimeout(() => sectionController.abort(), API_CALL_TIMEOUT)

                try {
                    const sectionAiResponse = await fetch(
                        `${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
                            },
                            body: JSON.stringify({
                                question: sectionAnalysisPrompt,
                                overrideConfig: {
                                    systemMessagePrompt: sectionAnalysisPrompt,
                                    exampleJson: 'z.object({analysis:z.string()})'
                                }
                            }),
                            signal: sectionController.signal
                        }
                    )

                    if (!sectionAiResponse.ok) {
                        throw new Error(`Section analysis API returned ${sectionAiResponse.status}`)
                    }

                    const sectionAiResult = await sectionAiResponse.json()
                    let sectionAnalysis

                    if (sectionAiResult.json) {
                        sectionAnalysis = sectionAiResult.json.analysis
                    } else if (sectionAiResult.text) {
                        sectionAnalysis = sectionAiResult.text
                    } else {
                        throw new Error('Invalid section analysis response format')
                    }

                    sectionAnalyses.push({
                        sectionId: section.id,
                        sectionTitle: section.title,
                        analysis: sectionAnalysis,
                        documents: documentsWithFullContent.map((doc) => ({
                            id: doc.id,
                            title: doc.title,
                            content: doc.content,
                            similarity_score: doc.score,
                            metadata: doc.metadata
                        }))
                    })
                } finally {
                    clearTimeout(sectionTimeoutId)
                }
            } catch (searchError) {
                console.error(`Error processing section ${section.title}:`, searchError)
                sectionAnalyses.push({
                    sectionId: section.id,
                    sectionTitle: section.title,
                    error: searchError.message,
                    analysis: null,
                    documents: []
                })
            }
        }

        // Create final report combining all section analyses
        const finalReportPrompt = `
You are an expert research analyst. Your task is to create a comprehensive final report based on the following section analyses.

${customPrompt}

Section Analyses:
${sectionAnalyses
    .map(
        (section) => `
# ${section.sectionTitle}

${section.analysis || 'No analysis available for this section'}
`
    )
    .join('\n\n')}

Create a comprehensive final report that:
1. Begins with an executive summary
2. Integrates all section analyses coherently
3. Identifies cross-section patterns and insights
4. Provides actionable recommendations
5. Maintains proper citation of sources
6. Uses clear markdown formatting with proper headings and structure

The report should be well-structured and professional. It should be between 1000 and 2000 words.`.trim()

        // Create a separate AbortController for the final AI API call
        const aiController = new AbortController()
        const aiTimeoutId = setTimeout(() => aiController.abort(), API_CALL_TIMEOUT)

        try {
            const aiResponse = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
                },
                body: JSON.stringify({
                    question: finalReportPrompt,
                    overrideConfig: {
                        systemMessagePrompt: finalReportPrompt,
                        exampleJson: 'z.object({markdown:z.string()})'
                    }
                }),
                signal: aiController.signal
            })

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text()
                throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`)
            }

            const aiResult = await aiResponse.json()
            let finalReport

            if (aiResult.json) {
                finalReport = aiResult.json.markdown
            } else if (aiResult.text) {
                finalReport = aiResult.text
            } else {
                throw new Error('Invalid response format from AI')
            }

            // Update the report with the generated content and analyses
            const { data: report, error: reportError } = await supabase
                .from('reports')
                .upsert({
                    id: id,
                    research_view_id: viewId,
                    name: name,
                    status: 'completed',
                    custom_prompt: customPrompt,
                    prompt_variations: promptVariations,
                    report_config: report_config,
                    content: finalReport,
                    documents_analyzed: sectionAnalyses,
                    vector_search_results: vectorSearchResults,
                    completed_at: new Date().toISOString(),
                    version: 1
                })
                .select()
                .single()

            if (reportError) {
                throw new Error(`Error updating report: ${reportError.message}`)
            }

            res.json({
                success: true,
                data: {
                    ...report,
                    content: finalReport,
                    status: 'completed',
                    vector_search_results: vectorSearchResults
                }
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`AI request timed out after ${API_CALL_TIMEOUT / 1000} seconds`)
            }
            throw error
        } finally {
            clearTimeout(aiTimeoutId)
        }
    } catch (error) {
        console.error('Report generation error:', error)
        if (error.name === 'AbortError') {
            res.status(504).json({
                error: 'Report generation timed out',
                details: 'The operation took too long to complete'
            })
        } else {
            res.status(500).json({
                error: 'Failed to generate report',
                details: error.message
            })
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

/**
 * Get all reports for a research view
 */
export const getReportsByResearchView = async (req, res) => {
    try {
        const { viewId } = req.params

        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('research_view_id', viewId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        res.json({
            success: true,
            data: reports
        })
    } catch (error) {
        console.error('Error in getReportsByResearchView:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Get a specific report by ID
 */
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params

        const { data: report, error } = await supabase.from('reports').select('*').eq('id', id).single()

        if (error) {
            throw error
        }

        if (!report) {
            return res.status(404).json({ error: 'Report not found' })
        }

        res.json({
            success: true,
            data: report
        })
    } catch (error) {
        console.error('Error in getReportById:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Update a report
 */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params
        const { name, customPrompt, status, report_config } = req.body

        // Get the existing report
        const { data: existingReport, error: getError } = await supabase.from('reports').select('*').eq('id', id).single()

        if (getError || !existingReport) {
            throw new Error(`Error fetching existing report: ${getError?.message || 'Report not found'}`)
        }

        // Update the report
        const { data: report, error: updateError } = await supabase
            .from('reports')
            .update({
                name: name || existingReport.name,
                custom_prompt: customPrompt || existingReport.custom_prompt,
                status: status || existingReport.status,
                report_config: report_config !== undefined ? report_config : existingReport.report_config,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            throw new Error(`Error updating report: ${updateError.message}`)
        }

        res.json({
            success: true,
            data: report
        })
    } catch (error) {
        console.error('Error in updateReport:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

/**
 * Delete a report
 */
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params

        const { error } = await supabase.from('reports').delete().eq('id', id)

        if (error) {
            throw error
        }

        res.json({
            success: true,
            message: 'Report deleted successfully'
        })
    } catch (error) {
        console.error('Error in deleteReport:', error)
        res.status(500).json({ error: error.message })
    }
}

/**
 * Analyze a prompt and generate variations
 */
export const analyzePrompt = async (req, res) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CALL_TIMEOUT)

    try {
        // Ensure we have the necessary environment variables
        if (!process.env.ANSWERAI_ENDPOINT || !process.env.ANSWERAI_TOKEN || !process.env.ANSWERAI_ANALYSIS_CHATFLOW) {
            throw new Error('ANSWERAI_ENDPOINT, ANSWERAI_TOKEN, and ANSWERAI_ANALYSIS_CHATFLOW environment variables are required')
        }

        const { prompt } = req.body

        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided for analysis' })
        }

        const systemPrompt = `
You are an expert research analyst. Your task is to analyze the given prompt and generate 4 variations that explore different aspects or phrasings of the original prompt. Each variation should maintain the core intent but approach it from a different angle or with different emphasis.

Original Prompt: "${prompt}"

Generate 4 variations that:
1. Maintain the core research objective
2. Explore different aspects or perspectives
3. Use different phrasing or terminology
4. Add specificity or focus on particular elements

For each variation, provide:
- The variation text
- A brief explanation of how this variation differs from the original

Return ONLY a JSON array of objects
`.trim()

        try {
            const aiResponse = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.ANSWERAI_TOKEN}`
                },
                body: JSON.stringify({
                    question: 'Generate 4 variations of the prompt',
                    overrideConfig: {
                        systemMessagePrompt: systemPrompt,
                        exampleJson: 'z.array(z.object({text:z.string(),focus:z.string()}))'
                    }
                })
            })

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text()
                throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`)
            }

            const aiResult = await aiResponse.json()
            let variations
            console.log(aiResult)

            try {
                if (aiResult.json) {
                    variations = aiResult.json
                } else if (aiResult.text) {
                    const rawReply = aiResult.text.trim()
                    try {
                        variations = JSON.parse(rawReply)
                    } catch (e) {
                        // Try to extract JSON from markdown code blocks
                        const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                        if (jsonMatch) {
                            variations = JSON.parse(jsonMatch[1].trim())
                        } else {
                            throw new Error('Could not parse JSON from response')
                        }
                    }
                } else {
                    throw new Error('Invalid response format from AI')
                }

                // Ensure variations is an array
                if (!Array.isArray(variations)) {
                    throw new Error('AI response did not return an array of variations')
                }

                // Validate each variation has the required fields
                variations.forEach((variation, index) => {
                    if (!variation.text || !variation.focus) {
                        throw new Error(`Variation ${index + 1} is missing required fields`)
                    }
                })

                res.json({
                    success: true,
                    data: {
                        variations: variations
                    }
                })
            } catch (error) {
                console.error('Error processing AI response:', error)
                throw new Error(`Failed to process AI response: ${error.message}`)
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`AI request timed out after ${API_CALL_TIMEOUT / 1000} seconds`)
            }
            throw error
        }
    } catch (error) {
        console.error('Prompt analysis error:', error)
        if (error.name === 'AbortError') {
            res.status(504).json({
                error: 'Prompt analysis timed out',
                details: 'The operation took too long to complete'
            })
        } else {
            res.status(500).json({
                error: 'Failed to analyze prompt',
                details: error.message
            })
        }
    } finally {
        clearTimeout(timeoutId)
    }
}
