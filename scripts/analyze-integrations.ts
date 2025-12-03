#!/usr/bin/env tsx
/**
 * Integration Analysis Script
 *
 * This script analyzes all credentials, document loaders, and tools in the codebase
 * and generates a mapping between them for documentation purposes.
 *
 * Usage: tsx scripts/analyze-integrations.ts
 */

import fs from 'fs'
import { glob } from 'glob'

interface ComponentMetadata {
    label: string
    name: string
    version: number
    description?: string
    icon?: string
    category?: string
    credential?: string | string[]
    filePath: string
    type:
        | 'credential'
        | 'documentLoader'
        | 'tool'
        | 'mcp'
        | 'chatModel'
        | 'llm'
        | 'vectorStore'
        | 'embedding'
        | 'agent'
        | 'chain'
        | 'retriever'
        | 'memory'
}

interface IntegrationMap {
    [credentialName: string]: {
        credential: ComponentMetadata
        documentLoaders: ComponentMetadata[]
        tools: ComponentMetadata[]
        mcpServers: ComponentMetadata[]
        chatModels: ComponentMetadata[]
        llms: ComponentMetadata[]
        vectorStores: ComponentMetadata[]
        embeddings: ComponentMetadata[]
        agents: ComponentMetadata[]
        chains: ComponentMetadata[]
        retrievers: ComponentMetadata[]
        memory: ComponentMetadata[]
    }
}

async function extractMetadataFromFile(filePath: string): Promise<ComponentMetadata | null> {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract class definition
    const classMatch = content.match(/class\s+(\w+)\s+implements\s+INode/)
    if (!classMatch) return null

    const className = classMatch[1]

    // Extract properties
    const labelMatch = content.match(/this\.label\s*=\s*['"]([^'"]+)['"]/)
    const nameMatch = content.match(/this\.name\s*=\s*['"]([^'"]+)['"]/)
    const versionMatch = content.match(/this\.version\s*=\s*([\d.]+)/)
    const descriptionMatch = content.match(/this\.description\s*=\s*['"`]([^'"`]+)['"`]/)
    const iconMatch = content.match(/this\.icon\s*=\s*['"]([^'"]+)['"]/)
    const categoryMatch = content.match(/this\.category\s*=\s*['"]([^'"]+)['"]/)

    // Extract credential names
    const credentialNamesMatch = content.match(/credentialNames:\s*\[([^\]]+)\]/)
    let credentialNames: string[] = []
    if (credentialNamesMatch) {
        credentialNames = credentialNamesMatch[1].split(',').map((c) => c.trim().replace(/['"]/g, ''))
    }

    const metadata: ComponentMetadata = {
        label: labelMatch?.[1] || className,
        name: nameMatch?.[1] || className.toLowerCase(),
        version: parseFloat(versionMatch?.[1] || '1.0'),
        description: descriptionMatch?.[1],
        icon: iconMatch?.[1],
        category: categoryMatch?.[1],
        credential: credentialNames.length > 0 ? credentialNames : undefined,
        filePath: filePath.replace(process.cwd() + '/', ''),
        type: determineType(filePath)
    }

    return metadata
}

function determineType(
    filePath: string
):
    | 'credential'
    | 'documentLoader'
    | 'tool'
    | 'mcp'
    | 'chatModel'
    | 'llm'
    | 'vectorStore'
    | 'embedding'
    | 'agent'
    | 'chain'
    | 'retriever'
    | 'memory' {
    if (filePath.includes('/credentials/')) return 'credential'
    if (filePath.includes('/documentloaders/')) return 'documentLoader'
    if (filePath.includes('/tools/MCP/')) return 'mcp'
    if (filePath.includes('/tools/')) return 'tool'
    if (filePath.includes('/chatmodels/')) return 'chatModel'
    if (filePath.includes('/llms/')) return 'llm'
    if (filePath.includes('/vectorstores/')) return 'vectorStore'
    if (filePath.includes('/embeddings/')) return 'embedding'
    if (filePath.includes('/agents/')) return 'agent'
    if (filePath.includes('/chains/')) return 'chain'
    if (filePath.includes('/retrievers/')) return 'retriever'
    if (filePath.includes('/memory/')) return 'memory'
    return 'tool'
}

async function extractCredentialMetadata(filePath: string): Promise<ComponentMetadata | null> {
    const content = fs.readFileSync(filePath, 'utf-8')

    const classMatch = content.match(/class\s+(\w+)\s+implements\s+INodeCredential/)
    if (!classMatch) return null

    const className = classMatch[1]

    const labelMatch = content.match(/this\.label\s*=\s*['"]([^'"]+)['"]/)
    const nameMatch = content.match(/this\.name\s*=\s*['"]([^'"]+)['"]/)
    const versionMatch = content.match(/this\.version\s*=\s*([\d.]+)/)
    const descriptionMatch = content.match(/this\.description\s*=\s*['"`]([^'"`]+)['"`]/)

    return {
        label: labelMatch?.[1] || className,
        name: nameMatch?.[1] || className.toLowerCase(),
        version: parseFloat(versionMatch?.[1] || '1.0'),
        description: descriptionMatch?.[1],
        filePath: filePath.replace(process.cwd() + '/', ''),
        type: 'credential'
    }
}

async function main() {
    console.log('🔍 Analyzing integrations...\n')

    // Find all files
    const credentialFiles = await glob('packages/components/credentials/**/*.ts', { ignore: '**/*.d.ts' })
    const loaderFiles = await glob('packages/components/nodes/documentloaders/**/*.ts', { ignore: '**/*.d.ts' })
    const toolFiles = await glob('packages/components/nodes/tools/**/*.ts', { ignore: ['**/*.d.ts', '**/core.ts'] })
    const chatModelFiles = await glob('packages/components/nodes/chatmodels/**/*.ts', { ignore: '**/*.d.ts' })
    const llmFiles = await glob('packages/components/nodes/llms/**/*.ts', { ignore: '**/*.d.ts' })
    const vectorStoreFiles = await glob('packages/components/nodes/vectorstores/**/*.ts', { ignore: '**/*.d.ts' })
    const embeddingFiles = await glob('packages/components/nodes/embeddings/**/*.ts', { ignore: '**/*.d.ts' })
    const agentFiles = await glob('packages/components/nodes/agents/**/*.ts', { ignore: '**/*.d.ts' })
    const chainFiles = await glob('packages/components/nodes/chains/**/*.ts', { ignore: '**/*.d.ts' })
    const retrieverFiles = await glob('packages/components/nodes/retrievers/**/*.ts', { ignore: '**/*.d.ts' })
    const memoryFiles = await glob('packages/components/nodes/memory/**/*.ts', { ignore: '**/*.d.ts' })

    console.log(`📁 Found ${credentialFiles.length} credentials`)
    console.log(`📁 Found ${loaderFiles.length} document loaders`)
    console.log(`📁 Found ${toolFiles.length} tools`)
    console.log(`📁 Found ${chatModelFiles.length} chat models`)
    console.log(`📁 Found ${llmFiles.length} LLMs`)
    console.log(`📁 Found ${vectorStoreFiles.length} vector stores`)
    console.log(`📁 Found ${embeddingFiles.length} embeddings`)
    console.log(`📁 Found ${agentFiles.length} agents`)
    console.log(`📁 Found ${chainFiles.length} chains`)
    console.log(`📁 Found ${retrieverFiles.length} retrievers`)
    console.log(`📁 Found ${memoryFiles.length} memory components\n`)

    // Extract metadata
    const credentials: ComponentMetadata[] = []
    const allComponents: ComponentMetadata[] = []

    for (const file of credentialFiles) {
        const metadata = await extractCredentialMetadata(file)
        if (metadata) credentials.push(metadata)
    }

    // Extract all component types
    const componentFiles = [
        ...loaderFiles,
        ...toolFiles,
        ...chatModelFiles,
        ...llmFiles,
        ...vectorStoreFiles,
        ...embeddingFiles,
        ...agentFiles,
        ...chainFiles,
        ...retrieverFiles,
        ...memoryFiles
    ]

    for (const file of componentFiles) {
        const metadata = await extractMetadataFromFile(file)
        if (metadata) allComponents.push(metadata)
    }

    console.log(`✅ Extracted ${credentials.length} credential metadata`)
    console.log(`✅ Extracted ${allComponents.length} component metadata\n`)

    // Build integration map
    const integrationMap: IntegrationMap = {}

    for (const cred of credentials) {
        integrationMap[cred.name] = {
            credential: cred,
            documentLoaders: [],
            tools: [],
            mcpServers: [],
            chatModels: [],
            llms: [],
            vectorStores: [],
            embeddings: [],
            agents: [],
            chains: [],
            retrievers: [],
            memory: []
        }
    }

    // Map all components to credentials
    for (const component of allComponents) {
        if (component.credential) {
            const credNames = Array.isArray(component.credential) ? component.credential : [component.credential]
            for (const credName of credNames) {
                if (integrationMap[credName]) {
                    switch (component.type) {
                        case 'documentLoader':
                            integrationMap[credName].documentLoaders.push(component)
                            break
                        case 'tool':
                            integrationMap[credName].tools.push(component)
                            break
                        case 'mcp':
                            integrationMap[credName].mcpServers.push(component)
                            break
                        case 'chatModel':
                            integrationMap[credName].chatModels.push(component)
                            break
                        case 'llm':
                            integrationMap[credName].llms.push(component)
                            break
                        case 'vectorStore':
                            integrationMap[credName].vectorStores.push(component)
                            break
                        case 'embedding':
                            integrationMap[credName].embeddings.push(component)
                            break
                        case 'agent':
                            integrationMap[credName].agents.push(component)
                            break
                        case 'chain':
                            integrationMap[credName].chains.push(component)
                            break
                        case 'retriever':
                            integrationMap[credName].retrievers.push(component)
                            break
                        case 'memory':
                            integrationMap[credName].memory.push(component)
                            break
                    }
                }
            }
        }
    }

    // Calculate statistics
    const hasAnyComponent = (integration: IntegrationMap[string]) =>
        integration.documentLoaders.length > 0 ||
        integration.tools.length > 0 ||
        integration.mcpServers.length > 0 ||
        integration.chatModels.length > 0 ||
        integration.llms.length > 0 ||
        integration.vectorStores.length > 0 ||
        integration.embeddings.length > 0 ||
        integration.agents.length > 0 ||
        integration.chains.length > 0 ||
        integration.retrievers.length > 0 ||
        integration.memory.length > 0

    const credentialsWithComponents = Object.values(integrationMap).filter(hasAnyComponent)
    const credentialsWithoutComponents = Object.values(integrationMap).filter((i) => !hasAnyComponent(i))

    console.log('📊 Integration Statistics:')
    console.log(`   Total Credentials: ${credentials.length}`)
    console.log(`   Credentials with Components: ${credentialsWithComponents.length}`)
    console.log(`   Credentials without Components (Orphaned): ${credentialsWithoutComponents.length}`)
    console.log(`   Total Components: ${allComponents.length}`)
    console.log(`     - Document Loaders: ${allComponents.filter((c) => c.type === 'documentLoader').length}`)
    console.log(`     - Tools: ${allComponents.filter((c) => c.type === 'tool').length}`)
    console.log(`     - MCP Servers: ${allComponents.filter((c) => c.type === 'mcp').length}`)
    console.log(`     - Chat Models: ${allComponents.filter((c) => c.type === 'chatModel').length}`)
    console.log(`     - LLMs: ${allComponents.filter((c) => c.type === 'llm').length}`)
    console.log(`     - Vector Stores: ${allComponents.filter((c) => c.type === 'vectorStore').length}`)
    console.log(`     - Embeddings: ${allComponents.filter((c) => c.type === 'embedding').length}`)
    console.log(`     - Agents: ${allComponents.filter((c) => c.type === 'agent').length}`)
    console.log(`     - Chains: ${allComponents.filter((c) => c.type === 'chain').length}`)
    console.log(`     - Retrievers: ${allComponents.filter((c) => c.type === 'retriever').length}`)
    console.log(`     - Memory: ${allComponents.filter((c) => c.type === 'memory').length}\n`)

    // Save results
    const outputPath = 'scripts/integration-mapping.json'
    fs.writeFileSync(outputPath, JSON.stringify(integrationMap, null, 2))
    console.log(`💾 Saved integration mapping to ${outputPath}`)

    // Generate summary report
    const reportPath = 'scripts/integration-report.md'
    const report = generateReport(integrationMap, credentialsWithoutComponents)
    fs.writeFileSync(reportPath, report)
    console.log(`📝 Generated report at ${reportPath}`)
}

function generateReport(integrationMap: IntegrationMap, orphanedCredentials: any[]): string {
    let report = '# Integration Analysis Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`

    report += '## Summary\n\n'
    report += `- **Total Integrations:** ${Object.keys(integrationMap).length}\n`
    report += `- **With Components:** ${Object.keys(integrationMap).length - orphanedCredentials.length}\n`
    report += `- **Without Components:** ${orphanedCredentials.length}\n\n`

    report += '## Integrations with Components\n\n'

    for (const [credName, integration] of Object.entries(integrationMap)) {
        const hasComponents =
            integration.documentLoaders.length > 0 ||
            integration.tools.length > 0 ||
            integration.mcpServers.length > 0 ||
            integration.chatModels.length > 0 ||
            integration.llms.length > 0 ||
            integration.vectorStores.length > 0 ||
            integration.embeddings.length > 0 ||
            integration.agents.length > 0 ||
            integration.chains.length > 0 ||
            integration.retrievers.length > 0 ||
            integration.memory.length > 0

        if (!hasComponents) continue

        report += `### ${integration.credential.label}\n\n`
        report += `**Credential:** \`${credName}\`\n\n`

        if (integration.chatModels.length > 0) {
            report += '**Chat Models:**\n'
            for (const model of integration.chatModels) {
                report += `- ${model.label} (\`${model.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.llms.length > 0) {
            report += '**LLMs:**\n'
            for (const llm of integration.llms) {
                report += `- ${llm.label} (\`${llm.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.embeddings.length > 0) {
            report += '**Embeddings:**\n'
            for (const embedding of integration.embeddings) {
                report += `- ${embedding.label} (\`${embedding.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.vectorStores.length > 0) {
            report += '**Vector Stores:**\n'
            for (const store of integration.vectorStores) {
                report += `- ${store.label} (\`${store.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.documentLoaders.length > 0) {
            report += '**Document Loaders:**\n'
            for (const loader of integration.documentLoaders) {
                report += `- ${loader.label} (\`${loader.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.tools.length > 0) {
            report += '**Tools:**\n'
            for (const tool of integration.tools) {
                report += `- ${tool.label} (\`${tool.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.mcpServers.length > 0) {
            report += '**MCP Servers:**\n'
            for (const mcp of integration.mcpServers) {
                report += `- ${mcp.label} (\`${mcp.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.agents.length > 0) {
            report += '**Agents:**\n'
            for (const agent of integration.agents) {
                report += `- ${agent.label} (\`${agent.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.chains.length > 0) {
            report += '**Chains:**\n'
            for (const chain of integration.chains) {
                report += `- ${chain.label} (\`${chain.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.retrievers.length > 0) {
            report += '**Retrievers:**\n'
            for (const retriever of integration.retrievers) {
                report += `- ${retriever.label} (\`${retriever.name}\`)\n`
            }
            report += '\n'
        }

        if (integration.memory.length > 0) {
            report += '**Memory:**\n'
            for (const mem of integration.memory) {
                report += `- ${mem.label} (\`${mem.name}\`)\n`
            }
            report += '\n'
        }
    }

    if (orphanedCredentials.length > 0) {
        report += '## ⚠️ Orphaned Credentials\n\n'
        report += 'These credentials exist but have NO associated components (no loaders, tools, models, etc.):\n\n'
        report += '| Credential Name | Label | File Path |\n'
        report += '|-----------------|-------|----------|\n'

        for (const integration of orphanedCredentials) {
            const credName = integration.credential.name
            const credLabel = integration.credential.label
            const filePath = integration.credential.filePath
            report += `| \`${credName}\` | ${credLabel} | \`${filePath}\` |\n`
        }
        report += '\n'
        report +=
            '**Note:** These credentials may be used for custom implementations or are legacy credentials that are no longer in use.\n'
    }

    return report
}

main().catch(console.error)
