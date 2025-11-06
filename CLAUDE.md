# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start: Your Daily Workflow

**New to this project? Start here:**

```bash
# 1. Pick up a ticket
/ticket-start AAI-123

# 2. Make changes and push (repeat as needed)
/push "add feature"
/push "add tests"
/push "fix bugs"

# 3. Get your PR reviewed
/pr-review
```

That's it! Three commands from ticket to review.

**📖 New to Claude Code workflows?** See [`.claude/README.md`](.claude/README.md) for complete architecture documentation and [Daily Development Workflow](#daily-development-workflow) below for detailed usage.

**⚡ Already familiar?** Jump to [Daily Development Workflow](#daily-development-workflow) below.

---

## Package-Specific Documentation

For detailed implementation guidance on specific packages:

- **[packages/components/CLAUDE.md](packages/components/CLAUDE.md)** - Creating Flowise nodes, components, credentials, and integrations
- **[packages/server/CLAUDE.md](packages/server/CLAUDE.md)** - Backend API: routes, controllers, services, entities, auth, and database operations
- **[apps/web/CLAUDE.md](apps/web/CLAUDE.md)** - Next.js App Router, Auth0, server/client components, and E2E testing

**When to use package docs:**
- Creating/modifying Flowise components → `packages/components/CLAUDE.md`
- Adding REST APIs, services, or database entities → `packages/server/CLAUDE.md`
- Building Next.js pages, API routes, or E2E tests → `apps/web/CLAUDE.md`

## Essential Commands Reference

### Initial Setup (First Time)
```bash
pnpm install && pnpm submodule:init && pnpm dev-docker && pnpm build && pnpm db:migrate && pnpm dev
```

### Daily Development
```bash
pnpm dev                    # Start all dev servers with hot reload
pnpm build                  # Build all packages with Turbo caching
pnpm lint-fix               # Auto-fix linting issues
```

### Testing
```bash
pnpm test:auth              # Authentication tests
pnpm test:e2e               # E2E tests with Playwright UI
pnpm test:e2e:debug         # Debug E2E tests step-by-step
pnpm test:chatflows         # Chatflow configuration tests

# Single test file
pnpm --filter web test:e2e -- tests/auth.spec.ts
```

### Database
```bash
pnpm db:migrate             # Run Prisma migrations (dev) - PROMPT USER BEFORE RUNNING
pnpm db:deploy              # Run migrations (production)
pnpm db:studio              # Open Prisma Studio GUI
pnpm db:healthcheck         # Check database connectivity
pnpm migration:generate     # Generate TypeORM migration
pnpm migration:run          # Run TypeORM migrations
```

### Build & Clean
```bash
pnpm build-force            # Clean build (ignores Turbo cache)
pnpm clean                  # Clean build artifacts
pnpm nuke                   # Nuclear clean (removes node_modules)
```

### Package-Specific
```bash
pnpm --filter flowise-components build    # Build components only
pnpm --filter flowise-server dev          # Run server in dev mode
pnpm --filter web build                   # Build Next.js app
```

## Critical Information for Claude Code

### Always Check Before Acting

1. **Migrations:** NEVER run `pnpm db:migrate` without explicitly asking the user first
2. **PRs:** Always create pull requests against `staging` branch, NOT `main`
3. **Submodules:** Run `pnpm submodule:init` or `pnpm submodule:reset` from repository root only
4. **TheAnswer Components:** Always include `tags: ['AAI']` when creating Flowise components
5. **Multi-tenancy:** All resources MUST filter by `organizationId` and include `userId`

### Git Branch Strategy

- `main` → Production (DO NOT PR AGAINST THIS)
- `staging` → Pre-production (CREATE PRS AGAINST THIS)
- Feature branches → Created from `staging`

### Commit Message Format
```
feat: description of new feature
fix: description of bug fix
chore: dependencies, tooling, maintenance
docs: documentation updates
refactor: code improvements without behavior change
test: testing updates
```

## Repository Structure for Context

```
theanswer/
├── packages/                        # Flowise core (forked)
│   ├── server/                      # Express API, TypeORM, routes/controllers/services
│   ├── ui/                          # React frontend (Flowise UI)
│   ├── components/                  # Flowise nodes (agents, tools, chatmodels, etc.)
│   │   ├── nodes/                   # 29 node categories
│   │   │   ├── agents/              # LangChain agent implementations
│   │   │   ├── chatmodels/          # LLM integrations (OpenAI, Anthropic, etc.)
│   │   │   ├── tools/               # Agent tools and MCP servers
│   │   │   ├── documentloaders/     # Data source loaders
│   │   │   └── vectorstores/        # Vector database connectors
│   │   └── credentials/             # API credential definitions
│   ├── embed/                       # Git submodule - chat embed
│   └── docs/                        # Docusaurus documentation
├── packages-answers/                # TheAnswer extensions
│   ├── db/                          # Prisma database layer
│   ├── ui/                          # TheAnswer UI components
│   └── utils/                       # Shared utilities
├── apps/
│   └── web/                         # Next.js 13+ App Router with Auth0
│       ├── app/                     # App Router pages
│       │   ├── (Main UI)/           # Protected route group
│       │   └── api/                 # API routes
│       └── e2e/                     # Playwright E2E tests
└── scripts/                         # Dev and deployment scripts
```

## Architecture Patterns (Quick Reference)

### Server-Side: 4-Layer Pattern

All backend resources follow this pattern:

1. **Routes** (`packages/server/src/routes/{resource}/`) - RESTful endpoints with `enforceAbility` middleware
2. **Controllers** (`packages/server/src/controllers/{resource}/`) - Request validation, calls services, uses `checkOwnership()`
3. **Services** (`packages/server/src/services/{resource}/`) - Business logic, database operations
4. **Entities** (`packages/server/src/database/entities/`) - TypeORM models with `userId`, `organizationId`, timestamps

**Required for all entities:**
- UUID primary key
- `userId` (indexed)
- `organizationId` (indexed)
- `createdDate`, `updatedDate`

**See `packages/server/CLAUDE.md` for detailed implementation with code examples**

### Flowise Components

Components implement `INode` interface:

```typescript
class ComponentName_Category implements INode {
    label: string
    name: string
    version: number
    type: string
    category: string
    tags: string[] = ['AAI']  // REQUIRED for TheAnswer components
    inputs: INodeParams[]
    credential?: INodeParams
    async init(nodeData: INodeData): Promise<any> { }
}
```

**See `packages/components/CLAUDE.md` for detailed component development**

### Next.js App Router

- **Server Components** (default): Data fetching, can access DB directly
- **Client Components** (`'use client'`): Interactivity, hooks, browser APIs
- **Middleware** (`middleware.ts`): Auth0 protection for routes
- **API Routes** (`app/api/`): Server-side API endpoints

**See `apps/web/CLAUDE.md` for detailed Next.js patterns**

## Multi-Tenancy & Authentication

### Authentication Methods (in order of priority)

1. **API Key** (Primary): `Authorization: Bearer <api-key>`
2. **JWT** (Fallback): Auth0 JWT tokens for UI

### Multi-Tenancy Implementation

**CRITICAL: All database queries MUST filter by organization:**

```typescript
// In services
where: {
  organizationId: user.organizationId,
  userId: user.id  // For non-admin users
}

// In controllers - ALWAYS check ownership
if (req.user && !(await checkOwnership(resource, req.user, req))) {
    throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'Unauthorized')
}
```

### Permission Levels

- **Admin:** Full organization access
- **User:** Own resources + org-visible resources
- **API Key:** Scoped access per key configuration

## Database Systems (Dual)

### TypeORM (Flowise Core)
- **Location:** `packages/server/src/database/entities/`
- **Migrations:** `pnpm migration:generate`, `pnpm migration:run`
- **Used for:** Chatflows, Credentials, Tools, ChatMessages, etc.

### Prisma (TheAnswer Extensions)
- **Location:** `packages-answers/db/prisma/schema.prisma`
- **Migrations:** `pnpm db:migrate` (dev), `pnpm db:deploy` (prod)
- **Used for:** TheAnswer-specific features

### Local Database Connection
```
Host: localhost:5432
User: example_user
Pass: example_password
DB:   example_db
```

## Turbo Build System

### Build Dependencies (Important for Understanding Build Order)

```
packages/components → packages/server → packages/ui → apps/web
                   ↘                                 ↗
                    packages-answers/db → apps/web
```

### Key Concepts

- **Parallel builds:** Independent packages build concurrently
- **Caching:** Turbo caches unchanged package outputs
- **No cache for DB:** Migrations always run fresh (`cache: false`)
- **Task dependencies:** Defined in `turbo.json` via `dependsOn`

### Common Turbo Issues

```bash
# Cache issues
pnpm build-force

# Complete reset
pnpm nuke && pnpm install && pnpm build
```

## Environment Variables

### Required Files

1. `.env` in repository root (copy from `.env.template`)
2. `apps/web/.env.test` for E2E tests (copy from `apps/web/e2e/env.example`)

### Critical Variables

```bash
# Database
DATABASE_URL=postgresql://example_user:example_password@localhost:5432/example_db
REDIS_URL=redis://localhost:6379

# Auth0 (requires team access for dev)
AUTH0_SECRET=your-secret
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-audience

# API (IMPORTANT: Use API_HOST, not deprecated API_BASE_URL)
API_HOST=http://localhost:3000
FLOWISE_DOMAIN=http://localhost:3000

# BWS Secure (production secrets management)
BWS_ACCESS_TOKEN=your-bitwarden-token
```

## Git Submodules

The repository uses submodules for `packages/embed`:

```bash
# Initialize (run from repo root ONLY)
pnpm submodule:init

# Reset if issues occur
pnpm submodule:reset

# Check status
git submodule status
# Should show: +{hash} packages/embed (aai-embed@{version})
```

**CRITICAL: Never run submodule commands from inside submodule directories**

## Error Handling Patterns

### Always Use `InternalFlowiseError`

```typescript
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'

// Format: Error: {serviceName}.{methodName} - {description}
throw new InternalFlowiseError(
    StatusCodes.NOT_FOUND,
    `Error: chatflowService.getChatflowById - Chatflow ${id} not found`
)

// Wrap external errors
try {
    // operation
} catch (error) {
    throw new InternalFlowiseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error: serviceName.methodName - ${getErrorMessage(error)}`
    )
}
```

## 📋 Daily Development Workflow

This repository uses Claude Code commands to streamline development from ticket to deployment. Here's how to use them day-to-day.

### The Three-Command Workflow

```
/ticket-start → /push (repeat) → /pr-review
```

That's all you need! Let's break it down:

---

### 1️⃣ Starting Your Day: Pick Up Work

**Option A: Start work on an existing ticket**
```bash
/ticket-start AAI-123
```

What happens:
- ✅ Fetches ticket details from Linear
- ✅ Explores codebase for relevant context
- ✅ Creates implementation plan with steps
- ✅ Creates git branch: `feature/AAI-123-{description}`
- ✅ Updates Linear: Todo → In Progress
- ✅ You're ready to code!

**Option B: Create a new ticket first**
```bash
/ticket-create Add OAuth2 token refresh support
```

What happens:
- ✅ Guides you through ticket creation with prompts
- ✅ Suggests labels and related tickets
- ✅ Creates ticket in Linear
- ✅ Offers to start work immediately

---

### 2️⃣ During Development: Push Your Changes

**The magic command that does everything:**
```bash
/push "your commit message"
```

**What `/push` does automatically:**

| Your Situation | What Happens |
|---------------|-------------|
| **First push** | Commits → Pushes → Creates PR targeting staging → Updates Linear to "In Review" |
| **Subsequent pushes** | Commits → Pushes → Updates existing PR |
| **Already pushed** | "Everything up-to-date" |

**Example workflow:**
```bash
# Iteration 1: Add basic feature
/push add token refresh endpoint
# ✓ Committed: feat(AAI-123): add token refresh endpoint
# ✓ Pushed to remote
# ✓ Created PR #456 targeting staging
# ✓ Linear updated: In Progress → In Review

# Iteration 2: Add validation
/push add token validation
# ✓ Committed: feat(AAI-123): add token validation
# ✓ Pushed to remote
# ✓ PR #456 updated with new commits

# Iteration 3: Add tests
/push add OAuth2 integration tests
# ✓ Committed: test(AAI-123): add OAuth2 integration tests
# ✓ Pushed to remote
# ✓ PR #456 updated with new commits
```

**Safety features built-in:**
- ❌ **Blocks** commits to staging/main/production
- ❌ **Requires** Linear ticket ID in branch name
- ✅ **Validates** conventional commit format
- ✅ **Checks** for sensitive data and debug code
- ✅ **Verifies** multi-tenancy and authentication patterns
- ✅ **Enforces** staging as PR target (never main)

---

### 3️⃣ Getting Feedback: Review Process

**Review your own PR or someone else's:**
```bash
/pr-review          # Reviews your current branch's PR
/pr-review 456      # Reviews PR #456
```

What the review checks:
- ✅ Security (no hardcoded secrets, SQL injection, XSS)
- ✅ Multi-tenancy (organizationId filters present)
- ✅ Authentication (enforceAbility middleware on routes)
- ✅ Code quality and architecture
- ✅ Test coverage
- ✅ TheAnswer-specific patterns

**Output:**
- Structured review with critical issues, suggestions, and strengths
- Posts directly to GitHub PR
- Provides actionable next steps

---

### 🔄 Complete Real-World Example

**Monday morning: Start new feature**
```bash
# Pick up ticket from Linear
/ticket-start AAI-789

# Output:
# ✓ Fetched AAI-789: Add rate limiting to OAuth endpoints
# ✓ Explored codebase (found 3 similar implementations)
# ✓ Created plan with 6 steps
# ✓ Created branch: feature/AAI-789-add-rate-limiting-oauth
# ✓ Linear updated: Todo → In Progress
#
# Ready to implement!
```

**Monday afternoon: Initial implementation**
```bash
# Implement step 1
/push add rate limiter middleware

# Output:
# ✓ Committed: feat(AAI-789): add rate limiter middleware
# ✓ Pushed to origin
# ✓ Created PR #457 targeting staging
# ✓ Linear updated: In Progress → In Review
#
# PR: https://github.com/the-answerai/theanswer/pull/457
```

**Tuesday: Add tests**
```bash
/push add rate limiter tests

# Output:
# ✓ Committed: test(AAI-789): add rate limiter tests
# ✓ Pushed to origin
# ✓ PR #457 updated
```

**Wednesday: Address review feedback**
```bash
/push fix rate limit configuration

# Output:
# ✓ Committed: fix(AAI-789): fix rate limit configuration
# ✓ Pushed to origin
# ✓ PR #457 updated
```

**Ready for merge!**

---

### 🎯 Key Benefits

| Traditional Flow | With Claude Code |
|-----------------|------------------|
| `git checkout -b feature/...` | `/ticket-start AAI-123` (creates proper branch) |
| `git add . && git commit -m "..."` | `/push "message"` (commits with validation) |
| `git push` | Already done by `/push` |
| Manually create PR in GitHub | Already done by `/push` |
| Manually update Linear | Already done by `/push` |

**Result:** 5+ manual steps → 1 command

---

### 💡 Pro Tips

**Commit often:**
```bash
/push "add endpoint"
/push "add validation"
/push "add tests"
```
Small, focused commits are better than one big commit.

**Let `/push` handle everything:**
Don't manually commit, push, or create PRs. Let `/push` do it all with proper validation.

**Review early:**
Run `/pr-review` on your own PR before requesting team review.

**Branch naming is automatic:**
`/ticket-start` creates properly named branches. Don't create branches manually.

---

### 🚨 Common Mistakes to Avoid

❌ **Don't commit directly to staging/main**
```bash
# Wrong
git checkout staging
/push "urgent fix"  # ERROR: Blocked!

# Right
/ticket-start AAI-123  # Creates feature branch
/push "urgent fix"
```

❌ **Don't create branches without tickets**
```bash
# Wrong
git checkout -b my-feature
/push "add feature"  # ERROR: No ticket ID!

# Right
/ticket-create My Feature  # Creates AAI-123
/ticket-start AAI-123      # Creates feature/AAI-123-my-feature
/push "add feature"
```

❌ **Don't manually create PRs**
```bash
# Wrong
gh pr create ...  # Manual PR creation

# Right
/push "commit message"  # Creates PR automatically on first push
```

---

### 📚 Advanced Commands

**For special situations:**

```bash
# Review specific PR
/pr-review 456

# Create ticket and start immediately
/ticket-create Add new feature
# (Agent will offer to start work)

# Check PR status without reviewing
gh pr view
```

---

### 🏗️ Architecture Overview

The `.claude/` directory contains:
- **skills/** - Reusable patterns (git-branch, commit-helper, pr-description-generator, ticket-status-sync)
- **commands/** - User-facing slash commands (ticket-create, ticket-start, **push**, pr-review)
- **agents/** - Complex autonomous tasks (linear-ticket-creator, linear-ticket-planner, git-pr-manager, git-pr-reviewer)

See `.claude/README.md` for complete architecture documentation.

## Development Workflows for Claude Code

### When Adding a New Backend Resource

1. Read `packages/server/CLAUDE.md` for detailed 4-layer implementation
2. Create route → controller → service → entity
3. Register route in `packages/server/src/index.ts`
4. Generate TypeORM migration: `pnpm migration:generate`
5. Ask user if they want to run migration
6. Add API client in `packages/ui/src/api/`
7. Create view in `packages/ui/src/views/`

### When Creating a Flowise Component

1. Read `packages/components/CLAUDE.md` for detailed component structure
2. Create component file in `packages/components/nodes/{category}/`
3. Implement `INode` interface with `tags: ['AAI']`
4. Add credential in `packages/components/credentials/` if needed
5. Build: `pnpm --filter flowise-components build`
6. Test in Flowise UI

### When Building a Next.js Page

1. Read `apps/web/CLAUDE.md` for App Router patterns
2. Create page in `apps/web/app/(Main UI)/{route}/`
3. Use Server Component for data fetching
4. Use Client Component (`'use client'`) for interactivity
5. Protect with Auth0 middleware (check `middleware.ts`)
6. Add E2E test in `apps/web/e2e/tests/`

## Testing

### Test Locations

- **E2E:** `apps/web/e2e/` - Role-based auth, user flows (Playwright)
- **Auth:** `packages/server/test/api/` - JWT, API key validation (Jest)
- **Chatflows:** Run with `pnpm test:chatflows`

### Running Tests

```bash
# E2E tests (first time setup)
pnpm test:e2e:setup

# Run E2E with UI
pnpm test:e2e

# Debug mode
pnpm test:e2e:debug

# Single test
pnpm --filter web test:e2e -- tests/auth.spec.ts
```

## Common Issues & Solutions

### Build Failures

```bash
# Turbo cache corruption
pnpm build-force

# Memory issues
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build

# Complete reset
pnpm nuke && pnpm install && pnpm build
```

### Submodule Issues

```bash
# Reset submodules completely
pnpm submodule:reset

# Verify status
git submodule status
```

### Database Connection Issues

```bash
# Check Docker containers running
pnpm dev-docker

# Verify DB connection
pnpm db:healthcheck

# Reset database (DESTRUCTIVE - ask user first)
pnpm db:reset
```

### Auth Issues

- Verify `.env` has correct Auth0 configuration
- Check callback URLs in Auth0 dashboard match `AUTH0_BASE_URL`
- Clear browser cookies
- Ensure user has organization membership in Auth0

## Import Path Aliases

```typescript
// TheAnswer packages
import { utility } from '@utils/utility'
import { Component } from '@ui/Component'
import { schema } from '@db/schema'

// Flowise packages
import { FlowiseComponent } from '@/components/FlowiseComponent'
import { api } from '@/api/client'
```

## Security Checklist

When implementing features, verify:

- [ ] All routes have `enforceAbility` middleware
- [ ] Controllers use `checkOwnership()` for authorization
- [ ] All inputs validated before processing
- [ ] Database queries filter by `organizationId`
- [ ] Sensitive data not exposed in client code
- [ ] Error messages don't leak sensitive information
- [ ] Credentials use credential system (not hardcoded)

## Key Documentation Files

### For Implementation Details
- `packages/components/CLAUDE.md` - Component development
- `packages/server/CLAUDE.md` - Backend API patterns
- `apps/web/CLAUDE.md` - Next.js application
- `packages/server/AUTHORIZATION.md` - Auth system details

### For Understanding Patterns
- `.cursorrules` - Resource implementation patterns
- `AGENTS.md` - Codebase patterns and conventions

### For Setup & Reference
- `README.md` - Setup instructions
- `CONTRIBUTING.md` - Git submodules guide
- `TESTING_STRATEGY.md` - Testing documentation
- `turbo.json` - Build pipeline config
- `.env.template` - Environment variables

## Deployment

### Docker
```bash
pnpm dev-docker                    # Development (PostgreSQL + Redis)
docker build -t theanswer .        # Production build
docker run -p 3000:3000 theanswer  # Run container
```

### Render
One-click deployment via "Deploy to Render" button. See `render.yaml`.

### AWS Copilot
```bash
pnpm copilot              # Interactive deployment
pnpm copilot:auto         # Auto-deploy with environment detection
```

## Important Reminders for Claude Code

1. **NEVER run migrations without asking:** Always prompt user before `pnpm db:migrate`
2. **Always PR to staging:** Create PRs against `staging`, NEVER against `main`
3. **Use `/push` workflow:** Let `/push` handle commits, pushes, and PR creation with validation
4. **Submodules from root only:** Run submodule commands from repository root
5. **Auth0 access required:** Local dev needs Auth0 team access (Member+)
6. **Use API_HOST:** The `API_BASE_URL` variable is deprecated
7. **Tag all components:** Include `tags: ['AAI']` for TheAnswer components
8. **Multi-tenancy is critical:** All queries MUST filter by `organizationId`
9. **Check ownership:** Use `checkOwnership()` in controllers for authorization
10. **Read package docs:** Use package-specific CLAUDE.md files for detailed guidance
11. **Pre-commit hooks:** May fail; use `git commit --no-verify` if needed

## 💬 Feedback & Support

### Using Claude Code Workflows

- **🏗️ Architecture & Guide:** See [`.claude/README.md`](.claude/README.md)
- **📝 Command docs:** See files in `.claude/commands/`
- **💼 Daily workflow:** See [Daily Development Workflow](#daily-development-workflow) section above

### Reporting Issues

**Found a bug or have suggestions?**

1. **Workflow issues:** Create GitHub issue with label `claude-code-workflow`
2. **Documentation unclear:** Create PR or issue with label `documentation`
3. **Feature requests:** Create GitHub issue with label `enhancement`

```bash
# Report a bug
gh issue create \
  --title "Bug: /push fails with error X" \
  --label "claude-code-workflow" \
  --body "Steps to reproduce..."

# Suggest improvement
gh issue create \
  --title "Feature: Add /ticket-list command" \
  --label "enhancement" \
  --body "Use case and benefits..."
```

### Getting Help

1. Check [`.claude/README.md`](.claude/README.md) - Architecture deep dive and complete guide
2. Check [Daily Development Workflow](#daily-development-workflow) - Usage examples and workflows
3. Check command-specific docs in `.claude/commands/[command].md`
4. Ask in team Slack
5. Create GitHub issue with `help-wanted` label

### Contributing

Improvements to the workflow system are welcome!

**Areas for contribution:**
- Additional commands (e.g., `/ticket-list`, `/branch-cleanup`)
- Enhanced validation checks
- Better error messages
- Documentation improvements

See [`.claude/README.md`](.claude/README.md) → "Extending the System" for how to add skills, commands, or agents.
