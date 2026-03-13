// RED tests: _saveChunksToStorage durability contract (must FAIL before implementation)

let mockReturnChunks: any[] = []

jest.mock('/virtual/test/mock-loader', () => ({
    nodeClass: class MockLoader {
        async init() {
            return mockReturnChunks
        }
    }
}), { virtual: true })

const mockChunkSave = jest.fn()
const mockChunkCreate = jest.fn((data: any) => data)
const mockChunkDelete = jest.fn()
const mockChunkCount = jest.fn()
const mockChunkFind = jest.fn()
const mockDocStoreSave = jest.fn()
const mockDocStoreFindOneBy = jest.fn()

// jest.mock calls MUST precede imports (jest hoisting requirement)
jest.mock('flowise-components', () => ({
    addArrayFilesToStorage: jest.fn(),
    addSingleFileToStorage: jest.fn(),
    getFileFromStorage: jest.fn(),
    getFileFromUpload: jest.fn(),
    ICommonObject: {},
    IDocument: {},
    mapExtToInputField: jest.fn(),
    mapMimeTypeToInputField: jest.fn(),
    removeFilesFromStorage: jest.fn(),
    removeSpecificFileFromStorage: jest.fn().mockResolvedValue({ totalSize: 0 }),
    removeSpecificFileFromUpload: jest.fn()
}))

jest.mock('@langchain/core/documents', () => ({
    Document: class Document {}
}))

jest.mock('../../../src/database/entities/DocumentStore', () => {
    class DocumentStoreMock {}
    return { DocumentStore: DocumentStoreMock }
})

jest.mock('../../../src/database/entities/DocumentStoreFileChunk', () => {
    class DocumentStoreFileChunkMock {}
    return { DocumentStoreFileChunk: DocumentStoreFileChunkMock }
})

jest.mock('../../../src/database/entities/ChatFlow', () => ({
    ChatFlow: class ChatFlow {}
}))

jest.mock('../../../src/database/entities/UpsertHistory', () => ({
    UpsertHistory: class UpsertHistory {}
}))

jest.mock('../../../src/enterprise/database/entities/workspace.entity', () => ({
    Workspace: class Workspace {}
}))

jest.mock('../../../src/enterprise/utils/ControllerServiceUtils', () => ({
    getWorkspaceSearchOptions: jest.fn()
}))

jest.mock('../../../src/errors/internalFlowiseError', () => ({
    InternalFlowiseError: class InternalFlowiseError extends Error {
        statusCode: number
        constructor(statusCode: number, message: string) {
            super(message)
            this.statusCode = statusCode
        }
    }
}))

jest.mock('../../../src/errors/utils', () => ({
    getErrorMessage: (e: any) => e?.message || String(e)
}))

jest.mock('../../../src/Interface', () => ({
    addLoaderSource: jest.fn().mockReturnValue('mock-source'),
    ChatType: { CHATFLOW: 'CHATFLOW' },
    DocumentStoreDTO: jest.fn(),
    DocumentStoreStatus: {
        EMPTY_SYNC: 'EMPTY',
        SYNC: 'SYNC',
        SYNCING: 'SYNCING',
        STALE: 'STALE',
        NEW: 'NEW',
        UPSERTING: 'UPSERTING',
        UPSERTED: 'UPSERTED'
    },
    MODE: { QUEUE: 'queue' }
}))

jest.mock('../../../src/UsageCacheManager', () => ({
    UsageCacheManager: class UsageCacheManager {}
}))

jest.mock('../../../src/utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))

jest.mock('../../../src/utils/logger', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
    }
}))

jest.mock('../../../src/utils', () => ({
    databaseEntities: {},
    getAppVersion: jest.fn(),
    saveUpsertFlowData: jest.fn(),
    constructGraphs: jest.fn(),
    getEndingNodes: jest.fn(),
    getTelemetryFlowObj: jest.fn(),
    isFlowValidForStream: jest.fn()
}))

jest.mock('../../../src/utils/constants', () => ({
    DOCUMENT_STORE_BASE_FOLDER: 'document-store',
    INPUT_PARAMS_TYPE: {},
    OMIT_QUEUE_JOB_DATA: []
}))

jest.mock('../../../src/utils/quotaUsage', () => ({
    checkStorage: jest.fn(),
    updateStorageUsage: jest.fn()
}))

jest.mock('../../../src/utils/prompt', () => ({
    DOCUMENTSTORE_TOOL_DESCRIPTION_PROMPT_GENERATOR: ''
}))

jest.mock('../../../src/utils/telemetry', () => ({
    Telemetry: class Telemetry {}
}))

jest.mock('../../../src/services/nodes', () => ({
    default: {}
}))

let uuidCounter = 0
jest.mock('uuid', () => ({
    v4: jest.fn(() => `mock-uuid-${uuidCounter++}`)
}))

import { processLoader } from '../../../src/services/documentstore/index'
import { DocumentStore } from '../../../src/database/entities/DocumentStore'
import { DocumentStoreFileChunk } from '../../../src/database/entities/DocumentStoreFileChunk'

const LOADER_ID = 'loader-1'
const STORE_ID = 'store-1'

const makeChunks = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
        pageContent: `chunk-content-${i}`,
        metadata: { source: 'test', index: i }
    }))

const makeEntity = () => ({
    id: STORE_ID,
    name: 'Test Store',
    description: 'test',
    loaders: JSON.stringify([{
        id: LOADER_ID,
        loaderId: 'mockLoader',
        loaderName: 'Mock Loader',
        loaderConfig: { text: 'hello' },
        splitterId: '',
        splitterConfig: {},
        credential: '',
        status: 'SYNCING',
        totalChunks: 0,
        totalChars: 0,
        files: [],
        source: ''
    }]),
    whereUsed: '[]',
    status: 'SYNCING',
    vectorStoreConfig: null,
    embeddingConfig: null,
    recordManagerConfig: null,
    userId: 'user-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    createdDate: new Date(),
    updatedDate: new Date()
})

const makeData = () => ({
    id: LOADER_ID,
    storeId: STORE_ID,
    loaderId: 'mockLoader',
    loaderName: 'Mock Loader',
    loaderConfig: { text: 'hello' },
    splitterId: '',
    splitterConfig: {},
    credential: '',
    previewChunkCount: -1,
    userId: 'user-1',
    organizationId: 'org-1',
    user: { id: 'user-1', organizationId: 'org-1' }
})

const componentNodes: any = {
    mockLoader: { filePath: '/virtual/test/mock-loader' }
}

const buildMockAppDataSource = () => {
    const docStoreRepo = {
        save: mockDocStoreSave,
        findOneBy: mockDocStoreFindOneBy,
        create: jest.fn((d: any) => d),
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn()
    }
    const chunkRepo = {
        save: mockChunkSave,
        create: mockChunkCreate,
        delete: mockChunkDelete,
        find: mockChunkFind,
        count: mockChunkCount,
        findOneBy: jest.fn()
    }

    return {
        getRepository: jest.fn((entity: any) => {
            if (entity === DocumentStore) return docStoreRepo
            if (entity === DocumentStoreFileChunk) return chunkRepo
            return {}
        })
    } as any
}

describe('_saveChunksToStorage durability contract', () => {
    let appDataSource: any

    beforeEach(() => {
        jest.clearAllMocks()
        uuidCounter = 0
        appDataSource = buildMockAppDataSource()
        mockChunkSave.mockResolvedValue(undefined)
        mockChunkDelete.mockResolvedValue(undefined)
        mockChunkCount.mockResolvedValue(0)
        mockChunkFind.mockResolvedValue([{ id: 'existing-chunk-1' }])
    })

    describe('happy path', () => {
        it('saves all chunks, sets loader status SYNC, counts match actual persisted', async () => {
            const chunks = makeChunks(3)
            mockReturnChunks = chunks

            const entity = makeEntity()
            mockDocStoreFindOneBy.mockResolvedValue(entity)
            mockDocStoreSave.mockResolvedValue(entity)

            await processLoader({
                appDataSource,
                componentNodes,
                data: makeData(),
                docLoaderId: LOADER_ID,
                orgId: 'org-1',
                workspaceId: 'ws-1',
                subscriptionId: 'sub-1',
                usageCacheManager: {} as any
            } as any)

            expect(mockChunkSave).toHaveBeenCalledTimes(3)

            expect(mockDocStoreSave).toHaveBeenCalled()
            const savedEntity = mockDocStoreSave.mock.calls[0][0]
            const loaders = JSON.parse(savedEntity.loaders)
            expect(loaders[0].status).toBe('SYNC')
            expect(loaders[0].totalChunks).toBe(3)

            const expectedChars = chunks.reduce((acc, c) => acc + c.pageContent.length, 0)
            expect(loaders[0].totalChars).toBe(expectedChars)
            expect(mockChunkDelete).toHaveBeenCalledTimes(1)
            expect(mockChunkDelete).not.toHaveBeenCalledWith({ docId: LOADER_ID })
        })
    })

    describe('first-batch failure', () => {
        it('does NOT delete old chunks when first save fails, sets loader status STALE', async () => {
            const chunks = makeChunks(3)
            mockReturnChunks = chunks

            const entity = makeEntity()
            mockDocStoreFindOneBy.mockResolvedValue(entity)
            mockDocStoreSave.mockResolvedValue(entity)
            mockChunkSave.mockRejectedValue(new Error('DB connection lost'))

            let thrownError: any = null
            try {
                await processLoader({
                    appDataSource,
                    componentNodes,
                    data: makeData(),
                    docLoaderId: LOADER_ID,
                    orgId: 'org-1',
                    workspaceId: 'ws-1',
                    subscriptionId: 'sub-1',
                    usageCacheManager: {} as any
                } as any)
            } catch (e) {
                thrownError = e
            }

            // CONTRACT: handle error internally, don't throw — BUG: current code throws → RED
            expect(thrownError).toBeNull()

            // CONTRACT: old chunks preserved (delete deferred) — BUG: L1247 deletes BEFORE save → RED
            expect(mockChunkDelete).not.toHaveBeenCalled()

            // CONTRACT: entity saved with STALE status
            const savedEntity = mockDocStoreSave.mock.calls[0]?.[0]
            if (savedEntity) {
                const loaders = JSON.parse(savedEntity.loaders)
                expect(loaders[0].status).toBe('STALE')
            }
        })
    })

    describe('mid-run failure (batch N>1)', () => {
        it('preserves completed batches, sets status STALE, counts = actual persisted', async () => {
            const chunks = makeChunks(501) // 2 batches (SAVE_BATCH_SIZE=500)
            mockReturnChunks = chunks

            const entity = makeEntity()
            mockDocStoreFindOneBy.mockResolvedValue(entity)
            mockDocStoreSave.mockResolvedValue(entity)

            let saveCount = 0
            mockChunkSave.mockImplementation(() => {
                saveCount++
                if (saveCount > 500) {
                    return Promise.reject(new Error('DB connection lost mid-run'))
                }
                return Promise.resolve(undefined)
            })

            let thrownError: any = null
            try {
                await processLoader({
                    appDataSource,
                    componentNodes,
                    data: makeData(),
                    docLoaderId: LOADER_ID,
                    orgId: 'org-1',
                    workspaceId: 'ws-1',
                    subscriptionId: 'sub-1',
                    usageCacheManager: {} as any
                } as any)
            } catch (e) {
                thrownError = e
            }

            // CONTRACT: handle partial failure internally — BUG: current code throws → RED
            expect(thrownError).toBeNull()

            expect(mockDocStoreSave).toHaveBeenCalled()
            const savedEntity = mockDocStoreSave.mock.calls[0]?.[0]
            if (savedEntity) {
                const loaders = JSON.parse(savedEntity.loaders)
                expect(loaders[0].status).toBe('STALE')
                // BUG: L1284 sets totalChunks = response.totalChunks (501) not actual (500) → RED
                expect(loaders[0].totalChunks).toBe(500)
            }
        })
    })

    describe('idempotent rerun', () => {
        it('after partial failure, rerun reaches SYNC with correct counts, no duplication', async () => {
            const chunks = makeChunks(3)
            mockReturnChunks = chunks

            const entity1 = makeEntity()
            mockDocStoreFindOneBy.mockResolvedValue(entity1)
            mockDocStoreSave.mockResolvedValue(entity1)

            let firstRunSaveCount = 0
            mockChunkSave.mockImplementation(() => {
                firstRunSaveCount++
                if (firstRunSaveCount === 2) {
                    return Promise.reject(new Error('Transient DB error'))
                }
                return Promise.resolve(undefined)
            })

            try {
                await processLoader({
                    appDataSource,
                    componentNodes,
                    data: makeData(),
                    docLoaderId: LOADER_ID,
                    orgId: 'org-1',
                    workspaceId: 'ws-1',
                    subscriptionId: 'sub-1',
                    usageCacheManager: {} as any
                } as any)
            } catch (_) {
                // current code throws on failure — expected for now
            }

            jest.clearAllMocks()
            uuidCounter = 0
            appDataSource = buildMockAppDataSource()

            const entity2 = makeEntity()
            mockDocStoreFindOneBy.mockResolvedValue(entity2)
            mockDocStoreSave.mockResolvedValue(entity2)
            mockChunkSave.mockResolvedValue(undefined)
            mockChunkDelete.mockResolvedValue(undefined)
            mockChunkCount.mockResolvedValue(0)
            mockChunkFind.mockResolvedValue([{ id: 'existing-chunk-2' }])

            await processLoader({
                appDataSource,
                componentNodes,
                data: makeData(),
                docLoaderId: LOADER_ID,
                orgId: 'org-1',
                workspaceId: 'ws-1',
                subscriptionId: 'sub-1',
                usageCacheManager: {} as any
            } as any)

            expect(mockDocStoreSave).toHaveBeenCalled()
            const savedEntity = mockDocStoreSave.mock.calls[0][0]
            const loaders = JSON.parse(savedEntity.loaders)
            expect(loaders[0].status).toBe('SYNC')
            expect(loaders[0].totalChunks).toBe(3)

            // CONTRACT: delete happens AFTER save (safe delete timing)
            // BUG: L1247 deletes BEFORE L1256 save → RED
            const deleteCallOrder = mockChunkDelete.mock.invocationCallOrder[0]
            const firstSaveCallOrder = mockChunkSave.mock.invocationCallOrder[0]
            expect(deleteCallOrder).toBeGreaterThan(firstSaveCallOrder)
        })
    })
})
