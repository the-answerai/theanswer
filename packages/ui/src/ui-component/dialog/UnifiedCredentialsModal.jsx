import { useState, useEffect, useMemo } from 'react'
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
    Grid,
    Checkbox,
    FormControlLabel,
    Collapse
} from '@mui/material'
import { IconX, IconPlus } from '@tabler/icons-react'

// project imports
import CredentialLogo from '@/ui-component/credentials/CredentialLogo'
import { getGlassStyle } from '@/ui-component/credentials/glassmorphismStyles'
import AddEditCredentialDialog from '@/views/credentials/AddEditCredentialDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import {
    groupCredentialsByType,
    groupAllCredentialsByType,
    organizeCredentialsByPriority,
    toSentenceCase
} from '@/utils/flowCredentialsHelper'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import { useSelector } from 'react-redux'

// ==============================|| UnifiedCredentialsModal ||============================== //

const UnifiedCredentialsModal = ({ show, missingCredentials, onAssign, onSkip, onCancel, onError, initialDontShowAgain = false }) => {
    const { confirm } = useConfirm()
    const customization = useSelector((state) => state.customization)
    const isDarkMode = customization.isDarkMode

    const [credentialAssignments, setCredentialAssignments] = useState({})
    const [availableCredentials, setAvailableCredentials] = useState({})
    const [loading, setLoading] = useState(false)
    const [assigningCredentials, setAssigningCredentials] = useState(false)
    const [showCredentialDialog, setShowCredentialDialog] = useState(false)
    const [credentialDialogProps, setCredentialDialogProps] = useState({})
    const [refreshKey, setRefreshKey] = useState(0)
    const [creatingCredentialFor, setCreatingCredentialFor] = useState(null)
    const [dontShowAgain, setDontShowAgain] = useState(initialDontShowAgain)
    const [dontShowDirty, setDontShowDirty] = useState(false)
    const [expandedCredentials, setExpandedCredentials] = useState({}) // Track which credentials are expanded to show dropdown

    // Check if we're in QuickSetup mode (showing all credentials, not just missing ones)
    const isQuickSetupMode = missingCredentials.some((cred) => Object.prototype.hasOwnProperty.call(cred, 'isAssigned'))
    const groupedCredentials = isQuickSetupMode ? groupAllCredentialsByType(missingCredentials) : groupCredentialsByType(missingCredentials)

    // Organize credentials by priority and connection status
    const organizedCredentials = useMemo(() => {
        const organized = organizeCredentialsByPriority(groupedCredentials)
        return organized
    }, [groupedCredentials])

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
                    await Promise.all(
                        Object.entries(groupedCreds).map(async ([groupKey, group]) => {
                            try {
                                const credentialTypes = group.credentialTypes || [group.credentialName]
                                const allCredentials = []

                                await Promise.all(
                                    credentialTypes.map(async (credType) => {
                                        try {
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
    }, [show, missingCredentials, refreshKey, isQuickSetupMode])

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

        setCreatingCredentialFor(null)
        setRefreshKey((prev) => prev + 1)
    }

    const handleAssignCredentials = async () => {
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

    const handleSkip = async () => {
        // Check if there are required credentials that haven't been set up
        const requiredCreds = organizedCredentials?.required || []
        const hasUnassignedRequired = requiredCreds.some((group) => {
            const nodes = group.nodes || []
            return nodes.length > 0 && !nodes.every((node) => credentialAssignments[node.nodeId])
        })

        // Show confirmation if there are unassigned required credentials
        if (hasUnassignedRequired) {
            const confirmPayload = {
                title: 'Skip credential setup?',
                description: 'The workflow will not work properly without required credentials. Are you sure you want to skip setup?',
                confirmButtonName: 'Skip anyway',
                cancelButtonName: 'Continue setup'
            }

            try {
                const isConfirmed = await confirm(confirmPayload)

                if (!isConfirmed) {
                    return // User chose to continue setup
                }
            } catch (error) {
                console.error('[handleSkip] error in confirm:', error)
                return
            }
        }

        // User confirmed or no required credentials missing, proceed with skip
        if (onSkip) {
            onSkip({ dontShowAgain, dontShowDirty })
        }
    }

    const handleCancel = async () => {
        // Check if there are REQUIRED credentials that haven't been set up
        const requiredCreds = organizedCredentials?.required || []

        const hasUnassignedRequired = requiredCreds.some((group) => {
            const nodes = group.nodes || []
            return nodes.length > 0 && !nodes.every((node) => credentialAssignments[node.nodeId])
        })

        // Only show confirmation if there are unassigned REQUIRED credentials
        if (hasUnassignedRequired) {
            const confirmPayload = {
                title: 'Required credentials missing',
                description: 'The workflow will not work properly without required credentials. Are you sure you want to close?',
                confirmButtonName: 'Close anyway',
                cancelButtonName: 'Continue setup'
            }

            try {
                const isConfirmed = await confirm(confirmPayload)

                if (!isConfirmed) {
                    return // User chose to continue setup, don't close modal
                }
            } catch (error) {
                console.error('[handleCancel] error in confirm:', error)
                return
            }
        }

        // No required credentials missing or user confirmed, proceed to close
        if (onCancel) {
            onCancel({ dontShowAgain, dontShowDirty })
        }
    }

    const toggleCredentialExpanded = (groupKey) => {
        setExpandedCredentials((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }))
    }

    // Render a single credential in compact grid format
    const renderCredentialCard = (group) => {
        const { groupKey, label, credentialTypes, nodes, isAssigned, isRequired } = group
        const cardTestId = `credential-card-${groupKey}`
        const credentialsForGroup = availableCredentials[groupKey] || []
        const isConnected = isAssigned || false
        const isExpanded = expandedCredentials[groupKey] || false

        // Get assigned credential details
        const assignedCredentialId = nodes?.[0] ? credentialAssignments[nodes[0].nodeId] : null
        const assignedCredential = credentialsForGroup.find((cred) => cred.id === assignedCredentialId)

        // Create a credential object for the CredentialLogo component
        const credentialForLogo = {
            credentialType: credentialTypes?.[0] || group.credentialName,
            label: toSentenceCase(label),
            isAssigned: isConnected,
            isRequired: isRequired
        }

        return (
            <Box
                key={groupKey}
                data-testid={cardTestId}
                onClick={() => isConnected && toggleCredentialExpanded(groupKey)}
                sx={{
                    ...getGlassStyle('credentialCard', isDarkMode),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    cursor: isConnected ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': isConnected
                        ? {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.2)'
                          }
                        : {}
                }}
            >
                {/* Logo with status indicator */}
                <Box>
                    <CredentialLogo credential={credentialForLogo} size='large' showLabel={false} />
                </Box>

                {/* Credential label with status */}
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography
                        variant='caption'
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: isConnected ? 600 : 400,
                            textAlign: 'center',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.3,
                            minHeight: '2.6em'
                        }}
                    >
                        {toSentenceCase(label)}
                    </Typography>
                    {isConnected && assignedCredential && (
                        <Typography
                            variant='caption'
                            sx={{
                                fontSize: '0.65rem',
                                color: 'text.secondary',
                                display: 'block',
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {assignedCredential.name}
                        </Typography>
                    )}
                </Box>

                {/* Add button for unconnected credentials - always visible */}
                {!isConnected && (
                    <Box sx={{ width: '100%', mt: 0.5 }}>
                        <Button
                            fullWidth
                            variant='contained'
                            color='secondary'
                            size='small'
                            data-testid={`credential-add-${groupKey}`}
                            startIcon={<IconPlus size={14} />}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleAddCredential(credentialTypes?.[0] || group.credentialName)
                            }}
                            disabled={loading || assigningCredentials}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.75,
                                boxShadow: 'none'
                            }}
                        >
                            Add
                        </Button>

                        {/* Select existing credentials - show below if available */}
                        {credentialsForGroup.length > 0 && (
                            <FormControl fullWidth size='small' sx={{ mt: 1 }}>
                                <Select
                                    data-testid={`credential-dropdown-${groupKey}`}
                                    value={nodes?.[0] ? credentialAssignments[nodes[0].nodeId] || '' : ''}
                                    onChange={(e) => {
                                        e.stopPropagation()
                                        nodes?.forEach((node) => {
                                            handleCredentialChange(node.nodeId, e.target.value)
                                        })
                                    }}
                                    displayEmpty
                                    disabled={loading || assigningCredentials}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                        fontSize: '0.7rem',
                                        '& .MuiSelect-select': {
                                            py: 0.75
                                        }
                                    }}
                                >
                                    <MenuItem value=''>
                                        <em>Or choose existing...</em>
                                    </MenuItem>
                                    {credentialsForGroup.map((credential) => (
                                        <MenuItem key={credential.id} value={credential.id} sx={{ fontSize: '0.75rem' }}>
                                            {credential.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                )}

                {/* Connected credential details - expanded section */}
                {isConnected && isExpanded && (
                    <Collapse in={isExpanded} sx={{ width: '100%' }}>
                        <Stack spacing={1} sx={{ mt: 1.5 }}>
                            {/* Change credential dropdown */}
                            {credentialsForGroup.length > 1 && (
                                <FormControl fullWidth size='small'>
                                    <Typography
                                        variant='caption'
                                        sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 0.5, display: 'block' }}
                                    >
                                        Change connection:
                                    </Typography>
                                    <Select
                                        data-testid={`credential-change-${groupKey}`}
                                        value={assignedCredentialId}
                                        onChange={(e) => {
                                            e.stopPropagation()
                                            nodes?.forEach((node) => {
                                                handleCredentialChange(node.nodeId, e.target.value)
                                            })
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={loading || assigningCredentials}
                                        sx={{
                                            fontSize: '0.7rem',
                                            '& .MuiSelect-select': {
                                                py: 0.75
                                            }
                                        }}
                                    >
                                        {credentialsForGroup.map((credential) => (
                                            <MenuItem key={credential.id} value={credential.id} sx={{ fontSize: '0.75rem' }}>
                                                {credential.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Add new credential for connected ones */}
                            <Button
                                fullWidth
                                variant='outlined'
                                size='small'
                                startIcon={<IconPlus size={14} />}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddCredential(credentialTypes?.[0] || group.credentialName)
                                }}
                                disabled={loading || assigningCredentials}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.7rem',
                                    py: 0.75
                                }}
                            >
                                {credentialsForGroup.length === 0 ? 'Add Credential' : 'Add Another'}
                            </Button>
                        </Stack>
                    </Collapse>
                )}
            </Box>
        )
    }

    if (!show) return null

    const hasRequired = organizedCredentials.required?.length > 0
    const hasOptional = organizedCredentials.optional?.length > 0
    const hasConnected = organizedCredentials.connected?.length > 0

    const component = (
        <Dialog
            open={show}
            onClose={handleCancel}
            maxWidth='md'
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle
                sx={{
                    pb: 3,
                    pt: 4,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid',
                    borderColor: 'secondary.light'
                }}
            >
                <Typography
                    variant='h4'
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.75rem',
                        letterSpacing: '-0.02em'
                    }}
                >
                    {isQuickSetupMode ? 'Manage Credentials' : 'Setup Required Credentials'}
                </Typography>
                <IconButton
                    onClick={handleCancel}
                    size='small'
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            bgcolor: 'action.hover',
                            color: 'text.primary'
                        }
                    }}
                >
                    <IconX />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, maxHeight: '60vh', bgcolor: 'background.default', overflow: 'auto' }}>
                {loading ? (
                    <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                        <CircularProgress color='secondary' />
                        <Typography sx={{ ml: 2 }}>Loading credentials...</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2.5}>
                        {/* Required Section */}
                        {hasRequired && (
                            <Box data-testid='credential-section-required'>
                                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant='subtitle1' fontWeight='600' sx={{ fontSize: '0.95rem', mb: 0.25 }}>
                                            Required
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem' }}>
                                            Essential for chatflow operation
                                        </Typography>
                                    </Box>
                                </Box>
                                <Grid container spacing={1.5}>
                                    {organizedCredentials.required.map((group) => (
                                        <Grid item xs={6} sm={4} md={3} key={group.groupKey}>
                                            {renderCredentialCard(group)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Optional Section */}
                        {hasOptional && (
                            <Box data-testid='credential-section-optional'>
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant='subtitle1' fontWeight='600' sx={{ fontSize: '0.95rem', mb: 0.25 }}>
                                        Optional
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem' }}>
                                        Additional features
                                    </Typography>
                                </Box>
                                <Grid container spacing={1.5}>
                                    {organizedCredentials.optional.map((group) => (
                                        <Grid item xs={6} sm={4} md={3} key={group.groupKey}>
                                            {renderCredentialCard(group)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Connected Section - Always visible */}
                        {hasConnected && (
                            <Box data-testid='credential-section-connected'>
                                <Box sx={{ mb: 1.5 }}>
                                    <Typography variant='subtitle1' fontWeight='600' sx={{ fontSize: '0.95rem', mb: 0.25 }}>
                                        Connected ({organizedCredentials.connected.length})
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.7rem' }}>
                                        Already configured and ready to use
                                    </Typography>
                                </Box>
                                <Grid container spacing={1.5}>
                                    {organizedCredentials.connected.map((group) => (
                                        <Grid item xs={6} sm={4} md={3} key={group.groupKey}>
                                            {renderCredentialCard(group)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 4, pb: 3, pt: 3, alignItems: 'center', borderTop: '2px solid', borderColor: 'secondary.light' }}>
                {/* Left side: Checkbox */}
                <Box sx={{ mr: 'auto' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={dontShowAgain}
                                onChange={(event) => {
                                    setDontShowAgain(event.target.checked)
                                    setDontShowDirty(true)
                                }}
                                color='secondary'
                                size='small'
                            />
                        }
                        label={
                            <Typography variant='body2' color='text.secondary'>
                                Don&apos;t show this again
                            </Typography>
                        }
                    />
                </Box>

                <Stack direction='row' spacing={1.5}>
                    <Button
                        data-testid='credential-modal-skip'
                        onClick={isQuickSetupMode ? handleCancel : handleSkip}
                        color='inherit'
                        sx={{
                            textTransform: 'none',
                            px: 2.5,
                            fontWeight: 400
                        }}
                    >
                        {isQuickSetupMode ? 'Cancel' : "I'll finish this later"}
                    </Button>
                    <Button
                        data-testid='credential-modal-continue'
                        variant='contained'
                        color='secondary'
                        onClick={handleAssignCredentials}
                        disabled={
                            loading ||
                            assigningCredentials ||
                            organizedCredentials.required.some((group) => {
                                // Check if all nodes in this required group have credential assignments
                                const nodes = group.nodes || []
                                return nodes.length > 0 && !nodes.every((node) => credentialAssignments[node.nodeId])
                            })
                        }
                        sx={{
                            textTransform: 'none',
                            px: 3,
                            fontWeight: 400
                        }}
                    >
                        {assigningCredentials ? <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} /> : null}
                        {assigningCredentials ? 'Saving...' : 'Continue'}
                    </Button>
                </Stack>
            </DialogActions>

            {/* Confirm Dialog for cancel confirmation */}
            <ConfirmDialog />

            {/* Credential creation dialog */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={() => {
                    setShowCredentialDialog(false)
                    setCreatingCredentialFor(null)
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
