import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { BaseRetriever } from '@langchain/core/retrievers'

class markdownTable_Utilities implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Markdown Table'
        this.name = 'markdownTable'
        this.version = 1.0
        this.type = 'markdownTable'
        this.icon = 'markdownTable.svg'
        this.category = 'Utilities'
        this.description = `Converst JSON to Markdown Table`
        this.baseClasses = [this.type, 'Utilities']
        this.inputs = [
            {
                label: 'Retriever Name',
                name: 'name',
                type: 'string',
                placeholder: 'search_help_center'
            },
            {
                label: 'Retriever Description',
                name: 'description',
                type: 'string',
                description: 'When should agent uses to retrieve documents',
                rows: 3,
                placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            }
        ]
        this.outputs = [
            {
                label: 'Output',
                name: 'output',
                baseClasses: ['string', 'json', 'array']
            },
            {
                label: 'Ending Node',
                name: 'EndingNode',
                baseClasses: [this.type]
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const name = nodeData.inputs?.name as string
        const description = nodeData.inputs?.description as string
        const retriever = nodeData.inputs?.retriever as BaseRetriever
        const isEndingNode = nodeData?.outputs?.output === 'EndingNode'
        if (isEndingNode && !options.isRun) return // prevent running both init and run twice

        const docs = await retriever.getRelevantDocuments(input)

        // Call the function to convert JSON to Markdown table
        const markdownTable = this.convertJsonToMarkdownTable(docs)
        return markdownTable
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string> {
        return await this.init(nodeData, input, { ...options, isRun: true })
    }

    convertJsonToMarkdownTable(jsonArray: any[]): string {
        if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
            throw new Error('Input should be a non-empty JSON array')
        }

        const headers = Object.keys(jsonArray[0])
        const table = []

        // Create the header row
        table.push(`| ${headers.join(' | ')} |`)
        table.push(`| ${headers.map(() => '---').join(' | ')} |`)

        // Create the data rows
        jsonArray.forEach((item) => {
            const row = headers.map((header) => item[header] ?? '').join(' | ')
            table.push(`| ${row} |`)
        })

        return table.join('\n')
    }
}

module.exports = { nodeClass: markdownTable_Utilities }
