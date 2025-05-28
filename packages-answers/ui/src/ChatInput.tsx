'use client'
import React, { useState, useEffect, useRef, ChangeEvent } from 'react'

import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import AttachFileIcon from '@mui/icons-material/PermMedia'
import AttachIcon from '@mui/icons-material/AttachFile'
import MicIcon from '@mui/icons-material/Mic'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { IconCircleDot, IconPaperclip } from '@tabler/icons-react'

import { useAnswers } from './AnswersContext'

import type { Sidekick, StarterPrompt, FileUpload } from 'types'
import { getAllowedUploadTypes } from './utils/getAllowedUploadTypes'
import { Card, CardMedia } from '@mui/material'
import { ImageButton, ImageSrc, ImageBackdrop, ImageMarked } from '@/ui-component/button/ImageButton'

import dynamic from 'next/dynamic'
const DefaultPrompts = dynamic(() => import('./DefaultPrompts').then((mod) => mod.DefaultPrompts))
const Tooltip = dynamic(() => import('@mui/material/Tooltip'))
const TextField = dynamic(() => import('@mui/material/TextField'))

interface ChatInputProps {
    scrollRef?: React.RefObject<HTMLDivElement>
    isWidget?: boolean
    sidekicks?: Sidekick[]
    uploadedFiles?: FileUpload[]
    setUploadedFiles: (files: FileUpload[]) => void
}

const ChatInput = ({ scrollRef, isWidget, sidekicks, setUploadedFiles }: ChatInputProps) => {
    const {
        chat,
        journey,
        messages,
        sendMessage,
        isLoading,
        sidekick,
        gptModel,
        startNewChat,
        chatbotConfig,
        allowedUploads,
        handleFileChange,
        previews,
        handleDeletePreview,
        handleDrop,
        handleDrag,
        isDragActive,
        uploadedFiles,
        handleAbort: contextHandleAbort,
        clearPreviews
    } = useAnswers()
    const defaultPlaceholderValue = 'How can you help me accomplish my goal?'
    const [inputValue, setInputValue] = useState('')
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingStatus, setRecordingStatus] = useState('')
    const [recordedAudio, setRecordedAudio] = useState<File | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isLoadingRecording, setIsLoadingRecording] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const recordingIntervalRef = useRef<number | undefined>(undefined)
    const [isMessageStopping, setIsMessageStopping] = useState(false)
    const [sourceDialogOpen, setSourceDialogOpen] = useState(false)
    const [sourceDialogProps, setSourceDialogProps] = useState({})

    useEffect(() => {
        if (isRecording) {
            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime((time) => time + 1)
            }, 1000)
        } else {
            clearInterval(recordingIntervalRef.current)
        }

        return () => {
            clearInterval(recordingIntervalRef.current)
        }
    }, [isRecording])

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value)
    }

    const handleSubmit = async () => {
        if (!inputValue && previews.length === 0 && !recordedAudio) return

        const files = previews.map((file: FileUpload) => ({
            data: file.data,
            type: file.type,
            name: file.name,
            mime: file.mime || ''
        }))

        if (recordedAudio) {
            const reader = new FileReader()
            reader.readAsDataURL(recordedAudio)
            reader.onload = (evt) => {
                if (!evt?.target?.result) return
                files.push({
                    data: evt.target.result as string,
                    type: 'file',
                    name: `audio_${Date.now()}.wav`,
                    mime: recordedAudio?.type || 'audio/wav'
                })

                sendMessage({
                    content: inputValue,
                    files,
                    sidekick,
                    gptModel
                })

                setInputValue('')
                setRecordedAudio(null)
                setRecordingStatus('')
                setIsLoadingRecording(false)
                setRecordingTime(0)
            }
        } else {
            sendMessage({
                content: inputValue,
                files,
                sidekick,
                gptModel
            })

            setInputValue('')
            setRecordedAudio(null)
            setRecordingStatus('')
            setIsLoadingRecording(false)
            setRecordingTime(0)
        }
    }

    const handleRemoveAudio = () => {
        setRecordedAudio(null)
        setRecordingTime(0)
    }

    const handleAudioRecordStart = () => {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                mediaRecorderRef.current = new MediaRecorder(stream)
                mediaRecorderRef.current.start()
                setIsRecording(true)
                setRecordingTime(0)
                setRecordingStatus('')

                mediaRecorderRef.current.ondataavailable = (event) => {
                    const audioBlob = event.data
                    const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/webm' })
                    setRecordedAudio(audioFile)
                    if (isLoadingRecording) {
                        handleSubmit()
                    }
                }

                mediaRecorderRef.current.onstop = () => {
                    setIsRecording(false)
                    stream.getTracks().forEach((track) => track.stop())
                }
            })
            .catch((error) => {
                console.error('Error accessing microphone:', error)
                setRecordingStatus('To record audio, use modern browsers like Chrome or Firefox that support audio recording.')
                setIsRecording(true)
            })
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0')
        const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
        return `${minutes}:${remainingSeconds}`
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit()
            e.preventDefault()
        }
    }

    const handleAbortMessage = async () => {
        setIsMessageStopping(true)
        try {
            await contextHandleAbort()
            setIsMessageStopping(false)
        } catch (error) {
            setIsMessageStopping(false)
            console.error('Error stopping message:', error)
        }
    }

    const handleStopAndSend = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            setIsLoadingRecording(true)
            mediaRecorderRef.current.addEventListener(
                'dataavailable',
                async (event) => {
                    const audioBlob = event.data
                    const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/webm' })
                    setRecordedAudio(audioFile)
                    const reader = new FileReader()
                    reader.readAsDataURL(audioFile)
                    reader.onload = (evt) => {
                        if (!evt?.target?.result) return
                        const files = previews.map((file: FileUpload) => ({
                            data: file.data,
                            type: file.type,
                            name: file.name,
                            mime: file.mime || ''
                        }))
                        files.push({
                            data: evt.target.result as string,
                            type: 'file',
                            name: `audio_${Date.now()}.wav`,
                            mime: audioFile.type || 'audio/wav'
                        })
                        sendMessage({
                            content: inputValue,
                            files,
                            sidekick,
                            gptModel
                        })
                        setInputValue('')
                        setRecordedAudio(null)
                        setRecordingStatus('')
                        setIsLoadingRecording(false)
                        setRecordingTime(0)
                    }
                },
                { once: true }
            )
            mediaRecorderRef.current.stop()
        } else if (recordedAudio) {
            handleSubmit()
        }
    }

    const handleStopAndCancel = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        setRecordingStatus('')
        setRecordingTime(0)
        setIsRecording(false)
        setRecordedAudio(null)
        setIsLoadingRecording(false)
    }

    const handlePromptSelected = (prompt: StarterPrompt) => {
        sendMessage({ content: prompt.prompt, sidekick, gptModel })
        setInputValue('')
    }

    return (
        <Box
            display='flex'
            position='relative'
            sx={{ gap: 1, flexDirection: 'column', pb: 2 }}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
        >
            {/* Add a stop button when message is loading */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 2 }}>
                    <Button variant='outlined' color='secondary' onClick={handleAbortMessage} disabled={isMessageStopping}>
                        {isMessageStopping ? 'Stopping...' : 'Stop Generating'}
                    </Button>
                </Box>
            )}

            {!messages?.length ? (
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', alignItems: 'flex-end' }}>
                    <DefaultPrompts prompts={chatbotConfig?.starterPrompts} onPromptSelected={handlePromptSelected} />
                </Box>
            ) : null}

            {isDragActive && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        border: '2px dashed #aaa',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    <p>Drop files here</p>
                </Box>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1,
                    overflowX: 'auto',
                    padding: 0,
                    maxHeight: '80px',
                    alignItems: 'center',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        height: '2px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '2px'
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent'
                    }
                }}
            >
                {previews.length > 0 && (
                    <Box
                        sx={{
                            width: '100%',
                            // mb: 1.5,
                            display: 'flex',
                            flexWrap: 'nowrap',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {previews.map((file, index) =>
                            // For images
                            file.mime.startsWith('image/') ? (
                                <ImageButton
                                    key={index}
                                    focusRipple
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        marginRight: '10px',
                                        flex: '0 0 auto'
                                    }}
                                    onClick={() => handleDeletePreview(index)}
                                >
                                    <ImageSrc style={{ backgroundImage: `url(${file.preview})` }} />
                                    <ImageBackdrop className='MuiImageBackdrop-root' />
                                    <ImageMarked className='MuiImageMarked-root'>
                                        <CloseIcon fontSize='small' style={{ fontSize: '0.75rem', color: 'white' }} />
                                    </ImageMarked>
                                </ImageButton>
                            ) : // For audio files
                            file.mime.startsWith('audio/') ? (
                                <Card
                                    key={index}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        height: '48px',
                                        width: '200px',
                                        p: 0.5,
                                        mr: 1,
                                        backgroundColor: 'grey.500',
                                        flex: '0 0 auto'
                                    }}
                                    variant='outlined'
                                >
                                    <CardMedia component='audio' sx={{ color: 'transparent' }} controls src={file.data} />
                                    <IconButton onClick={() => handleDeletePreview(index)} size='small'>
                                        <CloseIcon fontSize='small' style={{ fontSize: '0.75rem', color: 'white' }} />
                                    </IconButton>
                                </Card>
                            ) : (
                                // For other files
                                <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                    <Card
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            height: '48px',
                                            width: 'max-content',
                                            p: 2,
                                            mr: 1,
                                            flex: '0 0 auto',
                                            backgroundColor: 'transparent'
                                        }}
                                        variant='outlined'
                                    >
                                        <IconPaperclip size={20} />
                                        <span
                                            style={{
                                                marginLeft: '5px'
                                            }}
                                        >
                                            {file.name}
                                        </span>
                                        <IconButton onClick={() => handleDeletePreview(index)} size='small' sx={{ ml: 1 }}>
                                            <CloseIcon fontSize='small' style={{ fontSize: '0.75rem' }} />
                                        </IconButton>
                                    </Card>
                                </div>
                            )
                        )}
                    </Box>
                )}
                {recordedAudio && (
                    <Box
                        sx={{
                            position: 'relative',
                            ml: 2
                        }}
                    >
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <audio controls src={URL.createObjectURL(recordedAudio)} />
                        <IconButton
                            onClick={handleRemoveAudio}
                            size='small'
                            sx={{
                                position: 'absolute',
                                bottom: 45,
                                right: -7,
                                color: '#fff',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                            }}
                        >
                            <CloseIcon fontSize='small' style={{ fontSize: '0.75rem' }} />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {isRecording ? (
                <TextField
                    id='user-chat-input'
                    inputRef={inputRef}
                    variant='filled'
                    fullWidth
                    disabled
                    value={
                        recordingStatus === 'To record audio, use modern browsers like Chrome or Firefox that support audio recording.'
                            ? recordingStatus
                            : `Recording: ${formatTime(recordingTime)}${isLoadingRecording ? ' • Sending...' : ''}`
                    }
                    InputProps={{
                        sx: {
                            gap: 1,
                            display: 'flex',
                            paddingBottom: 1,
                            maxHeight: '30vh',
                            overflowY: 'auto',
                            textarea: {
                                maxHeight: '30vh',
                                overflowY: 'auto!important'
                            }
                        },
                        startAdornment: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                                <IconCircleDot sx={{ color: 'red', animation: 'pulse 1.5s infinite' }} />
                            </Box>
                        ),
                        endAdornment: (
                            <>
                                <Tooltip title='Cancel Recording'>
                                    <Button onClick={handleStopAndCancel}>
                                        <CloseIcon />
                                    </Button>
                                </Tooltip>

                                <Button variant='contained' color='primary' onClick={handleStopAndSend}>
                                    Send
                                </Button>
                            </>
                        )
                    }}
                />
            ) : (
                <TextField
                    id='user-chat-input'
                    inputRef={inputRef}
                    variant='filled'
                    fullWidth
                    placeholder={chatbotConfig?.textInput?.placeholder ?? 'Send a question or task'}
                    value={inputValue}
                    multiline
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    InputProps={{
                        sx: {
                            gap: 1,
                            display: 'flex',
                            paddingBottom: 2,
                            textarea: {
                                maxHeight: '30vh',
                                overflowY: 'auto!important'
                            }
                        },
                        startAdornment: (
                            <>
                                {allowedUploads.isImageUploadAllowed && (
                                    <Tooltip title='Attach image'>
                                        <IconButton component='label' sx={{ minWidth: 0 }}>
                                            <AttachFileIcon />
                                            <input
                                                type='file'
                                                accept={getAllowedUploadTypes(allowedUploads.imgUploadSizeAndTypes)}
                                                hidden
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {(chatbotConfig?.fullFileUpload?.status || allowedUploads.isRAGFileUploadAllowed) && (
                                    <Tooltip title='Attach file'>
                                        <IconButton component='label' sx={{ minWidth: 0 }}>
                                            <AttachIcon />
                                            <input
                                                type='file'
                                                accept={
                                                    chatbotConfig?.fullFileUpload?.status
                                                        ? '*'
                                                        : getAllowedUploadTypes(allowedUploads.fileUploadSizeAndTypes)
                                                }
                                                hidden
                                                multiple
                                                onChange={handleFileChange}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </>
                        ),
                        endAdornment: (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {allowedUploads.isSpeechToTextEnabled && (
                                    <Tooltip title={isRecording ? 'Stop Recording' : 'Record Audio'}>
                                        <IconButton onClick={handleAudioRecordStart}>
                                            <MicIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                <Button variant='contained' color='primary' onClick={handleSubmit}>
                                    Send
                                </Button>
                            </Box>
                        )
                    }}
                />
            )}
        </Box>
    )
}

export default ChatInput
