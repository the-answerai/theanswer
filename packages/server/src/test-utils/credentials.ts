// Builds and resolves credential seed definitions so scenarios remain declarative. Keeps alias
// mapping and default data generation in one place.
import { EnvTestCredential, SeedCredentialConfig } from './types'
import { buildCredentialData, loadTestEnvironment } from './environment'

type CredentialSeedDefinition = {
    credentialName: string
    aliases: string[]
    defaultName: string
    buildData: (overrides?: Record<string, any>) => Record<string, any>
}

const buildDefinition = (key: string, credential: EnvTestCredential): CredentialSeedDefinition => {
    const aliasMap: Record<string, string[]> = {
        openai: ['openai', 'openaiapi', 'open_ai'],
        exa: ['exa', 'exasearch'],
        jira: ['jira', 'jiraapi', 'JiraApi'],
        confluence: ['confluence', 'confluencecloud', 'confluenceapi'],
        github: ['github', 'githubapi'],
        slack: ['slack', 'slackapi'],
        contentful: ['contentful', 'contentfulapi', 'contentfulmanagement']
    }

    return {
        credentialName: credential.credentialName,
        aliases: aliasMap[key] || [key],
        defaultName: credential.name,
        buildData: (overrides: Record<string, any> = {}) => {
            const data = buildCredentialData(credential)
            return { ...data, ...overrides }
        }
    }
}

export const getCredentialSeedDefinitions = (): CredentialSeedDefinition[] => {
    const env = loadTestEnvironment()
    return Object.entries(env.credentials).map(([key, credential]) => buildDefinition(key, credential))
}

export const resolveCredentialSeedDefinition = (key: string): CredentialSeedDefinition | undefined => {
    const normalized = key.trim()
    const lower = normalized.toLowerCase()
    const definitions = getCredentialSeedDefinitions()

    return definitions.find((definition) => {
        if (definition.credentialName === normalized || definition.credentialName.toLowerCase() === lower) {
            return true
        }

        return definition.aliases.some((alias) => alias === normalized || alias.toLowerCase() === lower)
    })
}

export const normalizeCredentialEntries = (config?: SeedCredentialConfig) => {
    if (!config) {
        return []
    }

    if (Array.isArray(config)) {
        return config
    }

    return [config]
}

export type { CredentialSeedDefinition }
