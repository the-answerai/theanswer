'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import credentialsApi from 'flowise-ui/src/api/credentials'

// Use core Flowise dialog with defaultVisibility prop for org-wide credentials
const AddEditCredentialDialog = dynamic(() => import('flowise-ui/src/views/credentials/AddEditCredentialDialog'), { ssr: false })

interface MasterConfigProps {
    config: any
    onConfigChange: (updates: Partial<any>) => void
}

interface Credential {
    id: string
    name: string
    credentialName: string
}

export default function MasterConfig({ config, onConfigChange }: MasterConfigProps) {
    const [enabled, setEnabled] = useState<boolean>(config?.enabled ?? false)
    const [selectedCredential, setSelectedCredential] = useState<string>(config?.credentialId ?? '')
    const [credentials, setCredentials] = useState<Credential[]>([])
    const [loadingCredentials, setLoadingCredentials] = useState(true)

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

    const loadCredentials = async () => {
        try {
            setLoadingCredentials(false)
            const response = await credentialsApi.getCredentialsByName('fiddlerApi')
            setCredentials(response.data || [])
        } catch (error) {
            console.error('Failed to load Fiddler credentials:', error)
        } finally {
            setLoadingCredentials(false)
        }
    }

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newEnabled = event.target.checked
        setEnabled(newEnabled)
        onConfigChange({ enabled: newEnabled })
    }

    const handleCredentialChange = (event: any) => {
        const newCredentialId = event.target.value
        setSelectedCredential(newCredentialId)
        onConfigChange({ credentialId: newCredentialId })
    }

    const handleCreateCredential = async () => {
        try {
            // Load the Fiddler credential component schema
            const response = await credentialsApi.getSpecificComponentCredential('fiddlerApi')
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
        }
    }

    const handleCredentialDialogConfirm = (newCredentialId: string) => {
        setShowCredentialDialog(false)

        // Auto-select the newly created credential
        if (newCredentialId) {
            setSelectedCredential(newCredentialId)
            onConfigChange({ credentialId: newCredentialId })

            // Refresh the credentials list
            loadCredentials()
        }
    }

    const handleCredentialDialogCancel = () => {
        setShowCredentialDialog(false)
    }

    // Note: Edit functionality is available in the main Credentials page
    // This page focuses on creating and selecting credentials for guardrails

    // Get the currently selected credential object
    const selectedCredentialObj = credentials.find((cred) => cred.id === selectedCredential)

    return (
        <Box variant='outlined' sx={{ mb: 3 }}>
            {/* Enable/Disable Toggle */}
            <FormControlLabel
                control={<Switch checked={enabled} onChange={handleEnabledChange} color='primary' />}
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {credentials.length > 1 && (
                                <Button variant='outlined' size='small' onClick={() => setShowCredentialDropdown(!showCredentialDropdown)}>
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
                        <Typography variant='body2' sx={{ mb: 1 }}>
                            Select Existing Credential
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {credentials.map((cred) => (
                                <Card
                                    key={cred.id}
                                    variant='outlined'
                                    sx={{
                                        p: 1.5,
                                        cursor: 'pointer',
                                        border: selectedCredential === cred.id ? '2px solid' : '1px solid',
                                        borderColor: selectedCredential === cred.id ? 'primary.main' : 'divider',
                                        '&:hover': {
                                            borderColor: 'primary.light',
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                    onClick={() => {
                                        setSelectedCredential(cred.id)
                                        onConfigChange({ credentialId: cred.id })
                                        setShowCredentialDropdown(false)
                                    }}
                                >
                                    <Typography variant='body2'>{cred.name}</Typography>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Credential Modal - uses core dialog with defaultVisibility enhancement */}
            <AddEditCredentialDialog
                show={showCredentialDialog}
                dialogProps={credentialDialogProps}
                onCancel={handleCredentialDialogCancel}
                onConfirm={handleCredentialDialogConfirm}
            />
        </Box>
    )
}
