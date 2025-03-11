# Logger Implementation in TheAnswer Build Process

## Introduction

The logging system in TheAnswer has been integrated into the build process to provide detailed visibility into build-time operations. This document explains how the logger is implemented, particularly in the experimental-prisma-webpack-plugin, and provides guidance for extending this pattern to other components of the codebase.

## Logger Architecture

### Core Components

1. **@answers/logger Package**: A centralized, structured logging package that provides consistent logging capabilities across the codebase.

2. **SimpleLogger Fallback**: A graceful degradation mechanism that ensures logging continues to function even when the main logger package is unavailable.

3. **Environment-based Configuration**: Dynamic log level configuration using environment variables.

## Integration with the Build Process

### Prisma Webpack Plugin Implementation

The experimental-prisma-webpack-plugin uses the logger to track and debug the process of handling Prisma files during builds:

```javascript
// Create a plugin-specific logger
const logger = new SimpleLogger({
    labels: { component: 'prisma-webpack-plugin' }
})

// Try to use the real logger if available
try {
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
```

### Key Logging Points in the Build Process

1. **Plugin Initialization**:

    ```javascript
    logger.info('PrismaPlugin initialized', options)
    ```

2. **Compiler Hook Registration**:

    ```javascript
    logger.info(`Applying PrismaPlugin to compiler: ${compiler.name || 'webpack'}`)
    ```

3. **Asset Processing**:

    ```javascript
    logger.debug(`Processing ${jsAssetNames.length} JavaScript assets`)
    ```

4. **Prisma File Detection**:

    ```javascript
    logger.debug(`Found ${matches.length} Prisma directory matches in ${assetName}`)
    ```

5. **File Operations**:

    ```javascript
    logger.debug(`Copying file from ${from} to ${dest}`)
    ```

6. **Error Handling**:
    ```javascript
    logger.error('Error copying Prisma files:', error.message)
    ```

## Log Levels and Their Usage

The logger implements several log levels, each with a specific purpose:

1. **ERROR**: Critical issues that prevent successful operation

    ```javascript
    logger.error('Error copying Prisma files:', error.message)
    ```

2. **WARN**: Potential issues that don't prevent operation but should be noted

    ```javascript
    logger.warn('Could not load @answers/logger. Using fallback logger.')
    ```

3. **INFO**: High-level operational information

    ```javascript
    logger.info('Successfully copied all Prisma files')
    ```

4. **DEBUG**: Detailed information for troubleshooting

    ```javascript
    logger.debug(`Processing ${prismaFiles.length} Prisma files from ${prismaDir}`)
    ```

5. **TRACE**: Very detailed information for deep debugging

    ```javascript
    logger.trace(`Mapped file ${from} to ${fromDestPrismaMap[from]}`)
    ```

6. **HTTP**: Specifically for logging HTTP requests and responses
    ```javascript
    logger.http(`${req.method} ${req.url}`, { statusCode: res.statusCode })
    ```

## Configuration

### Environment Variables

The logging system respects the `DEBUG_LEVEL` environment variable, allowing dynamic control of log verbosity:

```bash
# Run with debug logging enabled
export DEBUG_LEVEL=debug && pnpm build

# Run with trace logging (most verbose)
export DEBUG_LEVEL=trace && pnpm build

# Run with info logging (less verbose)
export DEBUG_LEVEL=info && pnpm build
```

### Plugin-specific Labels

Each component should identify itself in the logs for better filtering:

```javascript
const logger = new Logger({
    labels: { component: 'prisma-webpack-plugin' }
})
```

## Fallback Mechanism

The SimpleLogger implementation provides a crucial fallback that:

1. Mimics the interface of the full logger
2. Uses plain console methods for output
3. Maintains similar formatting to the full logger
4. Respects the same environment variable configuration

This ensures logging continues even if the logger package isn't available or fails to load, which is particularly important during the build process.

## Example Output

Running the build with `DEBUG_LEVEL=debug` produces output like:

```
[03:17:01] [INFO] [component=prisma-webpack-plugin] Using @answers/logger
[03:17:02] [INFO] [component=prisma-webpack-plugin] PrismaPlugin initialized {}
[03:17:02] [INFO] [component=prisma-webpack-plugin] Applying PrismaPlugin to compiler: webpack
[03:17:02] [DEBUG] [component=prisma-webpack-plugin] PrismaPlugin compilation hook triggered
[03:17:18] [DEBUG] [component=prisma-webpack-plugin] Processing 296 JavaScript assets
[03:17:18] [DEBUG] [component=prisma-webpack-plugin] Found 1 Prisma directory matches in 6919.js
[03:17:18] [DEBUG] [component=prisma-webpack-plugin] Found schema.prisma in path: /path/to/prisma-client
[03:17:19] [INFO] [component=prisma-webpack-plugin] Copying 2 Prisma files to output directories
[03:17:19] [INFO] [component=prisma-webpack-plugin] Successfully copied all Prisma files
```

This provides a comprehensive view of the plugin's operation, making it easier to understand and debug the build process.

## Best Practices for Extending to Other Components

When implementing logging in other parts of the codebase:

1. **Always use a component label**:

    ```javascript
    const logger = new Logger({
        labels: { component: 'your-component-name' }
    })
    ```

2. **Consider implementing a fallback** for critical components:

    ```javascript
    let logger
    try {
        const { Logger } = require('@answers/logger')
        logger = new Logger({ labels: { component: 'your-component' } })
    } catch (err) {
        // Fallback to console
        logger = { info: console.info, error: console.error /* ... */ }
    }
    ```

3. **Use appropriate log levels** based on the severity and importance:

    - Use `error` only for actual errors that impact functionality
    - Use `warn` for potential issues that don't break functionality
    - Use `info` for high-level operational events
    - Use `debug` for detailed information useful when troubleshooting
    - Use `trace` for very detailed debugging information

4. **Include context in logs**:

    ```javascript
    logger.info(`Processing file: ${filename}`, { size: fileSize, type: fileType })
    ```

5. **Log at the beginning and end of operations**:

    ```javascript
    logger.info('Starting database migration')
    // ... perform migration ...
    logger.info('Database migration completed successfully')
    ```

6. **Log with structured data** wherever possible:
    ```javascript
    logger.debug('User authentication attempt', { userId, success: true, method: 'oauth' })
    ```

## Next Steps for Logger Implementation

The following areas should be considered for future logger implementations:

1. **Server-side API Routes**: Add logging to API routes to track requests, responses, and errors.

2. **Database Operations**: Log database queries, transactions, and performance metrics.

3. **Authentication Flows**: Log authentication attempts, successes, and failures.

4. **Background Jobs**: Log the start, progress, and completion of background tasks.

5. **Error Boundaries**: Implement logging in error boundaries to capture client-side errors.

6. **Middleware**: Add logging to middleware components to track request processing.

7. **Third-party Service Interactions**: Log all interactions with external services.

## Conclusion

The logging system implemented in the build process provides a solid foundation for comprehensive logging throughout TheAnswer's codebase. By following the patterns established in the experimental-prisma-webpack-plugin, we can create a consistent, informative logging experience that aids in development, debugging, and monitoring the application.
