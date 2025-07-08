'use client'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Box,
    Skeleton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Chip,
    TablePagination,
    TableSortLabel,
    Autocomplete,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import chatflowsApi from '@/api/chatflows'
import useApi from '@ui/hooks/useApi'
import { format } from 'date-fns'
import VisibilityIcon from '@mui/icons-material/Visibility'
import BarChartIcon from '@mui/icons-material/BarChart'
import Metrics from './metrics'

// Skeleton row component for loading state
const SkeletonRow = () => {
    return (
        <TableRow>
            <TableCell>
                <Skeleton variant='text' width={200} height={24} />
                <Skeleton variant='text' width={300} height={16} sx={{ mt: 0.5 }} />
            </TableCell>
            <TableCell>
                <Skeleton variant='text' width={100} height={24} />
            </TableCell>
            <TableCell>
                <Skeleton variant='text' width={80} height={24} />
            </TableCell>
            <TableCell>
                <Skeleton variant='text' width={120} height={24} />
            </TableCell>
            <TableCell>
                <Skeleton variant='text' width={120} height={24} />
            </TableCell>
            <TableCell>
                <Skeleton variant='text' width={80} height={24} />
            </TableCell>
        </TableRow>
    )
}

const AdminChatflows = () => {
    const [error, setError] = useState<null | string>(null)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(25)
    const [orderBy, setOrderBy] = useState<string>('createdDate')
    const [order, setOrder] = useState<'asc' | 'desc'>('desc')
    const [isFilterExpanded, setIsFilterExpanded] = useState(false)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedOwners, setSelectedOwners] = useState<string[]>([])
    const [keywordFilter, setKeywordFilter] = useState('')
    const [metricsModalOpen, setMetricsModalOpen] = useState(false)
    const [selectedChatflowId, setSelectedChatflowId] = useState<string>('')
    const {
        data: chatflowsData,
        isLoading: getAllChatflowsApiLoading,
        isError: getAllChatflowsApiError
    } = useApi('/api/chatflows', () =>
        chatflowsApi.getAdminChatflows({
            select: ['name', 'description', 'category', 'userId', 'createdDate', 'updatedDate']
        })
    )

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
        setPage(0)
    }

    const sortData = (data: any[]) => {
        if (!data) return data

        return [...data].sort((a, b) => {
            let aValue = a[orderBy]
            let bValue = b[orderBy]

            // Convert dates to timestamps for comparison
            if (orderBy === 'createdDate' || orderBy === 'updatedDate') {
                aValue = new Date(aValue).getTime()
                bValue = new Date(bValue).getTime()
            }

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1
            } else {
                return aValue < bValue ? 1 : -1
            }
        })
    }

    const filterData = (data: any[]) => {
        if (!data) return data

        return data.filter((chatflow) => {
            // Category filter
            if (selectedCategories.length > 0) {
                const categories = (chatflow.category || 'Uncategorized').split(';').map((cat: string) => cat.trim())
                const hasMatchingCategory = selectedCategories.some((selectedCat) =>
                    categories.some((cat) => cat.toLowerCase().includes(selectedCat.toLowerCase()))
                )
                if (!hasMatchingCategory) return false
            }

            // Owner filter
            if (selectedOwners.length > 0) {
                const owner = chatflow.isOwner ? 'Me' : chatflow.userId
                const hasMatchingOwner = selectedOwners.some((selectedOwner) => owner.toLowerCase().includes(selectedOwner.toLowerCase()))
                if (!hasMatchingOwner) return false
            }

            // Keyword filter
            if (keywordFilter.trim()) {
                const searchText = keywordFilter.toLowerCase()
                const nameMatch = chatflow.name.toLowerCase().includes(searchText)
                const descriptionMatch = chatflow.description?.toLowerCase().includes(searchText) || false
                if (!nameMatch && !descriptionMatch) return false
            }

            return true
        })
    }

    const getAllCategories = () => {
        if (!chatflowsData) return []

        const categories = new Set<string>()
        chatflowsData.forEach((chatflow) => {
            const chatflowCategories = (chatflow.category || 'Uncategorized').split(';').map((cat: string) => cat.trim())
            chatflowCategories.forEach((cat) => categories.add(cat))
        })

        return Array.from(categories).sort()
    }

    const getAllOwners = () => {
        if (!chatflowsData) return []

        const owners = new Set<string>()
        chatflowsData.forEach((chatflow) => {
            const owner = chatflow.isOwner ? 'Me' : chatflow.userId
            owners.add(owner)
        })

        return Array.from(owners).sort()
    }

    const handleOpenMetrics = (chatflowId: string) => {
        setSelectedChatflowId(chatflowId)
        setMetricsModalOpen(true)
    }

    const handleCloseMetrics = () => {
        setMetricsModalOpen(false)
        setSelectedChatflowId('')
    }

    useEffect(() => {
        if (getAllChatflowsApiError) {
            setError('Failed to load chatflows.')
        }
    }, [getAllChatflowsApiError])

    if (error) {
        return (
            <Box sx={{ p: { xs: 1, md: 4 } }}>
                <Box sx={{ p: 3, color: 'error.main' }}>
                    <Typography>{error}</Typography>
                </Box>
            </Box>
        )
    }

    return (
        <Box sx={{ p: { xs: 1, md: 4 } }}>
            <Box sx={{ mb: 2 }}>
                <Button component={Link} to='/admin' size='small' variant='text'>
                    ← Back to admin
                </Button>
            </Box>
            <Box sx={{ pb: 4 }} display='flex' alignItems='center' justifyContent='space-between'>
                <Box>
                    <Typography variant='h4' sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                        All Chatflows
                    </Typography>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>Manage chatflow configurations</Typography>
                </Box>
                <IconButton
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: 'rgba(255, 255, 255, 0.9)' },
                        transition: 'transform 0.2s ease-in-out',
                        transform: isFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                >
                    <FilterListIcon />
                </IconButton>
            </Box>

            <Box
                sx={{
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(20px)'
                }}
            >
                {/* Collapsible Filter Panel */}
                <Box
                    sx={{
                        maxHeight: isFilterExpanded ? '300px' : '0px',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out',
                        borderBottom: isFilterExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                    }}
                >
                    <Box sx={{ p: 3 }}>
                        <Typography variant='h6' sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                            Filter Options
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                            {/* Keyword Filter */}
                            <Box>
                                <Typography variant='body2' sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                    Search
                                </Typography>
                                <TextField
                                    size='small'
                                    placeholder='Search by name or description...'
                                    value={keywordFilter}
                                    onChange={(e) => {
                                        setKeywordFilter(e.target.value)
                                        setPage(0)
                                    }}
                                    sx={{
                                        width: '100%',
                                        '& .MuiOutlinedInput-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)'
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)'
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)'
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Category Filter */}
                            <Box>
                                <Typography variant='body2' sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                    Categories
                                </Typography>
                                <Autocomplete
                                    multiple
                                    size='small'
                                    options={getAllCategories()}
                                    value={selectedCategories}
                                    onChange={(event, newValue) => {
                                        setSelectedCategories(newValue)
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder='Select categories...'
                                            size='small'
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    '& fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.2)'
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.3)'
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                                    }
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'rgba(255, 255, 255, 0.7)'
                                                }
                                            }}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-tag': {
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        },
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Owner Filter */}
                            <Box>
                                <Typography variant='body2' sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                    Owners
                                </Typography>
                                <Autocomplete
                                    multiple
                                    size='small'
                                    options={getAllOwners()}
                                    value={selectedOwners}
                                    onChange={(event, newValue) => {
                                        setSelectedOwners(newValue)
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder='Select owners...'
                                            size='small'
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    '& fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.2)'
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.3)'
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                                    }
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'rgba(255, 255, 255, 0.7)'
                                                }
                                            }}
                                        />
                                    )}
                                    sx={{
                                        '& .MuiAutocomplete-tag': {
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        },
                                        '& .MuiAutocomplete-popupIndicator': {
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <TableContainer>
                    <Table size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('name')}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '0.75rem',
                                            '&.MuiTableSortLabel-active': {
                                                color: 'rgba(255, 255, 255, 0.9)'
                                            },
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }
                                        }}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    Category
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    Owner
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    <TableSortLabel
                                        active={orderBy === 'createdDate'}
                                        direction={orderBy === 'createdDate' ? order : 'asc'}
                                        onClick={() => handleRequestSort('createdDate')}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '0.75rem',
                                            '&.MuiTableSortLabel-active': {
                                                color: 'rgba(255, 255, 255, 0.9)'
                                            },
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }
                                        }}
                                    >
                                        Created
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    <TableSortLabel
                                        active={orderBy === 'updatedDate'}
                                        direction={orderBy === 'updatedDate' ? order : 'asc'}
                                        onClick={() => handleRequestSort('updatedDate')}
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '0.75rem',
                                            '&.MuiTableSortLabel-active': {
                                                color: 'rgba(255, 255, 255, 0.9)'
                                            },
                                            '& .MuiTableSortLabel-icon': {
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }
                                        }}
                                    >
                                        Updated
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontSize: '0.75rem', py: 1 }}>
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getAllChatflowsApiLoading ? (
                                // Skeleton rows during loading
                                Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
                            ) : !chatflowsData || chatflowsData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align='center' sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        No chatflows found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filterData(sortData(chatflowsData))
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((chatflow: any) => (
                                        <TableRow key={chatflow.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                                            <TableCell sx={{ py: 1, px: 1 }}>
                                                <Box>
                                                    <Typography
                                                        sx={{
                                                            color: 'rgba(255, 255, 255, 0.9)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            '&:hover': {
                                                                color: 'rgba(255, 255, 255, 1)',
                                                                textDecoration: 'underline'
                                                            }
                                                        }}
                                                    >
                                                        <Link to={`/canvas/${chatflow.id}`} target='_blank' rel='noopener noreferrer'>
                                                            {chatflow.name}
                                                        </Link>
                                                    </Typography>
                                                    {chatflow.description && (
                                                        <Typography
                                                            variant='body2'
                                                            sx={{
                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                fontSize: '0.7rem',
                                                                mt: 0.25
                                                            }}
                                                        >
                                                            {chatflow.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center', py: 1, px: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                                                    {(chatflow.category || 'Uncategorized')
                                                        .split(';')
                                                        .map((category: string, index: number) => (
                                                            <Chip
                                                                key={index}
                                                                label={category.trim()}
                                                                size='small'
                                                                sx={{
                                                                    height: 16,
                                                                    fontSize: '0.6rem',
                                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                    '& .MuiChip-label': {
                                                                        px: 0.5,
                                                                        py: 0.125
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    py: 1,
                                                    px: 1
                                                }}
                                            >
                                                {chatflow.isOwner ? 'Me' : chatflow.userId}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    py: 1,
                                                    px: 1
                                                }}
                                            >
                                                {format(new Date(chatflow.createdDate), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    py: 1,
                                                    px: 1
                                                }}
                                            >
                                                {format(new Date(chatflow.updatedDate), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center', py: 1, px: 1 }}>
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Tooltip title='View Chatflow' placement='top'>
                                                        <IconButton
                                                            size='small'
                                                            component={Link}
                                                            to={`/canvas/${chatflow.id}`}
                                                            target='_blank'
                                                            rel='noopener noreferrer'
                                                            sx={{
                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                '&:hover': { color: 'rgba(255, 255, 255, 0.9)' }
                                                            }}
                                                        >
                                                            <VisibilityIcon fontSize='small' />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title='View Metrics' placement='top'>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => handleOpenMetrics(chatflow.id)}
                                                            sx={{
                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                '&:hover': { color: 'rgba(255, 255, 255, 0.9)' }
                                                            }}
                                                        >
                                                            <BarChartIcon fontSize='small' />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {chatflowsData && chatflowsData.length > 0 && (
                    <TablePagination
                        component='div'
                        count={chatflowsData.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            '& .MuiTablePagination-select': {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            '& .MuiTablePagination-selectIcon': {
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            '& .MuiIconButton-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': {
                                    color: 'rgba(255, 255, 255, 0.9)'
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(255, 255, 255, 0.3)'
                                }
                            }
                        }}
                    />
                )}
            </Box>

            {/* Metrics Modal */}
            <Dialog
                open={metricsModalOpen}
                onClose={handleCloseMetrics}
                maxWidth='xl'
                fullWidth
                PaperProps={{
                    sx: {
                        height: '95vh',
                        bgcolor: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='h6'>Chatflow Metrics</Typography>
                        <Button
                            onClick={handleCloseMetrics}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': { color: 'rgba(255, 255, 255, 0.9)' }
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: 'transparent' }}>
                    {selectedChatflowId && (
                        <Box sx={{ height: '100%', overflow: 'hidden' }}>
                            <Metrics chatflowId={selectedChatflowId} />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default AdminChatflows
