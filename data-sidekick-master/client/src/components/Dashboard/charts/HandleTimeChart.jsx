import { Paper, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const HandleTimeChart = ({ data }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6'>Average Handle Time by Agent (minutes)</Typography>
            <ResponsiveContainer width='100%' height={400}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' angle={-45} textAnchor='end' height={120} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='time' fill='#82ca9d' />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    )
}

HandleTimeChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            time: PropTypes.number.isRequired
        })
    ).isRequired
}

export default HandleTimeChart
