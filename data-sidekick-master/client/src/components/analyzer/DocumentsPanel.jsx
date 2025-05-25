import { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Typography,
    Alert,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material'
import PropTypes from 'prop-types'
import AddIcon from '@mui/icons-material/Add'
import axios from 'axios'

const DocumentsPanel = ({ researchView }) => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [debugInfo, setDebugInfo] = useState({})

    // For debugging
    console.log('Research View:', researchView)
    console.log('Data Sources:', researchView?.data_sources)
    console.log('Document Count:', researchView?.document_count)

    const fetchDocuments = useCallback(async () => {
        if (!researchView?.id) return

        setLoading(true)
        try {
            // Debug info
            const debugData = {
                viewId: researchView.id,
                dataSources: researchView.data_sources?.map((ds) => ds.id) || [],
                documentCount: researchView.document_count,
                timestamp: new Date().toISOString()
            }
            setDebugInfo(debugData)
            console.log('Debug data:', debugData)

            // Construct the URL
            const url = `/api/analyzer/research-views/${researchView.id}/documents`
            console.log('Fetching documents from:', url)

            // Make the request with detailed logging
            const response = await axios.get(url, {
                withCredentials: true,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })

            console.log('Documents API response:', response)

            if (response.data && response.data.data) {
                setDocuments(response.data.data)
                console.log('Documents loaded:', response.data.data.length)
            } else {
                console.warn('No documents found in response:', response.data)
                setDocuments([])
            }

            setError(null)
        } catch (err) {
            console.error('Error fetching documents:', err)

            // Detailed error logging
            const errorInfo = {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                headers: err.response?.headers,
                config: {
                    url: err.config?.url,
                    method: err.config?.method,
                    headers: err.config?.headers
                }
            }

            console.error('Detailed error info:', errorInfo)
            setError(`Failed to load documents: ${err.message}. Status: ${err.response?.status || 'unknown'}`)
            setDocuments([])
        } finally {
            setLoading(false)
        }
    }, [researchView])

    useEffect(() => {
        if (researchView?.id) {
            fetchDocuments()
        }
    }, [researchView?.id, fetchDocuments])

    // Simple function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h5'>Documents</Typography>
                <Button variant='contained' startIcon={<AddIcon />} disabled>
                    Add Custom Document
                </Button>
            </Box>

            {/* Debug information */}
            {Object.keys(debugInfo).length > 0 && (
                <Alert severity='info' sx={{ mb: 3 }}>
                    <Typography variant='subtitle2'>Debug Information:</Typography>
                    <pre style={{ fontSize: '0.8rem', maxHeight: '100px', overflow: 'auto' }}>{JSON.stringify(debugInfo, null, 2)}</pre>
                </Alert>
            )}

            {/* Error display */}
            {error && (
                <Alert severity='error' sx={{ mb: 3 }}>
                    <Typography>{error}</Typography>
                    <Button size='small' variant='outlined' onClick={fetchDocuments} sx={{ mt: 1 }}>
                        Retry
                    </Button>
                </Alert>
            )}

            {loading ? (
                <Box display='flex' justifyContent='center' alignItems='center' py={4}>
                    <CircularProgress />
                </Box>
            ) : documents.length === 0 ? (
                <Alert severity='info' sx={{ mb: 3 }}>
                    <Typography>No documents found.</Typography>
                    <Typography sx={{ mt: 2 }}>
                        {researchView?.data_sources?.length === 0
                            ? 'Add data sources first to start collecting documents for analysis.'
                            : 'Wait for data sources to finish processing.'}
                    </Typography>
                </Alert>
            ) : (
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Word Count</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.map((doc) => (
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
                                    <TableCell>
                                        {doc.source_id
                                            ? researchView?.data_sources?.find((s) => s.id === doc.source_id)?.url || 'Unknown Source'
                                            : 'Unknown Source'}
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
    )
}

DocumentsPanel.propTypes = {
    researchView: PropTypes.object.isRequired
}

export default DocumentsPanel
