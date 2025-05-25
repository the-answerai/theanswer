import { Box, Typography, Card, CardHeader, CardContent, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ChatPerformanceMetrics = ({ data, SampleDataIndicator }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant='h6'>Chat Performance Metrics</Typography>
                        {SampleDataIndicator && <SampleDataIndicator />}
                    </Box>
                }
                subheader='Key performance indicators for AI chat system'
            />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ height: 400, width: '100%' }}>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart
                                    data={data}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5
                                    }}
                                >
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='month' />
                                    <YAxis yAxisId='left' orientation='left' stroke='#8884d8' />
                                    <YAxis yAxisId='right' orientation='right' stroke='#82ca9d' />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            switch (name) {
                                                case 'userSatisfaction':
                                                    return [`${value}%`, 'User Satisfaction']
                                                case 'responseTime':
                                                    return [`${value}s`, 'Avg. Response Time']
                                                case 'messagingVolume':
                                                    return [`${value}`, 'Total Messages']
                                                default:
                                                    return [value, name]
                                            }
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId='left' dataKey='userSatisfaction' name='User Satisfaction' fill='#8884d8' />
                                    <Bar yAxisId='left' dataKey='responseTime' name='Avg. Response Time (s)' fill='#82ca9d' />
                                    <Bar yAxisId='right' dataKey='messagingVolume' name='Total Messages' fill='#ffc658' />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

ChatPerformanceMetrics.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            month: PropTypes.string.isRequired,
            userSatisfaction: PropTypes.number.isRequired,
            responseTime: PropTypes.number.isRequired,
            messagingVolume: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default ChatPerformanceMetrics
