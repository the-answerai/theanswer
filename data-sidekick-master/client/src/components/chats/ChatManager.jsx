import { useState } from 'react'
import { Box, Typography, Paper, Tabs, Tab, Alert } from '@mui/material'
import ChatList from './ChatList'
import PropTypes from 'prop-types'

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`chat-manager-tabpanel-${index}`}
            aria-labelledby={`chat-manager-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const ChatManager = () => {
    const [tabValue, setTabValue] = useState(0)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    return (
        <Box>
            <Typography variant='h4' component='h1' gutterBottom>
                Chat Management
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>
                Monitor and manage both live chat sessions and AI-assisted conversations. Live chats require immediate attention, while AI
                chats can be reviewed for quality and insights.
            </Alert>

            <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label='chat management tabs'>
                    <Tab label='Live Chats' />
                    <Tab label='AI Chats' />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <ChatList chatType='live' hideHeader={true} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <ChatList chatType='ai' hideHeader={true} />
            </TabPanel>
        </Box>
    )
}

export default ChatManager
