import PropTypes from 'prop-types'
// material-ui
import { styled, keyframes } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { IconVectorBezier2, IconLanguage, IconScissors } from '@tabler/icons-react'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import DocumentStoreStatus from '@/views/docstore/DocumentStoreStatus'

import { kFormatter } from '@/utils/genericHelper'
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

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.vars.palette.glass.glassSecondary.background,
    border: theme.vars.palette.glass.glassSecondary.border,
    color: theme.vars.palette.text.primary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: theme.vars.palette.glass.glassSecondary.boxShadow,
    backdropFilter: theme.vars.palette.glass.glassSecondary.backdropFilter,
    WebkitBackdropFilter: theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
    cursor: 'pointer',
    transition: theme.vars.palette.glass.transition,
    // Dark mode glow animation - use CSS custom property
    animation: 'var(--card-glow-animation, none)',
    '@media (prefers-color-scheme: dark)': {
        '--card-glow-animation': `${glowPulse} 3s ease-in-out infinite`
    },
    '[data-theme="dark"] &': {
        '--card-glow-animation': `${glowPulse} 3s ease-in-out infinite`
    },
    '&:hover': {
        background: theme.vars.palette.glass.glassHover.background,
        border: theme.vars.palette.glass.glassSecondary.border,
        boxShadow: theme.vars.palette.glass.glassHover.boxShadow,
        transform: theme.vars.palette.glass.glassHover.transform,
        animation: 'none'
    },
    height: '100%',
    minHeight: '160px',
    maxHeight: '300px',
    width: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line'
}))

// ===========================|| DOC STORE CARD ||=========================== //

const DocumentStoreCard = ({ data, images, onClick }) => {
    const theme = useTheme()
    const { mode } = useThemeMode()

    return (
        <CardWrapper
            content={false}
            onClick={onClick}
            sx={{
                borderRadius: 2,
                background: (theme) => theme.vars.palette.glass.glassSecondary.background
            }}
        >
            <Box sx={{ height: '100%', p: 2.25 }}>
                <Grid container justifyContent='space-between' direction='column' sx={{ height: '100%' }} gap={2}>
                    <Box display='flex' flexDirection='column' sx={{ flex: 1, width: '100%' }}>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            <Typography
                                sx={{
                                    display: '-webkit-box',
                                    fontSize: '1.25rem',
                                    fontWeight: 500,
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    flex: 1,
                                    mr: 1
                                }}
                            >
                                {data.name}
                            </Typography>
                            <DocumentStoreStatus status={data.status} />
                        </div>
                        <span
                            style={{
                                display: '-webkit-box',
                                marginTop: 10,
                                overflowWrap: 'break-word',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden'
                            }}
                        >
                            {data.description || ' '}
                        </span>
                    </Box>
                    <Grid container columnGap={2} rowGap={1}>
                        <div
                            style={{
                                paddingLeft: '7px',
                                paddingRight: '7px',
                                paddingTop: '3px',
                                paddingBottom: '3px',
                                fontSize: '11px',
                                width: 'max-content',
                                borderRadius: '25px',
                                boxShadow: mode === 'dark' ? '0 2px 14px 0 rgb(255 255 255 / 20%)' : '0 2px 14px 0 rgb(32 40 45 / 20%)',

                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                        >
                            <IconVectorBezier2 style={{ marginRight: 5 }} size={15} />
                            {data.whereUsed?.length ?? 0} {data.whereUsed?.length <= 1 ? 'flow' : 'flows'}
                        </div>
                        <div
                            style={{
                                paddingLeft: '7px',
                                paddingRight: '7px',
                                paddingTop: '3px',
                                paddingBottom: '3px',
                                fontSize: '11px',
                                width: 'max-content',
                                borderRadius: '25px',
                                boxShadow: mode === 'dark' ? '0 2px 14px 0 rgb(255 255 255 / 20%)' : '0 2px 14px 0 rgb(32 40 45 / 20%)',

                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                        >
                            <IconLanguage style={{ marginRight: 5 }} size={15} />
                            {kFormatter(data.totalChars ?? 0)} chars
                        </div>
                        <div
                            style={{
                                paddingLeft: '7px',
                                paddingRight: '7px',
                                paddingTop: '3px',
                                paddingBottom: '3px',
                                fontSize: '11px',
                                width: 'max-content',
                                borderRadius: '25px',
                                boxShadow: mode === 'dark' ? '0 2px 14px 0 rgb(255 255 255 / 20%)' : '0 2px 14px 0 rgb(32 40 45 / 20%)',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                        >
                            <IconScissors style={{ marginRight: 5 }} size={15} />
                            {kFormatter(data.totalChunks ?? 0)} chunks
                        </div>
                    </Grid>
                    {images && images.length > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'start',
                                gap: 1
                            }}
                        >
                            {images.slice(0, images.length > 3 ? 3 : images.length).map((img) => (
                                <Box
                                    key={img}
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        backgroundColor:
                                            mode === 'dark' ? theme.vars.palette.common.white : theme.vars.palette.grey[300] + 75
                                    }}
                                >
                                    <img style={{ width: '100%', height: '100%', padding: 5, objectFit: 'contain' }} alt='' src={img} />
                                </Box>
                            ))}
                            {images.length > 3 && (
                                <Typography sx={{ alignItems: 'center', display: 'flex', fontSize: '.9rem', fontWeight: 200 }}>
                                    + {images.length - 3} More
                                </Typography>
                            )}
                        </Box>
                    )}
                </Grid>
            </Box>
        </CardWrapper>
    )
}

DocumentStoreCard.propTypes = {
    data: PropTypes.object,
    images: PropTypes.array,
    onClick: PropTypes.func
}

export default DocumentStoreCard
