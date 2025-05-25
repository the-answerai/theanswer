import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Typography,
    Button,
    Tabs,
    Tab,
    Divider,
    CircularProgress,
    Alert,
    Paper,
    Breadcrumbs,
    Link as MuiLink,
    Chip,
    Tooltip
} from '@mui/material'
import axios from 'axios'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChatIcon from '@mui/icons-material/Chat'
import StorageIcon from '@mui/icons-material/Storage'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import CloudIcon from '@mui/icons-material/Cloud'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import DataSourcesPanel from '../components/analyzer/DataSourcesPanel'
import AnalysisPanel from '../components/analyzer/AnalysisPanel'
import FilesTab from '../components/analyzer/FilesTab'
import ReportsPanel from '../components/analyzer/ReportsPanel'
import { useResearchView } from '../context/ResearchViewContext.jsx'
import PropTypes from 'prop-types'

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`research-view-tabpanel-${index}`}
            aria-labelledby={`research-view-tab-${index}`}
            style={{ width: '100%' }}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    )
}

// Add prop types validation for TabPanel
TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired
}

const ResearchViewPage = () => {
    const { viewId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [researchView, setResearchView] = useState(null)
    const [tabValue, setTabValue] = useState(0)
    const { setCurrentResearchView } = useResearchView()

    // Fetch research view details
    const fetchResearchView = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/analyzer/research-views/${viewId}`)
            setResearchView(response.data.data)
            setCurrentResearchView(response.data.data) // Set in global context
            setError(null)
        } catch (err) {
            console.error('Error fetching research view:', err)
            setError(err.response?.data?.error || 'An error occurred while fetching the research view.')
        } finally {
            setLoading(false)
        }
    }, [viewId, setCurrentResearchView])

    // Fetch data on component mount
    useEffect(() => {
        fetchResearchView()

        // Clean up function to clear the research view from context when component unmounts
        return () => setCurrentResearchView(null)
    }, [fetchResearchView, setCurrentResearchView])

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    // Navigate back to research views list
    const handleGoBack = () => {
        navigate('/analyzer')
    }

    // Handle refresh
    const handleRefresh = () => {
        fetchResearchView()
    }

    // Loading state
    if (loading) {
        return (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
                <CircularProgress />
            </Box>
        )
    }

    // Error state
    if (error) {
        return (
            <Box p={3}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
                    Back to Research Views
                </Button>
                <Alert severity='error'>
                    {error}
                    <Button size='small' onClick={fetchResearchView} sx={{ ml: 2 }}>
                        Try Again
                    </Button>
                </Alert>
            </Box>
        )
    }

    // If no research view is found
    if (!researchView) {
        return (
            <Box p={3}>
                <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ mb: 2 }}>
                    Back to Research Views
                </Button>
                <Alert severity='warning'>Research view not found. It may have been deleted.</Alert>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Breadcrumbs navigation */}
            <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
                <MuiLink underline='hover' color='inherit' sx={{ cursor: 'pointer' }} onClick={handleGoBack}>
                    Research Views
                </MuiLink>
                <Typography color='text.primary'>{researchView.name}</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={3}>
                <Box>
                    <Typography variant='h4' component='h1'>
                        {researchView.name}
                    </Typography>
                    {researchView.description && (
                        <Typography variant='body1' color='text.secondary' sx={{ mt: 1, mb: 2, maxWidth: '800px' }}>
                            {researchView.description}
                        </Typography>
                    )}

                    {/* Stats */}
                    <Box display='flex' gap={2} mt={2}>
                        <Chip label={`${researchView.data_sources?.length || 0} Data Sources`} variant='outlined' size='small' />
                        <Chip label={`${researchView.document_count || 0} Documents`} variant='outlined' size='small' />
                        <Chip label={`Created ${new Date(researchView.created_at).toLocaleDateString()}`} variant='outlined' size='small' />

                        {/* Chatflow link */}
                        {researchView.answerai_chatflow_id && (
                            <Tooltip title='Edit Chatflow'>
                                <Chip
                                    icon={<ChatIcon fontSize='small' />}
                                    label='Edit Chatflow'
                                    variant='outlined'
                                    size='small'
                                    component='a'
                                    href={`${import.meta.env.VITE_ANSWERAI_STUDIO_URL || 'http://localhost:3000'}/sidekick-studio/canvas/${
                                        researchView.answerai_chatflow_id
                                    }`}
                                    target='_blank'
                                    clickable
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'primary.contrastText'
                                        }
                                    }}
                                />
                            </Tooltip>
                        )}

                        {/* Document Store link */}
                        {researchView.answerai_store_id && (
                            <Tooltip title='Open Document Store'>
                                <Chip
                                    icon={<StorageIcon fontSize='small' />}
                                    label='Document Store'
                                    variant='outlined'
                                    size='small'
                                    component='a'
                                    href={`${
                                        import.meta.env.VITE_ANSWERAI_STUDIO_URL || 'http://localhost:3000'
                                    }/sidekick-studio/document-stores/${researchView.answerai_store_id}`}
                                    target='_blank'
                                    clickable
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'primary.contrastText'
                                        }
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                <Button variant='outlined' onClick={handleRefresh} sx={{ minWidth: '100px' }}>
                    Refresh
                </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Tabs */}
            <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label='research view tabs' variant='scrollable' scrollButtons='auto'>
                    <Tab label='Sources' id='research-view-tab-0' icon={<CloudIcon />} iconPosition='end' />
                    <Tab label='Files' id='research-view-tab-1' icon={<AttachFileIcon />} iconPosition='end' />
                    <Tab label='Analysis' id='research-view-tab-2' icon={<AnalyticsIcon />} iconPosition='end' />
                    <Tab label='Reports' id='research-view-tab-3' icon={<ChatIcon />} iconPosition='end' />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
                <DataSourcesPanel researchView={researchView} onDataSourcesChange={fetchResearchView} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <FilesTab researchView={researchView} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <AnalysisPanel researchView={researchView} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                <ReportsPanel researchView={researchView} />
            </TabPanel>
        </Box>
    )
}

export default ResearchViewPage
