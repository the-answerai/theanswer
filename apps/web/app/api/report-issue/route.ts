import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import getCachedSession from '@ui/getCachedSession'

interface ReportIssueRequest {
    errorMessage: string
    errorDigest?: string
    errorStack?: string
    url?: string
    userAgent?: string
    timestamp: string
}

// Lazy Redis client - follows packages/server pattern
let redisClient: Redis | null = null
function getRedisClient(): Redis | null {
    if (!process.env.REDIS_URL) return null
    if (!redisClient) {
        redisClient = new Redis(process.env.REDIS_URL)
    }
    return redisClient
}

const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_MAX_REQUESTS = 5

async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const redis = getRedisClient()

    // If Redis not configured, allow request (fail open)
    if (!redis) {
        return { allowed: true }
    }

    const key = `rl:report-issue:${identifier}` // follows rl:{id} pattern from packages/server

    try {
        // Atomic increment - prevents race condition
        const count = await redis.incr(key)

        if (count === 1) {
            await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS)
        }

        if (count > RATE_LIMIT_MAX_REQUESTS) {
            const ttl = await redis.ttl(key)
            return { allowed: false, retryAfter: Math.max(ttl, 1) }
        }

        return { allowed: true }
    } catch (error) {
        console.error('Rate limit check failed:', error)
        return { allowed: true } // fail open
    }
}

/**
 * Sanitize sensitive data from error messages and stack traces
 */
function sanitizeErrorContent(content: string): string {
    return (
        content
            // Auth tokens and API keys
            .replace(/Bearer\s+[^\s]+/gi, '[REDACTED]')
            .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]')
            .replace(/api[_-]?key[=:]\s*[^\s&]+/gi, 'api_key=[REDACTED]')
            .replace(/secret[=:]\s*[^\s&]+/gi, 'secret=[REDACTED]')
            .replace(/token[=:]\s*[^\s&]+/gi, 'token=[REDACTED]')
            // AWS credentials
            .replace(/AKIA[A-Z0-9]{16}/g, '[AWS_KEY_REDACTED]')
            .replace(/AWS[A-Z0-9]{16,}/gi, '[AWS_REDACTED]')
            // Database connection strings
            .replace(/postgres(ql)?:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
            .replace(/mysql:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
            .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
            .replace(/redis:\/\/[^\s]+/gi, '[REDIS_URL_REDACTED]')
            // Email addresses (fully redacted for privacy)
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
            // IP addresses
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]')
            // Session tokens (common patterns)
            .replace(/sess[ion]*[=:_][^\s&;]+/gi, 'session=[REDACTED]')
            // JWT tokens
            .replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]')
    )
}

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication check - reject unauthenticated requests
        const session = await getCachedSession()
        const user = session?.user

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Rate limiting - prevent spam
        const rateLimitResult = await checkRateLimit(user.email)
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(rateLimitResult.retryAfter) }
                }
            )
        }

        // 3. Parse and validate request body
        let body: ReportIssueRequest
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        // 4. Validate required fields with type and format checks
        if (!body.errorMessage || typeof body.errorMessage !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing error message' }, { status: 400 })
        }

        if (body.errorMessage.length > 5000) {
            return NextResponse.json({ error: 'Error message too long (max 5000 characters)' }, { status: 400 })
        }

        if (!body.timestamp || typeof body.timestamp !== 'string' || isNaN(Date.parse(body.timestamp))) {
            return NextResponse.json({ error: 'Invalid or missing timestamp' }, { status: 400 })
        }

        // Optional field validation
        if (body.errorStack && (typeof body.errorStack !== 'string' || body.errorStack.length > 10000)) {
            return NextResponse.json({ error: 'Invalid error stack' }, { status: 400 })
        }

        if (body.url && (typeof body.url !== 'string' || body.url.length > 2000)) {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        // 5. Sanitize error content for title
        const sanitizedMessage = sanitizeErrorContent(body.errorMessage).substring(0, 100)

        const title = `[Error Report] ${sanitizedMessage}`

        // Sanitize the full error message and stack for the description
        const sanitizedFullMessage = sanitizeErrorContent(body.errorMessage)
        const sanitizedStack = body.errorStack ? sanitizeErrorContent(body.errorStack).substring(0, 3000) : null

        // Build description with context
        const descriptionParts = [
            '## Error Details',
            '',
            `**Message:** ${sanitizedFullMessage}`,
            body.errorDigest ? `**Digest:** \`${body.errorDigest}\`` : null,
            '',
            '## Context',
            '',
            `**Reported by:** ${user.email}`,
            user.organizationName ? `**Organization:** ${user.organizationName}` : null,
            user.organizationId ? `**Organization ID:** \`${user.organizationId}\`` : null,
            `**Timestamp:** ${body.timestamp}`,
            body.url ? `**URL:** ${body.url}` : null,
            body.userAgent ? `**User Agent:** ${body.userAgent}` : null,
            '',
            sanitizedStack ? '## Stack Trace' : null,
            sanitizedStack ? '' : null,
            sanitizedStack ? '```' : null,
            sanitizedStack,
            sanitizedStack ? '```' : null,
            '',
            '---',
            '*This issue was automatically created via the error reporting feature.*'
        ]

        const description = descriptionParts.filter(Boolean).join('\n')

        // Create Linear issue using the Linear API directly
        const linearApiKey = process.env.LINEAR_API_KEY
        if (!linearApiKey) {
            console.error('LINEAR_API_KEY not configured')
            return NextResponse.json({ error: 'Issue reporting is not configured' }, { status: 503 })
        }

        // Team and label IDs from environment variables with fallbacks
        const teamId = process.env.LINEAR_ERROR_REPORT_TEAM_ID
        const bugLabelId = process.env.LINEAR_ERROR_REPORT_BUG_LABEL_ID

        const linearResponse = await fetch('https://api.linear.app/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: linearApiKey
            },
            body: JSON.stringify({
                query: `
                    mutation CreateIssue($input: IssueCreateInput!) {
                        issueCreate(input: $input) {
                            success
                            issue {
                                id
                                identifier
                                url
                            }
                        }
                    }
                `,
                variables: {
                    input: {
                        title,
                        description,
                        teamId,
                        labelIds: [bugLabelId],
                        priority: 3 // Normal priority
                    }
                }
            })
        })

        if (!linearResponse.ok) {
            console.error('Linear API error:', await linearResponse.text())
            return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
        }

        const linearData = await linearResponse.json()

        if (linearData.errors) {
            console.error('Linear GraphQL errors:', linearData.errors)
            return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
        }

        const issue = linearData.data?.issueCreate?.issue

        if (!issue) {
            return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            issueId: issue.identifier,
            issueUrl: issue.url
        })
    } catch (error) {
        console.error('Error reporting issue:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
