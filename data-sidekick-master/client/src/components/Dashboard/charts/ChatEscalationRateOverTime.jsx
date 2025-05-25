import { Box, Typography, Card, CardHeader, CardContent } from '@mui/material'
import PropTypes from 'prop-types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ChatEscalationRateOverTime = ({ data, SampleDataIndicator }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant='h6'>AI to Human Escalation Rate</Typography>
                        {SampleDataIndicator && <SampleDataIndicator />}
                    </Box>
                }
                subheader='Percentage of AI chats escalated to human agents over time'
            />
            <CardContent>
                <Box sx={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer width='100%' height='100%'>
                        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='date' />
                            <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Escalation Rate']} />
                            <Legend />
                            <Line type='monotone' dataKey='rate' name='Escalation Rate' stroke='#8884d8' activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    )
}

ChatEscalationRateOverTime.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            date: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default ChatEscalationRateOverTime
