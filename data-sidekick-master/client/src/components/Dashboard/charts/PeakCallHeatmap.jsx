import { Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import PropTypes from 'prop-types'

const PeakCallHeatmap = ({ data, SampleDataIndicator }) => {
    const getHeatmapColor = (value) => {
        if (value >= 80) return '#ff0000'
        if (value >= 60) return '#ff8c00'
        if (value >= 40) return '#ffd700'
        if (value >= 20) return '#98fb98'
        return '#90ee90'
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Peak Call Hours Heatmap</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Hour</TableCell>
                            {days.map((day) => (
                                <TableCell key={day} align='center'>
                                    {day}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.hour}>
                                <TableCell>{row.hour}</TableCell>
                                {days.map((day) => (
                                    <TableCell
                                        key={day}
                                        align='center'
                                        sx={{
                                            bgcolor: getHeatmapColor(row[day]),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {row[day]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

PeakCallHeatmap.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            hour: PropTypes.string.isRequired,
            Mon: PropTypes.number.isRequired,
            Tue: PropTypes.number.isRequired,
            Wed: PropTypes.number.isRequired,
            Thu: PropTypes.number.isRequired,
            Fri: PropTypes.number.isRequired,
            Sat: PropTypes.number.isRequired,
            Sun: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default PeakCallHeatmap
