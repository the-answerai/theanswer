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
    Chip
} from '@mui/material'
import useApi from '@/hooks/useApi'
import credentialsApi from '@/api/credentials'
import zoomApi from '@/api/zoom'
import { IconX, IconTrash, IconCalendar } from '@tabler/icons-react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

export const ZoomMeetingPicker = ({ onChange, value, disabled, credentialId, credentialData, handleCredentialDataChange }) => {
    const dispatch = useDispatch()
    const [selectedMeetings, setSelectedMeetings] = useState(value ? JSON.parse(value) : [])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [accessToken, setAccessToken] = useState(null)
    const [isTokenExpired, setIsTokenExpired] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))
    const getCredentialDataApi = useApi(credentialsApi.getSpecificCredential)

    // Initialize from credentialData prop if available
    useEffect(() => {
        if (credentialData?.plainDataObj) {
            const expiresAt = new Date(credentialData.plainDataObj.expiresAt)
            const now = new Date()
            const isExpired = expiresAt < now

            setIsTokenExpired(isExpired)
            setAccessToken(credentialData.plainDataObj.zoomAccessToken ?? '')
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

    const fetchMeetings = async () => {
        if (!accessToken) return

        setLoading(true)
        setError(null)

        try {
            const response = await zoomApi.getMeetings({ accessToken })

            if (response.data && Array.isArray(response.data.meetings)) {
                setMeetings(response.data.meetings)
            } else {
                setMeetings([])
            }
        } catch (err) {
            console.error('Error fetching meetings:', err)
            setError(err.message || 'Failed to fetch meetings')
            enqueueSnackbar({
                message: 'Failed to load Zoom meetings: ' + (err.message || 'Unknown error'),
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
        if (meetings.length === 0) {
            fetchMeetings()
        }
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
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
                host_email: meeting.host_email
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
                // The parent component should handle updating credential data
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

            <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth='md' fullWidth>
                <DialogTitle>Select Zoom Meetings</DialogTitle>
                <DialogContent>
                    {loading && (
                        <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
                            <CircularProgress />
                            <Typography variant='body2' sx={{ ml: 2 }}>
                                Loading meetings...
                            </Typography>
                        </Box>
                    )}

                    {error && (
                        <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, mb: 2 }}>
                            <Typography variant='body2' color='error.dark'>
                                Error: {error}
                            </Typography>
                        </Box>
                    )}

                    {!loading && !error && meetings.length === 0 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant='body2' color='text.secondary'>
                                No recorded meetings found.
                            </Typography>
                        </Box>
                    )}

                    {!loading && !error && meetings.length > 0 && (
                        <>
                            <Typography variant='body2' sx={{ mb: 2 }}>
                                Select meetings to load transcripts from:
                            </Typography>
                            <List>
                                {meetings.map((meeting) => {
                                    const isSelected = selectedMeetings.some((selected) => selected.id === meeting.id)
                                    return (
                                        <ListItem
                                            key={meeting.id}
                                            dense
                                            button
                                            onClick={() => handleMeetingToggle(meeting)}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                borderRadius: 1,
                                                mb: 1,
                                                bgcolor: isSelected ? 'primary.light' : 'background.paper'
                                            }}
                                        >
                                            <ListItemIcon>
                                                <Checkbox edge='start' checked={isSelected} tabIndex={-1} disableRipple />
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
                                                        <Chip
                                                            label={`${meeting.recording_count} recording(s)`}
                                                            size='small'
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    )
                                })}
                            </List>
                        </>
                    )}
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
