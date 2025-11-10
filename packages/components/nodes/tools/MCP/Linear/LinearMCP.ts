/**
 * Linear MCP Server Node
 *
 * This file implements a Linear MCP server node following the standard pattern described in MCP/README.md.
 *
 * Key requirements:
 * - Implements INode interface
 * - Sets tags = ['AAI'] for UI Answer tab integration
 * - Sets category = 'MCP Servers'
 * - Exposes available actions via mcpActions input
 * - Registers the node as module.exports = { nodeClass: Linear_MCP }
 *
 * For more details and a template, see MCP/README.md.
 * All comments and documentation must be in English.
 */
import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class Linear_MCP implements INode {
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
        this.label = 'Linear MCP'
        this.name = 'linearMCP'
        this.version = 1.0
        this.type = 'Linear MCP Tool'
        this.icon = 'linear.svg'
        this.category = 'MCP Servers'
        this.tags = ['AAI']
        this.description = 'MCP Server for the Linear API - manage issues, projects, and teams'
        this.documentation = 'https://linear.app/changelog/2025-05-01-mcp'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['linearApi']
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
                toolset.sort((a: any, b: any) => a.name.localeCompare(b.name))

                return toolset.map(({ name, ...rest }) => ({
                    label: name.toUpperCase(),
                    name: name,
                    description: rest.description || name
                }))
            } catch (error) {
                console.error('Error listing Linear actions:', error)
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your Linear API Key and refresh'
                    }
                ]
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
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

        return tools.filter((tool: any) => mcpActions.includes(tool.name))
    }

    async getTools(nodeData: INodeData, options: ICommonObject): Promise<Tool[]> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

        if (!apiKey) {
            console.error('Linear MCP: Missing Linear API Key')
            return []
        }

        // Linear's official remote MCP server
        const serverParams = {
            url: 'https://mcp.linear.app/sse'
        }

        // Use SSE transport for Linear's remote server
        const toolkit = new MCPToolkit(serverParams, 'sse', apiKey)
        await toolkit.initialize()

        const tools = toolkit.tools ?? []

        return tools as Tool[]
    }
}

module.exports = { nodeClass: Linear_MCP }
