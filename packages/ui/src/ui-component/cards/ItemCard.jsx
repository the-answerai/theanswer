import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
// material-ui
import { styled } from '@mui/material/styles'
import { Box, Grid, Tooltip, Typography, useTheme, keyframes } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import MoreItemsTooltip from '../tooltip/MoreItemsTooltip'

// Animated glow effect for dark mode
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 16px 0 rgba(59, 130, 246, 0.15), 0 0 20px 0 rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 4px 20px 0 rgba(59, 130, 246, 0.25), 0 0 30px 0 rgba(59, 130, 246, 0.2);
  }
`

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.palette.mode === 'light' ? '#ffffff' : '#1a1a1a',
    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(59, 130, 246, 0.3)'}`,
    color: theme.palette.text.primary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: theme.palette.mode === 'light' ? '0 2px 14px 0 rgba(0, 0, 0, 0.08)' : '0 4px 16px 0 rgba(59, 130, 246, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    animation: theme.palette.mode === 'dark' ? `${glowPulse} 3s ease-in-out infinite` : 'none',
    '&:hover': {
        background:
            theme.palette.mode === 'light'
                ? '#fafafa'
                : 'linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(15, 23, 42, 0.15)' : 'rgba(59, 130, 246, 0.5)'}`,
        boxShadow: theme.palette.mode === 'light' ? '0 4px 20px 0 rgba(0, 0, 0, 0.12)' : '0 8px 32px 0 rgba(59, 130, 246, 0.3)',
        transform: 'translateY(-2px)',
        animation: 'none'
    },
    height: '100%',
    minHeight: '160px',
    maxHeight: '300px',
    width: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line'
}))

// ===========================|| CONTRACT CARD ||=========================== //

const ItemCard = ({ data, images, icons, onClick }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)

    return (
        <CardWrapper
            content={false}
            onClick={onClick}
            sx={{
                borderRadius: 2,
                background: theme.palette.mode === 'light' ? '#ffffff' : '#1a1a1a !important'
            }}
            // data-href={href}
        >
            <Box sx={{ height: '100%', p: 2.25 }}>
                <Grid container justifyContent='space-between' direction='column' sx={{ height: '100%', gap: 3 }}>
                    <Box display='flex' flexDirection='column' sx={{ width: '100%' }}>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            {data.iconSrc && (
                                <div
                                    style={{
                                        width: 35,
                                        height: 35,
                                        display: 'flex',
                                        flexShrink: 0,
                                        marginRight: 10,
                                        borderRadius: '50%',
                                        backgroundImage: `url(${data.iconSrc})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center center'
                                    }}
                                ></div>
                            )}
                            {!data.iconSrc && data.color && (
                                <div
                                    style={{
                                        width: 35,
                                        height: 35,
                                        display: 'flex',
                                        flexShrink: 0,
                                        marginRight: 10,
                                        borderRadius: '50%',
                                        background: data.color
                                    }}
                                ></div>
                            )}
                            <Typography
                                sx={{
                                    display: '-webkit-box',
                                    fontSize: '1.25rem',
                                    fontWeight: 500,
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden'
                                }}
                            >
                                {data.templateName || data.name}
                            </Typography>
                        </div>
                        {data.description && (
                            <span
                                style={{
                                    display: '-webkit-box',
                                    marginTop: 10,
                                    overflowWrap: 'break-word',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden'
                                }}
                            >
                                {data.description}
                            </span>
                        )}
                    </Box>
                    {(images?.length > 0 || icons?.length > 0) && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'start',
                                gap: 1
                            }}
                        >
                            {[
                                ...(images || []).map((img) => ({ type: 'image', src: img.imageSrc, label: img.label })),
                                ...(icons || []).map((ic) => ({ type: 'icon', icon: ic.icon, color: ic.color, label: ic.name }))
                            ]
                                .slice(0, 3)
                                .map((item, index) => (
                                    <Tooltip key={item.src || index} title={item.label} placement='top'>
                                        {item.type === 'image' ? (
                                            <Box
                                                sx={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: '50%',
                                                    backgroundColor: customization.isDarkMode
                                                        ? theme.palette.common.white
                                                        : theme.palette.grey[300] + 75
                                                }}
                                            >
                                                <img
                                                    style={{ width: '100%', height: '100%', padding: 5, objectFit: 'contain' }}
                                                    alt=''
                                                    src={item.src}
                                                />
                                            </Box>
                                        ) : (
                                            <div
                                                style={{
                                                    width: 30,
                                                    height: 30,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <item.icon size={25} color={item.color} />
                                            </div>
                                        )}
                                    </Tooltip>
                                ))}

                            {(images?.length || 0) + (icons?.length || 0) > 3 && (
                                <MoreItemsTooltip
                                    images={[
                                        ...(images?.slice(3) || []),
                                        ...(icons?.slice(Math.max(0, 3 - (images?.length || 0))) || []).map((ic) => ({ label: ic.name }))
                                    ]}
                                >
                                    <Typography
                                        sx={{
                                            alignItems: 'center',
                                            display: 'flex',
                                            fontSize: '.9rem',
                                            fontWeight: 200
                                        }}
                                    >
                                        + {(images?.length || 0) + (icons?.length || 0) - 3} More
                                    </Typography>
                                </MoreItemsTooltip>
                            )}
                        </Box>
                    )}
                </Grid>
            </Box>
        </CardWrapper>
    )
}

ItemCard.propTypes = {
    data: PropTypes.object,
    images: PropTypes.array,
    icons: PropTypes.array,
    onClick: PropTypes.func
}

export default ItemCard
