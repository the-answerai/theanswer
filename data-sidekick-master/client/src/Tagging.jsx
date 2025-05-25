import { useState, useEffect, useCallback } from 'react'
import { TagCloud as ReactTagCloud } from 'react-tagcloud'
import { Box, Paper, FormControl, InputLabel, Select, MenuItem, ToggleButton, ToggleButtonGroup, Typography, Grid } from '@mui/material'
import AITagging from './components/Tagging/AITagging'
import { getApiUrl } from './config/api'

const TagCloudComponent = () => {
    const [tags, setTags] = useState([])
    const [callType, setCallType] = useState('all')
    const [employeeId, setEmployeeId] = useState('')
    const [employees, setEmployees] = useState([])

    const fetchTags = useCallback(async () => {
        try {
            const queryParams = new URLSearchParams({
                callType,
                employeeId
            })
            const response = await fetch(getApiUrl(`/api/tag-stats?${queryParams}`))
            const data = await response.json()

            // Sort tags by frequency
            const sortedTags = [...data].sort((a, b) => b.value - a.value)
            setTags(sortedTags)
        } catch (error) {
            console.error('Error fetching tags:', error)
        }
    }, [callType, employeeId])

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl('/api/calls?page=0&pageSize=1000'))
            const data = await response.json()
            const uniqueEmployees = Array.from(
                new Set(
                    data.calls.map((call) => ({
                        id: call.EMPLOYEE_ID,
                        name: call.EMPLOYEE_NAME
                    }))
                )
            ).filter((emp) => emp.id && emp.name)
            setEmployees(uniqueEmployees)
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }, [])

    useEffect(() => {
        fetchTags()
    }, [fetchTags])

    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    return (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant='h5' gutterBottom>
                Tag Analysis
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <ToggleButtonGroup
                    value={callType}
                    exclusive
                    onChange={(e, newValue) => setCallType(newValue || 'all')}
                    aria-label='call type'
                >
                    <ToggleButton value='all'>All</ToggleButton>
                    <ToggleButton value='inbound'>Inbound</ToggleButton>
                    <ToggleButton value='outbound'>Outbound</ToggleButton>
                </ToggleButtonGroup>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Employee</InputLabel>
                    <Select value={employeeId} label='Employee' onChange={(e) => setEmployeeId(e.target.value)}>
                        <MenuItem value=''>All Employees</MenuItem>
                        {employees.map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>
                                {emp.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box
                sx={{
                    minHeight: 300,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 4
                }}
            >
                {tags.length > 0 ? (
                    <ReactTagCloud
                        minSize={12}
                        maxSize={35}
                        tags={tags}
                        colorOptions={{
                            luminosity: 'dark',
                            hue: 'blue'
                        }}
                    />
                ) : (
                    <Typography variant='body1' color='text.secondary'>
                        No tags found for the selected filters
                    </Typography>
                )}
            </Box>
        </Paper>
    )
}

const Tagging = () => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <AITagging />
            </Grid>
            <Grid item xs={12}>
                <TagCloudComponent />
            </Grid>
        </Grid>
    )
}

export default Tagging
