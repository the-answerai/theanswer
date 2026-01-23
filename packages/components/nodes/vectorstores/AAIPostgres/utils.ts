import { INodeData } from '../../../src'

export function getHost(_nodeData?: INodeData) {
    return process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_HOST || process.env.POSTGRES_VECTORSTORE_HOST || 'localhost'
}

export function getDatabase(_nodeData?: INodeData) {
    return process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_DATABASE || process.env.POSTGRES_VECTORSTORE_DATABASE || 'postgres'
}

export function getPort(_nodeData?: INodeData) {
    const port = process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PORT || process.env.POSTGRES_VECTORSTORE_PORT || '5432'
    return parseInt(port, 10)
}

export function getUser(_nodeData?: INodeData) {
    return process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_USER || process.env.POSTGRES_VECTORSTORE_USER || 'postgres'
}

export function getPassword(_nodeData?: INodeData) {
    return process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PASSWORD || process.env.POSTGRES_VECTORSTORE_PASSWORD || 'postgres'
}

export function getSSL(_nodeData?: INodeData) {
    const ssl = process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_SSL || process.env.POSTGRES_VECTORSTORE_SSL || 'false'
    return ssl === 'true'
}

export function getTableName(_nodeData?: INodeData) {
    return process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_TABLE_NAME || process.env.POSTGRES_VECTORSTORE_TABLE_NAME || 'documents'
}

export function getContentColumnName(_nodeData?: INodeData) {
    return (
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_CONTENT_COLUMN_NAME ||
        process.env.POSTGRES_VECTORSTORE_CONTENT_COLUMN_NAME ||
        'pageContent'
    )
}
