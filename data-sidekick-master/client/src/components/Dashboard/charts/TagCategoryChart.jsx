import { Box, Typography, Paper } from '@mui/material'
import PropTypes from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TagCategoryChart = ({ category, data }) => {
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant='h6' component='h3' gutterBottom>
                    {category.label}
                </Typography>
                {category.description && (
                    <Typography variant='body2' color='text.secondary' gutterBottom>
                        {category.description}
                    </Typography>
                )}
            </Box>

            <ResponsiveContainer width='100%' height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={category.color || '#1976d2'} />
                </BarChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 2 }}>
                {data.map((item) => (
                    <Box key={`${category.slug}-${item.name}`} sx={{ mb: 1 }}>
                        <Typography variant='subtitle2' component='div'>
                            {item.name} ({item.value} calls)
                        </Typography>
                        {item.description && (
                            <Typography variant='body2' color='text.secondary'>
                                {item.description}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Box>
        </Paper>
    )
}

TagCategoryChart.propTypes = {
    category: PropTypes.shape({
        slug: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        color: PropTypes.string
    }).isRequired,
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
            description: PropTypes.string
        })
    ).isRequired
}

export default TagCategoryChart
