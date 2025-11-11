'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import CircularProgress from '@mui/material/CircularProgress'
import { GUARDRAILS_PRESETS, getPresetConfig } from 'flowise-ui/src/views/organizations/guardrails/presets'
import credentialsApi from 'flowise-ui/src/api/credentials'

const AddEditCredentialDialog = dynamic(() => import('flowise-ui/src/views/credentials/AddEditCredentialDialog'), { ssr: false })

interface SimpleModeProps {
    config: any
    onSave: (config: any) => Promise<void>
    saving: boolean
    error: string | null
    success: boolean
    onClearError: () => void
}

interface Credential {
    id: string
    name: string
    credentialName: string
}

export default function SimpleMode({ config, onSave, saving, error, success, onClearError }: SimpleModeProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedCredential, setSelectedCredential] = useState<string>(config?.credentialId ?? '')
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(true)
    const [selectedPreset, setSelectedPreset] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)

    // Credential modal state
    const [showCredentialDialog, setShowCredentialDialog] = useState(false)
    const [credentialDialogProps, setCredentialDialogProps] = useState<any>({})
    const [showCredentialDropdown, setShowCredentialDropdown] = useState(false)

    // Load Fiddler credentials on mount
    useEffect(() => {
        loadCredentials()
    }, [])

    // Sync state with config prop changes
    useEffect(() => {
        setEnabled(config?.enabled ?? false)
        setSelectedCredential(config?.credentialId ?? '')
    }, [config])

    // Detect which preset matches current config
    useEffect(() => {
        if (!config || !config.enabled) {
            setSelectedPreset('')
            return
        }

        // Try to match config to a preset
        for (const preset of GUARDRAILS_PRESETS) {
            const presetConfig = preset.config
            if (
                config.safety?.threshold === presetConfig.safety?.threshold &&
                config.pii?.confidenceThreshold === presetConfig.pii?.confidenceThreshold &&
                config.pii?.action === presetConfig.pii?.action
            ) {
                setSelectedPreset(preset.id)
                return
            }
        }

        // No match - custom config
        setSelectedPreset('custom')
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
        setEnabled(event.target.checked)
        setHasChanges(true)
    }

    const handleCredentialChange = (event: any) => {
        setSelectedCredential(event.target.value)
        setHasChanges(true)
    }

    const handlePresetChange = (presetId: string) => {
        setSelectedPreset(presetId)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!enabled) {
            // Save disabled state
            await onSave({ enabled: false })
            setHasChanges(false)
            return
        }

        if (!selectedCredential) {
            alert('Please select a Fiddler API credential')
            return
        }

        const presetConfig = getPresetConfig(selectedPreset)
        if (presetConfig) {
            await onSave({
                ...presetConfig,
                enabled: true,
                credentialId: selectedCredential
            })
            setHasChanges(false)
        }
    }

    const handleCreateCredential = async () => {
        try {
            // Load the Fiddler credential component schema
            const response = await credentialsApi.getSpecificComponentCredential('fiddlerApi')
            const componentCredential = response.data

            if (!componentCredential || !componentCredential.name) {
                throw new Error('Failed to load Fiddler credential component')
            }

            // Configure modal for ADD mode
            const dialogProps = {
                type: 'ADD',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Add',
                credentialComponent: componentCredential
            }

            setCredentialDialogProps(dialogProps)
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('Error loading credential component:', error)
            alert('Failed to load credential creation form. Please try again.')
        }
    }

    const handleCredentialDialogConfirm = (newCredentialId: string) => {
        setShowCredentialDialog(false)

        // Auto-select the newly created credential
        if (newCredentialId) {
            setSelectedCredential(newCredentialId)
            setHasChanges(true)

            // Refresh the credentials list
            loadCredentials()
        }
    }

    const handleCredentialDialogCancel = () => {
        setShowCredentialDialog(false)
    }

    const handleEditCredential = async () => {
        if (!selectedCredential) return

        try {
            // Configure modal for EDIT mode
            const dialogProps = {
                type: 'EDIT',
                cancelButtonName: 'Cancel',
                confirmButtonName: 'Save',
                credentialId: selectedCredential
            }

            setCredentialDialogProps(dialogProps)
            setShowCredentialDialog(true)
        } catch (error) {
            console.error('Error opening credential editor:', error)
            alert('Failed to open credential editor. Please try again.')
        }
    }

    // Get the currently selected credential object
    const selectedCredentialObj = credentials.find((cred) => cred.id === selectedCredential)

    return (
        <Box>
            {/* Master Switch & Credential Section */}
            <Card variant='outlined' sx={{ mb: 3, p: 2 }}>
                <Typography variant='h6' gutterBottom>
                    Master Configuration
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                    Guardrails protect your chatflows from unsafe content, PII leaks, and hallucinations
                </Typography>

                {/* Enable/Disable Toggle */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={<Switch checked={enabled} onChange={handleEnabledChange} color='primary' />}
                        label='Enable Guardrails'
                    />
                </FormControl>

                {/* Credential Connection Status */}
                {enabled && (
                    <Box>
                        {loadingCredentials ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                <Typography variant='body2' color='text.secondary'>
                                    Loading credentials...
                                </Typography>
                            </Box>
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
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'action.hover'
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
                                        {selectedCredentialObj.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant='outlined' size='small' onClick={handleEditCredential}>
                                        Edit
                                    </Button>
                                    {credentials.length > 1 && (
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
                        ) : (
                            // Not Connected - Show connect button
                            <Box>
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
                                <Alert severity='warning' sx={{ mt: 2 }}>
                                    Please connect a Fiddler API credential to enable guardrails
                                </Alert>
                            </Box>
                        )}

                        {/* Dropdown for selecting existing credentials (collapsed by default) */}
                        {showCredentialDropdown && credentials.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <FormControl fullWidth size='small'>
                                    <InputLabel id='credential-select-label'>Select Existing Credential</InputLabel>
                                    <Select
                                        labelId='credential-select-label'
                                        value={selectedCredential}
                                        onChange={handleCredentialChange}
                                        label='Select Existing Credential'
                                    >
                                        {credentials.map((cred) => (
                                            <MenuItem key={cred.id} value={cred.id}>
                                                {cred.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </Box>
                )}
            </Card>

            {/* Preset Selection (only shown when enabled) */}
            {enabled && (
                <>
                    <Typography variant='h6' gutterBottom>
                        Choose a Preset Configuration
                    </Typography>
                    <Typography variant='body2' color='text.secondary' paragraph>
                        Select a preset that matches your use case. You can customize settings further in Advanced mode.
                    </Typography>
                </>
            )}

            <FormControl component='fieldset' sx={{ width: '100%', mt: 2 }} disabled={!enabled}>
                <RadioGroup value={selectedPreset} onChange={(e) => handlePresetChange(e.target.value)}>
                    <Grid container spacing={2}>
                        {GUARDRAILS_PRESETS.map((preset) => (
                            <Grid item xs={12} key={preset.id}>
                                <Card
                                    variant='outlined'
                                    sx={{
                                        cursor: 'pointer',
                                        borderColor: selectedPreset === preset.id ? 'primary.main' : 'divider',
                                        borderWidth: selectedPreset === preset.id ? 2 : 1,
                                        '&:hover': {
                                            borderColor: 'primary.light'
                                        }
                                    }}
                                    onClick={() => handlePresetChange(preset.id)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <FormControlLabel
                                                value={preset.id}
                                                control={<Radio />}
                                                label={
                                                    <Box>
                                                        <Typography variant='h6'>{preset.name}</Typography>
                                                        <Typography variant='body2' color='text.secondary'>
                                                            {preset.description}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ flex: 1 }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                        {selectedPreset === 'custom' && (
                            <Grid item xs={12}>
                                <Alert severity='info'>
                                    Your current configuration doesn&apos;t match any preset. Switch to Advanced mode to customize settings.
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </RadioGroup>
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                    disabled={saving || !hasChanges || (enabled && (!selectedPreset || !selectedCredential))}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                {hasChanges && (
                    <Button
                        variant='outlined'
                        onClick={() => {
                            setHasChanges(false)
                            setEnabled(config?.enabled ?? false)
                            setSelectedCredential(config?.credentialId ?? '')
                        }}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                )}
            </Box>

            {/* Toast Notifications */}
            {error && (
                <Alert severity='error' sx={{ mt: 2 }} onClose={onClearError}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity='success' sx={{ mt: 2 }}>
                    Configuration saved successfully
                </Alert>
            )}

            {/* Credential Creation Modal */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={handleCredentialDialogCancel}
                onConfirm={handleCredentialDialogConfirm}
            />
        </Box>
    )
}
