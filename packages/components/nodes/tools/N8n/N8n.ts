import { ICommonObject, INode, INodeData, INodeParams, INodeOptionsValue } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { Tool } from '@langchain/core/tools'
import { z } from 'zod'

class N8nTool extends Tool {
    name: string
    description: string
    apiUrl: string
    apiKey: string
    webhookUrls: string[]
    schema: any

    constructor(name: string, description: string, apiUrl: string, apiKey: string, webhookUrls: string[], schema: any) {
        super()
        this.name = name
        this.description = description
        this.apiUrl = apiUrl
        this.apiKey = apiKey
        this.webhookUrls = webhookUrls
        this.schema = schema
    }

    async _call(input: any): Promise<string> {
        try {
            let params = {}
            try {
                params = input
            } catch (error) {
                return 'Error: Input must be a valid JSON string'
            }

            console.log('Webhook URLs:', this.webhookUrls)

            const responses = await Promise.all(
                this.webhookUrls.map(async (url) => {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(params)
                    })

                    const result = await response.json()
                    return result
                })
            )

            return JSON.stringify(responses)
        } catch (error) {
            return `Error executing N8N workflow: ${error}`
        }
    }
}

class N8n_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'N8n'
        this.name = 'n8n'
        this.version = 1.0
        this.type = 'N8n'
        this.icon = 'n8n.svg'
        this.category = 'Tools'
        this.description = 'Execute N8N workflows using webhook triggers'
        this.baseClasses = [this.type, ...getBaseClasses(N8nTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['n8nApi']
        }
        this.inputs = [
            {
                label: 'Select Workflow',
                name: 'workflow',
                type: 'asyncOptions',
                loadMethod: 'listWorkflows',
                default: ''
            },
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                description: 'Name of the tool'
            },
            {
                label: 'Tool Description',
                name: 'toolDescription',
                type: 'string',
                description: 'Description of the tool'
            },
            {
                label: 'Parameters Schema',
                name: 'schema',
                type: 'code',
                description: 'Zod schema for the tool parameters (e.g., z.object({ param1: z.string() }))',
                default: 'z.object({})'
            }
        ]
    }

    loadMethods = {
        async listWorkflows(nodeData: INodeData, options?: ICommonObject): Promise<INodeOptionsValue[]> {
            const returnData: INodeOptionsValue[] = []

            // Add a small delay to ensure credential data is loaded
            await new Promise((resolve) => setTimeout(resolve, 500))
            console.log('nodeData', nodeData)
            const apiUrl = 'https://n8n.lastrev.com'
            const apiKey = ''

            try {
                // if (!nodeData.credential) {
                //     console.debug('N8n credentials not found in nodeData:', nodeData)
                //     returnData.push({
                //         label: 'Please select N8n credentials first',
                //         name: '',
                //         description: 'No credentials selected'
                //     })
                //     return returnData
                // }

                // const credential = nodeData.credential
                // console.debug('Using N8n credentials:') // Add logging to track credential usage

                // const credentialData = await getCredentialData(nodeData.credential ?? '', options ?? {})
                // const apiUrl = getCredentialParam('apiUrl', credentialData, nodeData)
                // const apiKey = getCredentialParam('apiKey', credentialData, nodeData)

                if (!apiUrl || !apiKey) {
                    console.warn('Missing API URL or API Key')
                    return returnData
                }

                const url = `${apiUrl}/api/v1/workflows`
                console.warn('Fetching workflows from:', url)

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-N8N-API-KEY': apiKey,
                        Accept: 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()

                if (data && Array.isArray(data.data)) {
                    // Ensure each option has required properties
                    return data.data
                        .map((workflow: any) => ({
                            label: workflow.name || 'Unnamed Workflow',
                            name: workflow.id || '',
                            description: workflow.active ? 'Active' : 'Inactive'
                        }))
                        .filter((option: INodeOptionsValue) => option.name !== '') // Added type to option parameter
                }

                return returnData
            } catch (error) {
                console.error('Error in N8n listWorkflows:', error)
                returnData.push({
                    label: 'Error loading workflows',
                    name: '',
                    description: error.message
                })
                return returnData
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiUrl = getCredentialParam('apiUrl', credentialData, nodeData)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const selectedWorkflow = nodeData.inputs?.workflow as string
        const toolName = (nodeData.inputs?.toolName as string) || 'N8N Workflow'
        const toolDescription = (nodeData.inputs?.toolDescription as string) || 'Execute N8N workflow'
        const schemaStr = (nodeData.inputs?.schema as string) || 'z.object({})'

        if (!selectedWorkflow) {
            throw new Error('Please select a workflow')
        }

        // Fetch the selected workflow details
        const workflowResponse = await fetch(`${apiUrl}/api/v1/workflows/${selectedWorkflow}`, {
            method: 'GET',
            headers: {
                'X-N8N-API-KEY': apiKey,
                Accept: 'application/json'
            }
        })

        if (!workflowResponse.ok) {
            throw new Error(`Failed to fetch workflow details: ${workflowResponse.statusText}`)
        }

        const workflowData = await workflowResponse.json()

        // Extract webhook nodes
        const webhookNodes = workflowData.nodes.filter((node: any) => node.type === 'n8n-nodes-base.webhook')

        if (webhookNodes.length === 0) {
            throw new Error('No webhook nodes found in the selected workflow')
        }

        // Construct webhook URLs
        const webhookUrls = webhookNodes.map((node: any) => {
            const path = node.parameters.path
            return `${apiUrl}/webhook/${path}`
        })

        // Convert schema string to Zod object
        const zodSchemaFunction = new Function('z', `return ${schemaStr}`)
        const schema = zodSchemaFunction(z)

        return new N8nTool(toolName, toolDescription, apiUrl, apiKey, webhookUrls, schema)
    }
}

module.exports = { nodeClass: N8n_Tools }
