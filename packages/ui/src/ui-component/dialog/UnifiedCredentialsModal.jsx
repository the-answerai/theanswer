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
    Paper,
    Avatar,
    Chip,
    Checkbox,
    FormControlLabel,
    Collapse,
    Divider
} from '@mui/material'
import {
    IconPlus,
    IconX,
    IconUserShield,
    IconShieldCheck,
    IconEdit,
    IconLink,
    IconUnlink,
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import AddEditCredentialDialog from '@/views/credentials/AddEditCredentialDialog'
import {
    groupCredentialsByType,
    groupAllCredentialsByType,
    organizeCredentialsByPriority,
    getCredentialCategory,
    toSentenceCase
} from '@/utils/flowCredentialsHelper'

// API
import credentialsApi from '@/api/credentials'

// Constants
import { baseURL } from '@/store/constant'

// ==============================|| UnifiedCredentialsModal ||============================== //

const UnifiedCredentialsModal = ({ show, missingCredentials, onAssign, onSkip, onCancel, onError, initialDontShowAgain = false }) => {
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
        return organizeCredentialsByPriority(groupedCredentials)
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

    const toggleCredentialExpanded = (groupKey) => {
        setExpandedCredentials((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }))
    }

    // Render a single credential card
    const renderCredentialCard = (group) => {
        const { groupKey, label, credentialTypes, nodes, isAssigned } = group
        const credentialsForGroup = availableCredentials[groupKey] || []
        const hasMultipleNodes = nodes?.length > 1
        // Check if ANY node has isRequired=true OR if ANY node has isOptional=false
        const isRequired = nodes?.some((node) => node.isRequired === true || node.isOptional === false) || false
        const isConnected = isAssigned || false
        const isExpanded = expandedCredentials[groupKey] || false

        // Get assigned credential details
        const assignedCredentialId = nodes?.[0] ? credentialAssignments[nodes[0].nodeId] : null
        const assignedCredential = credentialsForGroup.find((cred) => cred.id === assignedCredentialId)

        // Get node category for classification
        const nodeCategory = nodes?.[0]?.nodeCategory || group.nodeCategory || ''
        const credCategory = getCredentialCategory(nodeCategory, credentialTypes?.[0] || group.credentialName)

        return (
            <Paper
                key={groupKey}
                elevation={isConnected ? 0 : 2}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: isConnected ? 'success.light' : isRequired ? 'warning.main' : 'grey.300',
                    backgroundColor: isConnected ? 'rgba(46, 125, 50, 0.04)' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: isConnected ? 2 : 4
                    }
                }}
            >
                <Stack spacing={2}>
                    {/* Header */}
                    <Box display='flex' alignItems='center' gap={2}>
                        <Avatar
                            src={`${baseURL}/api/v1/components-credentials-icon/${credentialTypes?.[0] || group.credentialName}`}
                            sx={{ width: 48, height: 48, bgcolor: 'background.paper' }}
                        >
                            {isConnected ? <IconShieldCheck /> : <IconUserShield />}
                        </Avatar>
                        <Box flex={1}>
                            <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                                <Typography variant='h6' fontWeight='bold'>
                                    {toSentenceCase(label)}
                                </Typography>
                                {/* Connection Status Badge */}
                                <Chip
                                    icon={isConnected ? <IconLink size={14} /> : <IconUnlink size={14} />}
                                    label={isConnected ? 'Connected' : 'Not Connected'}
                                    size='small'
                                    color={isConnected ? 'success' : 'warning'}
                                    variant='filled'
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                />
                                {/* Required/Optional Badge */}
                                <Chip
                                    label={isRequired ? 'Required' : 'Optional'}
                                    size='small'
                                    color={isRequired ? 'error' : 'default'}
                                    variant='outlined'
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                />
                                {/* Category Badge */}
                                {credCategory.displayName !== 'Other' && (
                                    <Chip
                                        label={credCategory.displayName}
                                        size='small'
                                        variant='outlined'
                                        sx={{ fontSize: '0.7rem', height: 22 }}
                                    />
                                )}
                            </Box>
                            <Typography variant='body2' color='text.secondary'>
                                {hasMultipleNodes
                                    ? `Required by ${nodes.length} nodes`
                                    : `Required by ${toSentenceCase(nodes?.[0]?.nodeName)}`}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Main Action Area */}
                    <Box>
                        {!isConnected ? (
                            /* Unconnected: Show "Connect" button with logo */
                            <Stack spacing={1.5}>
                                <StyledButton
                                    variant='contained'
                                    color='primary'
                                    fullWidth
                                    startIcon={
                                        <Box
                                            component='img'
                                            src={`${baseURL}/api/v1/components-credentials-icon/${
                                                credentialTypes?.[0] || group.credentialName
                                            }`}
                                            alt={label}
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                objectFit: 'contain',
                                                borderRadius: '4px'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none'
                                            }}
                                        />
                                    }
                                    onClick={() => handleAddCredential(credentialTypes?.[0] || group.credentialName)}
                                    sx={{
                                        py: 1,
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    Connect
                                </StyledButton>
                                {credentialsForGroup.length > 0 && (
                                    <Box>
                                        <Button
                                            size='small'
                                            onClick={() => toggleCredentialExpanded(groupKey)}
                                            endIcon={isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {isExpanded ? 'Hide' : 'Show'} existing credentials
                                        </Button>
                                        <Collapse in={isExpanded}>
                                            <Box sx={{ mt: 1 }}>
                                                <FormControl fullWidth size='small'>
                                                    <Select
                                                        value={nodes?.[0] ? credentialAssignments[nodes[0].nodeId] || '' : ''}
                                                        onChange={(e) => {
                                                            nodes?.forEach((node) => {
                                                                handleCredentialChange(node.nodeId, e.target.value)
                                                            })
                                                        }}
                                                        displayEmpty
                                                        disabled={loading || assigningCredentials}
                                                    >
                                                        <MenuItem value=''>
                                                            <em>Select existing credential...</em>
                                                        </MenuItem>
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
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}
                            </Stack>
                        ) : (
                            /* Connected: Show assigned credential with edit option */
                            <Box>
                                <Paper
                                    variant='outlined'
                                    sx={{
                                        p: 1.5,
                                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                                        borderColor: 'success.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <Box flex={1}>
                                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                                            Connected as:
                                        </Typography>
                                        <Typography variant='body1' fontWeight='medium'>
                                            {assignedCredential?.name || 'Unknown Credential'}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size='small'
                                        onClick={() => toggleCredentialExpanded(groupKey)}
                                        sx={{
                                            ml: 2,
                                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            '&:hover': {
                                                bgcolor: 'background.paper',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                        title='Edit credential'
                                    >
                                        <IconEdit size={16} />
                                    </IconButton>
                                </Paper>

                                {/* Edit Dropdown */}
                                <Collapse in={isExpanded}>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                                            Change credential:
                                        </Typography>
                                        <Stack spacing={1}>
                                            <FormControl fullWidth size='small'>
                                                <Select
                                                    value={nodes?.[0] ? credentialAssignments[nodes[0].nodeId] || '' : ''}
                                                    onChange={(e) => {
                                                        nodes?.forEach((node) => {
                                                            handleCredentialChange(node.nodeId, e.target.value)
                                                        })
                                                    }}
                                                    disabled={loading || assigningCredentials}
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
                                            <Button
                                                size='small'
                                                startIcon={<IconPlus size={14} />}
                                                onClick={() => handleAddCredential(credentialTypes?.[0] || group.credentialName)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Add new credential
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Box>
                        )}
                    </Box>

                    {/* Show affected nodes if multiple */}
                    {hasMultipleNodes && (
                        <Box>
                            <Typography variant='caption' color='text.secondary' gutterBottom>
                                Affected nodes:
                            </Typography>
                            <Box display='flex' flexWrap='wrap' gap={0.5} mt={0.5}>
                                {nodes?.map((node) => (
                                    <Chip key={node.nodeId} label={toSentenceCase(node.nodeName)} size='small' variant='outlined' />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Stack>
            </Paper>
        )
    }

    if (!show) return null

    const hasUnconnectedRequired = organizedCredentials.unconnectedRequired.length > 0
    const hasUnconnectedOptional = organizedCredentials.unconnectedOptional.length > 0
    const hasConnectedRequired = organizedCredentials.connectedRequired.length > 0
    const hasConnectedOptional = organizedCredentials.connectedOptional.length > 0

    const component = (
        <Dialog
            open={show}
            onClose={handleCancel}
            maxWidth='md'
            fullWidth
            sx={{ position: 'absolute' }}
            PaperProps={{ sx: { borderRadius: 2 } }}
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
                        {/* Unconnected Required Section */}
                        {hasUnconnectedRequired && (
                            <Box>
                                <Box display='flex' alignItems='center' gap={1} mb={2}>
                                    <IconUnlink size={20} color='#ed6c02' />
                                    <Typography variant='h6' color='error.main' fontWeight='bold'>
                                        Required Setup
                                    </Typography>
                                </Box>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    These credentials are essential for this flow to function properly.
                                </Typography>
                                <Stack spacing={2}>
                                    {organizedCredentials.unconnectedRequired.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}

                        {/* Unconnected Optional Section */}
                        {hasUnconnectedOptional && (
                            <Box>
                                {hasUnconnectedRequired && <Divider sx={{ my: 2 }} />}
                                <Box display='flex' alignItems='center' gap={1} mb={2}>
                                    <IconUnlink size={20} color='#ed6c02' />
                                    <Typography variant='h6' fontWeight='bold'>
                                        Optional Enhancements
                                    </Typography>
                                </Box>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                    These credentials unlock additional features and capabilities.
                                </Typography>
                                <Stack spacing={2}>
                                    {organizedCredentials.unconnectedOptional.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}

                        {/* Connected Required Section */}
                        {hasConnectedRequired && (
                            <Box>
                                {(hasUnconnectedRequired || hasUnconnectedOptional) && <Divider sx={{ my: 2 }} />}
                                <Box display='flex' alignItems='center' gap={1} mb={2}>
                                    <IconLink size={20} color='#2e7d32' />
                                    <Typography variant='h6' color='success.main' fontWeight='bold'>
                                        Connected (Required)
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {organizedCredentials.connectedRequired.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}

                        {/* Connected Optional Section */}
                        {hasConnectedOptional && (
                            <Box>
                                {(hasUnconnectedRequired || hasUnconnectedOptional || hasConnectedRequired) && <Divider sx={{ my: 2 }} />}
                                <Box display='flex' alignItems='center' gap={1} mb={2}>
                                    <IconLink size={20} color='#2e7d32' />
                                    <Typography variant='h6' color='success.main' fontWeight='bold'>
                                        Connected (Optional)
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {organizedCredentials.connectedOptional.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}
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
                    {assigningCredentials ? 'Saving...' : 'Save & Continue'}
                </StyledButton>
            </DialogActions>

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
