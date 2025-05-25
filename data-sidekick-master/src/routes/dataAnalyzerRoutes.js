import express from 'express'
import pkg from 'express-openid-connect'
const { requiresAuth } = pkg
import {
    createResearchView,
    getAllResearchViews,
    getResearchViewById,
    updateResearchView,
    deleteResearchView
} from '../controllers/researchViewController.js'

import { addDataSource, getDataSourcesByResearchView, refreshDataSource, deleteDataSource } from '../controllers/dataSourceController.js'

import {
    getDocumentsByResearchView,
    getDocumentsBySourceId,
    getDocumentById,
    updateDocumentCategories,
    addMetadataField,
    deleteDocument,
    processWithAnswerAI,
    testAnswerAIConnection
} from '../controllers/documentController.js'

import { searchDocuments, analyzeDocuments, getWebSearchResults } from '../controllers/analysisController.js'

import { createCategory, getCategoriesByResearchView, updateCategory, deleteCategory } from '../controllers/categoryController.js'

import {
    generateReport,
    getReportsByResearchView,
    getReportById,
    deleteReport,
    analyzePrompt,
    updateReport
} from '../controllers/analyzerReportController.js'

import { getUsageByResearchView } from '../controllers/usageController.js'

import { getUploadUrl, getResearchViewFiles, processFile, deleteFile } from '../controllers/researchFileController.js'

import { vectorizeDocuments } from '../controllers/vectorStoreController.js'

import { getDocumentEmbeddings } from '../controllers/documentController.js'

import {
    processTextContent,
    getTextProcessingStatus,
    testConnection as testTextProcessorConnection,
    getResearchViewAnalyses,
    processAndStoreDocument
} from '../controllers/textProcessorController.js'

const router = express.Router()

// All routes require authentication
router.use(requiresAuth())

// Data Source routes
router.post('/research-views/:viewId/sources', addDataSource)
router.get('/research-views/:viewId/sources', getDataSourcesByResearchView)
router.post('/data-sources/:id/refresh', refreshDataSource)
router.delete('/data-sources/:id', deleteDataSource)

// Documents routes
router.get('/research-views/:viewId/documents', getDocumentsByResearchView)
router.get('/data-sources/:sourceId/documents', getDocumentsBySourceId)
router.get('/documents/:id', getDocumentById)
router.put('/documents/:id/categories', updateDocumentCategories)
router.delete('/documents/:id', deleteDocument)

// Vector Store routes
router.post('/research-views/:viewId/vectorize', vectorizeDocuments)

// Document Metadata routes
router.post('/research-views/:viewId/metadata-fields', addMetadataField)

// Categories routes
router.post('/research-views/:viewId/categories', createCategory)
router.get('/research-views/:viewId/categories', getCategoriesByResearchView)
router.put('/categories/:id', updateCategory)
router.delete('/categories/:id', deleteCategory)

// Analysis routes
router.post('/research-views/:viewId/search', searchDocuments)
router.post('/research-views/:viewId/analyze', analyzeDocuments)
router.post('/research-views/:viewId/document-embeddings', getDocumentEmbeddings)
router.post('/search/web', getWebSearchResults)

// AnswerAI routes
router.post('/documents/process-with-answerai', processWithAnswerAI)
router.get('/answerai/test-connection', testAnswerAIConnection)

// Reports routes
router.post('/research-views/:viewId/reports/analyze-prompt', analyzePrompt)
router.post('/research-views/:viewId/reports', generateReport)
router.get('/research-views/:viewId/reports', getReportsByResearchView)
router.get('/reports/:id', getReportById)
router.put('/research-views/:viewId/reports/:id', updateReport)
router.delete('/reports/:id', deleteReport)

// Research Views routes
router.post('/research-views', createResearchView)
router.get('/research-views', getAllResearchViews)
router.get('/research-views/:id', getResearchViewById)
router.put('/research-views/:id', updateResearchView)
router.delete('/research-views/:id', deleteResearchView)

// Usage routes
router.get('/research-views/:viewId/usage', getUsageByResearchView)

// Research Files routes
router.post('/research-views/:viewId/upload-url', getUploadUrl)
router.get('/research-views/:viewId/files', getResearchViewFiles)
router.post('/files/:fileId/process', processFile)
router.delete('/files/:fileId', deleteFile)

// Text Processor routes
router.post('/text-processor/process', processTextContent)
router.get('/text-processor/status/:documentId', getTextProcessingStatus)
router.get('/text-processor/test-connection', testTextProcessorConnection)
router.get('/research-views/:viewId/text-analyses', getResearchViewAnalyses)
router.post('/text-processor/store-document', processAndStoreDocument)

export default router
