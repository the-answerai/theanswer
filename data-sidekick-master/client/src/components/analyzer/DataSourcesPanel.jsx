import { useState, useCallback } from 'react'
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress,
    Alert,
    AlertTitle,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    ListItemIcon,
    ListItemText,
    List,
    ListItem
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LanguageIcon from '@mui/icons-material/Language'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CallIcon from '@mui/icons-material/Call'
import ChatIcon from '@mui/icons-material/Chat'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import PropTypes from 'prop-types'
import axios from 'axios'
import { WebSourcePanel, FileSourcePanel, CallSourcePanel, ChatSourcePanel, TicketSourcePanel, SourcesPanel } from './datasources'

const DataSourcesPanel = ({ researchView, onDataSourcesChange }) => {
    const [showDocuments, setShowDocuments] = useState(false)
    const [sourceDocuments, setSourceDocuments] = useState([])
    const [loadingDocuments, setLoadingDocuments] = useState(false)
    const [selectedSource, setSelectedSource] = useState(null)
    const [activeView, setActiveView] = useState('sources')
    const [showWebPanel, setShowWebPanel] = useState(false)
    const [openSourceTypeDialog, setOpenSourceTypeDialog] = useState(false)

    // Format date helper function
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown'
        try {
            return new Date(dateStr).toLocaleDateString()
        } catch {
            return 'Invalid Date'
        }
    }

    // Fetch documents for a specific source
    const fetchSourceDocuments = async (source) => {
        try {
            setLoadingDocuments(true)
            const response = await axios.get(`/api/analyzer/data-sources/${source.id}/documents`)
            setSourceDocuments(response.data.data || [])
            setSelectedSource(source)
            setShowDocuments(true)
        } catch (err) {
            console.error('Error fetching documents:', err)
        } finally {
            setLoadingDocuments(false)
        }
    }

    // Handle back to sources
    const handleBackToSources = () => {
        setShowDocuments(false)
        setSelectedSource(null)
        setSourceDocuments([])
    }

    // Handle closing the source type selection dialog
    const handleCloseSourceTypeDialog = () => {
        setOpenSourceTypeDialog(false)
    }

    // Handle selecting a source type
    const handleSelectSourceType = (sourceType) => {
        handleCloseSourceTypeDialog()

        // Handle different source types
        switch (sourceType) {
            case 'web':
                setShowWebPanel(true)
                break
            case 'file':
                setActiveView('files')
                break
            case 'calls':
                setActiveView('calls')
                break
            case 'chats':
                setActiveView('chats')
                break
            case 'tickets':
                setActiveView('tickets')
                break
            default:
                break
        }
    }

    // Handle going back to sources view
    const handleBackToSourcesView = useCallback(() => {
        setActiveView('sources')
    }, [])

    // Handle adding a web source
    const handleAddWebSource = async (payload) => {
        try {
            // Prepare API payload
            const apiPayload = {
                sourceType: payload.sourceType,
                url: payload.url,
                filterPaths: payload.filterPaths
            }

            // Submit request
            await axios.post(`/api/analyzer/research-views/${researchView.id}/sources`, apiPayload)

            // Close dialog and switch back to sources view
            setShowWebPanel(false)

            // Notify parent
            if (onDataSourcesChange) {
                onDataSourcesChange()
            }
        } catch (err) {
            console.error('Error adding web source:', err)
        }
    }

    return (
        <Box>
            {showDocuments ? (
                <Box>
                    <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                        <Box>
                            <Button variant='outlined' onClick={handleBackToSources} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                                Back to Sources
                            </Button>
                            <Typography variant='h5'>Documents from {selectedSource?.url || selectedSource?.file_path}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Last updated: {formatDate(selectedSource?.last_fetched_at)}
                            </Typography>
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
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title/Summary</TableCell>
                                        <TableCell>Publication Date</TableCell>
                                        <TableCell>Word Count</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sourceDocuments.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>
                                                <Typography variant='body2' fontWeight='medium'>
                                                    {doc.title || 'Untitled Document'}
                                                </Typography>
                                                <Typography variant='caption' color='text.secondary' component='div'>
                                                    {doc.content_summary
                                                        ? doc.content_summary.length > 100
                                                            ? `${doc.content_summary.substring(0, 100)}...`
                                                            : doc.content_summary
                                                        : 'No summary available'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{formatDate(doc.publication_date)}</TableCell>
                                            <TableCell>{doc.word_count || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            ) : activeView === 'sources' ? (
                <SourcesPanel
                    researchView={researchView}
                    onDataSourcesChange={onDataSourcesChange}
                    onSelectSourceType={handleSelectSourceType}
                    onViewDocuments={fetchSourceDocuments}
                />
            ) : activeView === 'files' ? (
                <FileSourcePanel onBack={handleBackToSourcesView} researchViewId={researchView.id} onAddSource={onDataSourcesChange} />
            ) : activeView === 'calls' ? (
                <CallSourcePanel onBack={handleBackToSourcesView} researchViewId={researchView.id} onAddSource={onDataSourcesChange} />
            ) : activeView === 'chats' ? (
                <ChatSourcePanel onBack={handleBackToSourcesView} researchViewId={researchView.id} onAddSource={onDataSourcesChange} />
            ) : activeView === 'tickets' ? (
                <TicketSourcePanel onBack={handleBackToSourcesView} researchViewId={researchView.id} onAddSource={onDataSourcesChange} />
            ) : null}

            {/* Web Source Dialog */}
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
        </Box>
    )
}

DataSourcesPanel.propTypes = {
    researchView: PropTypes.object.isRequired,
    onDataSourcesChange: PropTypes.func
}

export default DataSourcesPanel
