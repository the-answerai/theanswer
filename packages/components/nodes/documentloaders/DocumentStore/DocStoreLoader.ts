import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeOptionsValue, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { DataSource } from 'typeorm'
import { Document } from '@langchain/core/documents'
import { handleEscapeCharacters } from '../../../src'

class DocStore_DocumentLoaders implements INode {
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
    badge: string

    constructor() {
        console.log('DocStore_DocumentLoaders constructor called')
        this.label = 'Document Store'
        this.name = 'documentStore'
        this.version = 1.1
        this.type = 'Document'
        this.icon = 'dstore.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from pre-configured document stores`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Select Stores',
                name: 'selectedStores',
                type: 'asyncOptions',
                loadMethod: 'listStores',
                list: true // This allows multiple selections
            }
        ]
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ]
    }

    //@ts-ignore
    //@ts-ignore
    loadMethods = {
        async listStores(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            console.log('listStores method called')
            const returnData: INodeOptionsValue[] = []

            const appDataSource = options.appDataSource as DataSource
            const databaseEntities = options.databaseEntities as IDatabaseEntity
            const userId = options.userId
            const organizationId = options.organizationId

            try {
                const stores = await appDataSource
                    .getRepository(databaseEntities['DocumentStore'])
                    .find({ where: { userId, organizationId } })
                console.log(`Found ${stores.length} stores`)

                for (const store of stores) {
                    const obj = {
                        label: store.name,
                        name: store.id, // Use id as the name
                        description: store.description
                    }
                    returnData.push(obj)
                }
            } catch (error) {
                console.error('Error fetching stores:', error)
            }

            console.log(`Returning ${returnData.length} stores:`, returnData)
            return returnData
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        console.log('Init method called')
        const selectedStores = nodeData.inputs?.selectedStores as Array<{ name: string; label: string }>
        console.log('Init method called with selectedStores:', JSON.stringify(selectedStores, null, 2))
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const output = nodeData.outputs?.output as string

        const finalDocs = []

        if (!Array.isArray(selectedStores)) {
            console.error('selectedStores is not an array:', selectedStores)
            return []
        }

        for (const store of selectedStores) {
            if (!store || typeof store !== 'object' || !store.name) {
                console.error('Invalid store object:', store)
                continue
            }

            const storeId = store.name // We're using the 'name' field as the ID

            const chunks = await appDataSource
                .getRepository(databaseEntities['DocumentStoreFileChunk'])
                .find({ where: { storeId: storeId } })

            for (const chunk of chunks) {
                finalDocs.push(new Document({ pageContent: chunk.pageContent, metadata: JSON.parse(chunk.metadata) }))
            }
        }

        if (output === 'document') {
            return finalDocs
        } else {
            let finaltext = ''
            for (const doc of finalDocs) {
                finaltext += `${doc.pageContent}\n`
            }
            return handleEscapeCharacters(finaltext, false)
        }
    }
}

module.exports = { nodeClass: DocStore_DocumentLoaders }
