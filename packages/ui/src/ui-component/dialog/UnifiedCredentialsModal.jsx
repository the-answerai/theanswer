import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// material-ui
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Stack,
    CircularProgress,
    Paper,
    Avatar,
    InputLabel,
    Chip,
    Checkbox,
    FormControlLabel
} from '@mui/material'
import { IconPlus, IconX, IconUserShield, IconShieldCheck } from '@tabler/icons-react'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import AddEditCredentialDialog from '@/views/credentials/AddEditCredentialDialog'
import { groupCredentialsByType, groupAllCredentialsByType } from '@/utils/flowCredentialsHelper'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useApi from '@/hooks/useApi'

// Assets
import keySVG from '@/assets/images/key.svg'

// Constants
import { baseURL } from '@/store/constant'

// ==============================|| UnifiedCredentialsModal ||============================== //

const UnifiedCredentialsModal = ({ show, missingCredentials, onAssign, onSkip, onCancel, onError, initialDontShowAgain = false }) => {
    const portalElement = document.getElementById('portal')
    const [credentialAssignments, setCredentialAssignments] = useState({})
    const [availableCredentials, setAvailableCredentials] = useState({})
    const [loading, setLoading] = useState(false)
    const [assigningCredentials, setAssigningCredentials] = useState(false)
    const [showCredentialDialog, setShowCredentialDialog] = useState(false)
    const [credentialDialogProps, setCredentialDialogProps] = useState({})
    const [refreshKey, setRefreshKey] = useState(0)
    const [creatingCredentialFor, setCreatingCredentialFor] = useState(null) // Track which credential type is being created
    const [dontShowAgain, setDontShowAgain] = useState(initialDontShowAgain)
    const [dontShowDirty, setDontShowDirty] = useState(false)

    // API hooks for loading component credentials
    const getComponentCredentialApi = useApi(credentialsApi.getSpecificComponentCredential)

    // Group credentials by type for better organization
    // Check if we're in QuickSetup mode (showing all credentials, not just missing ones)
    const isQuickSetupMode = missingCredentials.some((cred) => Object.prototype.hasOwnProperty.call(cred, 'isAssigned'))
    const groupedCredentials = isQuickSetupMode ? groupAllCredentialsByType(missingCredentials) : groupCredentialsByType(missingCredentials)

    const resolveGroupForCredential = (credentialName) => {
        const groupedCreds = isQuickSetupMode ? groupAllCredentialsByType(missingCredentials) : groupCredentialsByType(missingCredentials)

        if (groupedCreds[credentialName]) {
            const directGroup = groupedCreds[credentialName]
            return {
                groupKey: credentialName,
                componentName: directGroup.credentialTypes?.[0] || directGroup.credentialName || credentialName
            }
        }

        const matchedEntry = Object.entries(groupedCreds).find(([_, group]) => {
            const types = group.credentialTypes || []
            return types.includes(credentialName) || group.credentialName === credentialName
        })

        if (matchedEntry) {
            const [groupKey, group] = matchedEntry
            const types = group.credentialTypes || []
            const componentName = types.includes(credentialName) ? credentialName : types[0] || group.credentialName || credentialName

            return { groupKey, componentName }
        }

        return { groupKey: null, componentName: credentialName }
    }

    // Load available credentials when modal opens
    useEffect(() => {
        if (show && (missingCredentials.length > 0 || isQuickSetupMode)) {
            const loadCredentials = async () => {
                setLoading(true)
                const credentialsData = {}
                const groupedCreds = isQuickSetupMode
                    ? groupAllCredentialsByType(missingCredentials)
                    : groupCredentialsByType(missingCredentials)

                try {
                    // Load credentials for each group
                    await Promise.all(
                        Object.entries(groupedCreds).map(async ([groupKey, group]) => {
                            try {
                                // For grouped credentials, load all credential types in the group
                                const credentialTypes = group.credentialTypes || [group.credentialName]
                                const allCredentials = []

                                await Promise.all(
                                    credentialTypes.map(async (credType) => {
                                        try {
                                            // Use specific credential endpoint by name for better performance
                                            const response = await credentialsApi.getCredentialsByName(credType)
                                            allCredentials.push(...response.data)
                                        } catch (error) {
                                            console.warn(`Failed to load credentials for type ${credType}:`, error)
                                        }
                                    })
                                )

                                credentialsData[groupKey] = allCredentials
                            } catch (error) {
                                console.error(`Failed to load credentials for group ${groupKey}:`, error)
                                credentialsData[groupKey] = []
                            }
                        })
                    )

                    setAvailableCredentials(credentialsData)

                    // Handle credential assignments based on mode
                    const defaultAssignments = {}

                    if (isQuickSetupMode) {
                        Object.entries(groupedCreds).forEach(([groupKey, group]) => {
                            const nodes = group.nodes || []
                            const credsForGroup = credentialsData[groupKey] || []

                            if (group.isAssigned && group.assignedCredentialId) {
                                nodes.forEach((node) => {
                                    defaultAssignments[node.nodeId] = group.assignedCredentialId
                                })
                            }

                            if (credsForGroup.length > 0) {
                                const fallbackCredentialId = group.assignedCredentialId || credsForGroup[0]?.id
                                if (fallbackCredentialId) {
                                    nodes.forEach((node) => {
                                        if (!defaultAssignments[node.nodeId]) {
                                            defaultAssignments[node.nodeId] = fallbackCredentialId
                                        }
                                    })
                                }
                            }
                        })
                    } else {
                        Object.entries(groupedCreds).forEach(([groupKey, group]) => {
                            const creds = credentialsData[groupKey] || []
                            if (creds.length > 0) {
                                const defaultCredentialId = creds[0]?.id
                                if (defaultCredentialId) {
                                    group.nodes.forEach((node) => {
                                        if (!defaultAssignments[node.nodeId]) {
                                            defaultAssignments[node.nodeId] = defaultCredentialId
                                        }
                                    })
                                }
                            }
                        })
                    }

                    if (Object.keys(defaultAssignments).length > 0) {
                        setCredentialAssignments((prev) => {
                            const mergedAssignments = { ...prev }
                            Object.entries(defaultAssignments).forEach(([nodeId, credentialId]) => {
                                if (!mergedAssignments[nodeId]) {
                                    mergedAssignments[nodeId] = credentialId
                                }
                            })
                            return mergedAssignments
                        })
                    }
                } catch (error) {
                    console.error('Error loading credentials:', error)
                } finally {
                    setLoading(false)
                }
            }

            loadCredentials()
        }
    }, [show, missingCredentials, refreshKey, isQuickSetupMode]) // Added refreshKey and isQuickSetupMode to dependency array

    useEffect(() => {
        if (show) {
            setDontShowAgain(initialDontShowAgain)
            setDontShowDirty(false)
        }
    }, [show, initialDontShowAgain])

    const handleCredentialChange = (nodeId, credentialId) => {
        setCredentialAssignments((prev) => ({
            ...prev,
            [nodeId]: credentialId
        }))
    }

    const handleAddCredential = async (credentialName) => {
        const { groupKey, componentName } = resolveGroupForCredential(credentialName)
        setCreatingCredentialFor(groupKey)

        try {
            if (!componentName) {
                throw new Error('Credential type could not be resolved')
            }

            const response = await credentialsApi.getSpecificComponentCredential(componentName)
            const componentCredential = response.data

            // Check if the response actually contains credential component data
            if (!componentCredential || !componentCredential.name) {
                throw new Error(`Invalid credential component data`)
            }

            const dialogProps = {
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add',
                credentialComponent: componentCredential
            }
            setCredentialDialogProps(dialogProps)
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('❌ Error loading credential component:', error)
            // Use proper error notification if available
            if (onError) {
                onError(`Failed to load credential component: ${error.message}`)
            } else {
                alert(`Failed to load credential component: ${error.message}`)
            }
            setCreatingCredentialFor(null)
        }
    }

    const handleCredentialDialogConfirm = (newCredentialId) => {
        setShowCredentialDialog(false)

        // Auto-select the newly created credential for the appropriate group
        if (newCredentialId && creatingCredentialFor) {
            const groupedCreds = isQuickSetupMode
                ? groupAllCredentialsByType(missingCredentials)
                : groupCredentialsByType(missingCredentials)
            const group = groupedCreds[creatingCredentialFor]

            if (group) {
                const newAssignments = {}
                group.nodes.forEach((node) => {
                    newAssignments[node.nodeId] = newCredentialId
                })

                setCredentialAssignments((prev) => ({
                    ...prev,
                    ...newAssignments
                }))
            }
        }

        // Clear the tracking state
        setCreatingCredentialFor(null)

        // Refresh available credentials
        setRefreshKey((prev) => prev + 1)
    }

    const handleAssignCredentials = async () => {
        console.log('[UnifiedCredentialsModal] handleAssignCredentials', credentialAssignments)
        if (onAssign) {
            setAssigningCredentials(true)
            try {
                await onAssign(credentialAssignments, { dontShowAgain, dontShowDirty })
            } catch (error) {
                console.error('Error assigning credentials:', error)
                if (onError) {
                    onError('Failed to assign credentials. Please try again.')
                }
            } finally {
                setAssigningCredentials(false)
            }
        }
    }

    const handleSkip = () => {
        if (onSkip) {
            onSkip({ dontShowAgain, dontShowDirty })
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel({ dontShowAgain, dontShowDirty })
        }
    }

    const getCredentialIcon = (credentialName) => {
        return `${baseURL}/api/v1/components-credentials-icon/${credentialName}`
    }

    const handleCreateCredential = async (credentialName) => {
        const { groupKey, componentName } = resolveGroupForCredential(credentialName)
        setCreatingCredentialFor(groupKey)

        try {
            if (!componentName) {
                throw new Error('Credential type could not be resolved')
            }

            const response = await credentialsApi.getSpecificComponentCredential(componentName)
            const componentCredential = response.data

            // Check if the response actually contains credential component data
            if (!componentCredential || !componentCredential.name) {
                throw new Error(`Invalid credential component data`)
            }

            const dialogProps = {
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add',
                credentialComponent: componentCredential
            }
            setCredentialDialogProps(dialogProps)
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('❌ Error loading credential component:', error)
            // Use proper error notification if available
            if (onError) {
                onError(`Failed to load credential component: ${error.message}`)
            } else {
                alert(`Failed to load credential component: ${error.message}`)
            }
            setCreatingCredentialFor(null) // Reset on error
        }
    }

    const renderCredentialRow = (credentialName, credentialInfo) => {
        const available = availableCredentials[credentialName] || []
        const nodes = credentialInfo.nodes

        return (
            <Box key={credentialName} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <img
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: 6,
                                borderRadius: '50%',
                                objectFit: 'contain'
                            }}
                            alt={credentialName}
                            src={getCredentialIcon(credentialName)}
                            onError={(e) => {
                                e.target.onerror = null
                                e.target.style.padding = '5px'
                                e.target.src = keySVG
                            }}
                        />
                    </Box>
                    <Typography variant='h6' sx={{ flex: 1 }}>
                        {credentialInfo.label}
                    </Typography>
                    <IconButton
                        size='small'
                        color='primary'
                        onClick={() => handleAddCredential(credentialName)}
                        title='Add new credential'
                        sx={{ ml: 1 }}
                    >
                        <IconPlus />
                    </IconButton>
                </Box>

                {/* Show nodes that need this credential */}
                <Box sx={{ ml: 6, mb: 2 }}>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                        Required by: {nodes.map((n) => n.nodeName).join(', ')}
                    </Typography>
                </Box>

                {/* Credential selection */}
                {nodes.map((node) => (
                    <Box key={node.nodeId} sx={{ ml: 6, mb: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant='body2' sx={{ minWidth: 120, mr: 2 }}>
                            {node.nodeName}:
                        </Typography>
                        <FormControl size='small' sx={{ minWidth: 200 }}>
                            <Select
                                value={credentialAssignments[node.nodeId] || ''}
                                onChange={(e) => handleCredentialChange(node.nodeId, e.target.value)}
                                displayEmpty
                                disabled={loading || assigningCredentials || available.length === 0}
                            >
                                <MenuItem value=''>
                                    <em>Select credential...</em>
                                </MenuItem>
                                {available.map((credential) => (
                                    <MenuItem key={credential.id} value={credential.id}>
                                        {credential.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                ))}
            </Box>
        )
    }

    if (!show) return null

    const component = (
        <Dialog
            open={show}
            onClose={handleCancel}
            maxWidth='md'
            fullWidth
            sx={{
                position: 'absolute'
            }}
            PaperProps={{
                sx: {
                    borderRadius: 2
                }
            }}
        >
            <DialogTitle
                sx={{
                    fontSize: '1.2rem',
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography variant='body1' sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {isQuickSetupMode ? 'Manage Credentials' : 'Setup Required Credentials'}
                </Typography>
                <IconButton onClick={handleCancel} size='small'>
                    <IconX />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ padding: 3, minHeight: '400px' }}>
                {loading ? (
                    <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Loading credentials...</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* First show unassigned credentials */}
                        {Object.entries(groupedCredentials)
                            .filter(([_, group]) => !group.isAssigned)
                            .map(([groupKey, group]) => {
                                const credentialsForGroup = availableCredentials[groupKey] || []
                                const hasMultipleNodes = group.nodes.length > 1

                                return (
                                    <Paper
                                        key={groupKey}
                                        elevation={1}
                                        sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}
                                    >
                                        <Stack spacing={2}>
                                            {/* Credential Header */}
                                            <Box display='flex' alignItems='center' gap={2}>
                                                <Avatar
                                                    src={`${baseURL}/api/v1/components-credentials-icon/${
                                                        group.credentialTypes?.[0] || group.credentialName
                                                    }`}
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    <IconUserShield />
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Box display='flex' alignItems='center' gap={1}>
                                                        <Typography variant='h6' fontWeight='bold'>
                                                            {group.label}
                                                        </Typography>
                                                        <Chip
                                                            label='Setup Required'
                                                            size='small'
                                                            color='warning'
                                                            variant='filled'
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    </Box>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        {hasMultipleNodes
                                                            ? `Required by ${group.nodes.length} nodes`
                                                            : `Required by ${group.nodes[0].nodeName}`}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Credential Selector */}
                                            <Box>
                                                <FormControl fullWidth>
                                                    <InputLabel>Select Credential</InputLabel>
                                                    <Select
                                                        value={
                                                            group.nodes.length > 0 ? credentialAssignments[group.nodes[0].nodeId] || '' : ''
                                                        }
                                                        onChange={(e) => {
                                                            // Apply the same credential to all nodes in this group
                                                            group.nodes.forEach((node) => {
                                                                handleCredentialChange(node.nodeId, e.target.value)
                                                            })
                                                        }}
                                                        label='Select Credential'
                                                        disabled={loading || assigningCredentials}
                                                        sx={{ mb: 1 }}
                                                    >
                                                        {credentialsForGroup.map((credential) => (
                                                            <MenuItem key={credential.id} value={credential.id}>
                                                                <Box display='flex' alignItems='center' gap={1}>
                                                                    <Typography>{credential.name}</Typography>
                                                                    <Typography variant='caption' color='text.secondary'>
                                                                        ({credential.credentialName})
                                                                    </Typography>
                                                                </Box>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                {/* Add new credential button */}
                                                <Button
                                                    startIcon={<IconPlus />}
                                                    onClick={() =>
                                                        handleCreateCredential(group.credentialTypes?.[0] || group.credentialName)
                                                    }
                                                    size='small'
                                                    sx={{ mt: 1 }}
                                                >
                                                    Add New {group.label}
                                                </Button>
                                            </Box>

                                            {/* Show affected nodes if multiple */}
                                            {hasMultipleNodes && (
                                                <Box>
                                                    <Typography variant='caption' color='text.secondary' gutterBottom>
                                                        Affected nodes:
                                                    </Typography>
                                                    <Box display='flex' flexWrap='wrap' gap={0.5}>
                                                        {group.nodes.map((node) => (
                                                            <Chip key={node.nodeId} label={node.nodeName} size='small' variant='outlined' />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Paper>
                                )
                            })}

                        {/* Then show assigned credentials if in QuickSetup mode */}
                        {isQuickSetupMode &&
                            Object.entries(groupedCredentials)
                                .filter(([_, group]) => group.isAssigned)
                                .map(([groupKey, group]) => {
                                    const credentialsForGroup = availableCredentials[groupKey] || []
                                    const hasMultipleNodes = group.nodes.length > 1

                                    return (
                                        <Paper key={groupKey} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                                            <Stack spacing={2}>
                                                {/* Credential Header */}
                                                <Box display='flex' alignItems='center' gap={2}>
                                                    <Avatar
                                                        src={`${baseURL}/api/v1/components-credentials-icon/${
                                                            group.credentialTypes?.[0] || group.credentialName
                                                        }`}
                                                        sx={{ width: 32, height: 32 }}
                                                    >
                                                        <IconShieldCheck />
                                                    </Avatar>
                                                    <Box flex={1}>
                                                        <Box display='flex' alignItems='center' gap={1}>
                                                            <Typography variant='h6' fontWeight='bold'>
                                                                {group.label}
                                                            </Typography>
                                                            {isQuickSetupMode && group.isAssigned && (
                                                                <Chip
                                                                    label='Assigned'
                                                                    size='small'
                                                                    color='success'
                                                                    variant='outlined'
                                                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography variant='body2' color='text.secondary'>
                                                            {hasMultipleNodes
                                                                ? `Required by ${group.nodes.length} nodes`
                                                                : `Required by ${group.nodes[0].nodeName}`}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Credential Selector */}
                                                <Box>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Select Credential</InputLabel>
                                                        <Select
                                                            value={
                                                                group.nodes.length > 0
                                                                    ? credentialAssignments[group.nodes[0].nodeId] || ''
                                                                    : ''
                                                            }
                                                            onChange={(e) => {
                                                                // Apply the same credential to all nodes in this group
                                                                group.nodes.forEach((node) => {
                                                                    handleCredentialChange(node.nodeId, e.target.value)
                                                                })
                                                            }}
                                                            label='Select Credential'
                                                            disabled={loading || assigningCredentials}
                                                            sx={{ mb: 1 }}
                                                        >
                                                            {credentialsForGroup.map((credential) => (
                                                                <MenuItem key={credential.id} value={credential.id}>
                                                                    <Box display='flex' alignItems='center' gap={1}>
                                                                        <Typography>{credential.name}</Typography>
                                                                        <Typography variant='caption' color='text.secondary'>
                                                                            ({credential.credentialName})
                                                                        </Typography>
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>

                                                    {/* Add new credential button */}
                                                    <Button
                                                        startIcon={<IconPlus />}
                                                        onClick={() =>
                                                            handleCreateCredential(group.credentialTypes?.[0] || group.credentialName)
                                                        }
                                                        size='small'
                                                        sx={{ mt: 1 }}
                                                    >
                                                        Add New {group.label}
                                                    </Button>
                                                </Box>

                                                {/* Show affected nodes if multiple */}
                                                {hasMultipleNodes && (
                                                    <Box>
                                                        <Typography variant='caption' color='text.secondary' gutterBottom>
                                                            Affected nodes:
                                                        </Typography>
                                                        <Box display='flex' flexWrap='wrap' gap={0.5}>
                                                            {group.nodes.map((node) => (
                                                                <Chip
                                                                    key={node.nodeId}
                                                                    label={node.nodeName}
                                                                    size='small'
                                                                    variant='outlined'
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    )
                                })}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, alignItems: 'center' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={dontShowAgain}
                            onChange={(event) => {
                                setDontShowAgain(event.target.checked)
                                setDontShowDirty(true)
                            }}
                            color='primary'
                        />
                    }
                    label="Don't show this again"
                    sx={{ mr: 'auto' }}
                />
                <Button onClick={handleSkip} color='inherit'>
                    {isQuickSetupMode ? 'Cancel' : 'Skip for now'}
                </Button>
                <StyledButton
                    variant='contained'
                    onClick={handleAssignCredentials}
                    disabled={loading || assigningCredentials}
                    startIcon={assigningCredentials ? <CircularProgress size={16} /> : null}
                >
                    {assigningCredentials ? 'Saving...' : 'Assign & Continue'}
                </StyledButton>
            </DialogActions>

            {/* Credential creation dialog */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={() => {
                    setShowCredentialDialog(false)
                    setCreatingCredentialFor(null) // Reset tracking state on cancel
                }}
                onConfirm={handleCredentialDialogConfirm}
            />
        </Dialog>
    )

    return component
}

UnifiedCredentialsModal.propTypes = {
    show: PropTypes.bool.isRequired,
    missingCredentials: PropTypes.array.isRequired,
    onAssign: PropTypes.func.isRequired,
    onSkip: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    flowData: PropTypes.object,
    onError: PropTypes.func,
    initialDontShowAgain: PropTypes.bool
}

export default UnifiedCredentialsModal
