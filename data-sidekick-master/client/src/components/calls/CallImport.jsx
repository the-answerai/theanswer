import { useState } from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { styled } from '@mui/material/styles'
import { getApiUrl } from '../../config/api'

// Styled component for the file input
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1
})

const steps = ['Upload Files', 'Configure Import', 'Process Files']

const CallImport = () => {
    const [open, setOpen] = useState(false)
    const [activeStep, setActiveStep] = useState(0)
    const [files, setFiles] = useState([])
    const [csvFile, setCsvFile] = useState(null)
    const [importConfig, setImportConfig] = useState({
        environment: 'local',
        csvMapping: {
            employeeName: '',
            employeeId: '',
            callerName: '',
            callNumber: '',
            callType: '',
            callDuration: ''
        }
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleOpen = () => {
        setOpen(true)
        setActiveStep(0)
        setFiles([])
        setCsvFile(null)
        setImportConfig({
            environment: 'local',
            csvMapping: {
                employeeName: '',
                employeeId: '',
                callerName: '',
                callNumber: '',
                callType: '',
                callDuration: ''
            }
        })
        setLoading(false)
        setError(null)
        setSuccess(false)
    }

    const handleClose = () => {
        if (!loading) {
            setOpen(false)
        }
    }

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1)
    }

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1)
    }

    const handleAudioFilesChange = (event) => {
        const selectedFiles = Array.from(event.target.files)
        setFiles(selectedFiles)
    }

    const handleCsvFileChange = (event) => {
        const selectedFile = event.target.files[0]
        setCsvFile(selectedFile)
    }

    const handleConfigChange = (field, value) => {
        setImportConfig((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleMappingChange = (field, value) => {
        setImportConfig((prev) => ({
            ...prev,
            csvMapping: {
                ...prev.csvMapping,
                [field]: value
            }
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            // Create a FormData object to send files
            const formData = new FormData()

            // Add audio files
            for (const file of files) {
                formData.append('audioFiles', file)
            }

            // Add CSV file if available
            if (csvFile) {
                formData.append('csvFile', csvFile)
            }

            // Add configuration
            formData.append('config', JSON.stringify(importConfig))

            // Send the request
            const response = await fetch(getApiUrl('/api/calls/import'), {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to import calls')
            }

            setSuccess(true)
            // Reset form after successful submission
            setFiles([])
            setCsvFile(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Render different steps based on activeStep
    const renderStepContent = () => {
        switch (activeStep) {
            case 0: // Upload Files
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant='h6' gutterBottom>
                            Upload Audio Files
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            <Button component='label' variant='contained' startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
                                Select Audio Files
                                <VisuallyHiddenInput type='file' accept='audio/*' multiple onChange={handleAudioFilesChange} />
                            </Button>
                            {files.length > 0 && (
                                <Paper variant='outlined' sx={{ p: 2, mt: 2 }}>
                                    <Typography variant='subtitle2' gutterBottom>
                                        Selected Files ({files.length}):
                                    </Typography>
                                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                        {files.map((file) => (
                                            <Typography key={`file-${file.name}-${file.size}`} variant='body2' sx={{ mb: 0.5 }}>
                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </Typography>
                                        ))}
                                    </Box>
                                </Paper>
                            )}
                        </Box>

                        <Typography variant='h6' gutterBottom>
                            Upload CSV Metadata (Optional)
                        </Typography>
                        <Button component='label' variant='outlined' startIcon={<CloudUploadIcon />}>
                            Select CSV File
                            <VisuallyHiddenInput type='file' accept='.csv' onChange={handleCsvFileChange} />
                        </Button>
                        {csvFile && (
                            <Typography variant='body2' sx={{ mt: 1 }}>
                                Selected: {csvFile.name}
                            </Typography>
                        )}
                    </Box>
                )

            case 1: // Configure Import
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant='h6' gutterBottom>
                            Import Configuration
                        </Typography>

                        <FormControl fullWidth margin='normal'>
                            <InputLabel>Environment</InputLabel>
                            <Select
                                value={importConfig.environment}
                                label='Environment'
                                onChange={(e) => handleConfigChange('environment', e.target.value)}
                            >
                                <MenuItem value='local'>Local</MenuItem>
                                <MenuItem value='prime'>Prime</MenuItem>
                                <MenuItem value='wow'>WOW</MenuItem>
                            </Select>
                        </FormControl>

                        {csvFile && (
                            <>
                                <Typography variant='h6' sx={{ mt: 3, mb: 2 }}>
                                    CSV Field Mapping
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Employee Name Column'
                                            value={importConfig.csvMapping.employeeName}
                                            onChange={(e) => handleMappingChange('employeeName', e.target.value)}
                                            placeholder='e.g., EMPLOYEE_NAME'
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Employee ID Column'
                                            value={importConfig.csvMapping.employeeId}
                                            onChange={(e) => handleMappingChange('employeeId', e.target.value)}
                                            placeholder='e.g., EMPLOYEE_ID'
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Caller Name Column'
                                            value={importConfig.csvMapping.callerName}
                                            onChange={(e) => handleMappingChange('callerName', e.target.value)}
                                            placeholder='e.g., CALLER_NAME'
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Call Number Column'
                                            value={importConfig.csvMapping.callNumber}
                                            onChange={(e) => handleMappingChange('callNumber', e.target.value)}
                                            placeholder='e.g., CALL_NUMBER'
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Call Type Column'
                                            value={importConfig.csvMapping.callType}
                                            onChange={(e) => handleMappingChange('callType', e.target.value)}
                                            placeholder='e.g., CALL_TYPE'
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label='Call Duration Column'
                                            value={importConfig.csvMapping.callDuration}
                                            onChange={(e) => handleMappingChange('callDuration', e.target.value)}
                                            placeholder='e.g., CALL_DURATION'
                                        />
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </Box>
                )

            case 2: // Process Files
                return (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        {loading ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                            >
                                <CircularProgress sx={{ mb: 2 }} />
                                <Typography>Processing files... This may take several minutes.</Typography>
                            </Box>
                        ) : error ? (
                            <Alert severity='error' sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        ) : success ? (
                            <Alert severity='success' sx={{ mb: 2 }}>
                                Files successfully imported and transcribed!
                            </Alert>
                        ) : (
                            <Box>
                                <Typography variant='h6' gutterBottom>
                                    Ready to Process
                                </Typography>
                                <Typography variant='body1' paragraph>
                                    You are about to import and transcribe {files.length} audio files.
                                    {csvFile ? ' CSV metadata will be applied.' : ''}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    This process will run in the background and may take some time depending on the number and size of
                                    files.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )

            default:
                return null
        }
    }

    return (
        <>
            <Button variant='contained' color='primary' startIcon={<CloudUploadIcon />} onClick={handleOpen}>
                Import Calls
            </Button>

            <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
                <DialogTitle>Import Call Recordings</DialogTitle>

                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {renderStepContent()}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>

                    {activeStep > 0 && (
                        <Button onClick={handleBack} disabled={loading}>
                            Back
                        </Button>
                    )}

                    {activeStep < steps.length - 1 ? (
                        <Button onClick={handleNext} variant='contained' disabled={activeStep === 0 && files.length === 0}>
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} variant='contained' color='primary' disabled={loading || success}>
                            {loading ? 'Processing...' : 'Import Files'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    )
}

export default CallImport
