import { Paper, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const EscalationRateChart = ({ data }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant='h6'>Escalation Rate by Agent (%)</Typography>
            <ResponsiveContainer width='100%' height={400}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' angle={-45} textAnchor='end' height={120} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='rate' fill='#8884d8' />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    )
}

EscalationRateChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired
        })
    ).isRequired
}

export default EscalationRateChart
