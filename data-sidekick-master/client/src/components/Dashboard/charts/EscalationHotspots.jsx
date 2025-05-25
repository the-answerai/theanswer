import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material'
import PropTypes from 'prop-types'

const EscalationHotspots = ({ data, SampleDataIndicator }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Escalation Hotspots</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Topic</TableCell>
                            <TableCell align='right'>Count</TableCell>
                            <TableCell align='right'>Percentage</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((topic) => (
                            <TableRow key={topic.topic}>
                                <TableCell>{topic.topic}</TableCell>
                                <TableCell align='right'>{topic.count}</TableCell>
                                <TableCell align='right'>{topic.percentage}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

EscalationHotspots.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            topic: PropTypes.string.isRequired,
            count: PropTypes.number.isRequired,
            percentage: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default EscalationHotspots
