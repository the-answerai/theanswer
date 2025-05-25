import { Paper, Typography } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const FCRTrendChart = ({ data }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6'>First Call Resolution Rate Trend</Typography>
            <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type='monotone' dataKey='rate' stroke='#8884d8' fill='#8884d8' name='FCR Rate (%)' />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>
    )
}

FCRTrendChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            month: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired,
            total: PropTypes.number.isRequired,
            resolved: PropTypes.number.isRequired
        })
    ).isRequired
}

export default FCRTrendChart
