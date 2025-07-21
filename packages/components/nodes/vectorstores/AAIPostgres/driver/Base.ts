import { VectorStore } from '@langchain/core/vectorstores'
import { getCredentialData, ICommonObject, INodeData } from '../../../../src'
import { Document } from '@langchain/core/documents'
import { Embeddings } from '@langchain/core/embeddings'
import { getDatabase, getHost, getPort, getSSL, getTableName, getUser, getPassword } from '../utils'

export abstract class AAIVectorStoreDriver {
    protected _credentialData: ICommonObject | null = null

    constructor(protected nodeData: INodeData, protected options: ICommonObject) {}

    protected async getCredentialData(): Promise<ICommonObject | null> {
        if (this._credentialData === null) {
            try {
                if (this.nodeData.credential) {
                    this._credentialData = await getCredentialData(this.nodeData.credential, this.options)
                } else {
                    this._credentialData = {}
                }
            } catch (error) {
                // If credential retrieval fails, fall back to empty object
                this._credentialData = {}
            }
        }
        return this._credentialData
    }

    abstract instanciate(metaDataFilters?: any): Promise<VectorStore>

    abstract fromDocuments(documents: Document[]): Promise<VectorStore>

    protected async adaptInstance(instance: VectorStore, _metaDataFilters?: any): Promise<VectorStore> {
        return instance
    }

    async getHost() {
        const credentialData = await this.getCredentialData()
        return getHost(this.nodeData, credentialData || undefined) as string
    }

    async getPort() {
        const credentialData = await this.getCredentialData()
        return getPort(this.nodeData, credentialData || undefined) as number
    }

    async getSSL() {
        const credentialData = await this.getCredentialData()
        return getSSL(this.nodeData, credentialData || undefined) as boolean
    }

    async getDatabase() {
        const credentialData = await this.getCredentialData()
        return getDatabase(this.nodeData, credentialData || undefined) as string
    }

    async getUser() {
        const credentialData = await this.getCredentialData()
        return getUser(this.nodeData, credentialData || undefined) as string
    }

    async getPassword() {
        const credentialData = await this.getCredentialData()
        return getPassword(this.nodeData, credentialData || undefined) as string
    }

    async getTableName() {
        const credentialData = await this.getCredentialData()
        return this.sanitizeTableName(getTableName(this.nodeData, credentialData || undefined))
    }

    getEmbeddings() {
        return this.nodeData.inputs?.embeddings as Embeddings
    }

    sanitizeTableName(tableName: string): string {
        // Trim and normalize case, turn whitespace into underscores
        tableName = tableName.trim().toLowerCase().replace(/\s+/g, '_')

        // Validate using a regex (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name')
        }

        return tableName
    }
}
