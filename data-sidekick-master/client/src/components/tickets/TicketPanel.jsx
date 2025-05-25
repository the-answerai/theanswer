import { useState, memo } from 'react'
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Link,
    Grid,
    Drawer,
    Tabs,
    Tab,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSupabase } from '../../hooks/useSupabase'
import PropTypes from 'prop-types'
import { format } from 'date-fns'
import { renderJiraDescription } from '../../utils/jiraRenderer.jsx'

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

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role='tabpanel' hidden={value !== index} id={`ticket-tabpanel-${index}`} aria-labelledby={`ticket-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const TicketPanel = memo(function TicketPanel({ ticket, onClose, onUpdate }) {
    const supabase = useSupabase()
    const [editing, setEditing] = useState(false)
    const [editedTicket, setEditedTicket] = useState(ticket)
    const [saving, setSaving] = useState(false)
    const [tabValue, setTabValue] = useState(0)

    const handleSave = async () => {
        setSaving(true)
        try {
            // Create a metadata object with the fields that should be stored in metadata
            const metadata = {
                ...(ticket.metadata || {}),
                resolution: editedTicket.resolution,
                escalated: editedTicket.escalated
            }

            const { error } = await supabase
                .from('jira_tickets')
                .update({
                    status: editedTicket.status,
                    priority: editedTicket.priority,
                    assignee: editedTicket.assigned_to,
                    metadata: metadata
                })
                .eq('ticket_id', ticket.id)

            if (error) throw error

            onUpdate()
            setEditing(false)
        } catch (error) {
            console.error('Error updating ticket:', error)
        } finally {
            setSaving(false)
        }
    }

    // Extract metadata fields
    const metadata = ticket.metadata || {}
    const resolution = metadata.resolution || ''
    const external_url = metadata.external_url || ''

    return (
        <Drawer
            anchor='right'
            open={true}
            onClose={onClose}
            PaperProps={{
                sx: { width: '40%', minWidth: 400, maxWidth: 600 }
            }}
        >
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant='h5'>Ticket Details</Typography>
                    <Box>
                        {editing ? (
                            <Button variant='contained' size='small' onClick={handleSave} disabled={saving} sx={{ mr: 1 }}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        ) : (
                            <Button variant='outlined' size='small' onClick={() => setEditing(true)} sx={{ mr: 1 }}>
                                Edit
                            </Button>
                        )}
                        <IconButton onClick={onClose} size='small'>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Key Information */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant='h6'>{ticket.title || ticket.summary}</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {ticket.key || ticket.source_id}
                    </Typography>
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='description-content' id='description-header'>
                            <Typography>Description</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Paper
                                sx={(theme) => ({
                                    p: 2,
                                    bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
                                    ...(theme.palette.mode === 'dark' && {
                                        border: '1px solid #24C3A1',
                                        boxShadow: '0 0 5px #24C3A1'
                                    })
                                })}
                            >
                                {renderJiraDescription(ticket.description, ticket.key)}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {/* Status and Priority Chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    <Chip label={ticket.status} color={statusColors[ticket.status] || 'default'} size='small' />
                    <Chip label={priorityLabels[ticket.priority]} color='primary' variant='outlined' size='small' />
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label='ticket details tabs'>
                        <Tab label='Details' />
                        <Tab label='Resolution' />
                        <Tab label='Comments' />
                        {ticket.ai_summary && <Tab label='AI Analysis' />}
                    </Tabs>
                </Box>

                {/* Details Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        {editing ? (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={editedTicket.status}
                                            label='Status'
                                            onChange={(e) =>
                                                setEditedTicket({
                                                    ...editedTicket,
                                                    status: e.target.value
                                                })
                                            }
                                        >
                                            <MenuItem value='open'>Open</MenuItem>
                                            <MenuItem value='in_progress'>In Progress</MenuItem>
                                            <MenuItem value='waiting_on_customer'>Waiting on Customer</MenuItem>
                                            <MenuItem value='resolved'>Resolved</MenuItem>
                                            <MenuItem value='closed'>Closed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={editedTicket.priority}
                                            label='Priority'
                                            onChange={(e) =>
                                                setEditedTicket({
                                                    ...editedTicket,
                                                    priority: e.target.value
                                                })
                                            }
                                        >
                                            <MenuItem value='low'>Low</MenuItem>
                                            <MenuItem value='medium'>Medium</MenuItem>
                                            <MenuItem value='high'>High</MenuItem>
                                            <MenuItem value='critical'>Critical</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth size='small'>
                                        <InputLabel>Assigned To</InputLabel>
                                        <Select
                                            value={editedTicket.assigned_to || ''}
                                            label='Assigned To'
                                            onChange={(e) =>
                                                setEditedTicket({
                                                    ...editedTicket,
                                                    assigned_to: e.target.value
                                                })
                                            }
                                        >
                                            <MenuItem value=''>Unassigned</MenuItem>
                                            {/* Add user options here */}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant='subtitle2' color='text.secondary'>
                                        Assigned To
                                    </Typography>
                                    <Typography>{ticket.assigned_to || ticket.assignee || 'Unassigned'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant='subtitle2' color='text.secondary'>
                                        Project
                                    </Typography>
                                    <Typography>{ticket.project_key || 'Unknown'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant='subtitle2' color='text.secondary'>
                                        Reporter
                                    </Typography>
                                    <Typography>{ticket.reporter || ticket.created_by || 'Unknown'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant='subtitle2' color='text.secondary'>
                                        Created
                                    </Typography>
                                    <Typography>{format(new Date(ticket.created_at), 'PPpp')}</Typography>
                                </Grid>
                                {ticket.resolved_at && (
                                    <Grid item xs={12}>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Resolved
                                        </Typography>
                                        <Typography>{format(new Date(ticket.resolved_at), 'PPpp')}</Typography>
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                </TabPanel>

                {/* Resolution Tab */}
                <TabPanel value={tabValue} index={1}>
                    {editing ? (
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            size='small'
                            label='Resolution'
                            value={editedTicket.resolution || ''}
                            onChange={(e) => setEditedTicket({ ...editedTicket, resolution: e.target.value })}
                        />
                    ) : (
                        <>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Resolution
                            </Typography>
                            <Typography>{resolution || 'No resolution provided'}</Typography>
                        </>
                    )}
                </TabPanel>

                {/* Comments Tab */}
                <TabPanel value={tabValue} index={2}>
                    {ticket.comments ? (
                        <Box>
                            {ticket.comments.map((comment, index) => {
                                // Format the author display
                                const authorDisplay =
                                    comment.author?.displayName ||
                                    (typeof comment.author === 'string' ? comment.author.split('@')[0].replace(/\./g, ' ') : 'Unknown')

                                return (
                                    <Paper
                                        key={comment.id || index}
                                        sx={(theme) => ({
                                            p: 2,
                                            mb: 2,
                                            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
                                            ...(theme.palette.mode === 'dark' && {
                                                border: '1px solid #24C3A1',
                                                boxShadow: '0 0 5px #24C3A1'
                                            })
                                        })}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 2
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant='subtitle2' sx={{ textTransform: 'capitalize' }}>
                                                    {authorDisplay}
                                                </Typography>
                                                {comment.updated !== comment.created && (
                                                    <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                                                        (edited)
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Typography variant='caption' color='text.secondary'>
                                                {format(new Date(comment.created), 'PPpp')}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={(theme) => ({
                                                bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.100',
                                                p: 2,
                                                borderRadius: 1
                                            })}
                                        >
                                            {renderJiraDescription(comment.body, ticket.key)}
                                        </Box>
                                    </Paper>
                                )
                            })}
                        </Box>
                    ) : (
                        <Typography color='text.secondary'>No comments available</Typography>
                    )}
                </TabPanel>

                {/* AI Analysis Tab */}
                {ticket.ai_summary && (
                    <TabPanel value={tabValue} index={3}>
                        <Typography variant='subtitle2' color='text.secondary'>
                            AI Summary
                        </Typography>
                        <Typography paragraph>{ticket.ai_summary}</Typography>
                    </TabPanel>
                )}

                {/* Tags */}
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(ticket.tags_array || ticket.labels || []).map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size='small'
                                sx={(theme) => ({
                                    color: theme.palette.mode === 'dark' ? '#24C3A1' : 'rgba(0, 0, 0, 0.87)',
                                    ...(theme.palette.mode === 'dark' && {
                                        border: '1px solid #24C3A1'
                                    })
                                })}
                            />
                        ))}
                    </Box>
                </Box>

                {/* External Link */}
                {external_url && (
                    <Box sx={{ mt: 2 }}>
                        <Link
                            href={external_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            View in Jira
                            <OpenInNewIcon fontSize='small' />
                        </Link>
                    </Box>
                )}
            </Box>
        </Drawer>
    )
})

TicketPanel.propTypes = {
    ticket: PropTypes.shape({
        id: PropTypes.string.isRequired,
        ticket_id: PropTypes.string,
        key: PropTypes.string,
        project_key: PropTypes.string,
        summary: PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
        status: PropTypes.string.isRequired,
        priority: PropTypes.string.isRequired,
        reporter: PropTypes.string,
        created_by: PropTypes.string,
        assignee: PropTypes.string,
        assigned_to: PropTypes.string,
        labels: PropTypes.arrayOf(PropTypes.string),
        tags_array: PropTypes.arrayOf(PropTypes.string),
        created_at: PropTypes.string.isRequired,
        updated_at: PropTypes.string,
        resolved_at: PropTypes.string,
        metadata: PropTypes.object,
        ai_summary: PropTypes.string,
        source_id: PropTypes.string,
        comments: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string,
                body: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
                author: PropTypes.shape({
                    displayName: PropTypes.string
                }),
                created: PropTypes.string
            })
        )
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired
}

export default TicketPanel
