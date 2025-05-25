import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
    Snackbar
} from '@mui/material'
import {
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    InsertDriveFile as FileIcon,
    AudioFile as AudioIcon,
    VideoFile as VideoIcon,
    Image as ImageIcon,
    Article as DocumentIcon,
    Code as DataIcon
} from '@mui/icons-material'
import axios from 'axios'
import { formatDistance } from 'date-fns'

const FilesTab = ({ researchView }) => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [error, setError] = useState(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    })

    // Fetch files for the research view
    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/analyzer/research-views/${researchView.id}/files`)
            setFiles(response.data.data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching files:', err)
            setError('Failed to load files. Please try again later.')
        } finally {
            setLoading(false)
        }
    }, [researchView.id])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setUploadLoading(true)
        setError(null)

        try {
            // Step 1: Get a signed upload URL
            const uploadUrlResponse = await axios.post(`/api/analyzer/research-views/${researchView.id}/upload-url`, {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            })

            const { signedUrl, fileRecord } = uploadUrlResponse.data

            // Step 2: Upload the file to the signed URL
            await axios.put(signedUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            })

            // Step 3: Process the file (for text-based files)
            try {
                if (['text', 'document', 'data'].includes(fileRecord.file_type)) {
                    await axios.post(`/api/analyzer/files/${fileRecord.id}/process`)
                }
            } catch (processError) {
                console.error('Error processing file:', processError)
                // We'll still show the file as uploaded but with an error status
            }

            // Step 4: Refresh the file list
            await fetchFiles()

            // Show success message
            setSnackbar({
                open: true,
                message: 'File uploaded successfully',
                severity: 'success'
            })
        } catch (err) {
            console.error('Error uploading file:', err)
            setError('Failed to upload file. Please try again.')
            setSnackbar({
                open: true,
                message: 'Failed to upload file',
                severity: 'error'
            })
        } finally {
            setUploadLoading(false)
            // Reset the file input
            event.target.value = ''
        }
    }

    // Handle file processing
    const handleProcessFile = async (fileId) => {
        try {
            await axios.post(`/api/analyzer/files/${fileId}/process`)
            await fetchFiles()
            setSnackbar({
                open: true,
                message: 'File processing started',
                severity: 'info'
            })
        } catch (err) {
            console.error('Error processing file:', err)
            setSnackbar({
                open: true,
                message: 'Failed to process file',
                severity: 'error'
            })
        }
    }

    // Handle file deletion
    const handleDeleteClick = (file) => {
        setSelectedFile(file)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!selectedFile) return

        try {
            await axios.delete(`/api/analyzer/files/${selectedFile.id}`)
            setDeleteDialogOpen(false)
            await fetchFiles()
            setSnackbar({
                open: true,
                message: 'File deleted successfully',
                severity: 'success'
            })
        } catch (err) {
            console.error('Error deleting file:', err)
            setSnackbar({
                open: true,
                message: 'Failed to delete file',
                severity: 'error'
            })
        }
    }

    // Get icon based on file type
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'audio':
                return <AudioIcon />
            case 'video':
                return <VideoIcon />
            case 'image':
                return <ImageIcon />
            case 'document':
                return <DocumentIcon />
            case 'data':
                return <DataIcon />
            default:
                return <FileIcon />
        }
    }

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    // Get status chip color
    const getStatusColor = (status) => {
        switch (status) {
            case 'processed':
                return 'success'
            case 'processing':
                return 'warning'
            case 'error':
                return 'error'
            default:
                return 'default'
        }
    }

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                    Upload Documents
                </Typography>
                <Typography variant='body2' color='text.secondary' mb={2}>
                    Upload documents, PDFs, spreadsheets, audio or video files to be processed and analyzed. Files will be stored in your
                    research view and can be processed for analysis.
                </Typography>
                <Box display='flex' alignItems='center'>
                    <Button component='label' variant='contained' startIcon={<CloudUploadIcon />} disabled={uploadLoading}>
                        {uploadLoading ? 'Uploading...' : 'Upload File'}
                        <input type='file' hidden onChange={handleFileUpload} disabled={uploadLoading} />
                    </Button>
                    {uploadLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
                </Box>
                {error && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>

            <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                <Typography variant='h6'>Files ({files.length})</Typography>
                <Button startIcon={<RefreshIcon />} onClick={fetchFiles} disabled={loading}>
                    Refresh
                </Button>
            </Box>

            {loading ? (
                <Box display='flex' justifyContent='center' p={4}>
                    <CircularProgress />
                </Box>
            ) : files.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography align='center' color='text.secondary'>
                            No files uploaded yet. Upload files to get started.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>File</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Uploaded</TableCell>
                                <TableCell align='right'>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {files.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>
                                        <Box display='flex' alignItems='center'>
                                            {getFileIcon(file.file_type)}
                                            <Typography sx={{ ml: 1 }}>{file.filename}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{file.file_type}</TableCell>
                                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                    <TableCell>
                                        <Chip label={file.status} size='small' color={getStatusColor(file.status)} />
                                    </TableCell>
                                    <TableCell>
                                        {formatDistance(new Date(file.created_at), new Date(), {
                                            addSuffix: true
                                        })}
                                    </TableCell>
                                    <TableCell align='right'>
                                        {file.status === 'unprocessed' && (
                                            <IconButton onClick={() => handleProcessFile(file.id)} title='Process File'>
                                                <RefreshIcon />
                                            </IconButton>
                                        )}
                                        <IconButton onClick={() => handleDeleteClick(file)} title='Delete File'>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the file &ldquo;
                        {selectedFile?.filename}&rdquo;? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color='error'>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

FilesTab.propTypes = {
    researchView: PropTypes.object.isRequired
}

export default FilesTab
