import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// material-ui
import { styled, keyframes } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { IconVectorBezier2, IconLanguage, IconScissors } from '@tabler/icons-react'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import DocumentStoreStatus from '@/views/docstore/DocumentStoreStatus'

import { kFormatter } from '@/utils/genericHelper'

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

// ===========================|| DOC STORE CARD ||=========================== //

const DocumentStoreCard = ({ data, images, onClick, badge }) => {
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
                            {badge}
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
                                boxShadow: customization.isDarkMode
                                    ? '0 2px 14px 0 rgb(255 255 255 / 20%)'
                                    : '0 2px 14px 0 rgb(32 40 45 / 20%)',

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
                                boxShadow: customization.isDarkMode
                                    ? '0 2px 14px 0 rgb(255 255 255 / 20%)'
                                    : '0 2px 14px 0 rgb(32 40 45 / 20%)',

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
                                boxShadow: customization.isDarkMode
                                    ? '0 2px 14px 0 rgb(255 255 255 / 20%)'
                                    : '0 2px 14px 0 rgb(32 40 45 / 20%)',
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
                                        backgroundColor: customization.isDarkMode
                                            ? theme.palette.common.white
                                            : theme.palette.grey[300] + 75
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
    onClick: PropTypes.func,
    badge: PropTypes.node
}

export default DocumentStoreCard
