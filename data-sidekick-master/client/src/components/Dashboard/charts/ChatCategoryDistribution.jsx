import { Box, Typography, Card, CardHeader, CardContent } from '@mui/material'
import PropTypes from 'prop-types'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const ChatCategoryDistribution = ({ data, SampleDataIndicator }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant='h6'>Chat Category Distribution</Typography>
                        {SampleDataIndicator && <SampleDataIndicator />}
                    </Box>
                }
                subheader='Distribution of chat conversations by category'
            />
            <CardContent>
                <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                            <Pie
                                data={data}
                                cx='50%'
                                cy='50%'
                                labelLine={true}
                                outerRadius={100}
                                fill='#8884d8'
                                dataKey='value'
                                nameKey='name'
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} chats`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    )
}

ChatCategoryDistribution.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default ChatCategoryDistribution
