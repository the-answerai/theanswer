import React from 'react'
import {
    Box,
    Typography,
    Alert,
    Button,
    CircularProgress,
    Tabs,
    Tab,
    TextField,
    Paper,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Switch,
    FormControlLabel,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material'
import { useState, useEffect } from 'react'
import DocumentEmbeddingVisualizer from './DocumentEmbeddingVisualizer'
import axios from 'axios'
import PropTypes from 'prop-types'
import DocumentSelector from './DocumentSelector'

// TEST_MODE: Set to true to use hardcoded research view ID for testing
const TEST_MODE = true
const TEST_RESEARCH_VIEW_ID = '787e40e6-80cb-4bb2-bdf4-e480fd056986'
// Hardcoded source ID for testing - this should be replaced with an actual source ID from your database
const TEST_SOURCE_ID = '3da0db1f-6414-4984-94f3-8ecec49d4205'

const AnalysisPanel = ({ researchView }) => {
    const [activeTab, setActiveTab] = useState(0)
    const [embeddings, setEmbeddings] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [debugMode, setDebugMode] = useState(true)

    // Text processor state
    const [textInput, setTextInput] = useState('')
    const [textFormat, setTextFormat] = useState('plain')
    const [textResult, setTextResult] = useState(null)
    const [processingText, setProcessingText] = useState(false)
    const [textError, setTextError] = useState(null)
    const [apiResponse, setApiResponse] = useState(null)

    // Saved analyses state
    const [savedAnalyses, setSavedAnalyses] = useState([])
    const [loadingAnalyses, setLoadingAnalyses] = useState(false)
    const [analysesError, setAnalysesError] = useState(null)

    // Sample text for testing
    const [useSampleText, setUseSampleText] = useState(false)
    const sampleText =
        "This is a sample text for testing the text analysis feature. The goal of this project is to create a more generic text processing service that can handle different types of text input and provide detailed analysis. We're using the AnswerAI endpoint with a configurable chatflow ID."

    // Report generation state
    const [reportName, setReportName] = useState('')
    const [reportPrompt, setReportPrompt] = useState('')
    const [selectedDocuments, setSelectedDocuments] = useState([])
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [reports, setReports] = useState([])
    const [loadingReports, setLoadingReports] = useState(false)

    // Get effective research view (either passed prop or test one)
    const effectiveResearchView = TEST_MODE
        ? {
              id: TEST_RESEARCH_VIEW_ID,
              document_count: 1,
              answerai_store_id: 'test-store'
          }
        : researchView

    useEffect(() => {
        if (debugMode) {
            console.log('AnalysisPanel debug mode enabled')
            console.log('Current research view:', effectiveResearchView)
        }
    }, [debugMode, effectiveResearchView])

    useEffect(() => {
        // Auto-fill sample text when useSampleText is enabled
        if (useSampleText && !textInput) {
            setTextInput(sampleText)
        }
    }, [useSampleText, textInput])

    // Load saved analyses when the component mounts or research view changes
    useEffect(() => {
        if (effectiveResearchView?.id && activeTab === 2) {
            fetchSavedAnalyses()
        }
    }, [effectiveResearchView?.id, activeTab])

    // Fetch reports when the component mounts or research view changes
    useEffect(() => {
        if (effectiveResearchView?.id && activeTab === 3) {
            fetchReports()
        }
    }, [effectiveResearchView?.id, activeTab])

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)

        // Load saved analyses when switching to the Text Analysis tab
        if (newValue === 2 && effectiveResearchView?.id) {
            fetchSavedAnalyses()
        }
    }

    const fetchSavedAnalyses = async () => {
        if (!effectiveResearchView?.id) return

        setLoadingAnalyses(true)
        setAnalysesError(null)

        try {
            const response = await axios.get(`/api/analyzer/research-views/${effectiveResearchView.id}/text-analyses`)

            if (response.data?.success) {
                setSavedAnalyses(response.data.data || [])
                if (debugMode) {
                    console.log('Loaded saved analyses:', response.data.data)
                }
            } else {
                throw new Error(response.data?.error || 'Failed to load saved analyses')
            }
        } catch (err) {
            console.error('Error loading saved analyses:', err)
            setAnalysesError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load saved analyses')
        } finally {
            setLoadingAnalyses(false)
        }
    }

    const fetchDocumentEmbeddings = async () => {
        if (!effectiveResearchView?.id) return

        setLoading(true)
        setError(null)

        try {
            console.log('Fetching embeddings for research view:', effectiveResearchView?.id)
            const response = await axios.post(`/api/analyzer/research-views/${effectiveResearchView?.id}/document-embeddings`)

            console.log('Embeddings API response:', response.data)

            if (response.data?.data) {
                // Validate the data structure before setting it
                const embeddingsData = response.data.data
                console.log(`Received ${embeddingsData.length} documents with embeddings`)

                // Check the first embedding to confirm format
                if (embeddingsData.length > 0) {
                    const firstEmbedding = embeddingsData[0].embedding
                    console.log(
                        'First embedding sample:',
                        typeof firstEmbedding,
                        Array.isArray(firstEmbedding),
                        firstEmbedding ? firstEmbedding.length : 0,
                        Array.isArray(firstEmbedding) ? firstEmbedding.slice(0, 3) : null
                    )
                }

                setEmbeddings(response.data.data)
            } else {
                console.error('Invalid response format:', response.data)
                setError('No embedding data available')
            }
        } catch (err) {
            console.error('Error fetching document embeddings:', err)
            setError(err.response?.data?.message || err.message || 'Failed to load document embeddings')
        } finally {
            setLoading(false)
        }
    }

    const processText = async () => {
        if (!textInput.trim()) {
            setTextError('Please enter some text to analyze')
            return
        }

        setProcessingText(true)
        setTextError(null)
        setTextResult(null)
        setApiResponse(null)

        try {
            if (debugMode) {
                console.log('Processing text with format:', textFormat)
                console.log('Text input (first 100 chars):', textInput.substring(0, 100))
                console.log('Using research view ID:', effectiveResearchView?.id)
            }

            // Check if we have the research view data
            if (!effectiveResearchView?.id) {
                throw new Error('Research view ID is required')
            }

            // Get the data source ID from the test mode or from the research view
            // In a real implementation, you would select from available sources
            const sourceId = TEST_MODE
                ? TEST_SOURCE_ID // Using the hardcoded test source ID
                : effectiveResearchView.sourceId || effectiveResearchView.id // Fallback to view ID if needed

            if (debugMode) {
                console.log('Using source ID for document storage:', sourceId)
            }

            // Call the store-document endpoint instead of just process
            const response = await axios.post('/api/analyzer/text-processor/store-document', {
                text: textInput,
                sourceId: sourceId,
                title: `Analysis from UI - ${new Date().toLocaleString()}`,
                format: textFormat,
                fileType: 'analysis',
                skipAnalysis: false // We want the full analysis
            })

            // Store full API response for debugging
            setApiResponse(response.data)

            if (debugMode) {
                console.log('Text processor API response:', response.data)
            }

            if (response.data?.success) {
                // Extract analysis data from the response
                // The store-document endpoint returns document info, but we need to
                // extract the analysis data for display
                let analysisData = response.data?.result || {}

                // If there's no analysis data but the document was created successfully
                if (Object.keys(analysisData).length === 0 && response.data.documentId) {
                    analysisData = {
                        summary: 'Document was created successfully, but no detailed analysis is available.',
                        document_id: response.data.documentId
                    }
                }

                setTextResult(analysisData)

                // Refresh the saved analyses list after processing
                fetchSavedAnalyses()
            } else {
                throw new Error(response.data?.error || 'Failed to process text')
            }
        } catch (err) {
            console.error('Error processing text:', err)
            setTextError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to process text')

            if (debugMode) {
                console.error('Full error object:', err)
                if (err.response) {
                    console.error('Error response:', err.response.data)
                }
            }
        } finally {
            setProcessingText(false)
        }
    }

    const loadSavedAnalysis = (analysis) => {
        if (!analysis?.analysis_data) return

        setTextResult(analysis.analysis_data)
        setApiResponse({
            success: true,
            data: analysis.analysis_data,
            metadata: {
                fromSaved: true,
                savedAt: analysis.created_at,
                id: analysis.id
            }
        })
    }

    const fetchReports = async () => {
        if (!effectiveResearchView?.id) return

        setLoadingReports(true)
        try {
            const response = await axios.get(`/api/analyzer/research-views/${effectiveResearchView.id}/reports`)
            if (response.data?.success) {
                setReports(response.data.data || [])
            }
        } catch (err) {
            console.error('Error fetching reports:', err)
        } finally {
            setLoadingReports(false)
        }
    }

    const handleGenerateReport = async () => {
        if (!reportName.trim() || !reportPrompt.trim() || selectedDocuments.length === 0) {
            return
        }

        setIsGeneratingReport(true)
        try {
            const response = await axios.post(`/api/analyzer/research-views/${effectiveResearchView.id}/reports`, {
                name: reportName,
                documentIds: selectedDocuments,
                customPrompt: reportPrompt
            })

            if (response.data?.success) {
                await fetchReports()
                setReportName('')
                setReportPrompt('')
                setSelectedDocuments([])
            }
        } catch (err) {
            console.error('Error generating report:', err)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h5'>AI Analysis</Typography>
                <Box display='flex' alignItems='center'>
                    <FormControlLabel
                        control={<Switch checked={useSampleText} onChange={(e) => setUseSampleText(e.target.checked)} color='secondary' />}
                        label='Use Sample Text'
                        sx={{ mr: 2 }}
                    />
                    <FormControlLabel
                        control={<Switch checked={debugMode} onChange={(e) => setDebugMode(e.target.checked)} color='primary' />}
                        label='Debug Mode'
                    />
                </Box>
            </Box>

            {TEST_MODE && (
                <Alert severity='info' sx={{ mb: 2 }}>
                    <Typography>TEST MODE ACTIVE - Using research view ID: {TEST_RESEARCH_VIEW_ID}</Typography>
                </Alert>
            )}

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label='Overview' />
                <Tab label='Document Clustering' />
                <Tab label='Text Analysis' />
                <Tab label='Reports' />
            </Tabs>

            {activeTab === 0 && (
                <Box>
                    <Alert severity='info' sx={{ mb: 3 }}>
                        <Typography>
                            This panel provides AI-powered analysis tools for your research documents. You can search documents
                            semantically, ask questions about content, and generate insights.
                        </Typography>
                        <Typography sx={{ mt: 2 }}>Add data sources and collect documents first to start analyzing.</Typography>
                    </Alert>

                    {TEST_MODE && (
                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant='h6' gutterBottom>
                                Test Mode Instructions
                            </Typography>
                            <Typography variant='body1' paragraph>
                                This component is currently in test mode using research view ID: <code>{TEST_RESEARCH_VIEW_ID}</code>
                            </Typography>
                            <Typography variant='body2' paragraph>
                                1. Switch to the &quot;Text Analysis&quot; tab to test the text processing functionality.
                            </Typography>
                            <Typography variant='body2' paragraph>
                                2. Enable &quot;Use Sample Text&quot; to pre-fill the text field with sample content, or enter your own
                                text.
                            </Typography>
                            <Typography variant='body2' paragraph>
                                3. Select a text format and click &quot;Analyze Text&quot;.
                            </Typography>
                            <Typography variant='body2'>
                                4. Keep &quot;Debug Mode&quot; enabled to see detailed information about the API request and response.
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}

            {activeTab === 1 && (
                <Box>
                    {!effectiveResearchView?.document_count ? (
                        <Alert severity='info'>No documents available for visualization. Add documents to your research view first.</Alert>
                    ) : !effectiveResearchView?.answerai_store_id ? (
                        <Box textAlign='center'>
                            <Alert severity='info' sx={{ mb: 2 }}>
                                Documents need to be vectorized before visualization.
                            </Alert>
                            <Button variant='contained' color='primary' onClick={fetchDocumentEmbeddings}>
                                Fetch Document Embeddings
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {loading ? (
                                <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
                                    <CircularProgress />
                                </Box>
                            ) : error ? (
                                <Box>
                                    <Alert severity='error' sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                    <Button variant='contained' color='primary' onClick={fetchDocumentEmbeddings}>
                                        Retry
                                    </Button>
                                </Box>
                            ) : embeddings.length > 0 ? (
                                <DocumentEmbeddingVisualizer documents={embeddings} />
                            ) : (
                                <Box textAlign='center'>
                                    <Button variant='contained' color='primary' onClick={fetchDocumentEmbeddings}>
                                        Load Document Clustering
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {activeTab === 2 && (
                <Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant='h6' gutterBottom>
                                    Text Analysis
                                </Typography>
                                <Typography variant='body2' color='text.secondary' paragraph>
                                    Enter any text to analyze it using AI. The system will extract key information, sentiment, topics, and
                                    more.
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            label='Enter text to analyze'
                                            multiline
                                            rows={6}
                                            fullWidth
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder='Paste or type text here for analysis...'
                                            variant='outlined'
                                            disabled={processingText}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel id='text-format-label'>Text Format</InputLabel>
                                            <Select
                                                labelId='text-format-label'
                                                value={textFormat}
                                                label='Text Format'
                                                onChange={(e) => setTextFormat(e.target.value)}
                                                disabled={processingText}
                                            >
                                                <MenuItem value='plain'>Plain Text</MenuItem>
                                                <MenuItem value='html'>HTML</MenuItem>
                                                <MenuItem value='markdown'>Markdown</MenuItem>
                                                <MenuItem value='json'>JSON</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        md={8}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {debugMode && (
                                            <Typography variant='caption' color='text.secondary' sx={{ mr: 2 }}>
                                                Using Research View: <code>{effectiveResearchView?.id}</code>
                                            </Typography>
                                        )}
                                        <Button
                                            variant='contained'
                                            color='primary'
                                            onClick={processText}
                                            disabled={processingText || !textInput.trim()}
                                        >
                                            {processingText ? 'Processing...' : 'Analyze Text'}
                                        </Button>
                                    </Grid>
                                </Grid>

                                {textError && (
                                    <Alert severity='error' sx={{ mt: 2 }}>
                                        {textError}
                                    </Alert>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography variant='h6' gutterBottom>
                                    Saved Analyses
                                </Typography>

                                {loadingAnalyses ? (
                                    <Box display='flex' justifyContent='center' py={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : analysesError ? (
                                    <Alert severity='error' sx={{ mt: 2 }}>
                                        {analysesError}
                                    </Alert>
                                ) : savedAnalyses.length === 0 ? (
                                    <Typography variant='body2' color='text.secondary'>
                                        No saved analyses found. Analyze some text to see results here.
                                    </Typography>
                                ) : (
                                    <List>
                                        {savedAnalyses.map((analysis) => (
                                            <React.Fragment key={analysis.id}>
                                                <ListItem
                                                    button
                                                    onClick={() => loadSavedAnalysis(analysis)}
                                                    sx={{
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            analysis.analysis_data.summary
                                                                ? `${analysis.analysis_data.summary.substring(0, 60)}...`
                                                                : 'Text analysis'
                                                        }
                                                        secondary={new Date(analysis.created_at).toLocaleString()}
                                                    />
                                                </ListItem>
                                                <Divider component='li' />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}

                                <Box display='flex' justifyContent='center' mt={2}>
                                    <Button size='small' onClick={fetchSavedAnalyses} disabled={loadingAnalyses}>
                                        Refresh
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {processingText && (
                        <Box display='flex' justifyContent='center' my={4}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Debug information when in debug mode */}
                    {debugMode && apiResponse && (
                        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f8ff' }}>
                            <Typography variant='h6' gutterBottom color='text.primary'>
                                Raw API Response
                            </Typography>
                            <Box
                                component='pre'
                                sx={{
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    p: 2,
                                    bgcolor: '#e0e0e0',
                                    color: '#000000',
                                    borderRadius: 1,
                                    fontSize: '0.875rem'
                                }}
                            >
                                {JSON.stringify(apiResponse, null, 2)}
                            </Box>
                        </Paper>
                    )}

                    {textResult && (
                        <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                            <Typography variant='h6' gutterBottom>
                                Analysis Results
                            </Typography>

                            <Grid container spacing={3}>
                                {textResult.summary && (
                                    <Grid item xs={12}>
                                        <Typography variant='subtitle1' fontWeight='bold' color='text.primary'>
                                            Summary
                                        </Typography>
                                        <Typography variant='body1' paragraph color='text.primary'>
                                            {textResult.summary}
                                        </Typography>
                                    </Grid>
                                )}

                                {textResult.sentiment_score !== undefined && (
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant='subtitle1' fontWeight='bold' color='text.primary'>
                                            Sentiment
                                        </Typography>
                                        <Typography variant='body1' color='text.primary'>
                                            Score: {textResult.sentiment_score}
                                            {textResult.sentiment_score > 0.5
                                                ? ' (Positive)'
                                                : textResult.sentiment_score < -0.5
                                                ? ' (Negative)'
                                                : ' (Neutral)'}
                                        </Typography>
                                    </Grid>
                                )}

                                {textResult.tags && textResult.tags.length > 0 && (
                                    <Grid item xs={12} sm={6} md={8}>
                                        <Typography variant='subtitle1' fontWeight='bold' color='text.primary'>
                                            Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {textResult.tags.map((tag) => (
                                                <Box
                                                    key={tag}
                                                    sx={{
                                                        bgcolor: 'primary.light',
                                                        color: 'primary.contrastText',
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 2,
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {tag}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Grid>
                                )}

                                {/* Display other analysis results based on what's available */}
                                {Object.entries(textResult)
                                    .filter(([key]) => !['summary', 'sentiment_score', 'tags'].includes(key))
                                    .map(([key, value]) => (
                                        <Grid item xs={12} key={key}>
                                            <Typography
                                                variant='subtitle1'
                                                fontWeight='bold'
                                                sx={{ textTransform: 'capitalize' }}
                                                color='text.primary'
                                            >
                                                {key.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography variant='body1' color='text.primary'>
                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </Typography>
                                        </Grid>
                                    ))}
                            </Grid>
                        </Paper>
                    )}
                </Box>
            )}

            {activeTab === 3 && (
                <Box>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant='h6' gutterBottom>
                            Generate New Report
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label='Report Name'
                                    value={reportName}
                                    onChange={(e) => setReportName(e.target.value)}
                                    disabled={isGeneratingReport}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label='Analysis Instructions'
                                    value={reportPrompt}
                                    onChange={(e) => setReportPrompt(e.target.value)}
                                    disabled={isGeneratingReport}
                                    helperText='Specify what aspects you want to analyze in the selected documents'
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant='subtitle1' gutterBottom>
                                    Select Documents to Analyze
                                </Typography>
                                <DocumentSelector
                                    researchView={effectiveResearchView}
                                    selectedDocuments={selectedDocuments}
                                    onSelectionChange={setSelectedDocuments}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant='contained'
                                        onClick={handleGenerateReport}
                                        disabled={
                                            isGeneratingReport ||
                                            !reportName.trim() ||
                                            !reportPrompt.trim() ||
                                            selectedDocuments.length === 0
                                        }
                                    >
                                        {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Typography variant='h6' gutterBottom>
                        Generated Reports
                    </Typography>
                    {loadingReports ? (
                        <CircularProgress />
                    ) : reports.length === 0 ? (
                        <Alert severity='info'>No reports generated yet. Select documents and generate your first report.</Alert>
                    ) : (
                        <List>
                            {reports.map((report) => (
                                <ListItem
                                    key={report.id}
                                    divider
                                    secondaryAction={
                                        <Typography variant='caption' color='text.secondary'>
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </Typography>
                                    }
                                >
                                    <ListItemText primary={report.name} secondary={`Version ${report.version || 1}`} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
        </Box>
    )
}

AnalysisPanel.propTypes = {
    researchView: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        document_count: PropTypes.number,
        answerai_store_id: PropTypes.string
    })
}

export default AnalysisPanel
