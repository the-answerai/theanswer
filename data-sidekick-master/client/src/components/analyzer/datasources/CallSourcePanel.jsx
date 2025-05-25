import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import CallIcon from '@mui/icons-material/Call'
import CallList from '../../calls/CallList'
import PropTypes from 'prop-types'
import axios from 'axios'

const CallSourcePanel = ({ onBack, researchViewId, onAddSource }) => {
    // Here we could add state for call selection, filtering, etc.
    const [selectedCalls, setSelectedCalls] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle call selection
    const handleCallSelection = (selectedCallIds) => {
        setSelectedCalls(selectedCallIds)
    }

    // Add selected calls as a data source
    const handleAddSelectedCalls = async () => {
        if (!selectedCalls.length) return

        try {
            setIsSubmitting(true)

            // Prepare API payload
            const payload = {
                sourceType: 'calls',
                callIds: selectedCalls
            }

            // Submit request to add calls as a source
            await axios.post(`/api/analyzer/research-views/${researchViewId}/sources`, payload)

            // Notify parent component
            if (onAddSource) {
                onAddSource()
            }

            // Go back to sources view
            onBack()
        } catch (err) {
            console.error('Error adding calls as source:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Box>
                    <Button variant='outlined' onClick={onBack} startIcon={<CallIcon />} sx={{ mb: 2 }}>
                        Back to Sources
                    </Button>
                    <Typography variant='h5'>Call List Source</Typography>
                </Box>
                {selectedCalls.length > 0 && (
                    <Button variant='contained' onClick={handleAddSelectedCalls} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : `Add ${selectedCalls.length} Call${selectedCalls.length !== 1 ? 's' : ''} as Source`}
                    </Button>
                )}
            </Box>
            <CallList isEmbedded={true} showSelection={true} onSelectionChange={handleCallSelection} />
        </Box>
    )
}

CallSourcePanel.propTypes = {
    onBack: PropTypes.func.isRequired,
    researchViewId: PropTypes.string.isRequired,
    onAddSource: PropTypes.func
}

export default CallSourcePanel
