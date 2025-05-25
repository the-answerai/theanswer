import { supabase } from '../config/db.js'

export const getTickets = async (req, res) => {
    try {
        const { status, assignedTo, tags, startDate, endDate, ticketType, escalated } = req.query

        let query = supabase.from('tickets').select('*').order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }
        if (assignedTo) {
            query = query.eq('assigned_to', assignedTo)
        }
        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (ticketType) {
            query = query.eq('ticket_type', ticketType)
        }
        if (escalated !== 'all') {
            query = query.eq('escalated', escalated === 'true')
        }
        if (tags) {
            const parsedTags = JSON.parse(tags)
            if (parsedTags.length > 0) {
                query = query.contains('tags_array', parsedTags)
            }
        }

        const { data: tickets, error } = await query

        if (error) throw error

        res.json({ tickets })
    } catch (error) {
        console.error('Error in getTickets:', error)
        res.status(500).json({ error: 'Failed to fetch tickets' })
    }
}

export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params
        const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', id).single()

        if (error) throw error
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' })
        }

        res.json(ticket)
    } catch (error) {
        console.error('Error in getTicketById:', error)
        res.status(500).json({ error: 'Failed to fetch ticket' })
    }
}

export const updateTicket = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body

        const { data: ticket, error } = await supabase.from('tickets').update(updates).eq('id', id).select().single()

        if (error) throw error
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' })
        }

        res.json(ticket)
    } catch (error) {
        console.error('Error in updateTicket:', error)
        res.status(500).json({ error: 'Failed to update ticket' })
    }
}
