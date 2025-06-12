import { Request, Response, NextFunction } from 'express'
import screamingFrogAnalysisService from '../../../services/apps/screaming-frog-analysis'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

// Add a helper to check required user fields
function requireUser(req: Request) {
    if (!req?.user || !req?.user?.id || !req?.user?.organizationId) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'User authentication required')
    }
}

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { name, isSharedWithOrg, description } = req.body

        if (!name) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Project name is required')
        }
        if (description && description.length > 256) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Description must be 256 characters or less')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const project = await screamingFrogAnalysisService.createProject({ name, isSharedWithOrg, description, userId, organizationId })
        res.status(201).json(project)
    } catch (err) {
        next(err)
    }
}

export const listProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const projects = await screamingFrogAnalysisService.listProjects({ userId, organizationId })
        res.json({ projects })
    } catch (err) {
        next(err)
    }
}

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { id } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const project = await screamingFrogAnalysisService.getProjectById({ id, userId, organizationId })
        if (!project) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
        }
        res.json(project)
    } catch (err) {
        next(err)
    }
}

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { id } = req.params
        const { name, isSharedWithOrg, description } = req.body
        if (description && description.length > 256) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Description must be 256 characters or less')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const updatedBy = req.user!.id
        const project = await screamingFrogAnalysisService.updateProject({
            id,
            name,
            isSharedWithOrg,
            description,
            userId,
            organizationId,
            updatedBy
        })
        res.json(project)
    } catch (err) {
        next(err)
    }
}

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { id } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        await screamingFrogAnalysisService.deleteProject({ id, userId, organizationId })
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { projectId } = req.params
        const file = req.file
        if (!file) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'File is required')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const uploadedFile = await screamingFrogAnalysisService.uploadFile({ projectId, file, userId, organizationId })
        res.status(201).json(uploadedFile)
    } catch (err) {
        next(err)
    }
}

export const listFilesForProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { projectId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const files = await screamingFrogAnalysisService.listFilesForProject({ projectId, userId, organizationId })
        res.json(files)
    } catch (err) {
        next(err)
    }
}

export const getFileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const file = await screamingFrogAnalysisService.getFileById({ fileId, userId, organizationId })
        if (!file) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
        }
        res.json(file)
    } catch (err) {
        next(err)
    }
}

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        await screamingFrogAnalysisService.deleteFile({ fileId, userId, organizationId })
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

export const getPrompt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const prompt = await screamingFrogAnalysisService.getPrompt({ fileId, userId, organizationId })
        res.json({ prompt })
    } catch (err) {
        next(err)
    }
}

export const savePrompt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const { prompt } = req.body
        if (!prompt) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Prompt is required')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        await screamingFrogAnalysisService.savePrompt({ fileId, prompt, userId, organizationId })
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

export const getPromptHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const history = await screamingFrogAnalysisService.getPromptHistory({ fileId, userId, organizationId })
        res.json({ history })
    } catch (err) {
        next(err)
    }
}

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const reportSectionUrl = await screamingFrogAnalysisService.getReport({ fileId, userId, organizationId })
        res.json({ reportSectionUrl })
    } catch (err) {
        next(err)
    }
}

export const saveReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const { reportSection } = req.body
        if (!reportSection) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Report section is required')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        await screamingFrogAnalysisService.saveReport({ fileId, reportSection, userId, organizationId })
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

export const getReportHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const history = await screamingFrogAnalysisService.getReportHistory({ fileId, userId, organizationId })
        res.json({ history })
    } catch (err) {
        next(err)
    }
}

export const analyzeFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const { prompt } = req.body
        if (!prompt) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Prompt is required')
        }
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const reportSection = await screamingFrogAnalysisService.analyzeFile({ fileId, prompt, userId, organizationId })
        res.json({ reportSection })
    } catch (err) {
        next(err)
    }
}

export const generatePrompt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const prompt = await screamingFrogAnalysisService.generatePrompt({ fileId, userId, organizationId })
        res.json({ prompt })
    } catch (err) {
        next(err)
    }
}

export const generateReportSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const { prompt } = req.body
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const reportSection = await screamingFrogAnalysisService.generateReportSection({ fileId, prompt, userId, organizationId })
        res.json({ reportSection })
    } catch (err) {
        next(err)
    }
}

export const getFinalReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { projectId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        const finalReport = await screamingFrogAnalysisService.getFinalReport({ projectId, userId, organizationId })
        res.json({ finalReport })
    } catch (err) {
        next(err)
    }
}

export const saveFinalReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { projectId } = req.params
        const { finalReport } = req.body
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        await screamingFrogAnalysisService.saveFinalReport({ projectId, finalReport, userId, organizationId })
        res.json({ success: true })
    } catch (err) {
        next(err)
    }
}

export const getCsvData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        requireUser(req)
        const { fileId } = req.params
        const userId = req.user!.id
        const organizationId = req.user!.organizationId
        // Get columns, rows and file entity
        const { columns, rows } = await screamingFrogAnalysisService.getCsvData({ fileId, userId, organizationId })
        const file = await screamingFrogAnalysisService.getFileById({ fileId, userId, organizationId })
        const prompt = await screamingFrogAnalysisService.getPrompt({ fileId, userId, organizationId })
        res.json({
            columns,
            rows,
            fileName: file?.filename || '',
            prompt,
            reportSectionUrl: file?.reportSectionUrl || ''
        })
    } catch (err) {
        next(err)
    }
}

export default {
    createProject,
    listProjects,
    getProjectById,
    updateProject,
    deleteProject,
    uploadFile,
    listFilesForProject,
    getFileById,
    deleteFile,
    getPrompt,
    savePrompt,
    getPromptHistory,
    getReport,
    saveReport,
    getReportHistory,
    analyzeFile,
    generatePrompt,
    generateReportSection,
    getFinalReport,
    saveFinalReport,
    getCsvData
}
