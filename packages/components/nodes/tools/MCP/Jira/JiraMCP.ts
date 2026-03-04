/**
 * MCP Server Node Pattern Example
 *
 * This file implements a Jira MCP server node following the standard pattern described in MCP/README.md.
 *
 * Key requirements:
 * - Implements INode interface
 * - Sets tags = ['AAI'] for UI Answer tab integration
 * - Sets category = 'Tools (MCP)'
 * - Exposes available actions via mcpActions input
 * - Registers the node as module.exports = { nodeClass: Jira_MCP }
 *
 * For more details and a template, see MCP/README.md.
 * All comments and documentation must be in English.
 */
import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam, getNodeModulesPackagePath } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class Jira_MCP implements INode {
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
        this.label = 'Jira MCP'
        this.name = 'jiraMCP'
        this.version = 1.0
        this.type = 'Jira MCP Tool'
        this.icon = 'jira.svg'
        this.category = 'Tools (MCP)'
        this.tags = ['AAI']
        this.description = 'MCP server that integrates the Jira API'
        this.documentation = 'https://github.com/modelcontextprotocol/servers/tree/main/src/jira'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['jiraApi']
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
        console.log('[JIRA MCP] getTools called')
        console.log('[JIRA MCP] credential ID:', nodeData.credential || 'MISSING')
        
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        console.log('[JIRA MCP] credentialData loaded:', !!credentialData)
        
        const jiraApiKey = getCredentialParam('accessToken', credentialData, nodeData)
        const jiraApiEmail = getCredentialParam('username', credentialData, nodeData)
        const jiraUrl = getCredentialParam('host', credentialData, nodeData)
        
        console.log('[JIRA MCP] apiKey exists:', !!jiraApiKey, 'length:', jiraApiKey?.length || 0)
        console.log('[JIRA MCP] email exists:', !!jiraApiEmail, 'value:', jiraApiEmail || 'MISSING')
        console.log('[JIRA MCP] url exists:', !!jiraUrl, 'value:', jiraUrl || 'MISSING')
        
        const packagePath = getNodeModulesPackagePath('@answerai/jira-mcp/build/index.js')
        console.log('[JIRA MCP] packagePath:', packagePath)

        const serverParams = {
            command: process.execPath,
            args: [packagePath],
            env: {
                JIRA_API_TOKEN: jiraApiKey,
                JIRA_USER_EMAIL: jiraApiEmail,
                JIRA_BASE_URL: jiraUrl
            }
        }

        console.log('[JIRA MCP] Calling MCPToolkit.initialize()')
        const toolkit = new MCPToolkit(serverParams, 'stdio')
        await toolkit.initialize()

        const tools = toolkit.tools ?? []
        console.log('[JIRA MCP] Tools loaded:', tools.length)

        return tools
    }
}

module.exports = { nodeClass: Jira_MCP }
