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

    constructor() {
        this.label = 'Jira MCP'
        this.name = 'JiraMCP'
        this.version = 1.0
        this.type = 'Jira MCP Tool'
        this.icon = 'Jira.svg'
        this.category = 'Tools (MCP)'
        this.description = 'MCP Server for the Jira API'
        this.documentation = 'https://github.com/theanswer/theanswerai/packages-answers/jira-mcp-server/readme.md'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['JiraApi']
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
                console.error('Error listing actions:', error)
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your Jira Bot Token and refresh'
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
        const jiraApiKey = getCredentialParam('jiraApiKey', credentialData, nodeData)
        const jiraApiEmail = getCredentialParam('jiraApiEmail', credentialData, nodeData)
        const jiraUrl = getCredentialParam('jiraUrl', credentialData, nodeData)

        if (!jiraApiKey || !jiraApiEmail || !jiraUrl) {
            throw new Error('Missing Credentials')
        }

        const packagePath = getNodeModulesPackagePath('@aai-modelcontextprotocol/server-jira/build/index.js')

        const serverParams = {
            command: process.execPath,
            args: [packagePath],
            env: {
                JIRA_URL: jiraUrl ?? 'https://XXXXXXXX.atlassian.net',
                JIRA_API_MAIL: jiraApiEmail ?? 'Your email',
                JIRA_API_KEY: jiraApiKey ?? ''
            }
        }

        const toolkit = new MCPToolkit(serverParams, 'stdio')
        await toolkit.initialize()

        const tools = toolkit.tools ?? []

        return tools as Tool[]
    }
}

module.exports = { nodeClass: Jira_MCP }
