import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export async function getChats(req, res) {
    try {
        const page = Number.parseInt(req.query.page) || 0
        const pageSize = Number.parseInt(req.query.pageSize) || 10
        const chatbotName = req.query.chatbotName
        const aiModel = req.query.aiModel
        const tags = req.query.tags ? JSON.parse(req.query.tags) : []
        const sentimentMin = Number.parseFloat(req.query.sentimentMin) || 0
        const sentimentMax = Number.parseFloat(req.query.sentimentMax) || 10
        const resolutionStatus = req.query.resolutionStatus
        const isIncoming = req.query.isIncoming === 'true'
        const assignedTo = req.query.assignedTo
        const chatStatus = req.query.chatStatus
        const chatType = req.query.chat_type

        let query = supabase.from('chat_logs').select(
            `
            id,
            chatbot_name,
            ai_model,
            sentiment_score,
            resolution_status,
            tags_array,
            assigned_to,
            chat_status,
            last_message_time,
            chat_messages,
            created_at,
            summary,
            chat_type,
            documents_cited,
            suggested_response
        `,
            { count: 'exact' }
        )

        // Apply chat type filter
        if (chatType) {
            query = query.eq('chat_type', chatType)
        }

        // Apply filters
        if (chatbotName && chatbotName !== 'all') {
            query = query.eq('chatbot_name', chatbotName)
        }

        if (aiModel && aiModel !== 'all') {
            query = query.eq('ai_model', aiModel)
        }

        if (tags.length > 0) {
            query = query.contains('tags_array', tags)
        }

        if (resolutionStatus && resolutionStatus !== 'all') {
            query = query.eq('resolution_status', resolutionStatus)
        }

        // Handle assignment filter
        if (assignedTo && assignedTo !== 'all') {
            if (assignedTo === 'unassigned') {
                query = query.is('assigned_to', null)
            } else {
                query = query.eq('assigned_to', assignedTo)
            }
        }

        // Handle chat status filter
        if (chatStatus && chatStatus !== 'all') {
            query = query.eq('chat_status', chatStatus)
        }

        query = query.gte('sentiment_score', sentimentMin).lte('sentiment_score', sentimentMax)

        // Add pagination
        const {
            data: chats,
            count,
            error
        } = await query
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order(isIncoming ? 'last_message_time' : 'created_at', { ascending: false })

        if (error) {
            console.error('[getChats] Database error:', error)
            return res.status(500).json({ error: 'Error fetching chats' })
        }

        return res.json({
            chats,
            total: count
        })
    } catch (error) {
        console.error('[getChats] Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function getChatById(req, res) {
    try {
        const { id } = req.params

        const { data: chat, error } = await supabase
            .from('chat_logs')
            .select(
                `
                id,
                chatbot_name,
                ai_model,
                sentiment_score,
                resolution_status,
                tags_array,
                assigned_to,
                chat_status,
                last_message_time,
                chat_messages,
                created_at,
                summary,
                chat_type,
                tools_used,
                coaching,
                persona,
                documents_cited,
                suggested_response
            `
            )
            .eq('id', id)
            .single()

        if (error) {
            console.error('[getChatById] Database error:', error)
            return res.status(500).json({ error: 'Error fetching chat' })
        }

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' })
        }

        return res.json(chat)
    } catch (error) {
        console.error('[getChatById] Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export async function updateChat(req, res) {
    try {
        const { id } = req.params
        const updates = req.body

        const { data: chat, error } = await supabase.from('chat_logs').update(updates).eq('id', id).select().single()

        if (error) {
            console.error('[updateChat] Database error:', error)
            return res.status(500).json({ error: 'Error updating chat' })
        }

        return res.json(chat)
    } catch (error) {
        console.error('[updateChat] Error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
