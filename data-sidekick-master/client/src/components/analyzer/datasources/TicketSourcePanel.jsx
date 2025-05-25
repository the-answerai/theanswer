import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import TicketList from '../../tickets/TicketList'
import PropTypes from 'prop-types'
import axios from 'axios'

const TicketSourcePanel = ({ onBack, researchViewId, onAddSource }) => {
    // Here we could add state for ticket selection, filtering, etc.
    const [selectedTickets, setSelectedTickets] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle ticket selection
    const handleTicketSelection = (selectedTicketIds) => {
        setSelectedTickets(selectedTicketIds)
    }

    // Add selected tickets as a data source
    const handleAddSelectedTickets = async () => {
        if (!selectedTickets.length) return

        try {
            setIsSubmitting(true)

            // Prepare API payload
            const payload = {
                sourceType: 'tickets',
                ticketIds: selectedTickets
            }

            // Submit request to add tickets as a source
            await axios.post(`/api/analyzer/research-views/${researchViewId}/sources`, payload)

            // Notify parent component
            if (onAddSource) {
                onAddSource()
            }

            // Go back to sources view
            onBack()
        } catch (err) {
            console.error('Error adding tickets as source:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Box>
                    <Button variant='outlined' onClick={onBack} startIcon={<ConfirmationNumberIcon />} sx={{ mb: 2 }}>
                        Back to Sources
                    </Button>
                    <Typography variant='h5'>Ticket List Source</Typography>
                </Box>
                {selectedTickets.length > 0 && (
                    <Button variant='contained' onClick={handleAddSelectedTickets} disabled={isSubmitting}>
                        {isSubmitting
                            ? 'Adding...'
                            : `Add ${selectedTickets.length} Ticket${selectedTickets.length !== 1 ? 's' : ''} as Source`}
                    </Button>
                )}
            </Box>
            <TicketList isEmbedded={true} showSelection={true} onSelectionChange={handleTicketSelection} />
        </Box>
    )
}

TicketSourcePanel.propTypes = {
    onBack: PropTypes.func.isRequired,
    researchViewId: PropTypes.string.isRequired,
    onAddSource: PropTypes.func
}

export default TicketSourcePanel
