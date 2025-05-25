import { memo } from 'react'
import { Box } from '@mui/material'
import CallList from '../components/calls/CallList'

const CallListPage = memo(function CallListPage() {
    return (
        <Box>
            <CallList />
        </Box>
    )
})

export default CallListPage
