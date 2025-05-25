import { makeApiRequest } from '../services/answerAI/client.js'

/**
 * Analyze text using AnswerAI's flexible analysis endpoint
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
export const analyzeText = async (req, res) => {
    try {
        const { text, systemPrompt, schema, chatflow } = req.body

        if (!text) {
            return res.status(400).json({ error: 'Text is required' })
        }

        // Development mode - return mock response
        if (process.env.NODE_ENV === 'development' || !process.env.ANSWERAI_TOKEN) {
            console.log('Running in development mode - returning mock response')
            const messages = JSON.parse(text)
            const lastUserMessage = messages.reverse().find((m) => m.role === 'user')?.content || ''

            return res.json({
                suggested_response: `I understand your concern about "${lastUserMessage}". Let me help you with that. [This is a development mode response]`
            })
        }

        // Use default chatflow from env if not provided
        const targetChatflow = chatflow || process.env.ANSWERAI_ANALYSIS_CHATFLOW

        if (!targetChatflow) {
            return res.status(400).json({ error: 'Chatflow ID is required' })
        }

        console.log('targetChatflow', targetChatflow)

        // Validate schema is a string
        if (schema && typeof schema !== 'string') {
            return res.status(400).json({ error: 'Schema must be a zod schema string' })
        }

        console.log('schema', schema)

        // Call the AnswerAI endpoint
        const response = await makeApiRequest(`/prediction/${targetChatflow}`, 'POST', {
            question: text,
            overrideConfig: {
                systemMessagePrompt: systemPrompt,
                exampleJson: schema
            }
        })

        // Handle various response formats
        let parsedResult
        if (response.json) {
            parsedResult = typeof response.json === 'string' ? JSON.parse(response.json) : response.json
        } else if (response.text) {
            const rawReply = response.text.trim()
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
            parsedResult = response
        }

        res.json(parsedResult)
    } catch (error) {
        console.error('Error in analyzeText:', error)
        res.status(500).json({ error: error.message })
    }
}
