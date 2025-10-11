import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { addSingleFileToStorage } from 'flowise-components'
import crypto from 'node:crypto'
import { GoogleGenAI } from '@google/genai'
import type { GenerateVideosOperation, GenerateVideosParameters } from '@google/genai/dist/genai'
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import path from 'node:path'
import fs from 'node:fs'
import { FormData, fetch } from 'undici'
import { Blob } from 'node:buffer'

const STORAGE_FOLDER = 'generated-videos'
const OPENAI_MODELS = new Set(['sora-2', 'sora-2-pro'])
const GOOGLE_MODELS = new Set(['veo-3.0-generate-001', 'veo-3.0-fast-generate-001'])
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 120 // ~10 minutes
const JOB_RETENTION_MS = 24 * 60 * 60 * 1000 // keep completed jobs for 24 hours

type Provider = 'openai' | 'google'

type JobStatus = 'queued' | 'in_progress' | 'completed' | 'failed'

interface ReferenceAsset {
    base64: string
    mimeType?: string
    filename?: string
    originalBase64?: string
}

interface VideoGenerationRequest {
    prompt: string
    model: string
    size?: string
    seconds?: number
    aspectRatio?: string
    negativePrompt?: string
    remixVideoProviderId?: string
    remixPrompt?: string
    referenceImage?: ReferenceAsset | null
    organizationId: string
    userId: string
    userEmail?: string
}

interface StoredVideoResult {
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

interface ArchivedVideoEntry {
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
    videos: ArchivedVideoEntry[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

interface VideoJobState {
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
    result?: StoredVideoResult
    providerOperationId?: string // For Google: stores the full operation name
}

interface OpenAIVideoStatus {
    id: string
    status: 'queued' | 'in_progress' | 'completed' | 'failed'
    progress?: number
    error?: {
        message?: string
        type?: string
        code?: string
        param?: string | null
    }
    [key: string]: unknown
}

const videoJobs = new Map<string, VideoJobState>()
const cleanupTimers = new Map<string, NodeJS.Timeout>()

const delay = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms))

const normalizeBase64 = (value: string) => value.replace(/^data:[^;]+;base64,/, '')

const extensionFromMime = (mime?: string) => {
    if (!mime) return 'bin'
    const map: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm'
    }
    return map[mime] || mime.split('/').pop() || 'bin'
}

const sanitizeModelName = (model: string) => model.replace(/[^a-zA-Z0-9.-]/g, '-')

const mapOpenAIStatus = (status?: string): JobStatus => {
    switch (status) {
        case 'in_progress':
            return 'in_progress'
        case 'completed':
            return 'completed'
        case 'failed':
            return 'failed'
        case 'queued':
        default:
            return 'queued'
    }
}

const getStorageType = (): string => {
    return process.env.STORAGE_TYPE ? process.env.STORAGE_TYPE : 'local'
}

const getStoragePath = (): string => {
    const userHome = process.env.HOME || process.env.USERPROFILE || ''
    return process.env.BLOB_STORAGE_PATH ? path.join(process.env.BLOB_STORAGE_PATH) : path.join(userHome, '.flowise', 'storage')
}

const getS3Config = () => {
    const s3Config: any = {
        region: process.env.S3_STORAGE_REGION || 'us-east-1'
    }

    if (process.env.S3_STORAGE_ACCESS_KEY_ID && process.env.S3_STORAGE_SECRET_ACCESS_KEY) {
        s3Config.credentials = {
            accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY
        }
    }

    if (process.env.S3_ENDPOINT_URL) {
        s3Config.endpoint = process.env.S3_ENDPOINT_URL
        s3Config.forcePathStyle = true
    }

    const s3Client = new S3Client(s3Config)
    const Bucket = process.env.S3_STORAGE_BUCKET_NAME || 'default-bucket'

    return { s3Client, Bucket }
}

const registerJob = (job: VideoJobState) => {
    videoJobs.set(job.jobId, job)
}

const scheduleCleanup = (jobId: string) => {
    if (cleanupTimers.has(jobId)) {
        clearTimeout(cleanupTimers.get(jobId))
    }
    const timer = setTimeout(() => {
        videoJobs.delete(jobId)
        cleanupTimers.delete(jobId)
    }, JOB_RETENTION_MS)
    cleanupTimers.set(jobId, timer)
}

const updateJob = (jobId: string, updates: Partial<VideoJobState>) => {
    const current = videoJobs.get(jobId)
    if (!current) return null
    const updated: VideoJobState = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
    }
    videoJobs.set(jobId, updated)
    if (updated.status === 'completed' || updated.status === 'failed') {
        scheduleCleanup(jobId)
    }
    return updated
}

const ensureJobAccess = (job: VideoJobState | undefined, organizationId: string, userId: string) => {
    if (!job) {
        throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Video job not found')
    }
    if (job.organizationId !== organizationId || job.userId !== userId) {
        throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'You are not authorized to access this job')
    }
}

const streamToString = async (stream: any): Promise<string> => {
    if (!stream) return ''
    if (typeof stream === 'string') return stream
    if (stream instanceof Buffer) return stream.toString('utf8')
    const chunks: Uint8Array[] = []
    for await (const chunk of stream as AsyncIterable<Uint8Array> | Iterable<Uint8Array>) {
        if (typeof chunk === 'string') {
            chunks.push(Buffer.from(chunk) as Uint8Array)
        } else {
            chunks.push(chunk)
        }
    }
    return Buffer.concat(chunks).toString('utf8')
}

const listRecentJobs = (organizationId: string, userId: string): VideoJobState[] => {
    const now = Date.now()
    const jobs: VideoJobState[] = []
    videoJobs.forEach((job) => {
        if (job.organizationId !== organizationId || job.userId !== userId) return
        const createdTime = new Date(job.createdAt).getTime()
        if (Number.isNaN(createdTime)) return
        if (now - createdTime > JOB_RETENTION_MS) return
        jobs.push(job)
    })

    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return jobs
}

const extractJobIdFromMetadata = (content: string) => {
    try {
        const data = JSON.parse(content)
        const jobId = data?.jobId
        if (!jobId) return undefined
        return typeof jobId === 'string' ? jobId : String(jobId)
    } catch (error) {
        return undefined
    }
}

const storeAssets = async (data: {
    provider: Provider
    model: string
    prompt: string
    organizationId: string
    userId: string
    userEmail?: string
    videoId: string
    remixOf?: string | null
    metadata: Record<string, any>
    videoBuffer: Buffer
    thumbnailBuffer?: Buffer | null
    originalImageBuffer?: Buffer | null
    croppedImageBuffer?: Buffer | null
    imageMimeType?: string
    jobId: string
}) => {
    const {
        provider,
        model,
        organizationId,
        userId,
        metadata,
        videoBuffer,
        videoId,
        thumbnailBuffer,
        originalImageBuffer,
        croppedImageBuffer,
        imageMimeType,
        remixOf,
        prompt,
        userEmail,
        jobId
    } = data
    const sessionId = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    const modelSlug = sanitizeModelName(model)
    const baseName = `${sessionId}_${provider}_${modelSlug}`

    const encodedOrg = encodeURIComponent(organizationId)
    const encodedUser = encodeURIComponent(userId)
    const encodedChatId = `${encodedOrg}%2F${encodedUser}`

    // Save original reference image if provided
    let originalImageUrl: string | undefined
    if (originalImageBuffer && originalImageBuffer.length > 0) {
        const ext = extensionFromMime(imageMimeType)
        const originalImageFilename = `${baseName}_reference_original.${ext}`
        const storedOriginal = await addSingleFileToStorage(
            imageMimeType || 'image/png',
            originalImageBuffer,
            originalImageFilename,
            STORAGE_FOLDER,
            organizationId,
            userId
        )
        const originalFileName = storedOriginal.replace('FILE-STORAGE::', '')
        originalImageUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${originalFileName}`
    }

    // Save cropped reference image if provided
    let croppedImageUrl: string | undefined
    if (croppedImageBuffer && croppedImageBuffer.length > 0) {
        const ext = extensionFromMime(imageMimeType)
        const croppedImageFilename = `${baseName}_reference_cropped.${ext}`
        const storedCropped = await addSingleFileToStorage(
            imageMimeType || 'image/png',
            croppedImageBuffer,
            croppedImageFilename,
            STORAGE_FOLDER,
            organizationId,
            userId
        )
        const croppedFileName = storedCropped.replace('FILE-STORAGE::', '')
        croppedImageUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${croppedFileName}`
    }

    const videoFilename = `${baseName}.mp4`
    const videoStorage = await addSingleFileToStorage('video/mp4', videoBuffer, videoFilename, STORAGE_FOLDER, organizationId, userId)
    const videoFileName = videoStorage.replace('FILE-STORAGE::', '')
    const videoUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${videoFileName}`

    let thumbnailUrl: string | undefined
    if (thumbnailBuffer && thumbnailBuffer.length > 0) {
        const thumbFilename = `${baseName}_thumbnail.webp`
        const storedThumbnail = await addSingleFileToStorage(
            'image/webp',
            thumbnailBuffer,
            thumbFilename,
            STORAGE_FOLDER,
            organizationId,
            userId
        )
        const thumbFileName = storedThumbnail.replace('FILE-STORAGE::', '')
        thumbnailUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${thumbFileName}`
    }

    const metadataPayload = {
        provider,
        model,
        prompt,
        videoId,
        jobId,
        remixOf: remixOf || null,
        createdAt: new Date().toISOString(),
        organizationId,
        userId,
        userEmail,
        assets: {
            video: videoUrl,
            thumbnail: thumbnailUrl,
            originalReferenceImage: originalImageUrl,
            croppedReferenceImage: croppedImageUrl
        },
        ...metadata
    }

    const metadataFilename = `${baseName}_metadata.json`
    const metadataBuffer = Buffer.from(JSON.stringify(metadataPayload, null, 2), 'utf8')
    const metadataStorage = await addSingleFileToStorage(
        'application/json',
        metadataBuffer,
        metadataFilename,
        STORAGE_FOLDER,
        organizationId,
        userId
    )
    const metadataFileName = metadataStorage.replace('FILE-STORAGE::', '')
    const metadataUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${metadataFileName}`

    return {
        sessionId,
        prompt,
        model,
        provider,
        videoUrl,
        thumbnailUrl,
        metadataUrl,
        fileName: videoFilename,
        videoId,
        remixOf: remixOf || null,
        createdAt: metadataPayload.createdAt,
        jobId
    } satisfies StoredVideoResult
}

const pollOpenAIVideo = async (
    videoId: string,
    apiKey: string,
    onStatusUpdate?: (status: OpenAIVideoStatus) => void
): Promise<OpenAIVideoStatus> => {
    let attempts = 0
    while (attempts < MAX_POLL_ATTEMPTS) {
        await delay(POLL_INTERVAL_MS)
        attempts += 1

        const statusResponse = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        })

        if (!statusResponse.ok) {
            const errorText = await statusResponse.text()
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `OpenAI video status error: ${errorText}`)
        }

        const payload = (await statusResponse.json()) as OpenAIVideoStatus
        onStatusUpdate?.(payload)
        if (payload.status === 'completed' || payload.status === 'failed') {
            return payload
        }
    }

    throw new InternalFlowiseError(StatusCodes.REQUEST_TIMEOUT, 'Timed out waiting for OpenAI video generation to complete')
}

const downloadOpenAIAsset = async (videoId: string, apiKey: string, variant: 'video' | 'thumbnail') => {
    const url =
        variant === 'video'
            ? `https://api.openai.com/v1/videos/${videoId}/content?variant=video`
            : `https://api.openai.com/v1/videos/${videoId}/content?variant=thumbnail`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`
        }
    })

    if (!response.ok) {
        const message = await response.text()
        throw new InternalFlowiseError(StatusCodes.BAD_GATEWAY, `Failed to download OpenAI ${variant}: ${message}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

const processOpenAIJob = async (jobId: string, request: VideoGenerationRequest & { prompt: string }, initialStatus: OpenAIVideoStatus) => {
    const apiKey = process.env.AAI_DEFAULT_OPENAI_API_KEY
    if (!apiKey) {
        updateJob(jobId, {
            status: 'failed',
            error: 'OpenAI API key not configured'
        })
        return
    }

    try {
        const initialMappedStatus = mapOpenAIStatus(initialStatus.status)
        updateJob(jobId, {
            status: initialMappedStatus === 'queued' ? 'in_progress' : initialMappedStatus,
            progress: typeof initialStatus.progress === 'number' ? initialStatus.progress : undefined
        })

        const finalResponse =
            initialMappedStatus === 'completed'
                ? initialStatus
                : await pollOpenAIVideo(jobId, apiKey, (payload) => {
                      updateJob(jobId, {
                          status: mapOpenAIStatus(payload.status),
                          progress: typeof payload.progress === 'number' ? payload.progress : undefined
                      })
                  })

        if (finalResponse.status !== 'completed') {
            // Extract detailed error message from OpenAI response
            let errorMessage = `OpenAI returned status ${finalResponse.status ?? 'unknown'}`
            if (finalResponse.error?.message) {
                errorMessage = finalResponse.error.message
            } else if (finalResponse.error) {
                errorMessage = JSON.stringify(finalResponse.error)
            }

            // Add helpful restrictions for moderation blocks
            if (finalResponse.error?.type === 'moderation_blocked') {
                errorMessage += '\n\nSora Content Restrictions:\n'
                errorMessage += '• Only content suitable for audiences under 18 is allowed\n'
                errorMessage += '• Copyrighted characters and copyrighted music will be rejected\n'
                errorMessage += '• Real people—including public figures—cannot be generated\n'
                errorMessage += '• Input images with faces of humans are currently rejected'
            }

            // Log the full response for debugging
            // eslint-disable-next-line no-console
            console.error('[OpenAI Video] Failed response:', JSON.stringify(finalResponse, null, 2))

            updateJob(jobId, {
                status: 'failed',
                error: errorMessage
            })
            return
        }

        const videoBuffer = await downloadOpenAIAsset(jobId, apiKey, 'video')

        let thumbnailBuffer: Buffer | null = null
        try {
            thumbnailBuffer = await downloadOpenAIAsset(jobId, apiKey, 'thumbnail')
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Failed to download OpenAI thumbnail', error)
        }

        // Prepare image buffers if reference image was provided
        let originalImageBuffer: Buffer | null = null
        let croppedImageBuffer: Buffer | null = null
        if (request.referenceImage) {
            // The base64 field contains the cropped image
            croppedImageBuffer = Buffer.from(normalizeBase64(request.referenceImage.base64), 'base64')

            // If originalBase64 is provided, save it too
            if (request.referenceImage.originalBase64) {
                originalImageBuffer = Buffer.from(normalizeBase64(request.referenceImage.originalBase64), 'base64')
            }
        }

        const result = await storeAssets({
            provider: 'openai',
            model: request.model,
            prompt: request.prompt,
            organizationId: request.organizationId,
            userId: request.userId,
            userEmail: request.userEmail,
            videoId: jobId,
            remixOf: request.remixVideoProviderId || null,
            metadata: {
                request: {
                    model: request.model,
                    size: request.size,
                    seconds: request.seconds,
                    remixVideoProviderId: request.remixVideoProviderId,
                    referenceImage: request.referenceImage
                        ? {
                              mimeType: request.referenceImage.mimeType,
                              hadOriginal: !!request.referenceImage.originalBase64
                          }
                        : null
                },
                response: finalResponse
            },
            videoBuffer,
            thumbnailBuffer,
            originalImageBuffer,
            croppedImageBuffer,
            imageMimeType: request.referenceImage?.mimeType,
            jobId
        })

        updateJob(jobId, {
            status: 'completed',
            progress: 100,
            result
        })
    } catch (error) {
        updateJob(jobId, {
            status: 'failed',
            error: getErrorMessage(error)
        })
    }
}

const startOpenAIJob = async (request: VideoGenerationRequest): Promise<VideoJobState> => {
    const apiKey = process.env.AAI_DEFAULT_OPENAI_API_KEY
    if (!apiKey) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'OpenAI API key not configured')
    }

    const prompt = request.remixPrompt || request.prompt
    if (!prompt) {
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Prompt is required for OpenAI video generation')
    }

    let creationResponse: OpenAIVideoStatus

    if (request.remixVideoProviderId) {
        const body: Record<string, unknown> = {
            prompt
        }

        if (request.size) body.size = request.size
        if (request.seconds) body.seconds = request.seconds

        const remixResponse = await fetch(`https://api.openai.com/v1/videos/${request.remixVideoProviderId}/remix`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (!remixResponse.ok) {
            const errorText = await remixResponse.text()
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `OpenAI remix error: ${errorText}`)
        }

        creationResponse = (await remixResponse.json()) as OpenAIVideoStatus
    } else {
        const formData = new FormData()
        formData.append('model', request.model)
        formData.append('prompt', prompt)

        if (request.size) {
            formData.append('size', request.size)
        }

        if (request.seconds) {
            formData.append('seconds', request.seconds.toString())
        }

        if (request.referenceImage?.base64) {
            const buffer = Buffer.from(normalizeBase64(request.referenceImage.base64), 'base64')
            const mimeType = request.referenceImage.mimeType || 'image/png'
            const extension = extensionFromMime(mimeType)
            const blob = new Blob([buffer as Uint8Array], { type: mimeType })
            formData.append('input_reference', blob, request.referenceImage.filename || `reference.${extension}`)
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/videos', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            body: formData
        })

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text()
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `OpenAI video generation error: ${errorText}`)
        }

        creationResponse = (await openaiResponse.json()) as OpenAIVideoStatus
    }

    const jobId: string | undefined = creationResponse?.id

    if (!jobId) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'OpenAI response missing video identifier')
    }

    const now = new Date().toISOString()
    const job: VideoJobState = {
        jobId,
        provider: 'openai',
        model: request.model,
        prompt,
        status: mapOpenAIStatus(creationResponse.status),
        progress: typeof creationResponse.progress === 'number' ? creationResponse.progress : undefined,
        createdAt: now,
        updatedAt: now,
        organizationId: request.organizationId,
        userId: request.userId,
        userEmail: request.userEmail,
        remixOf: request.remixVideoProviderId || null
    }

    registerJob(job)
    setImmediate(() => processOpenAIJob(jobId, { ...request, prompt }, creationResponse))

    return job
}

const extractProgressFromMetadata = (metadata: unknown): number | undefined => {
    if (!metadata || typeof metadata !== 'object') return undefined
    const record = metadata as Record<string, unknown>
    const progressKeys = ['progressPercent', 'progressPercentage', 'progress']
    for (const key of progressKeys) {
        const value = record[key]
        if (typeof value === 'number') {
            return value
        }
    }
    return undefined
}

const pollGoogleOperation = async (
    operation: GenerateVideosOperation,
    client: GoogleGenAI,
    onStatusUpdate?: (operation: GenerateVideosOperation) => void
) => {
    let current = operation
    let attempts = 0

    while (!current.done) {
        if (attempts >= MAX_POLL_ATTEMPTS) {
            throw new InternalFlowiseError(StatusCodes.REQUEST_TIMEOUT, 'Timed out waiting for Veo video generation to complete')
        }
        attempts += 1
        await delay(POLL_INTERVAL_MS)
        current = await client.operations.get({
            operation: current
        })
        onStatusUpdate?.(current)
    }

    return current
}

const processGoogleJob = async (jobId: string, request: VideoGenerationRequest, initialOperation: GenerateVideosOperation) => {
    const apiKey = process.env.AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
        updateJob(jobId, {
            status: 'failed',
            error: 'Google Generative AI API key not configured'
        })
        return
    }

    try {
        const client = new GoogleGenAI({ apiKey })

        updateJob(jobId, {
            status: initialOperation.done ? 'in_progress' : 'in_progress',
            progress: extractProgressFromMetadata(initialOperation.metadata)
        })

        const finalOperation = initialOperation.done
            ? initialOperation
            : await pollGoogleOperation(initialOperation, client, (current) => {
                  updateJob(jobId, {
                      status: current.done ? 'in_progress' : 'in_progress',
                      progress: extractProgressFromMetadata(current.metadata)
                  })
              })

        if (!finalOperation.done) {
            updateJob(jobId, {
                status: 'failed',
                error: 'Google video generation did not complete'
            })
            return
        }

        // eslint-disable-next-line no-console
        console.log('[Google Video] Final operation result:', JSON.stringify(finalOperation.result, null, 2))

        // Check for RAI (Responsible AI) content filtering
        const operationResult = finalOperation.result as any
        if (operationResult?.raiMediaFilteredCount && operationResult?.raiMediaFilteredCount > 0) {
            const reasons = operationResult.raiMediaFilteredReasons || []
            const errorMessage =
                reasons.length > 0
                    ? reasons.join('\n')
                    : "Content was filtered by Google's safety systems. Please modify your prompt or reference image."

            updateJob(jobId, {
                status: 'failed',
                error: `Google Veo Content Filter:\n${errorMessage}`
            })
            return
        }

        const generatedVideos = finalOperation.result?.generatedVideos
        if (!generatedVideos || generatedVideos.length === 0) {
            // Check if there's any error information in the result
            let errorMessage = 'Google response missing generated video'

            if (operationResult?.error) {
                errorMessage = typeof operationResult.error === 'string' ? operationResult.error : JSON.stringify(operationResult.error)
            } else if (operationResult?.message) {
                errorMessage = operationResult.message
            }

            updateJob(jobId, {
                status: 'failed',
                error: errorMessage
            })
            return
        }

        const video = generatedVideos[0].video
        if (!video || !video.uri) {
            updateJob(jobId, {
                status: 'failed',
                error: 'Google response missing video URI'
            })
            return
        }

        // Log the video object for debugging
        // eslint-disable-next-line no-console
        console.log('[Google Video] Video object:', JSON.stringify(video, null, 2))

        // Google's API returns a complete download URL in video.uri
        // It already includes the base URL and ?alt=media parameter
        const downloadUrl = video.uri

        // eslint-disable-next-line no-console
        console.log('[Google Video] Attempting to download from:', downloadUrl)

        const downloadResponse = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': apiKey
            }
        })

        // eslint-disable-next-line no-console
        console.log('[Google Video] Download response status:', downloadResponse.status)
        // eslint-disable-next-line no-console
        console.log(
            '[Google Video] Download response headers:',
            JSON.stringify(Object.fromEntries(downloadResponse.headers.entries()), null, 2)
        )

        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text()
            // eslint-disable-next-line no-console
            console.error('[Google Video] Download error response:', errorText)
            throw new InternalFlowiseError(
                StatusCodes.BAD_GATEWAY,
                `Failed to download Veo video from Google: ${downloadResponse.status} ${errorText}`
            )
        }

        const videoBuffer = Buffer.from(await downloadResponse.arrayBuffer())

        const aspectRatio = request.aspectRatio || deriveAspectRatio(request.size)
        const selectedResolution = request.size || '1280x720'

        // Use the video's URI as identifier for metadata
        const videoId = video.uri

        // Prepare image buffers if reference image was provided
        let originalImageBuffer: Buffer | null = null
        let croppedImageBuffer: Buffer | null = null
        if (request.referenceImage) {
            // The base64 field contains the cropped image
            croppedImageBuffer = Buffer.from(normalizeBase64(request.referenceImage.base64), 'base64')

            // If originalBase64 is provided, save it too
            if (request.referenceImage.originalBase64) {
                originalImageBuffer = Buffer.from(normalizeBase64(request.referenceImage.originalBase64), 'base64')
            }
        }

        const result = await storeAssets({
            provider: 'google',
            model: request.model,
            prompt: request.prompt,
            organizationId: request.organizationId,
            userId: request.userId,
            userEmail: request.userEmail,
            videoId,
            remixOf: request.remixVideoProviderId || null,
            metadata: {
                request: {
                    model: request.model,
                    prompt: request.prompt,
                    config: {
                        aspectRatio,
                        selectedResolution,
                        durationSeconds: request.seconds || 8,
                        negativePrompt: request.negativePrompt
                    },
                    referenceImage: request.referenceImage
                        ? {
                              mimeType: request.referenceImage.mimeType,
                              hadOriginal: !!request.referenceImage.originalBase64
                          }
                        : null
                },
                response: finalOperation
            },
            videoBuffer,
            thumbnailBuffer: null,
            originalImageBuffer,
            croppedImageBuffer,
            imageMimeType: request.referenceImage?.mimeType,
            jobId
        })

        updateJob(jobId, {
            status: 'completed',
            progress: 100,
            result
        })
    } catch (error) {
        updateJob(jobId, {
            status: 'failed',
            error: getErrorMessage(error)
        })
    }
}

const deriveAspectRatio = (size?: string, defaultAspect = '16:9') => {
    if (!size) return defaultAspect
    const [widthRaw, heightRaw] = size.split('x')
    const width = Number.parseInt(widthRaw, 10)
    const height = Number.parseInt(heightRaw, 10)
    if (!width || !height) return defaultAspect
    const gcd = (a: number, b: number): number => {
        return b === 0 ? a : gcd(b, a % b)
    }
    const divisor = gcd(width, height)
    const ratioW = width / divisor
    const ratioH = height / divisor
    return `${ratioW}:${ratioH}`
}

const startGoogleJob = async (request: VideoGenerationRequest): Promise<VideoJobState> => {
    const apiKey = process.env.AAI_DEFAULT_GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Google Generative AI API key not configured')
    }

    const client = new GoogleGenAI({ apiKey })

    const aspectRatio = request.aspectRatio || deriveAspectRatio(request.size)
    const params: GenerateVideosParameters = {
        model: request.model,
        prompt: request.prompt,
        config: {
            aspectRatio,
            durationSeconds: request.seconds || 8,
            negativePrompt: request.negativePrompt
        }
    }

    if (request.referenceImage?.base64) {
        params.image = {
            imageBytes: normalizeBase64(request.referenceImage.base64),
            mimeType: request.referenceImage.mimeType || 'image/png'
        }
    }

    const operation = await client.models.generateVideos(params)

    // Generate a URL-safe jobId instead of using the operation name which contains slashes
    const jobId = `google_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
    const operationName = operation.name || jobId

    const now = new Date().toISOString()
    const job: VideoJobState = {
        jobId,
        provider: 'google',
        model: request.model,
        prompt: request.prompt,
        status: operation.done ? 'in_progress' : 'queued',
        progress: extractProgressFromMetadata(operation.metadata),
        createdAt: now,
        updatedAt: now,
        organizationId: request.organizationId,
        userId: request.userId,
        userEmail: request.userEmail,
        remixOf: request.remixVideoProviderId || null,
        providerOperationId: operationName // Store Google's operation name for polling
    }

    registerJob(job)
    setImmediate(() => processGoogleJob(jobId, request, operation))

    return job
}

const generateVideo = async (request: VideoGenerationRequest): Promise<VideoJobState> => {
    try {
        if (OPENAI_MODELS.has(request.model)) {
            return await startOpenAIJob(request)
        }

        if (GOOGLE_MODELS.has(request.model)) {
            return await startGoogleJob(request)
        }

        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `Unsupported video model: ${request.model}`)
    } catch (error) {
        if (error instanceof InternalFlowiseError) {
            throw error
        }

        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: videoGeneratorService.generateVideo - ${getErrorMessage(error)}`
        )
    }
}

const getJobStatus = (jobId: string, organizationId: string, userId: string) => {
    const job = videoJobs.get(jobId)
    ensureJobAccess(job, organizationId, userId)
    return job!
}

const listArchivedVideos = async (params: {
    organizationId: string
    userId: string
    page: number
    limit: number
}): Promise<ArchiveResponse> => {
    try {
        const { organizationId, userId, page, limit } = params
        const storageType = getStorageType()
        const encodedOrg = encodeURIComponent(organizationId)
        const encodedUser = encodeURIComponent(userId)
        const encodedChatId = `${encodedOrg}%2F${encodedUser}`

        const sessions = new Map<
            string,
            {
                sessionId: string
                provider: Provider
                model: string
                timestamp: Date
                videoUrl?: string
                thumbnailUrl?: string
                metadataUrl?: string
                fileName?: string
                jobId?: string
            }
        >()

        const upsertSession = (sessionId: string, provider: Provider, model: string, timestamp: Date) => {
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, {
                    sessionId,
                    provider,
                    model,
                    timestamp
                })
            }
        }

        if (storageType === 's3') {
            const { s3Client, Bucket } = getS3Config()
            const prefix = `${STORAGE_FOLDER}/${organizationId}/${userId}/`

            const listCommand = new ListObjectsV2Command({
                Bucket,
                Prefix: prefix,
                MaxKeys: 1000
            })

            const response = await s3Client.send(listCommand)
            const allFiles = response.Contents || []

            for (const file of allFiles) {
                if (!file.Key) continue

                const fileName = file.Key.replace(prefix, '')
                const sessionMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)\.(mp4|webm)$/i)
                const metadataMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)_metadata\.json$/i)
                const thumbnailMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)_thumbnail\.(webp|png|jpg)$/i)

                if (sessionMatch) {
                    const sessionId = sessionMatch[1]
                    const provider = sessionMatch[2].toLowerCase() as Provider
                    const model = sessionMatch[3]
                    const timestamp = new Date(file.LastModified || 0)
                    upsertSession(sessionId, provider, model, timestamp)
                    const session = sessions.get(sessionId)!
                    session.fileName = fileName
                    session.videoUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                } else if (metadataMatch) {
                    const sessionId = metadataMatch[1]
                    const provider = metadataMatch[2].toLowerCase() as Provider
                    const model = metadataMatch[3]
                    const timestamp = new Date(file.LastModified || 0)
                    upsertSession(sessionId, provider, model, timestamp)
                    const session = sessions.get(sessionId)!
                    session.metadataUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                    if (!session.jobId) {
                        try {
                            const metadataResponse = await s3Client.send(
                                new GetObjectCommand({
                                    Bucket,
                                    Key: file.Key
                                })
                            )
                            if (metadataResponse.Body) {
                                const metadataContent = await streamToString(metadataResponse.Body)
                                const jobId = extractJobIdFromMetadata(metadataContent)
                                if (jobId) {
                                    session.jobId = jobId
                                }
                            }
                        } catch (error) {
                            // eslint-disable-next-line no-console
                            console.warn('Failed to read metadata for archived video job id', error)
                        }
                    }
                } else if (thumbnailMatch) {
                    const sessionId = thumbnailMatch[1]
                    const provider = thumbnailMatch[2].toLowerCase() as Provider
                    const model = thumbnailMatch[3]
                    const timestamp = new Date(file.LastModified || 0)
                    upsertSession(sessionId, provider, model, timestamp)
                    const session = sessions.get(sessionId)!
                    session.thumbnailUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                }
            }
        } else {
            const rootPath = getStoragePath()
            const folderPath = path.resolve(rootPath, STORAGE_FOLDER, organizationId, userId)

            if (folderPath.startsWith(rootPath) && fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath)

                for (const fileName of files) {
                    const filePath = path.join(folderPath, fileName)
                    const stats = fs.statSync(filePath)
                    const sessionMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)\.(mp4|webm)$/i)
                    const metadataMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)_metadata\.json$/i)
                    const thumbnailMatch = fileName.match(/^(\d+_[a-f0-9]+)_(openai|google)_(.+?)_thumbnail\.(webp|png|jpg)$/i)

                    if (sessionMatch) {
                        const sessionId = sessionMatch[1]
                        const provider = sessionMatch[2].toLowerCase() as Provider
                        const model = sessionMatch[3]
                        upsertSession(sessionId, provider, model, stats.mtime)
                        const session = sessions.get(sessionId)!
                        session.fileName = fileName
                        session.videoUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                    } else if (metadataMatch) {
                        const sessionId = metadataMatch[1]
                        const provider = metadataMatch[2].toLowerCase() as Provider
                        const model = metadataMatch[3]
                        upsertSession(sessionId, provider, model, stats.mtime)
                        const session = sessions.get(sessionId)!
                        session.metadataUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                        if (!session.jobId) {
                            try {
                                const metadataContent = fs.readFileSync(filePath, 'utf8')
                                const jobId = extractJobIdFromMetadata(metadataContent)
                                if (jobId) {
                                    session.jobId = jobId
                                }
                            } catch (error) {
                                // eslint-disable-next-line no-console
                                console.warn('Failed to parse local metadata for archived video job id', error)
                            }
                        }
                    } else if (thumbnailMatch) {
                        const sessionId = thumbnailMatch[1]
                        const provider = thumbnailMatch[2].toLowerCase() as Provider
                        const model = thumbnailMatch[3]
                        upsertSession(sessionId, provider, model, stats.mtime)
                        const session = sessions.get(sessionId)!
                        session.thumbnailUrl = `/api/v1/get-upload-file?chatflowId=${STORAGE_FOLDER}&chatId=${encodedChatId}&fileName=${fileName}`
                    }
                }
            }
        }

        const ordered = Array.from(sessions.values())
            .filter((entry) => entry.videoUrl)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        const total = ordered.length
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginated = ordered.slice(startIndex, endIndex)

        const videos: ArchivedVideoEntry[] = paginated.map((entry) => ({
            sessionId: entry.sessionId,
            videoUrl: entry.videoUrl!,
            thumbnailUrl: entry.thumbnailUrl,
            metadataUrl: entry.metadataUrl,
            timestamp: entry.timestamp.toISOString(),
            provider: entry.provider,
            model: entry.model,
            fileName: entry.fileName || `${entry.sessionId}_${entry.provider}_${entry.model}.mp4`,
            jobId: entry.jobId
        }))

        return {
            videos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: endIndex < total
            }
        }
    } catch (error) {
        if (error instanceof InternalFlowiseError) {
            throw error
        }

        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: videoGeneratorService.listArchivedVideos - ${getErrorMessage(error)}`
        )
    }
}

const enhancePromptWithAI = async (
    basicPrompt: string,
    dialog?: { text: string; tone: string; emotion: string }
): Promise<Record<string, any>> => {
    try {
        const apiKey = process.env.AAI_DEFAULT_OPENAI_API_KEY
        if (!apiKey) {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'OpenAI API key not configured')
        }

        const systemPrompt = `You are an expert cinematographer and video director. Given a basic video prompt, enhance it into a structured JSON format following professional video production best practices.

Return a JSON object with these fields (skip any that aren't relevant):
- title: A catchy title for the scene
- logline: An expanded description of the scene
- genre: Array of genres (e.g., ["action", "drama"])
- mood: Array of moods (e.g., ["intense", "dramatic"])
- environment: Object with setting, time_of_day, weather
- lighting: Object with key (main lighting) and special (special effects)
- look_profile: Object with lut_style, contrast, saturation, grain
- camera: Object with rig (equipment), lens (focal_length_mm, aperture_f)
- composition: Object with framing (shot type)
- camera_motion: Object with move_type (camera movement description)
- fx: Object with vfx (visual effects array) and sfx (sound effects array)
- audio: Object with dialog containing text, tone, emotion (suggest appropriate dialog if not provided)
- negative_prompts: Array of things to avoid

Return ONLY valid JSON, no markdown or explanations.`

        let userPrompt = basicPrompt
        if (dialog?.text) {
            userPrompt += `\n\nDialog/Voice-over: "${dialog.text}" (tone: ${dialog.tone}, emotion: ${dialog.emotion})`
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, `OpenAI API error: ${errorText}`)
        }

        const result = (await response.json()) as any
        const content = result.choices?.[0]?.message?.content

        if (!content) {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'No content in OpenAI response')
        }

        return JSON.parse(content)
    } catch (error) {
        if (error instanceof InternalFlowiseError) {
            throw error
        }

        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: videoGeneratorService.enhancePromptWithAI - ${getErrorMessage(error)}`
        )
    }
}

export default {
    generateVideo,
    getJobStatus,
    listRecentJobs,
    listArchivedVideos,
    enhancePromptWithAI
}
