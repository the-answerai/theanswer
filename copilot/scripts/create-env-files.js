#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Copilot Environment File Creator
 *
 * This script replaces the bash version with reliable JavaScript logic
 * that eliminates sed pattern matching issues and provides consistent results.
 *
 * Usage: node create-env-files.js [environment|application_name] [--auto-templates]
 */

const fs = require('fs')
const readline = require('readline')
const crypto = require('crypto')
const { execSync } = require('child_process')

// ==================================================
// CONFIGURATION
// ==================================================

const CONFIG = {
    // Variables to check for proper configuration validation
    // Format: { variable: ['flowise', 'web'] } - specify which services require each variable
    // Examples:
    // - ['flowise', 'web'] = required for both services
    // - ['flowise'] = only required for Flowise
    // - ['web'] = only required for Web service
    CONFIGURATION_VALIDATION_VARS: {
        AUTH0_JWKS_URI: ['flowise', 'web'],
        AUTH0_ISSUER_BASE_URL: ['flowise', 'web'],
        AUTH0_BASE_URL: ['flowise', 'web'],
        AUTH0_AUDIENCE: ['flowise', 'web'],
        AUTH0_SCOPE: ['flowise', 'web'],
        AUTH0_TOKEN_SIGN_ALG: ['flowise', 'web'],
        AUTH0_DOMAIN: ['flowise', 'web'],
        AUTH0_ORGANIZATION_ID: ['flowise', 'web'],
        AUTH0_CLIENT_ID: ['flowise', 'web'],
        AUTH0_CLIENT_SECRET: ['flowise', 'web'],
        AAI_DEFAULT_OPENAI_API_KEY: ['flowise']
    },

    // Variabless that should default to these values and only be modified by the user if needed and understanding the implications.
    FIXED_DEFAULTS: {
        APIKEY_PATH: '/var/efs/',
        SECRETKEY_PATH: '/var/efs/',
        LOG_PATH: '/var/efs/logs',
        DISABLE_FLOWISE_TELEMETRY: 'true',
        IFRAME_ORIGINS: '*',
        CORS_ORIGINS: '*',
        APIKEY_STORAGE_TYPE: 'db',
        AUTH0_SCOPE: '"openid profile email"',
        AUTH0_TOKEN_SIGN_ALG: 'RS256'
    },

    // Production-safe debug settings (can be overridden)
    DEBUG_PRODUCTION: {
        DEBUG: 'false',
        VERBOSE: 'false',
        AUTH_DEBUG: 'false',
        LOG_LEVEL: 'warn',
        DEBUG_LOG_LEVEL: 'warn'
    },

    // Debug mode settings
    DEBUG_ENABLED: {
        DEBUG: 'true',
        VERBOSE: 'true',
        AUTH_DEBUG: 'true',
        LOG_LEVEL: 'debug',
        DEBUG_LOG_LEVEL: 'debug'
    },

    // Optional services
    OPTIONAL_SERVICES: {
        FLAGSMITH: ['FLAGSMITH_ENVIRONMENT_ID'],
        LANGFUSE: ['LANGFUSE_SECRET_KEY', 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_HOST']
    },

    // Template file paths
    TEMPLATES: {
        FLOWISE: 'copilot/copilot.appName.env.template',
        WEB: 'copilot/copilot.appName.web.env.template'
    }
}

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

class Logger {
    static colors = {
        RED: '\x1b[31m',
        GREEN: '\x1b[32m',
        YELLOW: '\x1b[33m',
        BLUE: '\x1b[34m',
        CYAN: '\x1b[36m',
        BOLD: '\x1b[1m',
        RESET: '\x1b[0m'
    }

    static error(message) {
        console.error(`${this.colors.RED}❌ ${message}${this.colors.RESET}`)
    }

    static success(message) {
        console.log(`${this.colors.GREEN}✅ ${message}${this.colors.RESET}`)
    }

    static warning(message) {
        console.log(`${this.colors.YELLOW}⚠️  ${message}${this.colors.RESET}`)
    }

    static info(message) {
        console.log(`${this.colors.BLUE}ℹ️  ${message}${this.colors.RESET}`)
    }

    static step(message) {
        console.log(`${this.colors.BOLD}${this.colors.CYAN}🔧 ${message}${this.colors.RESET}`)
    }
}

class SecretGenerator {
    static sessionSecret() {
        return crypto.randomBytes(64).toString('base64')
    }

    static auth0Secret() {
        return crypto.randomBytes(32).toString('hex')
    }

    static flowiseApiKey() {
        return crypto.randomBytes(32).toString('base64')
    }
}

class EnvFileManager {
    constructor(templatePath, outputPath) {
        this.templatePath = templatePath
        this.outputPath = outputPath
        this.variables = new Map()
        this.template = ''
    }

    loadTemplate() {
        if (!fs.existsSync(this.templatePath)) {
            throw new Error(`Template file not found: ${this.templatePath}`)
        }
        this.template = fs.readFileSync(this.templatePath, 'utf8')
        Logger.info(`Loaded template: ${this.templatePath}`)
    }

    setVariable(name, value) {
        if (typeof name !== 'string' || !name.match(/^[A-Z_][A-Z0-9_]*$/)) {
            throw new Error(`Invalid variable name: ${name}`)
        }
        this.variables.set(name, String(value))
    }

    setVariables(vars) {
        Object.entries(vars).forEach(([name, value]) => {
            this.setVariable(name, value)
        })
    }

    generateFile() {
        let content = this.template

        // Replace variables in a bulletproof way
        for (const [name, value] of this.variables) {
            // Handle different formats in template:
            // 1. NAME=value
            // 2. NAME=  # comment
            // 3. NAME=
            // 4. # NAME=value (commented)

            const patterns = [
                // Uncommented variable with any value
                new RegExp(`^(${name})=.*$`, 'gm'),
                // Commented variable
                new RegExp(`^#\\s*(${name})=.*$`, 'gm'),
                // Variable with trailing comment
                new RegExp(`^(${name})=.*#.*$`, 'gm')
            ]

            let replaced = false
            for (const pattern of patterns) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, `${name}=${value}`)
                    replaced = true
                    break
                }
            }

            // If variable doesn't exist in template, append it
            if (!replaced) {
                content += `\n${name}=${value}`
            }
        }

        return content
    }

    writeFile() {
        const content = this.generateFile()
        fs.writeFileSync(this.outputPath, content, 'utf8')
        Logger.success(`Created: ${this.outputPath}`)
    }

    exists() {
        return fs.existsSync(this.outputPath)
    }

    getSize() {
        if (!this.exists()) return 0
        return fs.statSync(this.outputPath).size
    }

    getModified() {
        if (!this.exists()) return null
        return fs.statSync(this.outputPath).mtime
    }
}

class UserInput {
    static createInterface() {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
    }

    static async prompt(message, required = false) {
        const rl = this.createInterface()

        return new Promise((resolve) => {
            const ask = () => {
                rl.question(`📝 ${message}: `, (answer) => {
                    if (required && !answer.trim()) {
                        Logger.warning('This field is required. Please enter a value.')
                        ask()
                    } else {
                        rl.close()
                        resolve(answer.trim())
                    }
                })
            }
            ask()
        })
    }

    static async confirm(message, defaultValue = false) {
        const rl = this.createInterface()
        const defaultText = defaultValue ? 'Y/n' : 'y/N'

        return new Promise((resolve) => {
            const ask = () => {
                rl.question(`${message} (${defaultText}): `, (answer) => {
                    const trimmed = answer.trim().toLowerCase()

                    if (!trimmed) {
                        // Empty input - use default
                        rl.close()
                        resolve(defaultValue)
                    } else if (['y', 'yes'].includes(trimmed)) {
                        rl.close()
                        resolve(true)
                    } else if (['n', 'no'].includes(trimmed)) {
                        rl.close()
                        resolve(false)
                    } else {
                        Logger.warning('Please answer y/yes or n/no')
                        ask()
                    }
                })
            }
            ask()
        })
    }

    static async choice(message, options, defaultChoice = 0) {
        const rl = this.createInterface()

        console.log(`\n${message}`)
        options.forEach((option, index) => {
            console.log(`${index + 1}) ${option}`)
        })

        return new Promise((resolve) => {
            const ask = () => {
                rl.question(`\nSelect option (1-${options.length}): `, (answer) => {
                    const choice = parseInt(answer) - 1
                    if (isNaN(choice) || choice < 0 || choice >= options.length) {
                        if (!answer.trim() && defaultChoice >= 0) {
                            rl.close()
                            resolve(defaultChoice)
                        } else {
                            Logger.warning(`Invalid choice. Please enter 1-${options.length}.`)
                            ask()
                        }
                    } else {
                        rl.close()
                        resolve(choice)
                    }
                })
            }
            ask()
        })
    }

    static async choiceWithTimeout(message, options, defaultChoice = 0, timeoutMs = 15000) {
        const rl = this.createInterface()

        console.log(`\n${message}`)
        options.forEach((option, index) => {
            console.log(`${index + 1}) ${option}`)
        })

        return new Promise((resolve) => {
            let timeoutId
            let resolved = false

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId)
                if (!resolved) {
                    resolved = true
                    rl.close()
                }
            }

            // Set up timeout
            timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true
                    rl.close()
                    console.log(`\n⏭️  No input after ${timeoutMs / 1000}s — proceeding with deployment.`)
                    resolve(defaultChoice)
                }
            }, timeoutMs)

            const ask = () => {
                rl.question(`\nEnter choice (1-${options.length}) [auto-proceed in ${timeoutMs / 1000}s]: `, (answer) => {
                    if (resolved) return

                    const choice = parseInt(answer) - 1
                    if (isNaN(choice) || choice < 0 || choice >= options.length) {
                        if (!answer.trim()) {
                            // Empty input - use default
                            cleanup()
                            resolve(defaultChoice)
                        } else {
                            Logger.warning(`Invalid choice. Please enter 1-${options.length}.`)
                            ask()
                        }
                    } else {
                        cleanup()
                        resolve(choice)
                    }
                })
            }
            ask()
        })
    }
}

// ==================================================
// MAIN APPLICATION CLASS
// ==================================================

class EnvironmentFileCreator {
    constructor() {
        this.appName = ''
        this.explicitEnv = ''
        this.autoTemplates = false
        this.sharedSecrets = {}
        this.sharedAuth0 = {}
        this.debugSettings = {}
    }

    parseArguments() {
        const args = process.argv.slice(2)

        // Handle flags
        this.autoTemplates = args.includes('--auto-templates')
        const positionalArgs = args.filter((arg) => !arg.startsWith('--'))

        // Get app name from arguments or .workspace file
        if (positionalArgs.length > 0) {
            const firstArg = positionalArgs[0]
            if (['staging', 'prod'].includes(firstArg)) {
                this.explicitEnv = firstArg
                this.appName = this.getAppNameFromWorkspace()
            } else {
                this.appName = firstArg
            }
        } else {
            this.appName = this.getAppNameFromWorkspace()
        }

        if (!this.appName) {
            Logger.error('No application name provided and no copilot/.workspace file found')
            Logger.info('Usage: node create-env-files.js [environment|application_name] [--auto-templates]')
            process.exit(1)
        }

        Logger.info(`Target application: ${this.appName}`)
        if (this.explicitEnv) {
            Logger.info(`Explicit environment: ${this.explicitEnv}`)
        }
    }

    getAppNameFromWorkspace() {
        const workspacePath = 'copilot/.workspace'
        if (!fs.existsSync(workspacePath)) {
            return null
        }

        try {
            const content = fs.readFileSync(workspacePath, 'utf8')
            const match = content.match(/application:\s*(.+)/)
            return match ? match[1].trim() : null
        } catch (error) {
            Logger.error(`Failed to read workspace file: ${error.message}`)
            return null
        }
    }

    generateSecrets() {
        Logger.step('Generating secure secrets...')
        this.sharedSecrets = {
            SESSION_SECRET: SecretGenerator.sessionSecret(),
            AUTH0_SECRET: SecretGenerator.auth0Secret(),
            FLOWISE_API_KEY: SecretGenerator.flowiseApiKey()
        }
        Logger.success('Generated SESSION_SECRET, AUTH0_SECRET, and FLOWISE_API_KEY')
    }

    async configureDebugSettings() {
        Logger.step('Debug Configuration for Both Services')
        console.log('========================================')
        console.log('⚠️  IMPORTANT: Debug settings should be DISABLED in production!')
        console.log('   Production values: DEBUG=false, VERBOSE=false, AUTH_DEBUG=false, LOG_LEVEL=warn')
        console.log('💡 This setting will be applied to both Flowise and Web services.')

        const enableDebug = await UserInput.confirm('Enable debug mode for first run?', false)

        if (enableDebug) {
            Logger.success('Enabling debug mode for both services')
            this.debugSettings = { ...CONFIG.DEBUG_ENABLED }
            console.log('   • DEBUG = true (enabled for debugging)')
            console.log('   • VERBOSE = true (enabled for verbose logging)')
            console.log('   • AUTH_DEBUG = true (enabled for auth debugging)')
            console.log('   • LOG_LEVEL = debug (set to debug level)')
            console.log('   • DEBUG_LOG_LEVEL = debug (set to debug level)')
            console.log('💡 Remember to disable these in production!')
        } else {
            Logger.success('Using production-safe debug settings for both services')
            this.debugSettings = { ...CONFIG.DEBUG_PRODUCTION }
            console.log('   • DEBUG = false (disabled for production)')
            console.log('   • VERBOSE = false (disabled for production)')
            console.log('   • AUTH_DEBUG = false (disabled for production)')
            console.log('   • LOG_LEVEL = warn (set to warning level)')
            console.log('   • DEBUG_LOG_LEVEL = warn (set to warning level)')
        }
    }

    async collectAuth0Variables() {
        Logger.step('Required Authentication & API Variables')
        console.log('==========================================')

        // Start with domain to auto-generate derived URLs
        const domain = await UserInput.prompt('Auth0 Domain (e.g., example-ai.us.auth0.com)', true)

        this.sharedAuth0 = {
            AUTH0_DOMAIN: `"${domain}"`,
            AUTH0_ISSUER_BASE_URL: `https://${domain}`,
            AUTH0_JWKS_URI: `https://${domain}/.well-known/jwks.json`
        }

        Logger.success('Auto-generated from AUTH0_DOMAIN:')
        console.log(`   • AUTH0_ISSUER_BASE_URL = ${this.sharedAuth0.AUTH0_ISSUER_BASE_URL}`)
        console.log(`   • AUTH0_JWKS_URI = ${this.sharedAuth0.AUTH0_JWKS_URI}`)

        // Collect remaining required variables
        const baseUrl = await UserInput.prompt('Auth0 Base URL (should match your deployment domain)', true)
        this.sharedAuth0.AUTH0_BASE_URL = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
        const audience = await UserInput.prompt('Auth0 API Audience (e.g., https://theanswer.ai)', false)
        this.sharedAuth0.AUTH0_AUDIENCE = audience || 'https://theanswer.ai'
        this.sharedAuth0.AUTH0_ORGANIZATION_ID = await UserInput.prompt('Auth0 Organization ID', true)
        this.sharedAuth0.AUTH0_CLIENT_ID = await UserInput.prompt('Auth0 Client ID', true)
        this.sharedAuth0.AUTH0_CLIENT_SECRET = await UserInput.prompt('Auth0 Client Secret', true)
    }

    async createFlowiseFile() {
        const outputPath = `copilot.${this.appName}.env`
        const envFile = new EnvFileManager(CONFIG.TEMPLATES.FLOWISE, outputPath)

        Logger.step('Configuring Flowise Environment Variables')
        console.log('==============================================')

        // Load template
        envFile.loadTemplate()

        // Set fixed defaults
        envFile.setVariables(CONFIG.FIXED_DEFAULTS)

        // Set generated secrets
        envFile.setVariables(this.sharedSecrets)

        // Set debug settings
        envFile.setVariables(this.debugSettings)

        // Set AUTH0 variables
        envFile.setVariables(this.sharedAuth0)

        // Required API key
        const openaiKey = await UserInput.prompt('OpenAI API Key (required for AI functionality)', true)
        envFile.setVariable('AAI_DEFAULT_OPENAI_API_KEY', openaiKey)

        // Optional services
        await this.configureOptionalServices(envFile)

        // Write file
        envFile.writeFile()
        return outputPath
    }

    async createWebFile() {
        const outputPath = `copilot.${this.appName}.web.env`
        const envFile = new EnvFileManager(CONFIG.TEMPLATES.WEB, outputPath)

        Logger.step('Configuring Web Application Environment Variables')
        console.log('=================================================')

        // Load template
        envFile.loadTemplate()

        // Set shared AUTH0 secret (must match Flowise)
        envFile.setVariable('AUTH0_SECRET', this.sharedSecrets.AUTH0_SECRET)

        // Reuse AUTH0 values from Flowise
        Logger.info('Using AUTH0 values from Flowise configuration...')
        envFile.setVariables(this.sharedAuth0)

        // Set debug settings
        envFile.setVariables(this.debugSettings)

        // Optional services (reuse if configured)
        if (this.sharedFlagsmith) {
            Logger.info('Using FLAGSMITH_ENVIRONMENT_ID from Flowise configuration...')
            envFile.setVariable('FLAGSMITH_ENVIRONMENT_ID', this.sharedFlagsmith)
        } else {
            Logger.info('No Flagsmith configuration from Flowise - skipping for web service')
        }

        // Write file
        envFile.writeFile()
        return outputPath
    }

    async configureOptionalServices(envFile) {
        Logger.step('Optional Service Integrations')
        console.log('================================')

        // Flagsmith
        const configureFlagsmith = await UserInput.confirm('Configure Flagsmith? (Feature flags)', false)
        if (configureFlagsmith) {
            const flagsmithId = await UserInput.prompt('Flagsmith Environment ID', false)
            if (flagsmithId) {
                envFile.setVariable('FLAGSMITH_ENVIRONMENT_ID', flagsmithId)
                this.sharedFlagsmith = flagsmithId
            }
        }

        // Langfuse
        const configureLangfuse = await UserInput.confirm('Configure Langfuse? (AI monitoring)', false)
        if (configureLangfuse) {
            const langfuseUrl = (await UserInput.prompt('Langfuse URL', false)) || 'https://cloud.langfuse.com'
            const secretKey = await UserInput.prompt('Langfuse Secret Key', false)
            const publicKey = await UserInput.prompt('Langfuse Public Key', false)

            envFile.setVariable('LANGFUSE_HOST', langfuseUrl)
            envFile.setVariable('LANGFUSE_SECRET_KEY', secretKey || 'n/a')
            envFile.setVariable('LANGFUSE_PUBLIC_KEY', publicKey || 'n/a')
        } else {
            envFile.setVariable('LANGFUSE_HOST', 'https://cloud.langfuse.com')
            envFile.setVariable('LANGFUSE_SECRET_KEY', 'n/a')
            envFile.setVariable('LANGFUSE_PUBLIC_KEY', 'n/a')
        }
    }

    checkExistingFiles() {
        const flowiseFile = `copilot.${this.appName}.env`
        const webFile = `copilot.${this.appName}.web.env`

        console.log(`\n🔍 Checking environment files for: ${this.appName}`)
        console.log('='.repeat(50))

        let allExist = true
        const files = [
            { path: flowiseFile, name: 'Flowise' },
            { path: webFile, name: 'Web' }
        ]

        files.forEach((file) => {
            if (fs.existsSync(file.path)) {
                const stats = fs.statSync(file.path)
                Logger.success(`${file.path} - EXISTS`)
                console.log(`   Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`)
            } else {
                Logger.error(`${file.path} - NOT FOUND`)
                allExist = false
            }
        })

        return { allExist, files: files.map((f) => f.path) }
    }

    async promptProceedOrWait(createdFiles) {
        Logger.success('Environment files created successfully!')
        console.log('\n📁 Environment files are located at:')
        createdFiles.forEach((file) => {
            console.log(`   • ${file}`)
        })
        console.log('\n⏸️  Pausing to allow you to review the files and ensure everything looks correct.')
        console.log('💡 You can open these files in another terminal/editor to check the configuration.')
        console.log('💡 Press Enter to continue with deployment, or Ctrl+C to cancel')

        await UserInput.prompt('Ready to continue? [Enter to proceed]', false)
        Logger.success('Proceeding with deployment...')
    }

    async offerCreationOptions() {
        if (this.autoTemplates) {
            Logger.info('Auto-selecting template creation for new deployment...')
            return await this.createGuidedEnvFiles()
        }

        console.log('📋 Environment File Creation Options:')
        console.log('')
        const choice = await UserInput.choice('Please select an option:', [
            'Download existing environment files from S3 (for existing deployment)',
            'Create new environment files from templates (for new deployment)',
            'Exit without making changes'
        ])

        switch (choice) {
            case 0:
                return await this.downloadFromS3()
            case 1:
                return await this.selectCreationMethod()
            case 2:
                Logger.info('Exiting without changes.')
                process.exit(1)
        }
    }

    async downloadFromS3() {
        Logger.step('Downloading environment files from S3...')
        console.log('')

        // Check if AWS CLI is available
        try {
            execSync('aws --version', { stdio: 'ignore' })
        } catch (error) {
            Logger.error(`AWS CLI not found: ${error.message}`)
            Logger.info('Please install AWS CLI and configure your credentials.')
            Logger.info('Visit: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html')
            process.exit(1)
        }

        // Check AWS credentials
        try {
            execSync('aws sts get-caller-identity', { stdio: 'ignore' })
        } catch (error) {
            Logger.error(`AWS credentials not configured or expired: ${error.message}`)
            Logger.info('Please run: aws configure')
            process.exit(1)
        }

        // Detect environment from app name
        const detectedEnv = this.explicitEnv || this.detectEnvironmentFromApp()
        if (!detectedEnv) {
            Logger.error(`Failed to detect environment from app name: ${this.appName}`)
            Logger.info('Expected pattern: staging-abc123-aai or abc123-aai (for prod)')
            process.exit(1)
        }

        Logger.info(`Detected environment: ${detectedEnv}`)
        console.log('')

        // Get Copilot pipeline artifact bucket
        const bucketName = this.getPipelineArtifactBucket()
        if (!bucketName) {
            Logger.error('Failed to find Copilot pipeline artifact bucket')
            Logger.info('Make sure the Copilot application has been deployed and pipeline is configured')
            process.exit(1)
        }

        Logger.info(`Using bucket: ${bucketName}`)
        console.log('')

        const flowiseFile = `copilot.${this.appName}.env`
        const webFile = `copilot.${this.appName}.web.env`
        const downloadedFiles = []

        // Try to download flowise env file
        Logger.step('Flowise environment file...')
        const latestFlowiseFile = this.findLatestCopilotEnvFile(bucketName, this.appName, 'env')
        if (latestFlowiseFile) {
            try {
                execSync(`aws s3 cp "s3://${bucketName}/${latestFlowiseFile}" "${flowiseFile}"`, { stdio: 'ignore' })
                Logger.success(`Downloaded ${flowiseFile}`)
                downloadedFiles.push(flowiseFile)
            } catch (error) {
                Logger.error(`Failed to download ${flowiseFile}: ${error.message}`)
            }
        } else {
            Logger.warning('No Flowise files found')
        }

        // Try to download web env file
        Logger.step('Web environment file...')
        const latestWebFile = this.findLatestCopilotEnvFile(bucketName, this.appName, 'web.env')
        if (latestWebFile) {
            try {
                execSync(`aws s3 cp "s3://${bucketName}/${latestWebFile}" "${webFile}"`, { stdio: 'ignore' })
                Logger.success(`Downloaded ${webFile}`)
                downloadedFiles.push(webFile)
            } catch (error) {
                Logger.error(`Failed to download ${webFile}: ${error.message}`)
            }
        } else {
            Logger.warning('No Web files found')
        }

        if (downloadedFiles.length > 0) {
            Logger.success(`Download completed! Downloaded ${downloadedFiles.length} file(s)`)
            console.log('')
            await this.promptProceedOrWait(downloadedFiles)
        } else {
            Logger.error('No files were downloaded')
            Logger.warning('Consider creating new environment files instead')
            process.exit(1)
        }
    }

    detectEnvironmentFromApp() {
        if (this.appName.match(/^(staging|prod)-.*-aai$/)) {
            return this.appName.match(/^(staging|prod)/)[1]
        } else if (this.appName.match(/^.*-aai$/)) {
            return 'prod'
        }
        return null
    }

    getPipelineArtifactBucket() {
        try {
            const stackPattern = `StackSet-${this.appName}-infrastructure`
            const stacksOutput = execSync(
                `aws cloudformation list-stacks --query "StackSummaries[?contains(StackName, '${stackPattern}') && StackStatus == 'UPDATE_COMPLETE'].StackName" --output text`,
                { encoding: 'utf8' }
            ).trim()

            const stackName = stacksOutput.split('\t')[0]
            if (!stackName || stackName === 'None') {
                return null
            }

            const bucketOutput = execSync(
                `aws cloudformation describe-stacks --stack-name "${stackName}" --query 'Stacks[0].Outputs[?OutputKey==\`PipelineBucket\`].OutputValue' --output text`,
                { encoding: 'utf8' }
            ).trim()

            return bucketOutput !== 'None' ? bucketOutput : null
        } catch (error) {
            Logger.warning(`Failed to get pipeline artifact bucket: ${error.message}`)
            return null
        }
    }

    findLatestCopilotEnvFile(bucketName, appName, fileType) {
        try {
            const prefix = `manual/env-files/copilot.${appName}.${fileType}/`
            const output = execSync(
                `aws s3api list-objects-v2 --bucket "${bucketName}" --prefix "${prefix}" --query 'sort_by(Contents, &LastModified)[-1].Key' --output text 2>/dev/null`,
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim()

            return output !== 'None' && output !== '' ? output : null
        } catch (error) {
            Logger.warning(`Failed to find latest ${fileType} file in bucket ${bucketName}: ${error.message}`)
            return null
        }
    }

    async selectCreationMethod() {
        console.log('📋 File Creation Options:')
        console.log('')
        const choice = await UserInput.choice('Select creation method:', [
            'Guided setup (recommended) - Answer prompts for required variables',
            'Create empty files from templates - Manually edit afterward'
        ])

        switch (choice) {
            case 0:
                return await this.createGuidedEnvFiles()
            case 1:
                return await this.createEmptyEnvFiles()
        }
    }

    async createEmptyEnvFiles() {
        Logger.step('Creating empty environment files from templates...')
        console.log('')

        const flowiseFile = `copilot.${this.appName}.env`
        const webFile = `copilot.${this.appName}.web.env`

        // Check for template files
        if (!fs.existsSync(CONFIG.TEMPLATES.FLOWISE)) {
            Logger.error(`Flowise template not found: ${CONFIG.TEMPLATES.FLOWISE}`)
            process.exit(1)
        }

        if (!fs.existsSync(CONFIG.TEMPLATES.WEB)) {
            Logger.error(`Web template not found: ${CONFIG.TEMPLATES.WEB}`)
            process.exit(1)
        }

        // Copy templates to target files
        fs.copyFileSync(CONFIG.TEMPLATES.FLOWISE, flowiseFile)
        fs.copyFileSync(CONFIG.TEMPLATES.WEB, webFile)

        Logger.success(`Created ${flowiseFile} (from template)`)
        Logger.success(`Created ${webFile} (from template)`)
        console.log('')
        Logger.info('Please edit these files manually to configure your environment variables.')
        Logger.warning('Focus on the variables marked as "Required" in the comments.')

        // Prompt for proceed/wait
        await this.promptProceedOrWait([flowiseFile, webFile])
    }

    async createGuidedEnvFiles() {
        // Generate secrets first
        this.generateSecrets()

        // Configure debug settings
        await this.configureDebugSettings()

        // Collect AUTH0 variables
        await this.collectAuth0Variables()

        // Create files
        const flowiseFile = await this.createFlowiseFile()
        const webFile = await this.createWebFile()

        Logger.success('Environment files created successfully!')
        console.log('📝 Files created:')
        console.log(`   - ${flowiseFile}`)
        console.log(`   - ${webFile}`)
        console.log('\n⚠️  Please review the files and update any additional variables as needed.')

        // Prompt for proceed/wait
        await this.promptProceedOrWait([flowiseFile, webFile])
    }

    async run() {
        try {
            console.log('🆕 Copilot Environment File Creator')
            console.log('===============================================\n')

            this.parseArguments()

            const { allExist } = this.checkExistingFiles()

            // Always validate existing files first, regardless of flags
            if (allExist) {
                const validationResult = await this.validateExistingFiles()

                if (this.autoTemplates) {
                    // In auto-templates mode, always proceed if files exist
                    console.log('')
                    if (validationResult.allConfigured) {
                        Logger.success('Environment validation passed - proceeding with deployment.')
                    } else {
                        Logger.info('Environment files exist - proceeding with deployment.')
                        Logger.info('Note: Some configuration variables may need manual review (see warnings above).')
                    }
                    process.exit(0)
                } else {
                    // In interactive mode, be strict about validation
                    if (validationResult.allConfigured) {
                        console.log('')
                        Logger.success('Environment validation passed for both Flowise and Web services!')
                        Logger.info('If you want to reconfigure, please delete the files first or use --auto-templates.')
                        process.exit(0)
                    } else {
                        console.log('')
                        Logger.warning('Environment validation failed - some required variables are missing or empty.')
                        if (!validationResult.flowiseConfigured) {
                            Logger.error('Flowise environment file needs configuration')
                        }
                        if (!validationResult.webConfigured) {
                            Logger.error('Web environment file needs configuration')
                        }
                        Logger.info('Please ensure your environment files are properly configured before deployment.')
                        process.exit(1)
                    }
                }
            }

            // If files are missing, offer creation options
            if (!allExist) {
                Logger.warning(`Environment file(s) missing`)
                console.log('')
                await this.offerCreationOptions()
            }

            process.exit(0)
        } catch (error) {
            Logger.error(`Fatal error: ${error.message}`)
            if (process.env.DEBUG) {
                console.error(error.stack)
            }
            process.exit(1)
        }
    }

    async validateExistingFiles() {
        const flowiseFile = `copilot.${this.appName}.env`
        const webFile = `copilot.${this.appName}.web.env`

        let flowiseConfigured = false
        let webConfigured = false

        // Validate Flowise file
        if (fs.existsSync(flowiseFile)) {
            const content = fs.readFileSync(flowiseFile, 'utf8')

            Logger.step('Validating Flowise environment configuration...')
            const flowiseRequiredVars = Object.entries(CONFIG.CONFIGURATION_VALIDATION_VARS)
                .filter(([_, services]) => services.includes('flowise'))
                .map(([varName]) => varName)

            const flowiseValidationResults = flowiseRequiredVars.map((varName) => {
                const pattern = new RegExp(`^${varName}=.*$`, 'gm')
                const match = content.match(pattern)
                const isValid = match && match[0] && !match[0].match(new RegExp(`^${varName}=\\s*$`))
                return { varName, isValid }
            })

            // Show Flowise validation results
            flowiseValidationResults.forEach(({ varName, isValid }) => {
                if (isValid) {
                    Logger.success(`${varName} - configured (flowise)`)
                } else {
                    if (this.autoTemplates) {
                        Logger.warning(`${varName} - may need review (flowise)`)
                    } else {
                        Logger.error(`${varName} - missing or empty (flowise)`)
                    }
                }
            })

            flowiseConfigured = flowiseValidationResults.length > 0 && flowiseValidationResults.every((result) => result.isValid)
        } else {
            Logger.error(`Flowise environment file not found: ${flowiseFile}`)
        }

        // Validate Web file
        if (fs.existsSync(webFile)) {
            Logger.step('Validating Web environment configuration...')
            const webContent = fs.readFileSync(webFile, 'utf8')

            const webRequiredVars = Object.entries(CONFIG.CONFIGURATION_VALIDATION_VARS)
                .filter(([_, services]) => services.includes('web'))
                .map(([varName]) => varName)

            const webValidationResults = webRequiredVars.map((varName) => {
                const pattern = new RegExp(`^${varName}=.*$`, 'gm')
                const match = webContent.match(pattern)
                const isValid = match && match[0] && !match[0].match(new RegExp(`^${varName}=\\s*$`))
                return { varName, isValid }
            })

            // Show Web validation results
            webValidationResults.forEach(({ varName, isValid }) => {
                if (isValid) {
                    Logger.success(`${varName} - configured (web)`)
                } else {
                    if (this.autoTemplates) {
                        Logger.warning(`${varName} - may need review (web)`)
                    } else {
                        Logger.error(`${varName} - missing or empty (web)`)
                    }
                }
            })

            webConfigured = webValidationResults.length > 0 && webValidationResults.every((result) => result.isValid)
        } else {
            Logger.error(`Web environment file not found: ${webFile}`)
        }

        return {
            flowiseConfigured,
            webConfigured,
            allConfigured: flowiseConfigured && webConfigured
        }
    }
}

// ==================================================
// MAIN EXECUTION
// ==================================================

if (require.main === module) {
    const creator = new EnvironmentFileCreator()
    creator.run()
}

module.exports = { EnvironmentFileCreator, CONFIG }
