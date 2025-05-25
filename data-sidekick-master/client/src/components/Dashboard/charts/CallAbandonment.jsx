import { Paper, Typography, Box } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const CallAbandonment = ({ data, SampleDataIndicator }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Call Abandonment Rate</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <ResponsiveContainer width='100%' height={400}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='hour' />
                    <YAxis yAxisId='left' />
                    <YAxis yAxisId='right' orientation='right' />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId='left' type='monotone' dataKey='rate' stroke='#8884d8' name='Abandonment Rate (%)' />
                    <Line yAxisId='right' type='monotone' dataKey='calls' stroke='#82ca9d' name='Total Calls' />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    )
}

CallAbandonment.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            hour: PropTypes.string.isRequired,
            rate: PropTypes.number.isRequired,
            calls: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default CallAbandonment
