const path = require('node:path')
const fs = require('node:fs/promises')

// Create a simple logger that mimics the @answers/logger API but doesn't require it
class SimpleLogger {
    constructor(options = {}) {
        this.level = options.level || 'info'
        this.labels = options.labels || {}
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString().slice(11, 19)
        const labelStr = Object.entries(this.labels)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ')

        return `[${timestamp}] [${level.toUpperCase()}] ${labelStr ? `[${labelStr}] ` : ''}${message}`
    }

    error(message, ...args) {
        console.error(this.formatMessage('error', message, ...args), ...args)
    }

    warn(message, ...args) {
        console.warn(this.formatMessage('warn', message, ...args), ...args)
    }

    info(message, ...args) {
        console.info(this.formatMessage('info', message, ...args), ...args)
    }

    debug(message, ...args) {
        if (process.env.DEBUG_LEVEL === 'debug' || process.env.DEBUG_LEVEL === 'trace') {
            console.debug(this.formatMessage('debug', message, ...args), ...args)
        }
    }

    trace(message, ...args) {
        if (process.env.DEBUG_LEVEL === 'trace') {
            console.trace(this.formatMessage('trace', message, ...args), ...args)
        }
    }

    http(message, ...args) {
        if (['debug', 'http', 'trace'].includes(process.env.DEBUG_LEVEL)) {
            console.log(this.formatMessage('http', message, ...args), ...args)
        }
    }

    child(context) {
        const childLogger = new SimpleLogger({
            level: this.level,
            labels: { ...this.labels, ...context }
        })
        return childLogger
    }
}

// Create a plugin-specific logger
const logger = new SimpleLogger({
    labels: { component: 'prisma-webpack-plugin' }
})

// Check if we should try to load the real logger
try {
    // If @answers/logger is available, try to use it
    const { Logger, LogLevel } = require('@answers/logger')
    const realLogger = new Logger({
        level: process.env.DEBUG_LEVEL ? LogLevel[process.env.DEBUG_LEVEL.toUpperCase()] : LogLevel.INFO,
        labels: { component: 'prisma-webpack-plugin' }
    })
    Object.assign(logger, realLogger)
    logger.info('Using @answers/logger')
} catch (err) {
    logger.warn('Could not load @answers/logger. Using fallback logger.')
}

// when client is bundled this gets its output path
// regex works both on escaped and non-escaped code
const prismaDirRegex = /\\?"?output\\?"?:\s*{(?:\\n?|\s)*\\?"?value\\?"?:(?:\\n?|\s)*\\?"(.*?)\\?",(?:\\n?|\s)*\\?"?fromEnvVar\\?"?/g

async function getPrismaDir(from) {
    // if we can find schema.prisma in the path, we are done
    if (await fs.stat(path.join(from, 'schema.prisma')).catch(() => false)) {
        logger.debug(`Found schema.prisma in path: ${from}`)
        return from
    }

    // otherwise we need to find the generated prisma client
    logger.debug(`Looking for .prisma/client in path: ${from}`)
    return path.dirname(require.resolve('.prisma/client', { paths: [from] }))
}

// get all required prisma files (schema + engine)
async function getPrismaFiles(from) {
    const prismaDir = await getPrismaDir(from)
    const filterRegex = /schema\.prisma|engine/
    const prismaFiles = await fs.readdir(prismaDir)

    const filteredFiles = prismaFiles.filter((file) => file.match(filterRegex))
    logger.debug(`Found Prisma files in ${prismaDir}:`, filteredFiles)

    return filteredFiles
}

let schemaCount = 0
const fromDestPrismaMap = {} // { [from]: dest }

class PrismaPlugin {
    constructor(options = {}) {
        this.options = options
        logger.info('PrismaPlugin initialized', options)
    }

    /**
     * @param {import('webpack').Compiler} compiler
     */
    apply(compiler) {
        logger.info(`Applying PrismaPlugin to compiler: ${compiler.name || 'webpack'}`)

        const { webpack } = compiler
        const { Compilation, sources } = webpack

        // read bundles to find which prisma files to copy (for all users)
        compiler.hooks.compilation.tap('PrismaPlugin', (compilation) => {
            logger.debug('PrismaPlugin compilation hook triggered')

            compilation.hooks.processAssets.tapPromise(
                {
                    name: 'PrismaPlugin',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE
                },
                async (assets) => {
                    const jsAssetNames = Object.keys(assets).filter((k) => k.endsWith('.js'))
                    logger.debug(`Processing ${jsAssetNames.length} JavaScript assets`)

                    const jsAsyncActions = jsAssetNames.map(async (assetName) => {
                        // prepare paths
                        const outputDir = compiler.outputPath
                        const assetPath = path.resolve(outputDir, assetName)
                        const assetDir = path.dirname(assetPath)
                        // get sources
                        const oldSourceAsset = compilation.getAsset(assetName)
                        const oldSourceContents = `${oldSourceAsset.source.source()}`

                        // update sources
                        const matches = Array.from(oldSourceContents.matchAll(prismaDirRegex))
                        if (matches.length > 0) {
                            logger.debug(`Found ${matches.length} Prisma directory matches in ${assetName}`)
                        }

                        for (const match of matches) {
                            const prismaDir = await getPrismaDir(match[1])
                            const prismaFiles = await getPrismaFiles(match[1])

                            logger.debug(`Processing ${prismaFiles.length} Prisma files from ${prismaDir}`)

                            for (const originalFilename of prismaFiles) {
                                const from = path.join(prismaDir, originalFilename)
                                let modifiedFilename = originalFilename

                                // if we have multiple schema.prisma files, we need to rename them
                                if (modifiedFilename === 'schema.prisma' && fromDestPrismaMap[from] === undefined) {
                                    modifiedFilename += ++schemaCount
                                    logger.debug(`Renamed schema.prisma to ${modifiedFilename} (count: ${schemaCount})`)
                                }

                                // if we already have renamed it, we need to get its "renamed" name
                                if (modifiedFilename.includes('schema.prisma') && fromDestPrismaMap[from] !== undefined) {
                                    modifiedFilename = path.basename(fromDestPrismaMap[from])
                                    logger.debug(`Using previously renamed schema file: ${modifiedFilename}`)
                                }

                                if (modifiedFilename.includes('schema.prisma')) {
                                    // update "schema.prisma" to "schema.prisma{number}" in the sources
                                    const newSourceString = oldSourceContents.replace(/schema\.prisma/g, modifiedFilename)
                                    const newRawSource = new sources.RawSource(newSourceString)
                                    compilation.updateAsset(assetName, newRawSource)
                                    logger.debug(`Updated schema reference in ${assetName} to ${modifiedFilename}`)
                                }

                                // update copy map
                                fromDestPrismaMap[from] = path.join(assetDir, modifiedFilename)
                                logger.trace(`Mapped file ${from} to ${fromDestPrismaMap[from]}`)
                            }
                        }
                    })

                    await Promise.all(jsAsyncActions)
                }
            )
        })

        // update nft.json files to include prisma files (only for next.js)
        compiler.hooks.compilation.tap('PrismaPlugin', (compilation) => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: 'PrismaPlugin',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE
                },
                async (assets) => {
                    const nftAssetNames = Object.keys(assets).filter((k) => k.endsWith('.nft.json'))
                    if (nftAssetNames.length > 0) {
                        logger.debug(`Processing ${nftAssetNames.length} NFT JSON assets`)
                    }

                    const nftAsyncActions = nftAssetNames.map((assetName) => {
                        // prepare paths
                        const outputDir = compiler.outputPath
                        const assetPath = path.resolve(outputDir, assetName)
                        const assetDir = path.dirname(assetPath)

                        // get sources
                        const oldSourceAsset = compilation.getAsset(assetName)
                        const oldSourceContents = `${oldSourceAsset.source.source()}`
                        const ntfLoadedAsJson = JSON.parse(oldSourceContents)

                        // update sources
                        const entries = Object.entries(fromDestPrismaMap)
                        logger.debug(`Adding ${entries.length} Prisma files to NFT manifest ${assetName}`)

                        for (const [from, dest] of entries) {
                            ntfLoadedAsJson.files.push(path.relative(assetDir, dest))
                        }

                        // persist sources
                        const newSourceString = JSON.stringify(ntfLoadedAsJson)
                        const newRawSource = new sources.RawSource(newSourceString)
                        compilation.updateAsset(assetName, newRawSource)
                    })

                    await Promise.all(nftAsyncActions)
                }
            )
        })

        // copy prisma files to output as the final step (for all users)
        compiler.hooks.done.tapPromise('PrismaPlugin', async () => {
            const entries = Object.entries(fromDestPrismaMap)
            logger.info(`Copying ${entries.length} Prisma files to output directories`)

            const asyncActions = entries.map(async ([from, dest]) => {
                // only copy if file doesn't exist, necessary for watch mode
                const folder = path.dirname(dest)
                // Create path if it doesn't exist
                await fs.mkdir(folder, { recursive: true })
                try {
                    await fs.access(dest)
                    logger.debug(`File already exists, skipping: ${dest}`)
                } catch (error) {
                    logger.debug(`Copying file from ${from} to ${dest}`)
                    return fs.copyFile(from, dest)
                }
            })

            try {
                await Promise.all(asyncActions)
                logger.info('Successfully copied all Prisma files')
            } catch (error) {
                logger.error('Error copying Prisma files:', error.message)
            }
        })
    }
}

module.exports = { PrismaPlugin }
