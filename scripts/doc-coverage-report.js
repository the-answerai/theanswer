#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Documentation Coverage Report
 *
 * Generates a comprehensive report of documentation coverage across
 * all integrations and components based on ACTUAL file existence.
 *
 * Usage: node scripts/doc-coverage-report.js [--format=json|markdown|html]
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
}

const MAPPING_FILE = path.join(__dirname, 'integration-mapping.json')
const DOCS_DIR = path.join(__dirname, '..', 'packages', 'docs', 'docs')
const INTEGRATIONS_DIR = path.join(DOCS_DIR, 'integrations')

const format = process.argv.find((arg) => arg.startsWith('--format='))?.split('=')[1] || 'console'

/**
 * Calculate coverage percentage
 */
function calculatePercentage(have, total) {
    if (total === 0) return 100
    return Math.round((have / total) * 100)
}

/**
 * Check if integration has marketing page
 */
function hasMarketingPage(integrationKey) {
    // Try common naming patterns
    const base = integrationKey
        .replace(/Api$/, '')
        .replace(/OAuth$/, '')
        .replace(/Management/, '')
        .replace(/Delivery/, '')
        .toLowerCase()

    const patterns = [
        `${integrationKey}.mdx`,
        `${integrationKey}.md`,
        `${integrationKey.replace('Api', '')}.mdx`,
        `${integrationKey.replace('Api', '').toLowerCase()}.mdx`,
        `${base}.mdx`,
        `${base}.md`,
        // Special cases for multi-word integrations
        `${integrationKey
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '')
            .replace('api', '')
            .replace('--', '-')}.mdx`
    ]

    for (const pattern of patterns) {
        const filePath = path.join(INTEGRATIONS_DIR, pattern)
        if (fs.existsSync(filePath)) {
            return { exists: true, path: `packages/docs/docs/integrations/${pattern}` }
        }
    }

    return { exists: false, path: null }
}

/**
 * Get expected component doc path based on category
 */
function getExpectedComponentPath(component, category) {
    const categoryMap = {
        documentLoaders: 'document-loaders',
        tools: 'tools',
        mcpServers: 'tools-mcp',
        chatModels: 'chat-models',
        llms: 'llms',
        vectorStores: 'vector-stores',
        embeddings: 'embeddings',
        agents: 'agents',
        chains: 'chains',
        retrievers: 'retrievers',
        memory: 'memory'
    }

    const categoryDir = categoryMap[category] || category.toLowerCase()

    // Convert component name to kebab-case
    // Examples: githubMCP -> github-mcp, ChatOpenAI -> chat-open-ai
    let componentName = component.name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Add dash before capitals
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // Handle consecutive capitals (MCP -> m-cp)
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/--+/g, '-') // Remove double dashes

    return `packages/docs/docs/sidekick-studio/chatflows/${categoryDir}/${componentName}.md`
}

/**
 * Check if component has node reference documentation
 */
function hasNodeReference(component, category) {
    const expectedPath = getExpectedComponentPath(component, category)
    const fullPath = path.join(__dirname, '..', expectedPath)

    if (fs.existsSync(fullPath)) {
        return { exists: true, path: expectedPath }
    }

    // Try alternative paths
    const altPaths = [
        `${fullPath}x`, // .mdx instead of .md
        fullPath.replace('.md', '.mdx'),
        fullPath.replace(/-mcp\.md$/, '.md'), // without -mcp suffix
        // Try label-based path (for inconsistent naming like sfdcMCP -> salesforce-mcp.md)
        fullPath.replace(/[^/]+\.md$/, `${component.label.toLowerCase().replace(/\s+/g, '-')}.md`)
    ]

    for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
            return {
                exists: true,
                path: altPath.replace(path.join(__dirname, '..') + '/', '')
            }
        }
    }

    return { exists: false, path: expectedPath }
}

/**
 * Generate coverage report
 */
function generateCoverageReport() {
    const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'))

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalIntegrations: 0,
            integrationsWithMarketingPage: 0,
            totalComponents: 0,
            componentsWithNodeReference: 0,
            componentsWithVersionTracking: 0,
            componentsNeedingUpdate: 0
        },
        integrations: [],
        byCategory: {},
        missingDocs: {
            marketingPages: [],
            nodeReferences: []
        }
    }

    // Analyze each integration
    for (const [integrationKey, integration] of Object.entries(mapping)) {
        report.summary.totalIntegrations++

        const integrationReport = {
            key: integrationKey,
            name: integrationKey,
            hasMarketingPage: false,
            marketingPagePath: null,
            category: null,
            components: {
                total: 0,
                withDocs: 0,
                needingUpdate: 0
            },
            componentDetails: []
        }

        // Check for marketing page
        const marketingPage = hasMarketingPage(integrationKey)
        integrationReport.hasMarketingPage = marketingPage.exists
        integrationReport.marketingPagePath = marketingPage.path

        if (marketingPage.exists) {
            report.summary.integrationsWithMarketingPage++
        } else {
            report.missingDocs.marketingPages.push({
                integration: integrationKey,
                suggestedPath: `packages/docs/docs/integrations/${integrationKey.replace('Api', '').toLowerCase()}.mdx`
            })
        }

        // Check all component categories
        const categories = [
            'documentLoaders',
            'tools',
            'mcpServers',
            'chatModels',
            'llms',
            'vectorStores',
            'embeddings',
            'agents',
            'chains',
            'retrievers',
            'memory'
        ]

        for (const category of categories) {
            const components = integration[category] || []

            for (const component of components) {
                report.summary.totalComponents++
                integrationReport.components.total++

                // Initialize category tracking
                if (!report.byCategory[category]) {
                    report.byCategory[category] = {
                        total: 0,
                        withDocs: 0,
                        coverage: 0
                    }
                }
                report.byCategory[category].total++

                const componentDetail = {
                    name: component.name,
                    label: component.label,
                    version: component.version,
                    category: category,
                    hasNodeReference: false,
                    hasVersionTracking: false,
                    needsUpdate: false,
                    nodeReferencePath: null
                }

                // Check for node reference
                const nodeRef = hasNodeReference(component, category)
                componentDetail.hasNodeReference = nodeRef.exists
                componentDetail.nodeReferencePath = nodeRef.path

                if (nodeRef.exists) {
                    report.summary.componentsWithNodeReference++
                    integrationReport.components.withDocs++
                    report.byCategory[category].withDocs++
                } else {
                    report.missingDocs.nodeReferences.push({
                        component: component.name,
                        label: component.label,
                        integration: integrationKey,
                        category: category,
                        suggestedPath: nodeRef.path
                    })
                }

                // Check if component has version tracking in mapping
                if (component.documentation && component.documentation.docVersion !== undefined) {
                    componentDetail.hasVersionTracking = true
                    report.summary.componentsWithVersionTracking++

                    // Check for version mismatch
                    if (component.version > component.documentation.docVersion) {
                        componentDetail.needsUpdate = true
                        report.summary.componentsNeedingUpdate++
                        integrationReport.components.needingUpdate++
                    }
                }

                integrationReport.componentDetails.push(componentDetail)
            }
        }

        // Calculate integration coverage
        integrationReport.components.coverage = calculatePercentage(
            integrationReport.components.withDocs,
            integrationReport.components.total
        )

        report.integrations.push(integrationReport)
    }

    // Calculate category coverage
    for (const category in report.byCategory) {
        report.byCategory[category].coverage = calculatePercentage(report.byCategory[category].withDocs, report.byCategory[category].total)
    }

    // Calculate overall coverage
    report.summary.marketingPageCoverage = calculatePercentage(
        report.summary.integrationsWithMarketingPage,
        report.summary.totalIntegrations
    )
    report.summary.nodeReferenceCoverage = calculatePercentage(report.summary.componentsWithNodeReference, report.summary.totalComponents)
    report.summary.overallCoverage = Math.round((report.summary.marketingPageCoverage + report.summary.nodeReferenceCoverage) / 2)

    return report
}

/**
 * Display console report
 */
function displayConsoleReport(report) {
    console.log(`${colors.bold}${colors.cyan}Documentation Coverage Report${colors.reset}`)
    console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}\n`)

    // Summary
    console.log(`${colors.bold}Summary:${colors.reset}`)
    console.log(
        `  Overall Coverage: ${getColorForPercentage(report.summary.overallCoverage)}${report.summary.overallCoverage}%${colors.reset}`
    )
    console.log(
        `  Marketing Pages: ${getColorForPercentage(report.summary.marketingPageCoverage)}${report.summary.marketingPageCoverage}%${
            colors.reset
        } (${report.summary.integrationsWithMarketingPage}/${report.summary.totalIntegrations})`
    )
    console.log(
        `  Node References: ${getColorForPercentage(report.summary.nodeReferenceCoverage)}${report.summary.nodeReferenceCoverage}%${
            colors.reset
        } (${report.summary.componentsWithNodeReference}/${report.summary.totalComponents})`
    )
    console.log(`  Components with version tracking: ${report.summary.componentsWithVersionTracking}`)
    console.log(`  ${colors.yellow}Components needing update: ${report.summary.componentsNeedingUpdate}${colors.reset}\n`)

    // Coverage by category
    console.log(`${colors.bold}Coverage by Category:${colors.reset}`)
    const sortedCategories = Object.entries(report.byCategory).sort(([, a], [, b]) => b.total - a.total)

    for (const [category, data] of sortedCategories) {
        const bar = generateProgressBar(data.coverage, 20)
        console.log(
            `  ${category.padEnd(20)} ${bar} ${getColorForPercentage(data.coverage)}${data.coverage}%${colors.reset} (${data.withDocs}/${
                data.total
            })`
        )
    }
    console.log()

    // Top integrations by coverage
    console.log(`${colors.bold}Top Integrations by Coverage:${colors.reset}`)
    const sortedIntegrations = report.integrations
        .filter((i) => i.components.total > 0)
        .sort((a, b) => b.components.coverage - a.components.coverage)
        .slice(0, 15)

    for (const integration of sortedIntegrations) {
        const bar = generateProgressBar(integration.components.coverage, 20)
        const marketingIcon = integration.hasMarketingPage ? '✓' : '✗'
        console.log(
            `  ${marketingIcon} ${integration.key.padEnd(30)} ${bar} ${getColorForPercentage(integration.components.coverage)}${
                integration.components.coverage
            }%${colors.reset}`
        )
    }
    console.log()

    // Missing marketing pages
    if (report.missingDocs.marketingPages.length > 0) {
        console.log(`${colors.yellow}${colors.bold}Missing Marketing Pages (${report.missingDocs.marketingPages.length}):${colors.reset}`)
        report.missingDocs.marketingPages.slice(0, 10).forEach((item) => {
            console.log(`  • ${item.integration}`)
            if (item.suggestedPath) console.log(`    ${colors.cyan}→ ${item.suggestedPath}${colors.reset}`)
        })
        if (report.missingDocs.marketingPages.length > 10) {
            console.log(`  ... and ${report.missingDocs.marketingPages.length - 10} more`)
        }
        console.log()
    }

    // Missing node references
    if (report.missingDocs.nodeReferences.length > 0) {
        console.log(`${colors.yellow}${colors.bold}Missing Node References (${report.missingDocs.nodeReferences.length}):${colors.reset}`)

        // Group by integration
        const byIntegration = {}
        for (const item of report.missingDocs.nodeReferences) {
            if (!byIntegration[item.integration]) {
                byIntegration[item.integration] = []
            }
            byIntegration[item.integration].push(item)
        }

        let shown = 0
        for (const [integration, items] of Object.entries(byIntegration)) {
            if (shown >= 10) break
            console.log(`  ${colors.bold}${integration}:${colors.reset}`)
            for (const item of items.slice(0, 3)) {
                console.log(`    • ${item.label} (${item.category})`)
                shown++
            }
            if (items.length > 3) {
                console.log(`    ... and ${items.length - 3} more`)
            }
        }

        if (report.missingDocs.nodeReferences.length > 10) {
            console.log(`  ... ${report.missingDocs.nodeReferences.length - shown} more missing across other integrations`)
        }
        console.log()
    }

    // Integrations with complete documentation
    const completeIntegrations = report.integrations.filter(
        (i) => i.hasMarketingPage && i.components.total > 0 && i.components.coverage === 100
    )

    if (completeIntegrations.length > 0) {
        console.log(`${colors.green}${colors.bold}✓ Complete Documentation (${completeIntegrations.length}):${colors.reset}`)
        completeIntegrations.forEach((i) => {
            console.log(`  ${colors.green}✓${colors.reset} ${i.key} (${i.components.total} components)`)
        })
        console.log()
    }

    // Recommendations
    console.log(`${colors.bold}${colors.cyan}Recommendations:${colors.reset}`)
    if (report.summary.marketingPageCoverage < 100) {
        console.log(`  • Create ${report.missingDocs.marketingPages.length} missing marketing pages`)
    }
    if (report.summary.nodeReferenceCoverage < 100) {
        console.log(`  • Create ${report.missingDocs.nodeReferences.length} missing node reference docs`)
    }
    if (report.summary.componentsNeedingUpdate > 0) {
        console.log(`  • Update ${report.summary.componentsNeedingUpdate} outdated component docs`)
    }
    if (report.summary.componentsWithVersionTracking === 0) {
        console.log(`  ${colors.yellow}• Consider adding version tracking to integration-mapping.json${colors.reset}`)
    }
    if (report.summary.overallCoverage === 100) {
        console.log(`  ${colors.green}✓ Documentation is complete!${colors.reset}`)
    }
}

/**
 * Helper functions
 */
function getColorForPercentage(percent) {
    if (percent >= 80) return colors.green
    if (percent >= 50) return colors.yellow
    return colors.red
}

function generateProgressBar(percent, width) {
    const filled = Math.round((percent / 100) * width)
    const empty = width - filled
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']'
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report) {
    let md = `# Documentation Coverage Report\n\n`
    md += `Generated: ${new Date(report.timestamp).toLocaleString()}\n\n`

    md += `## Summary\n\n`
    md += `- **Overall Coverage**: ${report.summary.overallCoverage}%\n`
    md += `- **Marketing Pages**: ${report.summary.marketingPageCoverage}% (${report.summary.integrationsWithMarketingPage}/${report.summary.totalIntegrations})\n`
    md += `- **Node References**: ${report.summary.nodeReferenceCoverage}% (${report.summary.componentsWithNodeReference}/${report.summary.totalComponents})\n`
    md += `- **Components Needing Update**: ${report.summary.componentsNeedingUpdate}\n\n`

    md += `## Coverage by Category\n\n`
    md += `| Category | Coverage | With Docs | Total |\n`
    md += `|----------|----------|-----------|-------|\n`

    for (const [category, data] of Object.entries(report.byCategory).sort(([, a], [, b]) => b.total - a.total)) {
        md += `| ${category} | ${data.coverage}% | ${data.withDocs} | ${data.total} |\n`
    }

    md += `\n## Complete Integrations\n\n`
    const completeIntegrations = report.integrations.filter(
        (i) => i.hasMarketingPage && i.components.total > 0 && i.components.coverage === 100
    )
    completeIntegrations.forEach((i) => {
        md += `- ✓ ${i.key} (${i.components.total} components)\n`
    })

    md += `\n## Missing Documentation\n\n`
    md += `### Marketing Pages (${report.missingDocs.marketingPages.length})\n\n`
    report.missingDocs.marketingPages.forEach((item) => {
        md += `- ${item.integration}\n`
    })

    md += `\n### Node References (${report.missingDocs.nodeReferences.length})\n\n`

    // Group by integration
    const byIntegration = {}
    for (const item of report.missingDocs.nodeReferences) {
        if (!byIntegration[item.integration]) {
            byIntegration[item.integration] = []
        }
        byIntegration[item.integration].push(item)
    }

    for (const [integration, items] of Object.entries(byIntegration)) {
        md += `#### ${integration}\n`
        items.forEach((item) => {
            md += `- ${item.label} (${item.category})\n`
        })
        md += `\n`
    }

    return md
}

/**
 * Main execution
 */
const report = generateCoverageReport()

switch (format) {
    case 'json':
        console.log(JSON.stringify(report, null, 2))
        break
    case 'markdown':
        console.log(generateMarkdownReport(report))
        break
    case 'html':
        console.error('HTML format not yet implemented')
        process.exit(1)
        break
    default:
        displayConsoleReport(report)
}
