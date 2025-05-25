/**
 * Document Routes
 *
 * API routes for document processing using Unstructured
 */

import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { processDocument, extractTextFromDocument, checkUnstructuredStatus } from '../controllers/documentController.js'

const router = express.Router()

// Configure multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
    }
})

// Create multer upload instance
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
    fileFilter: (req, file, cb) => {
        // Accept common document types
        const allowedTypes = [
            // Office documents
            '.doc',
            '.docx',
            '.ppt',
            '.pptx',
            '.xls',
            '.xlsx',
            // PDFs
            '.pdf',
            // Text files
            '.txt',
            '.md',
            '.rtf',
            // Images
            '.jpg',
            '.jpeg',
            '.png',
            // HTML and XML
            '.html',
            '.htm',
            '.xml',
            // Email
            '.eml',
            '.msg'
        ]

        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedTypes.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('Unsupported file type'))
        }
    }
})

// Route to check if Unstructured API is available
router.get('/unstructured/status', checkUnstructuredStatus)

// Route to process a document and get structured elements
router.post('/process', upload.single('file'), processDocument)

// Route to extract text from a document
router.post('/extract-text', upload.single('file'), extractTextFromDocument)

export default router
