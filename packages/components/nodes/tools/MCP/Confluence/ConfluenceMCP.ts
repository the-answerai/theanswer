/**
 * MCP Server Node Pattern Example
 *
 * This file implements a Confluence MCP server node following the standard pattern described in MCP/README.md.
 *
 * Key requirements:
 * - Implements INode interface
 * - Sets tags = ['AAI'] for UI Answer tab integration
 * - Sets category = 'Tools (MCP)'
 * - Exposes available actions via mcpActions input
 * - Registers the node as module.exports = { nodeClass: Confluence_MCP }
 *
 * For more details and a template, see MCP/README.md.
 * All comments and documentation must be in English.
 */
import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam, getNodeModulesPackagePath } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class Confluence_MCP implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    documentation: string
    credential: INodeParams
    inputs: INodeParams[]
    tags: string[]

    constructor() {
        this.label = 'Confluence MCP'
        this.name = 'confluenceMCP'
        this.version = 1.0
        this.type = 'Confluence MCP Tool'
        this.icon = 'confluence.svg'
        this.category = 'Tools (MCP)'
        this.tags = ['AAI']
        this.description = 'MCP server that integrates the Confluence API'
        this.documentation = 'https://github.com/modelcontextprotocol/servers/tree/main/src/jira'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['confluenceCloudApi']
        }
        this.inputs = [
            {
                label: 'Available Actions',
                name: 'mcpActions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                refresh: true
            }
        ]
        this.baseClasses = ['Tool']
    }

    //@ts-ignore
    loadMethods = {
        listActions: async (nodeData: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> => {
            try {
                const toolset = await this.getTools(nodeData, options)
                toolset.sort((a, b) => a.name.localeCompare(b.name))

                return toolset.map(({ name, ...rest }) => ({
                    label: name.toUpperCase(),
                    name: name,
                    description: rest.description || name
                }))
            } catch (error) {
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your API key and refresh'
                    }
                ]
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<Tool[]> {
        const tools = await this.getTools(nodeData, options)

        const _mcpActions = nodeData.inputs?.mcpActions
        let mcpActions = []
        if (_mcpActions) {
            try {
                mcpActions = typeof _mcpActions === 'string' ? JSON.parse(_mcpActions) : _mcpActions
            } catch (error) {
                console.error('Error parsing mcp actions:', error)
            }
        }

        return tools.filter((tool) => mcpActions.includes(tool.name))
    }

    async getTools(nodeData: INodeData, options: ICommonObject): Promise<Tool[]> {
        console.log('[CONFLUENCE MCP DEBUG] ========== getTools START ==========')
        console.log('[CONFLUENCE MCP DEBUG] Timestamp:', new Date().toISOString())
        console.log('[CONFLUENCE MCP DEBUG] nodeData.credential ID:', nodeData?.credential || 'NONE')
        try {
            console.log('[CONFLUENCE MCP DEBUG] options keys:', Object.keys(options || {}).join(', '))
        } catch (e) {
            console.log('[CONFLUENCE MCP DEBUG] options keys: ERROR -', String(e))
        }
        
        console.time('[CONFLUENCE MCP DEBUG] getCredentialData')
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        console.timeEnd('[CONFLUENCE MCP DEBUG] getCredentialData')
        
        console.log('[CONFLUENCE MCP DEBUG] credentialData keys:', Object.keys(credentialData || {}).join(', '))
        const confluenceApiKey = getCredentialParam('accessToken', credentialData, nodeData)
        const confluenceApiEmail = getCredentialParam('username', credentialData, nodeData)
        const confluenceUrl = getCredentialParam('baseURL', credentialData, nodeData)
        
        console.log('[CONFLUENCE MCP DEBUG] Credentials loaded:')
        console.log('[CONFLUENCE MCP DEBUG]   - apiKey exists:', !!confluenceApiKey, '(length:', confluenceApiKey?.length || 0, ')')
        console.log('[CONFLUENCE MCP DEBUG]   - email exists:', !!confluenceApiEmail, '(value:', confluenceApiEmail || 'MISSING', ')')
        console.log('[CONFLUENCE MCP DEBUG]   - url exists:', !!confluenceUrl, '(value:', confluenceUrl || 'MISSING', ')')
        
        const packagePath = getNodeModulesPackagePath('@answerai/confluence-mcp/build/index.js')
        console.log('[CONFLUENCE MCP DEBUG] Package path:', packagePath)
        
        const serverParams = {
            command: process.execPath,
            args: [packagePath],
            env: {
                CONFLUENCE_API_TOKEN: confluenceApiKey,
                CONFLUENCE_USER_EMAIL: confluenceApiEmail,
                CONFLUENCE_BASE_URL: confluenceUrl
            }
        }

        console.log('[CONFLUENCE MCP DEBUG] Creating MCPToolkit with command:', serverParams.command)
        const toolkit = new MCPToolkit(serverParams, 'stdio')
        
        console.time('[CONFLUENCE MCP DEBUG] toolkit.initialize')
        console.log('[CONFLUENCE MCP DEBUG] Calling toolkit.initialize() at', new Date().toISOString())
        await toolkit.initialize()
        console.timeEnd('[CONFLUENCE MCP DEBUG] toolkit.initialize')
        console.log('[CONFLUENCE MCP DEBUG] toolkit.initialize() completed at', new Date().toISOString())

        const tools = toolkit.tools ?? []
        console.log('[CONFLUENCE MCP DEBUG] Tools loaded:', tools.length)
        console.log('[CONFLUENCE MCP DEBUG] ========== getTools END ==========')

        return tools
    }
}

module.exports = { nodeClass: Confluence_MCP }
