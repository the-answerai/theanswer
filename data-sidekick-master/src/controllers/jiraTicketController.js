import { supabase } from '../config/db.js'

export const getJiraTickets = async (req, res) => {
    try {
        const { status, assignee, labels, startDate, endDate, projectKey, escalated } = req.query

        let query = supabase.from('jira_tickets').select('*').order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }
        if (assignee) {
            query = query.eq('assignee', assignee)
        }
        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (projectKey) {
            query = query.eq('project_key', projectKey)
        }
        if (escalated !== 'all') {
            // For escalated, we need to check the metadata field
            if (escalated === 'true') {
                query = query.contains('metadata', { escalated: true })
            } else if (escalated === 'false') {
                query = query.contains('metadata', { escalated: false })
            }
        }
        if (labels) {
            const parsedLabels = JSON.parse(labels)
            if (parsedLabels.length > 0) {
                query = query.contains('labels', parsedLabels)
            }
        }

        const { data: tickets, error } = await query

        if (error) throw error

        res.json({ tickets })
    } catch (error) {
        console.error('Error in getJiraTickets:', error)
        res.status(500).json({ error: 'Failed to fetch Jira tickets' })
    }
}

export const getJiraTicketById = async (req, res) => {
    try {
        const { id } = req.params
        const { data: ticket, error } = await supabase.from('jira_tickets').select('*').eq('ticket_id', id).single()

        if (error) throw error
        if (!ticket) {
            return res.status(404).json({ error: 'Jira ticket not found' })
        }

        res.json(ticket)
    } catch (error) {
        console.error('Error in getJiraTicketById:', error)
        res.status(500).json({ error: 'Failed to fetch Jira ticket' })
    }
}

export const updateJiraTicket = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body

        const { data: ticket, error } = await supabase.from('jira_tickets').update(updates).eq('ticket_id', id).select().single()

        if (error) throw error
        if (!ticket) {
            return res.status(404).json({ error: 'Jira ticket not found' })
        }

        res.json(ticket)
    } catch (error) {
        console.error('Error in updateJiraTicket:', error)
        res.status(500).json({ error: 'Failed to update Jira ticket' })
    }
}

export const getJiraLabels = async (req, res) => {
    try {
        // Get all unique labels from jira_tickets
        const { data, error } = await supabase.from('jira_tickets').select('labels')

        if (error) throw error

        // Extract all labels and flatten the array
        const allLabels = data.reduce((acc, ticket) => {
            if (ticket.labels && Array.isArray(ticket.labels)) {
                // Use concat instead of spread to avoid linter error
                return acc.concat(ticket.labels)
            }
            return acc
        }, [])

        // Get unique labels
        const uniqueLabels = [...new Set(allLabels)]

        // Format labels for the frontend
        const formattedLabels = uniqueLabels.map((label) => ({
            id: label,
            name: label,
            color: 'default'
        }))

        res.json(formattedLabels)
    } catch (error) {
        console.error('Error in getJiraLabels:', error)
        res.status(500).json({ error: 'Failed to fetch Jira labels' })
    }
}
