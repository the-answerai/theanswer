import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import { ScreamingFrogAnalysisProject } from '../../../database/entities/ScreamingFrogAnalysisProject'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { ScreamingFrogAnalysisFile } from '../../../database/entities/ScreamingFrogAnalysisFile'
import { getS3CsvPath, getS3PromptPath, getS3ReportPath, uploadToS3, getTimestamp, getS3Client } from '../../../utils/screamingFrogS3'
import { v4 as uuidv4 } from 'uuid'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { ChatFlow } from '../../../database/entities/ChatFlow'
import { executeFlow } from '../../../utils/buildChatflow'
import { User } from '../../../database/entities/User'
import { removeSpecificFileFromStorage, removeFolderFromStorage } from 'flowise-components'
import { parse } from 'csv-parse/sync'

interface CreateProjectArgs {
    name: string
    isSharedWithOrg: boolean
    userId: string
    organizationId: string
    description?: string
}

interface ListProjectsArgs {
    userId: string
    organizationId: string
}

interface GetProjectByIdArgs {
    id: string
    userId: string
    organizationId: string
}

interface UpdateProjectArgs {
    id: string
    name?: string
    isSharedWithOrg?: boolean
    userId: string
    organizationId: string
    updatedBy: string
    description?: string
}

interface DeleteProjectArgs {
    id: string
    userId: string
    organizationId: string
}

interface UploadFileArgs {
    projectId: string
    file: Express.Multer.File
    userId: string
    organizationId: string
}

interface ListFilesForProjectArgs {
    projectId: string
    userId: string
    organizationId: string
}

interface GetFileByIdArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface DeleteFileArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface GetPromptArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface SavePromptArgs {
    fileId: string
    prompt: string
    userId: string
    organizationId: string
}

interface GetPromptHistoryArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface GetReportArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface SaveReportArgs {
    fileId: string
    reportSection: string
    userId: string
    organizationId: string
}

interface GetReportHistoryArgs {
    fileId: string
    userId: string
    organizationId: string
}

interface AnalyzeFileArgs {
    fileId: string
    prompt: string
    userId: string
    organizationId: string
}

type GeneratePromptArgs = { fileId: string; userId: string; organizationId: string }
type GenerateReportSectionArgs = { fileId: string; prompt: string; userId: string; organizationId: string }
type GetFinalReportArgs = { projectId: string; userId?: string; organizationId?: string }
type SaveFinalReportArgs = { projectId: string; finalReport: string; userId: string; organizationId: string }
type GetCsvDataArgs = { fileId: string; userId: string; organizationId: string }

async function createProject({ name, isSharedWithOrg, description, userId, organizationId }: CreateProjectArgs) {
    const appServer = getRunningExpressApp()
    const project = await appServer.AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(ScreamingFrogAnalysisProject)
        const project = repo.create({ name, isSharedWithOrg, description, userId, organizationId })
        await repo.save(project)
        const confirmed = await repo.findOneByOrFail({ id: project.id })
        return confirmed
    })
    return project
}

async function listProjects({ userId, organizationId }: ListProjectsArgs) {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    // List all projects owned by user or shared with org
    const projects = await repo.find({
        where: [{ userId }, { organizationId, isSharedWithOrg: true }],
        order: { createdAt: 'DESC' }
    })
    return projects
}

async function getProjectById({ id, userId, organizationId }: GetProjectByIdArgs) {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await repo.findOne({ where: { id } })
    if (!project) return null
    // Only allow if owner or shared with org
    if (project.userId !== userId && (!project.isSharedWithOrg || project.organizationId !== organizationId)) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
    }
    return project
}

async function updateProject({ id, name, isSharedWithOrg, description, userId, updatedBy }: UpdateProjectArgs) {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await repo.findOne({ where: { id } })
    if (!project) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    if (project.userId !== userId) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Only the owner can update the project')
    }
    if (name !== undefined) project.name = name
    if (isSharedWithOrg !== undefined) project.isSharedWithOrg = isSharedWithOrg
    if (description !== undefined) project.description = description
    project.updatedBy = updatedBy
    await repo.save(project)
    return project
}

async function deleteProject({ id, userId, organizationId }: DeleteProjectArgs) {
    const appServer = getRunningExpressApp()
    const repo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const project = await repo.findOne({ where: { id } })
    if (!project) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    if (project.userId !== userId) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Only the owner can delete the project')
    }
    // Delete all files for this project from DB and S3
    const files = await fileRepo.find({ where: { projectId: id } })
    for (const file of files) {
        // Remove raw CSV
        if (file.s3RawUrl) {
            const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
            const s3Key = file.s3RawUrl.replace(`s3://${bucket}/`, '')
            await removeSpecificFileFromStorage(s3Key)
        }
        // Remove all prompt versions
        if (file.s3PromptHistory) {
            for (const promptUrl of file.s3PromptHistory) {
                const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
                const s3Key = promptUrl.replace(`s3://${bucket}/`, '')
                await removeSpecificFileFromStorage(s3Key)
            }
        }
        // Remove all report versions
        if (file.s3ReportHistory) {
            for (const reportUrl of file.s3ReportHistory) {
                const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
                const s3Key = reportUrl.replace(`s3://${bucket}/`, '')
                await removeSpecificFileFromStorage(s3Key)
            }
        }
    }
    // Remove the project folder (should be empty, but cleans up any stragglers)
    await removeFolderFromStorage('screaming-frog-analysis', organizationId, id)
    await fileRepo.delete({ projectId: id })
    await repo.delete(id)
    return true
}

async function uploadFile({ projectId, file, userId, organizationId }: UploadFileArgs) {
    // Check project access
    const appServer = getRunningExpressApp()
    const projectRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await projectRepo.findOne({ where: { id: projectId } })

    if (!project) {
        throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    }
    if (project.userId !== userId && (!project.isSharedWithOrg || project.organizationId !== organizationId)) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
    }
    const fileId = uuidv4()
    const s3Key = getS3CsvPath(organizationId, projectId, fileId, file.originalname)
    await uploadToS3(file.buffer, s3Key, file.mimetype)
    const s3RawUrl = `s3://${process.env.S3_STORAGE_BUCKET_NAME}/${s3Key}`
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const fileRecord = fileRepo.create({
        id: fileId,
        projectId,
        filename: file.originalname,
        s3RawUrl,
        promptUrl: '',
        reportSectionUrl: '',
        s3PromptHistory: [],
        s3ReportHistory: []
    })
    await fileRepo.save(fileRecord)
    return fileRecord
}

async function listFilesForProject({ projectId, userId, organizationId }: ListFilesForProjectArgs) {
    // Check project access
    const appServer = getRunningExpressApp()
    const projectRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await projectRepo.findOne({ where: { id: projectId } })
    if (!project) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    if (project.userId !== userId && (!project.isSharedWithOrg || project.organizationId !== organizationId)) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
    }
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    return await fileRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } })
}

async function getFileById({ fileId, userId, organizationId }: GetFileByIdArgs) {
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const file = await fileRepo.findOne({ where: { id: fileId } })
    if (!file) return null
    // Check project access
    const projectRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await projectRepo.findOne({ where: { id: file.projectId } })
    if (!project) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    if (project.userId !== userId && (!project.isSharedWithOrg || project.organizationId !== organizationId)) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
    }
    return file
}

async function deleteFile({ fileId, userId, organizationId }: DeleteFileArgs) {
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const file = await fileRepo.findOne({ where: { id: fileId } })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    // Check project access
    const projectRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisProject)
    const project = await projectRepo.findOne({ where: { id: file.projectId } })
    if (!project) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'Project not found')
    if (project.userId !== userId && (!project.isSharedWithOrg || project.organizationId !== organizationId)) {
        throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
    }
    // Remove raw CSV
    if (file.s3RawUrl) {
        const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
        const s3Key = file.s3RawUrl.replace(`s3://${bucket}/`, '')
        await removeSpecificFileFromStorage(s3Key)
    }
    // Remove all prompt versions
    if (file.s3PromptHistory) {
        for (const promptUrl of file.s3PromptHistory) {
            const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
            const s3Key = promptUrl.replace(`s3://${bucket}/`, '')
            await removeSpecificFileFromStorage(s3Key)
        }
    }
    // Remove all report versions
    if (file.s3ReportHistory) {
        for (const reportUrl of file.s3ReportHistory) {
            const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
            const s3Key = reportUrl.replace(`s3://${bucket}/`, '')
            await removeSpecificFileFromStorage(s3Key)
        }
    }
    await fileRepo.delete(fileId)
    return true
}

async function getPrompt({ fileId, userId, organizationId }: GetPromptArgs) {
    const file = await getFileById({ fileId, userId, organizationId })
    const s3Url = file?.promptUrl
    if (!s3Url) return ''
    // Parse s3://bucket/key
    const match = s3Url.match(/^s3:\/\/([^/]+)\/(.+)$/)
    if (!match) return ''
    const bucket = match[1]
    const key = match[2]
    const s3 = getS3Client()
    try {
        const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        const content = await obj.Body?.transformToString('utf-8')
        return content || ''
    } catch (err) {
        return ''
    }
}

async function savePrompt({ fileId, prompt, userId, organizationId }: SavePromptArgs) {
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const file = await getFileById({ fileId, userId, organizationId })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    // Save version to S3
    const timestamp = getTimestamp()
    const s3Key = getS3PromptPath(organizationId, file.projectId, fileId, timestamp)
    await uploadToS3(Buffer.from(prompt, 'utf8'), s3Key, 'text/markdown')
    const s3Url = `s3://${process.env.S3_STORAGE_BUCKET_NAME}/${s3Key}`
    // Update DB
    file.promptUrl = s3Url
    file.s3PromptHistory = [...(file.s3PromptHistory || []), s3Url]
    await fileRepo.save(file)
    return true
}

async function getPromptHistory({ fileId, userId, organizationId }: GetPromptHistoryArgs) {
    const file = await getFileById({ fileId, userId, organizationId })
    return file?.s3PromptHistory || []
}

async function getReport({ fileId, userId, organizationId }: GetReportArgs) {
    const file = await getFileById({ fileId, userId, organizationId })
    const s3Url = file?.reportSectionUrl
    if (!s3Url) return ''
    // Parse s3://bucket/key
    const match = s3Url.match(/^s3:\/\/([^/]+)\/(.+)$/)
    if (!match) return ''
    const bucket = match[1]
    const key = match[2]
    const s3 = getS3Client()
    try {
        const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        const content = await obj.Body?.transformToString('utf-8')
        return content || ''
    } catch (err) {
        return ''
    }
}

async function saveReport({ fileId, reportSection, userId, organizationId }: SaveReportArgs) {
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const file = await getFileById({ fileId, userId, organizationId })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    // Save version to S3
    const timestamp = getTimestamp()
    const s3Key = getS3ReportPath(organizationId, file.projectId, fileId, timestamp)
    await uploadToS3(Buffer.from(reportSection, 'utf8'), s3Key, 'text/markdown')
    const s3Url = `s3://${process.env.S3_STORAGE_BUCKET_NAME}/${s3Key}`
    // Update DB
    file.reportSectionUrl = s3Url
    file.s3ReportHistory = [...(file.s3ReportHistory || []), s3Url]
    await fileRepo.save(file)
    return true
}

async function getReportHistory({ fileId, userId, organizationId }: GetReportHistoryArgs) {
    const file = await getFileById({ fileId, userId, organizationId })
    return file?.s3ReportHistory || []
}

async function analyzeFile({ fileId, prompt, userId, organizationId }: AnalyzeFileArgs) {
    const chatflowChatId = 'd9fb660f-c0e1-4b97-b66f-4a5635026a55'

    const appServer = getRunningExpressApp()

    const user = await appServer.AppDataSource.getRepository(User).findOneBy({
        id: userId
    })
    if (!user) {
        throw new Error(`User ${userId} not found`)
    }

    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
        id: chatflowChatId
    })
    if (!chatflow) {
        throw new Error(`Chatflow ${chatflowChatId} not found`)
    }

    // Use getCsvData to get columns and rowData
    const csvData = await getCsvData({ fileId, userId, organizationId })
    const columns = csvData.columns || []
    const rowData = csvData.rows || []

    const file = await getFileById({ fileId, userId, organizationId })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    const filename = file.filename

    // Build the question using the provided template
    const question = `Here is a preview of the uploaded CSV:\n\nFilename: ${filename}\n\nColumns:\n${columns.join(
        ', '
    )}\n\nSample CSV content:\n\u0060\u0060\u0060csv\n${rowData.map((row: string[]) => row.join(',')).join('\n')}\n\u0060\u0060\u0060\n`

    const response = await executeFlow({
        user: user,
        incomingInput: {
            user,
            question,
            overrideConfig: {
                closingPrompt: prompt
            }
        },
        chatflow,
        chatId: uuidv4(),
        baseURL: '',
        isInternal: false,
        appDataSource: appServer.AppDataSource,
        componentNodes: appServer.nodesPool.componentNodes,
        sseStreamer: appServer.sseStreamer,
        telemetry: appServer.telemetry,
        cachePool: appServer.cachePool
    })

    return response?.text
}

export const generatePrompt = async ({ fileId, userId, organizationId }: GeneratePromptArgs) => {
    const chatflowChatId = 'e9c27f6e-9ac6-4aac-bfc1-6cd4a6010851'

    const appServer = getRunningExpressApp()

    const user = await appServer.AppDataSource.getRepository(User).findOneBy({
        id: userId
    })
    if (!user) {
        throw new Error(`User ${userId} not found`)
    }

    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
        id: chatflowChatId
    })
    if (!chatflow) {
        throw new Error(`Chatflow ${chatflowChatId} not found`)
    }

    // Use getCsvData to get columns and rowData
    const csvData = await getCsvData({ fileId, userId, organizationId })
    const columns = csvData.columns || []
    const rowData = csvData.rows || []

    const file = await getFileById({ fileId, userId, organizationId })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    const filename = file.filename

    // Build the question using the provided template
    const question = `Here is a preview of the uploaded CSV:\n\nFilename: ${filename}\n\nColumns:\n${columns.join(
        ', '
    )}\n\nSample CSV content:\n\u0060\u0060\u0060csv\n${rowData.map((row: string[]) => row.join(',')).join('\n')}\n\u0060\u0060\u0060\n`

    const response = await executeFlow({
        user: user,
        incomingInput: {
            user,
            question,
            overrideConfig: {
                filename,
                columns: columns.join(','),
                rowData: rowData.map((row: string[]) => row.join(',')).join('\n')
            }
        },
        chatflow,
        chatId: uuidv4(),
        baseURL: '',
        isInternal: false,
        appDataSource: appServer.AppDataSource,
        componentNodes: appServer.nodesPool.componentNodes,
        sseStreamer: appServer.sseStreamer,
        telemetry: appServer.telemetry,
        cachePool: appServer.cachePool
    })

    return response?.text
}

export const generateReportSection = async ({ fileId, prompt, userId, organizationId }: GenerateReportSectionArgs) => {
    // Generate a report section using OpenAI and the CSV file
    return await analyzeFile({ fileId, prompt, userId, organizationId })
}

export const getFinalReport = async ({ projectId }: GetFinalReportArgs) => {
    // Aggregate all report sections for the project
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const files = await fileRepo.find({ where: { projectId }, order: { createdAt: 'ASC' } })
    if (!files.length) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'No files found for project')
    const sections = files.map((f, idx) => `## Section ${idx + 1}: ${f.filename}\n${f.reportSectionUrl || ''}`)
    return `# Final Report\n\n${sections.join('\n\n')}`
}

export const saveFinalReport = async ({ projectId, finalReport, organizationId }: SaveFinalReportArgs) => {
    // Save the final report to S3 (versioned)
    const timestamp = getTimestamp()
    const s3Key = `screaming-frog-analysis/${organizationId}/${projectId}/final-reports/final-report-${timestamp}.md`
    await uploadToS3(Buffer.from(finalReport, 'utf8'), s3Key, 'text/markdown')
    return true
}

export const getCsvData = async ({ fileId }: GetCsvDataArgs) => {
    // Fetch CSV from S3 and parse
    const appServer = getRunningExpressApp()
    const fileRepo = appServer.AppDataSource.getRepository(ScreamingFrogAnalysisFile)
    const file = await fileRepo.findOne({ where: { id: fileId } })
    if (!file) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'File not found')
    const s3 = getS3Client()
    const bucket = process.env.S3_STORAGE_BUCKET_NAME ?? ''
    const csvKey = file.s3RawUrl.replace(`s3://${bucket}/`, '')
    const csvObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: csvKey }))
    const csvBuffer = await csvObj.Body?.transformToString('utf-8')
    if (!csvBuffer) throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to download CSV')
    // Remove BOM if present
    const csvString = csvBuffer.replace(/^\uFEFF/, '')
    const records = parse(csvString, { columns: true })
    if (!records.length) return { columns: [], rows: [] }
    const columns = Object.keys(records[0])
    const rows = records.map((row: Record<string, any>) => columns.map((col) => String(row[col] ?? '')))
    return { columns, rows }
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
