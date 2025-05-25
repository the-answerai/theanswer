import { Paper, Typography } from '@mui/material'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const CustomerSatisfaction = ({ data }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6'>Category Satisfaction Analysis</Typography>
            <ResponsiveContainer width='100%' height={400}>
                <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis
                        yAxisId='left'
                        domain={[0, 10]}
                        label={{
                            value: 'Sentiment Score',
                            angle: -90,
                            position: 'insideLeft'
                        }}
                    />
                    <YAxis yAxisId='right' orientation='right' label={{ value: 'Call Volume', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId='left' dataKey='sentiment' fill='#8884d8' name='Sentiment Score' />
                    <Line yAxisId='right' type='monotone' dataKey='volume' stroke='#82ca9d' name='Call Volume' />
                </ComposedChart>
            </ResponsiveContainer>
        </Paper>
    )
}

CustomerSatisfaction.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            sentiment: PropTypes.number.isRequired,
            volume: PropTypes.number.isRequired
        })
    ).isRequired,
    tagCategories: PropTypes.object.isRequired
}

export default CustomerSatisfaction
