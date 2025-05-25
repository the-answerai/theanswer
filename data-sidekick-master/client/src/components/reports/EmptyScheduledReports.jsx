import { Box, Button, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PropTypes from 'prop-types'

function EmptyScheduledReports({ onCreateNew }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                p: 4
            }}
        >
            <Typography variant='h6' color='text.secondary'>
                No Scheduled Reports Yet
            </Typography>
            <Typography variant='body1' color='text.secondary' align='center'>
                Create a scheduled report to automatically analyze calls based on your criteria at regular intervals.
            </Typography>
            <Button variant='contained' startIcon={<AddIcon />} onClick={onCreateNew} sx={{ mt: 2 }}>
                Create Scheduled Report
            </Button>
        </Box>
    )
}

EmptyScheduledReports.propTypes = {
    onCreateNew: PropTypes.func.isRequired
}

export default EmptyScheduledReports
