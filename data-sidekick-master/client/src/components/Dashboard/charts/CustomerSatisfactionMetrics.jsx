import { Paper, Typography, Box } from '@mui/material'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const CustomerSatisfactionMetrics = ({ data, SampleDataIndicator }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Customer Satisfaction Metrics Over Time</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <ResponsiveContainer width='100%' height={400}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis yAxisId='left' />
                    <YAxis yAxisId='right' orientation='right' domain={[0, 1200]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId='left' type='monotone' dataKey='nps' stroke='#8884d8' name='NPS Score' />
                    <Line yAxisId='left' type='monotone' dataKey='csat' stroke='#82ca9d' name='CSAT Score' />
                    <Bar yAxisId='right' dataKey='callVolume' fill='#ffc658' name='Call Volume' opacity={0.3} />
                </ComposedChart>
            </ResponsiveContainer>
        </Paper>
    )
}

CustomerSatisfactionMetrics.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            month: PropTypes.string.isRequired,
            nps: PropTypes.number.isRequired,
            csat: PropTypes.number.isRequired,
            callVolume: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default CustomerSatisfactionMetrics
