import PropTypes from 'prop-types'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Button, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, Stack, Alert } from '@mui/material'
import useApi from '@/hooks/useApi'
import credentialsApi from '@/api/credentials'
import oauth2Api from '@/api/oauth2'
import { IconX, IconTrash } from '@tabler/icons-react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

export const SUPPORTED_MIME_TYPES = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/pdf',
    'text/csv',
    'application/csv',
    'text/comma-separated-values',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'text/plain'
].join(',')
/**
 * Custom hook for loading Google API scripts (Google Picker and Identity Services)
 * @param {string} accessToken - Google OAuth access token for authentication
 * @returns {boolean} scriptsLoaded - Whether the Google API scripts have been loaded
 */
const useGoogleAPILoader = (accessToken) => {
    const [scriptsLoaded, setScriptsLoaded] = useState(false)
    const scriptsLoadedRef = useRef(false)

    useEffect(() => {
        if (!accessToken || scriptsLoadedRef.current) return

        // Check if scripts are already loaded
        if (window.gapi && window.google && window.google.picker) {
            setScriptsLoaded(true)
            scriptsLoadedRef.current = true
            return
        }

        let gapiScript, gsiScript

        const loadGAPIClient = () => {
            window.gapi.load('picker', () => {
                setScriptsLoaded(true)
                scriptsLoadedRef.current = true
            })
        }

        // Load Google APIs script
        gapiScript = document.createElement('script')
        gapiScript.src = 'https://apis.google.com/js/api.js'
        gapiScript.async = true
        gapiScript.defer = true
        gapiScript.onload = loadGAPIClient
        gapiScript.onerror = () => console.error('Failed to load Google APIs script')

        // Load Google Identity Services script
        gsiScript = document.createElement('script')
        gsiScript.src = 'https://accounts.google.com/gsi/client'
        gsiScript.async = true
        gsiScript.defer = true
        gsiScript.onerror = () => console.error('Failed to load Google Identity Services script')

        document.body.appendChild(gapiScript)
        document.body.appendChild(gsiScript)

        return () => {
            // Cleanup: only remove if we added them
            if (gapiScript && document.body.contains(gapiScript)) {
                document.body.removeChild(gapiScript)
            }
            if (gsiScript && document.body.contains(gsiScript)) {
                document.body.removeChild(gsiScript)
            }
        }
    }, [accessToken])

    return scriptsLoaded
}

/**
 * Custom hook for managing Google Drive Picker instances
 * @param {string} accessToken - Google OAuth access token for authentication
 * @param {Function} onFilesSelected - Callback function when files are selected
 * @returns {Object} Object containing createPicker, closePicker functions and pickerInstance state
 */
const useGooglePicker = (accessToken, onFilesSelected) => {
    const [pickerInstance, setPickerInstance] = useState(null)

    const createPickerView = useCallback((viewType) => {
        const view = new window.google.picker.DocsView()
            .setIncludeFolders(viewType !== 'recent')
            .setSelectFolderEnabled(false)
            .setMimeTypes(SUPPORTED_MIME_TYPES)

        switch (viewType) {
            case 'myDrive':
                return view.setParent('root').setLabel('My Drive')
            case 'sharedWithMe':
                return view.setOwnedByMe(false).setLabel('Shared with me')
            case 'sharedDrives':
                return view.setEnableDrives(true).setLabel('Shared drives')
            case 'recent':
                return view.setQuery('').setLabel('Recent')
            default:
                return view
        }
    }, [])

    const pickerCallback = useCallback(
        (data) => {
            if (data.action === window.google.picker.Action.PICKED) {
                const newFiles = data.docs.map((file) => ({
                    fileId: file.id,
                    fileName: file.name,
                    iconUrl: file.iconUrl
                }))
                onFilesSelected(newFiles)
            }
        },
        [onFilesSelected]
    )

    const createPicker = useCallback(async () => {
        if (!accessToken || !window.google?.picker) {
            console.error('Google Picker not available or no access token')
            return false
        }

        try {
            const picker = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
                .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_DEVELOPER_KEY)
                .setAppId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
                .setOAuthToken(accessToken)
                .addView(createPickerView('myDrive'))
                .addView(createPickerView('sharedWithMe'))
                .addView(createPickerView('sharedDrives'))
                .addView(createPickerView('recent'))
                .setCallback(pickerCallback)
                .build()

            picker.setVisible(true)
            setPickerInstance(picker)
            return true
        } catch (error) {
            console.error('Error creating picker:', error)
            return false
        }
    }, [accessToken, createPickerView, pickerCallback])

    const closePicker = useCallback(() => {
        if (pickerInstance) {
            pickerInstance.setVisible(false)
        }
        setPickerInstance(null)
    }, [pickerInstance])

    return { createPicker, closePicker, pickerInstance }
}

export const GoogleDrivePicker = ({ onChange, value, disabled, credentialId, credentialData, handleCredentialDataChange }) => {
    const dispatch = useDispatch()
    const previousCredentialIdRef = useRef(null)
    const [selectedFiles, setSelectedFiles] = useState(() => {
        try {
            return value ? JSON.parse(value) : []
        } catch (error) {
            console.error('Error parsing initial selected files:', error)
            return []
        }
    })
    const [accessToken, setAccessToken] = useState(null)
    const [isTokenExpired, setIsTokenExpired] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isReauthRequired, setIsReauthRequired] = useState(false)

    const enqueueSnackbar = useCallback((...args) => dispatch(enqueueSnackbarAction(...args)), [dispatch])
    const closeSnackbar = useCallback((...args) => dispatch(closeSnackbarAction(...args)), [dispatch])

    const getCredentialDataApi = useApi(credentialsApi.getSpecificCredential)
    const scriptsLoaded = useGoogleAPILoader(accessToken)

    const getTokenStateFromCredential = useCallback((plainDataObj = {}) => {
        const token = plainDataObj.access_token || plainDataObj.googleAccessToken || ''
        const expiresAt = plainDataObj.expires_at || plainDataObj.expiresAt
        const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

        return {
            token,
            isExpired
        }
    }, [])

    // Handle new files selection from picker
    const handleFilesSelected = useCallback(
        (newFiles) => {
            const uniqueNewFiles = newFiles.filter(
                (newFile) => !selectedFiles.some((existingFile) => existingFile.fileId === newFile.fileId)
            )
            const updatedFiles = [...selectedFiles, ...uniqueNewFiles]
            setSelectedFiles(updatedFiles)
            onChange(JSON.stringify(updatedFiles))
        },
        [selectedFiles, onChange]
    )

    const { createPicker, closePicker, pickerInstance } = useGooglePicker(accessToken, handleFilesSelected)

    // Load credential data on mount and clear files only when credential changes
    useEffect(() => {
        if (credentialId) {
            getCredentialDataApi.request(credentialId)

            const previousCredentialId = previousCredentialIdRef.current
            if (previousCredentialId && previousCredentialId !== credentialId) {
                // Clear selected files when credential changes
                setSelectedFiles([])
                onChange(JSON.stringify([]))

                // Reset token state
                setAccessToken(null)
                setIsTokenExpired(false)
                setIsReauthRequired(false)
            }

            previousCredentialIdRef.current = credentialId
        }
    }, [credentialId])

    // Sync local selections when value prop changes
    useEffect(() => {
        if (value === undefined) return
        try {
            const parsedValue = typeof value === 'string' ? JSON.parse(value) : value
            if (Array.isArray(parsedValue)) {
                setSelectedFiles(parsedValue)
            }
        } catch (error) {
            console.error('Error parsing selected files value:', error)
        }
    }, [value])

    // Handle credential data from prop
    useEffect(() => {
        if (credentialData?.plainDataObj) {
            const { token, isExpired } = getTokenStateFromCredential(credentialData.plainDataObj)
            setIsTokenExpired(isExpired)
            setAccessToken(token)
        }
    }, [credentialData, getTokenStateFromCredential])

    // Handle credential data from API
    useEffect(() => {
        if (getCredentialDataApi.data) {
            const { token, isExpired } = getTokenStateFromCredential(getCredentialDataApi.data?.plainDataObj)
            setIsTokenExpired(isExpired)
            setAccessToken(token)
            handleCredentialDataChange?.(getCredentialDataApi.data)
        }
    }, [getCredentialDataApi.data, getTokenStateFromCredential, handleCredentialDataChange])

    // Handle outside clicks and keyboard events for picker
    useEffect(() => {
        if (!pickerInstance) return

        const handleOutsideClick = (event) => {
            const pickerDialog = document.querySelector('.picker-dialog')
            if (pickerDialog && !pickerDialog.contains(event.target)) {
                closePicker()
            }
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closePicker()
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [pickerInstance, closePicker])

    const handleClearAll = useCallback(() => {
        setSelectedFiles([])
        onChange(JSON.stringify([]))
    }, [onChange])

    const handleRemoveFile = useCallback(
        (fileId) => {
            const updatedFiles = selectedFiles.filter((file) => file.fileId !== fileId)
            setSelectedFiles(updatedFiles)
            onChange(JSON.stringify(updatedFiles))
        },
        [selectedFiles, onChange]
    )

    const showSnackbar = useCallback(
        (message, variant = 'info') => {
            enqueueSnackbar({
                message,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        },
        [enqueueSnackbar, closeSnackbar]
    )

    const handleRefreshAccessToken = useCallback(async () => {
        if (!credentialId) return

        try {
            setIsRefreshing(true)
            try {
                const response = await oauth2Api.refresh(credentialId)
                const oauth2Message = response?.data?.message || ''
                const oauth2Failed = response?.data?.success === false
                const isMissingOauthConfig = oauth2Message.includes('Missing required OAuth configuration')

                if (oauth2Failed && isMissingOauthConfig) {
                    await credentialsApi.refreshAccessToken({ credentialId })
                } else if (oauth2Failed) {
                    throw new Error(oauth2Message || 'Error refreshing access token')
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || error.message || ''
                const isMissingOauthConfig = errorMessage.includes('Missing required OAuth configuration')

                if (!isMissingOauthConfig) {
                    throw error
                }

                await credentialsApi.refreshAccessToken({ credentialId })
            }

            getCredentialDataApi.request(credentialId)
            setIsTokenExpired(false)
            setIsReauthRequired(false)
            showSnackbar('Successfully refreshed access token', 'success')
        } catch (error) {
            const status = error.response?.status
            const errorMessage = error.response?.data?.message || error.message || 'Error refreshing access token'

            if (status === 401 || errorMessage.includes('REAUTH_REQUIRED') || errorMessage.includes('re-authenticate')) {
                setIsReauthRequired(true)
                showSnackbar('Re-authentication required. Please click "Re-authenticate with Google".', 'warning')
            } else {
                showSnackbar(errorMessage, 'error')
            }
        } finally {
            setIsRefreshing(false)
        }
    }, [credentialId, getCredentialDataApi, showSnackbar])

    const handleOpenPicker = useCallback(async () => {
        const opened = await createPicker()
        if (opened) return

        if (!credentialId) {
            showSnackbar('Select a credential before opening Google Drive.', 'warning')
            return
        }

        if (!accessToken) {
            showSnackbar('No access token available. Refresh or re-authenticate to load files.', 'error')
            return
        }

        if (!scriptsLoaded) {
            showSnackbar('Google picker is still loading. Try again in a moment.', 'info')
            return
        }

        if (isTokenExpired) {
            showSnackbar('Access token expired. Refresh or re-authenticate before selecting files.', 'warning')
        } else {
            showSnackbar('Unable to open Google Drive picker. Please try again.', 'error')
        }
    }, [accessToken, createPicker, credentialId, isTokenExpired, scriptsLoaded, showSnackbar])

    const handleReauthenticate = useCallback(async () => {
        if (!credentialId) return

        try {
            const authResponse = await oauth2Api.authorize(credentialId)

            if (authResponse.data?.authorizationUrl) {
                const authWindow = window.open(
                    authResponse.data.authorizationUrl,
                    '_blank',
                    'width=600,height=700,scrollbars=yes,resizable=yes'
                )

                if (!authWindow) {
                    showSnackbar('Popup blocked. Please allow popups for this site and try again.', 'error')
                    return
                }

                const handleMessage = (event) => {
                    if (event.data?.type === 'OAUTH2_SUCCESS') {
                        window.removeEventListener('message', handleMessage)
                        getCredentialDataApi.request(credentialId)
                        setIsTokenExpired(false)
                        setIsReauthRequired(false)
                        showSnackbar('Successfully re-authenticated with Google', 'success')
                    } else if (event.data?.type === 'OAUTH2_ERROR') {
                        window.removeEventListener('message', handleMessage)
                        showSnackbar(event.data.error || 'Re-authentication failed', 'error')
                    }
                }

                window.addEventListener('message', handleMessage)
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to start re-authentication', 'error')
        }
    }, [credentialId, getCredentialDataApi, showSnackbar])

    const isPickerReady = !disabled
    const hasSelectedFiles = selectedFiles.length > 0

    return (
        <div style={{ margin: '10px 0px 0 0' }}>
            <Stack direction='column' spacing={2} sx={{ mb: 2 }}>
                <Button
                    variant='outlined'
                    onClick={handleOpenPicker}
                    disabled={!isPickerReady}
                    sx={{
                        '&.Mui-disabled': {
                            color: 'gray',
                            borderColor: 'gray'
                        }
                    }}
                >
                    Select Files from Google Drive
                </Button>

                {hasSelectedFiles && (
                    <Button variant='outlined' onClick={handleClearAll} color='error' startIcon={<IconTrash size={20} />}>
                        Clear All
                    </Button>
                )}

                {isTokenExpired && !isReauthRequired && (
                    <Button
                        variant='outlined'
                        onClick={handleRefreshAccessToken}
                        disabled={!credentialId || isRefreshing}
                        sx={{
                            '&.Mui-disabled': {
                                color: 'gray',
                                borderColor: 'gray'
                            }
                        }}
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh Access Token'}
                    </Button>
                )}

                {isReauthRequired && (
                    <Button variant='outlined' color='warning' onClick={handleReauthenticate} disabled={!credentialId}>
                        Re-authenticate with Google
                    </Button>
                )}
            </Stack>

            {isTokenExpired && !isReauthRequired && (
                <Alert severity='warning' sx={{ mb: 1 }}>
                    Access token has expired. Click &quot;Refresh Access Token&quot; to renew it.
                </Alert>
            )}

            {isReauthRequired && (
                <Alert severity='error' sx={{ mb: 1 }}>
                    Google authorization has expired or been revoked. Click &quot;Re-authenticate with Google&quot; to reconnect.
                </Alert>
            )}

            {hasSelectedFiles && (
                <List sx={{ bgcolor: 'background.paper', p: 0 }}>
                    {selectedFiles.map((file) => (
                        <ListItem
                            key={file.fileId}
                            sx={{
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0,
                                mb: 1
                            }}
                            secondaryAction={
                                <IconButton
                                    edge='end'
                                    aria-label={`Remove ${file.fileName}`}
                                    onClick={() => handleRemoveFile(file.fileId)}
                                    sx={{
                                        mr: 1,
                                        color: 'error.main',
                                        '&:hover': {
                                            backgroundColor: 'error.lighter'
                                        }
                                    }}
                                >
                                    <IconTrash size={20} />
                                </IconButton>
                            }
                        >
                            <ListItemAvatar>
                                <Avatar
                                    src={file.iconUrl}
                                    alt={file.fileName}
                                    variant='rounded'
                                    sx={{
                                        bgcolor: 'background.paper',
                                        '& img': {
                                            width: '24px',
                                            height: '24px'
                                        }
                                    }}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={file.fileName}
                                sx={{
                                    '& .MuiListItemText-primary': {
                                        fontSize: '0.875rem'
                                    }
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    )
}

GoogleDrivePicker.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
    disabled: PropTypes.bool,
    credentialId: PropTypes.string.isRequired,
    credentialData: PropTypes.object,
    handleCredentialDataChange: PropTypes.func
}
