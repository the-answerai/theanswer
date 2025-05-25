import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Paper, Chip, Slider } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import CallPanel from './CallPanel'
import { getApiUrl } from '../../config/api'
import CallFilters from '../Tagging/CallFilters'
import PropTypes from 'prop-types'
import { SENTIMENT_EMOJIS, getSentimentGradient } from '../../utils/sentimentEmojis'

const defaultFilters = {
    callType: 'all',
    employeeId: '',
    selectedTags: [],
    sentimentRange: [1, 10],
    resolutionStatus: 'all',
    escalated: 'all'
}

const CallList = memo(function CallList({
    isEmbedded = false,
    onFilterChange,
    filters: externalFilters,
    hideFilters = false,
    onSelectionChange,
    selectedCalls = [],
    showSelection = true
}) {
    const [state, setState] = useState({
        calls: [],
        loading: true,
        selectedCall: null,
        tagCategories: {},
        totalRows: 0,
        localFilters: defaultFilters,
        paginationModel: {
            page: 0,
            pageSize: 10
        },
        selectionModel: selectedCalls
    })

    // Use external filters if provided, otherwise use local filters
    const filters = useMemo(() => externalFilters || state.localFilters, [externalFilters, state.localFilters])

    // Fetch data
    useEffect(() => {
        let isMounted = true

        const fetchData = async () => {
            if (!isMounted) return

            setState((prev) => ({ ...prev, loading: true }))

            try {
                const queryParams = new URLSearchParams({
                    page: state.paginationModel.page,
                    pageSize: state.paginationModel.pageSize,
                    callType: filters.callType,
                    employeeId: filters.employeeId,
                    tags: JSON.stringify(filters.selectedTags),
                    sentimentMin: filters.sentimentRange[0],
                    sentimentMax: filters.sentimentRange[1],
                    resolutionStatus: filters.resolutionStatus,
                    escalated: filters.escalated
                })

                const response = await fetch(getApiUrl(`/api/calls?${queryParams}`))
                const data = await response.json()

                if (!isMounted) return

                const callsWithIds = data.calls.map((call) => ({
                    ...call,
                    id: call.RECORDING_URL || `${call.EMPLOYEE_ID}-${call.TIMESTAMP}`
                }))

                setState((prev) => ({
                    ...prev,
                    calls: callsWithIds,
                    totalRows: data.total,
                    loading: false
                }))
            } catch (error) {
                console.error('[CallList] Error fetching calls:', error)
                if (isMounted) {
                    setState((prev) => ({ ...prev, loading: false }))
                }
            }
        }

        fetchData()
        return () => {
            isMounted = false
        }
    }, [filters, state.paginationModel.page, state.paginationModel.pageSize])

    // Fetch tag categories
    useEffect(() => {
        let isMounted = true

        const fetchTags = async () => {
            try {
                const response = await fetch(getApiUrl('/api/tags'))
                const data = await response.json()
                if (isMounted) {
                    setState((prev) => ({ ...prev, tagCategories: data }))
                }
            } catch (error) {
                console.error('[CallList] Error fetching tags:', error)
            }
        }

        fetchTags()
        return () => {
            isMounted = false
        }
    }, [])

    // Handle filter updates
    const handleFilterUpdate = useCallback(
        (newFilters) => {
            if (onFilterChange) {
                onFilterChange(newFilters)
            } else {
                setState((prev) => ({
                    ...prev,
                    localFilters: newFilters,
                    paginationModel: { ...prev.paginationModel, page: 0 }
                }))
            }
        },
        [onFilterChange]
    )

    // Handle row click
    const handleRowClick = useCallback((params) => {
        setState((prev) => ({ ...prev, selectedCall: params.row }))
    }, [])

    // Handle panel close
    const handlePanelClose = useCallback(() => {
        setState((prev) => ({ ...prev, selectedCall: null }))
    }, [])

    // Handle selection changes
    useEffect(() => {
        if (onSelectionChange && showSelection) {
            onSelectionChange(state.selectionModel)
        }
    }, [state.selectionModel, onSelectionChange, showSelection])

    // Memoize columns to prevent re-renders
    const columns = useMemo(
        () => [
            { field: 'EMPLOYEE_NAME', headerName: 'Employee Name', width: 180 },
            { field: 'CALLER_NAME', headerName: 'Caller Name', width: 180 },
            { field: 'CALL_NUMBER', headerName: 'Phone Number', width: 150 },
            {
                field: 'sentiment_score',
                headerName: 'Sentiment',
                width: 100,
                renderCell: (params) => {
                    const score = params.value
                    return score ? SENTIMENT_EMOJIS[Math.round(score)] : '😐'
                }
            },
            {
                field: 'resolution_status',
                headerName: 'Resolution',
                width: 130,
                renderCell: (params) => {
                    const value = params.value || 'unresolved'
                    const chipProps = {
                        resolved: { color: 'success', label: 'Resolved' },
                        dispatch: { color: 'warning', label: 'Dispatch' },
                        escalated: { color: 'error', label: 'Escalated' },
                        followup: { color: 'info', label: 'Follow-up' },
                        unresolved: { color: 'default', label: 'Unresolved' }
                    }

                    const { color, label } = chipProps[value] || chipProps.unresolved

                    return <Chip label={label} size='small' color={color} variant='outlined' />
                }
            },
            {
                field: 'escalated',
                headerName: 'Escalated',
                width: 100,
                renderCell: (params) => (
                    <Chip label={params.value ? 'Yes' : 'No'} size='small' color={params.value ? 'error' : 'success'} variant='outlined' />
                )
            },
            { field: 'CALL_DURATION', headerName: 'Duration (s)', width: 130 },
            { field: 'CALL_TYPE', headerName: 'Call Type', width: 130 },
            {
                field: 'TAGS_ARRAY',
                headerName: 'Tags',
                width: 400,
                flex: 1,
                renderCell: (params) => {
                    const tags = params.value || []
                    return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {tags.map((tag) => {
                                let color = '#757575'
                                let label = tag

                                // Find the category and subcategory
                                for (const [categoryKey, category] of Object.entries(state.tagCategories)) {
                                    if (tag === categoryKey) {
                                        color = category.color
                                        label = category.label
                                        break
                                    }
                                    if (category.subcategories[tag]) {
                                        color = category.subcategories[tag].color
                                        label = category.subcategories[tag].label
                                        break
                                    }
                                }

                                return (
                                    <Chip
                                        key={`${params.row.id}-${tag}`}
                                        label={label}
                                        size='small'
                                        sx={{
                                            backgroundColor: `${color}22`,
                                            color: (theme) => (theme.palette.mode === 'dark' ? color : 'rgba(0, 0, 0, 0.87)'),
                                            border: `1px solid ${color}`,
                                            '&:hover': {
                                                backgroundColor: `${color}33`
                                            }
                                        }}
                                    />
                                )
                            })}
                        </Box>
                    )
                }
            }
        ],
        [state.tagCategories] // Only depend on tagCategories
    )

    return (
        <Box>
            {!isEmbedded && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                    }}
                >
                    <Typography variant='h4' component='h1'>
                        Call List
                    </Typography>
                </Box>
            )}

            {/* Filters */}
            {!hideFilters && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            flexWrap: 'wrap'
                        }}
                    >
                        {/* Call Type, Employee, and Tag filters */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <FormControl size='small' sx={{ width: 120 }}>
                                <InputLabel>Resolution</InputLabel>
                                <Select
                                    value={filters.resolutionStatus}
                                    label='Resolution'
                                    onChange={(e) =>
                                        handleFilterUpdate({
                                            ...filters,
                                            resolutionStatus: e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value='all'>All</MenuItem>
                                    <MenuItem value='resolved'>Resolved</MenuItem>
                                    <MenuItem value='dispatch'>Dispatch</MenuItem>
                                    <MenuItem value='escalated'>Escalated</MenuItem>
                                    <MenuItem value='followup'>Follow-up</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size='small' sx={{ width: 120 }}>
                                <InputLabel>Escalated</InputLabel>
                                <Select
                                    value={filters.escalated}
                                    label='Escalated'
                                    onChange={(e) =>
                                        handleFilterUpdate({
                                            ...filters,
                                            escalated: e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value='all'>All</MenuItem>
                                    <MenuItem value='true'>Yes</MenuItem>
                                    <MenuItem value='false'>No</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <CallFilters onFilterChange={handleFilterUpdate} filters={filters} />

                        {/* Sentiment range */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flex: 1,
                                maxWidth: 400
                            }}
                        >
                            <Typography variant='body2' sx={{ color: 'text.secondary', minWidth: 65 }}>
                                Sentiment:
                            </Typography>
                            <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[0]]}</Typography>
                            <Slider
                                value={filters.sentimentRange}
                                onChange={(_, newValue) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        sentimentRange: newValue
                                    })
                                }
                                min={1}
                                max={10}
                                step={1}
                                size='small'
                                valueLabelDisplay='auto'
                                valueLabelFormat={(value) => SENTIMENT_EMOJIS[value]}
                                sx={{
                                    '& .MuiSlider-rail': {
                                        background: getSentimentGradient(),
                                        opacity: 1
                                    }
                                }}
                            />
                            <Typography variant='body2'>{SENTIMENT_EMOJIS[filters.sentimentRange[1]]}</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Data Grid */}
            <Box sx={{ height: isEmbedded ? 'calc(100vh - 280px)' : 600 }}>
                <DataGrid
                    rows={state.calls}
                    columns={columns}
                    paginationModel={state.paginationModel}
                    onPaginationModelChange={(model) => setState((prev) => ({ ...prev, paginationModel: model }))}
                    pageSizeOptions={[10, 25, 50]}
                    rowCount={state.totalRows}
                    paginationMode='server'
                    loading={state.loading}
                    checkboxSelection={showSelection}
                    rowSelectionModel={state.selectionModel}
                    onRowSelectionModelChange={(newModel) => {
                        if (showSelection) {
                            setState((prev) => ({ ...prev, selectionModel: newModel }))
                        }
                    }}
                    keepNonExistentRowsSelected
                    onRowClick={handleRowClick}
                    sx={{ cursor: 'pointer', height: '100%' }}
                />
            </Box>

            {/* Call Panel */}
            {state.selectedCall && (
                <CallPanel
                    key={state.selectedCall.id}
                    call={state.selectedCall}
                    open={!!state.selectedCall}
                    onClose={handlePanelClose}
                    tagCategories={state.tagCategories}
                />
            )}
        </Box>
    )
})

CallList.propTypes = {
    isEmbedded: PropTypes.bool,
    onFilterChange: PropTypes.func,
    filters: PropTypes.object,
    hideFilters: PropTypes.bool,
    onSelectionChange: PropTypes.func,
    selectedCalls: PropTypes.array,
    showSelection: PropTypes.bool
}

export default CallList
