import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Tooltip,
    Slider,
    LinearProgress,
    Backdrop,
    FormHelperText,
    Alert
} from '@mui/material'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import LockIcon from '@mui/icons-material/Lock'
import { getApiUrl } from '../config/api'
import CallList from '../components/calls/CallList'
import PropTypes from 'prop-types'
import CallFilters from '../components/Tagging/CallFilters'
import { SENTIMENT_EMOJIS, getSentimentGradient } from '../utils/sentimentEmojis'
import EditScheduledReportModal from '../components/reports/EditScheduledReportModal'
import EmptyScheduledReports from '../components/reports/EmptyScheduledReports'
import { useTheme } from '../context/ThemeContext'
import { PROMPT_SUGGESTION_PROMPT, PROMPT_SUGGESTION_SCHEMA, generatePromptContext } from '../utils/reportPrompts'
import { REPORT_TYPES } from '../utils/reportTypes'

const GENERATION_MESSAGES = [
    'Analyzing call patterns and trends...',
    'Identifying key customer satisfaction indicators...',
    'Processing sentiment analysis across conversations...',
    'Extracting actionable insights from call data...',
    'Evaluating agent performance metrics...',
    'Generating recommendations for improvement...',
    'Compiling resolution rate statistics...',
    'Analyzing call duration patterns...',
    'Identifying common customer pain points...',
    'Correlating sentiment with resolution status...',
    'Examining escalation patterns...',
    'Synthesizing findings into comprehensive report...',
    'Formatting report with detailed examples...',
    'Adding executive summary and key metrics...',
    'Finalizing report with actionable recommendations...'
]

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div role='tabpanel' hidden={value !== index} id={`reports-tabpanel-${index}`} aria-labelledby={`reports-tab-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

function ReportsPage() {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [scheduledReports, setScheduledReports] = useState([])
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingReport, setEditingReport] = useState(null)
    const [newReportName, setNewReportName] = useState('')
    const [currentTab, setCurrentTab] = useState(0)
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduleFrequency, setScheduleFrequency] = useState('daily')
    const [reportName, setReportName] = useState('')
    const [userPrompt, setUserPrompt] = useState('')
    const [selectedCalls, setSelectedCalls] = useState([])
    const [reportFilters, setReportFilters] = useState({
        callType: 'all',
        employeeId: '',
        selectedTags: [],
        sentimentRange: [1, 10],
        resolutionStatus: 'all',
        escalated: 'all'
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationMessage, setGenerationMessage] = useState(GENERATION_MESSAGES[0])
    const [progress, setProgress] = useState(0)
    const [editingScheduledReport, setEditingScheduledReport] = useState(null)
    const [isCreatingScheduledReport, setIsCreatingScheduledReport] = useState(false)
    const { mode } = useTheme()
    const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES.PERFORMANCE.id)

    // Fetch all reports
    const fetchReports = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('api/reports'))
            const { data, error } = await response.json()

            if (error) throw error
            setReports(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
        }
    }, [])

    // Fetch all scheduled reports
    const fetchScheduledReports = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('api/scheduled-reports'))
            const { data, error } = await response.json()

            if (error) throw error
            setScheduledReports(data || [])
        } catch (error) {
            console.error('Error fetching scheduled reports:', error)
        }
    }, [])

    useEffect(() => {
        fetchReports()
        fetchScheduledReports()
    }, [fetchReports, fetchScheduledReports])

    useEffect(() => {
        if (isGenerating) {
            // Create dynamic messages that incorporate the analysis prompt
            const customMessages = [
                `Analyzing calls based on your prompt: "${userPrompt}"...`,
                'Processing call data and extracting key insights...',
                'Identifying patterns and trends in the selected calls...',
                'Evaluating customer interactions and agent responses...',
                'Generating data visualizations and metrics...',
                'Compiling findings into comprehensive analysis...',
                `Creating detailed report "${reportName}"...`,
                'Formatting results and preparing final document...',
                'Adding executive summary and recommendations...',
                'Finalizing report with actionable insights...'
            ]

            const messageInterval = setInterval(() => {
                setGenerationMessage((prev) => {
                    const currentIndex = customMessages.indexOf(prev)
                    const nextIndex = (currentIndex + 1) % customMessages.length
                    return customMessages[nextIndex]
                })
            }, 3000)

            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return prev + Math.random() * 0.5
                    return prev + Math.random() * 10
                })
            }, 1000)

            // Set initial message
            setGenerationMessage(customMessages[0])

            return () => {
                clearInterval(messageInterval)
                clearInterval(progressInterval)
            }
        }

        setProgress(0)
        setGenerationMessage('')
    }, [isGenerating, reportName, userPrompt])

    const handleReportSelect = (report) => {
        navigate(`/reports/${report.id}`)
    }

    const handleEditClick = (e, report) => {
        e.stopPropagation()
        setEditingReport(report)
        setNewReportName(report.name)
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(getApiUrl(`api/reports/${editingReport.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newReportName })
            })

            if (!response.ok) throw new Error('Failed to update report')

            await fetchReports()
            setEditDialogOpen(false)
        } catch (error) {
            console.error('Error updating report:', error)
            alert(`Failed to update report: ${error.message}`)
        }
    }

    const handleDelete = async (e, report) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return
        }

        try {
            const response = await fetch(getApiUrl(`api/reports/${report.id}`), {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete report')

            await fetchReports()
        } catch (error) {
            console.error('Error deleting report:', error)
            alert(`Failed to delete report: ${error.message}`)
        }
    }

    const handleDeleteScheduledReport = async (e, report) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this scheduled report?')) {
            return
        }

        try {
            const response = await fetch(getApiUrl(`api/scheduled-reports/${report.id}`), {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete scheduled report')

            await fetchScheduledReports()
        } catch (error) {
            console.error('Error deleting scheduled report:', error)
            alert(`Failed to delete scheduled report: ${error.message}`)
        }
    }

    const handleEditScheduledReport = (e, report) => {
        e.stopPropagation()
        setEditingScheduledReport(report)
    }

    const handleSaveScheduledReport = async () => {
        await fetchScheduledReports()
        setEditingScheduledReport(null)
    }

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue)
    }

    const handleReportTypeChange = (event) => {
        const type = event.target.value
        setSelectedReportType(type)

        // Only set the base title if the current report name is empty
        const reportType = Object.values(REPORT_TYPES).find((r) => r.id === type)
        if (reportType && reportType.id !== 'custom' && !reportName.trim()) {
            setReportName(reportType.baseTitle)
        }
    }

    const handleSuggestPrompt = async () => {
        if (!userPrompt.trim()) {
            return
        }

        try {
            const reportType = Object.values(REPORT_TYPES).find((r) => r.id === selectedReportType)
            if (!reportType || reportType.id === 'custom') {
                return
            }

            const context = generatePromptContext(reportType, userPrompt, reportFilters)

            const response = await fetch(getApiUrl('api/answerai/analyze'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: context,
                    systemPrompt: PROMPT_SUGGESTION_PROMPT,
                    schema: PROMPT_SUGGESTION_SCHEMA
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get prompt suggestion')
            }

            const result = await response.json()
            setUserPrompt(result.prompt) // Update the user prompt directly
        } catch (error) {
            console.error('Error getting prompt suggestion:', error)
        }
    }

    const handleCallFilterChange = useCallback(({ callType, employeeId, selectedTags }) => {
        setReportFilters((prev) => ({
            ...prev,
            callType,
            employeeId,
            selectedTags: selectedTags || prev.selectedTags
        }))
    }, [])

    const handleFilterChange = (newFilters) => {
        setReportFilters(newFilters)
    }

    // Helper function to format cron expression to human readable format
    const formatCronExpression = (cronExpression) => {
        switch (cronExpression) {
            case '0 0 * * *':
                return 'Daily at midnight'
            case '0 0 * * 0':
                return 'Weekly on Sunday at midnight'
            case '0 0 1 * *':
                return 'Monthly on the 1st at midnight'
            case '0 0 1 */3 *':
                return 'Quarterly on the 1st at midnight'
            default:
                return cronExpression
        }
    }

    const handleCreateReport = async () => {
        try {
            if (!reportName.trim()) {
                alert('Please enter a report name')
                return
            }

            if (!userPrompt.trim()) {
                alert('Please enter analysis instructions')
                return
            }

            if (!isScheduled && selectedCalls.length === 0) {
                alert('Please select at least one call for the report')
                return
            }

            setIsGenerating(true)

            if (isScheduled) {
                // Create scheduled report
                const scheduledReport = {
                    name: reportName,
                    prompt: userPrompt,
                    frequency: scheduleFrequency,
                    filters: reportFilters
                }

                const response = await fetch(getApiUrl('api/scheduled-reports'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduledReport)
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to create scheduled report')
                }

                // Reset form and switch to scheduled reports tab
                setReportName('')
                setUserPrompt('')
                setIsScheduled(false)
                setReportFilters({
                    callType: 'all',
                    employeeId: '',
                    selectedTags: [],
                    sentimentRange: [1, 10],
                    resolutionStatus: 'all',
                    escalated: 'all'
                })
                setIsGenerating(false)
                await fetchScheduledReports()
                setCurrentTab(2) // Switch to Scheduled Reports tab
                return
            }

            // Create one-time report
            const callsResponse = await fetch(getApiUrl(`/api/calls?recording_urls=${JSON.stringify(selectedCalls)}`))
            const callsData = await callsResponse.json()

            const response = await fetch(getApiUrl('api/reports/generate-report'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reportName,
                    customPrompt: userPrompt,
                    calls: callsData.calls.map((call) => ({
                        ...call,
                        id: call.RECORDING_URL || `${call.EMPLOYEE_ID}-${call.TIMESTAMP}`
                    }))
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create report')
            }

            const responseData = await response.json()
            navigate(`/reports/${responseData.id}`)
        } catch (error) {
            console.error('Error creating report:', error)
            alert(`Failed to create report: ${error.message}`)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCreateNewScheduledReport = () => {
        setIsCreatingScheduledReport(true)
    }

    const handleSaveNewScheduledReport = async () => {
        await fetchScheduledReports()
        setIsCreatingScheduledReport(false)
    }

    const handleToggleStatus = async (e, report) => {
        e.stopPropagation()
        const newStatus = report.status === 'active' ? 'paused' : 'active'

        try {
            const response = await fetch(getApiUrl(`api/scheduled-reports/${report.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update report status')
            }

            await fetchScheduledReports()
        } catch (error) {
            console.error('Error updating report status:', error)
            alert(`Failed to update status: ${error.message}`)
        }
    }

    const renderReportsList = () => (
        <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <List>
                {reports.map((report) => (
                    <ListItem
                        key={report.id}
                        button
                        onClick={() => handleReportSelect(report)}
                        sx={{
                            '& .MuiListItemText-primary': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit'
                            },
                            '& .MuiListItemText-secondary': {
                                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
                            }
                        }}
                    >
                        <ListItemText primary={report.name} secondary={new Date(report.created_at).toLocaleString()} />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge='end'
                                aria-label='edit'
                                onClick={(e) => handleEditClick(e, report)}
                                sx={{
                                    mr: 1,
                                    color: mode === 'dark' ? '#ffffff' : 'inherit'
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                edge='end'
                                aria-label='delete'
                                onClick={(e) => handleDelete(e, report)}
                                sx={{
                                    color: mode === 'dark' ? '#ffffff' : 'inherit'
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Paper>
    )

    const renderScheduledReports = () => (
        <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Alert severity='info' sx={{ m: 2 }}>
                This is a demo account. Scheduled reports are available in the paid version. Contact sales for more information.
            </Alert>

            {scheduledReports.length === 0 ? (
                <EmptyScheduledReports onCreateNew={handleCreateNewScheduledReport} />
            ) : (
                <List>
                    {scheduledReports.map((report) => (
                        <ListItem
                            key={report.id}
                            sx={{
                                '& .MuiListItemText-primary': {
                                    color: mode === 'dark' ? '#ffffff' : 'inherit'
                                },
                                '& .MuiListItemText-secondary': {
                                    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
                                },
                                '& .MuiTypography-root': {
                                    color: mode === 'dark' ? '#ffffff' : 'inherit'
                                }
                            }}
                        >
                            <ListItemText
                                primary={report.name}
                                secondary={
                                    <Box>
                                        <Typography variant='body2' color={mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                                            Schedule: {formatCronExpression(report.schedule)}
                                        </Typography>
                                        <Typography variant='body2' color={mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                                            Last Run: {report.last_run_at ? new Date(report.last_run_at).toLocaleString() : 'Never'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                variant='body2'
                                                color={mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}
                                            >
                                                Status:
                                            </Typography>
                                            <Switch
                                                size='small'
                                                checked={report.status === 'active'}
                                                onChange={(e) => handleToggleStatus(e, report)}
                                                color='success'
                                            />
                                            <Typography
                                                variant='body2'
                                                color={
                                                    report.status === 'active'
                                                        ? 'success.main'
                                                        : mode === 'dark'
                                                        ? 'rgba(255, 255, 255, 0.7)'
                                                        : 'text.secondary'
                                                }
                                            >
                                                {report.status === 'active' ? 'Active' : 'Paused'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge='end'
                                    aria-label='edit'
                                    onClick={(e) => handleEditScheduledReport(e, report)}
                                    sx={{
                                        mr: 1,
                                        color: mode === 'dark' ? '#ffffff' : 'inherit'
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge='end'
                                    aria-label='delete'
                                    onClick={(e) => handleDeleteScheduledReport(e, report)}
                                    sx={{
                                        color: mode === 'dark' ? '#ffffff' : 'inherit'
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            )}

            <EditScheduledReportModal
                open={!!editingScheduledReport || isCreatingScheduledReport}
                onClose={() => {
                    setEditingScheduledReport(null)
                    setIsCreatingScheduledReport(false)
                }}
                report={editingScheduledReport}
                onSave={editingScheduledReport ? handleSaveScheduledReport : handleSaveNewScheduledReport}
            />
        </Paper>
    )

    const renderReportSettings = () => (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant='subtitle1' gutterBottom>
                    Filter Settings
                </Typography>
                <Paper sx={{ p: 1.5, mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            flexWrap: 'wrap'
                        }}
                    >
                        {/* Resolution and Escalation filters */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
                            <FormControl size='small' sx={{ width: 120 }}>
                                <InputLabel>Resolution</InputLabel>
                                <Select
                                    value={reportFilters.resolutionStatus}
                                    label='Resolution'
                                    onChange={(e) =>
                                        setReportFilters((prev) => ({
                                            ...prev,
                                            resolutionStatus: e.target.value
                                        }))
                                    }
                                >
                                    <MenuItem value='all'>All</MenuItem>
                                    <MenuItem value='resolved'>Resolved</MenuItem>
                                    <MenuItem value='dispatch'>Dispatch</MenuItem>
                                    <MenuItem value='escalated'>Escalated</MenuItem>
                                    <MenuItem value='followup'>Follow-up</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size='small' sx={{ width: 120 }}>
                                <InputLabel>Escalated</InputLabel>
                                <Select
                                    value={reportFilters.escalated}
                                    label='Escalated'
                                    onChange={(e) =>
                                        setReportFilters((prev) => ({
                                            ...prev,
                                            escalated: e.target.value
                                        }))
                                    }
                                >
                                    <MenuItem value='all'>All</MenuItem>
                                    <MenuItem value='true'>Yes</MenuItem>
                                    <MenuItem value='false'>No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Call Type, Employee, and Tag filters */}
                        <Box sx={{ width: '100%' }}>
                            <CallFilters onFilterChange={handleCallFilterChange} filters={reportFilters} />
                        </Box>

                        {/* Sentiment range on new line */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                mt: 2
                            }}
                        >
                            <Typography variant='subtitle2' gutterBottom>
                                Sentiment Range
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    px: 2,
                                    width: '100%'
                                }}
                            >
                                <Typography variant='body2'>{SENTIMENT_EMOJIS[reportFilters.sentimentRange[0]]}</Typography>
                                <Slider
                                    value={reportFilters.sentimentRange}
                                    onChange={(_, newValue) =>
                                        setReportFilters((prev) => ({
                                            ...prev,
                                            sentimentRange: newValue
                                        }))
                                    }
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
                                <Typography variant='body2'>{SENTIMENT_EMOJIS[reportFilters.sentimentRange[1]]}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Grid>

            <Grid item xs={12}>
                <FormControl fullWidth size='small'>
                    <InputLabel>Report Type</InputLabel>
                    <Select value={selectedReportType} label='Report Type' onChange={handleReportTypeChange}>
                        {Object.values(REPORT_TYPES).map((type) => (
                            <MenuItem key={type.id} value={type.id} disabled={type.id === 'custom'}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {type.label}
                                    {type.id === 'custom' && <LockIcon fontSize='small' />}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>{Object.values(REPORT_TYPES).find((t) => t.id === selectedReportType)?.description}</FormHelperText>
                </FormControl>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label='Report Name'
                    variant='outlined'
                    size='small'
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    required
                />
            </Grid>

            <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                        fullWidth
                        label='Analysis Instructions'
                        variant='outlined'
                        multiline
                        rows={4}
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        required
                        helperText='Specify what you want to analyze. Click the enhance button to improve your instructions with AI assistance.'
                    />
                    <Tooltip title='Enhance your analysis instructions with AI'>
                        <span>
                            <IconButton onClick={handleSuggestPrompt} color='primary' sx={{ mt: 0.5 }} disabled={!userPrompt.trim()}>
                                <AutoFixHighIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Grid>

            <Grid item xs={12}>
                <Typography variant='subtitle1' gutterBottom sx={{ mt: 2 }}>
                    Schedule Settings
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={<Switch checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} />}
                    label='Schedule Report'
                />
            </Grid>
            {isScheduled && (
                <>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Frequency</InputLabel>
                            <Select value={scheduleFrequency} label='Frequency' onChange={(e) => setScheduleFrequency(e.target.value)}>
                                <MenuItem value='daily'>Daily</MenuItem>
                                <MenuItem value='weekly'>Weekly</MenuItem>
                                <MenuItem value='monthly'>Monthly</MenuItem>
                                <MenuItem value='quarterly'>Quarterly</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                            This report will run automatically at the specified frequency. The analysis will be performed on calls that
                            match your selected filters above.
                        </Typography>
                    </Grid>
                </>
            )}
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                        variant='contained'
                        onClick={handleCreateReport}
                        disabled={
                            isGenerating ||
                            !reportName.trim() ||
                            !userPrompt.trim() ||
                            (!isScheduled && (selectedCalls.length === 0 || selectedCalls.length > 10))
                        }
                    >
                        {isGenerating ? 'Generating Report...' : isScheduled ? 'Save Scheduled Report' : 'Create Report'}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    )

    const renderCreateReport = () => (
        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 250px)' }}>
            <Paper sx={{ p: 2, width: '50%', overflow: 'auto' }}>
                <Typography variant='h6' gutterBottom>
                    Report Settings
                </Typography>
                {renderReportSettings()}
            </Paper>

            {!isScheduled && (
                <Box sx={{ width: '50%' }}>
                    <Alert severity='info' sx={{ mb: 2 }}>
                        Demo Account: Limited to 10 calls per report. Upgrade to access unlimited calls, thinking models, and enhanced
                        analysis with accuracy review.
                    </Alert>
                    <CallList
                        isEmbedded={true}
                        onSelectionChange={(newSelection) => {
                            // Limit selection to 10 calls
                            if (newSelection.length > 10) {
                                setSelectedCalls(newSelection.slice(0, 10))
                            } else {
                                setSelectedCalls(newSelection)
                            }
                        }}
                        selectedCalls={selectedCalls}
                        showSelection={true}
                        hideFilters={true}
                        filters={reportFilters}
                        onFilterChange={handleFilterChange}
                    />
                    {selectedCalls.length === 10 && (
                        <Typography variant='body2' color='warning.main' sx={{ mt: 1 }}>
                            Maximum call limit reached (10 calls). Upgrade to analyze more calls simultaneously.
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    )

    const renderLoadingOverlay = () => (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.drawer + 1,
                flexDirection: 'column',
                gap: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }}
            open={isGenerating}
        >
            <Box sx={{ width: '80%', maxWidth: 600 }}>
                <Typography variant='h5' gutterBottom align='center' sx={{ mb: 1 }}>
                    Generating Report: {reportName}
                </Typography>
                <Typography variant='body1' gutterBottom align='center' sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Analysis Instructions: {userPrompt}
                </Typography>
                <Typography variant='h6' gutterBottom align='center' sx={{ mb: 3 }}>
                    {generationMessage}
                </Typography>
                <LinearProgress
                    variant='determinate'
                    value={Math.min(progress, 100)}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: 'primary.light'
                        }
                    }}
                />
                <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }} align='center'>
                    {Math.round(progress)}% Complete
                </Typography>
            </Box>
        </Backdrop>
    )

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', p: 2 }}>
            {renderLoadingOverlay()}
            <Typography variant='h4' component='h1' gutterBottom color={mode === 'dark' ? '#ffffff' : 'inherit'}>
                Reports
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
                        },
                        '& .MuiTab-root.Mui-selected': {
                            color: mode === 'dark' ? '#24C3A1' : 'primary.main'
                        }
                    }}
                >
                    <Tab label='Create Report' />
                    <Tab label='Report List' />
                    <Tab label='Scheduled Reports' />
                </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
                {renderCreateReport()}
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                {renderReportsList()}
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                {renderScheduledReports()}
            </TabPanel>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                        color: mode === 'dark' ? '#ffffff' : 'inherit'
                    }
                }}
            >
                <DialogTitle sx={{ color: mode === 'dark' ? '#ffffff' : 'inherit' }}>Edit Report Name</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin='dense'
                        label='Report Name'
                        type='text'
                        fullWidth
                        value={newReportName}
                        onChange={(e) => setNewReportName(e.target.value)}
                        InputLabelProps={{
                            style: {
                                color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined
                            }
                        }}
                        InputProps={{
                            style: { color: mode === 'dark' ? '#ffffff' : undefined }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined
                                },
                                '&:hover fieldset': {
                                    borderColor: mode === 'dark' ? '#24C3A1' : undefined
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: mode === 'dark' ? '#24C3A1' : undefined
                                }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: mode === 'dark' ? '#ffffff' : undefined }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant='contained'
                        sx={{
                            backgroundColor: mode === 'dark' ? '#24C3A1' : undefined,
                            '&:hover': {
                                backgroundColor: mode === 'dark' ? '#1a8f76' : undefined
                            }
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ReportsPage
