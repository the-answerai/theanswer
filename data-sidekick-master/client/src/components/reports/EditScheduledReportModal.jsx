import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Slider
} from '@mui/material'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import CallFilters from '../Tagging/CallFilters'
import { getApiUrl } from '../../config/api'
import { SENTIMENT_EMOJIS, getSentimentGradient } from '../../utils/sentimentEmojis'

function EditScheduledReportModal({ open, onClose, report, onSave }) {
    const [name, setName] = useState('')
    const [prompt, setPrompt] = useState('')
    const [frequency, setFrequency] = useState('daily')
    const [filters, setFilters] = useState({
        callType: 'all',
        employeeId: '',
        selectedTags: [],
        sentimentRange: [1, 10],
        resolutionStatus: 'all',
        escalated: 'all'
    })
    const [status, setStatus] = useState('active')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (report) {
            setName(report.name)
            setPrompt(report.prompt)
            // Convert cron expression back to frequency
            switch (report.schedule) {
                case '0 0 * * *':
                    setFrequency('daily')
                    break
                case '0 0 * * 0':
                    setFrequency('weekly')
                    break
                case '0 0 1 * *':
                    setFrequency('monthly')
                    break
                case '0 0 1 */3 *':
                    setFrequency('quarterly')
                    break
            }
            setFilters(report.filters)
            setStatus(report.status)
        } else {
            // Reset form when creating new report
            setName('')
            setPrompt('')
            setFrequency('daily')
            setFilters({
                callType: 'all',
                employeeId: '',
                selectedTags: [],
                sentimentRange: [1, 10],
                resolutionStatus: 'all',
                escalated: 'all'
            })
            setStatus('active')
        }
    }, [report])

    const handleCallFilterChange = ({ callType, employeeId, selectedTags }) => {
        setFilters((prev) => ({
            ...prev,
            callType,
            employeeId,
            selectedTags: selectedTags || prev.selectedTags
        }))
    }

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const reportData = {
                name,
                prompt,
                frequency,
                filters,
                status
            }

            const url = report ? getApiUrl(`api/scheduled-reports/${report.id}`) : getApiUrl('api/scheduled-reports')

            const response = await fetch(url, {
                method: report ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || `Failed to ${report ? 'update' : 'create'} scheduled report`)
            }

            const updatedReport = await response.json()
            onSave(updatedReport.data)
            onClose()
        } catch (error) {
            console.error('Error saving scheduled report:', error)
            alert(`Failed to save report: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>{report ? 'Edit' : 'Create'} Scheduled Report</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField fullWidth label='Report Name' value={name} onChange={(e) => setName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Analysis Instructions'
                            multiline
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            required
                            helperText='Specify what aspects you want to analyze in the selected calls'
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant='subtitle1' gutterBottom>
                            Filter Settings
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <CallFilters onFilterChange={handleCallFilterChange} filters={filters} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Resolution Status</InputLabel>
                            <Select
                                value={filters.resolutionStatus}
                                label='Resolution Status'
                                onChange={(e) => handleFilterChange('resolutionStatus', e.target.value)}
                            >
                                <MenuItem value='all'>All Statuses</MenuItem>
                                <MenuItem value='resolved'>Resolved</MenuItem>
                                <MenuItem value='followup'>Followup</MenuItem>
                                <MenuItem value='unresolved'>Unresolved</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Escalated</InputLabel>
                            <Select
                                value={filters.escalated}
                                label='Escalated'
                                onChange={(e) => handleFilterChange('escalated', e.target.value)}
                            >
                                <MenuItem value='all'>All</MenuItem>
                                <MenuItem value='true'>Yes</MenuItem>
                                <MenuItem value='false'>No</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ px: 2 }}>
                            <Typography variant='body2' color='text.secondary' gutterBottom>
                                Sentiment Range
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[0]]}</Typography>
                                <Slider
                                    value={filters.sentimentRange}
                                    onChange={(_, newValue) => handleFilterChange('sentimentRange', newValue)}
                                    min={1}
                                    max={10}
                                    step={1}
                                    size='small'
                                    valueLabelDisplay='auto'
                                    valueLabelFormat={(value) => SENTIMENT_EMOJIS[value]}
                                    sx={{
                                        '& .MuiSlider-rail': {
                                            background: getSentimentGradient(),
                                            opacity: 1
                                        }
                                    }}
                                />
                                <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[1]]}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant='subtitle1' gutterBottom sx={{ mt: 2 }}>
                            Schedule Settings
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Frequency</InputLabel>
                            <Select value={frequency} label='Frequency' onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value='daily'>Daily</MenuItem>
                                <MenuItem value='weekly'>Weekly</MenuItem>
                                <MenuItem value='monthly'>Monthly</MenuItem>
                                <MenuItem value='quarterly'>Quarterly</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select value={status} label='Status' onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value='active'>Active</MenuItem>
                                <MenuItem value='paused'>Paused</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant='contained' disabled={isSaving || !name.trim() || !prompt.trim()}>
                    {isSaving ? 'Saving...' : report ? 'Save Changes' : 'Create Report'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

EditScheduledReportModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    report: PropTypes.object,
    onSave: PropTypes.func.isRequired
}

export default EditScheduledReportModal
