import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import contentDisposition from 'content-disposition'
import { streamStorageFile } from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'

const streamUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // console.log('req.query Image retriever', req.query)

        // Some clients may accidentally HTML-encode ampersands (e.g. &amp;chatId)
        // Normalize query by reparsing the raw query string with &amp; -> & fallback
        const ensureParams = () => {
            const params: Record<string, string | undefined> = {
                chatflowId: (req.query.chatflowId as string) || undefined,
                chatId: (req.query.chatId as string) || undefined,
                fileName: (req.query.fileName as string) || undefined
            }

            if (!params.chatflowId || !params.chatId || !params.fileName) {
                const rawQuery = (req.originalUrl || req.url || '').split('?')[1] || ''
                const normalizedRaw = rawQuery.replace(/&amp;/g, '&')
                const usp = new URLSearchParams(normalizedRaw)
                params.chatflowId = params.chatflowId || usp.get('chatflowId') || undefined
                params.chatId = params.chatId || usp.get('chatId') || undefined
                params.fileName = params.fileName || usp.get('fileName') || undefined
            }

            return params
        }
        const chatflowId = req.query.chatflowId as string
        const chatId = req.query.chatId as string
        const fileName = req.query.fileName as string
        const download = req.query.download === 'true' // Check if download parameter is set

        const appServer = getRunningExpressApp()

        // This can be public API, so we can only get orgId from the chatflow
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
            id: chatflowId
        })
        if (!chatflow) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`)
        }
        const chatflowWorkspaceId = chatflow.workspaceId
        const workspace = await appServer.AppDataSource.getRepository(Workspace).findOneBy({
            id: chatflowWorkspaceId
        })
        if (!workspace) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Workspace ${chatflowWorkspaceId} not found`)
        }
        const orgId = workspace.organizationId as string

        // Set Content-Disposition header - force attachment for download
        if (download) {
            res.setHeader('Content-Disposition', contentDisposition(fileName, { type: 'attachment' }))
        } else {
            res.setHeader('Content-Disposition', contentDisposition(fileName))
        }
        const fileStream = await streamStorageFile(chatflowId, chatId, fileName, orgId)

        if (!fileStream) throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: streamStorageFile`)

        if (fileStream instanceof fs.ReadStream && fileStream?.pipe) {
            fileStream.pipe(res)
        } else {
            res.send(fileStream)
        }
    } catch (error) {
        next(error)
    }
}

export default {
    streamUploadedFile
}
