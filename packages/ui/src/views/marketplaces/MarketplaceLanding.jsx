'use client'
import { useState, useEffect, forwardRef } from 'react'
import useMarketplaceLanding from '@/hooks/useMarketplaceLanding'
import marketplacesApi from '@/api/marketplaces'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import {
    useTheme,
    Typography,
    Box,
    Chip,
    Tooltip,
    Alert,
    Avatar,
    Divider,
    Menu,
    MenuItem,
    Grid,
    Tabs,
    Tab,
    useMediaQuery
} from '@mui/material'
import { useNavigate } from '@/utils/navigation'
import { IconCopy, IconDownload, IconShare } from '@tabler/icons-react'
import MarketplaceCanvas from './MarketplaceCanvas'
import { StyledButton } from '@/ui-component/button/StyledButton'
import ErrorBoundary from '@/ErrorBoundary'
import { baseURL } from '@/store/constant'
import { Snackbar } from '@mui/material'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useNavigationState } from '@/utils/navigation'

const MarketplaceLanding = forwardRef(function MarketplaceLanding({ templateId }, ref) {
    const navigate = useNavigate()
    const { isLoading, error, template } = useMarketplaceLanding(templateId)
    const { user } = useUser()
    const [, setNavigationState] = useNavigationState()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false)
    const [actionType, setActionType] = useState(null)
    const [isFavorite, setIsFavorite] = useState(false)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [anchorEl, setAnchorEl] = useState(null)
    const [images, setImages] = useState([])
    const [nodeTypes, setNodeTypes] = useState([])
    const [tabValue, setTabValue] = useState(0)
    const customization = useSelector((state) => state.customization)

    useEffect(() => {
        if (user && template) {
            checkFavoriteStatus()
        }
    }, [user, template])

    useEffect(() => {
        if (template && template.flowData) {
            const flowData = JSON.parse(template.flowData)
            const nodes = flowData.nodes || []
            const processedImages = []
            const processedNodeTypes = []
            nodes.forEach((node) => {
                if (['Agents', 'Chains', 'Chat Models', 'Tools', 'Document Loaders'].includes(node.data.category)) {
                    const imageSrc = `${baseURL}/api/v1/node-icon/${node.data.name}`
                    if (!processedImages.includes(imageSrc)) {
                        processedImages.push(imageSrc)
                        processedNodeTypes.push(node.data.label)
                    }
                }
            })
            setImages(processedImages)
            setNodeTypes(processedNodeTypes)
        }
    }, [template])

    const checkFavoriteStatus = async () => {
        try {
            const favorites = await marketplacesApi.getFavorites()
            setIsFavorite(favorites.some((fav) => fav.chatflowId === templateId))
        } catch (error) {
            console.error('Error checking favorite status:', error)
        }
    }

    const toggleFavorite = async () => {
        if (!user) {
            setIsSignInPromptOpen(true)
            return
        }

        try {
            if (isFavorite) {
                await marketplacesApi.removeFavorite(templateId)
                setIsFavorite(false)
                setSnackbarMessage('Removed from favorites')
            } else {
                await marketplacesApi.addFavorite(templateId)
                setIsFavorite(true)
                setSnackbarMessage('Added to favorites')
            }
            setSnackbarOpen(true)
        } catch (error) {
            console.error('Error toggling favorite:', error)
            setSnackbarMessage('Error updating favorites')
            setSnackbarOpen(true)
        }
    }

    const handleAction = async (type) => {
        if (type === 'new') {
            if (!template) return

            const isAgentCanvas = (template.flowData?.nodes || []).some(
                (node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents'
            )

            localStorage.setItem('duplicatedFlowData', JSON.stringify(template.flowData))
            const state = {
                templateData: JSON.stringify(template),
                templateName: template.name,
                parentChatflowId: template.id
            }
            if (!user) {
                const redirectUrl = `/sidekick-studio/${isAgentCanvas ? 'agentcanvas' : 'canvas'}`
                const loginUrl = `/api/auth/login?returnTo=${redirectUrl}`
                setNavigationState(state)
                window.location.href = loginUrl
            } else {
                navigate(`/${isAgentCanvas ? 'agentcanvas' : 'canvas'}`, {
                    state
                })
            }
        } else {
            setActionType(type)
            setIsSignInPromptOpen(true)
        }
    }

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return
        }
        setSnackbarOpen(false)
    }

    const handleExportClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleExportClose = () => {
        setAnchorEl(null)
    }

    const handleExportJSON = () => {
        const flowData = typeof template.flowData === 'string' ? JSON.parse(template.flowData) : template.flowData
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(flowData, null, 2))}`
        const link = document.createElement('a')
        link.href = jsonString
        link.download = `${template.name}.json`
        link.click()
        handleExportClose()
    }

    const encodedDomain = Buffer.from(baseURL).toString('base64')
    const shareUrl = `${window.location.origin}/org/${encodedDomain}/marketplace/${templateId}`

    const handleShare = () => {
        navigator.clipboard.writeText(shareUrl)
        setSnackbarMessage('Share link copied to clipboard')
        setSnackbarOpen(true)
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <ErrorBoundary error={error} />
    if (!template) return <div>Template not found</div>

    const renderTemplateDetails = () => (
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            <Typography variant='h6' gutterBottom fontWeight='bold'>
                About this template
            </Typography>
            <Typography variant='body2' paragraph>
                {template.description}
            </Typography>
            {template.category && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                        Category
                    </Typography>
                    <Chip label={template.category} color='primary' />
                </Box>
            )}
            <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                    Usage Count
                </Typography>
                <Typography variant='body2'>{template.analytic ? JSON.parse(template.analytic).usageCount : 0} times</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                    Created On
                </Typography>
                <Typography variant='body2'>{new Date(template.createdDate).toLocaleDateString()}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                    Requirements
                </Typography>
                {template.apikeyid ? (
                    <Alert severity='warning' sx={{ mt: 1 }}>
                        This flow requires personal API tokens or credentials.
                    </Alert>
                ) : (
                    <Typography variant='body2'>No special requirements</Typography>
                )}
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                    Node Types
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    {images.slice(0, 3).map((img, index) => (
                        <Tooltip key={img} title={nodeTypes[index]} arrow>
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    backgroundColor: customization.isDarkMode ? theme.palette.common.white : theme.palette.grey[300] + 75
                                }}
                            >
                                <img style={{ width: '100%', height: '100%', padding: 5, objectFit: 'contain' }} alt='' src={img} />
                            </Box>
                        </Tooltip>
                    ))}
                    {images.length > 3 && <Typography variant='body2'>+ {images.length - 3} More</Typography>}
                </Box>
            </Box>
            {template.tags && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant='subtitle1' gutterBottom fontWeight='bold'>
                        Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {template.tags.map((tag, index) => (
                            <Chip key={index} label={tag} variant='outlined' size='small' />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    )

    const renderActionButtons = () => (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <StyledButton color='primary' variant='contained' onClick={() => handleAction('new')} startIcon={<IconCopy />}>
                Use as New Flow
            </StyledButton>
            <StyledButton color='secondary' variant='outlined' onClick={handleExportClick} startIcon={<IconDownload />}>
                Download
            </StyledButton>
            <StyledButton color='info' variant='outlined' onClick={handleShare} startIcon={<IconShare />}>
                Share
            </StyledButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleExportClose}>
                <MenuItem onClick={handleExportJSON}>Export as JSON</MenuItem>
            </Menu>
        </Box>
    )

    const renderPreview = () => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant='h6' gutterBottom fontWeight='bold'>
                Preview
            </Typography>
            <Typography variant='body2' paragraph>
                This preview shows the structure of the flow. To use and customize this template, click &quot;Use as New Flow&quot; above.
            </Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 400 }}>
                <MarketplaceCanvas template={template} />
            </Box>
        </Box>
    )

    return (
        <Box
            ref={ref}
            sx={{
                maxWidth: '1080px',
                width: '100%',
                mx: 'auto',
                p: { xs: 2, sm: 3 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        mb: 2
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {template.iconSrc && (
                            <Avatar
                                src={template.iconSrc}
                                alt={template.name}
                                sx={{
                                    width: 35,
                                    height: 35,
                                    borderRadius: '50%'
                                }}
                            />
                        )}
                        <Typography variant='h4' component='h1' gutterBottom fontWeight='bold'>
                            {template.name}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{renderActionButtons()}</Box>
                </Box>
                <Divider />
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
                {isMobile ? (
                    <>
                        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>{tabValue === 0 ? renderTemplateDetails() : renderPreview()}</Box>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant='fullWidth'
                            sx={{
                                position: 'sticky',
                                bottom: 0,
                                bgcolor: 'background.paper',
                                zIndex: 1000,
                                borderTop: 1,
                                borderColor: 'divider'
                            }}
                        >
                            <Tab label='Details' />
                            <Tab label='Preview' />
                        </Tabs>
                    </>
                ) : (
                    <>
                        <Box sx={{ width: '30%', pr: 2, overflowY: 'auto', borderRight: 1, borderColor: 'divider' }}>
                            {renderTemplateDetails()}
                        </Box>
                        <Box sx={{ width: '70%', pl: 2, overflowY: 'auto' }}>{renderPreview()}</Box>
                    </>
                )}
            </Box>
            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose} message={snackbarMessage} />
        </Box>
    )
})

MarketplaceLanding.propTypes = {
    templateId: PropTypes.string.isRequired
}

export default MarketplaceLanding
