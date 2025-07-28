'use client'
import React, { useState, useEffect } from 'react'
import parser from 'html-react-parser'
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Box,
    Avatar,
    Chip,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox
} from '@mui/material'
import {
    Business as BusinessIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Verified as VerifiedIcon,
    Settings as SettingsIcon,
    Add as AddIcon,
    Cable as IntegrationIcon
} from '@mui/icons-material'
// Full credential creation modal without Redux dependencies
const CredentialCreationModal = ({
    open,
    onClose,
    integration
}: {
    open: boolean
    onClose: () => void
    integration: EnabledIntegration | null
}) => {
    const [componentCredential, setComponentCredential] = useState<any>(null)
    const [credentialData, setCredentialData] = useState<any>({})
    const [credentialName, setCredentialName] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!integration || !open) return

        const fetchComponentCredential = async () => {
            try {
                setLoading(true)
                setError(null)

                const accessToken = sessionStorage.getItem('access_token')
                if (!accessToken) {
                    throw new Error('No access token available')
                }

                const response = await fetch(`${baseURL}/api/v1/components-credentials/${integration.credentialName}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch credential definition')
                }
                const data = await response.json()
                setComponentCredential(data)
                setCredentialData({})
                setCredentialName('')
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchComponentCredential()
    }, [integration, open])

    const handleInputChange = (paramName: string, value: any) => {
        setCredentialData((prev) => ({
            ...prev,
            [paramName]: value
        }))
    }

    const handleCreateCredential = async () => {
        if (!credentialName.trim()) {
            setError('Please enter a credential name')
            return
        }

        try {
            setSaving(true)
            setError(null)

            const accessToken = sessionStorage.getItem('access_token')
            if (!accessToken) {
                throw new Error('No access token available')
            }

            const payload = {
                name: credentialName,
                credentialName: integration!.credentialName,
                plainDataObj: credentialData
            }

            const response = await fetch(`${baseURL}/api/v1/credentials`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to create credential')
            }

            // Success! Close modal and refresh
            onClose()
            setCredentialName('')
            setCredentialData({})
            setComponentCredential(null)

            // Show success message (you could pass this up to parent)
            console.log('Credential created successfully!')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const renderInputField = (inputParam: any) => {
        const value = credentialData[inputParam.name] ?? inputParam.default ?? ''

        switch (inputParam.type) {
            case 'string':
            case 'password':
                return (
                    <TextField
                        fullWidth
                        size='small'
                        label={inputParam.label}
                        type={inputParam.type === 'password' ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => handleInputChange(inputParam.name, e.target.value)}
                        required={!inputParam.optional}
                        multiline={inputParam.rows > 1}
                        rows={inputParam.rows || 1}
                        placeholder={inputParam.placeholder}
                        sx={{ mb: 2 }}
                    />
                )
            case 'number':
                return (
                    <TextField
                        fullWidth
                        size='small'
                        label={inputParam.label}
                        type='number'
                        value={value}
                        onChange={(e) => handleInputChange(inputParam.name, e.target.value)}
                        required={!inputParam.optional}
                        sx={{ mb: 2 }}
                    />
                )
            case 'boolean':
                return (
                    <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox checked={value === true} onChange={(e) => handleInputChange(inputParam.name, e.target.checked)} />
                            }
                            label={inputParam.label}
                        />
                    </Box>
                )
            default:
                return (
                    <TextField
                        fullWidth
                        size='small'
                        label={inputParam.label}
                        value={value}
                        onChange={(e) => handleInputChange(inputParam.name, e.target.value)}
                        required={!inputParam.optional}
                        sx={{ mb: 2 }}
                    />
                )
        }
    }

    if (!integration) return null

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>
                <Box display='flex' alignItems='center' gap={2}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <img
                            style={{
                                width: '70%',
                                height: '70%',
                                objectFit: 'contain'
                            }}
                            alt={integration.credentialName}
                            src={`${baseURL}/api/v1/components-credentials-icon/${integration.credentialName}`}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.onerror = null
                                target.src = keySVG
                            }}
                        />
                    </Box>
                    <Box>
                        <Typography variant='h6'>Add {parser(integration.label)} Credential</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Configure your {parser(integration.label)} integration
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {error && (
                    <Alert severity='error' sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display='flex' justifyContent='center' alignItems='center' py={4}>
                        <CircularProgress />
                    </Box>
                ) : componentCredential ? (
                    <>
                        <TextField
                            fullWidth
                            size='small'
                            label='Credential Name'
                            value={credentialName}
                            onChange={(e) => setCredentialName(e.target.value)}
                            placeholder='Enter a name for this credential'
                            required
                            sx={{ mb: 2 }}
                        />

                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            {componentCredential.description
                                ? parser(componentCredential.description)
                                : `Configure your ${parser(integration.label)} credentials below.`}
                        </Typography>

                        {componentCredential.inputs?.map((inputParam: any, index: number) => (
                            <Box key={index}>
                                {inputParam.description && (
                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                                        {parser(inputParam.description)}
                                    </Typography>
                                )}
                                {renderInputField(inputParam)}
                            </Box>
                        ))}
                    </>
                ) : (
                    <Typography>No configuration available for this credential type.</Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant='contained'
                    onClick={handleCreateCredential}
                    disabled={loading || saving || !credentialName.trim()}
                    startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
                >
                    {saving ? 'Creating...' : 'Create Credential'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

// Constants
// @ts-ignore
import { baseURL } from '@/store/constant'
// @ts-ignore
import keySVG from '@/assets/images/key.svg'

interface ProfileProps {
    userData: {
        picture?: string
        email?: string
        name?: string
        org_name?: string
        org_id?: string
        roles?: string[]
        subscription?: unknown
    }
}

interface EnabledIntegration {
    credentialName: string
    label: string
    description?: string
    enabled: boolean
    environmentVariables?: any[]
    organizationCredentialIds?: string[]
}

const Profile: React.FC<ProfileProps> = ({ userData }) => {
    const user = userData
    const [integrations, setIntegrations] = useState<EnabledIntegration[]>([])
    const [integrationsLoading, setIntegrationsLoading] = useState(true)
    const [integrationsError, setIntegrationsError] = useState<string | null>(null)
    const [showCredentialModal, setShowCredentialModal] = useState(false)
    const [selectedIntegration, setSelectedIntegration] = useState<EnabledIntegration | null>(null)

    // Fetch enabled integrations from organization
    const fetchOrgIntegrations = async () => {
        try {
            setIntegrationsLoading(true)
            const response = await fetch('/api/admin/org-credentials')
            if (!response.ok) {
                throw new Error('Failed to fetch organization integrations')
            }
            const data = await response.json()
            setIntegrations(data.integrations?.filter((i: EnabledIntegration) => i.enabled) || [])
        } catch (err: any) {
            setIntegrationsError(err.message)
        } finally {
            setIntegrationsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrgIntegrations()
    }, [])

    const handleAddCredential = (credentialName: string) => {
        const integration = integrations.find((i) => i.credentialName === credentialName)
        if (integration) {
            setSelectedIntegration(integration)
            setShowCredentialModal(true)
        }
    }

    const handleCredentialModalClose = () => {
        setShowCredentialModal(false)
        setSelectedIntegration(null)
    }

    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'error'
            case 'builder':
                return 'warning'
            case 'member':
                return 'info'
            default:
                return 'default'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return <SecurityIcon fontSize='small' />
            case 'builder':
                return <SettingsIcon fontSize='small' />
            default:
                return <PersonIcon fontSize='small' />
        }
    }

    return (
        <Container maxWidth='md'>
            <Box py={4}>
                {/* Header */}
                <Box display='flex' alignItems='center' mb={4}>
                    <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
                        Profile
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* Profile Card */}
                    <Grid item xs={12} md={4}>
                        <Card
                            sx={{
                                height: 'fit-content',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                position: 'relative',
                                overflow: 'visible'
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <Avatar
                                        src={user?.picture}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            border: '4px solid white',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                            mb: 2
                                        }}
                                    >
                                        <PersonIcon sx={{ fontSize: 60 }} />
                                    </Avatar>
                                    {user?.subscription && (
                                        <VerifiedIcon
                                            sx={{
                                                position: 'absolute',
                                                bottom: 16,
                                                right: -8,
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                color: 'primary.main',
                                                fontSize: 32
                                            }}
                                        />
                                    )}
                                </Box>

                                <Typography variant='h5' sx={{ fontWeight: 600, mb: 1 }}>
                                    {user?.name || 'User'}
                                </Typography>

                                <Typography variant='body2' sx={{ opacity: 0.95, mb: 2, fontWeight: 500 }}>
                                    {user?.email}
                                </Typography>

                                {/* Role Chips */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                    {user?.roles?.map((role, index) => (
                                        <Chip
                                            key={index}
                                            icon={getRoleIcon(role)}
                                            label={role}
                                            color={getRoleColor(role)}
                                            variant='filled'
                                            sx={{
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                color: 'white',
                                                fontWeight: 600,
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                '& .MuiChip-icon': {
                                                    color: 'white'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Information Cards */}
                    <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Account Information */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Box display='flex' alignItems='center' mb={2}>
                                    <PersonIcon color='primary' sx={{ mr: 1 }} />
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Account Information
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: 'grey.100',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'grey.200'
                                            }}
                                        >
                                            <Box display='flex' alignItems='center' mb={1}>
                                                <EmailIcon fontSize='small' sx={{ mr: 1, color: 'primary.main' }} />
                                                <Typography
                                                    variant='caption'
                                                    sx={{ color: 'grey.600', textTransform: 'uppercase', fontWeight: 700 }}
                                                >
                                                    Email Address
                                                </Typography>
                                            </Box>
                                            <Typography variant='body1' sx={{ fontWeight: 600, color: 'grey.900' }}>
                                                {user?.email || 'Not provided'}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box
                                            sx={{
                                                p: 2,
                                                backgroundColor: 'grey.100',
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'grey.200'
                                            }}
                                        >
                                            <Box display='flex' alignItems='center' mb={1}>
                                                <PersonIcon fontSize='small' sx={{ mr: 1, color: 'primary.main' }} />
                                                <Typography
                                                    variant='caption'
                                                    sx={{ color: 'grey.600', textTransform: 'uppercase', fontWeight: 700 }}
                                                >
                                                    Display Name
                                                </Typography>
                                            </Box>
                                            <Typography variant='body1' sx={{ fontWeight: 600, color: 'grey.900' }}>
                                                {user?.name || user?.email?.split('@')[0] || 'User'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Organization Information */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Box display='flex' alignItems='center' mb={2}>
                                    <BusinessIcon color='primary' sx={{ mr: 1 }} />
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Organization
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        p: 2,
                                        backgroundColor: 'grey.100',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.200'
                                    }}
                                >
                                    <Typography variant='h6' sx={{ fontWeight: 700, mb: 1, color: 'grey.900' }}>
                                        {user?.org_name || 'No Organization'}
                                    </Typography>
                                    <Typography variant='body2' sx={{ color: 'grey.600', fontWeight: 600 }}>
                                        {user?.org_name ? 'Organization Member' : 'Individual Account'}
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Subscription Status */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Box display='flex' alignItems='center' mb={2}>
                                    <VerifiedIcon color='primary' sx={{ mr: 1 }} />
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Subscription Status
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        p: 2,
                                        backgroundColor: user?.subscription ? '#e8f5e8' : 'grey.100',
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: user?.subscription ? '#c8e6c9' : 'grey.200'
                                    }}
                                >
                                    <Typography
                                        variant='body1'
                                        sx={{
                                            fontWeight: 700,
                                            color: user?.subscription ? '#2e7d32' : 'grey.900'
                                        }}
                                    >
                                        {user?.subscription ? 'Premium Plan Active' : 'Free Plan'}
                                    </Typography>
                                    <Typography
                                        variant='body2'
                                        sx={{
                                            color: user?.subscription ? '#388e3c' : 'grey.600',
                                            fontWeight: 600
                                        }}
                                    >
                                        {user?.subscription
                                            ? 'Enjoy unlimited access to all features'
                                            : 'Upgrade to premium for enhanced features'}
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Integrations Section */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <Box display='flex' alignItems='center' mb={2}>
                                    <IntegrationIcon color='primary' sx={{ mr: 1 }} />
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Available Integrations
                                    </Typography>
                                </Box>

                                {integrationsError && (
                                    <Alert severity='error' sx={{ mb: 2 }}>
                                        {integrationsError}
                                    </Alert>
                                )}

                                {integrationsLoading ? (
                                    <Box display='flex' justifyContent='center' alignItems='center' py={4}>
                                        <CircularProgress />
                                    </Box>
                                ) : integrations.length === 0 ? (
                                    <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            No integrations are currently enabled for your organization.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ p: 0 }}>
                                        {integrations.map((integration, index) => (
                                            <ListItem
                                                key={integration.credentialName}
                                                sx={{
                                                    px: 0,
                                                    py: 1,
                                                    borderBottom: index < integrations.length - 1 ? '1px solid' : 'none',
                                                    borderColor: 'grey.200'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'white',
                                                            border: '1px solid',
                                                            borderColor: 'grey.200',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <img
                                                            style={{
                                                                width: '70%',
                                                                height: '70%',
                                                                objectFit: 'contain'
                                                            }}
                                                            alt={integration.credentialName}
                                                            src={`${baseURL}/api/v1/components-credentials-icon/${integration.credentialName}`}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.onerror = null
                                                                target.src = keySVG
                                                            }}
                                                        />
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant='body1' sx={{ fontWeight: 600, color: 'grey.900' }}>
                                                            {parser(integration.label)}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant='body2' sx={{ color: 'grey.600' }}>
                                                            {integration.description
                                                                ? parser(integration.description)
                                                                : `${integration.credentialName} integration`}
                                                        </Typography>
                                                    }
                                                />
                                                <Button
                                                    variant='outlined'
                                                    size='small'
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddCredential(integration.credentialName)}
                                                    sx={{
                                                        minWidth: 120,
                                                        textTransform: 'none',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    Add Credential
                                                </Button>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Credential Modal */}
            <CredentialCreationModal open={showCredentialModal} onClose={handleCredentialModalClose} integration={selectedIntegration} />
        </Container>
    )
}

export default Profile
