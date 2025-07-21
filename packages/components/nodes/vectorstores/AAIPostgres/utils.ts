import { defaultChain, ICommonObject, INodeData } from '../../../src'

export function getHost(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_HOST,
        credentialData?.host,
        nodeData?.inputs?.host,
        process.env.POSTGRES_VECTORSTORE_HOST,
        'localhost'
    )
}

export function getDatabase(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_DATABASE,
        credentialData?.database,
        nodeData?.inputs?.database,
        process.env.POSTGRES_VECTORSTORE_DATABASE,
        'postgres'
    )
}

export function getPort(nodeData?: INodeData, credentialData?: ICommonObject) {
    const port = defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PORT,
        credentialData?.port,
        nodeData?.inputs?.port,
        process.env.POSTGRES_VECTORSTORE_PORT,
        '5432'
    )
    return parseInt(String(port), 10)
}

export function getUser(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_USER,
        credentialData?.user,
        nodeData?.inputs?.user,
        process.env.POSTGRES_VECTORSTORE_USER,
        'postgres'
    )
}

export function getPassword(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_PASSWORD,
        credentialData?.password,
        nodeData?.inputs?.password,
        process.env.POSTGRES_VECTORSTORE_PASSWORD,
        'postgres'
    )
}

export function getSSL(nodeData?: INodeData, credentialData?: ICommonObject) {
    const ssl = defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_SSL,
        credentialData?.ssl,
        nodeData?.inputs?.ssl,
        process.env.POSTGRES_VECTORSTORE_SSL,
        'false'
    )
    return ssl === 'true' || ssl === true
}

export function getTableName(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_TABLE_NAME,
        credentialData?.tableName,
        nodeData?.inputs?.tableName,
        process.env.POSTGRES_VECTORSTORE_TABLE_NAME,
        'documents'
    )
}

export function getContentColumnName(nodeData?: INodeData, credentialData?: ICommonObject) {
    return defaultChain(
        process.env.AAI_DEFAULT_POSTGRES_VECTORSTORE_CONTENT_COLUMN_NAME,
        credentialData?.contentColumnName,
        nodeData?.inputs?.contentColumnName,
        process.env.POSTGRES_VECTORSTORE_CONTENT_COLUMN_NAME,
        'pageContent'
    )
}
