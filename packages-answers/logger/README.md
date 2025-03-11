# @answers/logger

A clean, easy-to-understand logging system for TypeScript/JavaScript applications.

## Features

-   ✅ Multiple log levels (ERROR, WARN, INFO, HTTP, DEBUG, TRACE)
-   ✅ Colorized output
-   ✅ Timestamps
-   ✅ Context labels
-   ✅ Child loggers
-   ✅ Customizable formatting

## Installation

```bash
# Using npm
npm install @answers/logger

# Using yarn
yarn add @answers/logger

# Using pnpm
pnpm add @answers/logger
```

## Basic Usage

```typescript
import { defaultLogger } from '@answers/logger'

// Use the default logger
defaultLogger.info('Application started')
defaultLogger.warn('Something looks suspicious')
defaultLogger.error('Something went wrong', { code: 500, details: 'Server error' })
```

## Creating a Custom Logger

```typescript
import { Logger, LogLevel } from '@answers/logger'

const logger = new Logger({
    level: LogLevel.DEBUG, // Set minimum log level
    timestamps: true, // Show timestamps
    timestampFormat: 'HH:mm:ss', // Timestamp format
    colorize: true, // Colorize output
    icons: true, // Show icons
    labels: {
        // Add global labels
        app: 'my-app',
        env: process.env.NODE_ENV
    }
})

logger.info('Server starting')
logger.debug('Loaded configuration')
```

## Child Loggers with Context

```typescript
import { defaultLogger } from '@answers/logger'

// Create child logger for a specific component
const userLogger = defaultLogger.child({ component: 'user-service' })

userLogger.info('User logged in', { userId: '123' })
// Will log with [component=user-service] context

// Create nested child logger for more specific context
const authLogger = userLogger.child({ action: 'auth' })
authLogger.info('Authentication successful')
// Will log with [component=user-service action=auth] context
```

## Log Levels

Available log levels, in order of priority:

1. `ERROR`: Critical errors that require immediate attention
2. `WARN`: Warning messages that don't stop execution but need attention
3. `INFO`: Informational messages about normal operation
4. `HTTP`: HTTP request/response logs
5. `DEBUG`: Debug information for troubleshooting
6. `TRACE`: Very detailed tracing information

## Configuration Options

| Option          | Type                   | Default       | Description                          |
| --------------- | ---------------------- | ------------- | ------------------------------------ |
| level           | LogLevel               | LogLevel.INFO | Minimum log level to display         |
| timestamps      | boolean                | true          | Whether to show timestamps           |
| timestampFormat | string                 | 'HH:mm:ss'    | Format for timestamps                |
| colorize        | boolean                | true          | Whether to colorize output           |
| icons           | boolean                | true          | Whether to include icons             |
| labels          | Record<string, string> | {}            | Global labels to include in all logs |

## License

MIT
