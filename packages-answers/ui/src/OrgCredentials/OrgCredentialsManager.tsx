'use client'
import React, { useState, useEffect } from 'react'
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Box,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Switch,
    Collapse,
    IconButton,
    TextField,
    Tooltip
} from '@mui/material'
import {
    Settings as SettingsIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material'
import { EnabledIntegration, OrganizationCredentialEnvironmentVariable } from 'types'

// API
// @ts-ignore
import credentialsApi from '@/api/credentials'

// Hooks
// @ts-ignore
import useApi from '@/hooks/useApi'

// Constants
// @ts-ignore
import { baseURL } from '@/store/constant'
// @ts-ignore
import keySVG from '@/assets/images/key.svg'

interface ComponentCredential {
    name: string
    label: string
    description?: string
    category?: string
    iconSrc?: string
}

const OrgCredentialsManager: React.FC = () => {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [integrations, setIntegrations] = useState<EnabledIntegration[]>([])
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

    // Use the same API hooks as the existing credential system
    const getAllComponentsCredentialsApi = useApi(credentialsApi.getAllComponentsCredentials)

    // Fetch current org credentials settings
    const fetchOrgCredentials = async () => {
        try {
            const response = await fetch('/api/admin/org-credentials')
            if (!response.ok) {
                throw new Error('Failed to fetch org credentials')
            }
            const data = await response.json()
            setIntegrations(data.integrations || [])
        } catch (err: any) {
            setError(err.message)
        }
    }

    useEffect(() => {
        fetchOrgCredentials()
        getAllComponentsCredentialsApi.request()
    }, [])

    const handleToggleIntegration = async (credentialName: string, enabled: boolean) => {
        try {
            setSaving(true)

            let updatedIntegrations: EnabledIntegration[]

            if (enabled) {
                // Find the credential info from available credentials
                const credentialInfo = getAllComponentsCredentialsApi.data?.find((c: any) => c.name === credentialName)
                if (!credentialInfo) return

                // Add to enabled integrations
                const newIntegration: EnabledIntegration = {
                    credentialName,
                    label: credentialInfo.label,
                    description: credentialInfo.description,
                    enabled: true,
                    environmentVariables: [],
                    organizationCredentialIds: []
                }

                updatedIntegrations = [...integrations.filter((i) => i.credentialName !== credentialName), newIntegration]
            } else {
                // Update existing integration to disabled
                updatedIntegrations = integrations.map((i) => (i.credentialName === credentialName ? { ...i, enabled: false } : i))
            }

            const response = await fetch('/api/admin/org-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ integrations: updatedIntegrations })
            })

            if (!response.ok) {
                throw new Error('Failed to update integrations')
            }

            const data = await response.json()
            setIntegrations(data.integrations)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleExpandCard = (credentialName: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(credentialName)) {
                newSet.delete(credentialName)
            } else {
                newSet.add(credentialName)
            }
            return newSet
        })
    }

    const handleAddEnvironmentVariable = (credentialName: string) => {
        const updatedIntegrations = integrations.map((integration) => {
            if (integration.credentialName === credentialName) {
                const newVar: OrganizationCredentialEnvironmentVariable = {
                    key: '',
                    value: '',
                    description: ''
                }
                return {
                    ...integration,
                    environmentVariables: [...(integration.environmentVariables || []), newVar]
                }
            }
            return integration
        })
        setIntegrations(updatedIntegrations)
    }

    const handleUpdateEnvironmentVariable = (
        credentialName: string,
        index: number,
        field: keyof OrganizationCredentialEnvironmentVariable,
        value: string
    ) => {
        const updatedIntegrations = integrations.map((integration) => {
            if (integration.credentialName === credentialName && integration.environmentVariables) {
                const updatedVars = [...integration.environmentVariables]
                updatedVars[index] = { ...updatedVars[index], [field]: value }
                return { ...integration, environmentVariables: updatedVars }
            }
            return integration
        })
        setIntegrations(updatedIntegrations)
    }

    const handleDeleteEnvironmentVariable = (credentialName: string, index: number) => {
        const updatedIntegrations = integrations.map((integration) => {
            if (integration.credentialName === credentialName && integration.environmentVariables) {
                const updatedVars = integration.environmentVariables.filter((_, i) => i !== index)
                return { ...integration, environmentVariables: updatedVars }
            }
            return integration
        })
        setIntegrations(updatedIntegrations)
    }

    const getIntegrationStatus = (credentialName: string): boolean => {
        const integration = integrations.find((i) => i.credentialName === credentialName)
        return integration ? integration.enabled : false
    }

    const getIntegrationDetails = (credentialName: string): EnabledIntegration | undefined => {
        return integrations.find((i) => i.credentialName === credentialName)
    }

    const groupCredentialsByCategory = (credentials: ComponentCredential[]) => {
        const groups: { [key: string]: ComponentCredential[] } = {}
        credentials.forEach((cred) => {
            const category = cred.category || 'Other'
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(cred)
        })
        return groups
    }

    if (getAllComponentsCredentialsApi.loading) {
        return (
            <Container>
                <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    // Transform the API data to include category and icon info
    const availableCredentials: ComponentCredential[] =
        getAllComponentsCredentialsApi.data?.map((cred: any) => ({
            name: cred.name,
            label: cred.label,
            description: cred.description,
            category: 'Integration', // Default category since the API doesn't provide categories
            iconSrc: `${baseURL}/api/v1/components-credentials-icon/${cred.name}`
        })) || []

    const groupedCredentials = groupCredentialsByCategory(availableCredentials)

    return (
        <Container maxWidth='lg'>
            <Box py={3}>
                <Box display='flex' alignItems='center' mb={3}>
                    <SettingsIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant='h4' component='h1'>
                        Organization Credentials
                    </Typography>
                </Box>

                <Typography variant='body1' color='text.secondary' mb={3}>
                    Control which credential integrations are available to users in your organization. Only enabled integrations will appear
                    in the credential selection dialog.
                </Typography>

                {error && (
                    <Alert severity='error' sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {Object.entries(groupedCredentials).map(([category, categoryCredentials]) => (
                    <Card key={category} sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant='h6' sx={{ mb: 2 }}>
                                {category}
                            </Typography>

                            <List>
                                {categoryCredentials.map((credential) => {
                                    const isEnabled = getIntegrationStatus(credential.name)
                                    const integrationDetails = getIntegrationDetails(credential.name)
                                    const isExpanded = expandedCards.has(credential.name)

                                    return (
                                        <Box key={credential.name}>
                                            <ListItem divider>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white',
                                                        mr: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <img
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            padding: 6,
                                                            borderRadius: '50%',
                                                            objectFit: 'contain'
                                                        }}
                                                        alt={credential.name}
                                                        src={credential.iconSrc}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.onerror = null
                                                            target.style.padding = '5px'
                                                            target.src = keySVG
                                                        }}
                                                    />
                                                </Box>
                                                <ListItemText primary={credential.label} secondary={credential.name} />
                                                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {isEnabled && (
                                                        <Tooltip title='Configure integration settings'>
                                                            <IconButton
                                                                edge='end'
                                                                onClick={() => handleExpandCard(credential.name)}
                                                                sx={{ mr: 1 }}
                                                            >
                                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Switch
                                                        edge='end'
                                                        checked={isEnabled}
                                                        onChange={(e) => handleToggleIntegration(credential.name, e.target.checked)}
                                                        disabled={saving}
                                                    />
                                                </ListItemSecondaryAction>
                                            </ListItem>

                                            {/* Expandable configuration section */}
                                            {isEnabled && integrationDetails && (
                                                <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                                                    <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                                                        <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 'bold' }}>
                                                            Organization Settings
                                                        </Typography>

                                                        {/* Environment Variables Section */}
                                                        <Box sx={{ mb: 3 }}>
                                                            <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
                                                                <Typography variant='body2' fontWeight='medium'>
                                                                    Environment Variables
                                                                </Typography>
                                                                <Button
                                                                    size='small'
                                                                    variant='outlined'
                                                                    startIcon={<AddIcon />}
                                                                    onClick={() => handleAddEnvironmentVariable(credential.name)}
                                                                >
                                                                    Add Variable
                                                                </Button>
                                                            </Box>

                                                            {integrationDetails.environmentVariables?.map((envVar, index) => (
                                                                <Box
                                                                    key={index}
                                                                    sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}
                                                                >
                                                                    <TextField
                                                                        size='small'
                                                                        label='Key'
                                                                        value={envVar.key}
                                                                        onChange={(e) =>
                                                                            handleUpdateEnvironmentVariable(
                                                                                credential.name,
                                                                                index,
                                                                                'key',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        sx={{ flex: 1 }}
                                                                    />
                                                                    <TextField
                                                                        size='small'
                                                                        label='Value'
                                                                        type='password'
                                                                        value={envVar.value}
                                                                        onChange={(e) =>
                                                                            handleUpdateEnvironmentVariable(
                                                                                credential.name,
                                                                                index,
                                                                                'value',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        sx={{ flex: 1 }}
                                                                    />
                                                                    <TextField
                                                                        size='small'
                                                                        label='Description (optional)'
                                                                        value={envVar.description || ''}
                                                                        onChange={(e) =>
                                                                            handleUpdateEnvironmentVariable(
                                                                                credential.name,
                                                                                index,
                                                                                'description',
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        sx={{ flex: 1 }}
                                                                    />
                                                                    <IconButton
                                                                        size='small'
                                                                        color='error'
                                                                        onClick={() =>
                                                                            handleDeleteEnvironmentVariable(credential.name, index)
                                                                        }
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            ))}

                                                            {(!integrationDetails.environmentVariables ||
                                                                integrationDetails.environmentVariables.length === 0) && (
                                                                <Typography
                                                                    variant='body2'
                                                                    color='text.secondary'
                                                                    sx={{ fontStyle: 'italic' }}
                                                                >
                                                                    No environment variables configured
                                                                </Typography>
                                                            )}
                                                        </Box>

                                                        {/* Organization Credentials Section */}
                                                        <Box>
                                                            <Typography variant='body2' fontWeight='medium' sx={{ mb: 1 }}>
                                                                Organization Shared Credentials
                                                            </Typography>
                                                            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                                                                Create shared credentials that can be used across your organization
                                                            </Typography>
                                                            <Button
                                                                size='small'
                                                                variant='outlined'
                                                                startIcon={<AddIcon />}
                                                                disabled // TODO: Implement organization credential creation
                                                            >
                                                                Add Shared Credential (Coming Soon)
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Collapse>
                                            )}
                                        </Box>
                                    )
                                })}
                            </List>
                        </CardContent>
                    </Card>
                ))}

                {availableCredentials.length === 0 && (
                    <Card>
                        <CardContent>
                            <Typography variant='body1' color='text.secondary' textAlign='center' py={4}>
                                No credential integrations available.
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Container>
    )
}

export default OrgCredentialsManager
