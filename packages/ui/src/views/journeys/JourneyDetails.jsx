import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Typography, Select, MenuItem, List, ListItem, ListItemText, Paper, Box, Grid } from '@mui/material'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// API
import journeysApi from '@/api/journeys'

// Hooks
import useApi from '@/hooks/useApi'

// Components
import { ChatMessage } from '../chatmessage/ChatMessage'

const JourneyDetails = () => {
    const { id } = useParams()
    const [journeyDetails, setJourneyDetails] = useState(null)
    const [journeyChatflows, setJourneyChatflows] = useState([])
    const [selectedChatflow, setSelectedChatflow] = useLocalStorage(`lastSelectedChatflow_${id}`, '')
    const [isChatOpen, setIsChatOpen] = useState(false)

    const getJourneyApi = useApi(journeysApi.getSpecificJourney)

    useEffect(() => {
        if (id) {
            getJourneyApi.request(id)
        }
        if (selectedChatflow) {
            setIsChatOpen(true)
        }
    }, [id, selectedChatflow])

    useEffect(() => {
        if (getJourneyApi.data) {
            setJourneyDetails(getJourneyApi.data)
            setJourneyChatflows(getJourneyApi.data.chatflows || [])

            // If there's no selected chatflow, select the first one by default
            if (!selectedChatflow && getJourneyApi.data.chatflows && getJourneyApi.data.chatflows.length > 0) {
                setSelectedChatflow(getJourneyApi.data.chatflows[0].id)
                setIsChatOpen(true)
            }
        }
    }, [getJourneyApi.data, selectedChatflow, setSelectedChatflow])

    const handleChatflowChange = (event) => {
        const selectedId = event.target.value
        setSelectedChatflow(selectedId)
        setIsChatOpen(true)
    }

    if (!journeyDetails) {
        return <Typography>Loading...</Typography>
    }

    const { documents = [], tools = [] } = journeyDetails

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant='h4' gutterBottom>
                Journey: {journeyDetails.title}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ height: '100%', overflow: 'auto', p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant='h6' gutterBottom>
                                Journey Details
                            </Typography>

                            <Typography variant='body1'>
                                <strong>Title:</strong> {journeyDetails.title}
                            </Typography>
                            <Typography variant='body1'>
                                <strong>Goal:</strong> {journeyDetails.goal}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant='subtitle1' sx={{ mt: 2 }}>
                                    Sidekicks
                                </Typography>
                                <Select fullWidth value={selectedChatflow} onChange={handleChatflowChange} displayEmpty size='small'>
                                    <MenuItem value=''>
                                        <em>Select a Sidekick</em>
                                    </MenuItem>
                                    {journeyChatflows.map((chatflow) => (
                                        <MenuItem key={chatflow.id} value={chatflow.id}>
                                            {chatflow.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                                <Typography variant='subtitle1' sx={{ mt: 2 }}>
                                    Document Loaders
                                </Typography>
                                <List dense>
                                    {documents.map((doc, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={doc.name} />
                                        </ListItem>
                                    ))}
                                </List>

                                <Typography variant='subtitle1' sx={{ mt: 2 }}>
                                    Tools
                                </Typography>
                                <List dense>
                                    {tools.map((tool, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={tool.name} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    {selectedChatflow && (
                        <Paper elevation={3} sx={{ height: '100%', p: 2 }}>
                            <ChatMessage open={isChatOpen} chatflowid={selectedChatflow} isAgentCanvas={false} isDialog={false} />
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    )
}

export default JourneyDetails
