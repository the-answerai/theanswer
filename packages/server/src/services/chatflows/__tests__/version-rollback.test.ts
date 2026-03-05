/**
 * Temporary verification tests for AGENT-466 chatflow version rollback bug fixes
 *
 * Bug 1: rollbackToVersion now accepts newVersion parameter from DB-computed value
 * Bug 2: updateChatflow now increments currentVersion when flowData changes
 *
 * These tests verify the fixes work correctly. They are temporary and can be deleted
 * after verification.
 */

// Mock ALL heavy dependencies BEFORE importing the service
jest.mock('../../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))
jest.mock('../../chatflow-storage', () => ({
    __esModule: true,
    default: {
        saveVersionedChatflow: jest.fn(),
        rollbackToVersion: jest.fn(),
        getChatflowVersion: jest.fn()
    }
}))
jest.mock('flowise-components', () => ({ removeFolderFromStorage: jest.fn(), ICommonObject: {} }))
jest.mock('../../../utils', () => ({
    constructGraphs: jest.fn(),
    getAppVersion: jest.fn(),
    getEndingNodes: jest.fn(),
    getTelemetryFlowObj: jest.fn(),
    isFlowValidForStream: jest.fn()
}))
jest.mock('../../../services/documentstore', () => ({ __esModule: true, default: { updateDocumentStoreUsage: jest.fn() } }))
jest.mock('../../../utils/fileRepository', () => ({
    containsBase64File: jest.fn().mockReturnValue(false),
    updateFlowDataWithFilePaths: jest.fn()
}))
jest.mock('../../../utils/quotaUsage', () => ({ updateStorageUsage: jest.fn() }))
jest.mock('../../../UsageCacheManager', () => ({ UsageCacheManager: jest.fn() }))
jest.mock('../../../enterprise/utils/ControllerServiceUtils', () => ({ getWorkspaceSearchOptions: jest.fn() }))
jest.mock('../../../utils/logger', () => ({
    default: { debug: jest.fn(), error: jest.fn(), info: jest.fn() }
}))

import { getRunningExpressApp } from '../../../utils/getRunningExpressApp'
import chatflowStorageService from '../../chatflow-storage'
import chatflowsService from '../index'

describe('Chatflow Version Rollback - Bug Fixes (AGENT-466)', () => {
    let mockAppServer: any
    let mockRepository: any
    let mockUser: any

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup mock user
        mockUser = {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            organizationId: 'org-123'
        }

        // Setup mock repository
        mockRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            create: jest.fn()
        }

        // Setup mock app server
        mockAppServer = {
            AppDataSource: {
                getRepository: jest.fn().mockReturnValue(mockRepository)
            },
            usageCacheManager: {}
        }
        ;(getRunningExpressApp as jest.Mock).mockReturnValue(mockAppServer)
    })

    describe('Bug 1: rollbackChatflowToVersion passes correct newVersion parameter', () => {
        it('should pass DB-computed newVersion (currentVersion + 1) to chatflowStorageService.rollbackToVersion', async () => {
            // Arrange
            const chatflowId = 'cf-123'
            const versionToRollback = 1
            const currentDbVersion = 3

            const mockChatflow = {
                id: chatflowId,
                currentVersion: currentDbVersion,
                flowData: 'old-flow-data'
            }

            const mockVersionContent = {
                flowData: 'version-1-flow-data'
            }

            mockRepository.findOne.mockResolvedValue(mockChatflow)
            mockRepository.save.mockResolvedValue({
                ...mockChatflow,
                currentVersion: currentDbVersion + 1,
                flowData: mockVersionContent.flowData
            })
            ;(chatflowStorageService.getChatflowVersion as jest.Mock).mockResolvedValue(mockVersionContent)
            ;(chatflowStorageService.rollbackToVersion as jest.Mock).mockResolvedValue(undefined)

            // Act
            const result = await chatflowsService.rollbackChatflowToVersion(chatflowId, versionToRollback, mockUser)

            // Assert
            expect(chatflowStorageService.rollbackToVersion).toHaveBeenCalledWith(
                chatflowId,
                versionToRollback,
                currentDbVersion + 1, // newVersion = currentVersion + 1
                mockUser
            )

            expect(result.currentVersion).toBe(currentDbVersion + 1)
        })

        it('should handle version 0 correctly (edge case)', async () => {
            // Arrange
            const chatflowId = 'cf-456'
            const versionToRollback = 0
            const currentDbVersion = 2

            const mockChatflow = {
                id: chatflowId,
                currentVersion: currentDbVersion,
                flowData: 'current-flow'
            }

            const mockVersionContent = {
                flowData: 'version-0-flow'
            }

            mockRepository.findOne.mockResolvedValue(mockChatflow)
            mockRepository.save.mockResolvedValue({
                ...mockChatflow,
                currentVersion: currentDbVersion + 1,
                flowData: mockVersionContent.flowData
            })
            ;(chatflowStorageService.getChatflowVersion as jest.Mock).mockResolvedValue(mockVersionContent)
            ;(chatflowStorageService.rollbackToVersion as jest.Mock).mockResolvedValue(undefined)

            // Act
            await chatflowsService.rollbackChatflowToVersion(chatflowId, versionToRollback, mockUser)

            // Assert
            expect(chatflowStorageService.rollbackToVersion).toHaveBeenCalledWith(
                chatflowId,
                versionToRollback,
                currentDbVersion + 1,
                mockUser
            )
        })
    })

    describe('Bug 2: updateChatflow increments currentVersion when flowData changes', () => {
        it('should increment currentVersion when flowData is provided', async () => {
            // Arrange
            const existingChatflow = {
                id: 'cf-789',
                currentVersion: 2,
                flowData: '{"nodes":[],"edges":[]}',
                type: 'CHATFLOW'
            }

            const updateData = {
                flowData: '{"nodes":[],"edges":[]}'
            }

            const mergedChatflow = {
                ...existingChatflow,
                ...updateData,
                currentVersion: 2 // Will be incremented
            }

            const savedChatflow = {
                ...mergedChatflow,
                currentVersion: 3 // Incremented
            }

            mockRepository.merge.mockReturnValue(mergedChatflow)
            mockRepository.save.mockResolvedValue(savedChatflow)

            // Act
            const result = await chatflowsService.updateChatflow(existingChatflow as any, updateData as any, 'org-123', 'ws-123', 'sub-123')

            // Assert
            // Verify merge was called
            expect(mockRepository.merge).toHaveBeenCalledWith(existingChatflow, updateData)

            // Verify save was called with incremented version
            const saveCall = mockRepository.save.mock.calls[0][0]
            expect(saveCall.currentVersion).toBe(3)

            expect(result.currentVersion).toBe(3)
        })

        it('should NOT increment currentVersion when flowData is NOT provided', async () => {
            // Arrange
            const existingChatflow = {
                id: 'cf-999',
                currentVersion: 2,
                flowData: '{"nodes":[],"edges":[]}',
                type: 'CHATFLOW'
            }

            const updateData = {
                name: 'Updated Name' // Only name changes, no flowData
            }

            const mergedChatflow = {
                ...existingChatflow,
                ...updateData,
                currentVersion: 2 // Should NOT be incremented
            }

            const savedChatflow = {
                ...mergedChatflow,
                currentVersion: 2 // Still 2
            }

            mockRepository.merge.mockReturnValue(mergedChatflow)
            mockRepository.save.mockResolvedValue(savedChatflow)

            // Act
            const result = await chatflowsService.updateChatflow(existingChatflow as any, updateData as any, 'org-123', 'ws-123', 'sub-123')

            // Assert
            const saveCall = mockRepository.save.mock.calls[0][0]
            expect(saveCall.currentVersion).toBe(2) // Unchanged

            expect(result.currentVersion).toBe(2)
        })

        it('should increment from 1 if currentVersion is null/undefined', async () => {
            // Arrange
            const existingChatflow = {
                id: 'cf-new',
                currentVersion: null, // No version yet
                flowData: '{"nodes":[],"edges":[]}',
                type: 'CHATFLOW'
            }

            const updateData = {
                flowData: '{"nodes":[],"edges":[]}'
            }

            const mergedChatflow = {
                ...existingChatflow,
                ...updateData,
                currentVersion: null
            }

            const savedChatflow = {
                ...mergedChatflow,
                currentVersion: 2 // (null || 1) + 1 = 2
            }

            mockRepository.merge.mockReturnValue(mergedChatflow)
            mockRepository.save.mockResolvedValue(savedChatflow)

            // Act
            const result = await chatflowsService.updateChatflow(existingChatflow as any, updateData as any, 'org-123', 'ws-123', 'sub-123')

            // Assert
            const saveCall = mockRepository.save.mock.calls[0][0]
            expect(saveCall.currentVersion).toBe(2) // (null || 1) + 1 = 2

            expect(result.currentVersion).toBe(2)
        })
    })

    describe('Compound scenario: version numbers increment correctly across pipeline', () => {
        it('should handle multiple updates with version increments', async () => {
            const chatflowId = 'cf-compound'

            const created = {
                id: chatflowId,
                currentVersion: 1,
                flowData: '{"nodes":[],"edges":[]}',
                type: 'CHATFLOW'
            }

            const update1Data = { flowData: '{"nodes":[{"id":"n1","data":{"name":"test"}}],"edges":[]}' }
            const afterUpdate1 = { ...created, currentVersion: 2, flowData: update1Data.flowData }

            const update2Data = {
                flowData: '{"nodes":[{"id":"n1","data":{"name":"test"}},{"id":"n2","data":{"name":"test2"}}],"edges":[]}'
            }
            const afterUpdate2 = { ...afterUpdate1, currentVersion: 3, flowData: update2Data.flowData }

            const afterRollback = { ...afterUpdate2, currentVersion: 4, flowData: '{"nodes":[],"edges":[]}' }

            const update3Data = { flowData: '{"nodes":[{"id":"n3","data":{"name":"test3"}}],"edges":[]}' }
            const afterUpdate3 = { ...afterRollback, currentVersion: 5, flowData: update3Data.flowData }

            // Setup mocks for update sequence
            mockRepository.merge.mockImplementation((existing: any, update: any) => ({
                ...existing,
                ...update
            }))

            mockRepository.save.mockImplementation((chatflow: any) => Promise.resolve(chatflow))

            // Act & Assert: Verify version increments at each step
            // Step 2: Update with flowData
            const result1 = await chatflowsService.updateChatflow(created as any, update1Data as any, 'org-123', 'ws-123', 'sub-123')
            expect(result1.currentVersion).toBe(2)

            // Step 3: Update with flowData
            const result2 = await chatflowsService.updateChatflow(result1, update2Data as any, 'org-123', 'ws-123', 'sub-123')
            expect(result2.currentVersion).toBe(3)

            // Step 4: Rollback (simulated)
            mockRepository.findOne.mockResolvedValue(result2)
            ;(chatflowStorageService.getChatflowVersion as jest.Mock).mockResolvedValue({
                flowData: 'v1-flow'
            })
            ;(chatflowStorageService.rollbackToVersion as jest.Mock).mockResolvedValue(undefined)

            const result3 = await chatflowsService.rollbackChatflowToVersion(chatflowId, 1, mockUser)
            expect(result3.currentVersion).toBe(4)

            // Step 5: Update with flowData
            const result4 = await chatflowsService.updateChatflow(result3, update3Data as any, 'org-123', 'ws-123', 'sub-123')
            expect(result4.currentVersion).toBe(5)
        })
    })

    describe('Integration: Both bugs fixed together', () => {
        it('should correctly handle rollback followed by update', async () => {
            // Arrange
            const chatflowId = 'cf-integration'
            const currentDbVersion = 5

            const mockChatflow = {
                id: chatflowId,
                currentVersion: currentDbVersion,
                flowData: 'v5-flow'
            }

            const mockVersionContent = {
                flowData: 'v2-flow'
            }

            // Rollback setup
            mockRepository.findOne.mockResolvedValue(mockChatflow)
            mockRepository.save.mockResolvedValue({
                ...mockChatflow,
                currentVersion: currentDbVersion + 1,
                flowData: mockVersionContent.flowData
            })
            ;(chatflowStorageService.getChatflowVersion as jest.Mock).mockResolvedValue(mockVersionContent)
            ;(chatflowStorageService.rollbackToVersion as jest.Mock).mockResolvedValue(undefined)

            // Act: Rollback
            const rolledBack = await chatflowsService.rollbackChatflowToVersion(chatflowId, 2, mockUser)

            // Assert rollback passed correct newVersion
            expect(chatflowStorageService.rollbackToVersion).toHaveBeenCalledWith(
                chatflowId,
                2,
                currentDbVersion + 1, // 6
                mockUser
            )
            expect(rolledBack.currentVersion).toBe(6)

            const v6FlowData = '{"nodes":[{"id":"n6","data":{"name":"updated"}}],"edges":[]}'

            mockRepository.merge.mockReturnValue({
                ...rolledBack,
                flowData: v6FlowData
            })

            mockRepository.save.mockResolvedValue({
                ...rolledBack,
                currentVersion: 7,
                flowData: v6FlowData
            })

            const updated = await chatflowsService.updateChatflow(
                rolledBack,
                { flowData: v6FlowData } as any,
                'org-123',
                'ws-123',
                'sub-123'
            )

            // Assert update incremented version
            expect(updated.currentVersion).toBe(7)
        })
    })
})
