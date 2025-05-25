import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Container,
    CircularProgress,
    Chip,
    Alert,
    Grid,
    Paper,
    IconButton
} from '@mui/material'
import PropTypes from 'prop-types'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import EditIcon from '@mui/icons-material/Edit'
import { createClient } from '@supabase/supabase-js'
import { getApiUrl } from '../config/api'
import { getRecordingFilename } from '../utils/recordingUrls'
import FAQEditDialog from '../components/FAQEditDialog'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function AudioPlayer({ url, transcript }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [error, setError] = useState(null)
    const [audioUrl, setAudioUrl] = useState(null)
    const audioRef = useRef(null)
    const cleanFilename = getRecordingFilename(url)

    // Fetch signed URL for the audio file
    useEffect(() => {
        async function fetchAudioUrl() {
            try {
                const { data, error: signedUrlError } = await supabase.storage.from('call-recordings').createSignedUrl(cleanFilename, 3600) // 1 hour expiry

                if (signedUrlError) {
                    throw signedUrlError
                }

                console.log('Audio URL:', {
                    original: url,
                    cleanFilename,
                    signedUrl: data?.signedUrl
                })

                setAudioUrl(data?.signedUrl)
            } catch (err) {
                console.error('Error getting signed URL:', err)
                setError('Failed to load audio file. Please try again later.')
            }
        }

        if (cleanFilename) {
            fetchAudioUrl()
        }
    }, [url, cleanFilename])

    // Handle audio loading errors
    const handleError = (e) => {
        console.error('Audio loading error:', e)
        setError('Failed to load audio file. Please try again later.')
    }

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
        }
    }, [])

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Audio Transcript
            </Typography>
            {audioUrl ? (
                <audio
                    controls
                    style={{ width: '100%', marginBottom: '1rem' }}
                    src={audioUrl}
                    ref={audioRef}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onError={handleError}
                    crossOrigin='anonymous'
                    preload='metadata'
                >
                    <track kind='captions' />
                    Your browser does not support the audio element.
                </audio>
            ) : (
                !error && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )
            )}

            {error && (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {isPlaying && transcript && (
                <Paper
                    sx={(theme) => ({
                        p: 2,
                        mt: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
                        maxHeight: '400px',
                        overflow: 'auto',
                        ...(theme.palette.mode === 'dark' && {
                            border: '1px solid #24C3A1',
                            boxShadow: '0 0 5px #24C3A1'
                        })
                    })}
                >
                    <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                        Following Along:
                    </Typography>
                    <Typography variant='body1' component='div'>
                        {transcript}
                    </Typography>
                </Paper>
            )}
        </Box>
    )
}

AudioPlayer.propTypes = {
    url: PropTypes.string.isRequired,
    transcript: PropTypes.string
}

function FAQPage() {
    const [faqs, setFaqs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10
    })
    const [totalRows, setTotalRows] = useState(0)
    const [tagCategories, setTagCategories] = useState({})
    const [selectedTag, setSelectedTag] = useState(null)
    const [tagCounts, setTagCounts] = useState({})
    const [selectedStatus, setSelectedStatus] = useState('approved')
    const [statusCounts, setStatusCounts] = useState({})
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedFaq, setSelectedFaq] = useState(null)

    // Status options with colors
    const statusOptions = {
        new: { label: 'New', color: '#2196f3' },
        approved: { label: 'Approved', color: '#4caf50' },
        ignored: { label: 'Ignored', color: '#f44336' }
    }

    // Fetch status counts
    const fetchStatusCounts = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('faqs').select('status')

            if (error) throw error

            const counts = data.reduce((acc, faq) => {
                acc[faq.status] = (acc[faq.status] || 0) + 1
                return acc
            }, {})

            setStatusCounts(counts)
        } catch (err) {
            console.error('Error fetching status counts:', err)
        }
    }, [])

    // Initial load of status counts
    useEffect(() => {
        fetchStatusCounts()
    }, [fetchStatusCounts])

    // Fetch tag categories
    useEffect(() => {
        async function fetchTagCategories() {
            try {
                const response = await fetch(getApiUrl('/api/tags'))
                const data = await response.json()
                setTagCategories(data)
            } catch (err) {
                console.error('Error fetching tag categories:', err)
            }
        }

        fetchTagCategories()
    }, [])

    // Fetch tag counts
    const fetchTagCounts = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('faqs').select('original_tags')

            if (error) throw error

            const counts = {}
            for (const faq of data) {
                if (faq.original_tags) {
                    for (const tag of faq.original_tags) {
                        counts[tag] = (counts[tag] || 0) + 1
                    }
                }
            }
            setTagCounts(counts)
        } catch (err) {
            console.error('Error fetching tag counts:', err)
        }
    }, [])

    // Initial load of tag counts
    useEffect(() => {
        fetchTagCounts()
    }, [fetchTagCounts])

    useEffect(() => {
        async function fetchFaqs() {
            try {
                console.log('Fetching FAQs...')
                let query = supabase
                    .from('faqs')
                    .select(
                        `
            id,
            question,
            answer,
            reasoning,
            tags,
            transcript_id,
            recording_url,
            original_tags,
            created_at,
            updated_at,
            status,
            call_logs:transcript_id (
              TRANSCRIPTION
            ),
            internal_notes
          `,
                        { count: 'exact' }
                    )
                    .order('created_at', { ascending: false })
                    .range(paginationModel.page * paginationModel.pageSize, (paginationModel.page + 1) * paginationModel.pageSize - 1)

                // Apply status filter
                if (selectedStatus) {
                    query = query.eq('status', selectedStatus)
                }

                // Apply tag filter if selected
                if (selectedTag) {
                    query = query.contains('original_tags', [selectedTag])
                }

                const { data, error, count } = await query

                if (error) {
                    console.error('Supabase error:', error)
                    throw error
                }

                const transformedData =
                    data?.map((faq) => ({
                        ...faq,
                        transcript: faq.call_logs?.TRANSCRIPTION || null
                    })) || []

                console.log('FAQs fetched:', transformedData)
                setFaqs(transformedData)
                setTotalRows(count || 0)
            } catch (err) {
                console.error('Error fetching FAQs:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchFaqs()
    }, [paginationModel, selectedTag, selectedStatus])

    const handleTagSelect = (tag) => {
        setSelectedTag(selectedTag === tag ? null : tag)
        setPaginationModel((prev) => ({ ...prev, page: 0 }))
    }

    const handleEditClick = (faq, event) => {
        event.stopPropagation() // Prevent accordion from toggling
        setSelectedFaq(faq)
        setEditDialogOpen(true)
    }

    const handleEditClose = () => {
        setSelectedFaq(null)
        setEditDialogOpen(false)
    }

    const handleEditSave = async (formData) => {
        try {
            const { error: updateError } = await supabase
                .from('faqs')
                .update({
                    question: formData.question,
                    reasoning: formData.reasoning,
                    internal_notes: formData.internal_notes,
                    status: formData.status,
                    original_tags: formData.tags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedFaq.id)

            if (updateError) throw updateError

            // Update local state
            setFaqs((prevFaqs) =>
                prevFaqs.map((faq) =>
                    faq.id === selectedFaq.id
                        ? {
                              ...faq,
                              question: formData.question,
                              reasoning: formData.reasoning,
                              internal_notes: formData.internal_notes,
                              status: formData.status,
                              original_tags: formData.tags
                          }
                        : faq
                )
            )

            // Refresh status counts
            await fetchStatusCounts()

            // Refresh tag counts if tags were updated
            if (formData.tags !== selectedFaq.original_tags) {
                await fetchTagCounts()
            }
        } catch (err) {
            console.error('Error updating FAQ:', err)
            throw new Error('Failed to update FAQ. Please try again.')
        }
    }

    if (loading) {
        return (
            <Container maxWidth='lg'>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    if (error) {
        return (
            <Container maxWidth='lg'>
                <Alert severity='error' sx={{ mt: 4 }}>
                    Error loading FAQs: {error}
                </Alert>
            </Container>
        )
    }

    return (
        <Container maxWidth='lg'>
            <Box sx={{ mb: 4 }}>
                <Typography variant='h4' component='h1' gutterBottom>
                    Frequently Asked Questions
                </Typography>
                <Typography variant='body1' color='text.secondary' gutterBottom>
                    Common questions and solutions from our support interactions
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Left sidebar with filters */}
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, mb: { xs: 2, md: 0 } }}>
                        {/* Status Filter Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant='h6' gutterBottom>
                                FAQ Status
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {Object.entries(statusOptions).map(([status, { label, color }]) => (
                                    <Chip
                                        key={status}
                                        label={`${label} (${statusCounts[status] || 0})`}
                                        onClick={() => {
                                            setSelectedStatus(selectedStatus === status ? null : status)
                                            setPaginationModel((prev) => ({ ...prev, page: 0 }))
                                        }}
                                        sx={{
                                            bgcolor: selectedStatus === status ? `${color}22` : 'transparent',
                                            border: `1px solid ${color}`,
                                            color: selectedStatus === status ? color : 'text.primary',
                                            '&:hover': {
                                                bgcolor: `${color}33`
                                            },
                                            width: '100%',
                                            justifyContent: 'flex-start'
                                        }}
                                        variant={selectedStatus === status ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* Issue Type Filter Section */}
                        <Box>
                            <Typography variant='h6' gutterBottom>
                                Issue Type
                            </Typography>
                            {Object.entries(tagCategories)
                                .filter(([key]) => key === 'issue-type')
                                .map(([categoryKey, category]) => (
                                    <Box key={categoryKey}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {Object.entries(category.subcategories || {}).map(([subKey, subCategory]) => (
                                                <Chip
                                                    key={subKey}
                                                    label={`${subCategory.label} (${tagCounts[subKey] || 0})`}
                                                    onClick={() => handleTagSelect(subKey)}
                                                    sx={{
                                                        bgcolor: selectedTag === subKey ? `${subCategory.color}22` : 'transparent',
                                                        border: `1px solid ${subCategory.color}`,
                                                        color: selectedTag === subKey ? subCategory.color : 'text.primary',
                                                        '&:hover': {
                                                            bgcolor: `${subCategory.color}33`
                                                        },
                                                        width: '100%',
                                                        justifyContent: 'flex-start'
                                                    }}
                                                    variant={selectedTag === subKey ? 'filled' : 'outlined'}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Main content */}
                <Grid item xs={12} md={9}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant='body2' color='text.secondary'>
                            Showing {paginationModel.page * paginationModel.pageSize + 1} -{' '}
                            {Math.min((paginationModel.page + 1) * paginationModel.pageSize, totalRows)} of {totalRows} FAQs
                        </Typography>
                    </Box>

                    <Box>
                        {faqs.map((faq) => (
                            <Accordion key={faq.id}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`faq-content-${faq.id}`}
                                    id={`faq-header-${faq.id}`}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            width: '100%'
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant='h6'>{faq.question}</Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {faq.tags?.map((tag) => (
                                                    <Chip key={`${faq.id}-${tag}`} label={tag} size='small' sx={{ mr: 1, mb: 1 }} />
                                                ))}
                                            </Box>
                                        </Box>
                                        <IconButton onClick={(e) => handleEditClick(faq, e)} size='small' sx={{ ml: 1, mt: -0.5 }}>
                                            <EditIcon />
                                        </IconButton>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</Typography>
                                    {faq.reasoning && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant='subtitle2' color='text.secondary'>
                                                Additional Context:
                                            </Typography>
                                            <Typography variant='body2' color='text.secondary'>
                                                {faq.reasoning}
                                            </Typography>
                                        </Box>
                                    )}
                                    {faq.internal_notes && (
                                        <Box
                                            sx={{
                                                mt: 2,
                                                p: 2,
                                                bgcolor: (theme) =>
                                                    theme.palette.mode === 'dark' ? 'rgba(36, 195, 161, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: (theme) => (theme.palette.mode === 'dark' ? '#24C3A1' : '#1976d2')
                                            }}
                                        >
                                            <Typography variant='subtitle2' color='primary' gutterBottom>
                                                Internal Notes:
                                            </Typography>
                                            <Typography variant='body2' color='text.primary' sx={{ whiteSpace: 'pre-wrap' }}>
                                                {faq.internal_notes}
                                            </Typography>
                                        </Box>
                                    )}
                                    {faq.recording_url && <AudioPlayer url={faq.recording_url} transcript={faq.transcript} />}
                                </AccordionDetails>
                            </Accordion>
                        ))}

                        {faqs.length === 0 && <Alert severity='info'>No FAQs available at the moment.</Alert>}
                    </Box>

                    {/* Pagination controls */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 3,
                            gap: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                onClick={() =>
                                    setPaginationModel((prev) => ({
                                        ...prev,
                                        page: Math.max(0, prev.page - 1)
                                    }))
                                }
                                disabled={paginationModel.page === 0}
                            >
                                <KeyboardArrowUpIcon />
                            </IconButton>
                            <Typography variant='body2' color='text.secondary'>
                                Page {paginationModel.page + 1} of {Math.ceil(totalRows / paginationModel.pageSize)}
                            </Typography>
                            <IconButton
                                onClick={() =>
                                    setPaginationModel((prev) => ({
                                        ...prev,
                                        page: Math.min(Math.ceil(totalRows / paginationModel.pageSize) - 1, prev.page + 1)
                                    }))
                                }
                                disabled={paginationModel.page >= Math.ceil(totalRows / paginationModel.pageSize) - 1}
                            >
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Add the FAQEditDialog */}
            <FAQEditDialog
                open={editDialogOpen}
                onClose={handleEditClose}
                faq={selectedFaq}
                tagCategories={tagCategories}
                onSave={handleEditSave}
            />
        </Container>
    )
}

export default FAQPage
