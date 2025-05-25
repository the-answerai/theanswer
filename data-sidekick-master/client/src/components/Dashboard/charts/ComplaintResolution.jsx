import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const ComplaintResolution = ({ data, SampleDataIndicator }) => {
    const calculateTotalVolume = () => {
        return data.reduce((acc, curr) => acc + curr.totalComplaints, 0)
    }

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant='h6'>Complaint Resolution Analysis</Typography>
                    {SampleDataIndicator && <SampleDataIndicator />}
                </Box>
                <ResponsiveContainer width='100%' height={400}>
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='priority' />
                        <YAxis yAxisId='left' />
                        <YAxis yAxisId='right' orientation='right' />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId='right' dataKey='totalComplaints' fill='#8884d8' name='Total Complaints' />
                        <Line
                            yAxisId='left'
                            type='monotone'
                            dataKey='avgResolutionTime'
                            stroke='#82ca9d'
                            name='Avg Resolution Time (hrs)'
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </Paper>

            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant='h6' gutterBottom>
                    Resolution Time Statistics
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Priority Level</TableCell>
                                <TableCell align='right'>Total Complaints</TableCell>
                                <TableCell align='right'>Avg Resolution Time (hrs)</TableCell>
                                <TableCell align='right'>% of Total Volume</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={row.priority}>
                                    <TableCell>{row.priority}</TableCell>
                                    <TableCell align='right'>{row.totalComplaints}</TableCell>
                                    <TableCell align='right'>{row.avgResolutionTime}</TableCell>
                                    <TableCell align='right'>{Math.round((row.totalComplaints / calculateTotalVolume()) * 100)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    )
}

ComplaintResolution.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            priority: PropTypes.string.isRequired,
            avgResolutionTime: PropTypes.number.isRequired,
            totalComplaints: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default ComplaintResolution
