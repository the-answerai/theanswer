---
globs:
  - apps/web/**
---

# Next.js Web App Rules

These rules apply when working with files in `apps/web/`.

## Server vs Client Components

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

Use `'use client'` for hooks, browser APIs, and interactivity:

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function InteractiveComponent() {
    const [count, setCount] = useState(0)

    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    )
}
```

### When to Use Each

| Use Server Components | Use Client Components |
|----------------------|----------------------|
| Data fetching | useState, useEffect |
| Database access | Event handlers (onClick, onChange) |
| Accessing backend resources | Browser APIs |
| Sensitive data (no client exposure) | Interactive UI elements |
| Static content | Real-time updates |

## Route Protection

### Middleware Configuration

All protected routes are defined in `middleware.ts`:

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

### Auth0 in Components

**Client-side:**
```typescript
'use client'
import { useUser } from '@auth0/nextjs-auth0/client'

export default function Profile() {
    const { user, isLoading } = useUser()
    if (isLoading) return <div>Loading...</div>
    if (!user) return <div>Not authenticated</div>
    return <div>Welcome, {user.name}!</div>
}
```

**Server-side:**
```typescript
import { getSession } from '@auth0/nextjs-auth0'

export default async function DashboardPage() {
    const session = await getSession()
    const user = session?.user
    if (!user) redirect('/api/auth/login')
    return <div>Dashboard for {user.name}</div>
}
```

## API Routes

### Creating Endpoints

```typescript
// app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'

export async function GET(request: NextRequest) {
    const session = await getSession()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resources = await fetchResources(session.user.org_id)
    return NextResponse.json(resources)
}

export async function POST(request: NextRequest) {
    const session = await getSession()
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const resource = await createResource({
        ...body,
        userId: session.user.sub,
        organizationId: session.user.org_id
    })

    return NextResponse.json(resource, { status: 201 })
}
```

## E2E Testing

### Test Location

E2E tests are in `apps/web/e2e/tests/`:

```typescript
// e2e/tests/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
    test('should login successfully', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/auth0\.com/)
        // ... login steps
    })
})
```

### Running Tests

```bash
# Run E2E tests with UI
pnpm test:e2e

# Debug mode
pnpm test:e2e:debug

# Single test file
pnpm --filter web test:e2e -- tests/auth.spec.ts
```

### Role-Based Testing

```typescript
test.describe('Admin Permissions', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' })

    test('admin can access settings', async ({ page }) => {
        await page.goto('/settings')
        await expect(page.locator('text=Organization Settings')).toBeVisible()
    })
})
```

## Data Fetching

### Server-Side (Recommended)

```typescript
// In Server Components
async function getChatflows() {
    const res = await fetch(`${process.env.API_HOST}/api/v1/chatflows`, {
        cache: 'no-store',  // Always fresh
    })
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
}
```

### Client-Side

```typescript
'use client'
import { useQuery } from '@tanstack/react-query'

export default function ChatflowList() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['chatflows'],
        queryFn: () => fetch('/api/chatflows').then(r => r.json())
    })

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error</div>
    return <div>{data?.map(f => <div key={f.id}>{f.name}</div>)}</div>
}
```

## Environment Variables

```bash
# Server-side (any name)
API_HOST=http://localhost:3000

# Client-side (MUST be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Checklist

Before committing web app changes:

- [ ] Server Components for data fetching (default)
- [ ] Client Components only when needed (`'use client'`)
- [ ] Protected routes via middleware.ts
- [ ] Auth0 session checks in API routes
- [ ] E2E tests for new features in `e2e/tests/`
- [ ] Run tests: `pnpm test:e2e`
