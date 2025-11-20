import { useState } from 'react'
import { useThemeMode } from '@ui/theme'
import PropTypes from 'prop-types'
import moment from 'moment'
import { styled, keyframes } from '@mui/material/styles'
import {
    Box,
    Chip,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material'
import { tableCellClasses } from '@mui/material/TableCell'
import FlowListMenu from '../button/FlowListMenu'
import { Link } from '@/utils/navigation'
// Animated glow effect for dark mode tables
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 16px 0 rgba(59, 130, 246, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px 0 rgba(59, 130, 246, 0.25), 0 0 30px 0 rgba(59, 130, 246, 0.15);
  }
`

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.vars.palette.divider,

    [`&.${tableCellClasses.head}`]: {
        color: theme.vars.palette.text.primary,
        fontWeight: 600
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 64,
        color: theme.vars.palette.text.primary
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

const getLocalStorageKeyName = (name, isAgentCanvas) => {
    return (isAgentCanvas ? 'agentcanvas' : 'chatflowcanvas') + '_' + name
}

export const FlowListTable = ({ data, images = {}, icons = {}, isLoading, filterFunction, updateFlowsApi, setError, isAgentCanvas }) => {
    const theme = useTheme()
    const { mode } = useThemeMode()

    const localStorageKeyOrder = getLocalStorageKeyName('order', isAgentCanvas)
    const localStorageKeyOrderBy = getLocalStorageKeyName('orderBy', isAgentCanvas)

    const [order, setOrder] = useState(localStorage.getItem(localStorageKeyOrder) || 'desc')
    const [orderBy, setOrderBy] = useState(localStorage.getItem(localStorageKeyOrderBy) || 'updatedDate')

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        const newOrder = isAsc ? 'desc' : 'asc'
        setOrder(newOrder)
        setOrderBy(property)
        localStorage.setItem(localStorageKeyOrder, newOrder)
        localStorage.setItem(localStorageKeyOrderBy, property)
    }

    const onFlowClick = (row) => {
        if (!isAgentCanvas) {
            return `/canvas/${row.id}`
        } else {
            return localStorage.getItem('agentFlowVersion') === 'v2' ? `/v2/agentcanvas/${row.id}` : `/agentcanvas/${row.id}`
        }
    }

    const sortedData = data
        ? [...data].sort((a, b) => {
              if (orderBy === 'name') {
                  return order === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '')
              } else if (orderBy === 'updatedDate') {
                  return order === 'asc'
                      ? new Date(a.updatedDate) - new Date(b.updatedDate)
                      : new Date(b.updatedDate) - new Date(a.updatedDate)
              }
              return 0
          })
        : []

    return (
        <>
            <TableContainer
                sx={{
                    border: 1,
                    borderColor: (theme) => theme.vars.palette.glass.glassSecondary.border,
                    borderRadius: 2,
                    backgroundColor: (theme) => theme.vars.palette.glass.glassSecondary.background,
                    backdropFilter: (theme) => theme.vars.palette.glass.glassSecondary.backdropFilter,
                    WebkitBackdropFilter: (theme) => theme.vars.palette.glass.glassSecondary.WebkitBackdropFilter,
                    boxShadow: (theme) => theme.vars.palette.glass.glassSecondary.boxShadow,
                    // Dark mode glow animation - use CSS custom property
                    animation: 'var(--table-glow-animation, none)',
                    '@media (prefers-color-scheme: dark)': {
                        '--table-glow-animation': `${glowPulse} 3s ease-in-out infinite`
                    },
                    '[data-theme="dark"] &': {
                        '--table-glow-animation': `${glowPulse} 3s ease-in-out infinite`
                    }
                }}
                component={Paper}
            >
                <Table sx={{ minWidth: 650 }} size='small' aria-label='a dense table'>
                    <TableHead
                        sx={{
                            backgroundColor: 'action.hover',
                            borderBottom: (theme) => `2px solid ${theme.vars.palette.divider}`,
                            height: 56
                        }}
                    >
                        <TableRow>
                            <StyledTableCell component='th' scope='row' style={{ width: '20%' }} key='0'>
                                <TableSortLabel active={orderBy === 'name'} direction={order} onClick={() => handleRequestSort('name')}>
                                    Name
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell style={{ width: '25%' }} key='1'>
                                Category
                            </StyledTableCell>
                            <StyledTableCell style={{ width: '30%' }} key='2'>
                                Nodes
                            </StyledTableCell>
                            <StyledTableCell style={{ width: '15%' }} key='3'>
                                <TableSortLabel
                                    active={orderBy === 'updatedDate'}
                                    direction={order}
                                    onClick={() => handleRequestSort('updatedDate')}
                                >
                                    Last Modified Date
                                </TableSortLabel>
                            </StyledTableCell>
                            <StyledTableCell style={{ width: '10%' }} key='4'>
                                Actions
                            </StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <>
                                <StyledTableRow>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                </StyledTableRow>
                                <StyledTableRow>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Skeleton variant='text' />
                                    </StyledTableCell>
                                </StyledTableRow>
                            </>
                        ) : (
                            <>
                                {sortedData.filter(filterFunction).map((row, index) => (
                                    <StyledTableRow key={index}>
                                        <StyledTableCell key='0'>
                                            <Tooltip title={row.templateName || row.name}>
                                                <Typography
                                                    sx={{
                                                        display: '-webkit-box',
                                                        fontSize: 14,
                                                        fontWeight: 500,
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <Link to={onFlowClick(row)} style={{ color: '#2196f3', textDecoration: 'none' }}>
                                                        {row.templateName || row.name}
                                                    </Link>
                                                </Typography>
                                            </Tooltip>
                                        </StyledTableCell>
                                        <StyledTableCell key='1'>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    flexWrap: 'wrap',
                                                    marginTop: 5
                                                }}
                                            >
                                                &nbsp;
                                                {row.category &&
                                                    row.category
                                                        .split(';')
                                                        .map((tag, index) => (
                                                            <Chip key={index} label={tag} style={{ marginRight: 5, marginBottom: 5 }} />
                                                        ))}
                                            </div>
                                        </StyledTableCell>
                                        <StyledTableCell key='2'>
                                            {(images[row.id] || icons[row.id]) && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'start',
                                                        gap: 1
                                                    }}
                                                >
                                                    {[
                                                        ...(images[row.id] || []).map((img) => ({ type: 'image', src: img })),
                                                        ...(icons[row.id] || []).map((ic) => ({
                                                            type: 'icon',
                                                            icon: ic.icon,
                                                            color: ic.color
                                                        }))
                                                    ]
                                                        .slice(0, 5)
                                                        .map((item, index) =>
                                                            item.type === 'image' ? (
                                                                <Box
                                                                    key={item.src}
                                                                    sx={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        borderRadius: '50%',
                                                                        backgroundColor:
                                                                            mode === 'dark'
                                                                                ? theme.vars.palette.common.white
                                                                                : theme.vars.palette.grey[300] + 75
                                                                    }}
                                                                >
                                                                    <img
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            padding: 5,
                                                                            objectFit: 'contain'
                                                                        }}
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
                                                    {(images[row.id]?.length || 0) + (icons[row.id]?.length || 0) > 5 && (
                                                        <Typography
                                                            sx={{
                                                                alignItems: 'center',
                                                                display: 'flex',
                                                                fontSize: '.9rem',
                                                                fontWeight: 200
                                                            }}
                                                        >
                                                            + {(images[row.id]?.length || 0) + (icons[row.id]?.length || 0) - 5} More
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </StyledTableCell>
                                        <StyledTableCell key='3'>
                                            {moment(row.updatedDate).format('MMMM Do, YYYY HH:mm:ss')}
                                        </StyledTableCell>
                                        <StyledTableCell key='4'>
                                            <Stack
                                                direction={{ xs: 'column', sm: 'row' }}
                                                spacing={1}
                                                justifyContent='center'
                                                alignItems='center'
                                            >
                                                <FlowListMenu
                                                    isAgentCanvas={isAgentCanvas}
                                                    chatflow={row}
                                                    setError={setError}
                                                    updateFlowsApi={updateFlowsApi}
                                                />
                                            </Stack>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

FlowListTable.propTypes = {
    data: PropTypes.array,
    images: PropTypes.object,
    icons: PropTypes.object,
    isLoading: PropTypes.bool,
    filterFunction: PropTypes.func,
    updateFlowsApi: PropTypes.object,
    setError: PropTypes.func,
    isAgentCanvas: PropTypes.bool
}
