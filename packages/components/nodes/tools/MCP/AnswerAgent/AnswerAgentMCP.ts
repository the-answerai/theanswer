/**
 * AnswerAgent MCP Server Node
 *
 * This file implements an AnswerAgent MCP server node following the standard pattern described in MCP/README.md.
 *
 * Key features:
 * - Implements INode interface
 * - Sets tags = ['AAI'] for UI Answer tab integration
 * - Sets category = 'Tools (MCP)'
 * - Uses standard Flowise credential pattern (answerAgentApi)
 * - Supports connecting to any AnswerAgent instance via credential domain config
 * - Exposes available actions via mcpActions input
 * - Registers the node as module.exports = { nodeClass: AnswerAgent_MCP }
 *
 * For more details and template information, see MCP/README.md.
 * All comments and documentation must be in English.
 */
import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam, getNodeModulesPackagePath } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class AnswerAgent_MCP implements INode {
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
        this.label = 'AnswerAgent MCP'
        this.name = 'answerAgentMCP'
        this.version = 2.0
        this.type = 'AnswerAgent MCP Tool'
        this.icon = 'answerai-square-black.png'
        this.category = 'Tools (MCP)'
        this.tags = ['AAI']
        this.description = 'MCP server that integrates with AnswerAgent API'
        this.documentation = 'https://www.npmjs.com/package/@answerai/answeragent-mcp'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['answerAgentApi']
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

                const result = toolset.map(({ name, ...rest }) => ({
                    label: name.toUpperCase(),
                    name: name,
                    description: rest.description || name
                }))

                return result
            } catch (error) {
                console.error('DEBUG: Error in listActions:', error)
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your configuration and refresh'
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
        // Get API key and optional instance domain from credential
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const instanceDomain = getCredentialParam('instanceDomain', credentialData, nodeData)

        if (!apiKey) {
            console.error('AnswerAgent MCP: Missing AnswerAgent API Key')
            return []
        }

        // Use instance domain from credential, fall back to current instance domain or env var
        const apiHost = instanceDomain || options.user?.chatflowDomain || process.env.API_HOST || process.env.FLOWISE_DOMAIN
        if (!apiHost) {
            console.error('AnswerAgent MCP: No instance domain configured and API_HOST is not set')
            return []
        }

        // Get the package path for the AnswerAgent MCP server
        const packagePath = getNodeModulesPackagePath('@answerai/answeragent-mcp/dist/index.js')

        const serverParams = {
            command: process.execPath,
            args: [packagePath],
            env: {
                ANSWERAGENT_AI_API_BASE_URL: apiHost,
                ANSWERAGENT_AI_API_TOKEN: apiKey,
                // Subprocess does not inherit process.env; without this the axios client defaults to a 5s timeout
                API_TIMEOUT: process.env.ANSWERAGENT_MCP_API_TIMEOUT || '30000'
            }
        }

        const toolkit = new MCPToolkit(serverParams, 'stdio')

        await toolkit.initialize()

        const tools = toolkit.tools ?? []

        return tools
    }
}

module.exports = { nodeClass: AnswerAgent_MCP }
