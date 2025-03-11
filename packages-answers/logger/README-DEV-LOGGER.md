# Enhanced Development Dashboard for TheAnswer

This document describes how to use the enhanced development dashboard for TheAnswer, which provides a clean, organized overview of your development environment status.

## Features

-   ✅ Side-by-side layout with services and packages
-   ✅ Visual status indicators that update only when changes occur
-   ✅ Filtering of 95% of noisy log messages
-   ✅ Highlighting and displaying only important events
-   ✅ Environment variable checking
-   ✅ Endpoint links for quick access to web and API
-   ✅ Clean, minimal display with color coding

## Usage

Instead of using the standard `pnpm dev` command, you can now use:

```bash
# Dashboard-style enhanced logging
pnpm dev

# Explicit dashboard logging (same as above)
pnpm dev:enhanced

# Original verbose logging (if you need all the details)
pnpm dev:original
```

## Side-by-Side Dashboard Layout

The dashboard provides an organized view of your development environment:

```
==============================
ℹ️ THEANSWER DEVELOPMENT STATUS
==============================

SERVICES                           PACKAGES
🟢 Database | 🟢 Web Server | 🟢 Flowise | 🟢 Redis | 🟢 PostgreSQL | 🟢 API
✅ Logger | ✅ Embed | ✅ Database | ✅ Web | ✅ Flowise | ✅ UI | ✅ Types

ENDPOINTS:
🔗 Web: http://localhost:3000
🔗 API: http://localhost:3001

❌ flowise:dev: [AuthMiddleware] Error verifying API key: InternalFlowiseError: Unauthorized

(Press Ctrl+C to stop the development server)
```

## Status Indicators

The dashboard uses color-coded status indicators:

-   🔄 (yellow) - Waiting/Initializing
-   🟢 (green) - Running/Ready
-   🔴 (red) - Error/Failed
-   ✅ (green) - Success
-   ❌ (red) - Error
-   ⚠️ (yellow) - Warning

## Live Updates

Unlike traditional logging, the dashboard:

-   Only updates lines when their status changes
-   Shows the most recent important event
-   Maintains a clean layout with minimal noise
-   Provides quick access to web and API endpoints
-   Doesn't clear the screen or redraw unnecessarily

## Environment Variables

The dashboard checks for required environment variables at startup:

```
==============================
🔐 Checking Environment Variables
==============================

✅ DATABASE_URL: Found
✅ AUTH_SECRET: Found
✅ AUTH0_BASE_URL: Found
✅ AUTH0_ISSUER_BASE_URL: Found
✅ AUTH0_CLIENT_ID: Found
✅ AUTH0_CLIENT_SECRET: Found
✅ NEXT_PUBLIC_BASE_URL: Found

✅ All required environment variables are present
```

## Log Level Control

You can still control the verbosity of logs by setting the `DEBUG_LEVEL` environment variable:

```bash
# Show only error, warn, and info logs
DEBUG_LEVEL=info pnpm dev

# Show more verbose logs including debug information
DEBUG_LEVEL=debug pnpm dev

# Show all logs including trace information
DEBUG_LEVEL=trace pnpm dev
```

## Customizing the Dashboard

You can customize the dashboard by editing the script at `packages-answers/logger/src/scripts/enhanced-dev.js`:

### 1. Add/Remove Services to Track

Modify the `SERVICES` array to add or remove services that are tracked on the dashboard:

```javascript
const SERVICES = [
    { name: 'Database', emoji: EMOJIS.DATABASE, status: STATUS.WAITING, details: 'Waiting for connection', updated: false }
    // Add your custom services here
]
```

### 2. Add/Remove Packages to Track

Modify the `PACKAGES` array to track different packages:

```javascript
const PACKAGES = [
    { name: 'Logger', status: STATUS.WAITING, updated: false }
    // Add your custom packages here
]
```

### 3. Specify Important Event Patterns

To display specific events in the events log, modify the `IMPORTANT_PATTERNS` array:

```javascript
const IMPORTANT_PATTERNS = [
    /error/i,
    /Database connected/i
    // Add your custom patterns here
]
```

### 4. Configure Service Status Matchers

To update service statuses based on log messages, modify the `SERVICE_MATCHERS` array:

```javascript
const SERVICE_MATCHERS = [
    {
        service: 'Database',
        patterns: [
            /Database connected/i
            // Add your custom patterns here
        ],
        successDetails: 'Connected and running'
    }
]
```

### 5. Configure URL Matchers

To detect endpoint URLs in logs, modify the `URL_MATCHERS` array:

```javascript
const URL_MATCHERS = [
    {
        type: 'webUrl',
        patterns: [
            /ready in.*?\s(https?:\/\/[^\s]+)/i
            // Add your custom patterns here
        ]
    },
    {
        type: 'apiUrl',
        patterns: [
            /API server is running on (https?:\/\/[^\s]+)/i
            // Add your custom patterns here
        ]
    }
]
```

## Using the DevLogger in Code

You can still use the DevLogger in your code for enhanced visual logging:

```typescript
import { devLogger, logAppStartup, checkEnvironmentVariables } from '@answers/logger'

// Section headers
devLogger.section('Initializing Application')

// Status checks with emojis
devLogger.checklistItem('Database', true, 'Connected successfully')
devLogger.checklistItem('Redis Cache', false, 'Connection failed')

// Special event logging
devLogger.appStart('Server initialization')
devLogger.dbConnected('PostgreSQL database connected')
devLogger.apiReady('REST API available at http://localhost:3000/api')
```

## Implementation Details

The dashboard:

1. Shows services and packages in a side-by-side layout
2. Updates status indicators only when changes occur
3. Shows the most recent important event
4. Automatically detects and displays endpoint URLs
5. Filters out over 95% of noisy log messages
6. Uses color coding to highlight status changes

## Troubleshooting

If you encounter any issues with the dashboard:

1. Try running with the original command: `pnpm dev:original`
2. Check that the logger package is built: `pnpm --filter @answers/logger build`
3. Inspect the dashboard script: `cat packages-answers/logger/dist/scripts/enhanced-dev.js`
