import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Paper, Box, Grid, Divider, useTheme, Button } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { IconEraser, IconX } from '@tabler/icons-react'
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import chatmessageApi from '@/api/chatmessage'
import { getLocalStorageChatflow, removeLocalStorageChatHistory } from '@/utils/genericHelper'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// Components
import { ChatMessage } from '../chatmessage/ChatMessage'
import Sidebar from '@/ui-component/extended/Sidebar'

const QuickChatDetails = () => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const { confirm } = useConfirm()
    const customization = useSelector((state) => state.customization)

    const [allChatflows, setAllChatflows] = useState([])
    const [selectedChatflow, setSelectedChatflow] = useLocalStorage('lastSelectedChatflow', '')
    const [isChatOpen, setIsChatOpen] = useState(false)
    const chatContainerRef = useRef(null)
    const [previews, setPreviews] = useState([])
    const [overrideConfig, setOverrideConfig] = useState({})
    const [chatKey, setChatKey] = useState(0)

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows)

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [])

    const handleOverrideConfigChange = (newConfig) => {
        console.log('QuickChatDetails - Received new config:', newConfig)
        setOverrideConfig((prev) => {
            const updatedConfig = { ...prev, ...newConfig }
            const formattedConfig = formatOverrideConfig(updatedConfig)
            console.log('QuickChatDetails - Setting formatted overrideConfig:', formattedConfig)
            return formattedConfig
        })
    }

    const formatOverrideConfig = (config) => {
        console.log('QuickChat Details - Formatting config:', config)
        const formattedConfig = {}

        Object.entries(config).forEach(([nodeId, nodeConfig]) => {
            Object.entries(nodeConfig).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    if (!formattedConfig[key]) {
                        formattedConfig[key] = {}
                    }
                    formattedConfig[key][nodeId] = value
                }
            })
        })

        // Remove any direct children that are node IDs
        Object.keys(formattedConfig).forEach((key) => {
            if (config.hasOwnProperty(key)) {
                delete formattedConfig[key]
            }
        })

        // Remove any empty objects
        Object.keys(formattedConfig).forEach((key) => {
            if (Object.keys(formattedConfig[key]).length === 0) {
                delete formattedConfig[key]
            }
        })

        console.log('QuickChat Details - Formatted config:', formattedConfig)
        return formattedConfig
    }

    const clearChat = async () => {
        console.log('Clear chat initiated')
        try {
            const confirmPayload = {
                title: `Clear Chat History`,
                description: `Are you sure you want to clear all chat history?`,
                confirmButtonName: 'Clear',
                cancelButtonName: 'Cancel'
            }
            console.log('Showing confirmation dialog')
            const isConfirmed = await confirm(confirmPayload)
            console.log('Confirmation result:', isConfirmed)

            if (isConfirmed) {
                if (!selectedChatflow) {
                    console.log('No chatflow selected')
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
                    console.log('No chat history found')
                    return
                }
                console.log('Deleting chat messages')
                await chatmessageApi.deleteChatmessage(selectedChatflow, { chatId: objChatDetails.chatId, chatType: 'INTERNAL' })
                removeLocalStorageChatHistory(selectedChatflow)
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
            } else {
                console.log('Chat clear cancelled by user')
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
        scrollToBottom()
    }, [scrollToBottom, selectedChatflow, isChatOpen])

    useEffect(() => {
        getAllChatflowsApi.request()
    }, [])

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            setAllChatflows(getAllChatflowsApi.data)

            if (!selectedChatflow && getAllChatflowsApi.data.length > 0) {
                setSelectedChatflow(getAllChatflowsApi.data[0].id)
                setIsChatOpen(true)
            }
        }
    }, [getAllChatflowsApi.data, selectedChatflow, setSelectedChatflow])

    return (
        <Box sx={{ flexGrow: 1, p: 3, height: 'calc(100vh - 64px)' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
            <Grid container spacing={2} sx={{ height: 'calc(100% - 50px)' }}>
                <Grid item xs={12} md={9} sx={{ height: '100%' }}>
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
                </Grid>
                <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                    <Paper elevation={3} sx={{ height: '100%', p: 2, overflow: 'auto' }}>
                        <Sidebar
                            chatflows={allChatflows}
                            selectedChatflow={selectedChatflow}
                            setSelectedChatflow={setSelectedChatflow}
                            setOverrideConfig={handleOverrideConfigChange}
                        />
                    </Paper>
                </Grid>
            </Grid>
            <ConfirmDialog />
        </Box>
    )
}

export default QuickChatDetails
