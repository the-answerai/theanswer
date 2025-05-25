import { Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText, Button, CircularProgress } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

const AverageHandleTime = ({ data, tagCategories, onCategoryClick }) => {
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [chartData, setChartData] = useState(data)
    const [title, setTitle] = useState('Average Handle Time by Category')
    const [loading, setLoading] = useState(false)

    const handleCategoryClick = async (category) => {
        if (!selectedCategory || selectedCategory.slug !== category.slug) {
            setLoading(true)
            try {
                // Get subcategory data
                const subcategoryData = await onCategoryClick(category)

                // Transform the data for the chart
                const subcategoriesData = Object.entries(category.subcategories || {})
                    .map(([subKey, subcat]) => ({
                        name: subcat.label,
                        avgTime: subcategoryData.averageHandleTimes[subKey] || 0,
                        color: subcat.shade || category.color
                    }))
                    .filter((item) => item.avgTime > 0)
                    .sort((a, b) => b.avgTime - a.avgTime)

                setChartData(subcategoriesData)
                setSelectedCategory(category)
                setTitle(`Average Handle Time - ${category.label}`)
            } catch (error) {
                console.error('Error handling category click:', error)
            } finally {
                setLoading(false)
            }
        } else {
            // Go back to main view
            setChartData(data)
            setSelectedCategory(null)
            setTitle('Average Handle Time by Category')
        }
    }

    const handleBackClick = () => {
        setChartData(data)
        setSelectedCategory(null)
        setTitle('Average Handle Time by Category')
    }

    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}
            >
                <Typography variant='h6'>{title}</Typography>
                {selectedCategory && (
                    <Button variant='outlined' size='small' onClick={handleBackClick} startIcon={<ArrowBackIcon />}>
                        Back to Categories
                    </Button>
                )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Categories List */}
                <Box sx={{ borderRight: 1, borderColor: 'divider' }}>
                    <List>
                        {Object.entries(tagCategories).map(([slug, category]) => {
                            const avgTime = data.find((d) => d.name === category.label)?.avgTime || 0
                            return (
                                <ListItem key={slug} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleCategoryClick({ ...category, slug })}
                                        selected={selectedCategory?.slug === slug}
                                        disabled={loading}
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: `${category.color}22`,
                                                '&:hover': {
                                                    backgroundColor: `${category.color}33`
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemText primary={category.label} secondary={`${avgTime.toFixed(1)} minutes`} />
                                    </ListItemButton>
                                </ListItem>
                            )
                        })}
                    </List>
                </Box>

                {/* Bar Chart */}
                <Box
                    sx={{
                        width: '80%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <ResponsiveContainer width={'100%'} height={400}>
                            <BarChart
                                data={chartData}
                                layout='vertical'
                                // margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis type='number' unit=' min' />
                                <YAxis dataKey='name' type='category' width={150} />
                                <Tooltip formatter={(value) => [`${value.toFixed(1)} min`, 'Avg Time']} />
                                <Bar dataKey='avgTime' fill='#8884d8'>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Box>
            </Box>
        </Paper>
    )
}

AverageHandleTime.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            avgTime: PropTypes.number.isRequired
        })
    ).isRequired,
    tagCategories: PropTypes.object.isRequired,
    onCategoryClick: PropTypes.func.isRequired
}

export default AverageHandleTime
