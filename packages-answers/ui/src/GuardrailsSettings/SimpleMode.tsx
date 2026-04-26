'use client'
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import { GUARDRAILS_PRESETS, getPresetConfig } from 'flowise-ui/src/views/organizations/guardrails/presets'

interface SimpleModeProps {
    config: any
    onSave: (config: any) => Promise<void>
    saving: boolean
    error: string | null
    success: boolean
    onClearError: () => void
}

export default function SimpleMode({ config, onSave, saving, error, success, onClearError }: SimpleModeProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedPreset, setSelectedPreset] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)

    // Sync state with config prop changes
    useEffect(() => {
        setEnabled(config?.enabled ?? false)
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

    const handlePresetChange = (presetId: string) => {
        setSelectedPreset(presetId)
        setHasChanges(true)
    }

    const handleSave = async () => {
        const presetConfig = getPresetConfig(selectedPreset)
        if (presetConfig) {
            // Merge preset onto current config so failureMode, observabilityOnly, and chatflow-only fields are not dropped
            await onSave({
                ...config,
                ...presetConfig,
                enabled: config?.enabled ?? true,
                credentialId: config?.credentialId
            })
            setHasChanges(false)
        }
    }

    return (
        <Box sx={{ ...(!enabled ? { opacity: 0.5 } : {}) }}>
            {/* Preset Selection (only shown when enabled).
                Uses subtitle2 to match the visual rhythm of the master-config
                section headings ("Plan capabilities", "Failure behavior") above. */}
            <>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 0.5 }}>
                    Choose a preset configuration
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                    Select a preset that matches your use case. You can customize settings further in Advanced mode.
                </Typography>
            </>

            <FormControl component='fieldset' sx={{ width: '100%', mt: 2 }} disabled={!enabled}>
                <RadioGroup value={selectedPreset} onChange={(e) => handlePresetChange(e.target.value)}>
                    <Grid container spacing={2}>
                        {GUARDRAILS_PRESETS.map((preset) => {
                            const isSelected = selectedPreset === preset.id
                            return (
                                <Grid item xs={12} key={preset.id}>
                                    <Card
                                        variant='outlined'
                                        sx={(theme) => {
                                            // The AnswerAI theme defines `primary.main` as a translucent
                                            // white/slate, so opacity-suffix bg tints on `primary.main`
                                            // produce malformed CSS (rgba(...)1A is invalid). Anchor the
                                            // selected state on `action.selected` (mode-balanced) +
                                            // `text.primary` border for guaranteed visibility in both modes.
                                            const isDark = theme.palette.mode === 'dark'
                                            return {
                                                cursor: 'pointer',
                                                transition: 'background-color 120ms ease, border-color 120ms ease',
                                                borderColor: isSelected
                                                    ? isDark
                                                        ? 'rgba(255, 255, 255, 0.45)'
                                                        : 'rgba(15, 23, 42, 0.5)'
                                                    : 'divider',
                                                borderWidth: isSelected ? 2 : 1,
                                                ...(isSelected && {
                                                    bgcolor: 'action.selected'
                                                }),
                                                '&:hover': {
                                                    borderColor: isSelected
                                                        ? isDark
                                                            ? 'rgba(255, 255, 255, 0.6)'
                                                            : 'rgba(15, 23, 42, 0.7)'
                                                        : 'text.secondary',
                                                    bgcolor: isSelected
                                                        ? isDark
                                                            ? 'rgba(255, 255, 255, 0.22)'
                                                            : 'rgba(15, 23, 42, 0.12)'
                                                        : 'action.hover'
                                                }
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
                                                            <Typography
                                                                variant='subtitle1'
                                                                sx={{
                                                                    fontWeight: isSelected ? 700 : 600,
                                                                    color: 'text.primary'
                                                                }}
                                                            >
                                                                {preset.name}
                                                            </Typography>
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
                            )
                        })}

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
                {/* Save uses a local sx override to force a solid disabled background.
                    The global theme applies a gradient `background` to all contained
                    buttons; MUI's default disabled state only resets `backgroundColor`,
                    which leaves the gradient bleeding through at low contrast in both
                    modes. We zero out `background` + `boxShadow` on disabled here so
                    the button reads unmistakably as disabled when no preset is chosen. */}
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                    disabled={saving || !hasChanges || !selectedPreset}
                    sx={(theme) => ({
                        minWidth: 180,
                        fontWeight: 600,
                        '&.Mui-disabled': {
                            background: 'none',
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            color: theme.palette.text.disabled,
                            boxShadow: 'none'
                        }
                    })}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                {hasChanges && (
                    <Button
                        variant='outlined'
                        onClick={() => {
                            setHasChanges(false)
                            setEnabled(config?.enabled ?? false)
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
        </Box>
    )
}
