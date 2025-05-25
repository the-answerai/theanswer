import { Paper, Typography } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import PropTypes from 'prop-types'

const TotalCallsTrend = ({ data }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6'>Total Calls Trend</Typography>
            <LineChart width={500} height={300} data={data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type='monotone' dataKey='inbound' stroke='#8884d8' />
                <Line type='monotone' dataKey='outbound' stroke='#82ca9d' />
            </LineChart>
        </Paper>
    )
}

TotalCallsTrend.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            month: PropTypes.string.isRequired,
            inbound: PropTypes.number.isRequired,
            outbound: PropTypes.number.isRequired
        })
    ).isRequired
}

export default TotalCallsTrend
