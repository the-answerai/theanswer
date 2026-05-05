'use client'
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Slider from '@mui/material/Slider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import RestoreIcon from '@mui/icons-material/Restore'
import InfoIcon from '@mui/icons-material/Info'

interface AdvancedModeProps {
    config: any
    onSave: (config: any) => Promise<void>
    saving: boolean
    error: string | null
    success: boolean
    onClearError: () => void
}

// Safety dimensions with descriptions
const SAFETY_DIMENSIONS = [
    { key: 'fdl_harmful', label: 'Harmful Content', recommendation: 'General purpose: 0.05-0.1' },
    { key: 'fdl_violent', label: 'Violent Content', recommendation: 'General purpose: 0.05-0.1' },
    { key: 'fdl_unethical', label: 'Unethical Content', recommendation: 'General purpose: 0.1-0.15' },
    { key: 'fdl_illegal', label: 'Illegal Content', recommendation: 'Financial/Healthcare: 0.02-0.05' },
    { key: 'fdl_sexual', label: 'Sexual Content', recommendation: 'General purpose: 0.05-0.1' },
    { key: 'fdl_racist', label: 'Racist Content', recommendation: 'General purpose: 0.05-0.1' },
    { key: 'fdl_jailbreaking', label: 'Jailbreaking Attempts', recommendation: 'Security focused: 0.02-0.05' },
    { key: 'fdl_harassing', label: 'Harassing Content', recommendation: 'Community moderation: 0.05-0.08' },
    { key: 'fdl_hateful', label: 'Hateful Content', recommendation: 'Community moderation: 0.05-0.08' },
    { key: 'fdl_sexist', label: 'Sexist Content', recommendation: 'General purpose: 0.05-0.1' },
    { key: 'fdl_roleplaying', label: 'Roleplaying Content', recommendation: 'Gaming/Creative: 0.3-0.5' }
] as const

// PII types with descriptions
const PII_TYPES = [
    { key: 'PERSON', label: 'Person Names', confidenceRec: '0.8-0.9', actionRec: 'redact' },
    { key: 'EMAIL', label: 'Email Addresses', confidenceRec: '0.8-0.9', actionRec: 'redact' },
    { key: 'PHONE_NUMBER', label: 'Phone Numbers', confidenceRec: '0.8-0.9', actionRec: 'redact' },
    { key: 'ADDRESS', label: 'Physical Addresses', confidenceRec: '0.7-0.8', actionRec: 'redact' },
    { key: 'US_SOCIAL_SECURITY_NUMBER', label: 'SSN', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'CREDIT_CARD', label: 'Credit Card Numbers', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'US_PASSPORT', label: 'US Passport Numbers', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'US_DRIVER_LICENSE', label: 'Driver License Numbers', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'US_BANK_NUMBER', label: 'Bank Account Numbers', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'CREDIT_CARD_EXPIRATION', label: 'Card Expiration Dates', confidenceRec: '0.8-0.9', actionRec: 'redact' },
    { key: 'PIN', label: 'PIN Numbers', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'IBAN_CODE', label: 'IBAN Codes', confidenceRec: '0.7-0.8', actionRec: 'block' },
    { key: 'SWIFT_CODE', label: 'SWIFT Codes', confidenceRec: '0.8-0.9', actionRec: 'redact' },
    { key: 'USERNAME', label: 'Usernames', confidenceRec: '0.85-0.95', actionRec: 'warn' },
    { key: 'AGE', label: 'Age Information', confidenceRec: '0.85-0.95', actionRec: 'warn' }
] as const

// Shared sx for the inner Simple/Per-Dimension and Simple/Per-Type tabs.
// The AnswerAI dark theme has `primary.main` defined as a translucent white,
// so MUI's default Tab indicator (`bgcolor: primary.main`) renders invisible.
// We override the indicator + selected text to use `text.primary` for clear
// visibility in both modes.
const innerTabsSx = {
    mb: 2,
    borderBottom: 1,
    borderColor: 'divider',
    minHeight: 36,
    '& .MuiTabs-indicator': {
        backgroundColor: 'text.primary',
        height: 2
    },
    '& .MuiTab-root': {
        textTransform: 'none' as const,
        fontWeight: 500,
        minHeight: 36,
        color: 'text.secondary',
        '&.Mui-selected': {
            color: 'text.primary',
            fontWeight: 600
        },
        '&:hover': {
            color: 'text.primary'
        }
    }
}

// Shared sx for the AccordionSummary section heads ("Input Validation",
// "Output Validation", "Advanced Settings"). Aligns with the subtitle2 +
// fontWeight 600 rhythm used elsewhere on the page and gives the summary a
// subtle hover affordance that works in both themes.
const sectionSummarySx = {
    px: 1,
    borderRadius: 1,
    '&:hover': {
        bgcolor: 'action.hover'
    },
    '& .MuiAccordionSummary-content': {
        my: 1.5
    }
}

export default function AdvancedMode({ config, onSave, saving, error, success, onClearError }: AdvancedModeProps) {
    // State for all configuration
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [hasChanges, setHasChanges] = useState(false)

    // Safety state
    const [safetyEnabled, setSafetyEnabled] = useState<boolean>(config?.safety?.enabled ?? true)
    const [safetyThreshold, setSafetyThreshold] = useState<number>(config?.safety?.threshold ?? 0.1)
    const [safetyAction, setSafetyAction] = useState<string>(config?.safety?.action ?? 'block')
    const [safetyView, setSafetyView] = useState<'simple' | 'per-dimension'>('simple')
    const [dimensionThresholds, setDimensionThresholds] = useState<Record<string, number>>(config?.safety?.dimensionThresholds ?? {})

    // PII state
    const [piiEnabled, setPiiEnabled] = useState<boolean>(config?.pii?.enabled ?? true)
    const [piiConfidenceThreshold, setPiiConfidenceThreshold] = useState<number>(config?.pii?.confidenceThreshold ?? 0.8)
    const [piiAction, setPiiAction] = useState<string>(config?.pii?.action ?? 'redact')
    const [piiView, setPiiView] = useState<'simple' | 'per-type'>('simple')
    const [typeConfidenceThresholds, setTypeConfidenceThresholds] = useState<Record<string, number>>(
        config?.pii?.typeConfidenceThresholds ?? {}
    )
    const [typeActions, setTypeActions] = useState<Record<string, string>>(config?.pii?.typeActions ?? {})

    // Faithfulness state
    const [faithfulnessEnabled, setFaithfulnessEnabled] = useState<boolean>(config?.faithfulness?.enabled ?? true)
    const [faithfulnessThreshold, setFaithfulnessThreshold] = useState<number>(config?.faithfulness?.threshold ?? 0.005)
    const [faithfulnessAction, setFaithfulnessAction] = useState<string>(config?.faithfulness?.action ?? 'warn')

    // Advanced settings
    const [circuitBreakerFailureThreshold, setCircuitBreakerFailureThreshold] = useState<number>(
        config?.circuitBreaker?.failureThreshold ?? 5
    )

    // Sync with config prop
    useEffect(() => {
        setEnabled(config?.enabled ?? false)
        setSafetyEnabled(config?.safety?.enabled ?? true)
        setSafetyThreshold(config?.safety?.threshold ?? 0.1)
        setSafetyAction(config?.safety?.action ?? 'block')
        setDimensionThresholds(config?.safety?.dimensionThresholds ?? {})
        setPiiEnabled(config?.pii?.enabled ?? true)
        setPiiConfidenceThreshold(config?.pii?.confidenceThreshold ?? 0.8)
        setPiiAction(config?.pii?.action ?? 'redact')
        setTypeConfidenceThresholds(config?.pii?.typeConfidenceThresholds ?? {})
        setTypeActions(config?.pii?.typeActions ?? {})
        setFaithfulnessEnabled(config?.faithfulness?.enabled ?? true)
        setFaithfulnessThreshold(config?.faithfulness?.threshold ?? 0.005)
        setFaithfulnessAction(config?.faithfulness?.action ?? 'warn')
        setCircuitBreakerFailureThreshold(config?.circuitBreaker?.failureThreshold ?? 5)
    }, [config])

    const handleSave = async () => {
        const newConfig = {
            enabled,
            credentialId: config?.credentialId, // Preserve credential
            safety: {
                enabled: safetyEnabled,
                threshold: safetyThreshold,
                dimensionThresholds: Object.keys(dimensionThresholds).length > 0 ? dimensionThresholds : undefined,
                action: safetyAction
            },
            pii: {
                enabled: piiEnabled,
                confidenceThreshold: piiConfidenceThreshold,
                typeConfidenceThresholds: Object.keys(typeConfidenceThresholds).length > 0 ? typeConfidenceThresholds : undefined,
                action: piiAction,
                typeActions: Object.keys(typeActions).length > 0 ? typeActions : undefined
            },
            faithfulness: {
                enabled: faithfulnessEnabled,
                threshold: faithfulnessThreshold,
                action: faithfulnessAction
            },
            circuitBreaker: {
                failureThreshold: circuitBreakerFailureThreshold,
                resetTimeout: config?.circuitBreaker?.resetTimeout ?? 30000,
                successThreshold: config?.circuitBreaker?.successThreshold ?? 3
            }
        }

        // Merge onto existing config so failureMode, observabilityOnly, and other untouched fields are preserved (esp. chatflow overrides)
        await onSave({ ...config, ...newConfig })
        setHasChanges(false)
    }

    const markChanged = () => setHasChanges(true)

    // Bulk actions for safety
    const handleSafetyBulkAction = (action: string) => {
        markChanged()
        const newThresholds = { ...dimensionThresholds }

        switch (action) {
            case 'strict':
                SAFETY_DIMENSIONS.forEach((dim) => {
                    newThresholds[dim.key] = 0.05
                })
                break
            case 'lenient':
                SAFETY_DIMENSIONS.forEach((dim) => {
                    newThresholds[dim.key] = 0.2
                })
                break
            case 'reset':
                SAFETY_DIMENSIONS.forEach((dim) => {
                    delete newThresholds[dim.key]
                })
                break
        }

        setDimensionThresholds(newThresholds)
    }

    // Bulk actions for PII
    const handlePIIBulkAction = (action: string) => {
        markChanged()
        const newTypeActions = { ...typeActions }

        switch (action) {
            case 'block-financial':
                ;['US_SOCIAL_SECURITY_NUMBER', 'CREDIT_CARD', 'US_BANK_NUMBER', 'PIN', 'IBAN_CODE'].forEach((type) => {
                    newTypeActions[type] = 'block'
                })
                break
            case 'redact-contact':
                ;['EMAIL', 'PHONE_NUMBER', 'ADDRESS'].forEach((type) => {
                    newTypeActions[type] = 'redact'
                })
                break
            case 'warn-nonsensitive':
                ;['USERNAME', 'AGE'].forEach((type) => {
                    newTypeActions[type] = 'warn'
                })
                break
            case 'reset':
                PII_TYPES.forEach((type) => {
                    delete newTypeActions[type.key]
                })
                break
        }

        setTypeActions(newTypeActions)
    }

    const getDimensionThreshold = (dimensionKey: string) => {
        return dimensionThresholds[dimensionKey] ?? safetyThreshold
    }

    const setDimensionThreshold = (dimensionKey: string, value: number | null) => {
        markChanged()
        const newThresholds = { ...dimensionThresholds }
        if (value === null) {
            delete newThresholds[dimensionKey]
        } else {
            newThresholds[dimensionKey] = value
        }
        setDimensionThresholds(newThresholds)
    }

    const getTypeConfidence = (typeKey: string) => {
        return typeConfidenceThresholds[typeKey] ?? piiConfidenceThreshold
    }

    const setTypeConfidence = (typeKey: string, value: number | null) => {
        markChanged()
        const newThresholds = { ...typeConfidenceThresholds }
        if (value === null) {
            delete newThresholds[typeKey]
        } else {
            newThresholds[typeKey] = value
        }
        setTypeConfidenceThresholds(newThresholds)
    }

    const getTypeAction = (typeKey: string) => {
        return typeActions[typeKey] ?? piiAction
    }

    const setTypeAction = (typeKey: string, value: string | null) => {
        markChanged()
        const newActions = { ...typeActions }
        if (value === null) {
            delete newActions[typeKey]
        } else {
            newActions[typeKey] = value
        }
        setTypeActions(newActions)
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <>
                {/* Input Validation */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={sectionSummarySx}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Input Validation
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Safety Check */}
                        <Card variant='outlined' sx={{ mt: 2, mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Safety Check
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={safetyEnabled}
                                                onChange={(e) => {
                                                    setSafetyEnabled(e.target.checked)
                                                    markChanged()
                                                }}
                                            />
                                        }
                                        label='Enable'
                                    />
                                </Box>

                                {safetyEnabled && (
                                    <>
                                        <Tabs value={safetyView} onChange={(e, value) => setSafetyView(value)} sx={innerTabsSx}>
                                            <Tab label='Simple' value='simple' />
                                            <Tab label='Per-Dimension' value='per-dimension' />
                                        </Tabs>

                                        {safetyView === 'simple' ? (
                                            <Box>
                                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                                    Global Threshold (0.0-1.0)
                                                    <Tooltip title='Fiddler recommends > 0.1'>
                                                        <InfoIcon sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                                                    </Tooltip>
                                                </Typography>
                                                <Box sx={{ px: 2, mb: 2 }}>
                                                    <Slider
                                                        value={safetyThreshold}
                                                        onChange={(e, value) => {
                                                            setSafetyThreshold(value as number)
                                                            markChanged()
                                                        }}
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        marks={[
                                                            { value: 0, label: '0.0' },
                                                            { value: 0.1, label: '0.1' },
                                                            { value: 0.5, label: '0.5' },
                                                            { value: 1, label: '1.0' }
                                                        ]}
                                                        valueLabelDisplay='auto'
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography variant='body2' sx={{ mb: 1 }}>
                                                        Action
                                                    </Typography>
                                                    <Select
                                                        value={safetyAction}
                                                        onChange={(e) => {
                                                            setSafetyAction(e.target.value)
                                                            markChanged()
                                                        }}
                                                        fullWidth
                                                        size='small'
                                                    >
                                                        <MenuItem value='block'>Block</MenuItem>
                                                        <MenuItem value='warn'>Warn</MenuItem>
                                                    </Select>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box>
                                                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Button
                                                        size='small'
                                                        variant='outlined'
                                                        onClick={() => handleSafetyBulkAction('strict')}
                                                    >
                                                        Set All to Strict (0.05)
                                                    </Button>
                                                    <Button
                                                        size='small'
                                                        variant='outlined'
                                                        onClick={() => handleSafetyBulkAction('lenient')}
                                                    >
                                                        Set All to Lenient (0.2)
                                                    </Button>
                                                    <Button size='small' variant='outlined' onClick={() => handleSafetyBulkAction('reset')}>
                                                        Reset All
                                                    </Button>
                                                </Box>

                                                <Alert severity='info' sx={{ mb: 2 }}>
                                                    💡 <strong>Recommendations:</strong> Financial/Healthcare: Set Illegal to 0.02-0.05 |
                                                    Community: Set Hate/Harassment to 0.05-0.08 | Gaming: Set Roleplaying to 0.3-0.5
                                                </Alert>

                                                <Table size='small' sx={{ '& .MuiTableCell-root': { py: 1.5 } }}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Dimension</TableCell>
                                                            <TableCell>Threshold Override</TableCell>
                                                            <TableCell>Status</TableCell>
                                                            <TableCell width={50}></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {SAFETY_DIMENSIONS.map((dim) => {
                                                            const hasOverride = Object.prototype.hasOwnProperty.call(
                                                                dimensionThresholds,
                                                                dim.key
                                                            )
                                                            const value = getDimensionThreshold(dim.key)

                                                            return (
                                                                <TableRow key={dim.key}>
                                                                    <TableCell>
                                                                        <Tooltip title={dim.recommendation}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                {dim.label}
                                                                                <InfoIcon
                                                                                    sx={{
                                                                                        fontSize: 14,
                                                                                        ml: 0.5,
                                                                                        color: 'text.secondary'
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Slider
                                                                            value={value}
                                                                            onChange={(e, newValue) =>
                                                                                setDimensionThreshold(dim.key, newValue as number)
                                                                            }
                                                                            min={0}
                                                                            max={1}
                                                                            step={0.01}
                                                                            valueLabelDisplay='auto'
                                                                            size='small'
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {hasOverride ? (
                                                                            <Chip label='Custom' size='small' color='primary' />
                                                                        ) : (
                                                                            <Chip
                                                                                label={`→ Global (${safetyThreshold})`}
                                                                                size='small'
                                                                                variant='outlined'
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {hasOverride && (
                                                                            <IconButton
                                                                                size='small'
                                                                                onClick={() => setDimensionThreshold(dim.key, null)}
                                                                                title='Reset to global'
                                                                            >
                                                                                <RestoreIcon fontSize='small' />
                                                                            </IconButton>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* PII Detection */}
                        <Card variant='outlined'>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        PII Detection
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={piiEnabled}
                                                onChange={(e) => {
                                                    setPiiEnabled(e.target.checked)
                                                    markChanged()
                                                }}
                                            />
                                        }
                                        label='Enable'
                                    />
                                </Box>

                                {piiEnabled && (
                                    <>
                                        <Tabs value={piiView} onChange={(e, value) => setPiiView(value)} sx={innerTabsSx}>
                                            <Tab label='Simple' value='simple' />
                                            <Tab label='Per-Type' value='per-type' />
                                        </Tabs>

                                        {piiView === 'simple' ? (
                                            <Box>
                                                <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                                    Global Confidence Threshold (0.0-1.0)
                                                    <Tooltip title='Fiddler recommends 0.8'>
                                                        <InfoIcon sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                                                    </Tooltip>
                                                </Typography>
                                                <Box sx={{ px: 2, mb: 2 }}>
                                                    <Slider
                                                        value={piiConfidenceThreshold}
                                                        onChange={(e, value) => {
                                                            setPiiConfidenceThreshold(value as number)
                                                            markChanged()
                                                        }}
                                                        min={0}
                                                        max={1}
                                                        step={0.01}
                                                        marks={[
                                                            { value: 0, label: '0.0' },
                                                            { value: 0.8, label: '0.8' },
                                                            { value: 1, label: '1.0' }
                                                        ]}
                                                        valueLabelDisplay='auto'
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography variant='body2' sx={{ mb: 1 }}>
                                                        Global Action
                                                    </Typography>
                                                    <Select
                                                        value={piiAction}
                                                        onChange={(e) => {
                                                            setPiiAction(e.target.value)
                                                            markChanged()
                                                        }}
                                                        fullWidth
                                                        size='small'
                                                    >
                                                        <MenuItem value='block'>Block</MenuItem>
                                                        <MenuItem value='redact'>Redact</MenuItem>
                                                        <MenuItem value='warn'>Warn</MenuItem>
                                                    </Select>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Box>
                                                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Button size='small' onClick={() => handlePIIBulkAction('block-financial')}>
                                                        Block All Financial
                                                    </Button>
                                                    <Button size='small' onClick={() => handlePIIBulkAction('redact-contact')}>
                                                        Redact All Contact
                                                    </Button>
                                                    <Button size='small' onClick={() => handlePIIBulkAction('warn-nonsensitive')}>
                                                        Warn All Non-Sensitive
                                                    </Button>
                                                    <Button size='small' onClick={() => handlePIIBulkAction('reset')}>
                                                        Reset All
                                                    </Button>
                                                </Box>

                                                <Alert severity='info' sx={{ mb: 2 }}>
                                                    💡 <strong>Recommendations:</strong> Financial: Block SSN, Credit Cards, Bank Numbers |
                                                    Healthcare: Block SSN, Redact Contact Info | Community: Redact Contact, Warn Usernames
                                                </Alert>

                                                <Table size='small'>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>PII Type</TableCell>
                                                            <TableCell>Confidence Override</TableCell>
                                                            <TableCell>Action Override</TableCell>
                                                            <TableCell>Status</TableCell>
                                                            <TableCell width={50}></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {PII_TYPES.map((type) => {
                                                            const hasConfidenceOverride = Object.prototype.hasOwnProperty.call(
                                                                typeConfidenceThresholds,
                                                                type.key
                                                            )
                                                            const hasActionOverride = Object.prototype.hasOwnProperty.call(
                                                                typeActions,
                                                                type.key
                                                            )
                                                            const confidenceValue = getTypeConfidence(type.key)
                                                            const actionValue = getTypeAction(type.key)

                                                            return (
                                                                <TableRow key={type.key}>
                                                                    <TableCell>
                                                                        <Tooltip
                                                                            title={`Conf: ${type.confidenceRec}, Action: ${type.actionRec}`}
                                                                        >
                                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                {type.label}
                                                                                <InfoIcon
                                                                                    sx={{
                                                                                        fontSize: 14,
                                                                                        ml: 0.5,
                                                                                        color: 'text.secondary'
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Slider
                                                                            value={confidenceValue}
                                                                            onChange={(e, newValue) =>
                                                                                setTypeConfidence(type.key, newValue as number)
                                                                            }
                                                                            min={0}
                                                                            max={1}
                                                                            step={0.01}
                                                                            valueLabelDisplay='auto'
                                                                            size='small'
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Select
                                                                            value={actionValue}
                                                                            onChange={(e) => setTypeAction(type.key, e.target.value)}
                                                                            size='small'
                                                                            fullWidth
                                                                        >
                                                                            <MenuItem value='block'>Block</MenuItem>
                                                                            <MenuItem value='redact'>Redact</MenuItem>
                                                                            <MenuItem value='warn'>Warn</MenuItem>
                                                                        </Select>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {hasConfidenceOverride || hasActionOverride ? (
                                                                            <Chip label='Custom' size='small' color='primary' />
                                                                        ) : (
                                                                            <Chip label='→ Global' size='small' variant='outlined' />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {(hasConfidenceOverride || hasActionOverride) && (
                                                                            <IconButton
                                                                                size='small'
                                                                                onClick={() => {
                                                                                    setTypeConfidence(type.key, null)
                                                                                    setTypeAction(type.key, null)
                                                                                }}
                                                                                title='Reset to global'
                                                                            >
                                                                                <RestoreIcon fontSize='small' />
                                                                            </IconButton>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </AccordionDetails>
                </Accordion>

                {/* Output Validation */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={sectionSummarySx}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Output Validation
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Alert severity='info' sx={{ mt: 2, mb: 2 }}>
                            Output validation uses the same Safety and PII settings as input validation. Configure faithfulness check below
                            for RAG chatflows.
                        </Alert>

                        {/* Faithfulness Check */}
                        <Card variant='outlined'>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                        Faithfulness Check (RAG Only)
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={faithfulnessEnabled}
                                                onChange={(e) => {
                                                    setFaithfulnessEnabled(e.target.checked)
                                                    markChanged()
                                                }}
                                            />
                                        }
                                        label='Enable'
                                    />
                                </Box>

                                {faithfulnessEnabled && (
                                    <>
                                        <Typography variant='body2' color='text.secondary' gutterBottom>
                                            Threshold (0.0-1.0) - Lower score indicates hallucination
                                            <Tooltip title='Fiddler recommends < 0.005. Lower score = hallucination.'>
                                                <InfoIcon sx={{ fontSize: 16, ml: 0.5, verticalAlign: 'middle' }} />
                                            </Tooltip>
                                        </Typography>
                                        <Box sx={{ px: 2 }}>
                                            <Slider
                                                value={faithfulnessThreshold}
                                                onChange={(e, value) => {
                                                    setFaithfulnessThreshold(value as number)
                                                    markChanged()
                                                }}
                                                min={0}
                                                max={0.1}
                                                step={0.001}
                                                marks={[
                                                    { value: 0, label: '0.0' },
                                                    { value: 0.005, label: '0.005' },
                                                    { value: 0.1, label: '0.1' }
                                                ]}
                                                valueLabelDisplay='auto'
                                            />
                                        </Box>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant='body2' gutterBottom>
                                                Action
                                            </Typography>
                                            <Select
                                                value={faithfulnessAction}
                                                onChange={(e) => {
                                                    setFaithfulnessAction(e.target.value)
                                                    markChanged()
                                                }}
                                                fullWidth
                                                size='small'
                                            >
                                                <MenuItem value='block'>Block</MenuItem>
                                                <MenuItem value='warn'>Warn</MenuItem>
                                            </Select>
                                        </Box>
                                        <Alert severity='warning' sx={{ mt: 2 }}>
                                            Only applies to RAG chatflows with source documents. Skipped for other chatflows.
                                        </Alert>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </AccordionDetails>
                </Accordion>

                {/* Advanced Settings */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={sectionSummarySx}>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Advanced Settings
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Card variant='outlined' sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant='body2' color='text.secondary' paragraph>
                                    Configure circuit breaker and reliability settings
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant='body2' gutterBottom>
                                        Circuit Breaker Failure Threshold
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        Number of consecutive failures before circuit opens
                                    </Typography>
                                    <Slider
                                        value={circuitBreakerFailureThreshold}
                                        onChange={(e, value) => {
                                            setCircuitBreakerFailureThreshold(value as number)
                                            markChanged()
                                        }}
                                        min={1}
                                        max={10}
                                        step={1}
                                        marks
                                        valueLabelDisplay='auto'
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </AccordionDetails>
                </Accordion>
            </>

            {/* Actions */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {/* Save uses a local sx override to force a solid disabled background.
                    The global theme applies a gradient `background` to all contained
                    buttons; MUI's default disabled state only resets `backgroundColor`,
                    which leaves the gradient bleeding through at low contrast in both
                    modes. We zero out `background` + `boxShadow` on disabled here so
                    the button reads unmistakably as disabled. */}
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
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
                            // Reset to original config
                            setSafetyEnabled(config?.safety?.enabled ?? true)
                            setSafetyThreshold(config?.safety?.threshold ?? 0.1)
                            setDimensionThresholds(config?.safety?.dimensionThresholds ?? {})
                            setPiiEnabled(config?.pii?.enabled ?? true)
                            setPiiConfidenceThreshold(config?.pii?.confidenceThreshold ?? 0.8)
                            setTypeConfidenceThresholds(config?.pii?.typeConfidenceThresholds ?? {})
                            setTypeActions(config?.pii?.typeActions ?? {})
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
