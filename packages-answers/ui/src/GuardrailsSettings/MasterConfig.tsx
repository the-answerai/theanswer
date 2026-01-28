'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import credentialsApi from 'flowise-ui/src/api/credentials'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from 'flowise-ui/src/store/actions'
import useConfirm from 'flowise-ui/src/hooks/useConfirm'
import { IconX, IconUnlink, IconEdit, IconShieldCheck } from '@tabler/icons-react'

// Use core Flowise dialog with defaultVisibility prop for org-wide credentials
const AddEditCredentialDialog = dynamic(() => import('flowise-ui/src/views/credentials/AddEditCredentialDialog'), { ssr: false })

interface MasterConfigProps {
    config: any
    onConfigChange: (updates: Partial<any>) => void
}

interface Credential {
    id: string
    name: string
    credentialName: string
}

export default function MasterConfig({ config, onConfigChange }: MasterConfigProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedCredential, setSelectedCredential] = useState<string>(config?.credentialId ?? '')
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(true)

    // Credential modal state
    const [showCredentialDialog, setShowCredentialDialog] = useState(false)
    const [credentialDialogProps, setCredentialDialogProps] = useState<any>({})
    const [showCredentialDropdown, setShowCredentialDropdown] = useState(false)

    // Hooks for snackbar notifications and confirmation dialog
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args: any[]) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args: any[]) => dispatch(closeSnackbarAction(...args))
    const { confirm } = useConfirm()

    // Load Fiddler credentials on mount
    useEffect(() => {
        loadCredentials()
    }, [])

    // Sync state with config prop changes
    useEffect(() => {
        setEnabled(config?.enabled ?? false)
        setSelectedCredential(config?.credentialId ?? '')
    }, [config])

    const loadCredentials = async () => {
        try {
            setLoadingCredentials(true)
            const response = await credentialsApi.getCredentialsByName('fiddlerApi')
            setCredentials(response.data || [])
        } catch (error) {
            console.error('Failed to load Fiddler credentials:', error)
        } finally {
            setLoadingCredentials(false)
        }
    }

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newEnabled = event.target.checked
        setEnabled(newEnabled)
        onConfigChange({ enabled: newEnabled })
    }

    const handleCredentialChange = (event: any) => {
        const newCredentialId = event.target.value
        setSelectedCredential(newCredentialId)
        onConfigChange({ credentialId: newCredentialId })
    }

    const handleCreateCredential = async () => {
        try {
            // Load the Fiddler credential component schema
            const response = await credentialsApi.getSpecificComponentCredential('fiddlerApi')
            const componentCredential = response.data

            if (!componentCredential?.name) {
                throw new Error('Failed to load Fiddler credential component')
            }

            // Use core dialog with defaultVisibility for org-wide credentials
            setCredentialDialogProps({
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add',
                credentialComponent: componentCredential,
                defaultVisibility: ['Organization'] // AAI enhancement: force org visibility
            })
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('Error loading credential component:', error)
            enqueueSnackbar({
                message: 'Failed to load credential component',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key: any) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    const handleCredentialDialogConfirm = (credentialId: string) => {
        setShowCredentialDialog(false)

        // Refresh credentials list
        loadCredentials()

        // For new credentials, auto-select and auto-enable guardrails
        if (credentialId && credentialDialogProps.type === 'ADD') {
            setSelectedCredential(credentialId)
            setEnabled(true)
            onConfigChange({ credentialId: credentialId, enabled: true })
        }
    }

    const handleCredentialDialogCancel = () => {
        setShowCredentialDialog(false)
    }

    const handleEditCredential = async () => {
        if (!selectedCredentialObj) return
        try {
            const response = await credentialsApi.getSpecificComponentCredential('fiddlerApi')
            const componentCredential = response.data
            if (!componentCredential?.name) {
                throw new Error('Failed to load Fiddler credential component')
            }
            setCredentialDialogProps({
                type: 'EDIT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                credentialComponent: componentCredential,
                credential: selectedCredentialObj
            })
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('Error loading credential component:', error)
            enqueueSnackbar({
                message: 'Failed to load credential editor',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key: any) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    const handleDisconnect = async () => {
        const credName = selectedCredentialObj?.name || 'Fiddler credential'

        const isConfirmed = await confirm({
            title: 'Disconnect',
            description: `Disconnect "${credName}" from guardrails? The credential will not be deleted.`,
            confirmButtonName: 'Disconnect',
            cancelButtonName: 'Cancel'
        })

        if (isConfirmed) {
            setSelectedCredential('')
            onConfigChange({ credentialId: '', enabled: false })
            enqueueSnackbar({
                message: 'Credential disconnected from guardrails',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success',
                    action: (key: any) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    // Get the currently selected credential object
    const selectedCredentialObj = credentials.find((cred) => cred.id === selectedCredential)

    // Detect read-only mode: credential is configured but user doesn't have access
    const hasConfiguredCredential = !!config?.credentialId
    const userCanAccessCredential = !!selectedCredentialObj
    const isReadOnlyMode = hasConfiguredCredential && !userCanAccessCredential && !loadingCredentials

    return (
        <Box variant='outlined' sx={{ mb: 3 }}>
            {/* Enable/Disable Toggle */}
            <FormControlLabel
                control={<Switch checked={enabled} onChange={handleEnabledChange} color='primary' />}
                label='Enable Guardrails'
                sx={{ mb: 2 }}
            />

            {/* Credential Connection Status */}

            <Box>
                {loadingCredentials ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant='body2' color='text.secondary'>
                            Loading credentials...
                        </Typography>
                    </Box>
                ) : isReadOnlyMode ? (
                    // Read-only: credential configured but user can't access it
                    <Card
                        variant='outlined'
                        sx={{
                            p: 2.5,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconShieldCheck size={20} />
                                <Typography variant='body2'>
                                    Fiddler guardrails are active and configured for your organization.
                                </Typography>
                            </Box>
                            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block', ml: 3.5 }}>
                                The connected credential is managed in another workspace.
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                variant='outlined'
                                size='small'
                                color='error'
                                onClick={handleDisconnect}
                                startIcon={<IconUnlink size={16} />}
                            >
                                Disconnect
                            </Button>
                            {credentials.length > 0 && (
                                <Button
                                    variant='outlined'
                                    size='small'
                                    onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}
                                >
                                    Change
                                </Button>
                            )}
                        </Box>
                    </Card>
                ) : selectedCredentialObj ? (
                    // Connected State - Show credential name with edit button
                    <Card
                        variant='outlined'
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

                            ...(!enabled
                                ? {
                                      opacity: 0.5
                                  }
                                : {
                                      '&:hover': {
                                          borderColor: 'primary.main',
                                          bgcolor: 'action.hover'
                                      }
                                  })
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
                                {selectedCredentialObj.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button
                                variant='outlined'
                                size='small'
                                disabled={!enabled}
                                onClick={handleEditCredential}
                                startIcon={<IconEdit size={16} />}
                            >
                                Edit
                            </Button>
                            <Button
                                variant='outlined'
                                size='small'
                                color='error'
                                disabled={!enabled}
                                onClick={handleDisconnect}
                                startIcon={<IconUnlink size={16} />}
                            >
                                Disconnect
                            </Button>
                            {credentials.length > 1 && (
                                <Button
                                    variant='outlined'
                                    size='small'
                                    disabled={!enabled}
                                    onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}
                                >
                                    Change
                                </Button>
                            )}
                        </Box>
                    </Card>
                ) : (
                    // Not Connected - Show connect button
                    <Box>
                        <Alert severity='warning' sx={{ mb: 2 }}>
                            Please connect a Fiddler API credential to enable guardrails
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Button variant='contained' color='primary' onClick={handleCreateCredential}>
                                Connect Fiddler
                            </Button>
                            {credentials.length > 0 && (
                                <Button
                                    variant='outlined'
                                    onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}
                                    sx={{ minWidth: 140 }}
                                >
                                    {showCredentialDropdown ? 'Hide' : `Use existing (${credentials.length})`}
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Dropdown for selecting existing credentials (collapsed by default) */}
                {showCredentialDropdown && credentials.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant='body2' sx={{ mb: 1 }}>
                            Select Existing Credential
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {credentials.map((cred) => (
                                <Card
                                    key={cred.id}
                                    variant='outlined'
                                    sx={{
                                        p: 1.5,
                                        cursor: 'pointer',
                                        border: selectedCredential === cred.id ? '2px solid' : '1px solid',
                                        borderColor: selectedCredential === cred.id ? 'primary.main' : 'divider',
                                        '&:hover': {
                                            borderColor: 'primary.light',
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                    onClick={() => {
                                        setSelectedCredential(cred.id)
                                        setEnabled(true)
                                        onConfigChange({ credentialId: cred.id, enabled: true })
                                        setShowCredentialDropdown(false)
                                    }}
                                >
                                    <Typography variant='body2'>{cred.name}</Typography>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Credential Modal - uses core dialog with defaultVisibility enhancement */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={handleCredentialDialogCancel}
                onConfirm={handleCredentialDialogConfirm}
            />
        </Box>
    )
}
