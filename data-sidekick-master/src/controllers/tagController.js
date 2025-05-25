import { supabase, API_CALL_TIMEOUT } from '../config/db.js'
import DATABASE_TABLES from '../config/database.js'
import fetch from 'node-fetch'

export const getAllTags = async (req, res) => {
    try {
        const { data: tags, error } = await supabase.from('tags').select('*').order('id', { ascending: true })

        if (error) throw error

        // Transform the flat tag list into a hierarchical structure
        const tagCategories = {}
        for (const tag of tags) {
            if (!tag.parent_id) {
                // This is a parent category
                tagCategories[tag.slug] = {
                    label: tag.label,
                    description: tag.description,
                    color: tag.color,
                    slug: tag.slug,
                    id: tag.id,
                    subcategories: {}
                }
            }
        }

        // Add subcategories
        for (const tag of tags) {
            if (tag.parent_id) {
                const parentTag = tags.find((t) => t.id === tag.parent_id)
                if (parentTag) {
                    tagCategories[parentTag.slug].subcategories[tag.slug] = {
                        label: tag.label,
                        description: tag.description,
                        slug: tag.slug,
                        color: tag.color,
                        id: tag.id
                    }
                }
            }
        }

        res.json(tagCategories)
    } catch (error) {
        console.error('Error fetching tags:', error)
        res.status(500).json({ error: 'Failed to fetch tags' })
    }
}

export const createTag = async (req, res) => {
    try {
        const { label, description, slug, color, parent_id, shade } = req.body

        console.log('Creating tag:', { label, slug, parent_id })

        // Check if slug exists
        const { data: existingTag, error: checkError } = await supabase.from('tags').select('id, slug').eq('slug', slug).maybeSingle()

        if (checkError) throw checkError

        if (existingTag) {
            return res.status(400).json({
                error: 'Failed to create tag',
                details: `Tag with slug "${slug}" already exists`
            })
        }

        // If this is a subcategory, verify the parent exists
        if (parent_id) {
            const { data: parentTag, error: parentError } = await supabase.from('tags').select('id').eq('id', parent_id).maybeSingle()

            if (parentError) throw parentError

            if (!parentTag) {
                return res.status(400).json({
                    error: 'Failed to create tag',
                    details: `Parent tag with id "${parent_id}" does not exist`
                })
            }
        }

        const { data, error } = await supabase
            .from('tags')
            .insert([
                {
                    label,
                    description,
                    slug,
                    color,
                    parent_id,
                    shade
                }
            ])
            .select()

        if (error) throw error
        res.json(data[0])
    } catch (error) {
        console.error('Error creating tag:', error)
        res.status(500).json({ error: 'Failed to create tag', details: error.message })
    }
}

export const updateTag = async (req, res) => {
    try {
        const { label, description, color, shade, slug, parent_id } = req.body
        const { id } = req.params

        console.log('Updating tag:', { id, label, slug })

        // Check if the tag exists
        const { data: existingTag, error: fetchError } = await supabase.from('tags').select('*').eq('id', id).single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Tag not found' })
            }
            throw fetchError
        }

        // If the slug is changing, ensure no other tag uses the new slug
        if (slug && slug !== existingTag.slug) {
            const { data: slugCheck, error: slugError } = await supabase
                .from('tags')
                .select('id')
                .eq('slug', slug)
                .neq('id', id)
                .maybeSingle()

            if (slugError) throw slugError

            if (slugCheck) {
                return res.status(400).json({
                    error: 'Failed to update tag',
                    details: `Tag with slug "${slug}" already exists`
                })
            }
        }

        // Build the update object with only the provided fields
        const updateData = {}
        if (label !== undefined) updateData.label = label
        if (description !== undefined) updateData.description = description
        if (color !== undefined) updateData.color = color
        if (shade !== undefined) updateData.shade = shade
        if (slug !== undefined) updateData.slug = slug
        if (parent_id !== undefined) updateData.parent_id = parent_id

        // Update the tag
        const { data: updatedTag, error: updateError } = await supabase.from('tags').update(updateData).eq('id', id).select()

        if (updateError) throw updateError

        res.json(updatedTag[0])
    } catch (error) {
        console.error('Error updating tag:', error)
        res.status(500).json({ error: 'Failed to update tag', details: error.message })
    }
}

export const deleteTag = async (req, res) => {
    try {
        const { id } = req.params

        // First check if the tag exists
        const { data: existingTag, error: fetchError } = await supabase.from('tags').select('*').eq('id', id).single()

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Tag not found' })
            }
            throw fetchError
        }

        // If it's a parent tag, delete all subcategories first
        if (!existingTag.parent_id) {
            const { error: deleteSubsError } = await supabase.from('tags').delete().eq('parent_id', existingTag.id)

            if (deleteSubsError) throw deleteSubsError
        }

        // Delete the tag itself
        const { error } = await supabase.from('tags').delete().eq('id', id)

        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        console.error('Error deleting tag:', error)
        res.status(500).json({ error: 'Failed to delete tag', details: error.message })
    }
}

export const getCallTags = async (req, res) => {
    try {
        const { data, error } = await supabase.from(DATABASE_TABLES.CALLS).select('TAGS_ARRAY')

        if (error) throw error

        // Collect all unique tags
        const uniqueTags = new Set()
        for (const row of data) {
            if (row.TAGS_ARRAY && Array.isArray(row.TAGS_ARRAY)) {
                for (const tag of row.TAGS_ARRAY) {
                    uniqueTags.add(tag)
                }
            }
        }

        res.json({ tags: Array.from(uniqueTags) })
    } catch (error) {
        console.error('Error fetching unique tags:', error)
        res.status(500).json({ error: 'Failed to fetch unique tags' })
    }
}

export const getTagStats = async (req, res) => {
    try {
        const { callType, employeeId } = req.query

        let query = supabase.from('call_log').select('TAGS')

        if (callType && callType !== 'all') {
            query = query.eq('CALL_TYPE', callType)
        }

        if (employeeId) {
            query = query.eq('EMPLOYEE_ID', employeeId)
        }

        const { data, error } = await query
        if (error) throw error

        // Process tags and count occurrences
        const tagCounts = {}
        for (const row of data) {
            if (row.TAGS) {
                const tags = row.TAGS.split(',').map((tag) => tag.trim())
                for (const tag of tags) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1
                }
            }
        }

        // Format for tag cloud
        const tagStats = Object.entries(tagCounts).map(([value, count]) => ({
            value,
            count
        }))

        res.json(tagStats)
    } catch (error) {
        console.error('Error fetching tag statistics:', error)
        res.status(500).json({ error: 'Failed to fetch tag statistics' })
    }
}

export const processTags = async (req, res) => {
    try {
        const { calls, prompt, tagCategories, chatflowId } = req.body

        console.log('Received request to process tags for calls:', calls.length)
        console.log('Using chatflow ID:', chatflowId)
        console.log('Prompt being used:', prompt)

        // Validate input
        if (!calls || !Array.isArray(calls) || calls.length === 0) {
            return res.status(400).json({ error: 'No calls provided for processing' })
        }
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided' })
        }
        if (!chatflowId) {
            return res.status(400).json({ error: 'No chatflow ID provided' })
        }

        // Validate AnswerAI endpoint
        const answerAIEndpoint = `${process.env.ANSWERAI_ENDPOINT}/prediction/${chatflowId}`
        console.log('Using AnswerAI endpoint:', answerAIEndpoint)

        if (!process.env.ANSWERAI_ENDPOINT) {
            return res.status(500).json({
                error: 'AnswerAI endpoint not configured',
                details: 'ANSWERAI_ENDPOINT environment variable is missing'
            })
        }

        // Filter out calls without transcriptions
        const callsToProcess = calls.filter((call) => call.TRANSCRIPTION)
        console.log(`Processing ${callsToProcess.length} calls with transcriptions`)

        // Process all calls in parallel
        const processPromises = callsToProcess.map(async (call) => {
            try {
                console.log(`Processing call ${call.RECORDING_URL}`)
                const processedPrompt = prompt.replace('${transcript}', call.TRANSCRIPTION)
                console.log('Sending request to AnswerAI with prompt:', processedPrompt)

                const aiResponse = await fetch(answerAIEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: processedPrompt
                    }),
                    signal: AbortSignal.timeout(API_CALL_TIMEOUT)
                })

                if (!aiResponse.ok) {
                    const errorText = await aiResponse.text()
                    console.error('AnswerAI error response:', errorText)
                    throw new Error(`AnswerAI returned status ${aiResponse.status}: ${errorText}`)
                }

                const result = await aiResponse.json()
                console.log('Raw AnswerAI response:', result)

                let parsed

                if (result.json) {
                    parsed = result.json
                    console.log('Using direct JSON response:', parsed)
                } else if (result.text) {
                    const rawReply = result.text.trim()
                    console.log('Attempting to parse text response:', rawReply)
                    try {
                        parsed = JSON.parse(rawReply)
                        console.log('Successfully parsed JSON from text:', parsed)
                    } catch (e) {
                        console.log('Direct JSON parse failed, trying to extract from markdown')
                        const jsonMatch = rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
                        if (jsonMatch) {
                            parsed = JSON.parse(jsonMatch[1].trim())
                            console.log('Successfully parsed JSON from markdown:', parsed)
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

                const {
                    tags = [],
                    sentiment_score = null,
                    resolution_status = null,
                    escalated = false,
                    summary = null,
                    coaching = null,
                    call_type = null,
                    persona = null
                } = parsed

                console.log('Extracted fields from response:', {
                    tags,
                    sentiment_score,
                    resolution_status,
                    escalated,
                    summary,
                    coaching,
                    call_type,
                    persona
                })

                const finalTags = [...new Set(Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [])]
                const finalSentiment = sentiment_score ? Number.parseFloat(sentiment_score) : null

                console.log('Processed tags:', finalTags)
                console.log('Processed sentiment score:', finalSentiment)

                // Update database
                const updateData = {
                    TAGS: JSON.stringify(finalTags),
                    TAGS_ARRAY: finalTags,
                    sentiment_score: finalSentiment,
                    resolution_status: resolution_status || null,
                    escalated: escalated === true,
                    summary,
                    coaching,
                    CALL_TYPE: call_type,
                    persona
                }

                console.log('Updating database with data:', updateData)
                console.log('For recording URL:', call.RECORDING_URL)

                const { error: updateError } = await supabase
                    .from(DATABASE_TABLES.CALLS)
                    .update(updateData)
                    .eq('RECORDING_URL', call.RECORDING_URL)

                if (updateError) {
                    console.error('Supabase update error:', updateError)
                    throw new Error(`Supabase update failed: ${updateError.message}`)
                }

                console.log('Successfully updated database for call:', call.RECORDING_URL)

                return {
                    success: true,
                    call: {
                        ...call,
                        TAGS_ARRAY: finalTags,
                        sentiment_score: finalSentiment,
                        resolution_status: resolution_status || null,
                        escalated: escalated === true,
                        summary,
                        coaching,
                        CALL_TYPE: call_type,
                        persona
                    }
                }
            } catch (error) {
                console.error(`Error processing call ${call.RECORDING_URL}:`, error)
                return {
                    success: false,
                    error: {
                        callId: call.RECORDING_URL,
                        error: error.message
                    }
                }
            }
        })

        // Wait for all calls to be processed
        const results = await Promise.all(processPromises)

        // Separate successes and failures
        const processedCalls = results.filter((r) => r.success).map((r) => r.call)
        const errors = results.filter((r) => !r.success).map((r) => r.error)

        console.log('Processing complete:', {
            successfulCalls: processedCalls.length,
            failedCalls: errors.length
        })

        if (processedCalls.length === 0 && errors.length > 0) {
            return res.status(500).json({
                error: 'Failed to process any calls',
                details: errors
            })
        }

        res.json({
            success: true,
            message: `Successfully processed ${processedCalls.length} calls`,
            processedCalls,
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        console.error('Error in /api/process-tags:', error)
        res.status(500).json({
            error: 'Failed to process calls',
            details: error.message
        })
    }
}
