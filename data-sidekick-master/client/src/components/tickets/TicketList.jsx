import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Chip, Grid, TextField, Alert } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import TicketPanel from './TicketPanel'
import { getApiUrl } from '../../config/api'
import { format, differenceInDays, differenceInHours, isValid } from 'date-fns'

const defaultFilters = {
    status: '',
    assignedTo: '',
    selectedTags: [],
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(), // now
    projectKey: '',
    escalated: 'all'
}

const statusColors = {
    open: 'error',
    in_progress: 'warning',
    waiting_on_customer: 'info',
    resolved: 'success',
    closed: 'default'
}

const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
}

const TicketList = memo(function TicketList() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [tags, setTags] = useState([])
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [filters, setFilters] = useState(defaultFilters)

    // New state for unique values
    const [uniqueValues, setUniqueValues] = useState({
        statuses: [],
        assignees: [],
        projectKeys: []
    })

    const calculateDuration = useCallback((createdAt, resolvedAt) => {
        try {
            const start = new Date(createdAt)
            const end = resolvedAt ? new Date(resolvedAt) : new Date()

            if (!isValid(start) || !isValid(end)) {
                return 'Invalid date'
            }

            const days = differenceInDays(end, start)
            const hours = differenceInHours(end, start) % 24

            if (days > 0) {
                return `${days}d ${hours}h`
            }
            return `${hours}h`
        } catch (error) {
            console.error('Error calculating duration:', error)
            return 'N/A'
        }
    }, [])

    // Fetch tickets
    useEffect(() => {
        let isMounted = true

        const fetchData = async () => {
            if (!isMounted) return
            setLoading(true)

            try {
                const queryParams = new URLSearchParams({
                    status: filters.status,
                    assignee: filters.assignedTo,
                    labels: JSON.stringify(filters.selectedTags),
                    startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
                    endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
                    projectKey: filters.projectKey,
                    escalated: filters.escalated
                })

                // Remove undefined values from query params
                for (const [key, value] of queryParams.entries()) {
                    if (value === 'undefined') {
                        queryParams.delete(key)
                    }
                }

                const response = await fetch(getApiUrl(`/api/jira/tickets?${queryParams}`))
                const data = await response.json()

                if (!isMounted) return

                // Ensure each ticket has an id and valid dates
                const processedTickets = (data.tickets || []).map((ticket) => {
                    // Extract metadata fields
                    const metadata = ticket.metadata || {}

                    const processedTicket = {
                        ...ticket,
                        id: ticket.ticket_id || ticket.key || Math.random().toString(36).substr(2, 9),
                        title: ticket.summary || 'Untitled',
                        description: ticket.description || '',
                        status: ticket.status || 'open',
                        priority: ticket.priority || 'medium',
                        created_by: ticket.reporter || 'Unknown',
                        assigned_to: ticket.assignee || '',
                        tags_array: ticket.labels || [],
                        created_at: ticket.created_at,
                        updated_at: ticket.updated_at,
                        resolved_at: ticket.resolved_at,
                        ticket_type: metadata.ticket_type || 'unknown',
                        source_system: 'jira',
                        source_id: ticket.key || '',
                        sentiment_score: metadata.sentiment_score || 0,
                        escalated: metadata.escalated || false,
                        external_url: metadata.external_url || '',
                        resolution: metadata.resolution || ''
                    }

                    return processedTicket
                })

                setTickets(processedTickets)
            } catch (error) {
                console.error('Error fetching tickets:', error)
                if (isMounted) {
                    setTickets([])
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()
        return () => {
            isMounted = false
        }
    }, [filters])

    // Fetch tags
    useEffect(() => {
        let isMounted = true

        const fetchTags = async () => {
            try {
                const response = await fetch(getApiUrl('/api/jira/labels'))
                const tagsData = await response.json()

                if (!isMounted) return

                // For tags, handle both array and object formats
                if (tagsData && typeof tagsData === 'object') {
                    // If it's the hierarchical format from the tag controller
                    const tagList = []
                    for (const category of Object.values(tagsData)) {
                        tagList.push({
                            id: category.id,
                            name: category.label,
                            color: category.color
                        })
                        for (const subcategory of Object.values(category.subcategories || {})) {
                            tagList.push({
                                id: subcategory.id,
                                name: subcategory.label,
                                color: subcategory.color
                            })
                        }
                    }
                    setTags(tagList)
                } else {
                    // If it's a simple array
                    setTags(Array.isArray(tagsData) ? tagsData : [])
                }
            } catch (error) {
                console.error('Error fetching tags:', error)
                setTags([])
            }
        }

        fetchTags()
        return () => {
            isMounted = false
        }
    }, [])

    // Extract unique values from tickets
    useEffect(() => {
        const values = {
            statuses: [...new Set(tickets.map((ticket) => ticket.status))].filter(Boolean),
            assignees: [...new Set(tickets.map((ticket) => ticket.assigned_to))].filter(Boolean),
            projectKeys: [...new Set(tickets.map((ticket) => ticket.project_key))].filter(Boolean)
        }
        setUniqueValues(values)
    }, [tickets])

    const handleFilterUpdate = (newFilters) => {
        setFilters(newFilters)
    }

    const columns = useMemo(
        () => [
            {
                field: 'key',
                headerName: 'Key',
                flex: 1
            },
            {
                field: 'summary',
                headerName: 'Title',
                flex: 2
            },
            {
                field: 'status',
                headerName: 'Status',
                flex: 1
            },
            {
                field: 'priority',
                headerName: 'Priority',
                flex: 1
            },
            {
                field: 'assigned_to',
                headerName: 'Assigned To',
                flex: 1
            },
            {
                field: 'created_at',
                headerName: 'Created',
                flex: 1,
                valueFormatter: (params) => {
                    const dateValue = typeof params === 'string' ? params : params?.value
                    if (!dateValue) return '-'
                    try {
                        return format(new Date(dateValue), 'MMM d, yyyy HH:mm')
                    } catch (error) {
                        return '-'
                    }
                }
            },
            {
                field: 'updated_at',
                headerName: 'Updated',
                flex: 1,
                valueFormatter: (params) => {
                    const dateValue = typeof params === 'string' ? params : params?.value
                    if (!dateValue) return '-'
                    try {
                        return format(new Date(dateValue), 'MMM d, yyyy HH:mm')
                    } catch (error) {
                        return '-'
                    }
                }
            },
            {
                field: 'resolved_at',
                headerName: 'Resolved',
                flex: 1,
                valueFormatter: (params) => {
                    const dateValue = typeof params === 'string' ? params : params?.value
                    if (!dateValue) return '-'
                    try {
                        return format(new Date(dateValue), 'MMM d, yyyy HH:mm')
                    } catch (error) {
                        return '-'
                    }
                }
            }
        ],
        []
    )

    // Add debug logging for tickets data before rendering
    useEffect(() => {
        if (tickets.length > 0) {
            console.log('Current tickets data:', tickets)
        }
    }, [tickets])

    return (
        <Box sx={{ my: 4 }}>
            <Typography variant='h4' component='h1' gutterBottom>
                Tickets
            </Typography>
            <Alert severity='info' sx={{ mb: 3 }}>
                This is a demo environment showing test ticket data. The system can integrate with various ticketing systems including Jira,
                Zendesk, ServiceNow, and custom solutions. Each ticket includes priority tracking, sentiment analysis, and customizable
                labels.
            </Alert>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems='center'>
                    {/* Project Filter */}
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Project</InputLabel>
                            <Select
                                value={filters.projectKey}
                                label='Project'
                                onChange={(e) => handleFilterUpdate({ ...filters, projectKey: e.target.value })}
                            >
                                <MenuItem value=''>All</MenuItem>
                                {uniqueValues.projectKeys.map((project) => (
                                    <MenuItem key={project} value={project}>
                                        {project}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Status Filter */}
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label='Status'
                                onChange={(e) => handleFilterUpdate({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value=''>All</MenuItem>
                                {uniqueValues.statuses.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {status.replace(/_/g, ' ')}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Assigned To Filter */}
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Assigned To</InputLabel>
                            <Select
                                value={filters.assignedTo}
                                label='Assigned To'
                                onChange={(e) => handleFilterUpdate({ ...filters, assignedTo: e.target.value })}
                            >
                                <MenuItem value=''>All</MenuItem>
                                {uniqueValues.assignees.map((assignee) => (
                                    <MenuItem key={assignee} value={assignee}>
                                        {assignee}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid item xs={12} sm={6} md={2}>
                            <DatePicker
                                label='Start Date'
                                value={filters.startDate}
                                onChange={(date) => handleFilterUpdate({ ...filters, startDate: date })}
                                renderInput={(params) => <TextField {...params} fullWidth size='small' />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <DatePicker
                                label='End Date'
                                value={filters.endDate}
                                onChange={(date) => handleFilterUpdate({ ...filters, endDate: date })}
                                renderInput={(params) => <TextField {...params} fullWidth size='small' />}
                            />
                        </Grid>
                    </LocalizationProvider>
                </Grid>
            </Paper>

            {/* Tickets Grid */}
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box sx={{ height: 600 }}>
                        <DataGrid
                            rows={tickets}
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10, 25, 50]}
                            checkboxSelection={false}
                            disableSelectionOnClick
                            loading={loading}
                            onRowClick={(params) => setSelectedTicket(params.row)}
                            getRowId={(row) => row?.id || row?.key || Math.random().toString(36).substr(2, 9)}
                            components={{
                                NoRowsOverlay: () => (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            height: '100%'
                                        }}
                                    >
                                        <Typography>No tickets found</Typography>
                                    </Box>
                                )
                            }}
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* Ticket Panel */}
            {selectedTicket && <TicketPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdate={() => {}} />}
        </Box>
    )
})

export default TicketList
