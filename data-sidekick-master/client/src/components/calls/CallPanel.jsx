import { Box, Typography, IconButton, Paper, Drawer, Tabs, Tab, Slider, Chip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PropTypes from 'prop-types'
import { useState, useRef, useEffect } from 'react'
import { getSentimentEmoji, getSentimentGradient } from '../../utils/sentimentEmojis'
import { getRecordingUrl, getRecordingFilename } from '../../utils/recordingUrls'

// Utility function to convert to sentence case
const toSentenceCase = (str) => {
    // Handle camelCase and snake_case
    const words = str
        .replace(/([A-Z])/g, ' $1') // split camelCase
        .replace(/_/g, ' ') // replace underscores with spaces
        .toLowerCase()
        .trim()

    // Capitalize first letter
    return words.charAt(0).toUpperCase() + words.slice(1)
}

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role='tabpanel' hidden={value !== index} id={`call-tabpanel-${index}`} aria-labelledby={`call-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const CallPanel = ({ call, open, onClose, tagCategories }) => {
    const [tabValue, setTabValue] = useState(0)
    const audioRef = useRef(null)

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [])

    const renderTags = () => {
        if (!call?.TAGS_ARRAY?.length) return null

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {call.TAGS_ARRAY.map((tag) => {
                    if (!tag) return null // Skip null/undefined tags

                    let color = '#757575'
                    let label = tag

                    // Find the category and subcategory
                    for (const [categoryKey, category] of Object.entries(tagCategories || {})) {
                        if (!category) continue // Skip if category is null/undefined

                        if (tag === categoryKey) {
                            color = category.color || color
                            label = category.label || label
                            break
                        }
                        if (category.subcategories?.[tag]) {
                            color = category.subcategories[tag].color || color
                            label = category.subcategories[tag].label || label
                            break
                        }
                    }

                    const isLightColor =
                        color?.toLowerCase?.()?.includes('ff') ||
                        color?.toLowerCase?.()?.includes('f0') ||
                        color?.toLowerCase?.()?.includes('ee') ||
                        color?.toLowerCase?.()?.includes('e0')

                    return (
                        <Chip
                            key={tag}
                            label={label}
                            size='small'
                            sx={(theme) => ({
                                backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : color,
                                color: theme.palette.mode === 'dark' ? color : isLightColor ? 'rgba(0, 0, 0, 0.87)' : 'white',
                                border: theme.palette.mode === 'dark' ? `1px solid ${color}` : 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' ? `${color}22` : color,
                                    opacity: 0.9
                                }
                            })}
                        />
                    )
                })}
            </Box>
        )
    }

    const renderSentimentScale = () => {
        if (!call?.sentiment_score) return null

        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                    Call Sentiment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='h4'>{getSentimentEmoji(call.sentiment_score)}</Typography>
                    <Slider
                        value={call.sentiment_score}
                        min={1}
                        max={10}
                        step={1}
                        marks
                        disabled
                        sx={{
                            '& .MuiSlider-mark': {
                                backgroundColor: '#bfbfbf'
                            },
                            '& .MuiSlider-rail': {
                                background: getSentimentGradient(),
                                opacity: 1
                            }
                        }}
                    />
                </Box>
            </Box>
        )
    }

    const renderTranscriptWithHighlights = () => {
        if (!call?.TRANSCRIPTION) {
            return (
                <Typography variant='body2' color='text.secondary'>
                    No transcription available
                </Typography>
            )
        }

        return (
            <Typography variant='body1' component='div'>
                {call.TRANSCRIPTION}
            </Typography>
        )
    }

    if (!call) return null

    return (
        <Drawer
            anchor='right'
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: '40%', minWidth: 400, maxWidth: 600 }
            }}
        >
            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant='h5'>Call Details</Typography>
                    <IconButton onClick={onClose} size='small'>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Sentiment and Tags at the top */}
                {renderSentimentScale()}
                {renderTags()}

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label='call details tabs'>
                        <Tab label='AI Analysis' />
                        <Tab label='AI Coaching' />
                        <Tab label='Metadata' />
                        <Tab label='Transcript' />
                    </Tabs>
                </Box>

                {/* AI Analysis Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box>
                        <Typography variant='h6' gutterBottom>
                            AI Analysis
                        </Typography>
                        {call.summary ? (
                            <>
                                <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 2 }}>
                                    Summary
                                </Typography>
                                <Typography variant='body1' sx={{ mb: 3 }}>
                                    {call.summary}
                                </Typography>

                                {call.persona && (
                                    <>
                                        <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 3 }}>
                                            Custom Details
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {Object.entries(call.persona).map(([key, value]) => (
                                                <Box key={key} sx={{ mb: 2 }}>
                                                    <Typography variant='subtitle2' color='text.secondary'>
                                                        {toSentenceCase(key)}
                                                    </Typography>
                                                    <Typography variant='body1'>{value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                No AI analysis available
                            </Typography>
                        )}
                    </Box>
                </TabPanel>

                {/* AI Coaching Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box>
                        <Typography variant='h6' gutterBottom>
                            AI Coaching
                        </Typography>
                        {call.coaching ? (
                            <Typography variant='body1'>{call.coaching}</Typography>
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                No AI coaching available
                            </Typography>
                        )}
                    </Box>
                </TabPanel>

                {/* Call Metadata Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Call Number
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {call.CALL_NUMBER}
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Employee
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {call.EMPLOYEE_NAME} ({call.EMPLOYEE_ID})
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Caller
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {call.CALLER_NAME}
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Duration
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {call.CALL_DURATION} seconds
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Type
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {call.CALL_TYPE}
                        </Typography>
                    </Box>
                </TabPanel>

                {/* Recording & Transcript Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Box>
                        <Typography variant='h6' gutterBottom>
                            Recording
                        </Typography>
                        <audio
                            controls
                            style={{ width: '100%', marginBottom: '1rem' }}
                            src={getRecordingUrl(getRecordingFilename(call.RECORDING_URL))}
                            ref={audioRef}
                        >
                            <track kind='captions' />
                            Your browser does not support the audio element.
                        </audio>

                        <Typography variant='h6' gutterBottom>
                            Transcription
                        </Typography>
                        <Paper
                            sx={(theme) => ({
                                p: 2,
                                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
                                maxHeight: '400px',
                                overflow: 'auto',
                                ...(theme.palette.mode === 'dark' && {
                                    border: '1px solid #24C3A1',
                                    boxShadow: '0 0 5px #24C3A1'
                                })
                            })}
                        >
                            {renderTranscriptWithHighlights()}
                        </Paper>
                    </Box>
                </TabPanel>
            </Box>
        </Drawer>
    )
}

CallPanel.propTypes = {
    call: PropTypes.shape({
        id: PropTypes.string,
        RECORDING_URL: PropTypes.string,
        TRANSCRIPTION: PropTypes.string,
        WORD_TIMESTAMPS: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
        TAGS_ARRAY: PropTypes.array,
        sentiment_score: PropTypes.number,
        CALL_NUMBER: PropTypes.string,
        EMPLOYEE_NAME: PropTypes.string,
        EMPLOYEE_ID: PropTypes.string,
        CALLER_NAME: PropTypes.string,
        CALL_DURATION: PropTypes.number,
        CALL_TYPE: PropTypes.string,
        coaching: PropTypes.string,
        summary: PropTypes.string,
        persona: PropTypes.shape({
            demographics: PropTypes.string,
            reason_for_storage: PropTypes.string,
            additional_insights: PropTypes.string
        })
    }),
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tagCategories: PropTypes.object
}

export default CallPanel
