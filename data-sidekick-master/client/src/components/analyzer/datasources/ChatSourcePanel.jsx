import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import ChatList from '../../chats/ChatList'
import PropTypes from 'prop-types'
import axios from 'axios'

const ChatSourcePanel = ({ onBack, researchViewId, onAddSource }) => {
    // Here we could add state for chat selection, filtering, etc.
    const [selectedChats, setSelectedChats] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle chat selection
    const handleChatSelection = (selectedChatIds) => {
        setSelectedChats(selectedChatIds)
    }

    // Add selected chats as a data source
    const handleAddSelectedChats = async () => {
        if (!selectedChats.length) return

        try {
            setIsSubmitting(true)

            // Prepare API payload
            const payload = {
                sourceType: 'chats',
                chatIds: selectedChats
            }

            // Submit request to add chats as a source
            await axios.post(`/api/analyzer/research-views/${researchViewId}/sources`, payload)

            // Notify parent component
            if (onAddSource) {
                onAddSource()
            }

            // Go back to sources view
            onBack()
        } catch (err) {
            console.error('Error adding chats as source:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Box>
                    <Button variant='outlined' onClick={onBack} startIcon={<ChatIcon />} sx={{ mb: 2 }}>
                        Back to Sources
                    </Button>
                    <Typography variant='h5'>Chat List Source</Typography>
                </Box>
                {selectedChats.length > 0 && (
                    <Button variant='contained' onClick={handleAddSelectedChats} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : `Add ${selectedChats.length} Chat${selectedChats.length !== 1 ? 's' : ''} as Source`}
                    </Button>
                )}
            </Box>
            <ChatList isEmbedded={true} showSelection={true} onSelectionChange={handleChatSelection} />
        </Box>
    )
}

ChatSourcePanel.propTypes = {
    onBack: PropTypes.func.isRequired,
    researchViewId: PropTypes.string.isRequired,
    onAddSource: PropTypes.func
}

export default ChatSourcePanel
