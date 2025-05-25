import { Box, Typography } from '@mui/material'
import Tagging from '../components/Tagging/Tagging.jsx'

function TagAnalysisPage() {
    return (
        <Box sx={{ my: 4 }}>
            <Typography variant='h4' component='h1' gutterBottom>
                Tag Analysis
            </Typography>
            <Tagging />
        </Box>
    )
}

export default TagAnalysisPage
