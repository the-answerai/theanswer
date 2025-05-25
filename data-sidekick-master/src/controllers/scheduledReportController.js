import { supabase } from '../config/db.js'
import parser from 'cron-parser'

// Helper function to calculate next run time from a cron expression and last run time
const getNextRunTime = (cronExpression, lastRunAt = null) => {
    const interval = parser.parseExpression(cronExpression)
    if (lastRunAt) {
        interval.reset(new Date(lastRunAt))
    }
    return interval.next().toDate()
}

// Create a new scheduled report
export const createScheduledReport = async (req, res) => {
    try {
        const { name, prompt, frequency, filters } = req.body

        if (!name || !prompt || !frequency) {
            return res.status(400).json({
                error: 'Name, prompt, and frequency are required'
            })
        }

        // Convert frequency to cron expression
        let cronExpression
        switch (frequency) {
            case 'daily':
                cronExpression = '0 0 * * *' // Every day at midnight
                break
            case 'weekly':
                cronExpression = '0 0 * * 0' // Every Sunday at midnight
                break
            case 'monthly':
                cronExpression = '0 0 1 * *' // First day of every month at midnight
                break
            case 'quarterly':
                cronExpression = '0 0 1 */3 *' // First day of every third month at midnight
                break
            default:
                return res.status(400).json({ error: 'Invalid frequency' })
        }

        const { data: report, error } = await supabase
            .from('scheduled_reports')
            .insert({
                name,
                prompt,
                filters,
                schedule: cronExpression,
                status: 'active'
            })
            .select()
            .single()

        if (error) throw error

        // Add next run time to response without storing it
        const nextRunTime = getNextRunTime(cronExpression)
        res.status(201).json({
            data: {
                ...report,
                next_run_at: nextRunTime
            }
        })
    } catch (error) {
        console.error('Error creating scheduled report:', error)
        res.status(500).json({ error: error.message })
    }
}

// Get all scheduled reports for the current user
export const getScheduledReports = async (req, res) => {
    try {
        const { data, error } = await supabase.from('scheduled_reports').select('*').order('created_at', { ascending: false })

        if (error) throw error

        // Calculate next run time for each report
        const reportsWithNextRun = data.map((report) => ({
            ...report,
            next_run_at: getNextRunTime(report.schedule, report.last_run_at)
        }))

        res.json({ data: reportsWithNextRun })
    } catch (error) {
        console.error('Error fetching scheduled reports:', error)
        res.status(500).json({ error: error.message })
    }
}

// Get a specific scheduled report
export const getScheduledReportById = async (req, res) => {
    try {
        const { data, error } = await supabase.from('scheduled_reports').select('*').eq('id', req.params.id).single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Scheduled report not found' })
        }

        // Add next run time to response
        const nextRunTime = getNextRunTime(data.schedule, data.last_run_at)
        res.json({
            data: {
                ...data,
                next_run_at: nextRunTime
            }
        })
    } catch (error) {
        console.error('Error fetching scheduled report:', error)
        res.status(500).json({ error: error.message })
    }
}

// Update a scheduled report
export const updateScheduledReport = async (req, res) => {
    try {
        const { name, prompt, frequency, filters, status } = req.body
        const updateData = {}

        if (name) updateData.name = name
        if (prompt) updateData.prompt = prompt
        if (filters) updateData.filters = filters
        if (status) updateData.status = status

        if (frequency) {
            // Convert frequency to cron expression
            let cronExpression
            switch (frequency) {
                case 'daily':
                    cronExpression = '0 0 * * *'
                    break
                case 'weekly':
                    cronExpression = '0 0 * * 0'
                    break
                case 'monthly':
                    cronExpression = '0 0 1 * *'
                    break
                case 'quarterly':
                    cronExpression = '0 0 1 */3 *'
                    break
                default:
                    return res.status(400).json({ error: 'Invalid frequency' })
            }
            updateData.schedule = cronExpression
        }

        const { data, error } = await supabase.from('scheduled_reports').update(updateData).eq('id', req.params.id).select().single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Scheduled report not found' })
        }

        // Add next run time to response
        const nextRunTime = getNextRunTime(data.schedule, data.last_run_at)
        res.json({
            data: {
                ...data,
                next_run_at: nextRunTime
            }
        })
    } catch (error) {
        console.error('Error updating scheduled report:', error)
        res.status(500).json({ error: error.message })
    }
}

// Delete a scheduled report
export const deleteScheduledReport = async (req, res) => {
    try {
        const { error } = await supabase.from('scheduled_reports').delete().eq('id', req.params.id)

        if (error) throw error
        res.json({ success: true })
    } catch (error) {
        console.error('Error deleting scheduled report:', error)
        res.status(500).json({ error: error.message })
    }
}

// Update last run time for a scheduled report
export const updateLastRunTime = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('scheduled_reports')
            .update({
                last_run_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single()

        if (error) throw error
        if (!data) {
            return res.status(404).json({ error: 'Scheduled report not found' })
        }

        // Add next run time to response
        const nextRunTime = getNextRunTime(data.schedule, data.last_run_at)
        res.json({
            data: {
                ...data,
                next_run_at: nextRunTime
            }
        })
    } catch (error) {
        console.error('Error updating last run time:', error)
        res.status(500).json({ error: error.message })
    }
}
