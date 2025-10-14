'use client'

import { useEffect, useState } from 'react'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import {
    IconChevronDown,
    IconSparkles,
    IconCamera,
    IconPalette,
    IconMoodHeart,
    IconWorld,
    IconInfoCircle,
    IconMicrophone
} from '@tabler/icons-react'

export interface EnhancedPromptData {
    title?: string
    logline?: string
    genre?: string[]
    mood?: string[]
    environment?: {
        setting?: string
        time_of_day?: string
        weather?: string
        set_decoration?: string[]
    }
    lighting?: {
        key?: string
        special?: string
    }
    look_profile?: {
        lut_style?: string
        contrast?: string
        saturation?: string
        grain?: string
    }
    camera?: {
        rig?: string
        lens?: {
            focal_length_mm?: number
            aperture_f?: number
        }
    }
    composition?: {
        framing?: string
    }
    camera_motion?: {
        move_type?: string
    }
    subjects?: Array<{
        type?: string
        count?: number
        wardrobe?: string
        action?: string
    }>
    fx?: {
        vfx?: string[]
        sfx?: string[]
    }
    audio?: {
        dialog?: {
            text?: string
            tone?: string
            emotion?: string
        }
    }
    negative_prompts?: string[]
}

interface PromptEnhancerWizardProps {
    open: boolean
    onClose: () => void
    initialPrompt: string
    initialData?: EnhancedPromptData | null
    onApply: (enhancedPrompt: string, jsonData: EnhancedPromptData) => void
    isGenerating?: boolean
    isEnhancing?: boolean
    onEnhance?: (prompt: string, dialog?: { text: string; tone: string; emotion: string }) => Promise<EnhancedPromptData | null>
}

const genreOptions = ['action', 'drama', 'comedy', 'horror', 'sci-fi', 'fantasy', 'documentary', 'war', 'historical', 'thriller', 'romance']
const moodOptions = [
    'intense',
    'calm',
    'mysterious',
    'uplifting',
    'dark',
    'playful',
    'dramatic',
    'serene',
    'chaotic',
    'nostalgic',
    'gritty',
    'whimsical'
]
const timeOfDayOptions = ['dawn', 'morning', 'midday', 'afternoon', 'golden hour', 'dusk', 'night', 'midnight']
const weatherOptions = ['clear', 'partly cloudy', 'overcast', 'foggy', 'rainy', 'stormy', 'snowy', 'misty']
const framingOptions = [
    'extreme wide shot',
    'wide shot',
    'medium shot',
    'close-up',
    'extreme close-up',
    'over-the-shoulder',
    'point of view'
]
const cameraRigOptions = ['handheld', 'tripod', 'dolly', 'steadicam', 'crane', 'drone', 'gimbal']
const movementOptions = [
    'static shot',
    'slow pan left to right',
    'slow pan right to left',
    'tilt up',
    'tilt down',
    'dolly in (push in)',
    'dolly out (pull out)',
    'tracking shot following subject',
    'circular orbit around subject',
    'crane up revealing scene',
    'smooth forward tracking',
    'aerial descending',
    'sweeping panoramic'
]

const PromptEnhancerWizard = ({
    open,
    onClose,
    initialPrompt,
    initialData,
    onApply,
    isGenerating,
    isEnhancing,
    onEnhance
}: PromptEnhancerWizardProps) => {
    const [enhancedData, setEnhancedData] = useState<EnhancedPromptData>({
        title: '',
        logline: initialPrompt,
        genre: [],
        mood: [],
        environment: {
            setting: '',
            time_of_day: 'midday',
            weather: 'clear',
            set_decoration: []
        },
        lighting: {
            key: '',
            special: ''
        },
        look_profile: {
            lut_style: 'natural',
            contrast: 'medium',
            saturation: 'medium',
            grain: 'none'
        },
        camera: {
            rig: 'steadicam',
            lens: {
                focal_length_mm: 35,
                aperture_f: 2.8
            }
        },
        composition: {
            framing: 'wide shot'
        },
        camera_motion: {
            move_type: 'static shot'
        },
        subjects: [],
        fx: {
            vfx: [],
            sfx: []
        },
        audio: {
            dialog: {
                text: '',
                tone: 'neutral',
                emotion: 'calm'
            }
        },
        negative_prompts: []
    })

    const [expanded, setExpanded] = useState<string | false>('environment')

    // Update data when initialData changes
    useEffect(() => {
        if (initialData) {
            setEnhancedData((prev) => ({
                ...prev,
                ...initialData,
                logline: initialData.logline || initialPrompt
            }))
        }
    }, [initialData, initialPrompt])

    const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false)
    }

    const updateField = (path: string, value: any) => {
        const blockedKeys = ['__proto__', 'prototype', 'constructor']
        setEnhancedData((prev) => {
            const newData = { ...prev }
            const keys = path.split('.')
            // Prevent prototype pollution: block dangerous keys
            if (keys.some(k => blockedKeys.includes(k))) {
                console.warn('Blocked prototype-polluting path:', path)
                return newData
            }
            let current: any = newData
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value
            return newData
        })
    }

    const convertToEnhancedPrompt = (): string => {
        const parts: string[] = []

        // Start with logline or title
        if (enhancedData.logline) {
            parts.push(enhancedData.logline)
        } else if (enhancedData.title) {
            parts.push(enhancedData.title)
        }

        // Environment
        if (enhancedData.environment?.setting) {
            parts.push(`Set in ${enhancedData.environment.setting}`)
        }
        if (enhancedData.environment?.time_of_day) {
            parts.push(`during ${enhancedData.environment.time_of_day}`)
        }
        if (enhancedData.environment?.weather) {
            parts.push(`with ${enhancedData.environment.weather} weather`)
        }

        // Mood and Genre
        if (enhancedData.mood && enhancedData.mood.length > 0) {
            parts.push(`The mood is ${enhancedData.mood.join(', ')}`)
        }

        // Camera
        if (enhancedData.composition?.framing) {
            parts.push(`Shot as a ${enhancedData.composition.framing}`)
        }
        if (enhancedData.camera_motion?.move_type && enhancedData.camera_motion.move_type !== 'static shot') {
            parts.push(`with ${enhancedData.camera_motion.move_type}`)
        }
        if (enhancedData.camera?.rig) {
            parts.push(`using ${enhancedData.camera.rig}`)
        }
        if (enhancedData.camera?.lens?.focal_length_mm) {
            parts.push(`${enhancedData.camera.lens.focal_length_mm}mm lens`)
        }

        // Look and style
        if (enhancedData.look_profile?.lut_style) {
            parts.push(`Styled with ${enhancedData.look_profile.lut_style} color grading`)
        }
        if (enhancedData.look_profile?.contrast) {
            parts.push(`${enhancedData.look_profile.contrast} contrast`)
        }

        // Lighting
        if (enhancedData.lighting?.key) {
            parts.push(`Lit with ${enhancedData.lighting.key}`)
        }
        if (enhancedData.lighting?.special) {
            parts.push(enhancedData.lighting.special)
        }

        // VFX
        if (enhancedData.fx?.vfx && enhancedData.fx.vfx.length > 0) {
            parts.push(`Visual effects include: ${enhancedData.fx.vfx.join(', ')}`)
        }

        // Dialog/Audio
        if (enhancedData.audio?.dialog?.text) {
            const dialogParts = [`Dialog: "${enhancedData.audio.dialog.text}"`]
            if (enhancedData.audio.dialog.tone && enhancedData.audio.dialog.tone !== 'neutral') {
                dialogParts.push(`spoken in ${enhancedData.audio.dialog.tone} tone`)
            }
            if (enhancedData.audio.dialog.emotion && enhancedData.audio.dialog.emotion !== 'calm') {
                dialogParts.push(`with ${enhancedData.audio.dialog.emotion} emotion`)
            }
            parts.push(dialogParts.join(' '))
        }

        // Negative prompts
        if (enhancedData.negative_prompts && enhancedData.negative_prompts.length > 0) {
            parts.push(`Avoid: ${enhancedData.negative_prompts.join(', ')}`)
        }

        return parts.join('. ')
    }

    const handleApply = () => {
        const enhancedPrompt = convertToEnhancedPrompt()
        onApply(enhancedPrompt, enhancedData)
        onClose()
    }

    const handleEnhanceInModal = async () => {
        if (!onEnhance) return

        const dialog = enhancedData.audio?.dialog?.text
            ? {
                  text: enhancedData.audio.dialog.text,
                  tone: enhancedData.audio.dialog.tone || 'neutral',
                  emotion: enhancedData.audio.dialog.emotion || 'calm'
              }
            : undefined

        const result = await onEnhance(enhancedData.logline || '', dialog)
        if (result) {
            setEnhancedData((prev) => ({
                ...prev,
                ...result,
                logline: result.logline || prev.logline
            }))
        }
    }

    const InfoTooltip = ({ text }: { text: string }) => (
        <Tooltip title={text}>
            <IconInfoCircle size={16} style={{ opacity: 0.6, cursor: 'help' }} />
        </Tooltip>
    )

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
            <DialogTitle>
                <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                    <Box>
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <IconSparkles size={24} />
                            <Typography variant='h6'>Enhance Your Prompt</Typography>
                        </Stack>
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Fine-tune your video generation with professional cinematography controls
                        </Typography>
                    </Box>
                    {onEnhance && (
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={isEnhancing ? <CircularProgress size={14} color='inherit' /> : <IconSparkles size={14} />}
                            onClick={handleEnhanceInModal}
                            disabled={isEnhancing || !enhancedData.logline}
                            sx={{ textTransform: 'none', flexShrink: 0 }}
                        >
                            {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                        </Button>
                    )}
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2}>
                    {/* Core Description */}
                    <TextField
                        label='Scene Description'
                        value={enhancedData.logline || ''}
                        onChange={(e) => updateField('logline', e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        helperText='The main description of your scene'
                    />

                    <TextField
                        label='Title (optional)'
                        value={enhancedData.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        fullWidth
                        size='small'
                    />

                    <Divider sx={{ my: 1 }} />

                    {/* Environment */}
                    <Accordion expanded={expanded === 'environment'} onChange={handleAccordionChange('environment')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconWorld size={20} />
                                <Typography>Environment & Setting</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    label='Setting / Location'
                                    value={enhancedData.environment?.setting || ''}
                                    onChange={(e) => updateField('environment.setting', e.target.value)}
                                    placeholder='e.g., rocky beachhead with scattered debris'
                                    fullWidth
                                    multiline
                                    rows={2}
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Time of Day</InputLabel>
                                            <Select
                                                value={enhancedData.environment?.time_of_day || 'midday'}
                                                onChange={(e) => updateField('environment.time_of_day', e.target.value)}
                                                label='Time of Day'
                                            >
                                                {timeOfDayOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>
                                                        {opt}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Weather</InputLabel>
                                            <Select
                                                value={enhancedData.environment?.weather || 'clear'}
                                                onChange={(e) => updateField('environment.weather', e.target.value)}
                                                label='Weather'
                                            >
                                                {weatherOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>
                                                        {opt}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Camera */}
                    <Accordion expanded={expanded === 'camera'} onChange={handleAccordionChange('camera')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconCamera size={20} />
                                <Typography>Camera & Movement</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Framing</InputLabel>
                                            <Select
                                                value={enhancedData.composition?.framing || 'wide shot'}
                                                onChange={(e) => updateField('composition.framing', e.target.value)}
                                                label='Framing'
                                            >
                                                {framingOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>
                                                        {opt}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Camera Rig</InputLabel>
                                            <Select
                                                value={enhancedData.camera?.rig || 'steadicam'}
                                                onChange={(e) => updateField('camera.rig', e.target.value)}
                                                label='Camera Rig'
                                            >
                                                {cameraRigOptions.map((opt) => (
                                                    <MenuItem key={opt} value={opt}>
                                                        {opt}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <FormControl fullWidth>
                                    <InputLabel>Camera Movement</InputLabel>
                                    <Select
                                        value={enhancedData.camera_motion?.move_type || 'static shot'}
                                        onChange={(e) => updateField('camera_motion.move_type', e.target.value)}
                                        label='Camera Movement'
                                    >
                                        {movementOptions.map((opt) => (
                                            <MenuItem key={opt} value={opt}>
                                                {opt}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            label='Focal Length (mm)'
                                            type='number'
                                            value={enhancedData.camera?.lens?.focal_length_mm || 35}
                                            onChange={(e) => updateField('camera.lens.focal_length_mm', Number(e.target.value))}
                                            fullWidth
                                            inputProps={{ min: 14, max: 200, step: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            label='Aperture (f-stop)'
                                            type='number'
                                            value={enhancedData.camera?.lens?.aperture_f || 2.8}
                                            onChange={(e) => updateField('camera.lens.aperture_f', Number(e.target.value))}
                                            fullWidth
                                            inputProps={{ min: 1.2, max: 22, step: 0.1 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Visual Style */}
                    <Accordion expanded={expanded === 'style'} onChange={handleAccordionChange('style')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconPalette size={20} />
                                <Typography>Visual Style & Look</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    label='Color Style / LUT'
                                    value={enhancedData.look_profile?.lut_style || ''}
                                    onChange={(e) => updateField('look_profile.lut_style', e.target.value)}
                                    placeholder='e.g., cinematic, desaturated war film, vibrant'
                                    fullWidth
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Contrast</InputLabel>
                                            <Select
                                                value={enhancedData.look_profile?.contrast || 'medium'}
                                                onChange={(e) => updateField('look_profile.contrast', e.target.value)}
                                                label='Contrast'
                                            >
                                                <MenuItem value='low'>Low</MenuItem>
                                                <MenuItem value='medium'>Medium</MenuItem>
                                                <MenuItem value='high'>High</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Saturation</InputLabel>
                                            <Select
                                                value={enhancedData.look_profile?.saturation || 'medium'}
                                                onChange={(e) => updateField('look_profile.saturation', e.target.value)}
                                                label='Saturation'
                                            >
                                                <MenuItem value='low'>Low</MenuItem>
                                                <MenuItem value='medium'>Medium</MenuItem>
                                                <MenuItem value='high'>High</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Film Grain</InputLabel>
                                            <Select
                                                value={enhancedData.look_profile?.grain || 'none'}
                                                onChange={(e) => updateField('look_profile.grain', e.target.value)}
                                                label='Film Grain'
                                            >
                                                <MenuItem value='none'>None</MenuItem>
                                                <MenuItem value='low'>Low</MenuItem>
                                                <MenuItem value='medium'>Medium</MenuItem>
                                                <MenuItem value='high'>High</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <TextField
                                    label='Lighting Description'
                                    value={enhancedData.lighting?.key || ''}
                                    onChange={(e) => updateField('lighting.key', e.target.value)}
                                    placeholder='e.g., soft diffuse light, dramatic side lighting'
                                    fullWidth
                                    multiline
                                    rows={2}
                                />

                                <TextField
                                    label='Special Lighting Effects'
                                    value={enhancedData.lighting?.special || ''}
                                    onChange={(e) => updateField('lighting.special', e.target.value)}
                                    placeholder='e.g., sparks, volumetric fog, lens flares'
                                    fullWidth
                                />
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Mood & Genre */}
                    <Accordion expanded={expanded === 'mood'} onChange={handleAccordionChange('mood')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconMoodHeart size={20} />
                                <Typography>Mood & Genre</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant='subtitle2' gutterBottom>
                                        Genre (select multiple)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {genreOptions.map((genre) => (
                                            <Chip
                                                key={genre}
                                                label={genre}
                                                onClick={() => {
                                                    const current = enhancedData.genre || []
                                                    const newGenres = current.includes(genre)
                                                        ? current.filter((g) => g !== genre)
                                                        : [...current, genre]
                                                    updateField('genre', newGenres)
                                                }}
                                                color={enhancedData.genre?.includes(genre) ? 'primary' : 'default'}
                                                variant={enhancedData.genre?.includes(genre) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant='subtitle2' gutterBottom>
                                        Mood (select multiple)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                        {moodOptions.map((mood) => (
                                            <Chip
                                                key={mood}
                                                label={mood}
                                                onClick={() => {
                                                    const current = enhancedData.mood || []
                                                    const newMoods = current.includes(mood)
                                                        ? current.filter((m) => m !== mood)
                                                        : [...current, mood]
                                                    updateField('mood', newMoods)
                                                }}
                                                color={enhancedData.mood?.includes(mood) ? 'primary' : 'default'}
                                                variant={enhancedData.mood?.includes(mood) ? 'filled' : 'outlined'}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Dialog / Voice-over */}
                    <Accordion expanded={expanded === 'dialog'} onChange={handleAccordionChange('dialog')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconMicrophone size={20} />
                                <Typography>Dialog / Voice-over</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    label='Dialog Text'
                                    value={enhancedData.audio?.dialog?.text || ''}
                                    onChange={(e) => updateField('audio.dialog.text', e.target.value)}
                                    placeholder='Enter the exact words to be spoken...'
                                    fullWidth
                                    multiline
                                    rows={2}
                                    helperText='Optional: Add dialogue or narration for the video'
                                />
                                {enhancedData.audio?.dialog?.text && (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth size='small'>
                                                <InputLabel>Tone</InputLabel>
                                                <Select
                                                    value={enhancedData.audio?.dialog?.tone || 'neutral'}
                                                    onChange={(e) => updateField('audio.dialog.tone', e.target.value)}
                                                    label='Tone'
                                                >
                                                    <MenuItem value='neutral'>Neutral</MenuItem>
                                                    <MenuItem value='casual'>Casual</MenuItem>
                                                    <MenuItem value='formal'>Formal</MenuItem>
                                                    <MenuItem value='friendly'>Friendly</MenuItem>
                                                    <MenuItem value='professional'>Professional</MenuItem>
                                                    <MenuItem value='conversational'>Conversational</MenuItem>
                                                    <MenuItem value='authoritative'>Authoritative</MenuItem>
                                                    <MenuItem value='warm'>Warm</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <FormControl fullWidth size='small'>
                                                <InputLabel>Emotion</InputLabel>
                                                <Select
                                                    value={enhancedData.audio?.dialog?.emotion || 'calm'}
                                                    onChange={(e) => updateField('audio.dialog.emotion', e.target.value)}
                                                    label='Emotion'
                                                >
                                                    <MenuItem value='calm'>Calm</MenuItem>
                                                    <MenuItem value='excited'>Excited</MenuItem>
                                                    <MenuItem value='happy'>Happy</MenuItem>
                                                    <MenuItem value='sad'>Sad</MenuItem>
                                                    <MenuItem value='confident'>Confident</MenuItem>
                                                    <MenuItem value='enthusiastic'>Enthusiastic</MenuItem>
                                                    <MenuItem value='thoughtful'>Thoughtful</MenuItem>
                                                    <MenuItem value='mysterious'>Mysterious</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Advanced */}
                    <Accordion expanded={expanded === 'advanced'} onChange={handleAccordionChange('advanced')}>
                        <AccordionSummary expandIcon={<IconChevronDown size={20} />}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <IconSparkles size={20} />
                                <Typography>Advanced Options</Typography>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    label='Visual Effects (comma-separated)'
                                    value={enhancedData.fx?.vfx?.join(', ') || ''}
                                    onChange={(e) =>
                                        updateField(
                                            'fx.vfx',
                                            e.target.value
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                    placeholder='e.g., smoke plumes, sparks, lens flares'
                                    fullWidth
                                    multiline
                                    rows={2}
                                />

                                <TextField
                                    label='Negative Prompts (comma-separated)'
                                    value={enhancedData.negative_prompts?.join(', ') || ''}
                                    onChange={(e) =>
                                        updateField(
                                            'negative_prompts',
                                            e.target.value
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                    placeholder='e.g., no modern weapons, no text overlays'
                                    fullWidth
                                    multiline
                                    rows={2}
                                    helperText='Things to avoid in the generation'
                                />
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant='outlined'>
                    Cancel
                </Button>
                <Button onClick={handleApply} variant='contained' startIcon={<IconSparkles size={18} />} disabled={isGenerating}>
                    Apply Enhanced Prompt
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default PromptEnhancerWizard
