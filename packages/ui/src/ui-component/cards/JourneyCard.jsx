import PropTypes from 'prop-types'

// material-ui
import { styled } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme, Chip, Tooltip } from '@mui/material'
import { DescriptionOutlined, BuildOutlined, SmartToyOutlined } from '@mui/icons-material'

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

const CustomChip = ({ icon, count, tooltipContent }) => {
    const theme = useTheme()

    return (
        <Tooltip title={tooltipContent} arrow>
            <Chip
                icon={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {icon}
                        <Typography component='span' sx={{ color: 'white' }}>
                            {count}
                        </Typography>
                    </Box>
                }
                size='small'
                sx={{
                    bgcolor: 'transparent',
                    color: 'white',
                    borderColor: theme.palette.primary.main,
                    '& .MuiChip-icon': {
                        color: theme.palette.primary.main,
                        marginLeft: '8px',
                        marginRight: '-4px'
                    },
                    '& .MuiSvgIcon-root': {
                        color: theme.palette.primary.main,
                        backgroundColor: 'transparent'
                    },
                    '& .MuiChip-label': {
                        color: 'white',
                        paddingLeft: '0'
                    }
                }}
            />
        </Tooltip>
    )
}

CustomChip.propTypes = {
    icon: PropTypes.node.isRequired,
    count: PropTypes.number.isRequired,
    tooltipContent: PropTypes.node.isRequired
}

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

        return (
            <TooltipContent>
                {items.map((item, index) => (
                    <div key={index} className='item'>
                        <Typography variant='body2'>{item.name || item}</Typography>
                    </div>
                ))}
            </TooltipContent>
        )
    }

    const getIcon = (type) => {
        switch (type) {
            case 'document':
                return <DescriptionOutlined fontSize='small' />
            case 'tool':
                return <BuildOutlined fontSize='small' />
            case 'chatflow':
                return <SmartToyOutlined fontSize='small' />
            default:
                return null
        }
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
                        <CustomChip
                            icon={getIcon('document')}
                            count={data.documents?.length || 0}
                            tooltipContent={getTooltipContent(data.documents, 'document')}
                        />
                        <CustomChip
                            icon={getIcon('tool')}
                            count={data.tools?.length || 0}
                            tooltipContent={getTooltipContent(data.tools, 'tool')}
                        />
                        <CustomChip
                            icon={getIcon('chatflow')}
                            count={data.chatflows?.length || 0}
                            tooltipContent={getTooltipContent(data.chatflows, 'chatflow')}
                        />
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
