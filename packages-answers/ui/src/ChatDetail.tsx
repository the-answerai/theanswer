'use client'
import React, { useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import dynamic from 'next/dynamic'

// Material-UI imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// Redux notification imports - exact same pattern as chatflows
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'

// UI components and utilities
import { IconX } from '@tabler/icons-react'
// @ts-ignore - JavaScript module without types
import { theme as themes } from '@/themes'
// @ts-ignore - JavaScript module without types
import { useCredentialChecker } from '@/hooks/useCredentialChecker'
import chatflowsApi from '@/api/chatflows'

// Local imports
import { useAnswers } from './AnswersContext'
import type { AppSettings, Document, Sidekick } from 'types'

// Dynamic imports
const AppBar = dynamic(() => import('@mui/material/AppBar'))
const ChatRoom = dynamic(() => import('./ChatRoom').then((mod) => ({ default: mod.ChatRoom })))
const SidekickSelect = dynamic(() => import('./SidekickSelect'))
const Drawer = dynamic(() => import('./Drawer'), { ssr: false })
const SourceDocumentModal = dynamic(() => import('@ui/SourceDocumentModal'), { ssr: false })
const CodePreview = dynamic(() => import('./Message/CodePreview').then((mod) => ({ default: mod.CodePreview })), { ssr: false })
const DrawerFilters = dynamic(() => import('./DrawerFilters/DrawerFilters'))
const ChatInput = dynamic(() => import('./ChatInput'), { ssr: true })
const Image = dynamic(() => import('next/image'))
const RateReviewIcon = dynamic(() => import('@mui/icons-material/RateReview'))
const ImageCreator = dynamic(() => import('@ui/ImageCreator').then((mod) => ({ default: mod.default })), { ssr: false })

// Dynamic import for UnifiedCredentialsModal
const UnifiedCredentialsModal = dynamic(
    // @ts-ignore - JavaScript module without types
    () => import('@/ui-component/dialog/UnifiedCredentialsModal'),
    { ssr: false }
)

// Constants
const DISPLAY_MODES = {
    CHATBOT: 'chatbot',
    EMBEDDED: 'embedded',
    MEDIA_CREATION: 'mediaCreation'
}

export const ChatDetail = ({
    appSettings,
    sidekicks = [],
    session
}: {
    appSettings: AppSettings
    prompts?: any
    sidekicks?: Sidekick[]
    session: any
}) => {
    const {
        error,
        chat,
        journey,
        messages: clientMessages,
        isLoading,
        regenerateAnswer,
        showFilters,
        chatbotConfig,
        sidekick: selectedSidekick,
        startNewChat
    } = useAnswers()

    // Get search params to check for QuickSetup
    const searchParams = useSearchParams()
    const router = useRouter()
    const isQuickSetup = searchParams.get('QuickSetup') === 'true'

    // Credential checking hook
    const { showCredentialModal, missingCredentials, checkCredentials, handleAssign, handleSkip, handleCancel } = useCredentialChecker()
    // Credential modal state: 'idle' | 'checking' | 'completed'
    const [credentialCheckStatus, setCredentialCheckStatus] = React.useState<'idle' | 'checking' | 'completed'>('idle')

    // Redux notification setup
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = useCallback((...args: any[]) => dispatch(enqueueSnackbarAction(...args)), [dispatch])
    const closeSnackbar = useCallback((...args: any[]) => dispatch(closeSnackbarAction(...args)), [dispatch])

    // Notification helper function
    const createNotification = useCallback(
        (message: string, variant: 'success' | 'error', persist = false) => ({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant,
                ...(persist && { persist: true }),
                action: (key: string) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                )
            }
        }),
        [closeSnackbar]
    )

    // Error handler for modal
    const handleModalError = useCallback(
        (errorMessage: string) => {
            enqueueSnackbar(createNotification(errorMessage, 'error', true))
        },
        [enqueueSnackbar, createNotification]
    )

    // Custom handlers for modal actions
    const handleModalAssign = useCallback(
        async (credentialAssignments: any) => {
            try {
                handleAssign(credentialAssignments)
            } catch (error) {
                console.error('Error assigning credentials:', error)
                enqueueSnackbar(createNotification('Error assigning credentials. Please try again.', 'error', true))
            }
        },
        [handleAssign, enqueueSnackbar, createNotification]
    )

    const handleModalSkip = useCallback(() => {
        setCredentialCheckStatus('completed')
        if (isQuickSetup && chat?.id) {
            router.replace(`/chat/${chat.id}`)
        }
        handleSkip()
    }, [handleSkip, isQuickSetup, chat?.id, router])

    const handleModalCancel = useCallback(() => {
        setCredentialCheckStatus('completed')
        if (isQuickSetup && chat?.id) {
            router.replace(`/chat/${chat.id}`)
        }
        handleCancel()
    }, [handleCancel, isQuickSetup, chat?.id, router])

    // Check credentials when component mounts or chat changes
    useEffect(() => {
        if (chat && credentialCheckStatus === 'idle' && selectedSidekick?.flowData) {
            setCredentialCheckStatus('checking')
            checkCredentials(
                selectedSidekick.flowData,
                async (updatedFlowData: any, credentialAssignments: any) => {
                    setCredentialCheckStatus('completed')

                    // Save credentials to backend when assigned
                    if (credentialAssignments && Object.keys(credentialAssignments).length > 0) {
                        try {
                            if (selectedSidekick?.id) {
                                await chatflowsApi.updateChatflow(selectedSidekick.id, {
                                    flowData: JSON.stringify(updatedFlowData)
                                })
                                enqueueSnackbar(createNotification('Credentials saved successfully!', 'success'))
                            }
                        } catch (error) {
                            console.error('Error saving chatflow with credentials:', error)
                            enqueueSnackbar(createNotification('Failed to save credentials. Please try again.', 'error', true))
                        }

                        // Navigate to chat page without QuickSetup parameter (only in QuickSetup mode)
                        if (isQuickSetup) {
                            const chatId = chat?.id || selectedSidekick?.id
                            if (chatId) {
                                // Use requestAnimationFrame for smoother transition timing
                                requestAnimationFrame(() => {
                                    router.replace(`/chat/${chatId}`)
                                })
                            }
                        }
                    } else if (isQuickSetup) {
                        // If no credentials were assigned but we're in QuickSetup, still navigate
                        const chatId = chat?.id || selectedSidekick?.id
                        if (chatId) {
                            // Immediate navigation since no credentials were assigned
                            router.replace(`/chat/${chatId}`)
                        }
                    }
                },
                isQuickSetup
            )
        }
    }, [
        chat,
        chat?.id,
        credentialCheckStatus,
        selectedSidekick?.id,
        selectedSidekick?.flowData,
        isQuickSetup,
        router,
        enqueueSnackbar,
        checkCredentials,
        createNotification
    ])

    const scrollRef = useRef<HTMLDivElement>(null)
    const [selectedDocuments, setSelectedDocuments] = React.useState<Document[] | undefined>()
    const [uploadedFiles, setUploadedFiles] = React.useState<FileUpload[]>([])
    const [previewCode, setPreviewCode] = React.useState<{
        code: string
        language: string
        getHTMLPreview: (code: string) => string
        getReactPreview: (code: string) => string
    } | null>(null)

    const messages = clientMessages || chat?.messages
    const displayMode = chatbotConfig?.displayMode || DISPLAY_MODES.CHATBOT
    const embeddedUrl = chatbotConfig?.embeddedUrl || ''

    const handleNewChat = () => {
        startNewChat()
    }

    return (
        <>
            <Box sx={{ display: 'flex', width: '100%' }}>
                <Box
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100vh',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            width: '100%',
                            height: 'calc(100vh - 67px)',
                            flex: 1,
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}
                    >
                        {selectedSidekick || chat ? (
                            <AppBar
                                position='static'
                                sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', zIndex: 1000 }}
                                color={'transparent'}
                                elevation={1}
                            >
                                <Toolbar sx={{ px: '16px!important', gap: 1 }}>
                                    <SidekickSelect sidekicks={sidekicks} />
                                    <Box
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            gap: 2,
                                            p: {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textTransform: 'capitalize',
                                                display: '-webkit-box',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: '1'
                                            }
                                        }}
                                    >
                                        {chat ? <Typography variant='body1'>{chat?.title ?? chat.id}</Typography> : null}
                                        {journey ? <Typography variant='body2'>{journey?.goal ?? journey?.title}</Typography> : null}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant='text'
                                            onClick={handleNewChat}
                                            endIcon={<RateReviewIcon />}
                                            fullWidth
                                            sx={{
                                                textTransform: 'capitalize',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            New chat
                                        </Button>
                                    </Box>
                                </Toolbar>
                            </AppBar>
                        ) : null}

                        {!selectedSidekick && !chat ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    flexDirection: 'column',
                                    paddingTop: 10,
                                    maxWidth: 1200,
                                    px: { xs: 2, sm: 3 },
                                    overflowY: 'auto',
                                    margin: '0 auto'
                                }}
                            >
                                <Image
                                    src='/static/images/logos/answerai-logo-600-wide-white.png'
                                    alt='Answers Logo'
                                    width={600}
                                    height={120}
                                    priority
                                    style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
                                />
                                <SidekickSelect noDialog sidekicks={sidekicks} />
                            </Box>
                        ) : displayMode === DISPLAY_MODES.CHATBOT ? (
                            <Box
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        overflow: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    ref={scrollRef}
                                >
                                    <Box
                                        sx={{
                                            width: '100%',
                                            maxWidth: 768,
                                            margin: '0 auto',
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            px: { xs: 2, sm: 3 }
                                        }}
                                    >
                                        <ChatRoom
                                            messages={messages}
                                            error={error}
                                            isLoading={isLoading}
                                            regenerateAnswer={regenerateAnswer}
                                            chatbotConfig={chatbotConfig}
                                            setSelectedDocuments={setSelectedDocuments}
                                            // @ts-ignore - Type mismatch in setPreviewCode
                                            setPreviewCode={setPreviewCode}
                                            sidekicks={sidekicks}
                                            scrollRef={scrollRef}
                                            // @ts-ignore - Type mismatch in selectedSidekick
                                            selectedSidekick={selectedSidekick}
                                        />
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        width: '100%',
                                        maxWidth: 768,
                                        margin: '0 auto',
                                        px: { xs: 2, sm: 3 }
                                    }}
                                >
                                    <ChatInput
                                        sidekicks={sidekicks}
                                        scrollRef={scrollRef}
                                        uploadedFiles={uploadedFiles}
                                        setUploadedFiles={setUploadedFiles}
                                        isWidget={false}
                                    />
                                </Box>
                            </Box>
                        ) : displayMode === DISPLAY_MODES.MEDIA_CREATION ? (
                            <ImageCreator user={session?.user} />
                        ) : (
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    width: '100%'
                                }}
                            >
                                <iframe src={embeddedUrl} style={{ flex: 1, border: 'none' }} title='Embedded Form' allowFullScreen />
                            </Box>
                        )}
                    </Box>
                </Box>

                <Drawer
                    sx={{
                        flexShrink: 0,
                        zIndex: 1000,
                        position: { md: 'relative', xs: 'absolute' },
                        '& .MuiDrawer-paper': {
                            position: 'absolute',
                            boxSizing: 'border-box',
                            height: '100%'
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }}
                    PaperProps={{
                        sx: {
                            height: '100%'
                        }
                    }}
                    variant='permanent'
                    anchor='left'
                    open={!!showFilters || !!selectedDocuments || !!previewCode}
                >
                    {selectedDocuments ? (
                        <SourceDocumentModal documents={selectedDocuments} onClose={() => setSelectedDocuments(undefined)} />
                    ) : previewCode ? (
                        <CodePreview {...previewCode} onClose={() => setPreviewCode(null)} />
                    ) : showFilters ? (
                        <DrawerFilters appSettings={appSettings} />
                    ) : null}
                </Drawer>
            </Box>

            {/* Unified Credentials Modal with Theme */}
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={themes({ isDarkMode: true })}>
                    <CssBaseline />
                    <UnifiedCredentialsModal
                        show={showCredentialModal}
                        missingCredentials={missingCredentials}
                        onAssign={handleModalAssign}
                        onSkip={handleModalSkip}
                        onCancel={handleModalCancel}
                        onError={handleModalError}
                        flowData={selectedSidekick?.flowData || null}
                    />
                </ThemeProvider>
            </StyledEngineProvider>
        </>
    )
}
