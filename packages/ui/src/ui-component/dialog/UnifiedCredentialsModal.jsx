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
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import {
    groupCredentialsByType,
    groupAllCredentialsByType,
    organizeCredentialsByPriority,
    getCredentialCategory,
    toSentenceCase
} from '@/utils/flowCredentialsHelper'

// API
import credentialsApi from '@/api/credentials'

// Hooks
import useConfirm from '@/hooks/useConfirm'

// Constants
import { baseURL } from '@/store/constant'

// ==============================|| UnifiedCredentialsModal ||============================== //

const UnifiedCredentialsModal = ({ show, missingCredentials, onAssign, onSkip, onCancel, onError, initialDontShowAgain = false }) => {
    const { confirm } = useConfirm()
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

    console.log('[UnifiedCredentialsModal] missingCredentials:', missingCredentials)
    console.log('[UnifiedCredentialsModal] isQuickSetupMode:', isQuickSetupMode)
    console.log('[UnifiedCredentialsModal] groupedCredentials:', groupedCredentials)

    // Organize credentials by priority and connection status
    const organizedCredentials = useMemo(() => {
        const organized = organizeCredentialsByPriority(groupedCredentials)
        console.log('[UnifiedCredentialsModal] organizedCredentials:', organized)
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
            return nodes.length > 0 && !nodes.every(node => credentialAssignments[node.nodeId])
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
        // Check if there are ANY unconnected credentials (required or optional) that haven't been set up
        const requiredCreds = organizedCredentials?.required || []
        const optionalCreds = organizedCredentials?.optional || []
        const allUnconnected = [...requiredCreds, ...optionalCreds]
        
        const hasUnassignedCredentials = allUnconnected.some((group) => {
            const nodes = group.nodes || []
            return nodes.length > 0 && !nodes.every(node => credentialAssignments[node.nodeId])
        })

        // Always show confirmation dialog when closing
        const hasRequired = requiredCreds.length > 0
        const message = hasUnassignedCredentials && hasRequired
            ? 'The workflow will not work properly without required credentials. Are you sure you want to close?'
            : hasUnassignedCredentials
            ? 'You have not finished setting up credentials. Are you sure you want to close?'
            : 'Are you sure you want to close?'
        
        const confirmPayload = {
            title: 'Close without saving?',
            description: message,
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

        // User confirmed, proceed to close
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

    // Render a single credential card with modern card design
    const renderCredentialCard = (group) => {
        const { groupKey, label, credentialTypes, nodes, isAssigned, isRequired } = group
        const credentialsForGroup = availableCredentials[groupKey] || []
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
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: isConnected ? 'secondary.main' : 'rgba(255, 255, 255, 0.16)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        '& .connected-box': {
                            borderColor: 'secondary.main',
                            bgcolor: 'action.hover'
                        },
                        '& .edit-button': {
                            bgcolor: 'secondary.light',
                            color: 'secondary.main'
                        }
                    }
                }}
            >
                {/* Header: Icon, Name, Status */}
                <Box display='flex' alignItems='flex-start' gap={2.5}>
                    <Avatar
                        src={`${baseURL}/api/v1/components-credentials-icon/${credentialTypes?.[0] || group.credentialName}`}
                        sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 0.75
                        }}
                    >
                        {isConnected ? <IconShieldCheck /> : <IconUserShield />}
                    </Avatar>
                    <Box flex={1}>
                        <Box display='flex' alignItems='center' gap={1} mb={0.5} flexWrap='wrap'>
                            <Typography variant='h6' fontWeight='600' sx={{ fontSize: '16px' }}>
                                {toSentenceCase(label)}
                            </Typography>
                            {isConnected && (
                                <Chip
                                    icon={<IconShieldCheck size={14} />}
                                    label='Connected'
                                    size='small'
                                    sx={{ 
                                        fontSize: '0.75rem', 
                                        height: 24,
                                        fontWeight: 600,
                                        bgcolor: 'rgba(46, 125, 50, 0.1)',
                                        color: '#2e7d32',
                                        border: '1px solid',
                                        borderColor: '#2e7d32',
                                        '& .MuiChip-icon': {
                                            color: '#2e7d32'
                                        }
                                    }}
                                />
                            )}
                            {isRequired && !isConnected && (
                                <Chip
                                    label='Required'
                                    size='small'
                                    sx={{ 
                                        fontSize: '0.75rem', 
                                        height: 24,
                                        fontWeight: 600,
                                        bgcolor: 'transparent',
                                        color: '#d32f2f',
                                        border: '1px solid',
                                        borderColor: '#d32f2f'
                                    }}
                                />
                            )}
                        </Box>
                        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '14px', mt: 0.5 }}>
                            {nodes?.length > 1
                                ? `Required by ${nodes.length} nodes`
                                : `Required by ${toSentenceCase(nodes?.[0]?.nodeName || 'unknown node')}`}
                        </Typography>
                    </Box>
                </Box>

                {/* Connected As Section or Connect Actions */}
                <Box sx={{ mt: 2.5 }}>
                    {isConnected && assignedCredential ? (
                        <Paper
                            variant='outlined'
                            className='connected-box'
                            sx={{
                                p: 2.5,
                                borderRadius: 1.5,
                                bgcolor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'secondary.main',
                                    bgcolor: 'action.hover',
                                    '& .edit-button': {
                                        bgcolor: 'secondary.light',
                                        color: 'secondary.main'
                                    }
                                }
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography 
                                    variant='body2' 
                                    color='text.secondary' 
                                    sx={{ 
                                        fontSize: '13px',
                                        mb: 0.5,
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    Connected as:
                                </Typography>
                                <Typography 
                                    variant='body1' 
                                    sx={{ 
                                        fontSize: '15px', 
                                        fontWeight: 600,
                                        color: 'text.primary',
                                        lineHeight: 1.4
                                    }}
                                >
                                    {assignedCredential.name}
                                </Typography>
                            </Box>
                            <IconButton
                                size='small'
                                onClick={() => toggleCredentialExpanded(groupKey)}
                                disabled={loading || assigningCredentials}
                                className='edit-button'
                                sx={{
                                    color: 'text.secondary',
                                    bgcolor: 'transparent',
                                    p: 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: 'secondary.main',
                                        color: 'white'
                                    }
                                }}
                            >
                                <IconEdit size={18} />
                            </IconButton>
                        </Paper>
                    ) : (
                        <Stack direction='row' spacing={1.5} alignItems='center'>
                            <Button
                                variant='contained'
                                color='secondary'
                                onClick={() => handleAddCredential(credentialTypes?.[0] || group.credentialName)}
                                disabled={loading || assigningCredentials}
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 500, 
                                    minWidth: 120,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                    }
                                }}
                            >
                                Connect
                            </Button>
                            {credentialsForGroup.length > 0 && (
                                <Button
                                    variant='outlined'
                                    onClick={() => toggleCredentialExpanded(groupKey)}
                                    sx={{ 
                                        textTransform: 'none', 
                                        minWidth: 140,
                                        borderColor: 'divider',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'secondary.main',
                                            bgcolor: 'action.hover',
                                            color: 'secondary.main'
                                        }
                                    }}
                                >
                                    {isExpanded ? 'Hide' : `Use existing (${credentialsForGroup.length})`}
                                </Button>
                            )}
                        </Stack>
                    )}

                    {/* Dropdown for selecting existing credentials */}
                    {isExpanded && credentialsForGroup.length > 0 && (
                        <Collapse in={isExpanded}>
                            <Stack direction='row' spacing={1.5} sx={{ mt: 2 }} alignItems='center'>
                                <FormControl fullWidth size='small'>
                                    <Select
                                        value={nodes?.[0] ? credentialAssignments[nodes[0].nodeId] || '' : ''}
                                        onChange={(e) => {
                                            nodes?.forEach((node) => {
                                                handleCredentialChange(node.nodeId, e.target.value)
                                            })
                                        }}
                                        displayEmpty={!isConnected}
                                        disabled={loading || assigningCredentials}
                                        sx={{
                                            bgcolor: 'background.default',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'divider'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'secondary.main'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'secondary.main'
                                            }
                                        }}
                                    >
                                        {!isConnected && (
                                            <MenuItem value=''>
                                                <em>Select existing...</em>
                                            </MenuItem>
                                        )}
                                        {credentialsForGroup.map((credential) => (
                                            <MenuItem key={credential.id} value={credential.id}>
                                                {credential.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {/* Only show "Create new" button for connected credentials */}
                                {isConnected && (
                                    <Button
                                        variant='contained'
                                        color='secondary'
                                        onClick={() => handleAddCredential(credentialTypes?.[0] || group.credentialName)}
                                        disabled={loading || assigningCredentials}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 500,
                                            minWidth: 120,
                                            whiteSpace: 'nowrap',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                            }
                                        }}
                                    >
                                        Create new
                                    </Button>
                                )}
                            </Stack>
                        </Collapse>
                    )}
                </Box>
            </Paper>
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
                    backgroundImage: 'none'
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

            <DialogContent sx={{ p: 4, minHeight: '400px', bgcolor: 'background.default' }}>
                {loading ? (
                    <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                        <CircularProgress color='secondary' />
                        <Typography sx={{ ml: 2 }}>Loading credentials...</Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {/* Required Section */}
                        {hasRequired && (
                            <Box>
                                <Box sx={{ pt: 2, mb: 2 }}>
                                    <Typography 
                                        variant='h6' 
                                        fontWeight='700' 
                                        sx={{ 
                                            fontSize: '1.1rem',
                                            mb: 0.5
                                        }}
                                    >
                                        Required
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        These credentials are essential to use the chatflow
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {organizedCredentials.required.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}

                        {/* Optional Section */}
                        {hasOptional && (
                            <Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography 
                                        variant='h6' 
                                        fontWeight='700' 
                                        sx={{ 
                                            fontSize: '1.1rem',
                                            mb: 0.5
                                        }}
                                    >
                                        Optional
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Optional credentials for additional features
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {organizedCredentials.optional.map((group) => renderCredentialCard(group))}
                                </Stack>
                            </Box>
                        )}

                        {/* Connected Section */}
                        {hasConnected && (
                            <Box>
                                <Box sx={{ pt: 2, mb: 2 }}>
                                    <Typography 
                                        variant='h6' 
                                        fontWeight='700' 
                                        sx={{ 
                                            fontSize: '1.1rem',
                                            mb: 0.5,
                                            color: 'secondary.main'
                                        }}
                                    >
                                        Connected
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    {organizedCredentials.connected.map((group) => renderCredentialCard(group))}
                                </Stack>
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
                                Don't show this again
                            </Typography>
                        }
                    />
                </Box>

                <Stack direction='row' spacing={1.5}>
                    <Button 
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
                        variant='contained'
                        color='secondary'
                        onClick={handleAssignCredentials}
                        disabled={
                            loading || 
                            assigningCredentials || 
                            organizedCredentials.required.some((group) => {
                                // Check if all nodes in this required group have credential assignments
                                const nodes = group.nodes || []
                                return nodes.length > 0 && !nodes.every(node => credentialAssignments[node.nodeId])
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
