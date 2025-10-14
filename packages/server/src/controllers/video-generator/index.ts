import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import videoGeneratorService from '../../services/video-generator'

const extractReferenceAsset = (input: any) => {
    if (!input) return null
    if (typeof input !== 'object') return null
    if (!input.base64 || typeof input.base64 !== 'string') return null
    return {
        base64: input.base64,
        mimeType: typeof input.mimeType === 'string' ? input.mimeType : undefined,
        filename: typeof input.filename === 'string' ? input.filename : undefined
    }
}

const resolveUserContext = (req: Request) => {
    let user = req.user || {
        id: (req.body?.userId as string) || undefined,
        organizationId: (req.body?.organizationId as string) || undefined,
        email: (req.body?.userEmail as string) || undefined
    }

    if (!user?.id && req.headers['x-request-from'] === 'internal') {
        user = {
            id: 'tool-system',
            organizationId: 'system-org',
            email: 'tool@system.local'
        }
    }

    return user
}

const generateVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            prompt,
            model,
            size,
            seconds,
            aspectRatio,
            negativePrompt,
            remixVideoProviderId,
            remixVideoId,
            remixPrompt,
            referenceImage
        } = req.body

        if (!model) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Missing required field: model')
        }

        if (!prompt && !remixPrompt) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Missing required field: prompt')
        }

        const user = resolveUserContext(req)

        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for video generation. Please ensure organizationId and userId are provided.'
            )
        }

        const result = await videoGeneratorService.generateVideo({
            prompt: prompt || '',
            model,
            size,
            seconds,
            aspectRatio,
            negativePrompt,
            remixVideoProviderId: remixVideoProviderId || remixVideoId || undefined,
            remixPrompt,
            referenceImage: extractReferenceAsset(referenceImage),
            organizationId: user.organizationId,
            userId: user.id,
            userEmail: user.email
        })

        return res.json(result)
    } catch (error) {
        next(error)
    }
}

const getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = resolveUserContext(req)

        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for video job status. Please ensure you are authenticated.'
            )
        }

        const { jobId } = req.params
        if (!jobId) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Job ID is required')
        }

        const response = videoGeneratorService.getJobStatus(jobId, user.organizationId, user.id)
        return res.json(response)
    } catch (error) {
        next(error)
    }
}

const listRecentJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = resolveUserContext(req)

        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for recent video jobs. Please ensure you are authenticated.'
            )
        }

        const response = videoGeneratorService.listRecentJobs(user.organizationId, user.id)
        return res.json(response)
    } catch (error) {
        next(error)
    }
}

const listArchivedVideos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = resolveUserContext(req)

        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for video archive access. Please ensure you are authenticated.'
            )
        }

        const page = Number.parseInt(req.query.page as string, 10) || 1
        const limit = Number.parseInt(req.query.limit as string, 10) || 20

        const response = await videoGeneratorService.listArchivedVideos({
            organizationId: user.organizationId,
            userId: user.id,
            page,
            limit
        })

        return res.json(response)
    } catch (error) {
        next(error)
    }
}

const enhancePrompt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prompt, dialog } = req.body

        if (!prompt || typeof prompt !== 'string') {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Missing required field: prompt')
        }

        const user = resolveUserContext(req)

        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for prompt enhancement. Please ensure you are authenticated.'
            )
        }

        const result = await videoGeneratorService.enhancePromptWithAI(prompt, dialog, user.id, user.organizationId)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

export default {
    generateVideo,
    getJobStatus,
    listRecentJobs,
    listArchivedVideos,
    enhancePrompt
}
