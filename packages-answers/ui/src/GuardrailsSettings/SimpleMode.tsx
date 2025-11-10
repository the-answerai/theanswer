'use client'
import { useState, useEffect } from 'react'
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
import { GUARDRAILS_PRESETS, getPresetConfig } from 'flowise-ui/src/views/organizations/guardrails/presets'

interface SimpleModeProps {
    config: any
    onSave: (config: any) => Promise<void>
    saving: boolean
}

export default function SimpleMode({ config, onSave, saving }: SimpleModeProps) {
    const [selectedPreset, setSelectedPreset] = useState<string>('')
    const [hasChanges, setHasChanges] = useState(false)

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
            await onSave(presetConfig)
            setHasChanges(false)
        }
    }

    return (
        <Box>
            <Typography variant='h6' gutterBottom>
                Choose a Preset Configuration
            </Typography>
            <Typography variant='body2' color='text.secondary' paragraph>
                Select a preset that matches your use case. You can customize settings further in Advanced mode.
            </Typography>

            <FormControl component='fieldset' sx={{ width: '100%', mt: 2 }}>
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
                <Button variant='contained' color='primary' onClick={handleSave} disabled={saving || !hasChanges || !selectedPreset}>
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
                {hasChanges && (
                    <Button variant='outlined' onClick={() => setHasChanges(false)} disabled={saving}>
                        Cancel
                    </Button>
                )}
            </Box>

            {!config?.enabled && (
                <Alert severity='warning' sx={{ mt: 2 }}>
                    Guardrails are currently disabled. Select a preset to enable them.
                </Alert>
            )}
        </Box>
    )
}
