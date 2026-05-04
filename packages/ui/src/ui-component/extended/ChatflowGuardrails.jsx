import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'

// material-ui
import { Box, Button, Typography, Card, Alert, Switch, FormControlLabel, Tabs, Tab, CircularProgress } from '@mui/material'
import { IconX } from '@tabler/icons-react'

// Project imports
import SimpleMode from '../../../../../packages-answers/ui/src/GuardrailsSettings/SimpleMode'
import AdvancedMode from '../../../../../packages-answers/ui/src/GuardrailsSettings/AdvancedMode'
import useNotifier from '@/utils/useNotifier'

// API
import chatflowsApi from '@/api/chatflows'
import guardrailsApi from '@/api/guardrails'

const ChatflowGuardrails = ({ dialogProps }) => {
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // State
    const [chatbotConfig, setChatbotConfig] = useState({})
    const [guardrailsConfig, setGuardrailsConfig] = useState(null)
    const [organizationConfig, setOrganizationConfig] = useState(null)
    const [loadingOrgConfig, setLoadingOrgConfig] = useState(true)
    const [overrideEnabled, setOverrideEnabled] = useState(false)
    const [selectedTab, setSelectedTab] = useState(0) // 0 = Simple, 1 = Advanced
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    // Load organization config
    useEffect(() => {
        const loadOrgConfig = async () => {
            if (!dialogProps.chatflow?.organizationId) {
                setLoadingOrgConfig(false)
                return
            }

            try {
                setLoadingOrgConfig(true)
                const response = await guardrailsApi.getGuardrailsConfig(dialogProps.chatflow.organizationId)
                setOrganizationConfig(response.data || null)
            } catch (err) {
                console.error('Failed to load organization guardrails config:', err)
            } finally {
                setLoadingOrgConfig(false)
            }
        }

        loadOrgConfig()
    }, [dialogProps.chatflow?.organizationId])

    // Load chatflow config
    useEffect(() => {
        if (dialogProps.chatflow && dialogProps.chatflow.chatbotConfig) {
            try {
                const parsedConfig = JSON.parse(dialogProps.chatflow.chatbotConfig)
                setChatbotConfig(parsedConfig || {})

                const chatflowGuardrails = parsedConfig.guardrails || null
                setGuardrailsConfig(chatflowGuardrails)
                setOverrideEnabled(!!chatflowGuardrails && Object.keys(chatflowGuardrails).length > 0)
            } catch (e) {
                setChatbotConfig({})
                setGuardrailsConfig(null)
                setOverrideEnabled(false)
            }
        }

        return () => {}
    }, [dialogProps])

    const handleSave = async (newConfig) => {
        try {
            setSaving(true)
            setError(null)
            setSuccess(false)

            const mergedGuardrails = newConfig == null ? undefined : { ...(guardrailsConfig || organizationConfig || {}), ...newConfig }

            // Update chatbotConfig with guardrails
            const updatedChatbotConfig = {
                ...chatbotConfig,
                guardrails: overrideEnabled ? mergedGuardrails : undefined
            }

            if (!dialogProps.chatflow.id && dialogProps.handleSaveFlow) {
                return dialogProps.handleSaveFlow(dialogProps.chatflow.name, {
                    chatbotConfig: JSON.stringify({
                        ...chatbotConfig,
                        guardrails: overrideEnabled ? mergedGuardrails : undefined
                    })
                })
            }

            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                chatbotConfig: JSON.stringify(updatedChatbotConfig)
            })

            if (saveResp.data) {
                let parsed = {}
                try {
                    parsed = saveResp.data.chatbotConfig ? JSON.parse(saveResp.data.chatbotConfig) : {}
                } catch (e) {
                    parsed = {}
                }
                setChatbotConfig(parsed)
                if (overrideEnabled) {
                    setGuardrailsConfig(parsed.guardrails != null ? parsed.guardrails : mergedGuardrails)
                } else {
                    setGuardrailsConfig(null)
                }
                setSuccess(true)
                enqueueSnackbar({
                    message: 'Guardrails Configuration Saved',
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
                dispatch({ type: SET_CHATFLOW, chatflow: saveResp.data })

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(false), 3000)
            }
        } catch (err) {
            const errorMessage =
                typeof err.response?.data === 'object' ? err.response.data.message : err.response?.data || err.message || 'Unknown error'

            setError(`Failed to save guardrails configuration: ${errorMessage}`)

            enqueueSnackbar({
                message: `Failed to save guardrails configuration: ${errorMessage}`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } finally {
            setSaving(false)
        }
    }

    const handleOverrideToggle = async (event) => {
        const newOverrideEnabled = event.target.checked
        setOverrideEnabled(newOverrideEnabled)

        if (!newOverrideEnabled) {
            // Clear overrides - save immediately
            await handleSave(null)
        } else {
            // Initialize with organization config or defaults
            const initialConfig = organizationConfig || {
                enabled: true,
                safety: {
                    enabled: true,
                    threshold: 0.1,
                    action: 'block'
                },
                pii: {
                    enabled: true,
                    confidenceThreshold: 0.8,
                    action: 'redact'
                },
                faithfulness: {
                    enabled: true,
                    threshold: 0.005,
                    action: 'warn'
                }
            }
            setGuardrailsConfig(initialConfig)
        }
    }

    const getEffectiveConfig = () => {
        if (overrideEnabled && guardrailsConfig) {
            return guardrailsConfig
        }
        return organizationConfig || {}
    }

    if (loadingOrgConfig) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Loading organization settings...</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 0 }}>
            <Typography variant='h3' sx={{ mb: 2 }}>
                Guardrails Configuration
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Configure content safety, PII detection, and hallucination prevention for this chatflow. By default, this chatflow inherits
                organization-level settings.
            </Typography>

            {/* Inheritance Status */}
            {!overrideEnabled && organizationConfig && (
                <Alert severity='info' sx={{ mb: 3 }}>
                    <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                        ✓ Using Organization Guardrails Settings
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {organizationConfig.enabled ? (
                            <>
                                Safety:{' '}
                                {organizationConfig.safety?.enabled
                                    ? `Enabled (threshold: ${organizationConfig.safety?.threshold || 0.1})`
                                    : 'Disabled'}
                                {' | '}
                                PII:{' '}
                                {organizationConfig.pii?.enabled
                                    ? `Enabled (${organizationConfig.pii?.action || 'redact'}, confidence: ${
                                          organizationConfig.pii?.confidenceThreshold || 0.8
                                      })`
                                    : 'Disabled'}
                                {' | '}
                                Faithfulness:{' '}
                                {organizationConfig.faithfulness?.enabled
                                    ? `Enabled (threshold: ${organizationConfig.faithfulness?.threshold || 0.005})`
                                    : 'Disabled'}
                            </>
                        ) : (
                            'Guardrails are disabled at the organization level'
                        )}
                    </Typography>
                </Alert>
            )}

            {!overrideEnabled && !organizationConfig && (
                <Alert severity='warning' sx={{ mb: 3 }}>
                    No organization-level guardrails configuration found. Enable override to configure guardrails for this chatflow.
                </Alert>
            )}

            {/* Override Toggle */}
            <Card variant='outlined' sx={{ mb: 3, p: 2 }}>
                <FormControlLabel
                    control={<Switch checked={overrideEnabled} onChange={handleOverrideToggle} color='primary' />}
                    label={
                        <Box>
                            <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                Override Organization Settings
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {overrideEnabled
                                    ? 'This chatflow uses custom guardrails configuration'
                                    : 'Enable to customize guardrails for this chatflow only'}
                            </Typography>
                        </Box>
                    }
                />
            </Card>

            {/* Configuration UI (only shown when override is enabled) */}
            {overrideEnabled && (
                <Box>
                    {/* Per-chatflow failure-mode override. Leaving this untouched means the
                        chatflow inherits the organization-level failureMode. */}
                    <Card variant='outlined' sx={{ mb: 2, p: 2 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                            Failure Mode (override)
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                            Organization default: <strong>{organizationConfig?.failureMode || 'open'}</strong>. Override below to change how
                            THIS chatflow reacts when guardrails cannot be evaluated.
                        </Typography>
                        <ToggleButtonGroup
                            color='primary'
                            value={guardrailsConfig?.failureMode ?? organizationConfig?.failureMode ?? 'open'}
                            exclusive
                            onChange={(_, value) => {
                                if (!value) return
                                const next = { ...(guardrailsConfig || {}), failureMode: value }
                                setGuardrailsConfig(next)
                                handleSave(next)
                            }}
                            aria-label='Chatflow failure mode'
                        >
                            <ToggleButton value='open'>Fail Open</ToggleButton>
                            <ToggleButton value='closed'>Fail Closed</ToggleButton>
                        </ToggleButtonGroup>
                    </Card>

                    <Card variant='outlined' sx={{ mb: 2, p: 2 }}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                            Observability-only / shadow (override)
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                            Organization default: <strong>{organizationConfig?.observabilityOnly ? 'On' : 'Off'}</strong>. When on,
                            violations are recorded but never block. Use the switch to pin a value for this chatflow, or keep it aligned
                            with the org (inherit).
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    color='primary'
                                    checked={
                                        guardrailsConfig?.observabilityOnly !== undefined
                                            ? guardrailsConfig.observabilityOnly
                                            : organizationConfig?.observabilityOnly ?? false
                                    }
                                    onChange={(e) => {
                                        const next = { ...(guardrailsConfig || {}), observabilityOnly: e.target.checked }
                                        setGuardrailsConfig(next)
                                        handleSave(next)
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                        {guardrailsConfig?.observabilityOnly !== undefined
                                            ? 'Custom value for this chatflow'
                                            : 'Following organization default (toggle to override)'}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Card>

                    {/* Mode Tabs */}
                    <Tabs
                        value={selectedTab}
                        onChange={(e, newValue) => setSelectedTab(newValue)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label='Simple' />
                        <Tab label='Advanced' />
                    </Tabs>

                    {/* Tab Content */}
                    {selectedTab === 0 && (
                        <SimpleMode
                            config={getEffectiveConfig()}
                            onSave={handleSave}
                            saving={saving}
                            error={error}
                            success={success}
                            onClearError={() => setError(null)}
                        />
                    )}

                    {selectedTab === 1 && (
                        <AdvancedMode
                            config={getEffectiveConfig()}
                            onSave={handleSave}
                            saving={saving}
                            error={error}
                            success={success}
                            onClearError={() => setError(null)}
                        />
                    )}

                    {/* Inheritance Note */}
                    {organizationConfig && (
                        <Alert severity='info' sx={{ mt: 2 }}>
                            <Typography variant='body2'>
                                <strong>Note:</strong> Settings shown above are your chatflow overrides. Any field you don&apos;t customize
                                will inherit from the organization-level configuration.
                            </Typography>
                        </Alert>
                    )}
                </Box>
            )}
        </Box>
    )
}

ChatflowGuardrails.propTypes = {
    dialogProps: PropTypes.object
}

export default ChatflowGuardrails
