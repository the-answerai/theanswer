import { getCredentialCategory } from './getCredentialCategory'

type FlowData = string | Record<string, any>

export type FlowCredentialRecord = {
    nodeId: string
    nodeName: string
    nodeCategory: string
    nodeType: string
    credentialType: string
    parameterName: string
    label: string
    isRequired: boolean
    isCore: boolean
    categoryType: string
    categoryDisplayName: string
    isAssigned: boolean
    assignedCredentialId: string | null
}

type ProcessResult = {
    credentials: FlowCredentialRecord[]
    hasCredentials: boolean
}

export const processFlowCredentials = (flowData: FlowData): ProcessResult => {
    try {
        const flow = typeof flowData === 'string' ? JSON.parse(flowData) : flowData

        if (!flow || !Array.isArray(flow.nodes)) {
            return { credentials: [], hasCredentials: false }
        }

        const credentials: FlowCredentialRecord[] = []
        const credentialTypes = new Set<string>()

        flow.nodes.forEach((node: any) => {
            const inputParams = node?.data?.inputParams
            if (!Array.isArray(inputParams)) return

            const credentialParams = inputParams.filter((param: any) => param?.type === 'credential')

            credentialParams.forEach((credentialParam: any) => {
                const inputs = node?.data?.inputs
                const hasCredential =
                    node?.data?.credential || (inputs && (inputs[credentialParam.name] || inputs['FLOWISE_CREDENTIAL_ID']))

                const credentialNames: string[] = credentialParam?.credentialNames || []

                credentialNames.forEach((credentialName: string) => {
                    credentialTypes.add(credentialName)

                    const category = getCredentialCategory(node?.data?.category, credentialName)
                    const isRequired = category.isCore || credentialParam?.optional === false

                    credentials.push({
                        nodeId: node?.id,
                        nodeName: node?.data?.name || 'Unknown Node',
                        nodeCategory: node?.data?.category || 'Unknown',
                        nodeType: node?.data?.type || node?.type || 'Unknown',
                        credentialType: credentialName,
                        parameterName: credentialParam?.name,
                        label: credentialParam?.label || credentialParam?.name,
                        isRequired,
                        isCore: category.isCore,
                        categoryType: category.type,
                        categoryDisplayName: category.displayName,
                        isAssigned: !!hasCredential,
                        assignedCredentialId: hasCredential || null
                    })
                })
            })
        })

        return {
            credentials,
            hasCredentials: credentialTypes.size > 0
        }
    } catch (_error) {
        return { credentials: [], hasCredentials: false }
    }
}
