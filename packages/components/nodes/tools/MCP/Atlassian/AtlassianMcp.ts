/**
 * Atlassian Remote MCP Server Node
 *
 * This file implements an Atlassian MCP server node that uses a custom remote MCP server
 * with OAuth 2.0 bearer token authentication.
 *
 * Key features:
 * - Uses atlassianOAuth credential with access_token, refresh_token, expiration_time
 * - Handles token refresh automatically before MCP initialization
 * - Connects to Atlassian's remote MCP server via SSE transport
 * - Supports both JIRA and Confluence through single integration
 * - Pre-fetches get_accessible_resources at init time and injects cloudId context
 *   into the description of every tool that requires it, so the LLM never has to
 *   guess or discover the cloudId with a separate round-trip
 *
 * Required environment variables:
 * - ATLASSIAN_CLIENT_ID
 * - ATLASSIAN_CLIENT_SECRET
 *
 * For more details and a template, see MCP/README.md.
 * All comments and documentation must be in English.
 */
import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { MCPToolkit } from '../core'
import { getCredentialData } from '../../../../src/utils'
import { ATLASSIAN_MCP_SERVER_URL } from '../../../../src/constants'

interface AtlassianCloudResource {
    id: string
    url: string
    name: string
    scopes?: string[]
}

class Atlassian_MCP implements INode {
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
    requiresOAuthRefresh: boolean

    constructor() {
        this.label = 'Atlassian MCP'
        this.name = 'atlassianMcp'
        this.version = 1.1
        this.type = 'Atlassian MCP Tool'
        this.icon = 'atlassian.svg'
        this.category = 'Tools (MCP)'
        this.tags = ['AAI']
        this.description = 'MCP server that integrates with Atlassian JIRA and Confluence using OAuth authentication'
        this.documentation = 'https://support.atlassian.com/rovo/docs/getting-started-with-the-atlassian-remote-mcp-server/'
        this.requiresOAuthRefresh = true
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['atlassianOAuth']
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
                if (!nodeData.credential) {
                    return [
                        {
                            label: 'No Credential Selected',
                            name: 'no_credential',
                            description: 'Please select an Atlassian OAuth credential first'
                        }
                    ]
                }

                const toolset = await this.getTools(nodeData, options)
                toolset.sort((a, b) => a.name.localeCompare(b.name))

                return toolset.map(({ name, ...rest }) => ({
                    label: name.toUpperCase(),
                    name: name,
                    description: rest.description || name
                }))
            } catch (error) {
                console.error('Error loading Atlassian MCP actions:', error)
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                return [
                    {
                        label: 'Error Loading Actions',
                        name: 'error',
                        description: `Failed to load actions: ${errorMessage}. Please check your OAuth credential setup.`
                    }
                ]
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<Tool[]> {
        const tools = await this.getTools(nodeData, options)

        const _mcpActions = nodeData.inputs?.mcpActions
        let mcpActions: string[] = []
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
        const credentialData = await getCredentialData(nodeData.credential || '', options)

        if (!credentialData.access_token) {
            console.error('Atlassian MCP: Access token not found in credential data')
            return []
        }

        const serverParams = {
            url: `${ATLASSIAN_MCP_SERVER_URL}/sse`
        }

        const toolkit = new MCPToolkit(serverParams, 'sse', credentialData.access_token)
        await toolkit.initialize()

        const tools = toolkit.tools ?? []

        // Pre-fetch accessible cloud resources and inject cloudId context into
        // the description of every tool that declares a cloudId parameter.
        // This prevents the LLM from passing null/undefined and eliminates the
        // need for a discovery round-trip during the actual conversation.
        const getResourcesTool = tools.find((t) => t.name === 'get_accessible_resources')
        if (getResourcesTool) {
            const cloudResources = await this.fetchCloudResources(getResourcesTool)
            if (cloudResources.length > 0) {
                this.enrichToolsWithCloudContext(tools, cloudResources)
            }
        }

        return tools
    }

    /**
     * Calls get_accessible_resources via its existing MCP tool and returns the
     * parsed list of Atlassian cloud sites available to the authenticated user.
     * Returns an empty array on any error so the caller degrades gracefully.
     */
    private async fetchCloudResources(getResourcesTool: Tool): Promise<AtlassianCloudResource[]> {
        try {
            // tool.invoke({}) returns JSON.stringify(res.content) from the MCP server,
            // which is an array of content blocks, e.g.:
            // [{"type":"text","text":"[{\"id\":\"...\",\"url\":\"...\",\"name\":\"...\"}]"}]
            const rawResult = await getResourcesTool.invoke({})
            const contentBlocks = JSON.parse(rawResult)
            const textBlock = Array.isArray(contentBlocks) ? contentBlocks.find((c: any) => c.type === 'text') : null
            if (!textBlock?.text) return []

            const resources = JSON.parse(textBlock.text)
            return Array.isArray(resources) ? resources.filter((r: any) => r.id && r.url) : []
        } catch (err) {
            console.warn('[Atlassian MCP] Could not pre-fetch cloud resources — cloudId context will not be injected:', err)
            return []
        }
    }

    /**
     * Appends a human-readable cloudId hint to the description of every tool
     * that declares a `cloudId` parameter in its zod schema. Mutates in-place.
     * The LLM sees this hint in the tool description before choosing arguments.
     */
    private enrichToolsWithCloudContext(tools: Tool[], resources: AtlassianCloudResource[]): void {
        const cloudNote =
            resources.length === 1
                ? ` [cloudId for this Atlassian site: "${resources[0].id}" (${resources[0].name} — ${resources[0].url})]`
                : ` [Available Atlassian cloudIds: ${resources.map((r) => `"${r.id}" → ${r.name} (${r.url})`).join(', ')}]`

        for (const t of tools) {
            const shape = (t as any).schema?.shape
            if (shape && 'cloudId' in shape) {
                t.description = `${t.description}${cloudNote}`
            }
        }
    }
}

module.exports = { nodeClass: Atlassian_MCP }
