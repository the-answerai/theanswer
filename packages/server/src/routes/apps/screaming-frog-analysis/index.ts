import express from 'express'
import screamingFrogAnalysisController from '../../../controllers/apps/screaming-frog-analysis'
import enforceAbility from '../../../middlewares/authentication/enforceAbility'
import multer from 'multer'

const upload = multer()

const router = express.Router()

// Project routes
router.post('/projects', screamingFrogAnalysisController.createProject)
router.get('/projects', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.listProjects)
router.get('/projects/:id', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.getProjectById)
router.put('/projects/:id', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.updateProject)
router.delete('/projects/:id', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.deleteProject)

// File routes
router.post(
    '/projects/:projectId/files',
    enforceAbility('ScreamingFrogAnalysisProject'),
    upload.single('file'),
    screamingFrogAnalysisController.uploadFile
)
router.get(
    '/projects/:projectId/files',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.listFilesForProject
)
router.get('/files/:fileId', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.getFileById)
router.delete('/files/:fileId', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.deleteFile)

// Prompt routes
router.get('/files/:fileId/prompt', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.getPrompt)
router.post('/files/:fileId/prompt', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.savePrompt)
router.get(
    '/files/:fileId/prompt/history',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.getPromptHistory
)

// Report routes
router.get('/files/:fileId/report', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.getReport)
router.post('/files/:fileId/report', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.saveReport)
router.get(
    '/files/:fileId/report/history',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.getReportHistory
)

// Analysis endpoint
router.post('/files/:fileId/analyze', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.analyzeFile)

// Generate recommended prompt for a file
router.post(
    '/files/:fileId/generate-prompt',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.generatePrompt
)

// Generate report section for a file
router.post(
    '/files/:fileId/generate-report',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.generateReportSection
)

// Get final aggregated report for a project
router.get(
    '/projects/:projectId/final-report',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.getFinalReport
)

// Save final aggregated report for a project
router.post(
    '/projects/:projectId/final-report',
    enforceAbility('ScreamingFrogAnalysisProject'),
    screamingFrogAnalysisController.saveFinalReport
)

// Get parsed CSV data for a file
router.get('/files/:fileId/csv', enforceAbility('ScreamingFrogAnalysisProject'), screamingFrogAnalysisController.getCsvData)

export default router
