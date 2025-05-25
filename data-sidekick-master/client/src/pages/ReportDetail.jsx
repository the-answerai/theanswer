import { Box, Typography, Paper, CircularProgress, IconButton, Grid, List, ListItem, ListItemText, Chip } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { MDXEditor } from '@mdxeditor/editor'
import { getApiUrl } from '../config/api'
import CallPanel from '../components/calls/CallPanel'
import { useTheme } from '../context/ThemeContext'

// Import all the necessary plugins
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

// Import the styles
import '@mdxeditor/editor/style.css'

function ReportDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [localContent, setLocalContent] = useState('')
    const [hasContentChanged, setHasContentChanged] = useState(false)
    const [reportCalls, setReportCalls] = useState([])
    const [selectedCall, setSelectedCall] = useState(null)
    const [tagCategories, setTagCategories] = useState({})
    const { mode } = useTheme()

    // Fetch report data and associated calls
    useEffect(() => {
        const fetchReportAndCalls = async () => {
            try {
                const response = await fetch(getApiUrl(`api/reports/${id}`))
                const { data } = await response.json()
                console.log('Report data:', data)
                setReport(data)
                setLocalContent(data.content || '')
                setHasContentChanged(false)

                // Transform documents_analyzed into call format
                if (data.documents_analyzed?.length) {
                    console.log('Documents analyzed:', data.documents_analyzed)
                    const calls = data.documents_analyzed
                        .filter((doc) => doc.type === 'call_log')
                        .map((doc) => ({
                            ...doc.data,
                            RECORDING_URL: doc.documentId,
                            analysis: {
                                summary: doc.data.summary,
                                coaching: doc.data.coaching
                            }
                        }))

                    console.log('Transformed calls:', calls)
                    setReportCalls(calls)

                    // If we need transcripts, fetch them separately
                    if (calls.length) {
                        console.log(
                            'Fetching transcripts for calls:',
                            calls.map((c) => c.RECORDING_URL)
                        )
                        const callsResponse = await fetch(
                            getApiUrl(
                                `api/calls?recording_urls=${JSON.stringify(
                                    calls.map((c) => c.RECORDING_URL)
                                )}&fields=TRANSCRIPTION,WORD_TIMESTAMPS`
                            )
                        )
                        const callsData = await callsResponse.json()
                        console.log('Transcript data:', callsData)

                        // Merge transcription data with existing call data
                        const mergedCalls = calls.map((call) => {
                            const transcriptData = callsData.calls.find((c) => c.RECORDING_URL === call.RECORDING_URL)
                            return {
                                ...call,
                                TRANSCRIPTION: transcriptData?.TRANSCRIPTION,
                                WORD_TIMESTAMPS: transcriptData?.WORD_TIMESTAMPS
                            }
                        })

                        setReportCalls(mergedCalls)
                    }
                }
            } catch (error) {
                console.error('Error fetching report:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchReportAndCalls()
    }, [id])

    // Fetch tag categories
    useEffect(() => {
        const fetchTagCategories = async () => {
            try {
                const response = await fetch(getApiUrl('api/tags'))
                const data = await response.json()
                setTagCategories(data)
            } catch (error) {
                console.error('Error fetching tag categories:', error)
            }
        }

        fetchTagCategories()
    }, [])

    const handleContentChange = (content) => {
        setLocalContent(content)
        setHasContentChanged(true)
    }

    const handleCallClick = (call) => {
        setSelectedCall(call)
    }

    // Move handleSaveContent into useCallback to fix the dependency issue
    const handleSaveContent = useCallback(async () => {
        if (!hasContentChanged || !report) return

        try {
            const response = await fetch(getApiUrl(`api/reports/${report.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: report.name,
                    content: localContent
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update report content')
            }

            const { data } = await response.json()
            setReport((prev) => ({
                ...prev,
                content: data.content,
                name: data.name
            }))
            setHasContentChanged(false)
        } catch (error) {
            console.error('Error updating report content:', error)
            alert(`Failed to update report content: ${error.message}`)
        }
    }, [hasContentChanged, report, localContent])

    // Add auto-save effect
    useEffect(() => {
        if (hasContentChanged && report) {
            const timeoutId = setTimeout(() => {
                handleSaveContent()
            }, 1000) // Auto-save after 1 second of no changes

            return () => clearTimeout(timeoutId)
        }
    }, [hasContentChanged, report, handleSaveContent])

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!report) {
        return (
            <Box sx={{ mt: 4 }}>
                <Typography variant='h5' color='error'>
                    Report not found
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ height: 'calc(100vh - 100px)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                <IconButton onClick={() => navigate('/reports')} sx={{ color: mode === 'dark' ? '#ffffff' : 'inherit' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant='h4' component='h1' color={mode === 'dark' ? '#ffffff' : 'inherit'}>
                    {report.name}
                </Typography>
            </Box>

            <Grid container spacing={2} sx={{ height: 'calc(100% - 60px)' }}>
                {/* Left side - Calls List */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                        <Typography variant='h6' gutterBottom color={mode === 'dark' ? '#ffffff' : 'inherit'}>
                            Calls in Report
                        </Typography>
                        <List>
                            {reportCalls.map((call) => (
                                <ListItem
                                    key={call.RECORDING_URL}
                                    onClick={() => handleCallClick(call)}
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            color: mode === 'dark' ? '#ffffff' : 'inherit'
                                        },
                                        '& .MuiListItemText-secondary': {
                                            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'inherit'
                                        },
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ListItemText
                                        primary={`${call.EMPLOYEE_NAME} - ${call.CALLER_NAME}`}
                                        secondary={
                                            <Box
                                                component='span'
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    flexWrap: 'wrap',
                                                    mt: 0.5
                                                }}
                                            >
                                                {call.CALL_TYPE ? (
                                                    <Chip
                                                        size='small'
                                                        label={call.CALL_TYPE}
                                                        color='primary'
                                                        variant='outlined'
                                                        sx={{
                                                            backgroundColor: mode === 'dark' ? 'transparent' : 'inherit',
                                                            color: mode === 'dark' ? '#24C3A1' : 'inherit',
                                                            borderColor: mode === 'dark' ? '#24C3A1' : 'inherit'
                                                        }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        size='small'
                                                        label={'unknown'}
                                                        color='primary'
                                                        variant='outlined'
                                                        sx={{
                                                            backgroundColor: mode === 'dark' ? 'transparent' : 'inherit',
                                                            color: mode === 'dark' ? '#24C3A1' : 'inherit',
                                                            borderColor: mode === 'dark' ? '#24C3A1' : 'inherit'
                                                        }}
                                                    />
                                                )}
                                                <Chip
                                                    size='small'
                                                    label={`${call.CALL_DURATION}s`}
                                                    color='secondary'
                                                    variant='outlined'
                                                    sx={{
                                                        backgroundColor: mode === 'dark' ? 'transparent' : 'inherit',
                                                        color: mode === 'dark' ? '#ff9800' : 'inherit',
                                                        borderColor: mode === 'dark' ? '#ff9800' : 'inherit'
                                                    }}
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Right side - Report Editor */}
                <Grid item xs={12} md={8}>
                    <Paper
                        sx={{
                            height: '100%',
                            p: 2,
                            overflow: 'auto',
                            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                            '& .mdxeditor-toolbar': {
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                backgroundColor: mode === 'dark' ? '#1e1e1e' : 'background.paper',
                                borderBottom: '1px solid',
                                borderColor: mode === 'dark' ? '#24C3A1' : 'divider',
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                padding: '8px 4px',
                                boxShadow: mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
                                marginBottom: 2
                            },
                            "& .mdxeditor-toolbar [role='combobox'], & .mdxeditor-toolbar select, & .mdxeditor-toolbar [data-block-type-select]":
                                {
                                    backgroundColor: mode === 'dark' ? '#2d2d2d' : 'inherit',
                                    color: mode === 'dark' ? '#ffffff' : 'inherit',
                                    border: mode === 'dark' ? '1px solid #24C3A1' : 'inherit',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    minWidth: '120px',
                                    fontWeight: 500
                                },
                            '& .mdxeditor-toolbar span, & .mdxeditor-toolbar div': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit'
                            },
                            '& .mdxeditor': {
                                backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                border: mode === 'dark' ? '1px solid #24C3A1' : 'inherit',
                                borderRadius: '4px',
                                minHeight: '500px'
                            },
                            '& .mdxeditor-content-editable': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                padding: '16px',
                                fontSize: '16px',
                                lineHeight: 1.6
                            },
                            '& .mdxeditor button': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                backgroundColor: mode === 'dark' ? '#2d2d2d' : 'inherit',
                                margin: mode === 'dark' ? '0 2px' : 'inherit',
                                borderRadius: mode === 'dark' ? '4px' : 'inherit'
                            },
                            '& .mdxeditor button:hover': {
                                backgroundColor: mode === 'dark' ? '#3d3d3d' : 'rgba(0, 0, 0, 0.04)'
                            },
                            '& .mdxeditor button:active, & .mdxeditor button[data-active=true]': {
                                backgroundColor: mode === 'dark' ? '#24C3A1' : 'primary.main',
                                color: '#ffffff'
                            },
                            '& .mdxeditor select': {
                                backgroundColor: mode === 'dark' ? '#2d2d2d' : 'inherit',
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                borderColor: mode === 'dark' ? '#24C3A1' : 'inherit',
                                padding: mode === 'dark' ? '4px 8px' : 'inherit',
                                borderRadius: mode === 'dark' ? '4px' : 'inherit'
                            },
                            '& .mdxeditor svg': {
                                fill: mode === 'dark' ? '#ffffff' : 'inherit'
                            },
                            '& .mdxeditor-toolbar-group': {
                                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                                padding: '0 4px'
                            },
                            '& .prose': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit'
                            },
                            '& .prose h1, & .prose h2, & .prose h3, & .prose h4, & .prose h5, & .prose h6': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                marginTop: '1.5em',
                                marginBottom: '0.5em'
                            },
                            '& .prose p, & .prose ul, & .prose ol, & .prose li': {
                                color: mode === 'dark' ? '#ffffff' : 'inherit',
                                marginBottom: '0.75em'
                            }
                        }}
                    >
                        <MDXEditor
                            markdown={localContent}
                            onChange={handleContentChange}
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
                                    },
                                    theme: mode === 'dark' ? 'dark' : 'light'
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
                            contentEditableClassName={`prose max-w-full ${mode === 'dark' ? 'dark-mode-editor' : ''}`}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Call Panel */}
            <CallPanel call={selectedCall} open={!!selectedCall} onClose={() => setSelectedCall(null)} tagCategories={tagCategories} />
        </Box>
    )
}

export default ReportDetail
