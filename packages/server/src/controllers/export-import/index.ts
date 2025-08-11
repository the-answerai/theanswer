import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import exportImportService from '../../services/export-import'

const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const apiResponse = await exportImportService.exportData(exportImportService.convertExportInput(req.body), req.user)
        return res.json(apiResponse)
    } catch (error) {
        console.error('❌ Export error:', error)
        next(error)
    }
}

const importData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' })
        const importData = req.body
        await exportImportService.importData(req.user, importData)
        return res.json({ message: 'success' })
    } catch (error) {
        console.error('❌ Import error:', error)
        next(error)
    }
}

export default {
    exportData,
    importData
}
