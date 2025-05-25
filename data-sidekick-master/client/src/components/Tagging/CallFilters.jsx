import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, IconButton, Chip, Modal, Card, CardContent } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { getApiUrl } from '../../config/api'

const CallFilters = ({ onFilterChange, filters: externalFilters }) => {
    const [callType, setCallType] = useState(externalFilters?.callType || 'all')
    const [employeeId, setEmployeeId] = useState(externalFilters?.employeeId || '')
    const [employees, setEmployees] = useState([])
    const [callTypes, setCallTypes] = useState([])
    const [tagCategories, setTagCategories] = useState({})
    const [isTagModalOpen, setIsTagModalOpen] = useState(false)

    const fetchCallsData = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('api/calls?page=0&pageSize=1000'))
            const data = await response.json()

            // Use a Map to deduplicate employees by ID
            const employeeMap = new Map()
            // Use a Set to deduplicate call types
            const callTypeSet = new Set()

            // Always include "all" as an option
            callTypeSet.add('all')

            for (const call of data.calls) {
                // Process employees
                if (call.EMPLOYEE_ID && call.EMPLOYEE_NAME) {
                    employeeMap.set(call.EMPLOYEE_ID, {
                        id: call.EMPLOYEE_ID,
                        name: call.EMPLOYEE_NAME
                    })
                }

                // Process call types
                if (call.CALL_TYPE) {
                    callTypeSet.add(call.CALL_TYPE.toLowerCase())
                }
            }

            // Convert Map values to array and sort by name
            const uniqueEmployees = Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name))

            // Convert Set to array and sort alphabetically
            const uniqueCallTypes = Array.from(callTypeSet).sort()

            setEmployees(uniqueEmployees)
            setCallTypes(uniqueCallTypes)
        } catch (error) {
            console.error('Error fetching calls data:', error)
        }
    }, [])

    const fetchTagCategories = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('/api/tags'))
            const data = await response.json()
            setTagCategories(data)
        } catch (error) {
            console.error('Error fetching tag categories:', error)
        }
    }, [])

    useEffect(() => {
        fetchCallsData()
        fetchTagCategories()
    }, [fetchCallsData, fetchTagCategories])

    // Update local state when external filters change
    useEffect(() => {
        if (externalFilters) {
            setCallType(externalFilters.callType || 'all')
            setEmployeeId(externalFilters.employeeId || '')
        }
    }, [externalFilters])

    // Notify parent component when filters change
    const handleChange = useCallback(
        (type, value) => {
            const newFilters = {
                ...externalFilters,
                callType: type === 'callType' ? value : callType,
                employeeId: type === 'employeeId' ? value : employeeId
            }
            onFilterChange(newFilters)
        },
        [callType, employeeId, onFilterChange, externalFilters]
    )

    const handleTagDelete = useCallback(
        (tagToDelete) => {
            const newFilters = {
                ...externalFilters,
                selectedTags: externalFilters.selectedTags.filter((tag) => tag !== tagToDelete)
            }
            onFilterChange(newFilters)
        },
        [externalFilters, onFilterChange]
    )

    const handleTagSelect = useCallback(
        (tag) => {
            const newFilters = {
                ...externalFilters,
                selectedTags: externalFilters.selectedTags.includes(tag)
                    ? externalFilters.selectedTags.filter((t) => t !== tag)
                    : [...externalFilters.selectedTags, tag]
            }
            onFilterChange(newFilters)
        },
        [externalFilters, onFilterChange]
    )

    // Helper function to format call type for display
    const formatCallType = (type) => {
        if (type === 'all') return 'All'
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size='small' sx={{ width: 120 }}>
                <InputLabel>Call Type</InputLabel>
                <Select value={callType} label='Call Type' onChange={(e) => handleChange('callType', e.target.value)}>
                    {callTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                            {formatCallType(type)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size='small' sx={{ width: 200 }}>
                <InputLabel>Employee</InputLabel>
                <Select value={employeeId} label='Employee' onChange={(e) => handleChange('employeeId', e.target.value)}>
                    <MenuItem value=''>All Employees</MenuItem>
                    {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                            {emp.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Tags button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    Tags:
                </Typography>
                <IconButton
                    onClick={() => setIsTagModalOpen(true)}
                    size='small'
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: 24,
                        height: 24,
                        '&:hover': {
                            bgcolor: 'primary.dark'
                        }
                    }}
                >
                    <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Selected tags */}
            {externalFilters?.selectedTags?.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {externalFilters.selectedTags.map((tag) => {
                        let color = '#757575'
                        let label = tag

                        // Find the category and subcategory
                        for (const [categoryKey, category] of Object.entries(tagCategories)) {
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
                                key={tag}
                                label={label}
                                size='small'
                                onDelete={() => handleTagDelete(tag)}
                                sx={{
                                    backgroundColor: `${color}22`,
                                    color: (theme) => (theme.palette.mode === 'dark' ? color : 'rgba(0, 0, 0, 0.87)'),
                                    border: `1px solid ${color}`,
                                    '& .MuiChip-deleteIcon': {
                                        color: (theme) => (theme.palette.mode === 'dark' ? color : 'rgba(0, 0, 0, 0.87)'),
                                        '&:hover': {
                                            color: (theme) => (theme.palette.mode === 'dark' ? `${color}99` : 'rgba(0, 0, 0, 0.54)')
                                        }
                                    }
                                }}
                            />
                        )
                    })}
                </Box>
            )}

            {/* Tag Selection Modal */}
            <Modal open={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} aria-labelledby='tag-selection-modal'>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        maxWidth: 800,
                        maxHeight: '80vh',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        overflow: 'auto'
                    }}
                >
                    <Typography variant='h6' component='h2' gutterBottom>
                        Select Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.entries(tagCategories).map(([categoryKey, category]) => (
                            <Card
                                key={categoryKey}
                                sx={{
                                    minWidth: 200,
                                    backgroundColor: `${category.color}11`
                                }}
                            >
                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                    <Typography
                                        variant='subtitle2'
                                        sx={{
                                            color: category.color,
                                            fontWeight: 'bold',
                                            mb: 2
                                        }}
                                    >
                                        {category.label}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {Object.entries(category.subcategories || {}).map(([subKey, subCategory]) => (
                                            <Chip
                                                key={subKey}
                                                label={subCategory.label}
                                                size='small'
                                                onClick={() => handleTagSelect(subKey)}
                                                onDelete={
                                                    externalFilters?.selectedTags?.includes(subKey)
                                                        ? () => handleTagDelete(subKey)
                                                        : undefined
                                                }
                                                sx={{
                                                    backgroundColor: externalFilters?.selectedTags?.includes(subKey)
                                                        ? `${subCategory.color}22`
                                                        : 'transparent',
                                                    color: (theme) =>
                                                        theme.palette.mode === 'dark' ? subCategory.color : 'rgba(0, 0, 0, 0.87)',
                                                    border: `1px solid ${subCategory.color}`,
                                                    '& .MuiChip-deleteIcon': {
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark' ? subCategory.color : 'rgba(0, 0, 0, 0.87)',
                                                        '&:hover': {
                                                            color: (theme) =>
                                                                theme.palette.mode === 'dark'
                                                                    ? `${subCategory.color}99`
                                                                    : 'rgba(0, 0, 0, 0.54)'
                                                        }
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: `${subCategory.color}33`
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Box>
            </Modal>
        </Box>
    )
}

CallFilters.propTypes = {
    onFilterChange: PropTypes.func.isRequired,
    filters: PropTypes.object
}

export default CallFilters
