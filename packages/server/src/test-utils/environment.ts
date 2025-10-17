// Centralized environment loader used by the test utilities. It validates required env vars,
// provides normalized credential metadata, and, when needed, derives Auth0 user IDs by hitting
// the password grant endpoint so seeds stay in sync with real accounts.
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { EnvTestCredential, EnvTestUser, SeedOrganizationConfig, TestEnvironment, TestUserRole } from './types'

const REQUIRED_ENV_VARS = [
    'TEST_USER_ENTERPRISE_ADMIN_EMAIL',
    'TEST_USER_ENTERPRISE_BUILDER_EMAIL',
    'TEST_USER_ENTERPRISE_MEMBER_EMAIL',
    'TEST_USER_PASSWORD',
    'TEST_ENTERPRISE_AUTH0_ORG_ID',
    'TEST_ENTERPRISE_ORG_NAME'
]

const buildCredentialDefinitions = (): Record<string, EnvTestCredential> => ({
    openai: {
        name: 'E2E OpenAI Key',
        credentialName: 'openAIApi',
        envKeys: {
            apiKey: 'TEST_OPENAI_API_KEY'
        },
        defaultValues: {
            apiKey: 'test-openai-api-key'
        }
    },
    exa: {
        name: 'E2E Exa Key',
        credentialName: 'exaSearchApi',
        envKeys: {
            apiKey: 'TEST_EXA_API_KEY'
        },
        defaultValues: {
            apiKey: 'test-exa-api-key'
        }
    },
    jira: {
        name: 'E2E Jira Credential',
        credentialName: 'JiraApi',
        envKeys: {
            email: 'TEST_JIRA_EMAIL',
            apiToken: 'TEST_JIRA_API_TOKEN'
        },
        defaultValues: {
            email: 'jira-bot@example.com',
            apiToken: 'test-jira-api-token'
        }
    },
    confluence: {
        name: 'E2E Confluence Credential',
        credentialName: 'confluenceCloudApi',
        envKeys: {
            email: 'TEST_CONFLUENCE_EMAIL',
            apiToken: 'TEST_CONFLUENCE_API_TOKEN',
            baseUrl: 'TEST_CONFLUENCE_BASE_URL'
        },
        defaultValues: {
            email: 'confluence-bot@example.com',
            apiToken: 'test-confluence-api-token',
            baseUrl: 'https://example.atlassian.net/wiki'
        }
    },
    github: {
        name: 'E2E GitHub Credential',
        credentialName: 'githubApi',
        envKeys: {
            accessToken: 'TEST_GITHUB_API_TOKEN'
        },
        defaultValues: {
            accessToken: 'test-github-token'
        }
    },
    slack: {
        name: 'E2E Slack Credential',
        credentialName: 'slackApi',
        envKeys: {
            botToken: 'TEST_SLACK_BOT_TOKEN'
        },
        defaultValues: {
            botToken: 'xoxb-test-slack-bot-token'
        }
    },
    contentful: {
        name: 'E2E Contentful Credential',
        credentialName: 'contentfulManagementApi',
        envKeys: {
            managementToken: 'TEST_CONTENTFUL_MANAGEMENT_TOKEN',
            spaceId: 'TEST_CONTENTFUL_SPACE_ID'
        },
        defaultValues: {
            managementToken: 'test-contentful-management-token',
            spaceId: 'test-space-id'
        }
    }
})

export const buildCredentialData = (credConfig: EnvTestCredential): Record<string, any> => {
    const data: Record<string, any> = {}
    for (const [field, envVar] of Object.entries(credConfig.envKeys)) {
        data[field] = process.env[envVar] || credConfig.defaultValues[field]
    }
    return data
}

export const loadTestEnvironment = (): TestEnvironment => {
    const missing = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar])
    if (missing.length) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            `Error: test-utils.environment - Missing required environment variables: ${missing.join(', ')}`
        )
    }

    const organization: SeedOrganizationConfig = {
        auth0Id: process.env.TEST_ENTERPRISE_AUTH0_ORG_ID!,
        name: process.env.TEST_ENTERPRISE_ORG_NAME!
    }

    const users: Record<TestUserRole, EnvTestUser> = {
        admin: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_ADMIN_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_ADMIN_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_ADMIN_NAME,
            role: 'admin'
        },
        builder: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_BUILDER_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_BUILDER_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_BUILDER_NAME,
            role: 'builder'
        },
        member: {
            auth0Id: process.env.TEST_USER_ENTERPRISE_MEMBER_AUTH0_ID,
            email: process.env.TEST_USER_ENTERPRISE_MEMBER_EMAIL!,
            name: process.env.TEST_USER_ENTERPRISE_MEMBER_NAME,
            role: 'member'
        }
    }

    const credentials = buildCredentialDefinitions()

    return {
        organization,
        users,
        credentials
    }
}

export const getAvailableTestUsers = (): Record<TestUserRole, { email: string; name?: string }> => {
    const env = loadTestEnvironment()
    return {
        admin: { email: env.users.admin.email, name: env.users.admin.name },
        builder: { email: env.users.builder.email, name: env.users.builder.name },
        member: { email: env.users.member.email, name: env.users.member.name }
    }
}

export const getAvailableTestCredentials = (): Record<string, { name: string; credentialName: string; hasEnvVars: boolean }> => {
    const env = loadTestEnvironment()
    const result: Record<string, { name: string; credentialName: string; hasEnvVars: boolean }> = {}

    Object.entries(env.credentials).forEach(([key, config]) => {
        const hasEnvVars = Object.values(config.envKeys).some((envVar) => Boolean(process.env[envVar]))
        result[key] = {
            name: config.name,
            credentialName: config.credentialName,
            hasEnvVars
        }
    })

    return result
}

export const validateScenarioAliases = (aliases: string[]): void => {
    const env = loadTestEnvironment()
    const knownAliases = new Set(Object.keys(env.credentials))
    const unknown = aliases.filter((alias) => !knownAliases.has(alias))

    if (unknown.length) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            `Error: test-utils.environment - Unknown credential alias(es): ${unknown.join(', ')}`
        )
    }
}

const auth0IdCache = new Map<string, string>()

const decodeJwtPayload = (idToken: string): Record<string, any> => {
    const segments = idToken.split('.')
    if (segments.length < 2) {
        throw new Error('Invalid ID token format')
    }

    const payloadSegment = segments[1]
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')

    return JSON.parse(decoded)
}

const fetchAuth0UserId = async (email: string): Promise<string> => {
    if (auth0IdCache.has(email)) {
        return auth0IdCache.get(email) as string
    }

    const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL?.replace(/\/$/, '')
    const clientId = process.env.AUTH0_CLIENT_ID
    const clientSecret = process.env.AUTH0_CLIENT_SECRET
    const password = process.env.TEST_USER_PASSWORD

    if (!issuerBaseUrl || !clientId || !clientSecret || !password) {
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            'Error: test-utils.environment - Unable to resolve Auth0 ID. Please set TEST_USER_ENTERPRISE_*_AUTH0_ID or configure AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and TEST_USER_PASSWORD.'
        )
    }

    try {
        const response = await axios.post(
            `${issuerBaseUrl}/oauth/token`,
            {
                grant_type: 'password',
                username: email,
                password,
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'openid profile email'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        const idToken = response.data?.id_token
        if (!idToken) {
            throw new Error('ID token not returned from Auth0')
        }

        const payload = decodeJwtPayload(idToken)
        const auth0Id = payload?.sub

        if (!auth0Id || typeof auth0Id !== 'string') {
            throw new Error('Missing sub claim in ID token')
        }

        auth0IdCache.set(email, auth0Id)
        return auth0Id
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        throw new InternalFlowiseError(
            StatusCodes.PRECONDITION_FAILED,
            `Error: test-utils.environment - Unable to resolve Auth0 ID for ${email}: ${message}`
        )
    }
}

export const resolveAuth0UserId = async (user: EnvTestUser): Promise<string> => {
    if (user.auth0Id) {
        return user.auth0Id
    }

    return fetchAuth0UserId(user.email)
}
