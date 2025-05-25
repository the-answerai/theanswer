import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    CircularProgress,
    Alert
} from '@mui/material'
import axios from 'axios'
import PropTypes from 'prop-types'

const DocumentSelector = ({ researchView, selectedDocuments, onSelectionChange }) => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!researchView?.id) return

            setLoading(true)
            try {
                const response = await axios.get(`/api/analyzer/research-views/${researchView.id}/documents`)
                setDocuments(response.data.data || [])
                setError(null)
            } catch (err) {
                console.error('Error fetching documents:', err)
                setError('Failed to load documents')
            } finally {
                setLoading(false)
            }
        }

        fetchDocuments()
    }, [researchView?.id])

    const handleToggleDocument = (documentId) => {
        const newSelection = selectedDocuments.includes(documentId)
            ? selectedDocuments.filter((id) => id !== documentId)
            : [...selectedDocuments, documentId]
        onSelectionChange(newSelection)
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown'
        try {
            return new Date(dateStr).toLocaleDateString()
        } catch {
            return 'Invalid Date'
        }
    }

    if (loading) {
        return (
            <Box display='flex' justifyContent='center' p={3}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity='error' sx={{ mb: 3 }}>
                {error}
            </Alert>
        )
    }

    if (documents.length === 0) {
        return (
            <Alert severity='info' sx={{ mb: 3 }}>
                No documents available for analysis. Add documents to your research view first.
            </Alert>
        )
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell padding='checkbox'>
                            <Checkbox
                                indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < documents.length}
                                checked={documents.length > 0 && selectedDocuments.length === documents.length}
                                onChange={() => {
                                    if (selectedDocuments.length === documents.length) {
                                        onSelectionChange([])
                                    } else {
                                        onSelectionChange(documents.map((doc) => doc.id))
                                    }
                                }}
                            />
                        </TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Source Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Word Count</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id} hover onClick={() => handleToggleDocument(doc.id)} sx={{ cursor: 'pointer' }}>
                            <TableCell padding='checkbox'>
                                <Checkbox checked={selectedDocuments.includes(doc.id)} />
                            </TableCell>
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
                            <TableCell>{doc.source_type || 'Unknown'}</TableCell>
                            <TableCell>{formatDate(doc.publication_date)}</TableCell>
                            <TableCell>{doc.word_count || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

DocumentSelector.propTypes = {
    researchView: PropTypes.object.isRequired,
    selectedDocuments: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSelectionChange: PropTypes.func.isRequired
}

export default DocumentSelector
