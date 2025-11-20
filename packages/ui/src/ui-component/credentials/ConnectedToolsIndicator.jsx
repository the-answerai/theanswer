import { Box, Avatar, Tooltip } from '@mui/material'
import { IconCheck } from '@tabler/icons-react'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import PropTypes from 'prop-types'
import { baseURL } from '@/store/constant'
import { getGlassStyle } from './glassmorphismStyles'

/**
 * Connected Tools Indicator - Shows all tools, models, and credentials
 * Displays chat models, tools, and credentials with status indicators
 */
const ConnectedToolsIndicator = ({ credentials = [], flowData = null, onClick }) => {
    const theme = useTheme()
    // Use theme.palette.mode directly - it's always in sync with color scheme changes
    const isDarkMode = theme.palette.mode === 'dark'
    const [imageErrors, setImageErrors] = useState({})

    // Extract all items to display: chat models, tools, and credentials
    const extractDisplayItems = () => {
        const items = []

        // Parse flowData to extract models and tools
        if (flowData) {
            try {
                const parsedFlow = typeof flowData === 'string' ? JSON.parse(flowData) : flowData
                const nodes = parsedFlow.nodes || []

                // Extract Chat Models
                const chatModels = nodes.filter((node) => node.data?.category === 'Chat Models')
                chatModels.forEach((node) => {
                    items.push({
                        type: 'model',
                        name: node.data.name,
                        label: node.data.label || node.data.name,
                        icon: node.data.name, // Use node name for icon lookup
                        isConnected: true // Models in flow are considered connected
                    })
                })

                // Extract Tools (excluding internal/sticky notes)
                const tools = nodes.filter(
                    (node) =>
                        node.data?.category === 'Tools' && node.data?.name !== 'stickyNoteAgentflow' && node.data?.name !== 'stickyNote'
                )
                tools.forEach((node) => {
                    items.push({
                        type: 'tool',
                        name: node.data.name,
                        label: node.data.label || node.data.name,
                        icon: node.data.name,
                        isConnected: true
                    })
                })

                // Also extract Embeddings models (like for vector stores)
                const embeddingModels = nodes.filter((node) => node.data?.category === 'Embeddings')
                embeddingModels.forEach((node) => {
                    items.push({
                        type: 'embedding',
                        name: node.data.name,
                        label: node.data.label || node.data.name,
                        icon: node.data.name,
                        isConnected: true
                    })
                })
            } catch (error) {
                console.error('Error parsing flowData:', error)
            }
        }

        // Extract credentials
        credentials.forEach((cred) => {
            items.push({
                type: 'credential',
                name: cred.credentialType,
                label: cred.label,
                icon: cred.credentialType,
                isConnected: cred.isAssigned
            })
        })

        // Deduplicate by icon/name
        const uniqueItems = items.reduce((acc, item) => {
            if (!acc.find((i) => i.icon === item.icon)) {
                acc.push(item)
            }
            return acc
        }, [])

        return uniqueItems
    }

    const displayItems = extractDisplayItems()
    const maxVisible = 6
    const visibleItems = displayItems.slice(0, maxVisible)
    const remainingCount = displayItems.length - maxVisible

    // If no items at all, don't render anything
    if (displayItems.length === 0) {
        return null
    }

    // Helper function to get icon URL based on item type
    const getIconUrl = (item) => {
        if (item.type === 'credential') {
            return `${baseURL}/api/v1/components-credentials-icon/${item.icon}`
        }
        // For models and tools, use the node icon endpoint
        return `${baseURL}/api/v1/node-icon/${item.icon}`
    }

    return (
        <Box
            sx={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0,
                mr: 2,
                height: 40 // Match the header button height
            }}
        >
            {/* Connected tools display - all clickable */}
            <Box
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 0,
                    p: 0.5,
                    borderRadius: '20px',
                    ...getGlassStyle('glassContainer', isDarkMode),
                    transition: 'all 0.2s ease',
                    height: '100%',
                    flexShrink: 0,
                    cursor: onClick ? 'pointer' : 'default',
                    '&:hover': onClick ? getGlassStyle('glassHover', isDarkMode) : {}
                }}
                onClick={onClick}
            >
                {/* Render visible items with overlap */}
                {visibleItems.map((item, index) => {
                    const iconUrl = getIconUrl(item)

                    return (
                        <Tooltip
                            key={`${item.type}-${item.icon}-${index}`}
                            title={`${item.label}${item.isConnected ? ' (Connected)' : ''}`}
                            arrow
                        >
                            <Box
                                sx={{
                                    marginLeft: index > 0 ? '-8px' : 0,
                                    zIndex: visibleItems.length - index,
                                    position: 'relative',
                                    pointerEvents: 'none' // Let parent handle clicks
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        border: `2px solid ${theme.palette.background.paper}`,
                                        bgcolor: imageErrors[item.icon] ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.9)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        transition: 'transform 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        fontSize: imageErrors[item.icon] ? '0.65rem' : 'inherit',
                                        fontWeight: imageErrors[item.icon] ? 600 : 'inherit',
                                        color: imageErrors[item.icon] ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            zIndex: visibleItems.length + 1
                                        }
                                    }}
                                >
                                    {imageErrors[item.icon] ? (
                                        // Show initials fallback
                                        item.label
                                            .split(' ')
                                            .map((word) => word[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)
                                    ) : (
                                        <img
                                            src={iconUrl}
                                            alt={item.label}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                padding: '4px',
                                                objectFit: 'contain'
                                            }}
                                            onError={() => {
                                                // Fallback to initials on error (React way)
                                                setImageErrors((prev) => ({ ...prev, [item.icon]: true }))
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Green checkmark indicator for connected items */}
                                {item.isConnected && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: -2,
                                            right: -2,
                                            width: 14,
                                            height: 14,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette.success.main,
                                            border: `2px solid ${theme.palette.background.paper}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <IconCheck size={10} color='white' strokeWidth={3} />
                                    </Box>
                                )}
                            </Box>
                        </Tooltip>
                    )
                })}

                {/* +N indicator for remaining tools */}
                {remainingCount > 0 && (
                    <Tooltip title={`${remainingCount} more tool${remainingCount > 1 ? 's' : ''}`} arrow>
                        <Box
                            sx={{
                                marginLeft: '-8px',
                                zIndex: 0
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 28,
                                    height: 28,
                                    border: `2px solid ${theme.palette.background.paper}`,
                                    bgcolor: theme.palette.secondary.main,
                                    color: theme.palette.secondary.contrastText,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            >
                                +{remainingCount}
                            </Avatar>
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </Box>
    )
}

ConnectedToolsIndicator.propTypes = {
    credentials: PropTypes.arrayOf(
        PropTypes.shape({
            credentialType: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            isAssigned: PropTypes.bool.isRequired
        })
    ),
    flowData: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    onClick: PropTypes.func
}

export default ConnectedToolsIndicator
