import React, { Suspense } from 'react'
import { Box, Button } from '@mui/material'
import type { Message, Sidekick } from 'types'
import { MessageCard } from './Message'

interface ChatRoomProps {
    messages: Message[] | null | undefined
    error: any
    isLoading: boolean
    regenerateAnswer: () => void
    chatbotConfig: any
    // setSelectedDocuments: (documents: Document[]) => void
    setSelectedDocuments: any
    sidekicks: Sidekick[]
    scrollRef: React.RefObject<HTMLDivElement>
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
    messages,
    error,
    isLoading,
    regenerateAnswer,
    chatbotConfig,
    setSelectedDocuments,
    sidekicks,
    scrollRef
}) => {
    return (
        <Box ref={scrollRef} sx={{ height: '100%', overflow: 'auto', px: 2, py: 3 }}>
            <Suspense fallback={<div>Loading...</div>}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages?.map((message, index) => (
                        <MessageCard {...message} key={`message_${index}`} setSelectedDocuments={setSelectedDocuments} />
                    ))}

                    {error ? (
                        <>
                            <MessageCard id='error' role='status' content={`${error.message} `} error={error} />
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <Button onClick={regenerateAnswer} variant='contained' color='primary' sx={{ margin: 'auto' }}>
                                    Retry
                                </Button>
                            </Box>
                        </>
                    ) : null}

                    {isLoading && messages?.[messages?.length - 1]?.role === 'user' ? (
                        <MessageCard role='status' isLoading content={'...'} />
                    ) : null}

                    {!messages?.length && !isLoading ? (
                        <MessageCard
                            id='placeholder'
                            role='status'
                            content={chatbotConfig?.welcomeMessage ?? 'Welcome! Try asking me something!'}
                        />
                    ) : null}

                    {!isLoading && !error && messages?.length ? (
                        <Box sx={{ py: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <Button onClick={regenerateAnswer} variant='outlined' color='primary'>
                                Regenerate answer
                            </Button>
                        </Box>
                    ) : null}
                </Box>
            </Suspense>
        </Box>
    )
}
