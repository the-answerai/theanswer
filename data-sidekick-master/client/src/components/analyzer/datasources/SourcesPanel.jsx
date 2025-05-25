import { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    IconButton,
    CircularProgress,
    Alert,
    AlertTitle,
    Divider,
    Chip,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import LinkIcon from '@mui/icons-material/Link'
import ErrorIcon from '@mui/icons-material/Error'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import SyncIcon from '@mui/icons-material/Sync'
import ArticleIcon from '@mui/icons-material/Article'
import StorageIcon from '@mui/icons-material/Storage'
import LanguageIcon from '@mui/icons-material/Language'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CallIcon from '@mui/icons-material/Call'
import ChatIcon from '@mui/icons-material/Chat'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import PropTypes from 'prop-types'
import axios from 'axios'

// Import source panel components
import { WebSourcePanel, FileSourcePanel, CallSourcePanel, ChatSourcePanel, TicketSourcePanel } from './index'

const SourcesPanel = ({ researchView, onDataSourcesChange, onSelectSourceType, onViewDocuments }) => {
    const [dataSources, setDataSources] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [openSourceTypeDialog, setOpenSourceTypeDialog] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [refreshingSourceId, setRefreshingSourceId] = useState(null)
    const [selectedSource, setSelectedSource] = useState(null)
    const [vectorizing, setVectorizing] = useState(false)
    const [vectorizeSuccess, setVectorizeSuccess] = useState(false)
    const [vectorizeError, setVectorizeError] = useState(null)
    const [vectorizeStats, setVectorizeStats] = useState(null)
    const [showDocuments, setShowDocuments] = useState(false)
    const [sourceDocuments, setSourceDocuments] = useState([])
    const [loadingDocuments, setLoadingDocuments] = useState(false)

    // Additional states for source type configuration
    const [showWebPanel, setShowWebPanel] = useState(false)
    const [activeSourceType, setActiveSourceType] = useState(null)
    const [editingSource, setEditingSource] = useState(null)

    // Format date helper function
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown'
        try {
            return new Date(dateStr).toLocaleDateString()
        } catch {
            return 'Invalid Date'
        }
    }

    // Fetch data sources
    const fetchDataSources = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`/api/analyzer/research-views/${researchView.id}/sources`)
            setDataSources(response.data.data || [])
        } catch (err) {
            console.error('Error fetching data sources:', err)
            setError('Failed to load data sources. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [researchView?.id])

    // Fetch data sources when the research view changes
    useEffect(() => {
        if (researchView?.id) {
            fetchDataSources()
        }
    }, [researchView, fetchDataSources])

    // Handle opening the source type selection dialog
    const handleOpenSourceTypeDialog = () => {
        setOpenSourceTypeDialog(true)
    }

    // Handle closing the source type selection dialog
    const handleCloseSourceTypeDialog = () => {
        setOpenSourceTypeDialog(false)
    }

    // Handle selecting a source type
    const handleSelectSourceType = (sourceType) => {
        handleCloseSourceTypeDialog()

        switch (sourceType) {
            case 'web':
                setShowWebPanel(true)
                break
            case 'file':
            case 'calls':
            case 'chats':
            case 'tickets':
                setActiveSourceType(sourceType)
                break
            default:
                if (onSelectSourceType) {
                    onSelectSourceType(sourceType)
                }
                break
        }
    }

    // Handle back to sources
    const handleBackToSources = () => {
        setShowDocuments(false)
        setSelectedSource(null)
        setSourceDocuments([])
        setActiveSourceType(null)
        setEditingSource(null)
    }

    // Delete data source confirmation
    const handleOpenDeleteDialog = (source) => {
        setSelectedSource(source)
        setOpenDeleteDialog(true)
    }

    // Handle delete dialog close
    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false)
        setSelectedSource(null)
    }

    // Delete data source
    const handleDeleteDataSource = async () => {
        try {
            await axios.delete(`/api/analyzer/data-sources/${selectedSource.id}`)
            fetchDataSources()
            handleCloseDeleteDialog()

            // Notify parent
            if (onDataSourcesChange) {
                onDataSourcesChange()
            }
        } catch (err) {
            console.error('Error deleting data source:', err)
            setError('Failed to delete data source. Please try again.')
        }
    }

    // Refresh data source
    const handleRefreshDataSource = async (source) => {
        try {
            setRefreshingSourceId(source.id)
            await axios.post(`/api/analyzer/data-sources/${source.id}/refresh`)

            // Update the status locally
            const updatedSources = dataSources.map((ds) => (ds.id === source.id ? { ...ds, status: 'fetching' } : ds))
            setDataSources(updatedSources)

            // Fetch sources after a short delay to show updated status
            setTimeout(() => {
                fetchDataSources()
            }, 2000)

            // Notify parent
            if (onDataSourcesChange) {
                onDataSourcesChange()
            }
        } catch (err) {
            console.error('Error refreshing data source:', err)
            setError('Failed to refresh data source. Please try again.')
        } finally {
            setRefreshingSourceId(null)
        }
    }

    // Get icon based on status
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CloudDoneIcon color='success' />
            case 'pending':
                return <HourglassEmptyIcon color='warning' />
            case 'fetching':
                return <SyncIcon color='info' />
            case 'error':
                return <ErrorIcon color='error' />
            default:
                return <HourglassEmptyIcon />
        }
    }

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Completed'
            case 'pending':
                return 'Pending'
            case 'fetching':
                return 'Fetching'
            case 'error':
                return 'Error'
            default:
                return 'Unknown'
        }
    }

    // Add a handler for vectorizing documents
    const handleVectorizeDocuments = async () => {
        if (!researchView || !researchView.id) {
            setError('Research view not found')
            return
        }

        setVectorizing(true)
        setVectorizeSuccess(false)
        setVectorizeError(null)
        setVectorizeStats(null)

        try {
            const response = await axios.post(`/api/analyzer/research-views/${researchView.id}/vectorize`)

            console.log('Vectorization response:', response.data)

            // Extract stats from the response if available
            if (response.data.result) {
                const stats = {
                    numAdded: response.data.result.numAdded || 0,
                    numDeleted: response.data.result.numDeleted || 0,
                    numUpdated: response.data.result.numUpdated || 0,
                    numSkipped: response.data.result.numSkipped || 0,
                    totalKeys: response.data.result.totalKeys || 0
                }
                setVectorizeStats(stats)
            }

            setVectorizeSuccess(true)

            // Show success message temporarily
            setTimeout(() => {
                setVectorizeSuccess(false)
            }, 15000) // Show for 15 seconds to give users time to see the stats
        } catch (err) {
            console.error('Error vectorizing documents:', err)
            const errMessage = err.response?.data?.error || err.response?.data?.details || 'Failed to vectorize documents'
            setVectorizeError(errMessage)
        } finally {
            setVectorizing(false)
        }
    }

    // Fetch documents for a specific source
    const fetchSourceDocuments = async (source) => {
        try {
            setLoadingDocuments(true)
            setError(null)
            const response = await axios.get(`/api/analyzer/data-sources/${source.id}/documents`)
            setSourceDocuments(response.data.data || [])
            setSelectedSource(source)
            setShowDocuments(true)
        } catch (err) {
            console.error('Error fetching documents:', err)
            setError('Failed to load documents. Please try again.')
        } finally {
            setLoadingDocuments(false)
        }
    }

    // View source documents or edit source configuration
    const handleViewSource = (source) => {
        // If onViewDocuments prop is provided, use it
        if (onViewDocuments) {
            onViewDocuments(source)
            return
        }

        // Get the source type to determine which component to show
        let sourceType = source.sourceType

        // Convert between backend and frontend naming conventions
        if (sourceType === 'website') sourceType = 'web'
        if (sourceType === 'file_upload') sourceType = 'file'

        setEditingSource(source)
        setActiveSourceType(sourceType)
    }

    // Handle adding web source
    const handleAddWebSource = async (payload) => {
        try {
            await axios.post(`/api/analyzer/research-views/${researchView.id}/sources`, payload)

            setShowWebPanel(false)
            fetchDataSources()

            // Notify parent
            if (onDataSourcesChange) {
                onDataSourcesChange()
            }
        } catch (err) {
            console.error('Error adding web source:', err)
            setError('Failed to add web source. Please try again.')
        }
    }

    // Determine which source type panel to render
    const renderSourceTypePanel = () => {
        switch (activeSourceType) {
            case 'file':
                return (
                    <FileSourcePanel
                        onBack={handleBackToSources}
                        researchViewId={researchView.id}
                        onAddSource={() => {
                            fetchDataSources()
                            if (onDataSourcesChange) onDataSourcesChange()
                        }}
                        source={editingSource}
                    />
                )
            case 'calls':
                return (
                    <CallSourcePanel
                        onBack={handleBackToSources}
                        researchViewId={researchView.id}
                        onAddSource={() => {
                            fetchDataSources()
                            if (onDataSourcesChange) onDataSourcesChange()
                        }}
                        source={editingSource}
                    />
                )
            case 'chats':
                return (
                    <ChatSourcePanel
                        onBack={handleBackToSources}
                        researchViewId={researchView.id}
                        onAddSource={() => {
                            fetchDataSources()
                            if (onDataSourcesChange) onDataSourcesChange()
                        }}
                        source={editingSource}
                    />
                )
            case 'tickets':
                return (
                    <TicketSourcePanel
                        onBack={handleBackToSources}
                        researchViewId={researchView.id}
                        onAddSource={() => {
                            fetchDataSources()
                            if (onDataSourcesChange) onDataSourcesChange()
                        }}
                        source={editingSource}
                    />
                )
            default:
                return null
        }
    }

    // Get source icon based on source type
    const getSourceTypeIcon = (sourceType) => {
        switch (sourceType) {
            case 'website':
                return <LanguageIcon />
            case 'file_upload':
                return <InsertDriveFileIcon />
            case 'calls':
                return <CallIcon />
            case 'chats':
                return <ChatIcon />
            case 'tickets':
                return <ConfirmationNumberIcon />
            default:
                return <ArticleIcon />
        }
    }

    // Get source type display name
    const getSourceTypeName = (sourceType) => {
        switch (sourceType) {
            case 'website':
                return 'Website'
            case 'file_upload':
                return 'File'
            case 'calls':
                return 'Calls'
            case 'chats':
                return 'Chats'
            case 'tickets':
                return 'Tickets'
            default:
                return sourceType
        }
    }

    return (
        <Box>
            {activeSourceType ? (
                renderSourceTypePanel()
            ) : showDocuments ? (
                <Box>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                        <Box>
                            <Button variant='outlined' onClick={handleBackToSources} startIcon={<ArticleIcon />} sx={{ mb: 2 }}>
                                Back to Sources
                            </Button>
                            <Typography variant='h5'>Documents from {selectedSource?.url || selectedSource?.file_path}</Typography>
                        </Box>
                    </Box>

                    {loadingDocuments ? (
                        <Box display='flex' justifyContent='center' alignItems='center' height='200px'>
                            <CircularProgress />
                        </Box>
                    ) : sourceDocuments.length === 0 ? (
                        <Alert severity='info'>
                            <AlertTitle>No Documents</AlertTitle>
                            This source doesn&apos;t have any documents yet. You may need to refresh the source.
                        </Alert>
                    ) : (
                        <Box>
                            {/* Show table of documents - removed for brevity */}
                            <Typography variant='body1'>{sourceDocuments.length} documents found</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Last updated: {formatDate(selectedSource?.last_fetched_at || '')}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                <>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                        <Typography variant='h5'>Sources</Typography>
                        <Box>
                            <Button
                                variant='outlined'
                                startIcon={<StorageIcon />}
                                onClick={handleVectorizeDocuments}
                                disabled={vectorizing || dataSources.length === 0}
                                sx={{ mr: 2 }}
                            >
                                {vectorizing ? (
                                    <>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Vectorizing...
                                    </>
                                ) : (
                                    'Vectorize'
                                )}
                            </Button>
                            <Fab color='primary' aria-label='add' size='medium' onClick={handleOpenSourceTypeDialog}>
                                <AddIcon />
                            </Fab>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {vectorizeError && (
                        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setVectorizeError(null)}>
                            <AlertTitle>Vectorization Error</AlertTitle>
                            {vectorizeError}
                        </Alert>
                    )}

                    {vectorizeSuccess && (
                        <Alert severity='success' sx={{ mb: 3 }} onClose={() => setVectorizeSuccess(false)}>
                            <AlertTitle>Success</AlertTitle>
                            Documents are being vectorized successfully.
                            {vectorizeStats && (
                                <Box mt={1} sx={{ fontSize: '0.9rem' }}>
                                    <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        Vectorization Results:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6} md={2.4}>
                                            <Chip
                                                label={`${vectorizeStats.numAdded} Added`}
                                                size='small'
                                                color='success'
                                                variant='outlined'
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2.4}>
                                            <Chip
                                                label={`${vectorizeStats.numDeleted} Deleted`}
                                                size='small'
                                                color='error'
                                                variant='outlined'
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2.4}>
                                            <Chip
                                                label={`${vectorizeStats.numUpdated} Updated`}
                                                size='small'
                                                color='info'
                                                variant='outlined'
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2.4}>
                                            <Chip
                                                label={`${vectorizeStats.numSkipped} Skipped`}
                                                size='small'
                                                color='default'
                                                variant='outlined'
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={2.4}>
                                            <Chip
                                                label={`${vectorizeStats.totalKeys} Total`}
                                                size='small'
                                                color='primary'
                                                variant='outlined'
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Alert>
                    )}

                    {loading ? (
                        <Box display='flex' justifyContent='center' alignItems='center' height='200px'>
                            <CircularProgress />
                        </Box>
                    ) : dataSources.length === 0 ? (
                        <Alert severity='info' sx={{ mb: 3 }}>
                            <AlertTitle>No Sources</AlertTitle>
                            Add your first source to start collecting content for analysis.
                        </Alert>
                    ) : (
                        <Grid container spacing={3}>
                            {dataSources.map((source) => (
                                <Grid item xs={12} md={6} key={source.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                boxShadow: 3
                                            }
                                        }}
                                        onClick={() => handleViewSource(source)}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            {/* Header with status */}
                                            <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
                                                <Box display='flex' alignItems='center'>
                                                    <Box display='flex' alignItems='center' mr={1}>
                                                        {getSourceTypeIcon(source.sourceType)}
                                                        <Typography variant='h6' component='div' ml={1}>
                                                            {getSourceTypeName(source.sourceType)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        size='small'
                                                        icon={getStatusIcon(source.status)}
                                                        label={getStatusText(source.status)}
                                                        color={
                                                            source.status === 'error'
                                                                ? 'error'
                                                                : source.status === 'completed'
                                                                ? 'success'
                                                                : 'default'
                                                        }
                                                        variant='outlined'
                                                    />
                                                </Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {source.document_count || 0} Documents
                                                </Typography>
                                            </Box>

                                            {/* URL or File Path */}
                                            <Box display='flex' alignItems='center' mb={1}>
                                                <LinkIcon fontSize='small' sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography
                                                    variant='body2'
                                                    component='div'
                                                    sx={{
                                                        wordBreak: 'break-all',
                                                        whiteSpace: 'normal'
                                                    }}
                                                >
                                                    {source.url || source.file_path}
                                                </Typography>
                                            </Box>

                                            {/* Filters */}
                                            {(source.filter_date_start || source.filter_date_end || source.filter_paths) && (
                                                <>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant='subtitle2' component='div' sx={{ mb: 1 }}>
                                                        Filters:
                                                    </Typography>
                                                    <Box sx={{ ml: 1 }}>
                                                        {source.filter_date_start && (
                                                            <Typography variant='body2' color='text.secondary'>
                                                                From: {new Date(source.filter_date_start).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                        {source.filter_date_end && (
                                                            <Typography variant='body2' color='text.secondary'>
                                                                To: {new Date(source.filter_date_end).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                        {source.filter_paths && (
                                                            <Typography variant='body2' color='text.secondary'>
                                                                Paths: {source.filter_paths.join(', ')}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </>
                                            )}

                                            {/* Error message if any */}
                                            {source.status === 'error' && source.error_message && (
                                                <Alert severity='error' sx={{ mt: 2 }}>
                                                    {source.error_message}
                                                </Alert>
                                            )}
                                        </CardContent>
                                        <CardActions>
                                            <Button
                                                size='small'
                                                startIcon={<ArticleIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    fetchSourceDocuments(source)
                                                }}
                                            >
                                                View Documents
                                            </Button>
                                            <Button
                                                size='small'
                                                startIcon={<RefreshIcon />}
                                                disabled={refreshingSourceId === source.id}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRefreshDataSource(source)
                                                }}
                                            >
                                                {refreshingSourceId === source.id ? (
                                                    <>
                                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                                        Refreshing...
                                                    </>
                                                ) : (
                                                    'Refresh'
                                                )}
                                            </Button>
                                            <IconButton
                                                size='small'
                                                color='error'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenDeleteDialog(source)
                                                }}
                                            >
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}

            {/* Web Source Panel */}
            <WebSourcePanel isOpen={showWebPanel} onClose={() => setShowWebPanel(false)} onAdd={handleAddWebSource} />

            {/* Add Source Type Dialog */}
            <Dialog open={openSourceTypeDialog} onClose={handleCloseSourceTypeDialog} maxWidth='sm' fullWidth>
                <DialogTitle>Choose Source Type</DialogTitle>
                <DialogContent>
                    <List sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <ListItem
                                    button
                                    onClick={() => handleSelectSourceType('web')}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '8px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', fontSize: '2rem', mb: 1 }}>
                                        <LanguageIcon fontSize='inherit' color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary='Web' primaryTypographyProps={{ align: 'center' }} />
                                </ListItem>
                            </Grid>
                            <Grid item xs={4}>
                                <ListItem
                                    button
                                    onClick={() => handleSelectSourceType('file')}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '8px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', fontSize: '2rem', mb: 1 }}>
                                        <InsertDriveFileIcon fontSize='inherit' color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary='Files' primaryTypographyProps={{ align: 'center' }} />
                                </ListItem>
                            </Grid>
                            <Grid item xs={4}>
                                <ListItem
                                    button
                                    onClick={() => handleSelectSourceType('calls')}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '8px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', fontSize: '2rem', mb: 1 }}>
                                        <CallIcon fontSize='inherit' color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary='Calls' primaryTypographyProps={{ align: 'center' }} />
                                </ListItem>
                            </Grid>
                            <Grid item xs={4}>
                                <ListItem
                                    button
                                    onClick={() => handleSelectSourceType('chats')}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '8px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', fontSize: '2rem', mb: 1 }}>
                                        <ChatIcon fontSize='inherit' color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary='Chats' primaryTypographyProps={{ align: 'center' }} />
                                </ListItem>
                            </Grid>
                            <Grid item xs={4}>
                                <ListItem
                                    button
                                    onClick={() => handleSelectSourceType('tickets')}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0, 0, 0, 0.12)',
                                        borderRadius: '8px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            borderColor: 'primary.main'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 'auto', fontSize: '2rem', mb: 1 }}>
                                        <ConfirmationNumberIcon fontSize='inherit' color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary='Tickets' primaryTypographyProps={{ align: 'center' }} />
                                </ListItem>
                            </Grid>
                        </Grid>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSourceTypeDialog}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Delete Source</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this source? This action cannot be undone and will delete all associated documents
                        and metadata.
                    </Typography>
                    {selectedSource && (
                        <Box mt={2} p={2} bgcolor='#f5f5f5' borderRadius={1}>
                            <Typography variant='subtitle2'>
                                {getSourceTypeName(selectedSource.sourceType)}: {selectedSource.url || selectedSource.file_path}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Documents: {selectedSource.document_count || 0}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteDataSource} variant='contained' color='error'>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

SourcesPanel.propTypes = {
    researchView: PropTypes.object.isRequired,
    onDataSourcesChange: PropTypes.func,
    onSelectSourceType: PropTypes.func.isRequired,
    onViewDocuments: PropTypes.func
}

export default SourcesPanel
