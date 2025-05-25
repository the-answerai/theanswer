import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Alert,
    Divider,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Chip,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip
} from '@mui/material'
import axios from 'axios'
import PropTypes from 'prop-types'
import DeleteIcon from '@mui/icons-material/Delete'
import { debounce } from 'lodash'
import { MDXEditor } from '@mdxeditor/editor'
import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    CreateLink,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    ListsToggle,
    imagePlugin,
    tablePlugin,
    linkPlugin,
    linkDialogPlugin,
    frontmatterPlugin,
    codeBlockPlugin,
    codeMirrorPlugin
} from '@mdxeditor/editor'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoIcon from '@mui/icons-material/Info'

const ReportsPanel = ({ researchView }) => {
    const [reportName, setReportName] = useState('')
    const [reportPrompt, setReportPrompt] = useState('')
    const [isGeneratingReport, setIsGeneratingReport] = useState(false)
    const [reports, setReports] = useState([])
    const [loadingReports, setLoadingReports] = useState(false)
    const [error, setError] = useState(null)
    const [selectedReport, setSelectedReport] = useState(null)
    const [reportConfig, setReportConfig] = useState([])
    const [isEditingConfig, setIsEditingConfig] = useState(false)

    // New state for prompt analysis
    const [activeStep, setActiveStep] = useState(0)
    const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState(false)
    const [promptAnalysisError, setPromptAnalysisError] = useState(null)

    useEffect(() => {
        if (researchView?.id) {
            fetchReports()
        }
    }, [researchView?.id])

    useEffect(() => {
        if (selectedReport) {
            if (selectedReport.status === 'configuring') {
                setReportName(selectedReport.name)
                setReportPrompt(selectedReport.custom_prompt)
                setReportConfig(selectedReport.report_config || [])
                if (selectedReport.report_config?.length > 0) {
                    setActiveStep(1)
                } else {
                    setActiveStep(0)
                }
            }
        } else {
            setReportName('')
            setReportPrompt('')
            setReportConfig([])
            setActiveStep(0)
        }
    }, [selectedReport])

    const fetchReports = async () => {
        setLoadingReports(true)
        setError(null)
        try {
            const response = await axios.get(`/api/analyzer/research-views/${researchView.id}/reports`)
            if (response.data?.success) {
                setReports(response.data.data || [])
            }
        } catch (err) {
            console.error('Error fetching reports:', err)
            setError('Failed to load reports')
        } finally {
            setLoadingReports(false)
        }
    }

    const handleAnalyzePrompt = async () => {
        if (!reportPrompt.trim()) {
            return
        }

        setIsAnalyzingPrompt(true)
        setPromptAnalysisError(null)
        try {
            // Step 1: Create or update the initial report
            let currentReport
            console.log('Starting analyze prompt with:', {
                reportName,
                reportPrompt
            })

            if (selectedReport?.id && selectedReport.id !== 'new' && selectedReport.status === 'configuring') {
                console.log('Updating existing report:', selectedReport.id)
                const updateResponse = await axios.put(`/api/analyzer/research-views/${researchView.id}/reports/${selectedReport.id}`, {
                    name: reportName,
                    customPrompt: reportPrompt,
                    status: 'configuring',
                    report_config: []
                })

                console.log('Update response:', updateResponse.data)
                if (!updateResponse.data?.success) {
                    throw new Error('Failed to update report')
                }

                currentReport = updateResponse.data.data
            } else {
                console.log('Creating new report')
                const createResponse = await axios.post(`/api/analyzer/research-views/${researchView.id}/reports`, {
                    name: reportName,
                    customPrompt: reportPrompt,
                    status: 'configuring',
                    report_config: []
                })

                console.log('Create response:', createResponse.data)
                if (!createResponse.data?.success) {
                    throw new Error('Failed to create report')
                }

                currentReport = createResponse.data.data
            }

            console.log('Step 1 - Current Report:', currentReport)

            // Step 2: Get the analysis from the API
            console.log('Getting analysis for prompt:', reportPrompt)
            const analysisResponse = await axios.post(`/api/analyzer/research-views/${researchView.id}/reports/analyze-prompt`, {
                prompt: reportPrompt
            })

            console.log('Analysis response:', analysisResponse.data)
            if (!analysisResponse.data?.success) {
                throw new Error('Failed to analyze prompt')
            }

            // Step 3: Transform the response into a config
            let config
            if (analysisResponse.data.data?.variations) {
                console.log('Transforming variations into config')
                config = [
                    {
                        id: `section-${Date.now()}-overview`,
                        title: 'Overview and Methodology',
                        description: 'Introduction and approach to the analysis',
                        focus_areas: ['Research objectives', 'Methodology', 'Scope']
                    },
                    ...analysisResponse.data.data.variations.map((variation, index) => ({
                        id: `section-${Date.now()}-${index}`,
                        title: variation.focus,
                        description: variation.text,
                        focus_areas: [variation.focus]
                    })),
                    {
                        id: `section-${Date.now()}-conclusions`,
                        title: 'Conclusions and Recommendations',
                        description: 'Summary of key findings and actionable recommendations',
                        focus_areas: ['Key findings', 'Recommendations', 'Next steps']
                    }
                ]
            } else {
                throw new Error('Invalid response format from server')
            }

            console.log('Generated config:', config)

            // Step 4: Save the config to the report
            console.log('Saving config to report:', currentReport.id)
            const configUpdateResponse = await axios.put(`/api/analyzer/research-views/${researchView.id}/reports/${currentReport.id}`, {
                name: reportName,
                customPrompt: reportPrompt,
                status: 'configuring',
                report_config: config
            })

            console.log('Config update response:', configUpdateResponse.data)
            if (!configUpdateResponse.data?.success) {
                throw new Error('Failed to save report configuration')
            }

            const updatedReport = configUpdateResponse.data.data
            console.log('Updated report with config:', updatedReport)

            // Step 5: Update all the states in the correct order
            console.log('Updating local state')
            setReportConfig(config)
            setSelectedReport(updatedReport)
            await fetchReports()

            // Step 6: Move to the next step
            setActiveStep(1)
        } catch (err) {
            console.error('Error in handleAnalyzePrompt:', err)
            console.error('Full error object:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            })
            setPromptAnalysisError(`Failed to analyze prompt: ${err.response?.data?.error || err.message}`)
            // Only go back to step 0 if we failed to create/update the initial report
            if (!selectedReport?.id) {
                setActiveStep(0)
            }
        } finally {
            setIsAnalyzingPrompt(false)
        }
    }

    const handleConfigurationChange = async (field, value) => {
        if (!selectedReport?.id || selectedReport.status !== 'configuring') {
            return
        }

        try {
            const updateData = {
                status: 'configuring'
            }

            // If updating report_config, include all fields to ensure consistency
            if (field === 'report_config') {
                updateData.name = reportName
                updateData.customPrompt = reportPrompt
                updateData.report_config = value
            } else {
                updateData[field] = value
            }

            const updateResponse = await axios.put(
                `/api/analyzer/research-views/${researchView.id}/reports/${selectedReport.id}`,
                updateData
            )

            if (!updateResponse.data?.success) {
                throw new Error('Failed to update report configuration')
            }

            // Update the selected report with the latest data
            setSelectedReport(updateResponse.data.data)
        } catch (err) {
            console.error('Error updating configuration:', err)
            setError(`Failed to save changes: ${err.response?.data?.error || err.message}`)
        }
    }

    const handleConfigItemChange = async (id, field, value) => {
        const newConfig = reportConfig.map((config) => (config.id === id ? { ...config, [field]: value } : config))
        setReportConfig(newConfig)
        await handleConfigurationChange('report_config', newConfig)
    }

    const handleAddConfigItem = () => {
        const newConfig = [
            ...reportConfig,
            {
                id: `section-${Date.now()}`,
                title: '',
                description: '',
                focus_areas: []
            }
        ]
        setReportConfig(newConfig)
        handleConfigurationChange('report_config', newConfig)
    }

    const handleRemoveConfigItem = (id) => {
        const newConfig = reportConfig.filter((config) => config.id !== id)
        setReportConfig(newConfig)
        handleConfigurationChange('report_config', newConfig)
    }

    // Debounce the configuration changes
    const debouncedConfigChange = React.useCallback(
        debounce((field, value) => {
            handleConfigurationChange(field, value)
        }, 1000),
        [] // Empty dependency array since we don't use any external values in the callback
    )

    const handleNameChange = (e) => {
        const newName = e.target.value
        setReportName(newName)
        debouncedConfigChange('name', newName)
    }

    const handlePromptChange = (e) => {
        const newPrompt = e.target.value
        setReportPrompt(newPrompt)
        debouncedConfigChange('customPrompt', newPrompt)
    }

    const handleGenerateReport = async () => {
        if (!selectedReport?.id) {
            return
        }

        setIsGeneratingReport(true)
        setError(null)
        try {
            const response = await axios.post(`/api/analyzer/research-views/${researchView.id}/reports`, {
                id: selectedReport.id,
                name: reportName,
                customPrompt: reportPrompt,
                status: 'generating',
                report_config: reportConfig
            })

            if (response.data?.success) {
                await fetchReports()
                setSelectedReport(response.data.data)
            }
        } catch (err) {
            console.error('Error generating report:', err)
            setError(`Failed to generate report: ${err.response?.data?.error || err.message}`)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    const handleDeleteReport = async (reportId) => {
        try {
            await axios.delete(`/api/analyzer/research-views/${researchView.id}/reports/${reportId}`)
            if (selectedReport?.id === reportId) {
                setSelectedReport(null)
            }
            await fetchReports()
        } catch (err) {
            console.error('Error deleting report:', err)
            setError(`Failed to delete report: ${err.response?.data?.error || err.message}`)
        }
    }

    const steps = ['Configure Report', 'Review Structure', 'Generate Report']

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label='Report Name'
                                value={reportName}
                                onChange={handleNameChange}
                                disabled={isAnalyzingPrompt}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label='Report Structure Instructions'
                                value={reportPrompt}
                                onChange={handlePromptChange}
                                disabled={isAnalyzingPrompt}
                                helperText='Describe the structure and focus areas you want for your report'
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant='contained'
                                    onClick={handleAnalyzePrompt}
                                    disabled={isAnalyzingPrompt || !reportName.trim() || !reportPrompt.trim()}
                                >
                                    {isAnalyzingPrompt ? 'Analyzing...' : 'Configure Report'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                )
            case 1:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant='h6'>Report Structure</Typography>
                                <Button variant='outlined' onClick={() => setIsEditingConfig(!isEditingConfig)}>
                                    {isEditingConfig ? 'Done Editing' : 'Edit Structure'}
                                </Button>
                            </Box>
                        </Grid>
                        {reportConfig.map((config) => (
                            <Grid item xs={12} key={config.id}>
                                <Card>
                                    <CardContent>
                                        {isEditingConfig ? (
                                            <>
                                                <TextField
                                                    fullWidth
                                                    label='Section Title'
                                                    value={config.title}
                                                    onChange={(e) => handleConfigItemChange(config.id, 'title', e.target.value)}
                                                    sx={{ mb: 2 }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    label='Description'
                                                    value={config.description}
                                                    onChange={(e) => handleConfigItemChange(config.id, 'description', e.target.value)}
                                                    sx={{ mb: 2 }}
                                                />
                                                <TextField
                                                    fullWidth
                                                    label='Focus Areas'
                                                    value={config.focus_areas.join(', ')}
                                                    onChange={(e) =>
                                                        handleConfigItemChange(
                                                            config.id,
                                                            'focus_areas',
                                                            e.target.value.split(',').map((s) => s.trim())
                                                        )
                                                    }
                                                    helperText='Separate focus areas with commas'
                                                />
                                                <Box sx={{ mt: 2 }}>
                                                    <Button color='error' onClick={() => handleRemoveConfigItem(config.id)}>
                                                        Remove Section
                                                    </Button>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Typography variant='h6' gutterBottom>
                                                    {config.title}
                                                </Typography>
                                                <Typography variant='body1' paragraph>
                                                    {config.description}
                                                </Typography>
                                                <Typography variant='subtitle2'>Focus Areas:</Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    {config.focus_areas.map((area) => (
                                                        <Chip key={`${config.id}-${area}`} label={area} sx={{ mr: 1, mb: 1 }} />
                                                    ))}
                                                </Box>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                        {isEditingConfig && (
                            <Grid item xs={12}>
                                <Button variant='outlined' fullWidth onClick={handleAddConfigItem}>
                                    Add Section
                                </Button>
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Button onClick={() => setActiveStep(0)}>Back</Button>
                                <Button variant='contained' onClick={handleContinueToGenerate} disabled={reportConfig.length === 0}>
                                    Continue
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                )
            case 2:
                return (
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant='h6' gutterBottom>
                                Review and Generate Report
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Button onClick={() => setActiveStep(1)}>Back</Button>
                                <Button variant='contained' onClick={handleGenerateReport} disabled={isGeneratingReport}>
                                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                )
            default:
                return null
        }
    }

    const VectorSearchResults = ({ results }) => {
        if (!results || !Array.isArray(results) || results.length === 0) {
            return null
        }

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant='h6' gutterBottom>
                    Related Documents by Section
                </Typography>
                {results.map((section) => (
                    <Accordion key={section.sectionId}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{section.sectionTitle}</Typography>
                            <Tooltip title='These are semantically similar documents found for this section'>
                                <IconButton size='small' sx={{ ml: 1 }}>
                                    <InfoIcon fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </AccordionSummary>
                        <AccordionDetails>
                            {section.error ? (
                                <Alert severity='error'>{section.error}</Alert>
                            ) : section.results && section.results.length > 0 ? (
                                <List dense>
                                    {section.results.map((result, index) => (
                                        <ListItem key={`${section.sectionId}-${index}`}>
                                            <ListItemText
                                                primary={result.title || 'Untitled Document'}
                                                secondary={
                                                    <>
                                                        <Typography component='span' variant='body2' color='text.primary'>
                                                            Similarity Score: {(result.score * 100).toFixed(2)}%
                                                        </Typography>
                                                        {result.excerpt && (
                                                            <Typography component='p' variant='body2' color='text.secondary'>
                                                                {result.excerpt}
                                                            </Typography>
                                                        )}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color='text.secondary'>No related documents found for this section</Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        )
    }

    VectorSearchResults.propTypes = {
        results: PropTypes.arrayOf(
            PropTypes.shape({
                sectionId: PropTypes.string.isRequired,
                sectionTitle: PropTypes.string.isRequired,
                error: PropTypes.string,
                results: PropTypes.arrayOf(
                    PropTypes.shape({
                        title: PropTypes.string,
                        score: PropTypes.number.isRequired,
                        excerpt: PropTypes.string
                    })
                )
            })
        )
    }

    const renderReportContent = (report) => {
        if (!report.content) {
            return (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && (
                        <Alert severity='error' sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {promptAnalysisError && (
                        <Alert severity='error' sx={{ mb: 2 }}>
                            {promptAnalysisError}
                        </Alert>
                    )}

                    {renderStepContent(activeStep)}
                </Paper>
            )
        }

        return (
            <Box>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <MDXEditor
                        markdown={report.content}
                        plugins={[
                            headingsPlugin(),
                            listsPlugin(),
                            quotePlugin(),
                            thematicBreakPlugin(),
                            markdownShortcutPlugin(),
                            codeBlockPlugin(),
                            codeMirrorPlugin({
                                codeBlockLanguages: {
                                    js: 'JavaScript',
                                    jsx: 'JSX',
                                    ts: 'TypeScript',
                                    tsx: 'TSX',
                                    css: 'CSS',
                                    html: 'HTML',
                                    json: 'JSON'
                                }
                            }),
                            frontmatterPlugin(),
                            linkPlugin(),
                            linkDialogPlugin(),
                            imagePlugin(),
                            tablePlugin(),
                            toolbarPlugin({
                                toolbarContents: () => (
                                    <>
                                        <UndoRedo />
                                        <BoldItalicUnderlineToggles />
                                        <BlockTypeSelect />
                                        <CreateLink />
                                        <InsertImage />
                                        <InsertTable />
                                        <InsertThematicBreak />
                                        <ListsToggle />
                                    </>
                                )
                            })
                        ]}
                        readOnly
                    />
                </Paper>
                {report.vector_search_results && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <VectorSearchResults results={report.vector_search_results} />
                    </Paper>
                )}
            </Box>
        )
    }

    const handleCreateNewReport = () => {
        setSelectedReport({
            name: '',
            custom_prompt: '',
            content: '',
            status: 'configuring'
        })
        setReportName('')
        setReportPrompt('')
        setActiveStep(0)
        setError(null)
        setPromptAnalysisError(null)
    }

    const handleContinueToGenerate = async () => {
        try {
            // Start generating the report immediately instead of just updating configuration
            setIsGeneratingReport(true)
            setError(null)

            const response = await axios.post(`/api/analyzer/research-views/${researchView.id}/reports`, {
                id: selectedReport.id,
                name: reportName,
                customPrompt: reportPrompt,
                status: 'generating',
                report_config: reportConfig
            })

            if (!response.data?.success) {
                throw new Error('Failed to start report generation')
            }

            setSelectedReport(response.data.data)
            setActiveStep(2)
            await fetchReports() // Refresh the reports list
        } catch (err) {
            console.error('Error starting report generation:', err)
            setError(`Failed to start generation: ${err.response?.data?.error || err.message}`)
        } finally {
            setIsGeneratingReport(false)
        }
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant='h5'>Reports</Typography>
                <Button variant='contained' onClick={handleCreateNewReport} disabled={isGeneratingReport || isAnalyzingPrompt}>
                    Create New Report
                </Button>
            </Box>

            {error && (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                        <List>
                            {loadingReports ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress />
                                </Box>
                            ) : reports.length === 0 ? (
                                <Typography variant='body2' color='textSecondary' align='center'>
                                    No reports yet
                                </Typography>
                            ) : (
                                reports.map((report) => (
                                    <React.Fragment key={report.id}>
                                        <ListItem
                                            button
                                            selected={selectedReport?.id === report.id}
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <ListItemText
                                                primary={report.name || 'Untitled Report'}
                                                secondary={`${new Date(report.created_at).toLocaleDateString()} - ${report.status}`}
                                                primaryTypographyProps={{
                                                    style: {
                                                        fontWeight: selectedReport?.id === report.id ? 'bold' : 'normal'
                                                    }
                                                }}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge='end'
                                                    aria-label='delete'
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteReport(report.id)
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    {selectedReport && renderReportContent(selectedReport)}
                </Grid>
            </Grid>
        </Box>
    )
}

ReportsPanel.propTypes = {
    researchView: PropTypes.shape({
        id: PropTypes.string.isRequired
    }).isRequired
}

export default ReportsPanel
