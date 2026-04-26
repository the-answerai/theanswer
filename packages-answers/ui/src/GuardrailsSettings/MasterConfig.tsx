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
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import credentialsApi from 'flowise-ui/src/api/credentials'
import guardrailsApi from 'flowise-ui/src/api/guardrails'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from 'flowise-ui/src/store/actions'
import useConfirm from 'flowise-ui/src/hooks/useConfirm'
import {
    IconX,
    IconUnlink,
    IconEdit,
    IconShieldCheck,
    IconRefresh,
    IconCheck,
    IconMinus,
    IconAlertTriangle,
    IconCircleDot,
    IconLock
} from '@tabler/icons-react'

// Use core Flowise dialog with defaultVisibility prop for org-wide credentials
const AddEditCredentialDialog = dynamic(() => import('flowise-ui/src/views/credentials/AddEditCredentialDialog'), { ssr: false })
const ConfirmDialog = dynamic(() => import('flowise-ui/src/ui-component/dialog/ConfirmDialog'), { ssr: false })

const FIDDLER_CREDENTIAL_NAME = 'fiddlerApi'

// Shared sx for "neutral" outlined action buttons (Edit, Change, Recheck).
// MUI's default outlined Button anchors text + border on `primary.main`,
// which in the AnswerAI dark theme resolves to rgba(255,255,255,0.12) —
// translucent white. The buttons end up reading as if they were disabled
// even when fully enabled. Anchor on `text.primary` + `divider` so they
// have clear contrast in both modes; the actual `disabled` state is left
// to MUI's default treatment so it still reads as inert when applicable.
const outlinedActionSx = {
    color: 'text.primary',
    borderColor: 'divider',
    '&:hover': {
        borderColor: 'text.primary',
        bgcolor: 'action.hover'
    }
}

// Shared sx for the page switches ("Enable Guardrails", "Observability-only").
// The default MUI `color='primary'` resolves to translucent white in the
// AnswerAI dark theme, making the on-state nearly invisible. Anchor the
// checked state on `info.main` (Material Blue, shared across light/dark) so
// the on-state reads unambiguously in both modes.
const pageSwitchSx = {
    '& .MuiSwitch-switchBase.Mui-checked': {
        color: 'info.main',
        '& + .MuiSwitch-track': {
            backgroundColor: 'info.main',
            opacity: 0.5
        }
    },
    '& .MuiSwitch-switchBase.Mui-checked:hover': {
        backgroundColor: 'rgba(33, 150, 243, 0.08)'
    }
}

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
    // Returns a promise so callers can await persistence before triggering
    // server-side reads (e.g. the capability selftest, which reads the org-
    // stored credentialId — racing it against the in-flight PATCH returned
    // stale plan capabilities until the user manually clicked Recheck).
    onSave: (config: GuardrailConfig) => Promise<void> | void
}

interface Credential {
    id: string
    name: string
    credentialName: string
}

interface CapabilityStatus {
    ok: boolean
    degraded: boolean
    reason: string
    httpStatus?: number
    message?: string
    latencyMs?: number
}

interface SelftestReport {
    capabilities?: {
        safety: CapabilityStatus
        pii: CapabilityStatus
        faithfulness: CapabilityStatus
    }
    notes?: string[]
}

export default function MasterConfig({ config, onConfigChange, onSave }: MasterConfigProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedCredential, setSelectedCredential] = useState<string>(config?.credentialId ?? '')
    const [failureMode, setFailureMode] = useState<'open' | 'closed'>(config?.failureMode ?? 'open')
    const [observabilityOnly, setObservabilityOnly] = useState<boolean>(config?.observabilityOnly ?? false)
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(true)

    // Capability matrix from /api/v1/guardrails/selftest. Tells the admin which
    // guardrail endpoints their Fiddler plan tier actually includes so they
    // don't enable e.g. PII and then see "(HTTP 404)" banners on every chat.
    const [capabilities, setCapabilities] = useState<SelftestReport['capabilities'] | null>(null)
    const [loadingCapabilities, setLoadingCapabilities] = useState(false)
    const [capabilityError, setCapabilityError] = useState<string | null>(null)

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

    /**
     * Fetch the per-endpoint capability matrix. Only meaningful when guardrails
     * are enabled and a credential is connected — otherwise the server returns
     * `disabled` / `no_credentials` and the UI hides the section.
     */
    const loadCapabilities = async () => {
        try {
            setLoadingCapabilities(true)
            setCapabilityError(null)
            const response = await guardrailsApi.getSelftest()
            setCapabilities(response?.data?.capabilities || null)
        } catch (error: any) {
            setCapabilityError(error?.response?.data?.message || error?.message || 'Could not run capability check')
            setCapabilities(null)
        } finally {
            setLoadingCapabilities(false)
        }
    }

    // Run the capability probe whenever the connected credential or the
    // enabled flag changes. A new credential could be on a different Fiddler
    // plan tier; a disable/enable transition resets the status.
    useEffect(() => {
        if (!enabled) {
            setCapabilities(null)
            setCapabilityError(null)
            return
        }
        if (!config?.credentialId) {
            setCapabilities(null)
            setCapabilityError(null)
            return
        }
        loadCapabilities()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, config?.credentialId])

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

    const handleCredentialDialogConfirm = async (credentialId: string) => {
        setShowCredentialDialog(false)

        // Refresh credentials list
        loadCredentials()

        // For new credentials, auto-select and auto-enable guardrails.
        // Same async-save discipline as the "Change credential" handler:
        // skip onConfigChange and await onSave so the capability selftest
        // probes the persisted credential, not the still-old org config.
        if (credentialId && credentialDialogProps.type === 'ADD') {
            const previousCredentialId = selectedCredential
            const previousEnabled = enabled
            setSelectedCredential(credentialId)
            setEnabled(true)
            try {
                await Promise.resolve(onSave({ ...config, credentialId, enabled: true }))
            } catch (err) {
                setSelectedCredential(previousCredentialId)
                setEnabled(previousEnabled)
                console.error('Failed to attach new Fiddler credential:', err)
            }
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
                control={<Switch checked={enabled} onChange={handleEnabledChange} sx={pageSwitchSx} />}
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
                                    variant='outlined'
                                    size='small'
                                    onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}
                                    sx={outlinedActionSx}
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
                                sx={outlinedActionSx}
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
                                    variant='outlined'
                                    size='small'
                                    disabled={!enabled}
                                    onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}
                                    sx={outlinedActionSx}
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

                {/* Plan capability matrix.
                    Surfaces which guardrails the connected Fiddler key actually
                    supports so admins don't enable e.g. PII detection on a
                    freemium plan and then see (HTTP 404) banners on every chat. */}
                {enabled && config?.credentialId && (
                    <Box
                        sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                                Plan capabilities
                            </Typography>
                            <Button
                                size='small'
                                variant='outlined'
                                onClick={loadCapabilities}
                                disabled={loadingCapabilities}
                                startIcon={loadingCapabilities ? <CircularProgress size={14} /> : <IconRefresh size={14} />}
                                sx={outlinedActionSx}
                            >
                                Recheck
                            </Button>
                        </Box>
                        {capabilityError ? (
                            <Alert severity='warning' sx={{ py: 0.5 }}>
                                {capabilityError}
                            </Alert>
                        ) : capabilities ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {(['safety', 'pii', 'faithfulness'] as const).map((key) => {
                                    const status = capabilities[key]
                                    const label = key === 'pii' ? 'PII' : key.charAt(0).toUpperCase() + key.slice(1)
                                    let color: 'success' | 'warning' | 'error' | 'default' = 'default'
                                    let Icon = IconCircleDot
                                    let tooltip: string = `Reason: ${status?.reason || 'unknown'}`
                                    if (status?.reason === 'ok') {
                                        color = 'success'
                                        Icon = IconCheck
                                        tooltip = `Available · ${status.latencyMs ?? 0}ms`
                                    } else if (status?.reason === 'unsupported') {
                                        color = 'warning'
                                        Icon = IconMinus
                                        tooltip = 'Not included in your Fiddler plan; runtime will skip silently.'
                                    } else if (status?.degraded) {
                                        color = 'error'
                                        Icon = IconAlertTriangle
                                        tooltip = `${status.reason}${status.httpStatus ? ` · HTTP ${status.httpStatus}` : ''}${
                                            status.message ? ` · ${status.message}` : ''
                                        }`
                                    }
                                    return (
                                        <Tooltip key={key} title={tooltip} arrow>
                                            <Chip
                                                size='small'
                                                color={color === 'default' ? undefined : color}
                                                variant='outlined'
                                                icon={<Icon size={14} />}
                                                label={label}
                                                sx={(theme) => {
                                                    if (color === 'default') return {}
                                                    const palette = theme.palette[color]
                                                    return {
                                                        fontWeight: 500,
                                                        borderColor: palette.main,
                                                        color: palette.main,
                                                        bgcolor: theme.palette.mode === 'dark' ? `${palette.main}1A` : `${palette.main}14`,
                                                        '& .MuiChip-icon': { color: palette.main }
                                                    }
                                                }}
                                            />
                                        </Tooltip>
                                    )
                                })}
                            </Box>
                        ) : loadingCapabilities ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={14} />
                                <Typography variant='caption' color='text.secondary'>
                                    Probing Fiddler endpoints…
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant='caption' color='text.secondary'>
                                Capability check has not run yet.
                            </Typography>
                        )}
                        {capabilities &&
                            (capabilities.pii.reason === 'unsupported' || capabilities.faithfulness.reason === 'unsupported') && (
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                                    Amber endpoints are not included in your Fiddler plan and will be skipped silently at runtime — no
                                    per-message warning banners.
                                </Typography>
                            )}
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
                                    sx={(theme) => {
                                        // Same translucent-primary trap as the preset cards: anchor
                                        // the selected state on `text.primary` border + `action.selected`
                                        // bg so the chosen credential reads clearly in both modes.
                                        const isDark = theme.palette.mode === 'dark'
                                        const isSelected = selectedCredential === cred.id
                                        return {
                                            p: 1.5,
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid' : '1px solid',
                                            borderColor: isSelected
                                                ? isDark
                                                    ? 'rgba(255, 255, 255, 0.45)'
                                                    : 'rgba(15, 23, 42, 0.5)'
                                                : 'divider',
                                            ...(isSelected && { bgcolor: 'action.selected' }),
                                            '&:hover': {
                                                borderColor: isSelected
                                                    ? isDark
                                                        ? 'rgba(255, 255, 255, 0.6)'
                                                        : 'rgba(15, 23, 42, 0.7)'
                                                    : 'text.secondary',
                                                bgcolor: isSelected ? 'action.selected' : 'action.hover'
                                            }
                                        }
                                    }}
                                    onClick={async () => {
                                        setShowCredentialDropdown(false)
                                        // Optimistically reflect the new credential in the local
                                        // "Connected as" header so the UI feels instant.
                                        const previousCredentialId = selectedCredential
                                        const previousEnabled = enabled
                                        setSelectedCredential(cred.id)
                                        setEnabled(true)
                                        // CRITICAL: do NOT call onConfigChange here. That would update
                                        // the parent's config.credentialId synchronously, fire the
                                        // capabilities useEffect immediately, and probe the selftest
                                        // endpoint while the credential PATCH is still in flight —
                                        // returning stale plan-capability data until the user manually
                                        // clicked Recheck. Instead, await the save so the parent's
                                        // post-PATCH setConfig() drives the recheck against the now-
                                        // persisted credentialId.
                                        try {
                                            await Promise.resolve(onSave({ ...config, credentialId: cred.id, enabled: true }))
                                        } catch (err) {
                                            // handleSave already surfaces the error via parent state.
                                            // Roll back optimistic local state so the UI matches reality.
                                            setSelectedCredential(previousCredentialId)
                                            setEnabled(previousEnabled)
                                            console.error('Failed to switch Fiddler credential:', err)
                                        }
                                    }}
                                >
                                    <Typography variant='body2'>{cred.name}</Typography>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Failure behavior — runtime semantics when Fiddler is unavailable
                or when an admin wants pilot-mode visibility before enforcing.
                Wrapped in a single card so the failure-mode + observability
                controls feel like one logical group, matching the credential
                card and capability card above for a consistent visual rhythm. */}
            <Card
                variant='outlined'
                sx={{
                    p: 2.5,
                    mt: 3,
                    borderRadius: 1.5,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    ...(!enabled ? { opacity: 0.6 } : {})
                }}
            >
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                    Failure behavior
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    What the runtime does when Fiddler can&apos;t be reached (bad key, outage, timeout) and how violations are surfaced.
                    Separate from threshold strictness in presets below.
                </Typography>

                {/* Fail-open vs fail-closed switch */}
                <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 1 }}>
                    When Fiddler is unavailable
                </Typography>
                <ToggleButtonGroup
                    value={failureMode}
                    exclusive
                    onChange={handleFailureModeChange}
                    disabled={!enabled}
                    aria-label='Failure mode'
                    size='small'
                    sx={(theme) => {
                        // The AnswerAI theme defines `primary.{main,light,dark}` as
                        // translucent whites/slates rather than a vivid color, so anchoring
                        // the selected state on `primary.*` produced ghosted text in dark
                        // mode. We use MUI's mode-balanced `action.selected` token + a
                        // visible border + `text.primary` for guaranteed contrast in both
                        // modes — same pattern used for menu/table selection across the app.
                        const isDark = theme.palette.mode === 'dark'
                        return {
                            '& .MuiToggleButton-root': {
                                color: 'text.primary',
                                borderColor: 'divider',
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 1.5,
                                transition: 'background-color 120ms ease, border-color 120ms ease'
                            },
                            '& .MuiToggleButton-root:hover': {
                                bgcolor: 'action.hover'
                            },
                            '& .MuiToggleButton-root.Mui-selected': {
                                bgcolor: 'action.selected',
                                color: 'text.primary',
                                fontWeight: 600,
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.5)',
                                '&:hover': {
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.12)'
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value='open' aria-label='Fail open'>
                        <IconAlertTriangle size={14} style={{ marginRight: 6 }} />
                        Fail open (allow, warn)
                    </ToggleButton>
                    <ToggleButton value='closed' aria-label='Fail closed'>
                        <IconLock size={14} style={{ marginRight: 6 }} />
                        Fail closed (block, 503)
                    </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    {failureMode === 'closed'
                        ? 'Block the request with HTTP 503 when checks can\u2019t be run. Higher safety, lower availability.'
                        : 'Deliver the message with a warning banner when checks can\u2019t be run. Higher availability, lower safety.'}
                </Typography>

                {/* Shadow pilot toggle. Violations are recorded but never block. */}
                <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={observabilityOnly}
                                onChange={handleObservabilityOnlyChange}
                                disabled={!enabled}
                                sx={pageSwitchSx}
                            />
                        }
                        label={
                            <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                Observability-only (shadow mode)
                            </Typography>
                        }
                    />
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 5.5, mt: -0.5 }}>
                        Real violations are recorded in message metadata but never block the request. Use before flipping enforcement on in
                        production.
                    </Typography>
                </Box>
            </Card>

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
