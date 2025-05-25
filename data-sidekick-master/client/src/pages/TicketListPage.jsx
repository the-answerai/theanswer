import { memo } from 'react'
import TicketList from '../components/tickets/TicketList'
import { Box } from '@mui/material'

const TicketListPage = memo(function TicketListPage() {
    return (
        <Box>
            <TicketList />
        </Box>
    )
})

export default TicketListPage
