#!/usr/bin/env node

/* eslint-disable no-console, unused-imports/no-unused-vars */
/**
 * Documentation Version Checker
 *
 * Scans integration-mapping.json to find components where the code version
 * doesn't match the documented version, flagging docs that need updates.
 *
 * Usage: node scripts/check-doc-versions.js [--fix]
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
}

const MAPPING_FILE = path.join(__dirname, 'integration-mapping.json')
const shouldFix = process.argv.includes('--fix')

/**
 * Load and parse integration mapping
 */
function loadMapping() {
    try {
        const content = fs.readFileSync(MAPPING_FILE, 'utf8')
        return JSON.parse(content)
    } catch (error) {
        console.error(`${colors.red}Error loading integration-mapping.json:${colors.reset}`, error.message)
        process.exit(1)
    }
}

/**
 * Save updated mapping
 */
function saveMapping(mapping) {
    try {
        fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 4))
        console.log(`${colors.green}✓ Updated integration-mapping.json${colors.reset}`)
    } catch (error) {
        console.error(`${colors.red}Error saving integration-mapping.json:${colors.reset}`, error.message)
        process.exit(1)
    }
}

/**
 * Check if component documentation needs update
 */
function checkComponent(component, integrationKey, categoryName) {
    const issues = []

    // Check if documentation field exists
    if (!component.documentation) {
        issues.push({
            type: 'missing-docs-field',
            severity: 'warning',
            message: 'No documentation tracking field',
            component: component.name,
            integration: integrationKey,
            category: categoryName,
            suggestion: 'Add documentation field with nodeReferencePath and version tracking'
        })
        return issues
    }

    const doc = component.documentation

    // Check if node reference path exists
    if (!doc.nodeReferencePath) {
        issues.push({
            type: 'missing-node-reference',
            severity: 'warning',
            message: 'No node reference path specified',
            component: component.name,
            integration: integrationKey,
            category: categoryName,
            suggestion: `Add path like: packages/docs/docs/sidekick-studio/components/${categoryName
                .toLowerCase()
                .replace(' ', '-')}/${component.name.toLowerCase()}.md`
        })
    }

    // Check if node reference file exists
    if (doc.nodeReferencePath) {
        const fullPath = path.join(__dirname, '..', doc.nodeReferencePath)
        if (!fs.existsSync(fullPath)) {
            issues.push({
                type: 'missing-doc-file',
                severity: 'error',
                message: 'Node reference file does not exist',
                component: component.name,
                integration: integrationKey,
                category: categoryName,
                path: doc.nodeReferencePath,
                suggestion: 'Create documentation file or update path'
            })
        }
    }

    // Check version mismatch
    if (doc.docVersion !== undefined && component.version > doc.docVersion) {
        issues.push({
            type: 'version-mismatch',
            severity: 'warning',
            message: `Component v${component.version} but docs are v${doc.docVersion}`,
            component: component.name,
            integration: integrationKey,
            category: categoryName,
            componentVersion: component.version,
            docVersion: doc.docVersion,
            suggestion: 'Review component changes and update documentation'
        })

        // Auto-flag as needing update
        if (!doc.needsUpdate) {
            issues.push({
                type: 'flag-update-needed',
                severity: 'info',
                message: 'Should be flagged as needing update',
                component: component.name,
                canAutoFix: true
            })
        }
    }

    // Check review staleness (over 90 days)
    if (doc.lastDocReview) {
        const lastReview = new Date(doc.lastDocReview)
        const daysSince = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSince > 90) {
            issues.push({
                type: 'stale-review',
                severity: 'info',
                message: `Last reviewed ${Math.floor(daysSince)} days ago`,
                component: component.name,
                integration: integrationKey,
                category: categoryName,
                lastReview: doc.lastDocReview,
                suggestion: 'Schedule quarterly review'
            })
        }
    }

    return issues
}

/**
 * Check integration-level documentation
 */
function checkIntegrationDocs(integration, integrationKey) {
    const issues = []

    if (!integration.integrationDocs) {
        issues.push({
            type: 'missing-integration-docs',
            severity: 'warning',
            message: 'No integration documentation tracking',
            integration: integrationKey,
            suggestion: 'Add integrationDocs field to track marketing page'
        })
        return issues
    }

    const docs = integration.integrationDocs

    // Check marketing page
    if (!docs.hasMarketingPage) {
        issues.push({
            type: 'missing-marketing-page',
            severity: 'error',
            message: 'Integration has no marketing page',
            integration: integrationKey,
            suggestion: `Create marketing page at packages/docs/docs/integrations/${integrationKey.toLowerCase().replace('api', '')}.mdx`
        })
    }

    // Check marketing page exists
    if (docs.hasMarketingPage && docs.marketingPagePath) {
        const fullPath = path.join(__dirname, '..', docs.marketingPagePath)
        if (!fs.existsSync(fullPath)) {
            issues.push({
                type: 'missing-marketing-file',
                severity: 'error',
                message: 'Marketing page file does not exist',
                integration: integrationKey,
                path: docs.marketingPagePath,
                suggestion: 'Create marketing page or update path'
            })
        }
    }

    // Check review staleness
    if (docs.lastMarketingReview) {
        const lastReview = new Date(docs.lastMarketingReview)
        const daysSince = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSince > 90) {
            issues.push({
                type: 'stale-marketing-review',
                severity: 'info',
                message: `Marketing page last reviewed ${Math.floor(daysSince)} days ago`,
                integration: integrationKey,
                suggestion: 'Schedule quarterly review'
            })
        }
    }

    return issues
}

/**
 * Main checker
 */
function checkAllDocs() {
    console.log(`${colors.bold}${colors.cyan}Documentation Version Checker${colors.reset}\n`)

    const mapping = loadMapping()
    const allIssues = []
    const stats = {
        totalIntegrations: 0,
        totalComponents: 0,
        missingDocs: 0,
        versionMismatches: 0,
        staleReviews: 0,
        errors: 0,
        warnings: 0
    }

    // Check each integration
    for (const [integrationKey, integration] of Object.entries(mapping)) {
        stats.totalIntegrations++

        // Check integration-level docs
        const integrationIssues = checkIntegrationDocs(integration, integrationKey)
        allIssues.push(...integrationIssues)

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
                stats.totalComponents++
                const issues = checkComponent(component, integrationKey, category)
                allIssues.push(...issues)
            }
        }
    }

    // Count issue types
    for (const issue of allIssues) {
        if (issue.severity === 'error') stats.errors++
        if (issue.severity === 'warning') stats.warnings++
        if (issue.type === 'version-mismatch') stats.versionMismatches++
        if (issue.type.includes('missing')) stats.missingDocs++
        if (issue.type.includes('stale')) stats.staleReviews++
    }

    // Display results
    console.log(`${colors.bold}Scan Results:${colors.reset}`)
    console.log(`  Integrations scanned: ${stats.totalIntegrations}`)
    console.log(`  Components scanned: ${stats.totalComponents}`)
    console.log(`  ${colors.red}Errors: ${stats.errors}${colors.reset}`)
    console.log(`  ${colors.yellow}Warnings: ${stats.warnings}${colors.reset}`)
    console.log(`  Version mismatches: ${stats.versionMismatches}`)
    console.log(`  Missing docs: ${stats.missingDocs}`)
    console.log(`  Stale reviews: ${stats.staleReviews}\n`)

    if (allIssues.length === 0) {
        console.log(`${colors.green}${colors.bold}✓ All documentation is up to date!${colors.reset}`)
        return
    }

    // Group issues by severity
    const errors = allIssues.filter((i) => i.severity === 'error')
    const warnings = allIssues.filter((i) => i.severity === 'warning')
    const info = allIssues.filter((i) => i.severity === 'info')

    // Display errors
    if (errors.length > 0) {
        console.log(`${colors.red}${colors.bold}Errors (${errors.length}):${colors.reset}`)
        errors.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${colors.red}${issue.message}${colors.reset}`)
            if (issue.component) console.log(`   Component: ${issue.component}`)
            if (issue.integration) console.log(`   Integration: ${issue.integration}`)
            if (issue.path) console.log(`   Path: ${issue.path}`)
            if (issue.suggestion) console.log(`   ${colors.cyan}→ ${issue.suggestion}${colors.reset}`)
        })
        console.log()
    }

    // Display warnings
    if (warnings.length > 0) {
        console.log(`${colors.yellow}${colors.bold}Warnings (${warnings.length}):${colors.reset}`)
        warnings.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${colors.yellow}${issue.message}${colors.reset}`)
            if (issue.component) console.log(`   Component: ${issue.component}`)
            if (issue.integration) console.log(`   Integration: ${issue.integration}`)
            if (issue.componentVersion) console.log(`   Component v${issue.componentVersion} → Docs v${issue.docVersion}`)
            if (issue.suggestion) console.log(`   ${colors.cyan}→ ${issue.suggestion}${colors.reset}`)
        })
        console.log()
    }

    // Display info
    if (info.length > 0 && info.length <= 10) {
        console.log(`${colors.blue}${colors.bold}Info (${info.length}):${colors.reset}`)
        info.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue.message} (${issue.component || issue.integration})`)
        })
        console.log()
    } else if (info.length > 10) {
        console.log(`${colors.blue}Info: ${info.length} items needing attention (run with --verbose to see all)${colors.reset}\n`)
    }

    // Auto-fix suggestions
    if (shouldFix) {
        console.log(`${colors.cyan}Applying automatic fixes...${colors.reset}`)
        // TODO: Implement auto-fix logic
        console.log(`${colors.yellow}Auto-fix not yet implemented${colors.reset}`)
    } else if (allIssues.some((i) => i.canAutoFix)) {
        console.log(`${colors.cyan}Tip: Run with --fix to automatically resolve some issues${colors.reset}\n`)
    }

    process.exit(errors.length > 0 ? 1 : 0)
}

// Run checker
checkAllDocs()
