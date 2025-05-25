import {
    Box,
    Typography,
    IconButton,
    Paper,
    Drawer,
    Tabs,
    Tab,
    Slider,
    Chip,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    TextField,
    CircularProgress
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import SendIcon from '@mui/icons-material/Send'
import ArticleIcon from '@mui/icons-material/Article'
import HelpIcon from '@mui/icons-material/Help'
import PolicyIcon from '@mui/icons-material/Policy'
import SchoolIcon from '@mui/icons-material/School'
import CodeIcon from '@mui/icons-material/Code'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { getSentimentEmoji, getSentimentGradient } from '../../utils/sentimentEmojis'
import { getApiUrl } from '../../config/api'

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role='tabpanel' hidden={value !== index} id={`chat-tabpanel-${index}`} aria-labelledby={`chat-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const getDocumentIcon = (type) => {
    switch (type) {
        case 'faq':
            return <HelpIcon />
        case 'guide':
            return <ArticleIcon />
        case 'policy':
            return <PolicyIcon />
        case 'tutorial':
            return <SchoolIcon />
        case 'api-doc':
            return <CodeIcon />
        default:
            return <ArticleIcon />
    }
}

const ChatPanel = ({ chat, open, onClose, tagCategories, isIncoming }) => {
    const [tabValue, setTabValue] = useState(0)
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [editedChat, setEditedChat] = useState({
        assigned_to: chat?.assigned_to || '',
        chat_status: chat?.chat_status || 'new',
        chat_messages: chat?.chat_messages || []
    })

    const handleAssignmentChange = async (newAssignment) => {
        try {
            const response = await fetch(getApiUrl(`/api/chats/${chat.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assigned_to: newAssignment
                })
            })

            if (!response.ok) throw new Error('Failed to update assignment')

            setEditedChat((prev) => ({
                ...prev,
                assigned_to: newAssignment
            }))
        } catch (error) {
            console.error('[ChatPanel] Error updating assignment:', error)
        }
    }

    const handleStatusChange = async (newStatus) => {
        try {
            const response = await fetch(getApiUrl(`/api/chats/${chat.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_status: newStatus
                })
            })

            if (!response.ok) throw new Error('Failed to update status')

            setEditedChat((prev) => ({
                ...prev,
                chat_status: newStatus
            }))
        } catch (error) {
            console.error('[ChatPanel] Error updating status:', error)
        }
    }

    const handleSendMessage = async (e) => {
        e?.preventDefault()

        if (!message.trim() || isSending) return

        setIsSending(true)

        try {
            const newMessage = {
                role: 'user',
                content: message.trim(),
                timestamp: new Date().toISOString()
            }

            const updatedMessages = [...(chat.chat_messages || []), newMessage]

            const response = await fetch(getApiUrl(`/api/chats/${chat.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_messages: updatedMessages,
                    chat_status: 'waiting_on_reply'
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    `Failed to send message: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ''}`
                )
            }

            // Get the updated chat data
            const updatedChat = await response.json()

            // Update local state with the response from server
            setEditedChat((prev) => ({
                ...prev,
                chat_messages: updatedChat.chat_messages || updatedMessages,
                chat_status: 'waiting_on_reply'
            }))

            // Clear the input field
            setMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
            // You might want to show an error message to the user here
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleGetSuggestedResponse = async (chat) => {
        try {
            const response = await fetch(getApiUrl('/api/answerai/analyze'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: JSON.stringify(chat.chat_messages),
                    systemPrompt:
                        "You are a helpful customer service agent. Analyze the conversation history and suggest a response that is professional, empathetic, and addresses the customer's needs. Format the response in a way that can be sent directly to the customer.",
                    schema: "z.object({suggested_response: z.string().describe('A suggested response for the agent to send to the customer')})"
                })
            })

            if (!response.ok) throw new Error('Failed to get response suggestion')

            const data = await response.json()

            // Update the chat with the suggested response
            const updateResponse = await fetch(getApiUrl(`/api/chats/${chat.id}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    suggested_response: data.suggested_response
                })
            })

            if (!updateResponse.ok) throw new Error('Failed to update chat with suggestion')

            const updatedChat = await updateResponse.json()
            setEditedChat(updatedChat)

            return data.suggested_response
        } catch (error) {
            console.error('[handleGetSuggestedResponse] Error:', error)
            // You might want to show an error message to the user here
            return null
        }
    }

    const handleMagicResponse = async () => {
        if (isSending) return

        setIsSending(true)
        try {
            const suggestedResponse = await handleGetSuggestedResponse(chat)
            if (suggestedResponse) {
                setMessage(suggestedResponse)
            }
        } catch (error) {
            console.error('[handleMagicResponse] Error:', error)
        } finally {
            setIsSending(false)
        }
    }

    const renderTags = () => {
        if (!chat?.tags_array?.length) return null

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {chat.tags_array.map((tag) => {
                    let color = '#757575'
                    let label = tag

                    // Find the category and subcategory
                    for (const [categoryKey, category] of Object.entries(tagCategories)) {
                        if (tag === categoryKey) {
                            color = category.color
                            label = category.label
                            break
                        }
                        if (category.subcategories?.[tag]) {
                            color = category.subcategories[tag].color
                            label = category.subcategories[tag].label
                            break
                        }
                    }

                    return (
                        <Chip
                            key={tag}
                            label={label}
                            size='small'
                            sx={(theme) => ({
                                backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : color,
                                color:
                                    theme.palette.mode === 'dark'
                                        ? color
                                        : color.toLowerCase().includes('ff') ||
                                          color.toLowerCase().includes('f0') ||
                                          color.toLowerCase().includes('ee') ||
                                          color.toLowerCase().includes('e0')
                                        ? 'rgba(0, 0, 0, 0.87)'
                                        : 'white',
                                border: theme.palette.mode === 'dark' ? `1px solid ${color}` : 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' ? `${color}22` : color,
                                    opacity: 0.9
                                }
                            })}
                        />
                    )
                })}
            </Box>
        )
    }

    const renderSentimentScale = () => {
        if (!chat?.sentiment_score) return null

        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 3 }}>
                    Chat Sentiment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant='h4'>{getSentimentEmoji(chat.sentiment_score)}</Typography>
                    <Slider
                        value={chat.sentiment_score}
                        min={1}
                        max={10}
                        step={1}
                        marks
                        disabled
                        sx={{
                            '& .MuiSlider-mark': {
                                backgroundColor: '#bfbfbf'
                            },
                            '& .MuiSlider-rail': {
                                background: getSentimentGradient(),
                                opacity: 1
                            }
                        }}
                    />
                </Box>
            </Box>
        )
    }

    const renderChatMessages = () => {
        if (!editedChat?.chat_messages?.length) {
            return (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography color='text.secondary'>No messages yet</Typography>
                </Box>
            )
        }

        return editedChat.chat_messages.map((message) => (
            <Box
                key={message.timestamp}
                sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    ...(message.role === 'assistant' ? { flexDirection: 'row' } : { flexDirection: 'row-reverse' })
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: message.role === 'assistant' ? 'primary.main' : 'grey.300'
                    }}
                >
                    {message.role === 'assistant' ? <SmartToyIcon /> : <PersonIcon />}
                </Avatar>
                <Paper
                    className={message.role === 'assistant' ? 'chat-message-assistant' : 'chat-message-user'}
                    sx={(theme) => ({
                        p: 2,
                        maxWidth: '80%',
                        ...(message.role === 'assistant'
                            ? {
                                  bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'primary.light',
                                  color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.contrastText',
                                  border: theme.palette.mode === 'dark' ? '1px solid #24C3A1' : 'none'
                              }
                            : {
                                  bgcolor: theme.palette.mode === 'dark' ? '#24C3A1' : 'grey.100',
                                  color: theme.palette.mode === 'dark' ? '#000000' : 'text.primary',
                                  border: theme.palette.mode === 'dark' ? '1px solid #24C3A1' : 'none',
                                  boxShadow: theme.palette.mode === 'dark' ? '0 0 5px #24C3A1' : 'none'
                              })
                    })}
                >
                    <Typography variant='body1'>{message.content}</Typography>
                    <Typography
                        variant='caption'
                        sx={(theme) => ({
                            display: 'block',
                            mt: 1,
                            opacity: 0.8,
                            color: theme.palette.mode === 'dark' && message.role === 'user' ? '#000000' : 'inherit'
                        })}
                    >
                        {new Date(message.timestamp).toLocaleString()}
                    </Typography>
                </Paper>
            </Box>
        ))
    }

    if (!chat) return null

    return (
        <Drawer
            anchor='right'
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: (theme) => ({
                    width: '40%',
                    minWidth: 400,
                    maxWidth: 600,
                    bgcolor: theme.palette.mode === 'dark' ? '#121212' : 'background.paper',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.primary'
                })
            }}
        >
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant='h5'>Chat Details</Typography>
                    <IconButton onClick={onClose} size='small'>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Assignment and Status Controls for Incoming Chats */}
                {isIncoming && (
                    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                        <FormControl size='small' sx={{ minWidth: 200 }}>
                            <InputLabel>Assigned To</InputLabel>
                            <Select
                                value={editedChat.assigned_to}
                                label='Assigned To'
                                onChange={(e) => handleAssignmentChange(e.target.value)}
                            >
                                <MenuItem value=''>Unassigned</MenuItem>
                                <MenuItem value='agent1'>Agent 1</MenuItem>
                                <MenuItem value='agent2'>Agent 2</MenuItem>
                                <MenuItem value='agent3'>Agent 3</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size='small' sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={editedChat.chat_status} label='Status' onChange={(e) => handleStatusChange(e.target.value)}>
                                <MenuItem value='new'>New</MenuItem>
                                <MenuItem value='waiting_on_reply'>Waiting on Reply</MenuItem>
                                <MenuItem value='needs_response'>Needs Response</MenuItem>
                                <MenuItem value='resolved'>Resolved</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant='contained'
                            color='primary'
                            onClick={() => {
                                // Handle taking over the chat
                                handleAssignmentChange('current_user')
                                handleStatusChange('in_progress')
                            }}
                        >
                            Take Over Chat
                        </Button>
                    </Box>
                )}

                {/* Tags only - removed sentiment from here */}
                {renderTags()}

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} aria-label='chat details tabs'>
                        <Tab label='Full Chat' />
                        <Tab label='AI Analysis' />
                        <Tab label='Prompt Improvements' />
                        <Tab label='Chat Metadata' />
                    </Tabs>
                </Box>

                {/* Full Chat Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            // Subtract the padding from the total height
                            maxHeight: 'calc(100vh - 280px)'
                        }}
                    >
                        <Typography variant='h6' gutterBottom>
                            Chat Messages
                        </Typography>
                        <Paper
                            sx={(theme) => ({
                                p: 2,
                                bgcolor: theme.palette.mode === 'dark' ? '#121212' : 'grey.50',
                                flexGrow: 1,
                                overflow: 'auto',
                                border: theme.palette.mode === 'dark' ? '1px solid #24C3A1' : 'none',
                                mb: chat?.chat_type === 'live' ? 2 : 0,
                                // Make sure there's room for the input box
                                maxHeight: chat?.chat_type === 'live' ? 'calc(100% - 80px)' : '100%'
                            })}
                        >
                            {renderChatMessages()}
                        </Paper>
                        {chat?.chat_type === 'live' && (
                            <Box
                                component='form'
                                onSubmit={handleSendMessage}
                                sx={{
                                    p: 2,
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    position: 'sticky',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    zIndex: 1,
                                    mt: 'auto' // Push to bottom when content is short
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            maxRows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder='Type your message...'
                                            size='small'
                                            disabled={isSending}
                                        />
                                        <IconButton type='submit' color='primary' disabled={!message.trim() || isSending}>
                                            <SendIcon />
                                        </IconButton>
                                    </Box>
                                    <Button
                                        variant='outlined'
                                        color='secondary'
                                        onClick={handleMagicResponse}
                                        disabled={isSending}
                                        startIcon={isSending ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                                        size='small'
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Suggest Response
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </TabPanel>

                {/* AI Analysis Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box>
                        <Typography variant='h6' gutterBottom>
                            AI Analysis
                        </Typography>
                        {chat.summary ? (
                            <>
                                {/* Added Sentiment Scale here */}
                                {renderSentimentScale()}

                                <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 2 }}>
                                    Summary
                                </Typography>
                                <Typography variant='body1' sx={{ mb: 3 }}>
                                    {chat.summary}
                                </Typography>

                                {/* Documents Cited Section */}
                                <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 3 }}>
                                    Documents Cited
                                </Typography>
                                {chat.documents_cited?.length > 0 ? (
                                    <Box sx={{ mt: 1, mb: 3 }}>
                                        {chat.documents_cited.map((doc) => (
                                            <Paper
                                                key={`${doc.id}-${doc.title}`}
                                                sx={(theme) => ({
                                                    p: 2,
                                                    mb: 1,
                                                    bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'grey.50',
                                                    border: theme.palette.mode === 'dark' ? '1px solid #24C3A1' : 'none',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 2
                                                })}
                                            >
                                                <Avatar
                                                    sx={(theme) => ({
                                                        bgcolor: theme.palette.mode === 'dark' ? '#24C3A1' : 'primary.main'
                                                    })}
                                                >
                                                    {getDocumentIcon(doc.type)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant='subtitle2'>{doc.title}</Typography>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        {doc.excerpt}
                                                    </Typography>
                                                    <Chip size='small' label={doc.type} sx={{ mt: 1 }} variant='outlined' />
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                                        No documents cited for this conversation
                                    </Typography>
                                )}

                                {/* Help Me Respond Section - restored the button */}
                                <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 3 }}>
                                    Help Me Respond
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    {chat.suggested_response ? (
                                        <Paper
                                            sx={(theme) => ({
                                                p: 2,
                                                bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'grey.50',
                                                border: theme.palette.mode === 'dark' ? '1px solid #24C3A1' : 'none'
                                            })}
                                        >
                                            <Typography variant='body1'>{chat.suggested_response}</Typography>
                                        </Paper>
                                    ) : (
                                        <Button variant='contained' color='primary' onClick={handleMagicResponse} sx={{ mt: 1 }}>
                                            Get Response Suggestion
                                        </Button>
                                    )}
                                </Box>

                                {chat.persona && (
                                    <>
                                        <Typography variant='subtitle1' color='text.secondary' sx={{ textTransform: 'uppercase', mt: 3 }}>
                                            Customer Persona
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant='subtitle2' color='text.secondary'>
                                                Type
                                            </Typography>
                                            <Typography variant='body1' sx={{ mb: 2 }}>
                                                {chat.persona.customer_type}
                                            </Typography>

                                            <Typography variant='subtitle2' color='text.secondary'>
                                                Interaction Style
                                            </Typography>
                                            <Typography variant='body1' sx={{ mb: 2 }}>
                                                {chat.persona.interaction_style}
                                            </Typography>

                                            <Typography variant='subtitle2' color='text.secondary'>
                                                Primary Concern
                                            </Typography>
                                            <Typography variant='body1'>{chat.persona.primary_concern}</Typography>
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                No AI analysis available
                            </Typography>
                        )}
                    </Box>
                </TabPanel>

                {/* Prompt Improvements Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box>
                        <Typography variant='h6' gutterBottom>
                            Prompt Improvements
                        </Typography>
                        {chat.coaching ? (
                            <Typography variant='body1'>{chat.coaching}</Typography>
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                No prompt improvements available
                            </Typography>
                        )}
                    </Box>
                </TabPanel>

                {/* Chat Metadata Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Box>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Chatbot
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {chat.chatbot_name}
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            AI Model
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {chat.ai_model}
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Resolution Status
                        </Typography>
                        <Typography variant='body1' sx={{ mb: 2 }}>
                            {chat.resolution_status}
                        </Typography>

                        <Typography variant='subtitle1' color='text.secondary'>
                            Tools Used
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {chat.tools_used?.map((tool) => (
                                <Chip key={tool} label={tool} size='small' color='primary' variant='outlined' />
                            ))}
                        </Box>
                    </Box>
                </TabPanel>
            </Box>
        </Drawer>
    )
}

ChatPanel.propTypes = {
    chat: PropTypes.shape({
        id: PropTypes.string,
        chat_messages: PropTypes.arrayOf(
            PropTypes.shape({
                role: PropTypes.oneOf(['user', 'assistant']).isRequired,
                content: PropTypes.string.isRequired,
                timestamp: PropTypes.string.isRequired
            })
        ),
        tags_array: PropTypes.array,
        sentiment_score: PropTypes.number,
        chatbot_name: PropTypes.string,
        ai_model: PropTypes.string,
        resolution_status: PropTypes.string,
        tools_used: PropTypes.array,
        summary: PropTypes.string,
        coaching: PropTypes.string,
        assigned_to: PropTypes.string,
        chat_status: PropTypes.string,
        chat_type: PropTypes.oneOf(['live', 'ai']),
        documents_cited: PropTypes.arrayOf(
            PropTypes.shape({
                title: PropTypes.string.isRequired,
                excerpt: PropTypes.string.isRequired
            })
        ),
        suggested_response: PropTypes.string,
        persona: PropTypes.shape({
            customer_type: PropTypes.string,
            interaction_style: PropTypes.string,
            primary_concern: PropTypes.string
        })
    }),
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tagCategories: PropTypes.object,
    isIncoming: PropTypes.bool
}

export default ChatPanel
