import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    TableSortLabel,
    Box
} from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { visuallyHidden } from '@mui/utils'

const AgentLeaderboard = ({ data }) => {
    const [orderBy, setOrderBy] = useState('callsHandled')
    const [order, setOrder] = useState('desc')

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
    }

    const sortData = (array) => {
        return array.sort((a, b) => {
            const aValue = a[orderBy]
            const bValue = b[orderBy]

            if (order === 'desc') {
                return bValue - aValue
            }
            return aValue - bValue
        })
    }

    const headCells = [
        { id: 'name', label: 'Employee Name', numeric: false },
        { id: 'callsHandled', label: 'Calls Handled', numeric: true },
        { id: 'resolutionRate', label: 'Resolution Rate (%)', numeric: true },
        { id: 'avgSentiment', label: 'Avg Sentiment', numeric: true },
        { id: 'escalationRate', label: 'Escalation Rate (%)', numeric: true },
        { id: 'avgHandleTime', label: 'Avg Handle Time (min)', numeric: true }
    ]

    // Check if we have valid data
    if (!data || data.length === 0) {
        return (
            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant='h6' gutterBottom>
                    Agent Performance Leaderboard
                </Typography>
                <Alert severity='info'>No agent performance data available.</Alert>
            </Paper>
        )
    }

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6' gutterBottom>
                Agent Performance Leaderboard
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {headCells.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    sortDirection={orderBy === headCell.id ? order : false}
                                >
                                    <TableSortLabel
                                        active={orderBy === headCell.id}
                                        direction={orderBy === headCell.id ? order : 'asc'}
                                        onClick={() => handleRequestSort(headCell.id)}
                                    >
                                        {headCell.label}
                                        {orderBy === headCell.id ? (
                                            <Box component='span' sx={visuallyHidden}>
                                                {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                            </Box>
                                        ) : null}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortData(data).map((agent) => (
                            <TableRow key={agent.id || agent.name}>
                                <TableCell>{agent.name}</TableCell>
                                <TableCell align='right'>{agent.callsHandled}</TableCell>
                                <TableCell align='right'>{agent.resolutionRate}</TableCell>
                                <TableCell align='right'>{agent.avgSentiment.toFixed(1)}</TableCell>
                                <TableCell align='right'>{agent.escalationRate}</TableCell>
                                <TableCell align='right'>{agent.avgHandleTime.toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

AgentLeaderboard.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            name: PropTypes.string.isRequired,
            callsHandled: PropTypes.number.isRequired,
            resolutionRate: PropTypes.number.isRequired,
            avgSentiment: PropTypes.number.isRequired,
            escalationRate: PropTypes.number.isRequired,
            avgHandleTime: PropTypes.number.isRequired
        })
    ).isRequired
}

export default AgentLeaderboard
