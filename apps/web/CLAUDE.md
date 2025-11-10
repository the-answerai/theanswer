# CLAUDE.md - Web App

This file provides guidance for working with the Next.js web application.

## Overview

The web app is a Next.js 13+ application using the App Router architecture. It provides the main user interface for TheAnswer with Auth0 authentication, role-based access control, and organization management.

## Package Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (Main UI)/               # Route group for main application
│   │   ├── layout.tsx           # Main layout with Auth0 provider
│   │   ├── page.tsx             # Home page
│   │   ├── chatflows/           # Chatflow pages
│   │   ├── assistants/          # Assistant pages
│   │   ├── tools/               # Tool management pages
│   │   └── settings/            # Settings pages
│   ├── api/                     # API route handlers
│   │   ├── auth/                # Auth0 callbacks
│   │   ├── inngest/             # Inngest webhook handlers
│   │   └── [resource]/          # Resource API routes
│   ├── [encodedDomain]/         # Dynamic domain routes
│   ├── healthcheck/             # Health check endpoint
│   ├── org/                     # Organization selection
│   └── layout.tsx               # Root layout
├── e2e/                         # Playwright E2E tests
│   ├── tests/                   # Test files
│   ├── auth.setup.ts            # Auth configuration for tests
│   ├── .auth/                   # Stored auth states
│   └── README.md                # E2E testing documentation
├── middleware.ts                # Auth0 middleware
├── next.config.js               # Next.js configuration
└── Dockerfile                   # Container configuration
```

## Development Commands

```bash
# From repository root
pnpm --filter web build              # Build production
pnpm --filter web dev                # Development mode with hot reload
pnpm --filter web start              # Start production server

# Testing
pnpm test:e2e:setup                  # Install Playwright browsers
pnpm test:e2e                        # Run E2E tests with UI
pnpm test:e2e:dev                    # Same as test:e2e
pnpm test:e2e:debug                  # Debug mode with step-through
pnpm test:e2e:check                  # Check test setup

# Linting
pnpm --filter web lint               # Run ESLint
pnpm --filter web lint:fix           # Auto-fix linting issues
```

## Next.js App Router Architecture

### Route Groups

Route groups organize routes without affecting the URL structure:

```typescript
// app/(Main UI)/layout.tsx
// Applies to all routes in (Main UI) group

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <Auth0Provider>
            <Sidebar />
            <main>{children}</main>
        </Auth0Provider>
    )
}
```

### Page Structure

```typescript
// app/(Main UI)/chatflows/page.tsx
import { Metadata } from 'next'

// Static metadata
export const metadata: Metadata = {
    title: 'Chatflows - TheAnswer',
    description: 'Manage your AI chatflows'
}

// Server component (default)
export default async function ChatflowsPage() {
    // Can fetch data directly
    const chatflows = await fetchChatflows()

    return (
        <div>
            <h1>Chatflows</h1>
            <ChatflowList chatflows={chatflows} />
        </div>
    )
}
```

### Client Components

Mark components that need interactivity with `'use client'`:

```typescript
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
    const [count, setCount] = useState(0)

    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    )
}
```

## Authentication (Auth0)

### Middleware Configuration

```typescript
// middleware.ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
    matcher: [
        '/(Main UI)/:path*',  // Protect main UI routes
        '/api/:path*'         // Protect API routes
    ]
}
```

### Using Auth0 in Components

```typescript
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'

export default function UserProfile() {
    const { user, error, isLoading } = useUser()

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (!user) return <div>Not authenticated</div>

    return (
        <div>
            <h1>Welcome, {user.name}!</h1>
            <p>Email: {user.email}</p>
        </div>
    )
}
```

### Server-Side User Access

```typescript
// app/(Main UI)/dashboard/page.tsx
import { getSession } from '@auth0/nextjs-auth0'

export default async function DashboardPage() {
    const session = await getSession()
    const user = session?.user

    if (!user) {
        redirect('/api/auth/login')
    }

    return <div>Dashboard for {user.name}</div>
}
```

### Organization Management

```typescript
import { getSession } from '@auth0/nextjs-auth0'

export default async function OrgPage() {
    const session = await getSession()
    const organizationId = session?.user?.org_id

    // Fetch organization-specific data
    const data = await fetchOrgData(organizationId)

    return <OrgDashboard data={data} />
}
```

## API Routes

### Creating API Endpoints

```typescript
// app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'

// GET /api/resources
export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch resources for user's organization
        const resources = await fetchResources(session.user.org_id)

        return NextResponse.json(resources)
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/resources
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate request body
        if (!body.name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            )
        }

        // Create resource
        const resource = await createResource({
            ...body,
            userId: session.user.sub,
            organizationId: session.user.org_id
        })

        return NextResponse.json(resource, { status: 201 })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
```

### Dynamic API Routes

```typescript
// app/api/resources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

type Params = {
    params: {
        id: string
    }
}

// GET /api/resources/:id
export async function GET(
    request: NextRequest,
    { params }: Params
) {
    const { id } = params

    const resource = await fetchResourceById(id)

    if (!resource) {
        return NextResponse.json(
            { error: 'Resource not found' },
            { status: 404 }
        )
    }

    return NextResponse.json(resource)
}

// PUT /api/resources/:id
export async function PUT(
    request: NextRequest,
    { params }: Params
) {
    const { id } = params
    const body = await request.json()

    const updated = await updateResource(id, body)

    return NextResponse.json(updated)
}

// DELETE /api/resources/:id
export async function DELETE(
    request: NextRequest,
    { params }: Params
) {
    const { id } = params

    await deleteResource(id)

    return NextResponse.json({ success: true })
}
```

## E2E Testing (Playwright)

### Test Structure

```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
    test('should login successfully', async ({ page }) => {
        // Navigate to app
        await page.goto('/')

        // Should redirect to Auth0 login
        await expect(page).toHaveURL(/auth0\.com/)

        // Fill in credentials
        await page.fill('[name="username"]', process.env.TEST_USER_EMAIL!)
        await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)

        // Submit login
        await page.click('[type="submit"]')

        // Should redirect back to app
        await expect(page).toHaveURL(/localhost:3000/)

        // Verify logged in
        await expect(page.locator('text=Dashboard')).toBeVisible()
    })

    test('should handle unauthorized access', async ({ page }) => {
        // Try to access protected page without auth
        await page.goto('/chatflows')

        // Should redirect to login
        await expect(page).toHaveURL(/auth0\.com/)
    })
})
```

### Role-Based Testing

```typescript
// e2e/tests/permissions.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Admin Permissions', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' })

    test('admin can access settings', async ({ page }) => {
        await page.goto('/settings')
        await expect(page.locator('text=Organization Settings')).toBeVisible()
    })
})

test.describe('Member Permissions', () => {
    test.use({ storageState: 'e2e/.auth/member.json' })

    test('member cannot access settings', async ({ page }) => {
        await page.goto('/settings')
        await expect(page.locator('text=Unauthorized')).toBeVisible()
    })
})
```

### Test Configuration

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test'

setup('authenticate as admin', async ({ page }) => {
    // Login as admin user
    await page.goto('/')
    await page.fill('[name="username"]', process.env.TEST_ADMIN_EMAIL!)
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('[type="submit"]')

    // Wait for redirect
    await page.waitForURL(/localhost:3000/)

    // Save auth state
    await page.context().storageState({ path: 'e2e/.auth/admin.json' })
})
```

## Component Patterns

### Server Components (Default)

Use for data fetching and static content:

```typescript
// app/(Main UI)/chatflows/page.tsx
export default async function ChatflowsPage() {
    // Fetch data on server
    const chatflows = await getChatflows()

    return (
        <div>
            <h1>Chatflows</h1>
            {chatflows.map(flow => (
                <ChatflowCard key={flow.id} chatflow={flow} />
            ))}
        </div>
    )
}
```

### Client Components

Use for interactivity, hooks, or browser APIs:

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function ChatflowEditor({ chatflowId }: { chatflowId: string }) {
    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])

    useEffect(() => {
        // Load chatflow data
        loadChatflow(chatflowId).then(data => {
            setNodes(data.nodes)
            setEdges(data.edges)
        })
    }, [chatflowId])

    return (
        <div>
            <ReactFlowCanvas nodes={nodes} edges={edges} />
        </div>
    )
}
```

### Mixing Server and Client

```typescript
// Server component (default)
export default async function ChatflowPage({ params }: { params: { id: string } }) {
    // Fetch data on server
    const chatflow = await getChatflow(params.id)

    // Pass to client component
    return (
        <div>
            <h1>{chatflow.name}</h1>
            <ChatflowEditor chatflow={chatflow} />
        </div>
    )
}

// Client component for interactivity
'use client'
function ChatflowEditor({ chatflow }) {
    const [isEditing, setIsEditing] = useState(false)
    // ... interactive logic
}
```

## Data Fetching

### Server-Side Fetching

```typescript
// Fetch on server (in Server Components)
async function getChatflows() {
    const res = await fetch(`${process.env.API_HOST}/api/v1/chatflows`, {
        cache: 'no-store',  // Always fresh
        // Or: next: { revalidate: 60 }  // Revalidate every 60s
    })

    if (!res.ok) throw new Error('Failed to fetch chatflows')

    return res.json()
}
```

### Client-Side Fetching

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function ChatflowList() {
    const [chatflows, setChatflows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/chatflows')
            .then(res => res.json())
            .then(data => {
                setChatflows(data)
                setLoading(false)
            })
            .catch(error => {
                console.error('Error:', error)
                setLoading(false)
            })
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            {chatflows.map(flow => (
                <div key={flow.id}>{flow.name}</div>
            ))}
        </div>
    )
}
```

### Using React Query (Recommended for Client)

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export default function ChatflowList() {
    const { data: chatflows, isLoading, error } = useQuery({
        queryKey: ['chatflows'],
        queryFn: async () => {
            const res = await fetch('/api/chatflows')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        }
    })

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>

    return (
        <div>
            {chatflows?.map(flow => (
                <div key={flow.id}>{flow.name}</div>
            ))}
        </div>
    )
}
```

## Environment Variables

### Setup

```bash
# Copy example file
cp .env.example .env

# Edit with your values
```

### Required Variables

```bash
# Auth0 Configuration
AUTH0_SECRET=your-secret-key
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-audience
AUTH0_SCOPE=openid profile email

# API Configuration
API_HOST=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Database (for Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Inngest (if using)
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

### Accessing in Code

```typescript
// Server-side (Server Components, API Routes)
const apiHost = process.env.API_HOST

// Client-side (must be prefixed with NEXT_PUBLIC_)
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## Best Practices

### 1. Server vs Client Components
- **Default to Server Components:** Use unless you need interactivity
- **Client for hooks:** useState, useEffect, useRouter, etc.
- **Minimize client bundle:** Keep client components small
- **Pass data down:** Fetch in Server Components, pass to Client Components

### 2. Authentication
- **Protect all routes:** Use middleware to protect sensitive pages
- **Check on server:** Always verify auth on server-side
- **Organization scoping:** Filter all data by user's organization
- **Role-based access:** Check user roles before showing UI elements

### 3. Data Fetching
- **Server Components:** Fetch directly in component
- **Client Components:** Use React Query or SWR for caching
- **Revalidation:** Set appropriate cache strategies
- **Error handling:** Always handle fetch errors gracefully

### 4. Performance
- **Image optimization:** Use Next.js Image component
- **Code splitting:** Leverage automatic code splitting
- **Static generation:** Use static pages when possible
- **Dynamic imports:** Lazy load heavy components

### 5. Testing
- **E2E critical paths:** Test login, core workflows
- **Role-based tests:** Verify permissions for each role
- **Stored auth states:** Reuse auth to speed up tests
- **Stable selectors:** Use data-testid for test selectors

## Common Patterns

### Protected Pages

```typescript
// app/(Main UI)/admin/page.tsx
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const session = await getSession()

    // Check if user is admin
    if (!session?.user?.isAdmin) {
        redirect('/unauthorized')
    }

    return <AdminDashboard />
}
```

### Form Handling

```typescript
'use client'

import { useState } from 'react'

export default function ChatflowForm() {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/chatflows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })

            if (!res.ok) throw new Error('Failed to create chatflow')

            const chatflow = await res.json()
            // Handle success (redirect, show message, etc.)
        } catch (error) {
            console.error('Error:', error)
            // Handle error
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chatflow name"
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Chatflow'}
            </button>
        </form>
    )
}
```

### Loading States

```typescript
// app/(Main UI)/chatflows/loading.tsx
export default function Loading() {
    return <div>Loading chatflows...</div>
}

// Automatically shown while page.tsx loads
```

### Error Boundaries

```typescript
// app/(Main UI)/chatflows/error.tsx
'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error
    reset: () => void
}) {
    return (
        <div>
            <h2>Something went wrong!</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Try again</button>
        </div>
    )
}
```

## Deployment

### Docker Build

```bash
# Build image
docker build -t theanswer-web .

# Run container
docker run -p 3000:3000 --env-file .env theanswer-web
```

### Environment-Specific Builds

```bash
# Production build
pnpm build

# Check build output
ls -la .next/
```

## Troubleshooting

### Auth Issues
- Verify Auth0 configuration in `.env`
- Check callback URLs in Auth0 dashboard
- Clear browser cookies and try again
- Check middleware configuration

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Verify all environment variables are set
- Check for TypeScript errors: `pnpm tsc --noEmit`

### Test Failures
- Check test environment variables in `.env.test`
- Verify Auth0 test users exist
- Clear test artifacts: `rm -rf e2e/.auth e2e/test-results`
- Re-run auth setup: `pnpm test:e2e:setup`

## Resources

- **Root CLAUDE.md:** Overall architecture guidance
- **E2E README:** `e2e/README.md` for detailed testing docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Auth0 Next.js SDK:** https://auth0.com/docs/quickstart/webapp/nextjs
- **Playwright Documentation:** https://playwright.dev/
