import { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import contentDisposition from 'content-disposition'
import { streamStorageFile } from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

const DALLE_FOLDER = 'dalle-images'

const streamDalleImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.query.fileName) {
            return res.status(500).send(`Invalid file path`)
        }
        const fileName = req.query.fileName as string
        res.setHeader('Content-Disposition', contentDisposition(fileName))
        const fileStream = await streamStorageFile(DALLE_FOLDER, '', fileName)

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
    streamDalleImage
}
