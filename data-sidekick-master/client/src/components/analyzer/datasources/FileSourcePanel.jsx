import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import {
    Box,
    Typography,
    Button,
    Alert,
    AlertTitle,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    LinearProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import ImageIcon from '@mui/icons-material/Image'
import DescriptionIcon from '@mui/icons-material/Description'
import StorageIcon from '@mui/icons-material/Storage'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'
import PropTypes from 'prop-types'
import { formatDistance } from 'date-fns'

const FileSourcePanel = ({ onBack, researchViewId, onAddSource }) => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [uploadProgress, setUploadProgress] = useState({})
    const [isDragActive, setIsDragActive] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    // Fetch files for the research view
    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`/api/analyzer/research-views/${researchViewId}/files`)
            setFiles(response.data.data || [])
            setError(null)
        } catch (err) {
            console.error('Error fetching files:', err)
            setError('Failed to load files. Please try again later.')
        } finally {
            setLoading(false)
        }
    }, [researchViewId])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    // Get normalized MIME type
    const getNormalizedMimeType = (file) => {
        const type = file.type.toLowerCase()

        if (type.includes('audio')) return 'audio'
        if (type.includes('video')) return 'video'
        if (type.includes('image')) return 'image'

        const isDocument = type.includes('pdf') || type.includes('word') || type.includes('document') || type.includes('text')

        if (isDocument) return 'document'

        const isData =
            type.includes('spreadsheet') || type.includes('excel') || type.includes('csv') || type.includes('json') || type.includes('xml')

        if (isData) return 'data'

        return 'file'
    }

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    // Get file icon based on type
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'audio':
                return <AudioFileIcon />
            case 'video':
                return <VideoFileIcon />
            case 'image':
                return <ImageIcon />
            case 'document':
                return <DescriptionIcon />
            case 'data':
                return <StorageIcon />
            default:
                return <InsertDriveFileIcon />
        }
    }

    // Get status color
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
            const uploadUrlResponse = await axios.post(`/api/analyzer/research-views/${researchViewId}/upload-url`, {
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
            await axios.put(signedUrl, file, {
                headers: {
                    'Content-Type': file.type
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 70) / progressEvent.total)
                    // Map to 30-90% range (30% for prep, 70% for upload)
                    const scaledPercent = 30 + percentCompleted
                    setUploadProgress((prev) => ({
                        ...prev,
                        [file.name]: { progress: scaledPercent, status: 'uploading' }
                    }))
                }
            })

            // Update progress
            setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { progress: 90, status: 'processing' }
            }))

            // Step 3: Process the file (for text-based files)
            try {
                if (['document', 'data'].includes(fileType)) {
                    await axios.post(`/api/analyzer/files/${fileRecord.id}/process`)
                }
            } catch (processError) {
                console.error('Error processing file:', processError)
                // Continue as the file is uploaded, just processing failed
            }

            // Mark as complete
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

            // Show success message as alert
            if (!allSuccessful) {
                setError('Some files failed to upload. Please try again.')
            }
        } catch (err) {
            console.error('Error in file upload batch:', err)
            setError('Failed to upload files. Please try again.')
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

    // Handle file selection for adding as source
    const handleFileSelection = (fileId) => {
        setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
    }

    // Add selected files as a data source
    const handleAddSelectedFiles = async () => {
        if (!selectedFiles.length) return

        try {
            setIsSubmitting(true)

            // Prepare API payload
            const payload = {
                sourceType: 'files',
                fileIds: selectedFiles
            }

            // Submit request to add files as a source
            await axios.post(`/api/analyzer/research-views/${researchViewId}/sources`, payload)

            // Notify parent component
            if (onAddSource) {
                onAddSource()
            }

            // Go back to sources view
            onBack()
        } catch (err) {
            console.error('Error adding files as source:', err)
            setError('Failed to add files as source. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Box>
                    <Button variant='outlined' onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
                        Back to Sources
                    </Button>
                    <Typography variant='h5'>File Sources</Typography>
                </Box>
                {selectedFiles.length > 0 && (
                    <Button variant='contained' onClick={handleAddSelectedFiles} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : `Add ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''} as Source`}
                    </Button>
                )}
            </Box>

            {/* File Upload Area */}
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
                    <CloudUploadIcon
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

            {/* Files List */}
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
                <Alert severity='info'>
                    <AlertTitle>No Files</AlertTitle>
                    No files have been uploaded yet. Upload files above to get started.
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding='checkbox' />
                                <TableCell>File</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Uploaded</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {files.map((file) => (
                                <TableRow
                                    key={file.id}
                                    onClick={() => handleFileSelection(file.id)}
                                    selected={selectedFiles.includes(file.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                    }}
                                >
                                    <TableCell padding='checkbox'>
                                        <input
                                            type='checkbox'
                                            checked={selectedFiles.includes(file.id)}
                                            onChange={() => {}} // Handled by row click
                                        />
                                    </TableCell>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}

FileSourcePanel.propTypes = {
    onBack: PropTypes.func.isRequired,
    researchViewId: PropTypes.string.isRequired,
    onAddSource: PropTypes.func
}

export default FileSourcePanel
