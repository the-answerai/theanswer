import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import documentStoreService from '../../services/documentstore'
import { DocumentStore } from '../../database/entities/DocumentStore'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { DocumentStoreDTO } from '../../Interface'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { FLOWISE_COUNTER_STATUS, FLOWISE_METRIC_COUNTERS } from '../../Interface.Metrics'

const createDocumentStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.createDocumentStore - body not provided!`
            )
        }
        const body = req.body
        const docStore = DocumentStoreDTO.toEntity(body)
        const apiResponse = await documentStoreService.createDocumentStore(docStore, req.user?.id!, req.user?.organizationId!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllDocumentStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await documentStoreService.getAllDocumentStores(req.user?.id!, req.user?.organizationId!)
        return res.json(DocumentStoreDTO.fromEntities(apiResponse))
    } catch (error) {
        next(error)
    }
}

const deleteLoaderFromDocumentStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const storeId = req.params.id
        const loaderId = req.params.loaderId

        if (!storeId || !loaderId) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteLoaderFromDocumentStore - missing storeId or loaderId.`
            )
        }
        const apiResponse = await documentStoreService.deleteLoaderFromDocumentStore(
            storeId,
            loaderId,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(DocumentStoreDTO.fromEntity(apiResponse))
    } catch (error) {
        next(error)
    }
}

const getDocumentStoreById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.getDocumentStoreById - id not provided!`
            )
        }
        const apiResponse = await documentStoreService.getDocumentStoreById(req.params.id, req.user?.id!, req.user?.organizationId!)
        if (apiResponse && apiResponse.whereUsed) {
            apiResponse.whereUsed = JSON.stringify(
                await documentStoreService.getUsedChatflowNames(apiResponse, req.user?.id!, req.user?.organizationId!)
            )
        }
        return res.json(DocumentStoreDTO.fromEntity(apiResponse))
    } catch (error) {
        next(error)
    }
}

const getDocumentStoreFileChunks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.getDocumentStoreFileChunks - storeId not provided!`
            )
        }
        if (typeof req.params.fileId === 'undefined' || req.params.fileId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.getDocumentStoreFileChunks - fileId not provided!`
            )
        }
        const appDataSource = getRunningExpressApp().AppDataSource
        const page = req.params.pageNo ? parseInt(req.params.pageNo) : 1
        const apiResponse = await documentStoreService.getDocumentStoreFileChunks(
            appDataSource,
            req.params.storeId,
            req.params.fileId,
            page,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}
const syncAndRefreshChunks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { storeId, fileId } = req.params

        if (!storeId || !fileId) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'Store ID and File ID are required')
        }

        if (!req.user) {
            throw new InternalFlowiseError(StatusCodes.PRECONDITION_FAILED, 'User is required')
        }
        const apiResponse = await documentStoreService.syncAndRefreshChunks(storeId, fileId, req.user.id!, req.user.organizationId!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}
const deleteDocumentStoreFileChunk = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteDocumentStoreFileChunk - storeId not provided!`
            )
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteDocumentStoreFileChunk - loaderId not provided!`
            )
        }
        if (typeof req.params.chunkId === 'undefined' || req.params.chunkId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteDocumentStoreFileChunk - chunkId not provided!`
            )
        }
        const apiResponse = await documentStoreService.deleteDocumentStoreFileChunk(
            req.params.storeId,
            req.params.loaderId,
            req.params.chunkId,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const editDocumentStoreFileChunk = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.editDocumentStoreFileChunk - storeId not provided!`
            )
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.editDocumentStoreFileChunk - loaderId not provided!`
            )
        }
        if (typeof req.params.chunkId === 'undefined' || req.params.chunkId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.editDocumentStoreFileChunk - chunkId not provided!`
            )
        }
        const body = req.body
        if (typeof body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.editDocumentStoreFileChunk - body not provided!`
            )
        }
        const apiResponse = await documentStoreService.editDocumentStoreFileChunk(
            req.params.storeId,
            req.params.loaderId,
            req.params.chunkId,
            body.pageContent,
            body.metadata,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveProcessingLoader = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const appServer = getRunningExpressApp()
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.saveProcessingLoader - body not provided!`
            )
        }
        const body = req.body
        const apiResponse = await documentStoreService.saveProcessingLoader(appServer.AppDataSource, {
            ...body,
            userId: req.user?.id!,
            organizationId: req.user?.organizationId!
        })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const processLoader = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.processLoader - loaderId not provided!`
            )
        }
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.processLoader - body not provided!`
            )
        }
        const docLoaderId = req.params.loaderId
        const body = req.body
        const apiResponse = await documentStoreService.processLoaderMiddleware(
            { ...body, userId: req.user?.id!, organizationId: req.user?.organizationId! },
            docLoaderId
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateDocumentStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.updateDocumentStore - storeId not provided!`
            )
        }
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.updateDocumentStore - body not provided!`
            )
        }
        const store = await documentStoreService.getDocumentStoreById(req.params.id, req.user?.id!, req.user?.organizationId!)
        if (!store) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `Error: documentStoreController.updateDocumentStore - DocumentStore ${req.params.id} not found in the database`
            )
        }
        const body = req.body
        const updateDocStore = new DocumentStore()
        Object.assign(updateDocStore, body)
        const apiResponse = await documentStoreService.updateDocumentStore(store, updateDocStore, req.user?.id!, req.user?.organizationId!)
        return res.json(DocumentStoreDTO.fromEntity(apiResponse))
    } catch (error) {
        next(error)
    }
}

const deleteDocumentStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteDocumentStore - storeId not provided!`
            )
        }
        const apiResponse = await documentStoreService.deleteDocumentStore(req.params.id, req.user?.id!, req.user?.organizationId!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const previewFileChunks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.previewFileChunks - body not provided!`
            )
        }
        const body = req.body
        body.preview = true
        const apiResponse = await documentStoreService.previewChunksMiddleware({
            ...body,
            userId: req.user?.id!,
            organizationId: req.user?.organizationId!
        })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getDocumentLoaders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await documentStoreService.getDocumentLoaders(req.user?.id!, req.user?.organizationId!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const insertIntoVectorStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.insertIntoVectorStore - body not provided!')
        }
        const body = req.body
        const apiResponse = await documentStoreService.insertIntoVectorStoreMiddleware(
            { ...body, userId: req.user?.id!, organizationId: req.user?.organizationId! },
            true,
            req.user?.id!,
            req.user?.organizationId!
        )
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.SUCCESS
        })
        return res.json(DocumentStoreDTO.fromEntity(apiResponse))
    } catch (error) {
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.FAILURE
        })
        next(error)
    }
}

const queryVectorStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.queryVectorStore - body not provided!')
        }
        const body = req.body
        const apiResponse = await documentStoreService.queryVectorStore(
            { ...body, userId: req.user?.id!, organizationId: req.user?.organizationId! },
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteVectorStoreFromStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.storeId === 'undefined' || req.params.storeId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.deleteVectorStoreFromStore - storeId not provided!`
            )
        }
        const apiResponse = await documentStoreService.deleteVectorStoreFromStore(
            req.params.storeId,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const saveVectorStoreConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.saveVectorStoreConfig - body not provided!')
        }
        const body = req.body
        const appDataSource = getRunningExpressApp().AppDataSource
        const componentNodes = getRunningExpressApp().nodesPool.componentNodes
        const apiResponse = await documentStoreService.saveVectorStoreConfig(
            appDataSource,
            body,
            true,
            req.user?.id!,
            req.user?.organizationId!
        )
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateVectorStoreConfigOnly = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.updateVectorStoreConfigOnly - body not provided!')
        }
        const body = req.body
        const apiResponse = await documentStoreService.updateVectorStoreConfigOnly({
            ...body,
            userId: req.user?.id!,
            organizationId: req.user?.organizationId!
        })
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getEmbeddingProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await documentStoreService.getEmbeddingProviders(req.user?.id!, req.user?.organizationId!)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getVectorStoreProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await documentStoreService.getVectorStoreProviders()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getRecordManagerProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiResponse = await documentStoreService.getRecordManagerProviders()
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const upsertDocStoreMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.upsertDocStoreMiddleware - storeId not provided!`
            )
        }
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.upsertDocStoreMiddleware - body not provided!')
        }
        const body = req.body
        const files = (req.files as Express.Multer.File[]) || []
        const apiResponse = await documentStoreService.upsertDocStoreMiddleware(
            req.params.id,
            { ...body, userId: req.user?.id!, organizationId: req.user?.organizationId! },
            files
        )
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.SUCCESS
        })
        return res.json(apiResponse)
    } catch (error) {
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.FAILURE
        })
        next(error)
    }
}

const refreshDocStoreMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.refreshDocStoreMiddleware - storeId not provided!`
            )
        }
        const body = req.body
        const apiResponse = await documentStoreService.refreshDocStoreMiddleware(req.params.id, {
            ...body,
            userId: req.user?.id!,
            organizationId: req.user?.organizationId!
        })
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.SUCCESS
        })
        return res.json(apiResponse)
    } catch (error) {
        getRunningExpressApp().metricsProvider?.incrementCounter(FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
            status: FLOWISE_COUNTER_STATUS.FAILURE
        })
        next(error)
    }
}

const generateDocStoreToolDesc = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.generateDocStoreToolDesc - storeId not provided!`
            )
        }
        if (typeof req.body === 'undefined') {
            throw new Error('Error: documentStoreController.generateDocStoreToolDesc - body not provided!')
        }
        const apiResponse = await documentStoreService.generateDocStoreToolDesc(req.params.id, req.body.selectedChatModel)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getDocStoreConfigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params.id === 'undefined' || req.params.id === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.getDocStoreConfigs - storeId not provided!`
            )
        }
        if (typeof req.params.loaderId === 'undefined' || req.params.loaderId === '') {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: documentStoreController.getDocStoreConfigs - doc loader Id not provided!`
            )
        }
        const apiResponse = await documentStoreService.findDocStoreAvailableConfigs(req.params.id, req.params.loaderId)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    deleteDocumentStore,
    createDocumentStore,
    getAllDocumentStores,
    deleteLoaderFromDocumentStore,
    getDocumentStoreById,
    getDocumentStoreFileChunks,
    syncAndRefreshChunks,
    updateDocumentStore,
    processLoader,
    previewFileChunks,
    getDocumentLoaders,
    deleteDocumentStoreFileChunk,
    editDocumentStoreFileChunk,
    insertIntoVectorStore,
    getEmbeddingProviders,
    getVectorStoreProviders,
    getRecordManagerProviders,
    saveVectorStoreConfig,
    queryVectorStore,
    deleteVectorStoreFromStore,
    updateVectorStoreConfigOnly,
    upsertDocStoreMiddleware,
    refreshDocStoreMiddleware,
    saveProcessingLoader,
    generateDocStoreToolDesc,
    getDocStoreConfigs
}
