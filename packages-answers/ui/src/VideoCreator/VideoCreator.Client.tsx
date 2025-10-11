'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    MenuItem,
    Pagination,
    Select,
    SelectChangeEvent,
    Skeleton,
    Slider,
    Stack,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography
} from '@mui/material'
import { keyframes } from '@mui/system'
import {
    IconBrandGoogle,
    IconBrandOpenai,
    IconDownload,
    IconHistory,
    IconPhoto,
    IconRefresh,
    IconVideo,
    IconX,
    IconSparkles,
    IconDeviceMobile,
    IconDeviceMobileRotated,
    IconUpload
} from '@tabler/icons-react'
import ImageCropModal from './ImageCropModal'
import PromptEnhancerWizard, { EnhancedPromptData } from './PromptEnhancerWizard'

type Provider = 'openai' | 'google'
type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed'

interface ReferenceAsset {
    base64: string
    mimeType?: string
    name?: string
    previewUrl: string
}

interface UploadedImage {
    originalBase64: string
    originalPreviewUrl: string
    mimeType: string
    name: string
}

interface VideoMessage {
    id: string
    jobId: string
    prompt: string
    model: string
    provider: Provider
    status: JobStatus
    progress?: number
    videoUrl?: string
    thumbnailUrl?: string
    metadataUrl?: string
    fileName?: string
    createdAt: string
    updatedAt?: string
    remixOf?: string | null
    error?: string
    sessionId?: string
    saved?: boolean
    generationParams?: {
        size?: string
        seconds?: number
        aspectRatio?: string
        negativePrompt?: string
        referenceImage?: ReferenceAsset | null
    }
}

interface VideoJobResult {
    jobId: string
    provider: Provider
    model: string
    prompt: string
    status: JobStatus
    progress?: number
    createdAt: string
    updatedAt: string
    organizationId: string
    userId: string
    userEmail?: string
    remixOf?: string | null
    error?: string
    result?: {
        sessionId: string
        prompt: string
        model: string
        provider: Provider
        videoUrl: string
        thumbnailUrl?: string
        metadataUrl: string
        fileName: string
        videoId: string
        remixOf?: string | null
        createdAt: string
        jobId: string
    }
}

interface ArchivedVideo {
    sessionId: string
    videoUrl: string
    thumbnailUrl?: string
    metadataUrl?: string
    timestamp: string
    provider: Provider
    model: string
    fileName: string
    jobId?: string
}

interface ArchiveResponse {
    videos: ArchivedVideo[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

interface RemixTarget {
    sessionId: string
    provider: Provider
    model: string
    metadataUrl?: string
    videoUrl: string
    prompt?: string
    videoId?: string
}

const providerIcon = {
    openai: IconBrandOpenai,
    google: IconBrandGoogle
}

const providerLabel: Record<Provider, string> = {
    openai: 'OpenAI Sora',
    google: 'Google Veo'
}

const pulse = keyframes`
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
`

const getProviderForModel = (model: string): Provider => {
    if (model.startsWith('veo')) {
        return 'google'
    }
    return 'openai'
}

const durationOptions = [4, 6, 8, 10, 12, 15]

const formatDateTime = (value?: string) => {
    if (!value) return 'Unknown date'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleString()
}

const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
    })

const VideoCreator = () => {
    const { user, isLoading } = useUser()
    const [prompt, setPrompt] = useState('')
    const [model, setModel] = useState('sora-2')
    const [size, setSize] = useState('1280x720')
    const [seconds, setSeconds] = useState(8)
    const [aspectRatio, setAspectRatio] = useState('16:9')
    const [negativePrompt, setNegativePrompt] = useState('')
    const [referenceImage, setReferenceImage] = useState<ReferenceAsset | null>(null)
    const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [messages, setMessages] = useState<VideoMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [currentTab, setCurrentTab] = useState(0)

    const [archivedVideos, setArchivedVideos] = useState<ArchivedVideo[]>([])
    const [archiveLoading, setArchiveLoading] = useState(false)
    const [archivePagination, setArchivePagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasMore: false
    })

    const [remixModalOpen, setRemixModalOpen] = useState(false)
    const [remixTarget, setRemixTarget] = useState<RemixTarget | null>(null)
    const [remixPrompt, setRemixPrompt] = useState('')

    const [enhanceModalOpen, setEnhanceModalOpen] = useState(false)
    const [isEnhancing, setIsEnhancing] = useState(false)
    const [enhancedData, setEnhancedData] = useState<EnhancedPromptData | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // Dialog/Voice-over settings
    const [dialogEnabled, setDialogEnabled] = useState(false)
    const [dialogText, setDialogText] = useState('')
    const [dialogTone, setDialogTone] = useState('neutral')
    const [dialogEmotion, setDialogEmotion] = useState('calm')

    const provider = useMemo(() => getProviderForModel(model), [model])
    const jobPollers = useRef<Map<string, number>>(new Map())

    useEffect(() => {
        return () => {
            if (referenceImage?.previewUrl) {
                URL.revokeObjectURL(referenceImage.previewUrl)
            }
            if (uploadedImage?.originalPreviewUrl) {
                URL.revokeObjectURL(uploadedImage.originalPreviewUrl)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const pollers = jobPollers.current
        return () => {
            pollers.forEach((timer) => clearInterval(timer))
            pollers.clear()
        }
    }, [])

    useEffect(() => {
        if (!user) return
        loadRecentJobs()
        fetchArchivedVideos(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const resetReferenceImage = () => {
        if (referenceImage?.previewUrl) {
            URL.revokeObjectURL(referenceImage.previewUrl)
        }
        if (uploadedImage?.originalPreviewUrl) {
            URL.revokeObjectURL(uploadedImage.originalPreviewUrl)
        }
        setReferenceImage(null)
        setUploadedImage(null)
    }

    const mapJobToMessage = (job: VideoJobResult, params?: VideoMessage['generationParams']): VideoMessage => ({
        id: job.jobId,
        jobId: job.jobId,
        prompt: job.prompt,
        model: job.model,
        provider: job.provider,
        status: job.status,
        progress: job.progress,
        videoUrl: job.result?.videoUrl,
        thumbnailUrl: job.result?.thumbnailUrl,
        metadataUrl: job.result?.metadataUrl,
        fileName: job.result?.fileName,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        remixOf: job.remixOf ?? null,
        error: job.error,
        sessionId: job.result?.sessionId,
        saved: job.status === 'completed',
        generationParams: params
    })

    const handleJobUpdate = (job: VideoJobResult, params?: VideoMessage['generationParams']) => {
        const mapped = mapJobToMessage(job, params)
        setMessages((prev) => {
            const index = prev.findIndex((msg) => msg.jobId === job.jobId)
            if (index === -1) {
                return [mapped, ...prev]
            }
            const existing = prev[index]
            const merged: VideoMessage = {
                ...existing,
                ...mapped,
                videoUrl: mapped.videoUrl ?? existing.videoUrl,
                thumbnailUrl: mapped.thumbnailUrl ?? existing.thumbnailUrl,
                metadataUrl: mapped.metadataUrl ?? existing.metadataUrl,
                fileName: mapped.fileName ?? existing.fileName,
                sessionId: mapped.sessionId ?? existing.sessionId,
                progress: mapped.progress ?? existing.progress,
                error: mapped.error ?? existing.error,
                saved: mapped.saved ?? existing.saved,
                generationParams: mapped.generationParams ?? existing.generationParams
            }
            const next = [...prev]
            next[index] = merged
            return next
        })
    }

    const stopJobPolling = (jobId: string) => {
        const timer = jobPollers.current.get(jobId)
        if (timer) {
            clearInterval(timer)
            jobPollers.current.delete(jobId)
        }
    }

    useEffect(() => {
        if (provider === 'google') {
            // Veo: 1080p only supports 16:9, 720p supports both 16:9 and 9:16
            setAspectRatio((current) => {
                if (current !== '16:9' && current !== '9:16') return '16:9'
                // If 1080p is selected with 9:16, switch to 720p
                if (current === '9:16' && size === '1920x1080') {
                    setSize('1280x720')
                }
                return current
            })
            setSize((current) => (current === '1280x720' || current === '1920x1080' ? current : '1280x720'))
            setSeconds((current) => (durationOptions.includes(current) ? current : 8))
        } else {
            setSize((current) => (current === '1280x720' || current === '1920x1080' ? current : '1280x720'))
            setSeconds((current) => (durationOptions.includes(current) ? current : 8))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider])

    // Additional validation: For Veo, if aspect ratio changes to 9:16 and 1080p is selected, switch to 720p
    useEffect(() => {
        if (provider === 'google' && aspectRatio === '9:16' && size === '1920x1080') {
            setSize('1280x720')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aspectRatio, provider])

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue)
        if (newValue === 1 && archivedVideos.length === 0) {
            fetchArchivedVideos()
        }
    }

    const handleModelChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value
        setModel(value)
    }

    const handleReferenceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Clean up previous images
        if (referenceImage?.previewUrl) {
            URL.revokeObjectURL(referenceImage.previewUrl)
        }
        if (uploadedImage?.originalPreviewUrl) {
            URL.revokeObjectURL(uploadedImage.originalPreviewUrl)
        }

        const previewUrl = URL.createObjectURL(file)
        const base64 = await fileToBase64(file)

        // Store the original image
        setUploadedImage({
            originalBase64: base64,
            originalPreviewUrl: previewUrl,
            mimeType: file.type,
            name: file.name
        })

        // Open crop modal
        setCropModalOpen(true)

        // Reset the input to allow re-uploading the same file
        event.target.value = ''
    }

    const handleCropComplete = (croppedImageBase64: string, finalAspectRatio: string) => {
        if (!uploadedImage) return

        // Update aspect ratio if it was changed in the modal
        if (finalAspectRatio !== aspectRatio) {
            setAspectRatio(finalAspectRatio)
        }

        // Create preview URL for the cropped image
        const croppedPreviewUrl = croppedImageBase64

        setReferenceImage({
            base64: croppedImageBase64,
            mimeType: uploadedImage.mimeType,
            name: uploadedImage.name,
            previewUrl: croppedPreviewUrl
        })
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        // Clean up previous images
        if (referenceImage?.previewUrl) {
            URL.revokeObjectURL(referenceImage.previewUrl)
        }
        if (uploadedImage?.originalPreviewUrl) {
            URL.revokeObjectURL(uploadedImage.originalPreviewUrl)
        }

        const previewUrl = URL.createObjectURL(file)
        const base64 = await fileToBase64(file)

        // Store the original image
        setUploadedImage({
            originalBase64: base64,
            originalPreviewUrl: previewUrl,
            mimeType: file.type,
            name: file.name
        })

        // Open crop modal
        setCropModalOpen(true)
    }

    const downloadFile = async (path: string, fileName: string) => {
        if (!user) return
        const accessToken = sessionStorage.getItem('access_token')
        const url = `${user.chatflowDomain}${path}`
        const response = await fetch(url, {
            headers: accessToken
                ? {
                      Authorization: `Bearer ${accessToken}`
                  }
                : undefined
        })
        if (!response.ok) {
            console.error('Failed to download file', response.statusText)
            return
        }
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(link.href)
    }

    const fetchArchivedVideos = async (page = 1) => {
        if (!user) return
        const accessToken = sessionStorage.getItem('access_token')
        if (!accessToken) {
            console.error('No access token available')
            return
        }
        setArchiveLoading(true)
        try {
            const response = await fetch(
                `${user.chatflowDomain}/api/v1/video-generator/archive?page=${page}&limit=${archivePagination.limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            )
            if (!response.ok) {
                console.error('Failed to fetch archived videos', response.statusText)
                return
            }
            const data = (await response.json()) as ArchiveResponse
            setArchivedVideos(data.videos)
            setArchivePagination(data.pagination)
        } catch (error) {
            console.error('Error fetching archived videos', error)
        } finally {
            setArchiveLoading(false)
        }
    }

    const loadRecentJobs = async () => {
        if (!user) return
        const accessToken = sessionStorage.getItem('access_token')
        if (!accessToken) {
            console.error('No access token available for recent jobs fetch')
            return
        }

        try {
            const response = await fetch(`${user.chatflowDomain}/api/v1/video-generator/recent`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            if (!response.ok) {
                const errorMessage = await response.text()
                console.error('Failed to load recent video jobs', response.status, errorMessage)
                return
            }

            const jobs = (await response.json()) as VideoJobResult[]
            const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            jobPollers.current.forEach((timer) => clearInterval(timer))
            jobPollers.current.clear()

            setMessages(sortedJobs.map((job) => mapJobToMessage(job)))

            sortedJobs.forEach((job) => {
                if (job.status === 'queued' || job.status === 'in_progress' || !job.result?.videoUrl) {
                    startJobPolling(job.jobId)
                }
            })
        } catch (error) {
            console.error('Error loading recent video jobs', error)
        }
    }

    const startJobPolling = (jobId: string) => {
        if (!user) return
        if (jobPollers.current.has(jobId)) return

        const poll = async () => {
            const accessToken = sessionStorage.getItem('access_token')
            if (!accessToken) {
                console.error('No access token available for job polling')
                return
            }

            try {
                const response = await fetch(`${user.chatflowDomain}/api/v1/video-generator/status/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                })

                if (!response.ok) {
                    const errorMessage = await response.text()
                    console.error('Failed to poll job status', response.status, errorMessage)
                    return
                }

                const job = (await response.json()) as VideoJobResult
                handleJobUpdate(job)

                if (job.status === 'completed') {
                    stopJobPolling(jobId)
                    fetchArchivedVideos(1)
                } else if (job.status === 'failed') {
                    stopJobPolling(jobId)
                }
            } catch (error) {
                console.error('Error polling job status', error)
            }
        }

        poll()
        const timer = window.setInterval(poll, 5000)
        jobPollers.current.set(jobId, timer)
    }

    const generateVideo = async (options?: { remix?: { providerVideoId?: string; prompt: string | undefined } }) => {
        if (!user) return
        const accessToken = sessionStorage.getItem('access_token')
        if (!accessToken) {
            console.error('No access token available')
            return
        }

        const generationPrompt = options?.remix?.prompt ?? prompt
        if (!generationPrompt) return

        setLoading(true)

        try {
            // Calculate actual dimensions based on aspect ratio
            // For 9:16, we need to swap width/height from the selected resolution
            let actualSize = size
            if (aspectRatio === '9:16' && referenceImage) {
                const [width, height] = size.split('x').map(Number)
                actualSize = `${height}x${width}` // Swap for portrait
                console.log(`[Video Creator] Adjusted size for 9:16: ${size} → ${actualSize}`)
            }

            console.log('[Video Creator] Generation params:', {
                model,
                size: actualSize,
                aspectRatio,
                hasReferenceImage: !!referenceImage
            })

            const body: Record<string, unknown> = {
                prompt: generationPrompt,
                model,
                size: actualSize, // Send the actual image dimensions
                seconds,
                aspectRatio,
                negativePrompt: negativePrompt || undefined,
                dialog: dialogEnabled
                    ? {
                          text: dialogText,
                          tone: dialogTone,
                          emotion: dialogEmotion
                      }
                    : undefined,
                referenceImage: referenceImage
                    ? {
                          base64: referenceImage.base64,
                          mimeType: referenceImage.mimeType,
                          filename: referenceImage.name,
                          originalBase64: uploadedImage?.originalBase64
                      }
                    : undefined,
                organizationId: (user.organizationId as string) || (user.org_id as string) || undefined,
                userId: (user.id as string) || (user.sub as string) || undefined,
                userEmail: user.email || undefined
            }

            if (options?.remix?.providerVideoId) {
                body.remixVideoProviderId = options.remix.providerVideoId
                body.remixPrompt = generationPrompt
            }

            const response = await fetch(`${user.chatflowDomain}/api/v1/video-generator/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to start video generation')
            }

            const job = (await response.json()) as VideoJobResult

            // Store generation params for potential retry
            const params = {
                size,
                seconds,
                aspectRatio,
                negativePrompt: negativePrompt || undefined,
                referenceImage: referenceImage || undefined
            }

            handleJobUpdate(job, params)
            startJobPolling(job.jobId)
            setPrompt('')
            resetReferenceImage()
            setRemixPrompt('')
        } catch (error) {
            console.error('Error generating video', error)
            const now = new Date().toISOString()
            const fallbackJob: VideoJobResult = {
                jobId: `error-${Date.now()}`,
                provider,
                model,
                prompt: generationPrompt,
                status: 'failed',
                createdAt: now,
                updatedAt: now,
                organizationId: '',
                userId: '',
                error: error instanceof Error ? error.message : 'Failed to start video generation'
            }
            handleJobUpdate(fallbackJob)
        } finally {
            setLoading(false)
        }
    }

    const retryGeneration = async (msg: VideoMessage) => {
        if (!msg.generationParams) {
            console.error('No generation params stored for retry')
            return
        }

        // Restore the generation settings
        if (msg.generationParams.size) setSize(msg.generationParams.size)
        if (msg.generationParams.seconds) setSeconds(msg.generationParams.seconds)
        if (msg.generationParams.aspectRatio) setAspectRatio(msg.generationParams.aspectRatio)
        if (msg.generationParams.negativePrompt) setNegativePrompt(msg.generationParams.negativePrompt)
        if (msg.generationParams.referenceImage) setReferenceImage(msg.generationParams.referenceImage)

        // Retry with the same prompt and settings
        setPrompt(msg.prompt)
        setModel(msg.model)

        // Wait a tick for state to update, then generate
        setTimeout(() => {
            generateVideo()
        }, 100)
    }

    const openRemixModal = async (video: ArchivedVideo) => {
        if (!user) return
        if (!video.metadataUrl) {
            setRemixTarget({
                sessionId: video.sessionId,
                provider: video.provider,
                model: video.model,
                videoUrl: video.videoUrl
            })
            setRemixPrompt('')
            setRemixModalOpen(true)
            return
        }
        const accessToken = sessionStorage.getItem('access_token')
        if (!accessToken) {
            console.error('No access token available')
            return
        }
        try {
            const response = await fetch(`${user.chatflowDomain}${video.metadataUrl}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            if (!response.ok) {
                throw new Error('Failed to load metadata')
            }
            const metadata = await response.json()
            setRemixTarget({
                sessionId: video.sessionId,
                provider: video.provider,
                model: video.model,
                metadataUrl: video.metadataUrl,
                videoUrl: video.videoUrl,
                prompt: metadata?.prompt,
                videoId: metadata?.videoId
            })
            setRemixPrompt(metadata?.prompt || prompt)
            setModel(video.model)
            setRemixModalOpen(true)
        } catch (error) {
            console.error('Failed to fetch metadata for remix', error)
        }
    }

    const submitRemix = async () => {
        if (!remixTarget) return
        setRemixModalOpen(false)
        await generateVideo({
            remix: {
                providerVideoId: remixTarget.videoId,
                prompt: remixPrompt
            }
        })
    }

    const handleEnhancePrompt = async (existingPrompt?: string, existingDialog?: { text: string; tone: string; emotion: string }) => {
        const promptToEnhance = existingPrompt || prompt
        if (!user || !promptToEnhance.trim()) return null

        const accessToken = sessionStorage.getItem('access_token')
        if (!accessToken) {
            console.error('No access token available')
            return null
        }

        setIsEnhancing(true)
        try {
            const enhancePayload: any = { prompt: promptToEnhance }

            // Include dialog if provided or if enabled
            if (existingDialog || dialogEnabled) {
                enhancePayload.dialog = existingDialog || {
                    text: dialogText,
                    tone: dialogTone,
                    emotion: dialogEmotion
                }
            }

            const response = await fetch(`${user.chatflowDomain}/api/v1/video-generator/enhance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify(enhancePayload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || 'Failed to enhance prompt')
            }

            const enhancedJson = (await response.json()) as EnhancedPromptData
            setEnhancedData(enhancedJson)

            // Don't open modal if called from within modal
            if (!existingPrompt) {
                setEnhanceModalOpen(true)
            }

            return enhancedJson
        } catch (error) {
            console.error('Error enhancing prompt', error)
            alert('Failed to enhance prompt. Please try again.')
            return null
        } finally {
            setIsEnhancing(false)
        }
    }

    const handleApplyEnhancedPrompt = (enhancedPrompt: string, jsonData: EnhancedPromptData) => {
        setPrompt(enhancedPrompt)
        setEnhancedData(jsonData)

        // Apply dialog settings if present
        if (jsonData.audio?.dialog?.text) {
            setDialogEnabled(true)
            setDialogText(jsonData.audio.dialog.text)
            setDialogTone(jsonData.audio.dialog.tone || 'neutral')
            setDialogEmotion(jsonData.audio.dialog.emotion || 'calm')
        }

        setEnhanceModalOpen(false)
    }

    if (isLoading) {
        return (
            <Stack spacing={3} sx={{ p: 3 }}>
                <Typography variant='h2'>Video Creator</Typography>
                <Typography>Loading...</Typography>
            </Stack>
        )
    }

    if (!user) {
        return (
            <Stack spacing={3} sx={{ p: 3 }}>
                <Typography variant='h2'>Video Creator</Typography>
                <Typography>Please log in to use the Video Creator.</Typography>
            </Stack>
        )
    }

    return (
        <Stack spacing={0} sx={{ height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label='video creator tabs'>
                    <Tab
                        icon={<IconVideo size={20} />}
                        label='Generate'
                        id='video-tab-0'
                        aria-controls='video-tabpanel-0'
                        sx={{ textTransform: 'none' }}
                    />
                    <Tab
                        icon={<IconHistory size={20} />}
                        label='Archive'
                        id='video-tab-1'
                        aria-controls='video-tabpanel-1'
                        sx={{ textTransform: 'none' }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Tab
                        icon={
                            <Box component='span' sx={{ mr: 0.5 }}>
                                🎬
                            </Box>
                        }
                        label='Answer Agent'
                        id='video-tab-2'
                        aria-controls='video-tabpanel-2'
                        sx={{ textTransform: 'none', marginLeft: 'auto' }}
                        disabled
                    />
                </Tabs>
            </Box>

            {currentTab === 0 && (
                <Stack spacing={2} id='video-tabpanel-0' role='tabpanel' aria-labelledby='video-tab-0' sx={{ p: 3 }}>
                    <Box
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        sx={{
                            position: 'relative',
                            border: isDragging ? '2px dashed' : '1px solid',
                            borderColor: isDragging ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            bgcolor: isDragging ? 'action.hover' : 'background.paper',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Stack direction='row' spacing={1} sx={{ p: 1.5, alignItems: 'flex-start' }}>
                            {/* Left side - Image upload */}
                            <Stack spacing={1} sx={{ minWidth: 80 }}>
                                {referenceImage ? (
                                    <Box sx={{ position: 'relative' }}>
                                        <Box
                                            component='img'
                                            src={referenceImage.previewUrl}
                                            alt='Reference'
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 1,
                                                objectFit: 'cover',
                                                border: '1px solid',
                                                borderColor: 'divider'
                                            }}
                                        />
                                        <IconButton
                                            size='small'
                                            onClick={resetReferenceImage}
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                right: -8,
                                                bgcolor: 'background.paper',
                                                '&:hover': { bgcolor: 'background.paper' }
                                            }}
                                        >
                                            <IconX size={14} />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <Tooltip title='Upload reference image'>
                                        <Button
                                            component='label'
                                            variant='outlined'
                                            disabled={loading}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                minWidth: 80,
                                                p: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 0.5
                                            }}
                                        >
                                            <IconUpload size={20} />
                                            <Typography variant='caption' sx={{ fontSize: 10 }}>
                                                Image
                                            </Typography>
                                            <input
                                                type='file'
                                                hidden
                                                accept='image/png,image/jpeg,image/webp'
                                                onChange={handleReferenceImageUpload}
                                            />
                                        </Button>
                                    </Tooltip>
                                )}
                            </Stack>

                            {/* Right side - Prompt */}
                            <TextField
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                multiline
                                minRows={3}
                                fullWidth
                                placeholder='Describe the scene, subjects, motion, camera, and mood you want to create.'
                                disabled={loading}
                                variant='standard'
                                InputProps={{ disableUnderline: true }}
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.95rem' } }}
                            />
                        </Stack>
                    </Box>

                    {/* Compact controls in one row */}
                    <Stack direction='row' spacing={2} alignItems='center' flexWrap='wrap' sx={{ gap: 1 }}>
                        {/* Model */}
                        <FormControl size='small' sx={{ minWidth: 180 }}>
                            <Select value={model} onChange={handleModelChange} disabled={loading}>
                                <MenuItem value='sora-2'>Sora 2</MenuItem>
                                <MenuItem value='sora-2-pro'>Sora 2 Pro</MenuItem>
                                <MenuItem value='veo-3.0-generate-001'>Veo 3</MenuItem>
                                <MenuItem value='veo-3.0-fast-generate-001'>Veo 3 Fast</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Resolution Pills */}
                        <ToggleButtonGroup
                            value={size}
                            exclusive
                            onChange={(_, newSize) => {
                                if (newSize !== null) setSize(newSize)
                            }}
                            disabled={loading}
                            size='small'
                        >
                            <ToggleButton value='1280x720' sx={{ px: 2, py: 0.5, textTransform: 'none', fontSize: '0.875rem' }}>
                                720p
                            </ToggleButton>
                            <Tooltip
                                title={
                                    provider === 'google' && aspectRatio === '9:16' ? 'Veo 3: 1080p only supports 16:9 aspect ratio' : ''
                                }
                                arrow
                            >
                                <span>
                                    <ToggleButton
                                        value='1920x1080'
                                        disabled={provider === 'google' && aspectRatio === '9:16'}
                                        sx={{ px: 2, py: 0.5, textTransform: 'none', fontSize: '0.875rem' }}
                                    >
                                        1080p
                                    </ToggleButton>
                                </span>
                            </Tooltip>
                        </ToggleButtonGroup>

                        {/* Aspect Ratio */}
                        <ToggleButtonGroup
                            value={aspectRatio}
                            exclusive
                            onChange={(_, newRatio) => {
                                if (newRatio !== null) setAspectRatio(newRatio)
                            }}
                            disabled={loading}
                            size='small'
                        >
                            <ToggleButton value='16:9' sx={{ px: 1.5, py: 0.5 }}>
                                <IconDeviceMobileRotated size={18} />
                            </ToggleButton>
                            <ToggleButton value='9:16' sx={{ px: 1.5, py: 0.5 }}>
                                <IconDeviceMobile size={18} />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Duration Slider */}
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ minWidth: 200 }}>
                            <Typography variant='caption' color='text.secondary' sx={{ minWidth: 20 }}>
                                {seconds}s
                            </Typography>
                            <Slider
                                value={seconds}
                                onChange={(_, newValue) => setSeconds(newValue as number)}
                                min={4}
                                max={15}
                                step={1}
                                disabled={loading}
                                size='small'
                                sx={{ flexGrow: 1 }}
                            />
                        </Stack>

                        {/* Enhance Button */}
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={isEnhancing ? <CircularProgress size={14} color='inherit' /> : <IconSparkles size={14} />}
                            onClick={() => handleEnhancePrompt()}
                            disabled={!prompt.trim() || loading || isEnhancing}
                            sx={{ ml: 'auto', textTransform: 'none' }}
                        >
                            {isEnhancing ? 'Enhancing...' : 'Enhance'}
                        </Button>
                    </Stack>

                    {provider === 'google' && (
                        <TextField
                            value={negativePrompt}
                            onChange={(event) => setNegativePrompt(event.target.value)}
                            placeholder='Negative prompt (optional)'
                            fullWidth
                            disabled={loading}
                            size='small'
                        />
                    )}

                    <Button
                        variant='contained'
                        size='large'
                        onClick={() => generateVideo()}
                        disabled={loading || !prompt}
                        startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <IconVideo size={20} />}
                        fullWidth
                        sx={{ py: 1.5 }}
                    >
                        {loading ? 'Generating video…' : 'Generate video'}
                    </Button>

                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px dashed',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant='body2' color='text.secondary'>
                                Generated videos will appear here. Each job waits for completion and automatically saves to the archive with
                                metadata.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
                            {messages.map((msg) => {
                                const Icon = providerIcon[msg.provider]
                                const videoSrc = msg.videoUrl ? `${user.chatflowDomain}${msg.videoUrl}` : undefined
                                const thumbnailSrc = msg.thumbnailUrl ? `${user.chatflowDomain}${msg.thumbnailUrl}` : undefined
                                const isVertical = msg.generationParams?.aspectRatio === '9:16' || aspectRatio === '9:16'

                                return (
                                    <Card
                                        key={msg.id}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            gridColumn: isVertical ? 'span 1' : 'span 1',
                                            ...(isVertical && {
                                                maxWidth: '380px',
                                                justifySelf: 'center'
                                            })
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                aspectRatio: isVertical ? '9/16' : '16/9',
                                                bgcolor: 'black'
                                            }}
                                        >
                                            {(msg.status === 'queued' || msg.status === 'in_progress') && (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        animation: `${pulse} 2s ease-in-out infinite`,
                                                        bgcolor: 'rgba(0,0,0,0.8)'
                                                    }}
                                                >
                                                    <Stack alignItems='center' spacing={1}>
                                                        <CircularProgress
                                                            size={42}
                                                            variant={typeof msg.progress === 'number' ? 'determinate' : 'indeterminate'}
                                                            value={msg.progress ?? undefined}
                                                        />
                                                        <Typography variant='body2' color='white'>
                                                            {msg.status === 'queued' ? 'Queued' : 'Generating'}{' '}
                                                            {typeof msg.progress === 'number' ? `${Math.round(msg.progress)}%` : ''}
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            )}
                                            {msg.status === 'completed' && videoSrc && (
                                                <Box
                                                    component='video'
                                                    src={videoSrc}
                                                    controls
                                                    preload='metadata'
                                                    poster={thumbnailSrc}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            )}
                                            {msg.status === 'failed' && (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'error.dark',
                                                        p: 2
                                                    }}
                                                >
                                                    <Stack alignItems='center' spacing={1}>
                                                        <Typography variant='body2' color='white' sx={{ textAlign: 'center', mb: 1 }}>
                                                            {msg.error || 'Unknown error'}
                                                        </Typography>
                                                        <Button
                                                            variant='contained'
                                                            size='small'
                                                            startIcon={<IconRefresh size={16} />}
                                                            onClick={() => retryGeneration(msg)}
                                                            sx={{
                                                                bgcolor: 'white',
                                                                color: 'error.dark',
                                                                '&:hover': { bgcolor: 'grey.200' }
                                                            }}
                                                        >
                                                            Retry
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    bgcolor: 'rgba(0,0,0,0.7)',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}
                                            >
                                                <Icon size={16} color='white' />
                                                <Typography variant='caption' color='white' sx={{ fontWeight: 600 }}>
                                                    {msg.provider === 'openai' ? 'Sora' : 'Veo'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <CardContent sx={{ p: 1.5, pb: 1 }}>
                                            <Typography
                                                variant='body2'
                                                sx={{
                                                    mb: 0.5,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {msg.prompt}
                                            </Typography>
                                            <Typography variant='caption' color='text.secondary'>
                                                {formatDateTime(msg.createdAt)}
                                            </Typography>
                                        </CardContent>
                                        {msg.status === 'completed' && msg.videoUrl && (
                                            <CardActions sx={{ p: 1, pt: 0, gap: 1 }}>
                                                <IconButton
                                                    size='small'
                                                    onClick={() => downloadFile(msg.videoUrl!, msg.fileName || 'generated-video.mp4')}
                                                >
                                                    <IconDownload size={18} />
                                                </IconButton>
                                                {msg.metadataUrl && (
                                                    <Button
                                                        size='small'
                                                        onClick={() => downloadFile(msg.metadataUrl!, `video_metadata_${msg.jobId}.json`)}
                                                        sx={{ ml: 'auto', textTransform: 'none' }}
                                                    >
                                                        Metadata
                                                    </Button>
                                                )}
                                            </CardActions>
                                        )}
                                    </Card>
                                )
                            })}
                        </Box>
                    )}
                </Stack>
            )}

            {currentTab === 1 && (
                <Stack spacing={3} id='video-tabpanel-1' role='tabpanel' aria-labelledby='video-tab-1' sx={{ p: 3 }}>
                    {archiveLoading ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
                            {Array.from({ length: archivePagination.limit }).map((_, index) => (
                                <Card key={`archive-skeleton-${index}`}>
                                    <Skeleton variant='rectangular' sx={{ aspectRatio: '16/9' }} />
                                    <CardContent>
                                        <Skeleton variant='text' width='60%' />
                                        <Skeleton variant='text' width='80%' />
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : archivedVideos.length === 0 ? (
                        <Box
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                borderRadius: 2,
                                border: '1px dashed',
                                borderColor: 'divider'
                            }}
                        >
                            <Typography variant='body2' color='text.secondary'>
                                No archived videos yet. Generate a video to populate this space – completed outputs will automatically
                                appear here.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
                                {archivedVideos.map((video) => {
                                    const Icon = providerIcon[video.provider]
                                    const videoSrc = `${user.chatflowDomain}${video.videoUrl}`
                                    const thumbnailSrc = video.thumbnailUrl ? `${user.chatflowDomain}${video.thumbnailUrl}` : undefined

                                    return (
                                        <Card
                                            key={video.sessionId}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: 'black' }}>
                                                <Box
                                                    component='video'
                                                    src={videoSrc}
                                                    controls
                                                    preload='metadata'
                                                    poster={thumbnailSrc}
                                                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        left: 8,
                                                        bgcolor: 'rgba(0,0,0,0.7)',
                                                        borderRadius: 1,
                                                        px: 1,
                                                        py: 0.5,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5
                                                    }}
                                                >
                                                    <Icon size={16} color='white' />
                                                    <Typography variant='caption' color='white' sx={{ fontWeight: 600 }}>
                                                        {video.provider === 'openai' ? 'Sora' : 'Veo'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <CardContent sx={{ p: 1.5, pb: 1 }}>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {formatDateTime(video.timestamp)}
                                                </Typography>
                                            </CardContent>
                                            <CardActions sx={{ p: 1, pt: 0, gap: 1, justifyContent: 'space-between' }}>
                                                <Stack direction='row' spacing={0.5}>
                                                    <IconButton
                                                        size='small'
                                                        onClick={() => downloadFile(video.videoUrl, video.fileName || 'archived-video.mp4')}
                                                    >
                                                        <IconDownload size={18} />
                                                    </IconButton>
                                                    {video.metadataUrl && (
                                                        <IconButton
                                                            size='small'
                                                            onClick={() =>
                                                                downloadFile(
                                                                    video.metadataUrl!,
                                                                    `video_metadata_${video.jobId || video.sessionId}.json`
                                                                )
                                                            }
                                                        >
                                                            <IconPhoto size={18} />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                                <Button
                                                    size='small'
                                                    startIcon={<IconRefresh size={14} />}
                                                    onClick={() => openRemixModal(video)}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Remix
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    )
                                })}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                                <Pagination
                                    page={archivePagination.page}
                                    count={archivePagination.totalPages}
                                    onChange={(_, page) => fetchArchivedVideos(page)}
                                    color='primary'
                                />
                            </Box>
                        </>
                    )}
                </Stack>
            )}

            {uploadedImage && (
                <ImageCropModal
                    open={cropModalOpen}
                    onClose={() => setCropModalOpen(false)}
                    imageSrc={uploadedImage.originalPreviewUrl}
                    resolution={size}
                    aspectRatio={aspectRatio}
                    onCropComplete={handleCropComplete}
                />
            )}

            <Dialog open={remixModalOpen} onClose={() => setRemixModalOpen(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Remix Video</DialogTitle>
                <DialogContent dividers>
                    {remixTarget && (
                        <Stack spacing={2}>
                            <Typography variant='body2' color='text.secondary'>
                                Model: {remixTarget.model} · Provider: {providerLabel[remixTarget.provider]}
                            </Typography>
                            <TextField
                                label='New prompt'
                                value={remixPrompt}
                                onChange={(event) => setRemixPrompt(event.target.value)}
                                multiline
                                minRows={4}
                            />
                            <Typography variant='body2' color='text.secondary'>
                                The remix will create a new version capturing this updated prompt. Sora remixes reuse the underlying video
                                ID for smooth changes.
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRemixModalOpen(false)}>Cancel</Button>
                    <Button variant='contained' onClick={submitRemix} disabled={!remixPrompt}>
                        Start remix
                    </Button>
                </DialogActions>
            </Dialog>

            <PromptEnhancerWizard
                open={enhanceModalOpen}
                onClose={() => setEnhanceModalOpen(false)}
                initialPrompt={prompt}
                initialData={enhancedData}
                onApply={handleApplyEnhancedPrompt}
                isGenerating={loading}
                isEnhancing={isEnhancing}
                onEnhance={handleEnhancePrompt}
            />
        </Stack>
    )
}

export default VideoCreator
