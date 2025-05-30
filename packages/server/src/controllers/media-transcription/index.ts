import type { Request, Response, NextFunction } from 'express'
import { addSingleFileToStorage, getFileFromStorage, getStoragePath, getStorageType } from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import OpenAI from 'openai'

const ffmpeg = require('fluent-ffmpeg')

const getS3Config = () => {
    const s3Config: any = {
        credentials: {
            accessKeyId: process.env.S3_STORAGE_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_STORAGE_SECRET_ACCESS_KEY || ''
        },
        region: process.env.S3_STORAGE_REGION || 'us-east-1'
    }

    if (process.env.S3_ENDPOINT_URL) {
        s3Config.endpoint = process.env.S3_ENDPOINT_URL
        s3Config.forcePathStyle = true
    }

    const s3Client = new S3Client(s3Config)
    const Bucket = process.env.S3_STORAGE_BUCKET_NAME || 'default-bucket'

    return { s3Client, Bucket }
}

const generateTranscript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { base64Data, filename, organizationId, userId } = req.body
        if (!base64Data || !filename || !organizationId || !userId) {
            throw new InternalFlowiseError(
                StatusCodes.BAD_REQUEST,
                'Missing required fields: base64Data, filename, organizationId and userId'
            )
        }

        const buffer = Buffer.from(base64Data, 'base64')
        const timestamp = Date.now()
        const randomSuffix = crypto.randomBytes(8).toString('hex')
        const sessionId = `${timestamp}_${randomSuffix}`
        const mediaFilename = `${sessionId}_${filename}`

        const mediaStorageUrl = await addSingleFileToStorage(
            'application/octet-stream',
            buffer,
            mediaFilename,
            'media-transcripts',
            organizationId,
            userId
        )

        const fileNameOnly = mediaStorageUrl.replace('FILE-STORAGE::', '')
        const storageBuffer = await getFileFromStorage(fileNameOnly, 'media-transcripts', organizationId, userId)
        const rootPath = getStoragePath()
        const tempInput = path.join(rootPath, `${sessionId}_input`)
        const tempOutput = path.join(rootPath, `${sessionId}_compressed.mp3`)
        fs.writeFileSync(tempInput, storageBuffer)
        await new Promise((resolve, reject) => {
            ffmpeg(tempInput).audioBitrate('64k').format('mp3').on('end', resolve).on('error', reject).save(tempOutput)
        })

        const openai = new OpenAI({ apiKey: process.env.AAI_DEFAULT_OPENAI_API_KEY })
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempOutput),
            model: 'whisper-1'
        })

        fs.unlinkSync(tempInput)
        fs.unlinkSync(tempOutput)

        const transcriptText = transcription.text || ''
        const transcriptFilename = `${sessionId}_transcript.txt`
        const transcriptBuffer = Buffer.from(transcriptText, 'utf8')
        await addSingleFileToStorage('text/plain', transcriptBuffer, transcriptFilename, 'media-transcripts', organizationId, userId)

        const fileUrl = `/api/v1/get-upload-file?chatflowId=media-transcripts&chatId=${organizationId}%2F${userId}&fileName=${fileNameOnly}`

        return res.json({ transcript: transcriptText, sessionId, fileUrl })
    } catch (error) {
        next(error)
    }
}

const listArchivedTranscripts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user
        if (!user?.id || !user?.organizationId) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'User context required for archive access. Please ensure you are authenticated.'
            )
        }
        const organizationId = user.organizationId
        const userId = user.id
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const storageType = getStorageType()

        if (storageType === 's3') {
            const { s3Client, Bucket } = getS3Config()
            const prefix = `media-transcripts/${organizationId}/${userId}/`
            const listCommand = new ListObjectsV2Command({ Bucket, Prefix: prefix, MaxKeys: 1000 })
            const response = await s3Client.send(listCommand)
            const allFiles = response.Contents || []
            const sessions = new Map<string, any>()

            allFiles.forEach((file) => {
                if (!file.Key) return
                const fileName = file.Key.replace(prefix, '')
                const sessionMatch = fileName.match(/^(\d+_[a-z0-9]+)_/)
                if (sessionMatch) {
                    const sessionId = sessionMatch[1]
                    if (!sessions.has(sessionId)) {
                        sessions.set(sessionId, {
                            sessionId,
                            fileUrl: null,
                            transcriptUrl: null,
                            timestamp: new Date(file.LastModified || 0)
                        })
                    }
                    const session = sessions.get(sessionId)
                    if (fileName.endsWith('_transcript.txt')) {
                        session.transcriptUrl = `/api/v1/get-upload-file?chatflowId=media-transcripts&chatId=${organizationId}%2F${userId}&fileName=${fileName}`
                    } else {
                        session.fileUrl = `/api/v1/get-upload-file?chatflowId=media-transcripts&chatId=${organizationId}%2F${userId}&fileName=${fileName}`
                    }
                }
            })

            const sorted = Array.from(sessions.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginated = sorted.slice(startIndex, endIndex)
            return res.json({
                transcripts: paginated,
                pagination: {
                    page,
                    limit,
                    total: sorted.length,
                    totalPages: Math.ceil(sorted.length / limit),
                    hasMore: endIndex < sorted.length
                }
            })
        } else {
            const rootPath = getStoragePath()
            const folderPath = path.resolve(rootPath, 'media-transcripts', organizationId, userId)
            if (!folderPath.startsWith(rootPath)) {
                throw new InternalFlowiseError(StatusCodes.FORBIDDEN, 'Invalid folder path')
            }
            if (!fs.existsSync(folderPath)) {
                return res.json({
                    transcripts: [],
                    pagination: { page, limit, total: 0, totalPages: 0, hasMore: false }
                })
            }
            const allFiles = fs.readdirSync(folderPath)
            const sessions = new Map<string, any>()
            allFiles.forEach((fileName) => {
                const filePath = path.join(folderPath, fileName)
                const stats = fs.statSync(filePath)
                const sessionMatch = fileName.match(/^(\d+_[a-z0-9]+)_/)
                if (sessionMatch) {
                    const sessionId = sessionMatch[1]
                    if (!sessions.has(sessionId)) {
                        sessions.set(sessionId, {
                            sessionId,
                            fileUrl: null,
                            transcriptUrl: null,
                            timestamp: stats.mtime
                        })
                    }
                    const session = sessions.get(sessionId)
                    if (fileName.endsWith('_transcript.txt')) {
                        session.transcriptUrl = `/api/v1/get-upload-file?chatflowId=media-transcripts&chatId=${organizationId}%2F${userId}&fileName=${fileName}`
                    } else {
                        session.fileUrl = `/api/v1/get-upload-file?chatflowId=media-transcripts&chatId=${organizationId}%2F${userId}&fileName=${fileName}`
                    }
                }
            })
            const sorted = Array.from(sessions.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            const startIndex = (page - 1) * limit
            const endIndex = startIndex + limit
            const paginated = sorted.slice(startIndex, endIndex)
            return res.json({
                transcripts: paginated,
                pagination: {
                    page,
                    limit,
                    total: sorted.length,
                    totalPages: Math.ceil(sorted.length / limit),
                    hasMore: endIndex < sorted.length
                }
            })
        }
    } catch (error) {
        next(error)
    }
}

export default {
    generateTranscript,
    listArchivedTranscripts
}
