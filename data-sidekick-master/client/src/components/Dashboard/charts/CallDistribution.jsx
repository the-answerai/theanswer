import { Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText, Button, CircularProgress } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

const CallDistribution = ({ data, tagCategories, onCategoryClick }) => {
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [chartData, setChartData] = useState(data)
    const [title, setTitle] = useState('Call Reasons Distribution')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!selectedCategory) {
            console.log('Setting initial chart data:', data)
            setChartData(data)
            setTitle('Call Reasons Distribution')
        }
    }, [data, selectedCategory])

    const handleCategoryClick = async (category) => {
        console.log('Category clicked:', category)

        if (!selectedCategory || selectedCategory.slug !== category.slug) {
            setLoading(true)
            try {
                // Get subcategory data
                console.log('Fetching subcategory data for:', category.label)
                const subcategoryData = await onCategoryClick(category)
                console.log('Received subcategory data:', subcategoryData)

                // Transform the data for the chart
                const subcategoriesData = Object.entries(category.subcategories || {})
                    .map(([subKey, subcat]) => {
                        const value = subcategoryData.counts[subKey] || 0
                        console.log(`Mapping subcategory ${subcat.label} with value ${value}`)
                        return {
                            name: subcat.label,
                            value: value,
                            color: subcat.shade || category.color
                        }
                    })
                    .filter((item) => item.value > 0) // Only show subcategories with values
                    .sort((a, b) => b.value - a.value) // Sort by value descending

                console.log('Final chart data:', subcategoriesData)
                setChartData(subcategoriesData)
                setSelectedCategory(category)
                setTitle(`${category.label} Distribution`)
            } catch (error) {
                console.error('Error handling category click:', error)
            } finally {
                setLoading(false)
            }
        } else {
            // Go back to main view
            console.log('Returning to main view')
            setChartData(data)
            setSelectedCategory(null)
            setTitle('Call Reasons Distribution')
        }
    }

    // Add a "Back to Categories" button when viewing subcategories
    const handleBackClick = () => {
        console.log('Back button clicked, returning to main view')
        setChartData(data)
        setSelectedCategory(null)
        setTitle('Call Reasons Distribution')
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
                            const count = data.find((d) => d.name === category.label)?.value || 0
                            console.log(`Rendering category ${category.label} with count ${count}`)
                            return (
                                <ListItem key={slug} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleCategoryClick({ ...category, slug })}
                                        selected={selectedCategory?.slug === slug}
                                        disabled={loading}
                                        sx={{
                                            paddingLeft: 0,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                            '&.Mui-selected': {
                                                backgroundColor: `${category.color}22`,
                                                '&:hover': {
                                                    backgroundColor: `${category.color}33`
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemText primary={category.label} secondary={`${count} calls`} />
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
                            <BarChart data={chartData} layout='horizontal' margin={{ bottom: 200 }}>
                                <XAxis dataKey='name' type='category' angle={-45} textAnchor='end' />
                                <YAxis type='number' />
                                <Tooltip />
                                {/* <Legend /> */}
                                <Bar dataKey='value' fill='#8884d8'>
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

CallDistribution.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired
        })
    ).isRequired,
    tagCategories: PropTypes.object.isRequired,
    onCategoryClick: PropTypes.func.isRequired
}

export default CallDistribution
