import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam, getNodeModulesPackagePath } from '../../../../src/utils'
import { MCPToolkit } from '../core'

class Hubspot_MCP implements INode {
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

    constructor() {
        this.label = 'Hubspot MCP'
        this.name = 'hubspotMCP'
        this.version = 1.0
        this.type = 'Hubspot MCP Tool'
        this.icon = 'hubspot.svg'
        this.category = 'Tools (MCP)'
        this.description = 'MCP server that integrates the Hubspot API'
        this.documentation = 'https://www.hubspot.com/'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['hubspotApi']
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
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiToken = getCredentialParam('apiToken', credentialData, nodeData)
        const packagePath = getNodeModulesPackagePath('@shinzo-labs/hubspot-mcp/dist/index.js')

        const serverParams = {
            command: process.execPath,
            args: [packagePath],
            env: {
                HUBSPOT_API_TOKEN: apiToken
            }
        }

        const toolkit = new MCPToolkit(serverParams, 'stdio')
        await toolkit.initialize()
        const tools = toolkit.tools ?? []
        return tools as Tool[]
    }
}

module.exports = { nodeClass: Hubspot_MCP }
