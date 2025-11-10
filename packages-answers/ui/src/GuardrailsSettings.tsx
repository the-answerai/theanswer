'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import guardrailsApi from 'flowise-ui/src/api/guardrails'
import SimpleMode from './GuardrailsSettings/SimpleMode'

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`guardrails-tabpanel-${index}`}
            aria-labelledby={`guardrails-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

export default function GuardrailsSettings({ organizationId }: { organizationId: string }) {
    const router = useRouter()
    const [tab, setTab] = useState(0)
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        loadConfig()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const response = await guardrailsApi.getGuardrailsConfig(organizationId)
            setConfig(response.data || {})
        } catch (err: any) {
            setError(err.message || 'Failed to load guardrails configuration')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (newConfig: any) => {
        try {
            setSaving(true)
            setError(null)
            await guardrailsApi.updateGuardrailsConfig(organizationId, newConfig)
            setConfig(newConfig)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to save configuration')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Typography variant='h4' gutterBottom>
                Guardrails Settings
            </Typography>
            <Typography variant='body2' color='text.secondary' paragraph>
                Configure AI guardrails to protect your chatflows from unsafe content, PII leaks, and hallucinations.
            </Typography>

            {error && (
                <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity='success' sx={{ mb: 2 }}>
                    Configuration saved successfully
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                    <Tab label='Simple' />
                    <Tab label='Advanced' disabled />
                    <Tab label='Custom (JSON)' disabled />
                </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
                <SimpleMode config={config} onSave={handleSave} saving={saving} />
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <Typography>Advanced mode (per-dimension controls) - Coming soon</Typography>
            </TabPanel>

            <TabPanel value={tab} index={2}>
                <Typography>Custom JSON editor - Coming soon</Typography>
            </TabPanel>
        </Box>
    )
}
