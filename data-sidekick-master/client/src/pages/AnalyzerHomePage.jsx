import { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AnalyzerHomePage = () => {
    const navigate = useNavigate()
    const [researchViews, setResearchViews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [openDialog, setOpenDialog] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [selectedView, setSelectedView] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    })

    // Fetch research views
    const fetchResearchViews = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get('/api/analyzer/research-views')
            setResearchViews(response.data.data || [])
        } catch (err) {
            console.error('Error fetching research views:', err)
            setError('Failed to load research views. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchResearchViews()
    }, [fetchResearchViews])

    // Handle opening the create/edit dialog
    const handleOpenDialog = (view = null) => {
        if (view) {
            setFormData({
                name: view.name,
                description: view.description || ''
            })
            setSelectedView(view)
        } else {
            setFormData({
                name: '',
                description: ''
            })
            setSelectedView(null)
        }
        setOpenDialog(true)
    }

    // Handle dialog close
    const handleCloseDialog = () => {
        setOpenDialog(false)
        setSelectedView(null)
    }

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Save research view (create or update)
    const handleSaveResearchView = async () => {
        try {
            if (!formData.name.trim()) {
                setError('Research view name is required')
                return
            }

            if (selectedView) {
                // Update existing view
                await axios.put(`/api/analyzer/research-views/${selectedView.id}`, formData)
            } else {
                // Create new view
                const response = await axios.post('/api/analyzer/research-views', formData)
                // Navigate to the newly created view
                if (response.data?.data?.id) {
                    handleCloseDialog()
                    navigate(`/analyzer/research-views/${response.data.data.id}`)
                    return // Exit early since we're navigating away
                }
            }

            // Only reach here if updating or if creation didn't result in navigation
            fetchResearchViews()
            handleCloseDialog()
        } catch (err) {
            console.error('Error saving research view:', err)
            setError(`Failed to ${selectedView ? 'update' : 'create'} research view. Please try again.`)
        }
    }

    // Delete research view confirmation
    const handleOpenDeleteDialog = (view) => {
        setSelectedView(view)
        setOpenDeleteDialog(true)
    }

    // Handle delete dialog close
    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false)
        setSelectedView(null)
    }

    // Delete research view
    const handleDeleteResearchView = async () => {
        try {
            await axios.delete(`/api/analyzer/research-views/${selectedView.id}`)
            fetchResearchViews()
            handleCloseDeleteDialog()
        } catch (err) {
            console.error('Error deleting research view:', err)
            setError('Failed to delete research view. Please try again.')
        }
    }

    // Navigate to research view details
    const handleViewResearchView = (view) => {
        navigate(`/analyzer/research-views/${view.id}`)
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h4' component='h1'>
                    Research Views
                </Typography>
            </Box>

            {error && (
                <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                    <CircularProgress />
                </Box>
            ) : researchViews.length === 0 ? (
                <Card sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
                    <Box display='flex' flexDirection='column' alignItems='center' textAlign='center' py={4}>
                        <Typography variant='h6' mb={2}>
                            No research views yet
                        </Typography>
                        <Typography variant='body1' color='textSecondary' mb={3}>
                            Create your first research view to start analyzing data sources
                        </Typography>
                        <Button variant='contained' startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                            Create Research View
                        </Button>
                    </Box>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '1px dashed rgba(0, 0, 0, 0.12)',
                                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    borderColor: 'primary.main'
                                }
                            }}
                            onClick={() => handleOpenDialog()}
                        >
                            <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' p={4} textAlign='center'>
                                <IconButton
                                    color='primary'
                                    sx={{
                                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                        width: 56,
                                        height: 56,
                                        mb: 2,
                                        '&:hover': {
                                            backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                        }
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 32 }} />
                                </IconButton>
                                <Typography variant='h6' color='primary.main'>
                                    New Research View
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>

                    {researchViews.map((view) => (
                        <Grid item xs={12} sm={6} md={4} key={view.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        boxShadow: 3,
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => handleViewResearchView(view)}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant='h6' component='h2' noWrap>
                                        {view.name}
                                    </Typography>

                                    <Box mt={1} mb={2}>
                                        <Typography
                                            variant='body2'
                                            color='textSecondary'
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                height: '40px'
                                            }}
                                        >
                                            {view.description || 'No description provided'}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Grid container spacing={2} mt={1}>
                                        <Grid item xs={6}>
                                            <Typography variant='caption' color='textSecondary'>
                                                Data Sources
                                            </Typography>
                                            <Typography variant='body2'>{view.data_sources?.length || 0}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant='caption' color='textSecondary'>
                                                Documents
                                            </Typography>
                                            <Typography variant='body2'>{view.document_count || 0}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant='caption' color='textSecondary'>
                                                Reports
                                            </Typography>
                                            <Typography variant='body2'>{view.analyzer_reports?.length || 0}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant='caption' color='textSecondary'>
                                                Created
                                            </Typography>
                                            <Typography variant='body2'>{new Date(view.created_at).toLocaleDateString()}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                                    <Box>
                                        <Tooltip title='Edit'>
                                            <IconButton
                                                size='small'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenDialog(view)
                                                }}
                                            >
                                                <EditIcon fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Delete'>
                                            <IconButton
                                                size='small'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenDeleteDialog(view)
                                                }}
                                            >
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{selectedView ? 'Edit Research View' : 'Create Research View'}</DialogTitle>
                <DialogContent sx={{ width: 500, maxWidth: '100%' }}>
                    <Box mt={1}>
                        <TextField
                            autoFocus
                            margin='dense'
                            name='name'
                            label='Name'
                            fullWidth
                            variant='outlined'
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <TextField
                            margin='dense'
                            name='description'
                            label='Description'
                            fullWidth
                            variant='outlined'
                            value={formData.description}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveResearchView} variant='contained'>
                        {selectedView ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Delete Research View</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{selectedView?.name}&quot;? This action cannot be undone and will delete all
                        associated data sources, documents, and reports.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button onClick={handleDeleteResearchView} variant='contained' color='error'>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default AnalyzerHomePage
