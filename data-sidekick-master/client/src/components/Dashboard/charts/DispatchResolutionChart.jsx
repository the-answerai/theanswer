import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const DispatchResolutionChart = ({ data }) => {
    // Calculate totals
    const totalDispatchCalls = data.reduce((sum, emp) => sum + emp.resolved, 0)
    const totalCalls = data.reduce((sum, emp) => sum + emp.total, 0)
    const overallRate = totalCalls > 0 ? Math.round((totalDispatchCalls / totalCalls) * 100) : 0

    // Calculate max rate and add 5% buffer
    const maxRate = data.length > 0 ? Math.max(...data.map((item) => item.rate)) : 0
    const domainMax = Math.ceil((maxRate + 5) / 5) * 5 // Round up to nearest 5%

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6' gutterBottom>
                Dispatch Call Rate by Employee
            </Typography>
            {data.length === 0 ? (
                <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                    No dispatch calls data available
                </Typography>
            ) : (
                <Box>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                        Total Dispatch Calls: {totalDispatchCalls.toLocaleString()}
                        {' | '}
                        Overall Rate: {overallRate}% of all calls
                    </Typography>
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                        Showing {data.length} employees with dispatch calls
                    </Typography>
                    <ResponsiveContainer width='100%' height={Math.max(400, data.length * 50)}>
                        <BarChart data={data} layout='vertical' margin={{ left: 150, right: 50, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                            <XAxis type='number' domain={[0, domainMax]} unit='%' tickFormatter={(value) => `${value}%`} />
                            <YAxis dataKey='name' type='category' width={140} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value, name, props) => [
                                    `${value}% (${props.payload.resolved}/${props.payload.total} calls)`,
                                    'Dispatch Rate'
                                ]}
                                labelStyle={{ color: '#666' }}
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #ccc'
                                }}
                            />
                            <Bar
                                dataKey='rate'
                                fill='#00C49F'
                                radius={[0, 4, 4, 0]}
                                label={{
                                    position: 'right',
                                    formatter: (value) => `${value}%`,
                                    fill: '#666',
                                    fontSize: 12
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    )
}

DispatchResolutionChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            resolved: PropTypes.number.isRequired
        })
    ).isRequired
}

export default DispatchResolutionChart
