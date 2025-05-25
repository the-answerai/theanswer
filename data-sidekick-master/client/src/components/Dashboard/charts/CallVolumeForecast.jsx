import { Paper, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const CallVolumeForecast = ({ SampleDataIndicator }) => {
    // Sample forecast data
    const data = [
        { date: 'Week 1', actual: 850, forecast: 840 },
        { date: 'Week 2', actual: 920, forecast: 900 },
        { date: 'Week 3', actual: 880, forecast: 890 },
        { date: 'Week 4', actual: 950, forecast: 930 },
        { date: 'Week 5', forecast: 970 },
        { date: 'Week 6', forecast: 1020 },
        { date: 'Week 7', forecast: 1080 },
        { date: 'Week 8', forecast: 1150 }
    ]

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Call Volume Forecast</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <ResponsiveContainer width='100%' height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' />
                    <YAxis domain={[0, 1200]} />
                    <Tooltip />
                    <Legend />
                    <Line type='monotone' dataKey='actual' stroke='#8884d8' name='Actual Volume' strokeWidth={2} />
                    <Line type='monotone' dataKey='forecast' stroke='#82ca9d' name='Forecasted Volume' strokeDasharray='5 5' />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    )
}

CallVolumeForecast.propTypes = {
    SampleDataIndicator: PropTypes.elementType
}

export default CallVolumeForecast
