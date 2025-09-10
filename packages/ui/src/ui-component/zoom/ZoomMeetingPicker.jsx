import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import {
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    ListItemIcon,
    Typography,
    Box,
    CircularProgress,
    Chip,
    Tabs,
    Tab,
    TextField,
    Grid,
    Alert,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link
} from '@mui/material'
import useApi from '@/hooks/useApi'
import credentialsApi from '@/api/credentials'
import zoomApi from '@/api/zoom'
import { IconX, IconTrash, IconCalendar, IconRefresh, IconUsers, IconBuilding, IconExternalLink, IconSearch } from '@tabler/icons-react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role='tabpanel' hidden={value !== index} id={`meeting-tabpanel-${index}`} aria-labelledby={`meeting-tab-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

export const ZoomMeetingPicker = ({ onChange, value, disabled, credentialId, credentialData, handleCredentialDataChange }) => {
    const dispatch = useDispatch()
    const [selectedMeetings, setSelectedMeetings] = useState(value ? JSON.parse(value) : [])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [meetings, setMeetings] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [accessToken, setAccessToken] = useState(null)
    const [isTokenExpired, setIsTokenExpired] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState(0)
    const [searchFilter, setSearchFilter] = useState('')

    // Date range state - using ISO date strings for HTML5 date inputs
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date()
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(today.getDate() - 14)

        return {
            from: fourteenDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
            to: today.toISOString().split('T')[0] // YYYY-MM-DD format
        }
    })

    // Account ID for organization meetings (would typically come from user context)
    const [accountId, setAccountId] = useState('')

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))
    const getCredentialDataApi = useApi(credentialsApi.getSpecificCredential)

    // Meeting types configuration
    const meetingTypes = [
        {
            key: 'my',
            label: 'My Meetings',
            icon: IconCalendar,
            description: 'Meetings where you are the host',
            apiMethod: zoomApi.getMeetings
        },
        {
            key: 'shared',
            label: 'Shared Meetings',
            icon: IconUsers,
            description: 'Meetings that have been shared with you',
            apiMethod: zoomApi.getSharedMeetings
        },
        {
            key: 'organization',
            label: 'Organization',
            icon: IconBuilding,
            description: 'Organization-wide meetings (admin access required)',
            apiMethod: zoomApi.getOrganizationMeetings
        }
    ]

    // Initialize from credentialData prop if available
    useEffect(() => {
        if (credentialData?.plainDataObj) {
            const expiresAt = new Date(credentialData.plainDataObj.expiresAt)
            const now = new Date()
            const isExpired = expiresAt < now

            setIsTokenExpired(isExpired)
            setAccessToken(credentialData.plainDataObj.zoomAccessToken ?? '')

            // Set account ID if available in credentials
            if (credentialData.plainDataObj.accountId) {
                setAccountId(credentialData.plainDataObj.accountId)
            }
        }
    }, [credentialData])

    // Initialize selected meetings from value if it exists
    useEffect(() => {
        if (value) {
            try {
                const meetings = JSON.parse(value)
                setSelectedMeetings(meetings)
            } catch (e) {
                console.error('Error parsing selected meetings:', e)
            }
        }
    }, [value])

    const fetchMeetings = async (meetingType = 'my') => {
        if (!accessToken) return

        setLoading(true)
        setError(null)

        try {
            const config = meetingTypes.find((type) => type.key === meetingType)
            if (!config) {
                throw new Error(`Invalid meeting type: ${meetingType}`)
            }

            // Prepare request payload
            const payload = {
                accessToken,
                fromDate: dateRange.from,
                toDate: dateRange.to,
                pageSize: 50
            }

            // Add account ID for organization meetings
            if (meetingType === 'organization') {
                if (!accountId) {
                    throw new Error('Account ID is required for organization meetings')
                }
                payload.accountId = accountId
            }

            const response = await config.apiMethod(payload)

            if (response.data && Array.isArray(response.data.meetings)) {
                setMeetings((prev) => ({
                    ...prev,
                    [meetingType]: {
                        meetings: response.data.meetings,
                        total_records: response.data.total_records,
                        page_count: response.data.page_count
                    }
                }))
            } else {
                setMeetings((prev) => ({
                    ...prev,
                    [meetingType]: { meetings: [], total_records: 0, page_count: 0 }
                }))
            }
        } catch (err) {
            console.error(`Error fetching ${meetingType} meetings:`, err)
            const errorMessage = err.response?.data?.message || err.message || 'Unknown error'
            setError(`Failed to load ${meetingType} meetings: ${errorMessage}`)

            enqueueSnackbar({
                message: `Failed to load ${meetingType} meetings: ${errorMessage}`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = () => {
        setIsDialogOpen(true)
        // Load meetings for current tab if not already loaded
        const currentType = meetingTypes[activeTab].key
        if (!meetings[currentType]) {
            fetchMeetings(currentType)
        }
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
        setError(null)

        // Load meetings for the new tab if not already loaded
        const newType = meetingTypes[newValue].key
        if (!meetings[newType]) {
            fetchMeetings(newType)
        }
    }

    const handleDateRangeChange = (field, dateString) => {
        setDateRange((prev) => ({
            ...prev,
            [field]: dateString
        }))
    }

    const handleRefreshMeetings = () => {
        const currentType = meetingTypes[activeTab].key
        fetchMeetings(currentType)
    }

    const handleMeetingToggle = (meeting) => {
        const isSelected = selectedMeetings.some((selected) => selected.id === meeting.id)
        let updatedMeetings

        if (isSelected) {
            updatedMeetings = selectedMeetings.filter((selected) => selected.id !== meeting.id)
        } else {
            const meetingInfo = {
                id: meeting.id,
                topic: meeting.topic,
                start_time: meeting.start_time,
                duration: meeting.duration,
                host_email: meeting.host_email,
                meeting_type: meeting.meeting_type || meetingTypes[activeTab].key
            }
            updatedMeetings = [...selectedMeetings, meetingInfo]
        }

        setSelectedMeetings(updatedMeetings)
    }

    const handleSaveSelection = () => {
        onChange(JSON.stringify(selectedMeetings))
        setIsDialogOpen(false)
    }

    const handleClearAll = () => {
        setSelectedMeetings([])
        onChange(JSON.stringify([]))
    }

    const handleRemoveMeeting = (meetingId) => {
        const updatedMeetings = selectedMeetings.filter((meeting) => meeting.id !== meetingId)
        setSelectedMeetings(updatedMeetings)
        onChange(JSON.stringify(updatedMeetings))
    }

    const handleRefreshAccessToken = async () => {
        try {
            setIsRefreshing(true)
            const response = await credentialsApi.refreshAccessToken({ credentialId })

            if (response.status === 200) {
                setIsTokenExpired(false)

                enqueueSnackbar({
                    message: 'Successfully refreshed access token',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        } catch (error) {
            console.error('Error refreshing access token:', error)

            const errorMessage = error.response?.data?.message || 'Error refreshing access token'

            enqueueSnackbar({
                message: errorMessage,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setIsRefreshing(false)
        }
    }

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString()
    }

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const getCurrentMeetings = () => {
        const currentType = meetingTypes[activeTab].key
        return meetings[currentType]?.meetings || []
    }

    // Filter meetings based on search text
    const getFilteredMeetings = () => {
        const currentMeetings = getCurrentMeetings()

        if (!searchFilter.trim()) {
            return currentMeetings
        }

        const searchTerm = searchFilter.toLowerCase()
        return currentMeetings.filter(
            (meeting) =>
                meeting.topic?.toLowerCase().includes(searchTerm) ||
                meeting.host_email?.toLowerCase().includes(searchTerm) ||
                formatDateTime(meeting.start_time).toLowerCase().includes(searchTerm)
        )
    }

    // Generate recording URL - this is a typical Zoom cloud recording URL pattern
    const getRecordingUrl = (meeting) => {
        // If the meeting has a direct recording URL, use it
        if (meeting.recording_url) {
            return meeting.recording_url
        }

        // If meeting has recording files, use the first one
        if (meeting.recording_files && meeting.recording_files.length > 0) {
            return meeting.recording_files[0].play_url || meeting.recording_files[0].download_url
        }

        // Fallback: construct URL based on meeting ID (this might need adjustment based on actual Zoom API response)
        return `https://zoom.us/rec/share/${meeting.id}`
    }

    const renderMeetingsTable = () => {
        const filteredMeetings = getFilteredMeetings()

        if (loading) {
            return (
                <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
                    <CircularProgress />
                    <Typography variant='body2' sx={{ ml: 2 }}>
                        Loading meetings...
                    </Typography>
                </Box>
            )
        }

        if (error) {
            return (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )
        }

        if (filteredMeetings.length === 0) {
            return (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                        {searchFilter
                            ? 'No meetings found matching your search criteria.'
                            : 'No recorded meetings found for the selected date range.'}
                    </Typography>
                </Box>
            )
        }

        return (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size='small' aria-label='meetings table'>
                    <TableHead>
                        <TableRow>
                            <TableCell padding='checkbox'>
                                <Checkbox
                                    indeterminate={selectedMeetings.length > 0 && selectedMeetings.length < filteredMeetings.length}
                                    checked={filteredMeetings.length > 0 && selectedMeetings.length === filteredMeetings.length}
                                    onChange={(event) => {
                                        if (event.target.checked) {
                                            const allMeetings = filteredMeetings.map((meeting) => ({
                                                id: meeting.id,
                                                topic: meeting.topic,
                                                start_time: meeting.start_time,
                                                duration: meeting.duration,
                                                host_email: meeting.host_email,
                                                meeting_type: meeting.meeting_type || meetingTypes[activeTab].key
                                            }))
                                            setSelectedMeetings(allMeetings)
                                        } else {
                                            setSelectedMeetings([])
                                        }
                                    }}
                                />
                            </TableCell>
                            <TableCell>Meeting Name</TableCell>
                            <TableCell>Date & Time</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Host</TableCell>
                            <TableCell>Recording</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredMeetings.map((meeting) => {
                            const isSelected = selectedMeetings.some((selected) => selected.id === meeting.id)
                            const recordingUrl = getRecordingUrl(meeting)

                            return (
                                <TableRow key={meeting.id} selected={isSelected} hover sx={{ cursor: 'pointer' }}>
                                    <TableCell padding='checkbox'>
                                        <Checkbox checked={isSelected} onChange={() => handleMeetingToggle(meeting)} />
                                    </TableCell>
                                    <TableCell onClick={() => handleMeetingToggle(meeting)} sx={{ cursor: 'pointer' }}>
                                        <Typography variant='body2' fontWeight={isSelected ? 'bold' : 'normal'}>
                                            {meeting.topic}
                                        </Typography>
                                        {meeting.recording_count > 0 && (
                                            <Chip
                                                label={`${meeting.recording_count} recording(s)`}
                                                size='small'
                                                variant='outlined'
                                                sx={{ mt: 0.5 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell onClick={() => handleMeetingToggle(meeting)} sx={{ cursor: 'pointer' }}>
                                        <Typography variant='body2'>{formatDateTime(meeting.start_time)}</Typography>
                                    </TableCell>
                                    <TableCell onClick={() => handleMeetingToggle(meeting)} sx={{ cursor: 'pointer' }}>
                                        <Typography variant='body2'>{formatDuration(meeting.duration)}</Typography>
                                    </TableCell>
                                    <TableCell onClick={() => handleMeetingToggle(meeting)} sx={{ cursor: 'pointer' }}>
                                        <Typography variant='body2'>{meeting.host_email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {meeting.recording_count > 0 ? (
                                            <Link
                                                href={recordingUrl}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                            >
                                                <IconExternalLink size={16} />
                                                <Typography variant='body2'>View Recording</Typography>
                                            </Link>
                                        ) : (
                                            <Typography variant='body2' color='text.secondary'>
                                                No recording
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    return (
        <div style={{ margin: '10px 0px 0 0' }}>
            <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
                <Button variant='outlined' onClick={handleOpenDialog} disabled={disabled || isTokenExpired} startIcon={<IconCalendar />}>
                    Select Meetings
                </Button>

                {selectedMeetings.length > 0 && (
                    <Button variant='outlined' color='error' onClick={handleClearAll} disabled={disabled} startIcon={<IconTrash />}>
                        Clear All
                    </Button>
                )}

                {isTokenExpired && (
                    <Button variant='outlined' onClick={handleRefreshAccessToken} disabled={isRefreshing} color='warning'>
                        {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
                    </Button>
                )}
            </Stack>

            {isTokenExpired && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant='body2' color='warning.dark'>
                        Access token has expired. Please refresh your token to select meetings.
                    </Typography>
                </Box>
            )}

            {selectedMeetings.length > 0 && (
                <List dense>
                    {selectedMeetings.map((meeting) => (
                        <ListItem
                            key={meeting.id}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <ListItemIcon>
                                <IconCalendar size={20} />
                            </ListItemIcon>
                            <ListItemText
                                primary={meeting.topic}
                                secondary={
                                    <Box>
                                        <Typography variant='caption' display='block'>
                                            {formatDateTime(meeting.start_time)}
                                        </Typography>
                                        <Typography variant='caption' display='block'>
                                            Duration: {formatDuration(meeting.duration)} | Host: {meeting.host_email}
                                        </Typography>
                                        {meeting.meeting_type && (
                                            <Chip label={meeting.meeting_type} size='small' variant='outlined' sx={{ mt: 0.5 }} />
                                        )}
                                    </Box>
                                }
                            />
                            <IconButton edge='end' onClick={() => handleRemoveMeeting(meeting.id)} disabled={disabled}>
                                <IconX />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
            )}

            <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth='xl' fullWidth>
                <DialogTitle>
                    <Stack direction='row' alignItems='center' justifyContent='space-between'>
                        <Typography variant='h6'>Select Zoom Meetings</Typography>
                        <Button startIcon={<IconRefresh />} onClick={handleRefreshMeetings} disabled={loading} size='small'>
                            Refresh
                        </Button>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {/* Date Range Controls */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant='subtitle2' sx={{ mb: 2 }}>
                            Date Range
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label='From Date'
                                    type='date'
                                    value={dateRange.from}
                                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                                    fullWidth
                                    size='small'
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label='To Date'
                                    type='date'
                                    value={dateRange.to}
                                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                                    fullWidth
                                    size='small'
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Search Filter */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label='Search meetings'
                            placeholder='Filter by meeting name, host email, or date...'
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            fullWidth
                            size='small'
                            InputProps={{
                                startAdornment: <IconSearch size={16} style={{ marginRight: 8 }} />
                            }}
                        />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Meeting Type Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label='meeting type tabs'>
                            {meetingTypes.map((type, index) => {
                                const Icon = type.icon
                                return (
                                    <Tab
                                        key={type.key}
                                        label={
                                            <Stack direction='row' spacing={1} alignItems='center'>
                                                <Icon size={16} />
                                                <span>{type.label}</span>
                                                {meetings[type.key]?.total_records && (
                                                    <Chip
                                                        size='small'
                                                        label={meetings[type.key].total_records}
                                                        sx={{ height: 20, fontSize: '0.75rem' }}
                                                    />
                                                )}
                                            </Stack>
                                        }
                                        id={`meeting-tab-${index}`}
                                        aria-controls={`meeting-tabpanel-${index}`}
                                    />
                                )
                            })}
                        </Tabs>
                    </Box>

                    {/* Tab Panels */}
                    {meetingTypes.map((type, index) => (
                        <TabPanel key={type.key} value={activeTab} index={index}>
                            <Typography variant='body2' sx={{ mb: 2 }} color='text.secondary'>
                                {type.description}
                            </Typography>

                            {type.key === 'organization' && !accountId && (
                                <Alert severity='warning' sx={{ mb: 2 }}>
                                    Account ID is required for organization meetings. Please ensure your Zoom credentials include account
                                    ID.
                                </Alert>
                            )}

                            {renderMeetingsTable()}
                        </TabPanel>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveSelection} variant='contained' color='primary' disabled={selectedMeetings.length === 0}>
                        Save Selection ({selectedMeetings.length})
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

ZoomMeetingPicker.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
    disabled: PropTypes.bool,
    credentialId: PropTypes.string,
    credentialData: PropTypes.object,
    handleCredentialDataChange: PropTypes.func.isRequired
}

export default ZoomMeetingPicker
