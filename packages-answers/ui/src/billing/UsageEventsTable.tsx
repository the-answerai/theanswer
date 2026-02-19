import React, { useState } from 'react'
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Chip,
    Skeleton,
    IconButton,
    Tooltip
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import { useUsageEvents } from './hooks/useUsageEvents'
import { format } from 'date-fns'
import { useUser } from '@utils/auth/aaiAuth0Client'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

// Skeleton row component for loading state
const SkeletonRow = ({ isAdmin = false }: { isAdmin?: boolean }) => {
    const columns = isAdmin ? 5 : 4 // Adjust number of cells based on admin status

    return (
        <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={index}>
                    <Skeleton variant='text' width={index === 0 ? 180 : 100} height={24} />
                </TableCell>
            ))}
        </TableRow>
    )
}

const UsageEventsTable: React.FC = () => {
    const theme = useTheme()
    const { user } = useUser()
    const roles = user?.['https://theanswer.ai/roles'] as unknown as string[] | undefined
    const isAdmin = Array.isArray(roles) && roles.includes('Admin')
    const { events, pagination, isLoading, isError, setPage, setLimit, setSorting, params } = useUsageEvents()
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage + 1) // API is 1-indexed, MUI is 0-indexed
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLimit(parseInt(event.target.value, 10))
        setPage(1)
    }

    const handleSortRequest = (column: string) => {
        const isAsc = params.sortBy === column && params.sortOrder === 'asc'
        setSorting(column, isAsc ? 'desc' : 'asc')
    }

    // Function to generate Langfuse trace URL
    const getLangfuseTraceUrl = (traceId: string) => {
        // Use the default Langfuse URL unless a custom one is set in environment
        const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
        return `${baseUrl}/trace/${traceId}`
    }

    if (isError) {
        return (
            <Box
                sx={{
                    p: 3,
                    mb: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(20px)'
                }}
            >
                <Box sx={{ p: 2, color: 'error.main' }}>
                    <Typography>Error loading usage events. Please try again later.</Typography>
                </Box>
            </Box>
        )
    }

    return (
        <Box
            sx={{
                p: 3,
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(20px)'
            }}
        >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant='h6' sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 1 }}>
                    Detailed Usage Events
                </Typography>
                <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
                    Individual events that consumed credits
                </Typography>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sortDirection={params.sortBy === 'timestamp' ? params.sortOrder : false}>
                                <TableSortLabel
                                    active={params.sortBy === 'timestamp'}
                                    direction={params.sortBy === 'timestamp' ? params.sortOrder : 'asc'}
                                    onClick={() => handleSortRequest('timestamp')}
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        '&.MuiTableSortLabel-active': {
                                            color: theme.palette.text.primary
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: `${theme.palette.text.secondary} !important`
                                        }
                                    }}
                                >
                                    Timestamp
                                </TableSortLabel>
                            </TableCell>
                            {isAdmin && <TableCell sx={{ color: theme.palette.text.secondary }}>User</TableCell>}
                            <TableCell sx={{ color: theme.palette.text.secondary }}>Chatflow</TableCell>
                            {/* <TableCell sx={{ color: theme.palette.text.secondary }}>Total Credits</TableCell> */}
                            <TableCell sx={{ color: theme.palette.text.secondary }}>Usage</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            // Skeleton rows during loading
                            Array.from({ length: pagination?.limit || 10 }).map((_, index) => <SkeletonRow key={index} isAdmin={isAdmin} />)
                        ) : events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} align='center' sx={{ color: theme.palette.text.secondary }}>
                                    No usage events found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow
                                    key={event.id}
                                    hover
                                    sx={{ '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) } }}
                                    onMouseEnter={() => setHoveredRow(event.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <TableCell sx={{ color: theme.palette.text.primary, position: 'relative' }}>
                                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                        {hoveredRow === event.id && (
                                            <Tooltip title='View in Langfuse' placement='top'>
                                                <IconButton
                                                    size='small'
                                                    sx={{
                                                        position: 'absolute',
                                                        right: 8,
                                                        color: theme.palette.text.secondary,
                                                        '&:hover': { color: theme.palette.text.primary }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(getLangfuseTraceUrl(event.id), '_blank')
                                                    }}
                                                >
                                                    <OpenInNewIcon fontSize='small' />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    {isAdmin && <TableCell sx={{ color: theme.palette.text.secondary }}>{event.userId}</TableCell>}
                                    <TableCell sx={{ color: theme.palette.text.primary }}>{event.chatflowName || 'Unknown'}</TableCell>
                                    {/* <TableCell sx={{ color: theme.palette.text.primary }}>{event.totalCredits.toFixed(2)}</TableCell> */}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {event.breakdown.ai_tokens > 0 && (
                                                <Chip
                                                    size='small'
                                                    label={`AI: ${event.breakdown.ai_tokens.toFixed(2)}`}
                                                    sx={{ bgcolor: 'rgba(66, 133, 244, 0.1)', color: '#4285F4' }}
                                                />
                                            )}
                                            {event.breakdown.compute > 0 && (
                                                <Chip
                                                    size='small'
                                                    label={`Compute: ${event.breakdown.compute.toFixed(2)}`}
                                                    sx={{ bgcolor: 'rgba(52, 168, 83, 0.1)', color: '#34A853' }}
                                                />
                                            )}
                                            {event.breakdown.storage > 0 && (
                                                <Chip
                                                    size='small'
                                                    label={`Storage: ${event.breakdown.storage.toFixed(2)}`}
                                                    sx={{ bgcolor: 'rgba(251, 188, 5, 0.1)', color: '#FBBC05' }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component='div'
                count={pagination?.totalItems || 0}
                page={(pagination?.page || 1) - 1}
                rowsPerPage={pagination?.limit || 10}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    color: theme.palette.text.primary,
                    '.MuiTablePagination-selectIcon': { color: theme.palette.text.secondary },
                    '.MuiTablePagination-select': { color: theme.palette.text.primary },
                    '.MuiTablePagination-selectLabel': { color: theme.palette.text.secondary },
                    '.MuiTablePagination-displayedRows': { color: theme.palette.text.secondary },
                    '.MuiTablePagination-actions': {
                        '& .MuiIconButton-root': {
                            color: theme.palette.text.secondary,
                            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
                            '&:hover': { color: theme.palette.text.primary }
                        }
                    }
                }}
            />
        </Box>
    )
}

export default UsageEventsTable
