import { Paper, Typography, Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const SentimentFlow = ({ data, SampleDataIndicator }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Sentiment Flow by Category</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <ResponsiveContainer width='100%' height={400}>
                <BarChart data={data} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' domain={[0, 10]} />
                    <YAxis dataKey='category' type='category' width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='beforeSentiment' fill='#ff8042' name='Before Resolution' />
                    <Bar dataKey='afterSentiment' fill='#82ca9d' name='After Resolution' />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    )
}

SentimentFlow.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            category: PropTypes.string.isRequired,
            beforeSentiment: PropTypes.number.isRequired,
            afterSentiment: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default SentimentFlow
