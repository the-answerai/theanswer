import PropTypes from 'prop-types'

// material-ui
import { styled } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme, Chip, Tooltip } from '@mui/material'
import { Description, Build, SmartToy, AccountCircle } from '@mui/icons-material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import FlowListMenu from '@/ui-component/button/FlowListMenu'

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.main,
    color: theme.darkTextPrimary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)',
    cursor: 'pointer',
    '&:hover': {
        background: theme.palette.card.hover,
        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)'
    },
    height: '100%',
    minHeight: '160px',
    maxHeight: '300px',
    width: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line'
}))

const TooltipContent = styled('div')(({ theme }) => ({
    padding: theme.spacing(1),
    '& .item': {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(0.5),
        '& .icon': {
            marginRight: theme.spacing(1),
            color: theme.palette.primary.main
        }
    }
}))

// ===========================|| JOURNEY CARD ||=========================== //

const JourneyCard = ({ data, onClick, updateFlowsApi, setError }) => {
    const theme = useTheme()

    if (!data) {
        return null
    }

    const handleCardClick = (event) => {
        if (!event.target.closest('.flow-list-menu')) {
            onClick(data)
        }
    }

    const getTooltipContent = (items, type) => {
        if (!items || items.length === 0) return <Typography>None</Typography>

        const getIcon = (type) => {
            switch (type) {
                case 'document':
                    return <Description fontSize='small' />
                case 'tool':
                    return <Build fontSize='small' />
                case 'chatflow':
                    return <SmartToy fontSize='small' />
                default:
                    return <AccountCircle fontSize='small' />
            }
        }

        return (
            <TooltipContent>
                {items.map((item, index) => (
                    <div key={index} className='item'>
                        <span className='icon'>{getIcon(type)}</span>
                        <Typography variant='body2'>{item.name || item}</Typography>
                    </div>
                ))}
            </TooltipContent>
        )
    }

    return (
        <CardWrapper content={false} sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}>
            <Box sx={{ height: '100%', p: 2.25 }} onClick={handleCardClick}>
                <Grid container justifyContent='space-between' direction='column' sx={{ height: '100%', gap: 3 }}>
                    <Box display='flex' flexDirection='column' sx={{ width: '100%' }}>
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
                            {data.title}
                        </Typography>
                        {data.goal && (
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
                                {data.goal}
                            </span>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'start',
                            gap: 1,
                            mt: 2
                        }}
                    >
                        {data.category && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {data.category.split(';').map((tag, index) => (
                                    <Chip
                                        key={`chip-category-${tag}${index}`}
                                        label={tag}
                                        size='small'
                                        sx={{
                                            bgcolor: theme.palette.teal.main,
                                            border: `1px solid ${theme.palette.divider}`,
                                            color: theme.palette.text.primary
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'start',
                            gap: 1,
                            mt: 1
                        }}
                    >
                        <Tooltip title={getTooltipContent(data.documents, 'document')} arrow>
                            <Chip
                                label={`${data.documents?.length || 0} Docs`}
                                size='small'
                                sx={{
                                    bgcolor: theme.palette.primary.light,
                                    color: theme.palette.primary.dark
                                }}
                            />
                        </Tooltip>
                        <Tooltip title={getTooltipContent(data.tools, 'tool')} arrow>
                            <Chip
                                label={`${data.tools?.length || 0} Tools`}
                                size='small'
                                sx={{
                                    bgcolor: theme.palette.secondary.light,
                                    color: theme.palette.secondary.dark
                                }}
                            />
                        </Tooltip>
                        <Tooltip title={getTooltipContent(data.chatflows, 'chatflow')} arrow>
                            <Chip
                                label={`${data.chatflows?.length || 0} Sidekicks`}
                                size='small'
                                sx={{
                                    bgcolor: theme.palette.success.light,
                                    color: theme.palette.success.dark
                                }}
                            />
                        </Tooltip>
                    </Box>
                </Grid>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8
                }}
                className='flow-list-menu'
            >
                <FlowListMenu item={data} type='journeys' setError={setError} updateFlowsApi={updateFlowsApi} />
            </Box>
        </CardWrapper>
    )
}

JourneyCard.propTypes = {
    data: PropTypes.object,
    onClick: PropTypes.func,
    updateFlowsApi: PropTypes.object,
    setError: PropTypes.func
}

export default JourneyCard
