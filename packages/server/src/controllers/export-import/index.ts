import { NextFunction, Request, Response } from 'express'
import exportImportService from '../../services/export-import'

const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('📤 Export request received:', {
            body: req.body,
            userId: req.user?.id,
            userEmail: req.user?.email
        })
        
        const apiResponse = await exportImportService.exportData(exportImportService.convertExportInput(req.body), req.user!)
        
        console.log('✅ Export completed successfully:', {
            responseKeys: Object.keys(apiResponse),
            fileDefaultName: apiResponse.FileDefaultName
        })
        
        return res.json(apiResponse)
    } catch (error) {
        console.error('❌ Export error:', error)
        next(error)
    }
}

const importData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('📥 Import request received:', {
            userId: req.user?.id,
            userEmail: req.user?.email,
            bodySize: JSON.stringify(req.body).length,
            headers: req.headers['content-type'],
            method: req.method,
            url: req.url
        })
        
        const importData = req.body
        
        // Log the structure of imported data
        console.log('📊 Import data structure:', {
            AgentFlow: importData.AgentFlow?.length || 0,
            AgentFlowV2: importData.AgentFlowV2?.length || 0,
            AssistantCustom: importData.AssistantCustom?.length || 0,
            AssistantOpenAI: importData.AssistantOpenAI?.length || 0,
            AssistantAzure: importData.AssistantAzure?.length || 0,
            ChatFlow: importData.ChatFlow?.length || 0,
            ChatMessage: importData.ChatMessage?.length || 0,
            ChatMessageFeedback: importData.ChatMessageFeedback?.length || 0,
            CustomTemplate: importData.CustomTemplate?.length || 0,
            DocumentStore: importData.DocumentStore?.length || 0,
            DocumentStoreFileChunk: importData.DocumentStoreFileChunk?.length || 0,
            Execution: importData.Execution?.length || 0,
            Tool: importData.Tool?.length || 0,
            Variable: importData.Variable?.length || 0
        })
        
        // Log sample data for debugging
        console.log('🔍 Sample data check:')
        if (importData.AgentFlow?.length > 0) {
            console.log('  - AgentFlow sample:', importData.AgentFlow[0])
        }
        if (importData.ChatFlow?.length > 0) {
            console.log('  - ChatFlow sample:', importData.ChatFlow[0])
        }
        if (importData.Tool?.length > 0) {
            console.log('  - Tool sample:', importData.Tool[0])
        }
        if (importData.Variable?.length > 0) {
            console.log('  - Variable sample:', importData.Variable[0])
        }
        
        console.log('🚀 Starting import process...')
        console.log('👤 User info for import:', {
            id: req.user?.id,
            email: req.user?.email,
            organizationId: req.user?.organizationId
        })
        
        await exportImportService.importData(req.user!, importData)
        
        console.log('✅ Import completed successfully')
        return res.json({ message: 'success' })
    } catch (error) {
        console.error('❌ Import error:', error)
        console.error('❌ Import error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown error'
        })
        next(error)
    }
}

export default {
    exportData,
    importData
}
