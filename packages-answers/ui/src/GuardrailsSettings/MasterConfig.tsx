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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import credentialsApi from 'flowise-ui/src/api/credentials'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from 'flowise-ui/src/store/actions'
import useConfirm from 'flowise-ui/src/hooks/useConfirm'
import { IconX, IconUnlink, IconEdit, IconShieldCheck } from '@tabler/icons-react'

// Use core Flowise dialog with defaultVisibility prop for org-wide credentials
const AddEditCredentialDialog = dynamic(() => import('flowise-ui/src/views/credentials/AddEditCredentialDialog'), { ssr: false })
const ConfirmDialog = dynamic(() => import('flowise-ui/src/ui-component/dialog/ConfirmDialog'), { ssr: false })

const FIDDLER_CREDENTIAL_NAME = 'fiddlerApi'

interface GuardrailConfig {
    enabled?: boolean
    credentialId?: string
    failureMode?: 'open' | 'closed'
    observabilityOnly?: boolean
}

interface CredentialDialogProps {
    type: 'ADD' | 'EDIT'
    cancelButtonName: string
    confirmButtonName: string
    credentialComponent: Record<string, unknown>
    defaultVisibility?: string[]
    data?: Credential
}

interface MasterConfigProps {
    config: GuardrailConfig
    onConfigChange: (updates: Partial<GuardrailConfig>) => void
    onSave: (config: GuardrailConfig) => void
}

interface Credential {
    id: string
    name: string
    credentialName: string
}

export default function MasterConfig({ config, onConfigChange, onSave }: MasterConfigProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedCredential, setSelectedCredential] = useState<string>(config?.credentialId ?? '')
    const [failureMode, setFailureMode] = useState<'open' | 'closed'>(config?.failureMode ?? 'open')
    const [observabilityOnly, setObservabilityOnly] = useState<boolean>(config?.observabilityOnly ?? false)
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(true)

    // Credential modal state
    const [showCredentialDialog, setShowCredentialDialog] = useState(false)
    const [credentialDialogProps, setCredentialDialogProps] = useState<Partial<CredentialDialogProps>>({})
    const [editLoading, setEditLoading] = useState(false)
    const [showCredentialDropdown, setShowCredentialDropdown] = useState(false)

    // Hooks for snackbar notifications and confirmation dialog
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args: any[]) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args: any[]) => dispatch(closeSnackbarAction(...args))
    const { confirm } = useConfirm()

    const showSnackbar = (message: string, variant: 'success' | 'error') => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant,
                action: (key: any) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    // Load Fiddler credentials on mount
    useEffect(() => {
        loadCredentials()
    }, [])

    // Sync state with config prop changes
    useEffect(() => {
        setEnabled(config?.enabled ?? false)
        setSelectedCredential(config?.credentialId ?? '')
        setFailureMode(config?.failureMode ?? 'open')
        setObservabilityOnly(config?.observabilityOnly ?? false)
    }, [config])

    const loadCredentials = async () => {
        try {
            setLoadingCredentials(true)
            const response = await credentialsApi.getCredentialsByName(FIDDLER_CREDENTIAL_NAME)
            setCredentials(response.data || [])
        } catch (error) {
            console.error('Failed to load Fiddler credentials:', error)
            showSnackbar('Failed to load credentials', 'error')
        } finally {
            setLoadingCredentials(false)
        }
    }

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newEnabled = event.target.checked
        setEnabled(newEnabled)
        onConfigChange({ enabled: newEnabled })
    }

    const handleFailureModeChange = (_: unknown, value: 'open' | 'closed' | null) => {
        if (!value) return
        setFailureMode(value)
        onConfigChange({ failureMode: value })
        onSave({ ...config, failureMode: value })
    }

    const handleObservabilityOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.checked
        setObservabilityOnly(next)
        onConfigChange({ observabilityOnly: next })
        onSave({ ...config, observabilityOnly: next })
    }

    const handleCreateCredential = async () => {
        try {
            // Load the Fiddler credential component schema
            const response = await credentialsApi.getSpecificComponentCredential(FIDDLER_CREDENTIAL_NAME)
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
            showSnackbar('Failed to load credential component', 'error')
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
            onSave({ ...config, credentialId, enabled: true })
        }
    }

    const handleCredentialDialogCancel = () => {
        setShowCredentialDialog(false)
    }

    const handleEditCredential = async () => {
        if (!selectedCredentialObj) return
        setEditLoading(true)
        try {
            const response = await credentialsApi.getSpecificComponentCredential(FIDDLER_CREDENTIAL_NAME)
            const componentCredential = response.data
            if (!componentCredential?.name) {
                throw new Error('Failed to load Fiddler credential component')
            }
            setCredentialDialogProps({
                type: 'EDIT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                credentialComponent: componentCredential,
                data: selectedCredentialObj
            })
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('Error loading credential component:', error)
            showSnackbar('Failed to load credential editor', 'error')
        } finally {
            setEditLoading(false)
        }
    }

    const handleDisconnect = async () => {
        if (!selectedCredential && !config?.credentialId) return
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
            onSave({ ...config, credentialId: '', enabled: false })
            showSnackbar('Credential disconnected from guardrails', 'success')
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
                                <IconShieldCheck size={20} aria-label='Guardrails configured' />
                                <Typography variant='body2'>Fiddler guardrails are active and configured for your organization.</Typography>
                            </Box>
                            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block', ml: 3.5 }}>
                                This credential is managed by another member of your organization.
                                {config?.credentialId && <> (ID: {config.credentialId.slice(0, 8)}…)</>}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {/* Disconnect is intentionally always enabled in read-only mode so any org member can disconnect guardrails */}
                            <Button
                                variant='outlined'
                                size='small'
                                color='error'
                                onClick={handleDisconnect}
                                startIcon={<IconUnlink size={16} />}
                            >
                                Disconnect
                            </Button>
                            {/* Show Change when user owns any credentials they could switch to */}
                            {credentials.length > 0 && (
                                <Button
                                    variant='contained'
                                    color='secondary'
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
                                disabled={!enabled || editLoading}
                                onClick={handleEditCredential}
                                startIcon={editLoading ? <CircularProgress size={16} /> : <IconEdit size={16} />}
                            >
                                Edit
                            </Button>
                            <Button
                                variant='outlined'
                                size='small'
                                color='error'
                                onClick={handleDisconnect}
                                startIcon={<IconUnlink size={16} />}
                            >
                                Disconnect
                            </Button>
                            {/* > 1 because the currently selected credential doesn't count as an alternative */}
                            {credentials.length > 1 && (
                                <Button
                                    variant='contained'
                                    color='secondary'
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
                                    variant='contained'
                                    color='secondary'
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
                                        onSave({ ...config, credentialId: cred.id, enabled: true })
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

            {/* Failure Mode — how the runtime behaves when Fiddler cannot be evaluated.
                Fail-open: request proceeds, chat shows a banner, operators get a log line.
                Fail-closed: request is stopped cold with HTTP 503 so content cannot bypass checks. */}
            <Box sx={{ mt: 3 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                    When Fiddler is unavailable
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    Failure mode
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                    What happens when safety checks cannot be evaluated (bad API key, Fiddler outage, timeout)? This is separate from
                    threshold strictness in presets below.
                </Typography>
                <ToggleButtonGroup
                    color='primary'
                    value={failureMode}
                    exclusive
                    onChange={handleFailureModeChange}
                    disabled={!enabled}
                    aria-label='Failure mode'
                >
                    <ToggleButton value='open' aria-label='Fail open'>
                        Fail Open (allow, warn)
                    </ToggleButton>
                    <ToggleButton value='closed' aria-label='Fail closed'>
                        Fail Closed (block, 503)
                    </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    {failureMode === 'closed'
                        ? 'Fail closed: block the request with an error when checks cannot be run. Higher safety, lower availability.'
                        : 'Fail open: deliver the message with a warning when checks cannot be run. Higher availability, lower safety.'}
                </Typography>
            </Box>

            {/* Observability-only mode (shadow pilot). Violations recorded, never blocked. */}
            <Box sx={{ mt: 3 }}>
                <FormControlLabel
                    control={
                        <Switch checked={observabilityOnly} onChange={handleObservabilityOnlyChange} color='primary' disabled={!enabled} />
                    }
                    label='Observability-only (shadow mode)'
                />
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 4, mt: -0.5 }}>
                    When on, real violations are recorded in message metadata but never block the request. Use before flipping enforcement
                    on in production.
                </Typography>
            </Box>

            {/* Credential Modal - uses core dialog with defaultVisibility enhancement */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={handleCredentialDialogCancel}
                onConfirm={handleCredentialDialogConfirm}
            />
            <ConfirmDialog />
        </Box>
    )
}
