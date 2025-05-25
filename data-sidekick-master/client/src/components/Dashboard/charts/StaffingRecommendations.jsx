import { Paper, Typography, Box } from '@mui/material'
import PropTypes from 'prop-types'

const StaffingRecommendations = ({ recommendations, SampleDataIndicator }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='h6'>Staffing Recommendations</Typography>
                {SampleDataIndicator && <SampleDataIndicator />}
            </Box>
            <Typography variant='body1' paragraph>
                Based on the current data:
            </Typography>
            <ul>
                {recommendations.map((recommendation, index) => (
                    <li key={index}>
                        <Typography variant='body1'>{recommendation}</Typography>
                    </li>
                ))}
            </ul>
        </Paper>
    )
}

StaffingRecommendations.propTypes = {
    recommendations: PropTypes.arrayOf(PropTypes.string).isRequired,
    SampleDataIndicator: PropTypes.elementType
}

export default StaffingRecommendations
