import { useState, useEffect, useCallback, useRef } from 'react'
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
    Snackbar,
    LinearProgress
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
    Code as DataIcon,
    UploadFile as UploadFileIcon
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
    const [uploadProgress, setUploadProgress] = useState({})
    const [isDragActive, setIsDragActive] = useState(false)
    const fileInputRef = useRef(null)
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

    // Get normalized MIME type
    const getNormalizedMimeType = (file) => {
        let fileType = file.type

        // If the browser didn't provide a valid MIME type, determine it from extension
        if (!fileType || fileType === 'application/octet-stream') {
            const extension = file.name.split('.').pop().toLowerCase()
            // Map common extensions to MIME types
            const extensionMimeMap = {
                txt: 'text/plain',
                csv: 'text/csv',
                md: 'text/markdown',
                pdf: 'application/pdf',
                doc: 'application/msword',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                xls: 'application/vnd.ms-excel',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ppt: 'application/vnd.ms-powerpoint',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                json: 'application/json',
                mp3: 'audio/mpeg',
                mp4: 'video/mp4',
                wav: 'audio/wav',
                webm: 'video/webm',
                ogg: 'audio/ogg',
                mov: 'video/quicktime',
                avi: 'video/x-msvideo',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp'
            }

            fileType = extensionMimeMap[extension] || 'application/octet-stream'
        }

        return fileType
    }

    // Upload a single file
    const uploadSingleFile = async (file) => {
        const fileType = getNormalizedMimeType(file)

        // Initialize progress tracking for this file
        setUploadProgress((prev) => ({
            ...prev,
            [file.name]: { progress: 0, status: 'preparing' }
        }))

        try {
            console.log('Uploading file:', {
                name: file.name,
                type: fileType,
                size: file.size
            })

            // Update progress
            setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { progress: 10, status: 'requesting-url' }
            }))

            // Step 1: Get a signed upload URL
            console.log('Requesting signed URL...')
            const uploadUrlResponse = await axios.post(`/api/analyzer/research-views/${researchView.id}/upload-url`, {
                fileName: file.name,
                fileType: fileType,
                fileSize: file.size
            })

            const { signedUrl, fileRecord } = uploadUrlResponse.data
            console.log('Received signed URL:', signedUrl)
            console.log('File record:', fileRecord)

            // Update progress
            setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { progress: 30, status: 'uploading' }
            }))

            // Step 2: Upload the file to the signed URL
            console.log('Uploading to signed URL with content type:', fileType)
            try {
                const uploadResponse = await axios.put(signedUrl, file, {
                    headers: {
                        'Content-Type': fileType
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 70) / progressEvent.total) + 30 // Start from 30% and go to 100%

                        setUploadProgress((prev) => ({
                            ...prev,
                            [file.name]: {
                                progress: percentCompleted,
                                status: percentCompleted < 100 ? 'uploading' : 'processing'
                            }
                        }))
                    }
                })
                console.log('Upload successful:', uploadResponse)
            } catch (uploadError) {
                console.error('Error uploading to signed URL:', uploadError)
                console.error('Error details:', uploadError.response?.data || 'No response data')

                // Update progress to error
                setUploadProgress((prev) => ({
                    ...prev,
                    [file.name]: { progress: 0, status: 'error' }
                }))

                throw new Error(`Upload failed: ${uploadError.message}`)
            }

            // Step 3: Process the file (for text-based files)
            try {
                if (['text', 'document', 'data'].includes(fileRecord.file_type)) {
                    console.log('Processing file of type:', fileRecord.file_type)
                    await axios.post(`/api/analyzer/files/${fileRecord.id}/process`)
                }
            } catch (processError) {
                console.error('Error processing file:', processError)
                // We'll still show the file as uploaded but with an error status
            }

            // Update progress to completed
            setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { progress: 100, status: 'complete' }
            }))

            return true
        } catch (err) {
            console.error('Error uploading file:', err)

            // Update progress to error
            setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { progress: 0, status: 'error' }
            }))

            return false
        }
    }

    // Handle multiple file uploads
    const handleFileUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files || [])
        if (!selectedFiles.length) return

        setUploadLoading(true)
        setError(null)

        try {
            const results = await Promise.all(selectedFiles.map(uploadSingleFile))

            // Check if all uploads were successful
            const allSuccessful = results.every((result) => result === true)

            // Refresh the file list
            await fetchFiles()

            // Show success message
            setSnackbar({
                open: true,
                message: allSuccessful ? 'All files uploaded successfully' : 'Some files failed to upload',
                severity: allSuccessful ? 'success' : 'warning'
            })
        } catch (err) {
            console.error('Error in file upload batch:', err)
            setError('Failed to upload files. Please try again.')
            setSnackbar({
                open: true,
                message: 'Failed to upload files',
                severity: 'error'
            })
        } finally {
            setUploadLoading(false)
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            // Clear progress after a delay
            setTimeout(() => {
                setUploadProgress({})
            }, 3000)
        }
    }

    // Handle files dropped via drag and drop
    const handleFileDrop = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragActive(false)

        const droppedFiles = Array.from(event.dataTransfer.files)
        if (droppedFiles.length > 0) {
            // Create a synthetic event object with the dropped files
            const syntheticEvent = {
                target: {
                    files: droppedFiles
                }
            }

            // Process the dropped files
            handleFileUpload(syntheticEvent)
        }
    }

    // Handle drag events
    const handleDragOver = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragActive(true)
    }

    const handleDragEnter = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragActive(true)
    }

    const handleDragLeave = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragActive(false)
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
            <Paper
                sx={{
                    p: 2,
                    mb: 3,
                    border: isDragActive ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
                    backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    transition: 'all 0.3s ease'
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
            >
                <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' p={3}>
                    <UploadFileIcon
                        sx={{
                            fontSize: 48,
                            mb: 2,
                            color: isDragActive ? 'primary.main' : 'text.secondary'
                        }}
                    />
                    <Typography variant='h6' gutterBottom align='center'>
                        {isDragActive ? 'Drop files here' : 'Upload Documents'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' mb={3} align='center'>
                        Drag and drop files here, or click to select files.
                        <br />
                        Upload documents, PDFs, spreadsheets, audio or video files to be processed and analyzed.
                    </Typography>
                    <Button component='label' variant='contained' startIcon={<CloudUploadIcon />} disabled={uploadLoading}>
                        {uploadLoading ? 'Uploading...' : 'Select Files'}
                        <input type='file' hidden multiple onChange={handleFileUpload} disabled={uploadLoading} ref={fileInputRef} />
                    </Button>
                </Box>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                    <Box mt={3}>
                        <Typography variant='subtitle2' gutterBottom>
                            Upload Progress
                        </Typography>
                        {Object.entries(uploadProgress).map(([fileName, { progress, status }]) => (
                            <Box key={fileName} mb={1}>
                                <Box display='flex' justifyContent='space-between' mb={0.5}>
                                    <Typography variant='body2' noWrap sx={{ maxWidth: '80%' }}>
                                        {fileName}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {status === 'error' ? 'Failed' : `${progress}%`}
                                    </Typography>
                                </Box>
                                <LinearProgress variant='determinate' value={progress} color={status === 'error' ? 'error' : 'primary'} />
                            </Box>
                        ))}
                    </Box>
                )}

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
