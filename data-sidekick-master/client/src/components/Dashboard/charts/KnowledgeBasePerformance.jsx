import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Grid } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const KnowledgeBasePerformance = ({ data, SampleDataIndicator }) => {
    return (
        <Box>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant='h6'>Knowledge Base Performance</Typography>
                            {SampleDataIndicator && <SampleDataIndicator />}
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Article</TableCell>
                                        <TableCell align='right'>Views</TableCell>
                                        <TableCell align='right'>Success Rate</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.map((article) => (
                                        <TableRow key={article.article}>
                                            <TableCell>{article.article}</TableCell>
                                            <TableCell align='right'>{article.views}</TableCell>
                                            <TableCell align='right'>{article.successRate}%</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant='h6'>Knowledge Base Success Rates</Typography>
                        <ResponsiveContainer width='100%' height={325}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='article' angle={-45} textAnchor='end' height={150} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey='successRate' fill='#82ca9d' name='Success Rate (%)' />
                                <Bar dataKey='views' fill='#8884d8' name='Views' />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

KnowledgeBasePerformance.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            article: PropTypes.string.isRequired,
            views: PropTypes.number.isRequired,
            successRate: PropTypes.number.isRequired
        })
    ).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default KnowledgeBasePerformance
