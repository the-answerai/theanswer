import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../../errors/internalFlowiseError'
import dataEngineService from '../../../services/data-engine'
import checkOwnership from '../../../utils/checkOwnership'

const createDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDocumentsController.createDocument - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.createDocument - user not authenticated'
            )
        }

        const document = await dataEngineService.createDocument(req.body, req.user)
        return res.status(StatusCodes.CREATED).json(document)
    } catch (error) {
        next(error)
    }
}

const getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.getAllDocuments - user not authenticated'
            )
        }

        const documents = await dataEngineService.getAllDocuments(req.query, req.user)
        return res.json(documents)
    } catch (error) {
        next(error)
    }
}

const getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDocumentsController.getDocumentById - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.getDocumentById - user not authenticated'
            )
        }

        const document = await dataEngineService.getDocumentById(req.params.id, req.user)

        // Check ownership before returning
        if (req.user && !(await checkOwnership(document, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDocumentsController.getDocumentById - Unauthorized')
        }

        return res.json(document)
    } catch (error) {
        next(error)
    }
}

const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id || !req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDocumentsController.updateDocument - id or body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.updateDocument - user not authenticated'
            )
        }

        // First get the resource to check ownership
        const existingDocument = await dataEngineService.getDocumentById(req.params.id, req.user)

        // Check ownership before updating
        if (req.user && !(await checkOwnership(existingDocument, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDocumentsController.updateDocument - Unauthorized')
        }

        const document = await dataEngineService.updateDocument(req.params.id, req.body, req.user)
        return res.json(document)
    } catch (error) {
        next(error)
    }
}

const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDocumentsController.deleteDocument - id not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.deleteDocument - user not authenticated'
            )
        }

        // First get the resource to check ownership
        const existingDocument = await dataEngineService.getDocumentById(req.params.id, req.user)

        // Check ownership before deleting
        if (req.user && !(await checkOwnership(existingDocument, req.user, req))) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Error: dataEngineDocumentsController.deleteDocument - Unauthorized')
        }

        const result = await dataEngineService.deleteDocument(req.params.id, req.user)
        return res.json(result)
    } catch (error) {
        next(error)
    }
}

const searchDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                'Error: dataEngineDocumentsController.searchDocuments - body not provided'
            )
        }

        if (!req.user) {
            throw new InternalFlowiseError(
                StatusCodes.UNAUTHORIZED,
                'Error: dataEngineDocumentsController.searchDocuments - user not authenticated'
            )
        }

        const { query_embedding, match_threshold, match_count, store_id } = req.body
        const results = await dataEngineService.searchDocuments(query_embedding, match_threshold, match_count, store_id, req.user)
        return res.json(results)
    } catch (error) {
        next(error)
    }
}

export default {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    searchDocuments
}
