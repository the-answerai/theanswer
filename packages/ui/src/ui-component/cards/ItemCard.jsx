import PropTypes from 'prop-types'
// material-ui
import { styled, keyframes, css } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { useThemeMode } from '@ui/theme'

// Animated glow effect for dark mode
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 16px 0 rgba(59, 130, 246, 0.15), 0 0 20px 0 rgba(59, 130, 246, 0.1);
  }
  50% {
    box-shadow: 0 4px 20px 0 rgba(59, 130, 246, 0.25), 0 0 30px 0 rgba(59, 130, 246, 0.2);
  }
`

const CardWrapper = styled(MainCard)(
    ({ theme }) => css`
        background: ${theme.vars.palette.glass.glassSecondary.background};
        border: ${theme.vars.palette.glass.glassSecondary.border};
        color: ${theme.vars.palette.text.primary};
        overflow: auto;
        position: relative;
        box-shadow: ${theme.vars.palette.glass.glassSecondary.boxShadow};
        backdrop-filter: ${theme.vars.palette.glass.glassSecondary.backdropFilter};
        -webkit-backdrop-filter: ${theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter};
        cursor: pointer;
        transition: ${theme.vars.palette.glass.transition};
        border-radius: 24px;

        @media (prefers-color-scheme: dark) {
            animation: ${glowPulse} 3s ease-in-out infinite;
        }

        [data-theme='dark'] & {
            animation: ${glowPulse} 3s ease-in-out infinite;
        }

        &:hover {
            background: ${theme.vars.palette.glass.glassHover.background};
            border: ${theme.vars.palette.glass.glassSecondary.border};
            box-shadow: ${theme.vars.palette.glass.glassHover.boxShadow};
            transform: ${theme.vars.palette.glass.glassHover.transform};
            animation: none;
        }

        height: 100%;
        min-height: 160px;
        max-height: 300px;
        width: 100%;
        overflow-wrap: break-word;
        white-space: pre-line;
    `
)

// ===========================|| CONTRACT CARD ||=========================== //

const ItemCard = ({ data, images, icons, onClick }) => {
    const theme = useTheme()
    const { mode } = useThemeMode()

    return (
        <CardWrapper
            content={false}
            onClick={onClick}
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
                                ...(images || []).map((img) => ({ type: 'image', src: img })),
                                ...(icons || []).map((ic) => ({ type: 'icon', icon: ic.icon, color: ic.color }))
                            ]
                                .slice(0, 3)
                                .map((item, index) =>
                                    item.type === 'image' ? (
                                        <Box
                                            key={item.src}
                                            sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                backgroundColor:
                                                    mode === 'dark' ? theme.vars.palette.common.white : theme.vars.palette.grey[300] + 75
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
                                            key={index}
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
                                    )
                                )}
                            {images?.length + (icons?.length || 0) > 3 && (
                                <Typography sx={{ alignItems: 'center', display: 'flex', fontSize: '.9rem', fontWeight: 200 }}>
                                    + {images?.length + (icons?.length || 0) - 3} More
                                </Typography>
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
    nodeTypes: PropTypes.array,
    onClick: PropTypes.func
}

export default ItemCard
