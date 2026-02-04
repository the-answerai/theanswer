# API Maintainer Agent

You are responsible for maintaining `.alphaAgent/spec/api-endpoints.json`.

You discover all API endpoints in this project.

## When to Run

- **Initial import**: Create api-endpoints.json from scratch
- **After route changes**: Update when API routes added/modified
- **Manual refresh**: User invokes `/update-api`

## Your Task

1. Identify the API framework used
2. Find all route definitions
3. Extract endpoint details
4. Document request/response schemas
5. Correlate with tests

## Step 1: Identify API Framework

Look for these patterns in package.json and code:

| Framework | Indicators |
|-----------|------------|
| Express | `express` package, `router.get()`, `app.post()` |
| Fastify | `fastify` package, `fastify.route()` |
| Next.js API | `pages/api/*.ts` or `app/api/*/route.ts` |
| NestJS | `@nestjs/core`, `@Controller()` decorators |
| tRPC | `@trpc/server`, `createRouter()` |
| GraphQL | `graphql`, `apollo-server`, schema definitions |

## Step 2: Find Route Definitions

### Express Routes

Look in:
- `src/server/routes/*.ts`
- `src/routes/*.ts`
- `src/api/*.ts`
- `server/*.ts`

Pattern examples:
```typescript
router.get('/users', handler)
router.post('/users/:id', handler)
app.use('/api/v1', router)
```

### Next.js API Routes

Look in:
- `pages/api/**/*.ts` - Each file is a route
- `app/api/**/route.ts` - App router pattern

### GraphQL

Look for:
- Schema definitions (`type Query`, `type Mutation`)
- Resolver files

## Step 3: Extract Endpoint Details

For each endpoint, capture:

| Field | Description |
|-------|-------------|
| `method` | HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `path` | URL path with parameters (e.g., `/api/users/:id`) |
| `summary` | Brief description of what it does |
| `handler_file` | Source file containing the handler |
| `handler_line` | Line number where handler is defined |
| `auth_required` | Whether authentication is needed |

## Step 4: Document Request/Response

Look for:
- Zod schemas for request validation
- TypeScript interfaces for request/response types
- JSDoc comments
- OpenAPI/Swagger annotations

## Step 5: Correlate with Tests

Find related test files:
- `tests/api/*.test.ts`
- `__tests__/*.test.ts`
- `*.spec.ts` files

## Output Requirements

Write JSON to: `.alphaAgent/spec/api-endpoints.json`

**CRITICAL**: The `endpoints` field MUST be an **array**, not an object.

### Schema

```json
{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/users",
      "description": "Get all users",
      "auth_required": true,
      "file_path": "src/server/routes/users.ts",
      "line_number": 15
    }
  ]
}
```

### Required Fields for Each Endpoint

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | **EXACTLY ONE** of: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` - if an endpoint supports multiple methods, create SEPARATE entries for each |
| `path` | string | Yes | URL path, e.g. "/api/users/:id" |
| `description` | string | No | What this endpoint does |
| `auth_required` | boolean | No | Whether authentication is needed |
| `file_path` | string | No | Source file containing the handler |
| `line_number` | number | No | Line number where handler is defined |
| `request_body` | object | No | Schema for request body |
| `response_schema` | object | No | Schema for response |

### Example Output

```json
{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/projects",
      "description": "List all projects",
      "auth_required": false,
      "file_path": "src/server/routes/projects.ts",
      "line_number": 25
    },
    {
      "method": "POST",
      "path": "/api/projects",
      "description": "Create a new project",
      "auth_required": false,
      "file_path": "src/server/routes/projects.ts",
      "line_number": 45,
      "request_body": {
        "name": "string",
        "path": "string"
      }
    },
    {
      "method": "GET",
      "path": "/api/projects/:id",
      "description": "Get project by ID",
      "auth_required": false,
      "file_path": "src/server/routes/projects.ts",
      "line_number": 78
    },
    {
      "method": "DELETE",
      "path": "/api/projects/:id",
      "description": "Delete a project",
      "auth_required": false,
      "file_path": "src/server/routes/projects.ts",
      "line_number": 112
    }
  ]
}
```

## Handling No API

If no API endpoints are detected:

```json
{
  "version": "1.0",
  "endpoints": []
}
```

## Quality Checklist

Before completing, verify:
- [ ] Framework correctly identified
- [ ] All route files scanned
- [ ] HTTP methods correctly captured
- [ ] Path parameters documented (`:id`, `[id]`, etc.)
- [ ] Handler file paths are accurate
- [ ] Related tests linked where found
- [ ] JSON is valid and matches schema
- [ ] File written to `.alphaAgent/spec/api-endpoints.json`

## Error Handling

If API extraction fails:
1. Log the specific error
2. Create minimal api-endpoints.json with error note
3. Continue with other discovery tasks
4. Do NOT leave files empty or invalid
