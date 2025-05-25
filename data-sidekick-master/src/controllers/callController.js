import { supabase, twilioClient, API_CALL_TIMEOUT } from '../config/db.js'
import fetch from 'node-fetch'
import DATABASE_TABLES, { DATABASE_COLUMNS } from '../config/database.js'

export const createOutboundCall = async (req, res) => {
    try {
        // In development, return mock response if Twilio is not initialized
        if (!twilioClient) {
            return res.status(200).json({
                callSid: `MOCK_CALL_${Date.now()}`,
                message: 'Mock call created (development mode)'
            })
        }

        const { to } = req.body
        const WSS_URL = `wss://${process.env.NGROK_DOMAIN}/media-stream`

        const call = await twilioClient.calls.create({
            to,
            from: process.env.TWILIO_PHONE_NUMBER,
            twiml: `
                <Response>
                    <Connect>
                        <Stream url="${WSS_URL}" />
                    </Connect>
                </Response>
            `
        })

        res.status(200).json({ callSid: call.sid })
    } catch (error) {
        console.error('Error creating outbound call:', error)
        res.status(500).json({ error: error.message })
    }
}

export const getCalls = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page) || 0
        const pageSize = Number.parseInt(req.query.pageSize) || 10
        const employeeId = req.query.employeeId
        const searchTerm = req.query.searchTerm?.toLowerCase()
        const callType = req.query.callType
        const unprocessedOnly = req.query.unprocessedOnly === 'true'
        const selectedTags = req.query.tags && req.query.tags !== 'undefined' ? JSON.parse(req.query.tags) : []
        const sentimentMin = Number.parseInt(req.query.sentimentMin) || 1
        const sentimentMax = Number.parseInt(req.query.sentimentMax) || 10
        const resolutionStatus = req.query.resolutionStatus
        const escalated = req.query.escalated
        const recordingUrls =
            req.query.recording_urls && req.query.recording_urls !== 'undefined'
                ? typeof req.query.recording_urls === 'string'
                    ? JSON.parse(req.query.recording_urls)
                    : req.query.recording_urls
                : null

        let query = supabase.from('call_log').select('*', { count: 'exact' })

        // If we have recording URLs, filter by those instead of other filters
        if (recordingUrls && Array.isArray(recordingUrls)) {
            query = query.in('RECORDING_URL', recordingUrls)
        } else {
            if (employeeId) {
                query = query.eq('EMPLOYEE_ID', employeeId)
            }

            if (searchTerm) {
                query = query.or(
                    `TRANSCRIPTION.ilike.%${searchTerm}%,CALLER_NAME.ilike.%${searchTerm}%,EMPLOYEE_NAME.ilike.%${searchTerm}%`
                )
            }

            if (callType && callType !== 'all') {
                query = query.eq('CALL_TYPE', callType)
            }

            if (unprocessedOnly) {
                query = query.or('TAGS_ARRAY.is.null,TAGS_ARRAY.eq.{},CALL_TYPE.is.null,sentiment_score.is.null,resolution_status.is.null')
            }

            if (selectedTags && selectedTags.length > 0) {
                query = query.contains('TAGS_ARRAY', selectedTags)
            }

            if (!unprocessedOnly) {
                // Only apply sentiment range filter when not looking for unprocessed calls
                query = query.gte('sentiment_score', sentimentMin).lte('sentiment_score', sentimentMax)
            }

            if (resolutionStatus && resolutionStatus !== 'all') {
                query = query.eq('resolution_status', resolutionStatus)
            }

            if (escalated && escalated !== 'all') {
                query = query.eq('escalated', escalated === 'true')
            }
        }

        const start = page * pageSize
        query = query.range(start, start + pageSize - 1).order('CALL_NUMBER', { ascending: false })

        const { data: calls, count, error } = await query
        if (error) throw error

        const callsWithIds = calls.map((call, index) => ({
            ...call,
            id: start + index
        }))

        res.json({
            calls: callsWithIds,
            total: count || 0,
            page,
            pageSize
        })
    } catch (error) {
        console.error('Error fetching calls:', error)
        res.status(500).json({ error: 'Failed to fetch calls' })
    }
}

export const getUntaggedCalls = async (req, res) => {
    try {
        const { data: calls, error } = await supabase
            .from('call_log')
            .select('*')
            .or(
                'TAGS_ARRAY.is.null,TAGS_ARRAY.eq.{},CALL_TYPE.is.null,sentiment_score.is.null,resolution_status.is.null,summary.is.null,coaching.is.null'
            )
            .order('CALL_NUMBER', { ascending: false })

        if (error) throw error

        res.json({
            calls,
            total: calls.length
        })
    } catch (error) {
        console.error('Error fetching unprocessed calls:', error)
        res.status(500).json({ error: 'Failed to fetch unprocessed calls' })
    }
}

export const analyzeCall = async (req, res) => {
    try {
        const { transcript, callId, reanalyze = false } = req.body

        if (!transcript) {
            return res.status(400).json({ error: 'No transcript provided' })
        }
        if (!callId) {
            return res.status(400).json({ error: 'No call ID provided' })
        }

        // Check if analysis exists and we're not forcing a reanalysis
        if (!reanalyze) {
            const { data: existingAnalysis, error: dbError } = await supabase
                .from('call_log')
                .select('summary, coaching, persona')
                .eq('RECORDING_URL', callId)
                .single()

            if (dbError) throw dbError

            if (existingAnalysis?.summary && existingAnalysis?.coaching) {
                return res.json(existingAnalysis)
            }
        }

        const aiResponse = await fetch(`${process.env.ANSWERAI_ENDPOINT}/prediction/${process.env.ANSWERAI_ANALYSIS_CHATFLOW}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: transcript
            }),
            signal: AbortSignal.timeout(API_CALL_TIMEOUT)
        })

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text()
            throw new Error(`AnswerAI returned status ${aiResponse.status}: ${errorText}`)
        }

        const result = await aiResponse.json()
        let parsed

        if (result.json) {
            parsed = result.json
        } else if (result.text) {
            const rawReply = result.text.trim()
            try {
                parsed = JSON.parse(rawReply)
            } catch (e) {
                const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[1].trim())
                } else {
                    throw new Error(`Could not parse JSON from AnswerAI response:\n${rawReply}`)
                }
            }
        } else {
            throw new Error('No JSON or text field returned from AnswerAI')
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure')
        }

        // Store the analysis in Supabase
        const { error: updateError } = await supabase
            .from('call_log')
            .update({
                summary: parsed.summary,
                coaching: parsed.coaching,
                TAGS_ARRAY: parsed.tags || [],
                TAGS: (parsed.tags || []).join(','),
                sentiment_score: parsed.sentiment_score,
                resolution_status: parsed.resolution_status,
                escalated: parsed.escalated,
                CALL_TYPE: parsed.call_type || 'unknown',
                persona: parsed.persona || null
            })
            .eq('RECORDING_URL', callId)

        if (updateError) throw updateError

        res.json(parsed)
    } catch (error) {
        console.error('Error analyzing call:', error)
        res.status(500).json({ error: 'Failed to analyze call', details: error.message })
    }
}

export const getCallById = async (req, res) => {
    try {
        const { id } = req.params

        const { data, error } = await supabase.from(DATABASE_TABLES.CALLS).select('*').eq(DATABASE_COLUMNS.CALLS.ID, id).single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Call not found' })
        }

        res.json({ data })
    } catch (error) {
        console.error('Error fetching call:', error)
        res.status(500).json({ error: error.message })
    }
}

export const getCallByRecordingUrl = async (req, res) => {
    try {
        const { url } = req.params

        const { data, error } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .select('*')
            .eq(DATABASE_COLUMNS.CALLS.RECORDING_URL, url)
            .single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Call not found' })
        }

        res.json({ data })
    } catch (error) {
        console.error('Error fetching call:', error)
        res.status(500).json({ error: error.message })
    }
}

export const clearCallAnalysis = async (req, res) => {
    try {
        const { callId } = req.body

        if (!callId) {
            return res.status(400).json({ error: 'No call ID provided' })
        }

        // First verify the call exists
        const { data: existingCall, error: checkError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .select('*')
            .eq('RECORDING_URL', callId)
            .single()

        if (checkError) throw checkError
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' })
        }

        // Update with empty arrays for array fields
        const { error: updateError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .update({
                TAGS_ARRAY: [],
                TAGS: '',
                CALL_TYPE: null,
                sentiment_score: null,
                resolution_status: null,
                escalated: null,
                summary: null,
                coaching: null
            })
            .eq('RECORDING_URL', callId)

        if (updateError) throw updateError

        // Verify the update was successful
        const { data: updatedCall, error: verifyError } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .select('*')
            .eq('RECORDING_URL', callId)
            .single()

        if (verifyError) throw verifyError

        res.json({
            message: 'Analysis cleared successfully',
            call: updatedCall
        })
    } catch (error) {
        console.error('Error clearing call analysis:', error)
        res.status(500).json({ error: 'Failed to clear analysis', details: error.message })
    }
}

export const getCallsByPhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.params

        // Format the phone number to ensure it has a + prefix
        // const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        const { data: calls, error } = await supabase
            .from(DATABASE_TABLES.CALLS)
            .select(
                `
                id,
                CALL_NUMBER,
                CALL_DURATION,
                EMPLOYEE_NAME,
                EMPLOYEE_ID,
                TAGS_ARRAY,
                persona,
                sentiment_score,
                ANSWERED_BY,
                escalated,
                CALLER_NAME,
                coaching,
                FILENAME,
                CALL_TYPE,
                RECORDING_URL,
                resolution_status,
                summary
            `
            )
            .eq(DATABASE_COLUMNS.CALLS.CALL_NUMBER, phoneNumber)
            .order('CALL_NUMBER', { ascending: false })

        if (error) throw error

        res.json({
            calls,
            total: calls.length
        })
    } catch (error) {
        console.error('Error fetching calls by phone number:', error)
        res.status(500).json({ error: error.message })
    }
}
