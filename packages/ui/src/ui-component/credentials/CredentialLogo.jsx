import { useState } from 'react'
import { Box, Avatar, Tooltip, Typography } from '@mui/material'
import { IconCheck, IconAlertTriangle, IconCircle } from '@tabler/icons-react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { baseURL } from '@/store/constant'
import { getGlassStyle, statusColors } from './glassmorphismStyles'

/**
 * Compact credential logo component with glassmorphism styling
 * Shows logo with status indicator (connected/required/optional)
 */
const CredentialLogo = ({ credential, size = 'medium', showLabel = false, onClick }) => {
    const customization = useSelector((state) => state.customization)
    const isDarkMode = customization.isDarkMode
    const [imageError, setImageError] = useState(false)

    const { credentialType, label, isAssigned, isRequired } = credential

    // Determine status
    const status = isAssigned ? 'connected' : isRequired ? 'required' : 'optional'
    const statusColor = statusColors[status]

    // Size configurations
    const sizeConfig = {
        small: { avatar: 32, icon: 16, fontSize: '0.7rem' },
        medium: { avatar: 48, icon: 20, fontSize: '0.75rem' },
        large: { avatar: 64, icon: 24, fontSize: '0.8rem' }
    }

    const config = sizeConfig[size]

    // Status icon based on connection state
    const StatusIcon = isAssigned ? IconCheck : isRequired ? IconAlertTriangle : IconCircle

    const logoUrl = `${baseURL}/api/v1/components-credentials-icon/${credentialType}`

    return (
        <Tooltip title={label} arrow placement='top'>
            <Box
                onClick={onClick}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease',
                    '&:hover': onClick
                        ? {
                              transform: 'translateY(-2px)'
                          }
                        : {}
                }}
            >
                {/* Logo with glass effect */}
                <Box
                    sx={{
                        position: 'relative',
                        ...getGlassStyle('circularGlass', isDarkMode),
                        '&:hover': onClick ? getGlassStyle('glassHover', isDarkMode) : {}
                    }}
                >
                    <Avatar
                        src={imageError ? undefined : logoUrl}
                        alt={label}
                        sx={{
                            width: config.avatar,
                            height: config.avatar,
                            bgcolor: 'transparent',
                            p: 1
                        }}
                        imgProps={{
                            onError: () => {
                                // Use React state to trigger fallback instead of direct DOM manipulation
                                setImageError(true)
                            }
                        }}
                    >
                        {/* Fallback to initials */}
                        {label
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                    </Avatar>

                    {/* Status indicator badge */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: config.icon,
                            height: config.icon,
                            borderRadius: '50%',
                            bgcolor: statusColor.bg,
                            border: `2px solid ${statusColor.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isAssigned ? '0 2px 8px rgba(76, 175, 80, 0.4)' : '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        <StatusIcon size={config.icon - 6} color={statusColor.icon} strokeWidth={3} />
                    </Box>
                </Box>

                {/* Optional label below logo */}
                {showLabel && (
                    <Typography
                        variant='caption'
                        sx={{
                            fontSize: config.fontSize,
                            color: 'text.secondary',
                            textAlign: 'center',
                            maxWidth: config.avatar + 16,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {label}
                    </Typography>
                )}
            </Box>
        </Tooltip>
    )
}

CredentialLogo.propTypes = {
    credential: PropTypes.shape({
        credentialType: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        isAssigned: PropTypes.bool.isRequired,
        isRequired: PropTypes.bool.isRequired
    }).isRequired,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    showLabel: PropTypes.bool,
    onClick: PropTypes.func
}

export default CredentialLogo
