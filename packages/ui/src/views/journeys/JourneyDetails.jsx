import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Typography, Paper, Box, Divider, useTheme, Button } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import chatmessageApi from '@/api/chatmessage'
import { getLocalStorageChatflow, removeLocalStorageChatHistory } from '@/utils/genericHelper'
import { IconEraser, IconX } from '@tabler/icons-react'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'

// API
import journeysApi from '@/api/journeys'

// Hooks
import useApi from '@/hooks/useApi'

// Components
import { ChatMessage } from '../chatmessage/ChatMessage'
import Sidebar from '@/ui-component/extended/Sidebar'

const JourneyDetails = () => {
    const theme = useTheme()
    const { id } = useParams()
    const dispatch = useDispatch()
    const { confirm } = useConfirm()
    const customization = useSelector((state) => state.customization)

    const [journeyDetails, setJourneyDetails] = useState(null)
    const [journeyChatflows, setJourneyChatflows] = useState([])
    const [selectedChatflow, setSelectedChatflow] = useLocalStorage(`lastSelectedChatflow_${id}`, '')
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatContainerRef = useRef(null)
    const [previews, setPreviews] = useState([])
    const [overrideConfig, setOverrideConfig] = useState({})
    const [chatKey, setChatKey] = useState(0)

    const getJourneyApi = useApi(journeysApi.getSpecificJourney)

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [])

    const clearChat = async () => {
        try {
            const confirmPayload = {
                title: `Clear Chat History`,
                description: `Are you sure you want to clear all chat history?`,
                confirmButtonName: 'Clear',
                cancelButtonName: 'Cancel'
            }
            const isConfirmed = await confirm(confirmPayload)

            if (isConfirmed) {
                if (!selectedChatflow) {
                    enqueueSnackbar({
                        message: 'No chatflow selected',
                        options: {
                            key: new Date().getTime() + Math.random(),
                            variant: 'warning',
                            action: (key) => (
                                <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                    <IconX />
                                </Button>
                            )
                        }
                    })
                    return
                }
                const objChatDetails = getLocalStorageChatflow(selectedChatflow)
                if (!objChatDetails.chatId) {
                    return
                }
                await chatmessageApi.deleteChatmessage(selectedChatflow, { chatId: objChatDetails.chatId, chatType: 'INTERNAL' })
                removeLocalStorageChatHistory(selectedChatflow)
                // You might need to implement resetChatDialog() function
                setChatKey((prevKey) => prevKey + 1)
                setPreviews([])
                enqueueSnackbar({
                    message: 'Successfully cleared all chat history',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        } catch (error) {
            console.error('Error in clearChat:', error)
            enqueueSnackbar({
                message: error.message || 'An error occurred while clearing chat history',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    persist: true,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    useEffect(() => {
        if (selectedChatflow) {
            setIsChatOpen(true)
        }
    }, [selectedChatflow])

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [selectedChatflow, isChatOpen])

    useEffect(() => {
        scrollToBottom()
    }, [scrollToBottom, selectedChatflow, isChatOpen])

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

    if (!journeyDetails) {
        return <Typography>Loading...</Typography>
    }

    const formatOverrideConfig = (config) => {
        const formattedConfig = { ...config }

        // Preserve existing override configurations
        Object.keys(formattedConfig).forEach((key) => {
            if (key !== 'tools' && typeof formattedConfig[key] === 'object') {
                formattedConfig[key] = { ...formattedConfig[key] }
            }
        })

        // Format tools configuration
        if (formattedConfig.tools) {
            Object.keys(formattedConfig.tools).forEach((agentId) => {
                formattedConfig.tools[agentId] = formattedConfig.tools[agentId].map((tool) => ({
                    node: tool.node,
                    edges: tool.edges
                }))
            })
        }
        return formattedConfig
    }

    const handleOverrideConfigChange = (newConfig) => {
        setOverrideConfig((prev) => {
            const updatedConfig = typeof newConfig === 'function' ? newConfig(prev) : { ...prev, ...newConfig }
            const formattedConfig = formatOverrideConfig(updatedConfig)
            return formattedConfig
        })
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant='h4' gutterBottom>
                        {journeyDetails.title}
                    </Typography>
                    <Typography variant='body1' gutterBottom>
                        {journeyDetails.goal}
                    </Typography>
                </Box>
                {customization.isDarkMode ? (
                    <StyledButton
                        variant='outlined'
                        color='error'
                        title='Clear Conversation'
                        onClick={clearChat}
                        startIcon={<IconEraser />}
                    >
                        Clear Chat
                    </StyledButton>
                ) : (
                    <Button variant='outlined' color='error' title='Clear Conversation' onClick={clearChat} startIcon={<IconEraser />}>
                        Clear Chat
                    </Button>
                )}
            </Box>
            <Divider sx={{ borderColor: theme.palette.primary.main, borderWidth: 2, my: 2 }} />
            <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100% - 100px)' }}>
                <Box sx={{ width: '66.67%', pr: 2 }}>
                    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {selectedChatflow && (
                            <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                                <ChatMessage
                                    key={`${selectedChatflow}-${chatKey}`}
                                    open={isChatOpen}
                                    chatflowid={selectedChatflow}
                                    isAgentCanvas={false}
                                    isDialog={false}
                                    previews={previews}
                                    setPreviews={setPreviews}
                                    overrideConfig={overrideConfig}
                                />
                            </Box>
                        )}
                    </Paper>
                </Box>
                <Box sx={{ width: '33.33%', pl: 2 }}>
                    <Paper elevation={3} sx={{ height: '100%', p: 2, overflow: 'auto' }}>
                        <Sidebar
                            chatflows={journeyChatflows}
                            selectedChatflow={selectedChatflow}
                            setSelectedChatflow={setSelectedChatflow}
                            setOverrideConfig={handleOverrideConfigChange}
                        />
                    </Paper>
                </Box>
            </Box>
            <ConfirmDialog />
        </Box>
    )
}

export default JourneyDetails
