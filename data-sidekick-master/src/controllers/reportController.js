import { supabase, API_CALL_TIMEOUT, REPORT_GENERATION_TIMEOUT } from '../config/db.js'
import fetch from 'node-fetch'

export const generateReport = async (req, res) => {
    // Create an AbortController for the entire request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REPORT_GENERATION_TIMEOUT)

    try {
        const { calls, customPrompt, name } = req.body

        if (!calls || !Array.isArray(calls) || calls.length === 0) {
            return res.status(400).json({ error: 'No calls provided for report generation' })
        }

        // Prepare the data for the AI analysis
        const callSummaries = calls.map((call) => ({
            summary: call?.summary || 'No summary available',
            coaching: call?.coaching || 'No coaching points available',
            sentiment: call?.sentiment_score,
            resolution: call?.resolution_status,
            escalated: call?.escalated,
            duration: call?.CALL_DURATION,
            type: call?.CALL_TYPE,
            tags: call.TAGS_ARRAY || [],
            recording_url: call.RECORDING_URL,
            employee_name: call.EMPLOYEE_NAME,
            caller_name: call.CALLER_NAME,
            persona: call.persona,
            employee_id: call.EMPLOYEE_ID,
            filename: call.FILENAME,
            call_number: call.CALL_NUMBER,
            call_type: call.CALL_TYPE,
            call_duration: call.CALL_DURATION
        }))

        const prompt = `
You are an expert call center analyst. Your task is to analyze the provided call data and generate a comprehensive report.

${customPrompt ? `Analysis Focus: ${customPrompt}\n` : ''}

Call Data:
${JSON.stringify(callSummaries, null, 2)}

First, analyze the custom prompt and call data to determine the most relevant sections for this report. Then, create a detailed report that addresses the specific analysis requirements while maintaining a professional structure.

The report should naturally flow from high-level insights to specific details and recommendations. When referencing specific calls, always use the format "In the call Agent Name - Customer Name...".

Your response must be a JSON object with exactly these two fields:
{
  "summary": "A descriptive title that reflects the main insights or focus of the report",
  "markdown": "The complete report content in markdown format"
}

The markdown field should be well-structured with proper headings, bullet points, and formatting. Include an executive summary at the start and actionable recommendations where appropriate.

Return ONLY the JSON object with these two fields.`.trim()

        // Create a separate AbortController for the AI API call
        const aiController = new AbortController()
        const aiTimeoutId = setTimeout(() => aiController.abort(), API_CALL_TIMEOUT)

        try {
            const aiResponse = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_REPORT_CHATFLOW}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: prompt
                }),
                signal: aiController.signal
            })

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text()
                throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`)
            }

            const aiResult = await aiResponse.json()
            let reportData

            try {
                if (aiResult.json) {
                    reportData = aiResult.json
                } else if (aiResult.text) {
                    const rawReply = aiResult.text.trim()
                    try {
                        reportData = JSON.parse(rawReply)
                    } catch (e) {
                        const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                        if (jsonMatch) {
                            reportData = JSON.parse(jsonMatch[1].trim())
                        } else {
                            throw new Error('Could not parse JSON from AI response')
                        }
                    }
                } else {
                    throw new Error('Invalid response format from AI')
                }

                // Log the response for debugging
                console.log('AI Response:', JSON.stringify(reportData, null, 2))

                if (!reportData || typeof reportData !== 'object') {
                    throw new Error('AI response is not a valid object')
                }

                // Check for either markdown or content field
                const reportContent = reportData.markdown || reportData.content
                if (!reportData.summary || !reportContent) {
                    console.error('Missing fields in AI response:', reportData)
                    throw new Error(`AI response missing required fields. Got: ${Object.keys(reportData).join(', ')}`)
                }

                // Save the report to Supabase
                const { data: report, error: supabaseError } = await supabase
                    .from('reports')
                    .insert({
                        name,
                        content: reportContent,
                        status: 'completed',
                        custom_prompt: customPrompt,
                        original_prompt: prompt,
                        documents_analyzed: calls.map((call) => ({
                            documentId: call.RECORDING_URL,
                            type: 'call_log',
                            data: {
                                resolution_status: call.resolution_status,
                                summary: call.analysis?.summary || 'No summary available',
                                EMPLOYEE_NAME: call.EMPLOYEE_NAME,
                                EMPLOYEE_ID: call.EMPLOYEE_ID,
                                TAGS_ARRAY: call.TAGS_ARRAY || [],
                                TAGS: call.TAGS || '',
                                persona: call.persona,
                                sentiment_score: call.sentiment_score,
                                ANSWERED_BY: call.ANSWERED_BY,
                                escalated: call.escalated,
                                CALLER_NAME: call.CALLER_NAME,
                                coaching: call.analysis?.coaching || 'No coaching points available',
                                FILENAME: call.FILENAME,
                                CALL_TYPE: call.CALL_TYPE,
                                CALL_DURATION: call.CALL_DURATION,
                                CALL_NUMBER: call.CALL_NUMBER
                            }
                        })),
                        research_view_id: null,
                        version: 1
                    })
                    .select()
                    .single()

                if (supabaseError) {
                    console.error('Supabase error:', supabaseError)
                    throw new Error('Failed to save report to database')
                }

                if (!report) {
                    throw new Error('No report data returned from database')
                }

                // Send the successful response back to the client
                res.json({
                    id: report.id,
                    name: report.name,
                    content: report.content
                })
            } catch (error) {
                console.error('Error processing AI response:', error)
                throw new Error(`Failed to process AI response: ${error.message}`)
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('AI request timed out after ' + API_CALL_TIMEOUT / 1000 + ' seconds')
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
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        }
    } finally {
        clearTimeout(timeoutId)
    }
}

export const getAllReports = async (req, res) => {
    try {
        const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })

        if (error) throw error
        res.json({ data })
    } catch (error) {
        console.error('Error fetching reports:', error)
        res.status(500).json({ error: error.message })
    }
}

export const getReportById = async (req, res) => {
    try {
        const { data, error } = await supabase.from('reports').select('*').eq('id', req.params.id).single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Report not found' })
        }

        res.json({ data })
    } catch (error) {
        console.error('Error fetching report:', error)
        res.status(500).json({ error: error.message })
    }
}

export const updateReport = async (req, res) => {
    try {
        const { name, content } = req.body
        if (!name && !content) {
            return res.status(400).json({ error: 'Report name or content is required' })
        }

        const updateData = {}
        if (name) updateData.name = name
        if (content) updateData.content = content

        const { data, error } = await supabase.from('reports').update(updateData).eq('id', req.params.id).select().single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Report not found' })
        }

        res.json({ data })
    } catch (error) {
        console.error('Error updating report:', error)
        res.status(500).json({ error: error.message })
    }
}

export const deleteReport = async (req, res) => {
    try {
        const { error } = await supabase.from('reports').delete().eq('id', req.params.id)

        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        console.error('Error deleting report:', error)
        res.status(500).json({ error: error.message })
    }
}
