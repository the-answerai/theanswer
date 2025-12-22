'use client'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'

import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'

import Delete from '@mui/icons-material/Delete'
import Person from '@mui/icons-material/Person'
import Business from '@mui/icons-material/Business'
import Workspaces from '@mui/icons-material/Workspaces'
import Security from '@mui/icons-material/Security'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Star from '@mui/icons-material/Star'
import Settings from '@mui/icons-material/Settings'
import Add from '@mui/icons-material/Add'
import Info from '@mui/icons-material/Info'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { User, AppSettings, ContextField } from 'types'
import { PlanCard } from './PlanCard'

interface AssignedWorkspace {
    id: string
    name: string
    role: string
    organizationId: string
}

interface EnrichedUser extends Partial<User> {
    // User identity
    id?: string
    email?: string
    name?: string
    auth0Id?: string

    // User status
    status?: string
    isSSO?: boolean
    lastLogin?: string

    // Roles and permissions
    role?: string
    roles?: string[]
    permissions?: string[]

    // Organization context
    organizationId?: string
    activeOrganizationId?: string
    isOrganizationAdmin?: boolean
    org_name?: string

    // Workspace context
    activeWorkspaceId?: string
    activeWorkspace?: string
    roleId?: string
    assignedWorkspaces?: AssignedWorkspace[]

    // Subscription
    features?: Record<string, string>
    activeOrganizationSubscriptionId?: string
    activeOrganizationCustomerId?: string
    activeOrganizationProductId?: string
    stripeCustomerId?: string

    // AAI-specific
    defaultChatflowId?: string
    chatflowDomain?: string
    contextFields?: ContextField[]
}

interface ContextFieldInput extends Partial<ContextField> {}
interface OrgInput
    extends Omit<
        User,
        'role' | 'name' | 'emailVerified' | 'invited' | 'image' | 'appSettings' | 'image' | 'isFavoriteByDefault' | 'contextFields'
    > {
    contextFields: ContextFieldInput[]
    [key: string]: any
}

const UserProfile = ({ appSettings: _appSettings, user }: { appSettings?: AppSettings; user?: EnrichedUser }) => {
    const router = useRouter()
    const [_loading, setLoading] = useState(false)
    const [_error, setError] = useState<string | null>(null)

    const {
        handleSubmit,
        control,
        setValue,
        register,
        reset,
        formState: { isDirty, touchedFields, errors }
    } = useForm<OrgInput>({
        defaultValues: {
            ...user,
            contextFields: user?.contextFields || []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'contextFields'
    })

    if (!user) return null

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleString()
    }

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success'
            case 'invited':
                return 'warning'
            case 'unverified':
                return 'info'
            default:
                return 'default'
        }
    }

    const handleAddNewField = () => {
        append({
            fieldId: '',
            fieldType: '',
            fieldTextValue: '',
            helpText: ''
        })
    }

    const onSubmit = async (data: OrgInput) => {
        setLoading(true)
        // Could check dirtyFields here, but the contextField array doesn't trigger it unless a new field is added
        const changedFields = Object.keys({ ...touchedFields })

        // Always include ID
        const formData: Partial<OrgInput> = {
            id: data.id
        }

        for (const field of changedFields) {
            formData[field as keyof OrgInput] = data[field]
        }

        try {
            await axios.patch(`/api/users`, { ...formData })
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
            reset()
        }
    }
    const handleDeleteField = (index: number) => {
        remove(index)
    }
    const handleCancel = () => {
        reset()
    }
    return (
        <Box p={8}>
            <Typography variant='h2' component='h1'>
                User Profile
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* User Info Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                            <Person sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant='h5'>{user.name || 'Unknown User'}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {user.email}
                            </Typography>
                        </Box>
                        {user.status && (
                            <Chip label={user.status} color={getStatusColor(user.status) as any} size='small' sx={{ ml: 'auto' }} />
                        )}
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant='caption' color='text.secondary'>
                                User ID
                            </Typography>
                            <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {user.id}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant='caption' color='text.secondary'>
                                Last Login
                            </Typography>
                            <Typography variant='body2'>{formatDate(user.lastLogin)}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant='caption' color='text.secondary'>
                                SSO Enabled
                            </Typography>
                            <Typography variant='body2'>{user.isSSO ? 'Yes' : 'No'}</Typography>
                        </Grid>
                        {user.defaultChatflowId && (
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant='caption' color='text.secondary'>
                                    Default Chatflow
                                </Typography>
                                <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {user.defaultChatflowId}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Organization Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                        <Business color='primary' />
                        <Typography variant='h6'>Organization</Typography>
                        {user.isOrganizationAdmin && (
                            <Chip label='Admin' color='primary' size='small' icon={<Star sx={{ fontSize: 16 }} />} />
                        )}
                    </Stack>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant='caption' color='text.secondary'>
                                Organization Name
                            </Typography>
                            <Typography variant='body2'>{user.org_name || 'Default Organization'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant='caption' color='text.secondary'>
                                Organization ID
                            </Typography>
                            <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {user.organizationId || user.activeOrganizationId}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant='caption' color='text.secondary'>
                                Role
                            </Typography>
                            <Typography variant='body2'>{user.role || 'Member'}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Workspaces Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                        <Workspaces color='primary' />
                        <Typography variant='h6'>Workspaces</Typography>
                        {user.assignedWorkspaces && user.assignedWorkspaces.length > 0 && (
                            <Chip label={`${user.assignedWorkspaces.length} assigned`} size='small' variant='outlined' />
                        )}
                    </Stack>

                    {user.assignedWorkspaces && user.assignedWorkspaces.length > 0 ? (
                        <List dense>
                            {user.assignedWorkspaces.map((ws) => (
                                <ListItem
                                    key={ws.id}
                                    sx={{
                                        bgcolor: ws.id === user.activeWorkspaceId ? 'action.selected' : 'transparent',
                                        borderRadius: 1,
                                        mb: 0.5
                                    }}
                                >
                                    <ListItemIcon>
                                        {ws.id === user.activeWorkspaceId ? <CheckCircle color='success' /> : <Workspaces color='action' />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={ws.name}
                                        secondary={
                                            <Stack direction='row' spacing={1} alignItems='center'>
                                                <Chip label={ws.role} size='small' variant='outlined' />
                                                {ws.id === user.activeWorkspaceId && (
                                                    <Typography variant='caption' color='success.main'>
                                                        Active
                                                    </Typography>
                                                )}
                                            </Stack>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Alert
                            severity='info'
                            icon={<Info />}
                            action={
                                <Button color='inherit' size='small' href='/settings/organization' startIcon={<Settings />}>
                                    Manage Workspaces
                                </Button>
                            }
                        >
                            <AlertTitle>No workspaces assigned</AlertTitle>
                            You are not currently assigned to any workspaces. Contact your organization administrator to request workspace
                            access.
                        </Alert>
                    )}

                    {user.activeWorkspaceId && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant='caption' color='text.secondary'>
                                        Active Workspace ID
                                    </Typography>
                                    <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {user.activeWorkspaceId}
                                    </Typography>
                                </Grid>
                                {user.activeWorkspace && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Active Workspace Name
                                        </Typography>
                                        <Typography variant='body2'>{user.activeWorkspace}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Roles & Permissions Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                        <Security color='primary' />
                        <Typography variant='h6'>Roles & Permissions</Typography>
                    </Stack>

                    {user.roles?.length || user.permissions?.length ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant='subtitle2' gutterBottom>
                                    Roles
                                </Typography>
                                {user.roles && user.roles.length > 0 ? (
                                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                        {user.roles.map((role, idx) => (
                                            <Chip key={idx} label={role} size='small' color='primary' variant='outlined' />
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant='body2' color='text.secondary'>
                                        No roles assigned
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant='subtitle2' gutterBottom>
                                    Permissions
                                </Typography>
                                {user.permissions && user.permissions.length > 0 ? (
                                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                        {user.permissions.slice(0, 10).map((perm, idx) => (
                                            <Chip
                                                key={idx}
                                                label={perm}
                                                size='small'
                                                variant='outlined'
                                                sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                            />
                                        ))}
                                        {user.permissions.length > 10 && (
                                            <Chip label={`+${user.permissions.length - 10} more`} size='small' variant='outlined' />
                                        )}
                                    </Stack>
                                ) : (
                                    <Typography variant='body2' color='text.secondary'>
                                        No explicit permissions
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    ) : (
                        <Alert
                            severity='info'
                            icon={<Info />}
                            action={
                                <Button color='inherit' size='small' href='/settings/organization' startIcon={<Settings />}>
                                    Manage Roles
                                </Button>
                            }
                        >
                            <AlertTitle>No roles or permissions configured</AlertTitle>
                            Your roles and permissions have not been configured yet. Contact your organization administrator to set up your
                            access.
                        </Alert>
                    )}

                    {user.roleId && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant='caption' color='text.secondary'>
                                Role ID
                            </Typography>
                            <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {user.roleId}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
                        <Star color='primary' />
                        <Typography variant='h6'>Subscription & Features</Typography>
                    </Stack>

                    <PlanCard />

                    {user.features && Object.keys(user.features).length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant='subtitle2' gutterBottom>
                                Enabled Features
                            </Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                {Object.entries(user.features)
                                    .filter(([_, value]) => value === 'true')
                                    .map(([feature]) => (
                                        <Chip
                                            key={feature}
                                            label={feature.replace(/_/g, ' ')}
                                            size='small'
                                            color='success'
                                            variant='outlined'
                                            icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                        />
                                    ))}
                            </Stack>
                        </Box>
                    ) : (
                        <Alert
                            severity='info'
                            sx={{ mt: 2 }}
                            icon={<Info />}
                            action={
                                <Button color='inherit' size='small' href='/pricing' startIcon={<Add />}>
                                    View Plans
                                </Button>
                            }
                        >
                            <AlertTitle>No features enabled</AlertTitle>
                            Upgrade your subscription to unlock additional features and capabilities.
                        </Alert>
                    )}

                    {(user.activeOrganizationSubscriptionId || user.stripeCustomerId) && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                                {user.activeOrganizationSubscriptionId && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Subscription ID
                                        </Typography>
                                        <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {user.activeOrganizationSubscriptionId}
                                        </Typography>
                                    </Grid>
                                )}
                                {user.stripeCustomerId && (
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant='caption' color='text.secondary'>
                                            Customer ID
                                        </Typography>
                                        <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {user.stripeCustomerId}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />

            {/* User Variables Section (Existing) */}
            <Box>
                <Typography variant='h6' gutterBottom>
                    User Variables
                </Typography>
            </Box>

            <Box component='form' onSubmit={handleSubmit(onSubmit)}>
                <Grid container direction='row' rowSpacing={4} columnSpacing={4}>
                    <Grid item sm={12} sx={{ textAlign: 'right' }}>
                        <Button variant='outlined' onClick={handleAddNewField}>
                            Add New Field
                        </Button>
                    </Grid>
                    <Grid item sm={12}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Help Text</TableCell>
                                        <TableCell>Field Text Value</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.fieldId}>
                                            <TableCell sx={{ width: '20%' }}>
                                                <TextField
                                                    {...register(`contextFields.${index}.fieldId`, {
                                                        required: true
                                                    })}
                                                    onChange={(e) => {
                                                        const updatedFields = [...fields]
                                                        updatedFields[index].fieldId = e.target.value
                                                        setValue(`contextFields.${index}.fieldId`, e.target.value)
                                                    }}
                                                    label='Field ID'
                                                    required
                                                    placeholder='Enter a Field ID that will be used to reference this field in your Sidekicks.'
                                                    multiline
                                                    rows={3}
                                                    fullWidth
                                                    size='small'
                                                    error={Boolean(errors.contextFields?.[index]?.fieldId)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '30%' }}>
                                                <TextField
                                                    {...register(`contextFields.${index}.helpText`, {
                                                        required: true
                                                    })}
                                                    onChange={(e) => {
                                                        const updatedFields = [...fields]
                                                        updatedFields[index].helpText = e.target.value
                                                        setValue(`contextFields.${index}.helpText`, e.target.value)
                                                    }}
                                                    label='Field Help Text'
                                                    placeholder='Enter help text that will allow users to understand how this field could be used.'
                                                    multiline
                                                    rows={3}
                                                    fullWidth
                                                    size='small'
                                                    error={Boolean(errors.contextFields?.[index]?.helpText)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '40%' }}>
                                                <TextField
                                                    {...register(`contextFields.${index}.fieldTextValue`, {
                                                        required: true
                                                    })}
                                                    onChange={(e) => {
                                                        const updatedFields = [...fields]
                                                        updatedFields[index].fieldTextValue = e.target.value
                                                        setValue(`contextFields.${index}.fieldTextValue`, e.target.value)
                                                    }}
                                                    label='Field Value'
                                                    required
                                                    placeholder='Enter the value that will be returned when the Field ID is referenced in a Sidekick.'
                                                    multiline
                                                    rows={3}
                                                    fullWidth
                                                    size='small'
                                                    error={Boolean(errors.contextFields?.[index]?.fieldTextValue)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '10%' }}>
                                                <IconButton onClick={() => handleDeleteField(index)}>
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item sm={12} sx={{ textAlign: 'right' }}>
                        <Button variant='outlined' onClick={handleAddNewField}>
                            Add New Field
                        </Button>
                    </Grid>
                </Grid>
                {/* Need to check both because the context fields don't trigger dirtyFields unless a new one is added */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant='contained' type='submit'>
                        Save User
                    </Button>
                    <Button disabled={!isDirty} color='error' variant='outlined' onClick={handleCancel}>
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default UserProfile
