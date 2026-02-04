# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0](https://github.com/the-answerai/theanswer/compare/v1.13.0...v2.0.0) (2026-01-13)

This is a **major release** that upgrades the core Flowise engine from v1.x to **v3.0.11**, introduces **AgentFlow V2**, adds **40+ new components**, and implements critical security fixes for multi-tenant workspace isolation.

### Table of Contents
- [Breaking Changes](#breaking-changes)
- [Flowise 3.0.11 Upgrade](#flowise-3011-upgrade)
- [AgentFlow V2](#agentflow-v2)
- [New Components](#new-components)
- [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
- [Database Migrations](#database-migrations)
- [UI/UX Improvements](#uiux-improvements)
- [Bug Fixes](#bug-fixes)
- [Security](#security)
- [Infrastructure](#infrastructure)
- [Deprecations](#deprecations)

---

### Breaking Changes

#### 1. AGENT-589: Cross-Workspace Chat Isolation (CRITICAL SECURITY FIX)

**Severity:** CRITICAL - Data Leak Vulnerability

**Vulnerability Description:**

The previous chat query logic contained an OR condition that allowed users to see chats from ALL workspaces they had ever accessed:

```typescript
// VULNERABLE CODE (v1.x)
queryBuilder.andWhere(
    '(chatflow.workspaceId IN (:...workspaceIds) OR chat.ownerId = :userId)',
    { workspaceIds: user.assignedWorkspaces, userId: user.id }
)
```

This meant:
- A user in Workspace A could see confidential chats from Workspace B
- Switching workspaces showed a combined view of ALL workspace chats
- Enterprise customers with multiple workspaces had no data isolation
- Compliance requirements (SOC2, HIPAA, GDPR) for data separation were violated

**The Fix (3-part remediation):**

**Part 1:** Changed from filtering by all `assignedWorkspaces` to filtering by `activeWorkspaceId` only:
```typescript
// FIXED: Filter by active workspace only
queryBuilder.andWhere(
    'chatflow.workspaceId = :activeWorkspaceId',
    { activeWorkspaceId: user.activeWorkspaceId }
)
```

**Part 2:** Removed the OR condition with `ownerId` entirely - workspace now determines visibility:
```typescript
// No more fallback to ownerId - workspace is the boundary
if (!user.activeWorkspaceId) {
    // Security default: no workspace = no data
    queryBuilder.andWhere('1 = 0')
}
```

**Part 3:** Added user ownership filter to prevent cross-user access within workspace:
```typescript
// Users only see their OWN chats
queryBuilder.andWhere('chat.ownerId = :userId', { userId: user.id })
```

**New Behavior:**
| Scenario | v1.x Behavior | v2.0.0 Behavior |
|----------|--------------|-----------------|
| User switches from Workspace A to B | Sees chats from A AND B | Sees ONLY chats from B |
| User has no active workspace | Sees all owned chats | Sees NO chats (security default) |
| User views workspace chats | Sees all workspace chats | Sees only their OWN chats |
| Admin views workspace | Sees all organization chats | Sees only active workspace chats |

**Migration Impact:**
- Users will no longer see chats from other workspaces
- Historical chats remain in database but are filtered by workspace
- If users need access to old chats, they must switch to the correct workspace
- **This is intentional for data isolation and security compliance**

**Affected Files:**
- `packages/server/src/services/chat-messages/index.ts`
- `packages/server/src/services/chatflows/index.ts`

**Commits:** `320175295`, `a1a2bfd49`, `d5a57fce3`

---

#### 2. AGENT-593: Chatflow Configuration Data Loss (CRITICAL DATA INTEGRITY FIX)

**Severity:** CRITICAL - Silent Data Loss

**Vulnerability Description:**

When importing/exporting chatflows, critical configuration fields were silently dropped due to missing field mappings. Users would export a fully configured chatflow and import it with missing settings.

**Fields That Were Lost:**
- `answersConfig` - TheAnswer-specific configuration
- `browserExtConfig` - Browser extension settings
- `chatbotConfig` - Chatbot widget configuration
- `speechToText` - STT settings
- `textToSpeech` - TTS settings
- `followUpPrompts` - Follow-up prompt configuration
- `apiConfig` - API settings
- `analytic` - Analytics configuration

**Impact:**
- Users lost hours of configuration work on import
- Exported chatflows were incomplete
- Migrating between environments required manual reconfiguration
- No warning or error was shown

**The Fix:**

Added all missing fields to `handleLoadFlow` in both canvas and agentflowsv2:

```typescript
// Now preserves ALL configuration
if (flowData.answersConfig) chatflow.answersConfig = flowData.answersConfig
if (flowData.browserExtConfig) chatflow.browserExtConfig = flowData.browserExtConfig
if (flowData.chatbotConfig) chatflow.chatbotConfig = flowData.chatbotConfig
if (flowData.speechToText) chatflow.speechToText = flowData.speechToText
if (flowData.textToSpeech) chatflow.textToSpeech = flowData.textToSpeech
if (flowData.followUpPrompts) chatflow.followUpPrompts = flowData.followUpPrompts
if (flowData.apiConfig) chatflow.apiConfig = flowData.apiConfig
if (flowData.analytic) chatflow.analytic = flowData.analytic
```

**Commits:** `cf5dfa450`, `2b7a67501`, `2bb834d99`

---

#### 3. Request Header Change (API Breaking Change)

**Severity:** HIGH - Requires Client Code Updates

All API requests from the web app now use a new authentication header:

```typescript
// BEFORE (v1.x)
headers: { 'x-request-from': 'internal' }

// AFTER (v2.0.0)
headers: { 'x-request-from': 'aai' }
```

**Why This Changed:**

The new `aai` header triggers Auth0 RS256 JWT verification as the primary authentication method, providing:
- Stronger cryptographic verification
- Better alignment with Auth0 standards
- Clear separation from enterprise HS256 authentication

**Files That Must Be Updated:**

Any custom integrations or clients making direct API calls must update their headers:

| File/Integration | Update Required |
|-----------------|-----------------|
| Custom API clients | Change header value |
| Browser extensions | Change header value |
| External integrations | Change header value |
| Mobile apps | Change header value |

**Affected AAI Files (already updated):**
- `apps/web/app/(Main UI)/(Chat UI)/chat/[chatId]/page.tsx`
- `apps/web/app/api/images/archive/route.ts`
- `apps/web/app/api/images/generate/route.ts`
- `packages-answers/ui/src/AnswersContext.tsx`
- `packages-answers/ui/src/CsvTransfomer/ProcessCsv.tsx`
- `packages-answers/ui/src/CsvTransfomer/ProcessingHistory.tsx`
- `packages-answers/ui/src/ImageCreator/ImageCreator.Client.tsx`
- `packages-answers/ui/src/Profile/Profile.tsx`
- `packages-answers/ui/src/VideoCreator/VideoCreator.Client.tsx`
- `packages-answers/utils/src/findSidekickById.ts`
- `packages-answers/utils/src/findSidekicksForChat.ts`
- `packages-answers/utils/src/getChats.ts`
- `packages/ui/src/api/client.js`

---

#### 4. AgentFlow V1 Deprecated

**Severity:** MEDIUM - Migration Recommended

AgentFlow V1 (Sequential Agents based on LangGraph) is deprecated in favor of AgentFlow V2.

**What Happens:**
- V1 flows continue to work
- V1 flows are labeled as "Agentflow V1" in the UI
- No new V1 features will be developed
- UI shows migration recommendation

**V1 vs V2 Incompatibilities:**

| Aspect | V1 (Sequential Agents) | V2 (AgentFlow) |
|--------|------------------------|----------------|
| Flow Type | `MULTIAGENT` | `AGENTFLOW` |
| State | LangGraph `StateGraph` | Built-in Flow State |
| Memory | External `BaseCheckpointSaver` | Built-in options |
| Execution | `init()` returns LangGraph nodes | `run()` returns output |
| Nodes | 12 node types | 16 node types |

**Migration Path:**
1. Create new AgentFlow V2
2. Recreate logic using V2 nodes
3. Test thoroughly
4. Archive V1 flow

---

#### 5. Enterprise Database Schema Restructure (CRITICAL)

**Severity:** CRITICAL - Requires Database Backup

The enterprise database schema has been completely restructured to support the new workspace-based RBAC system.

**Tables Restructured:**

| Table | Changes |
|-------|---------|
| `user` | New schema: `name`, `email`, `credential`, `tempToken`, `tokenExpiry`, `status`, `createdBy`, `updatedBy` |
| `organization` | New schema: `customerId`, `subscriptionId`, `createdBy`, `updatedBy` |

**New Tables Created:**

| Table | Purpose |
|-------|---------|
| `login_method` | SSO configurations per organization |
| `role` | Permission definitions with JSON permissions array |
| `organization_user` | User-organization junction with roleId and status |
| `workspace_user` | User-workspace junction with roleId, status, lastLogin |

**Migration Process:**

The migration uses a "sandwich" approach to preserve AAI-specific data:

1. **`BackupAAIData1737076223690`** (runs FIRST)
   - Creates `aai_user_backup` table
   - Creates `aai_organization_backup` table
   - Preserves: `auth0Id`, `stripeCustomerId`, `organizationId`, `trialPlanId`, `defaultChatflowId`

2. **`RefactorEnterpriseDatabase1737076223692`** (runs SECOND)
   - Restructures user and organization tables
   - Creates new junction tables
   - **WARNING: This migration has an empty `down()` method - cannot be auto-rolled back**

3. **`AAIRestoreDataAndCreateWorkspaces1737076223693`** (runs THIRD)
   - Restores AAI-specific columns
   - Restores data from backup tables
   - Creates "Default Workspace" per organization
   - Creates "Personal Workspace" per user
   - Links users to workspaces via `workspace_user`

**⚠️ CRITICAL: BACKUP YOUR DATABASE BEFORE MIGRATING**

---

### Flowise 3.0.11 Upgrade

This release incorporates all changes from Flowise upstream versions 2.2.7 through 3.0.11, representing approximately **400+ commits** of improvements.

#### Key Upstream Features Included

| Feature | Description |
|---------|-------------|
| AgentFlow V2 | Complete redesign of multi-agent workflows |
| MCP Updates | Model Context Protocol improvements and SSE support |
| Evaluation System | Dataset-based evaluation for chatflows and agentflows |
| Execution Tracking | Full execution history with shareable links |
| Pagination | New pagination system for large datasets |
| Text-to-Speech | Built-in TTS support |
| Chatflow Versioning | Version tracking and S3 storage support |

---

### AgentFlow V2

AgentFlow V2 is a **complete redesign** of the multi-agent workflow system, replacing the LangGraph-based Sequential Agents with a new, more flexible architecture.

#### What's New in AgentFlow V2

| Feature | Description |
|---------|-------------|
| **Simplified Model Config** | Each node selects its own LLM via dropdown (no wiring required) |
| **Built-in Flow State** | State defined in Start node, updateable by any node |
| **Execution Tracking** | Full history with `Execution` entity and shareable links |
| **Form Input Support** | Start node supports form-based input with validation |
| **Rich Variable System** | `{{ $question }}`, `{{ $form.field }}`, `{{ nodeId.output }}`, etc. |
| **Memory Options** | Built-in ephemeral/persistent memory configuration |
| **Human-in-the-Loop** | Native Human Input node for approval workflows |
| **Iteration Support** | Process arrays in parallel or sequence |

#### New AgentFlow V2 Nodes (16 total)

| Node | Description |
|------|-------------|
| **Start** | Entry point with chat/form input, state definition |
| **LLM** | Direct LLM invocation with memory options |
| **Agent** | Full agent with tools, knowledge bases, structured output |
| **Condition** | If/Else branching with comparisons |
| **ConditionAgent** | LLM-based routing decisions |
| **Human Input** | Human-in-the-loop approval/rejection |
| **Loop** | Loop back to previous node with max iterations |
| **Iteration** | Process array items in parallel/sequence |
| **HTTP** | HTTP requests (GET/POST/PUT/DELETE/PATCH) |
| **Execute Flow** | Call other chatflows/agentflows |
| **Custom Function** | JavaScript code execution |
| **Tool** | Single tool invocation |
| **Direct Reply** | Send immediate response |
| **Retriever** | Vector store retrieval |
| **Sticky Note** | Canvas annotations |

#### New Marketplace Templates

- Agentic RAG V2
- Deep Research V2 / With Multi-turn / With Subagents
- Agents Handoff
- Email Reply HITL Agent
- Financial Research Agent
- Human In The Loop
- Interacting With API
- Iterations
- SQL Agent
- Simple RAG
- Slack Agent
- Structured Output
- Supervisor Worker
- Translator
- Workplace Chat

#### Migration from V1

V1 Sequential Agent nodes are **NOT compatible** with V2 AgentFlow nodes. Manual migration is required:
- V1 type: `MULTIAGENT` → V2 type: `AGENTFLOW`
- V1 uses LangGraph State → V2 uses Flow State
- V1 requires external memory → V2 has built-in memory

**Commits:** `7924fbce0` (Feature/agentflow v2), `e17994d8f` (Evaluations for Agentflows)

---

### New Components

#### New Chat Models

| Component | Description | Commit |
|-----------|-------------|--------|
| **ChatCometAPI** | Unified API gateway for multiple LLM providers (GPT-5, Claude, Gemini) | `099cf481b` |
| **ChatSambanova** | High-performance AI inference (Llama 3.3 70B default) | `bf1ddc3be` |

#### Model Updates

| Model | Commit |
|-------|--------|
| Claude 4, Claude Opus 4.1 | `9bc6bfed6`, `fbae51b26` |
| Claude Sonnet 4.5 | `28b0174ee`, `b50193249` |
| GPT-5 series | `3b1b4dc5f`, `fa15b6873` |
| GPT-4.1 series | `e75c831be` |
| Azure GPT-5/4.1 | `79023c890` |
| Gemini 2.5 Flash | `e35a126b4` |
| Gemini Thinking Budget | `f3d5b7766` |
| Llama 4 on Groq | `5faff5205` |
| AWS Bedrock OSS models | `a5a728fd0` |

#### New Tools (15+)

| Tool | Description | Commit |
|------|-------------|--------|
| **AWS SNS** | Publish messages to AWS SNS topics | `32e5b13c4` |
| **AWS DynamoDB KV Storage** | Store/retrieve versioned values with auto-versioning | `736c2b11a` |
| **JSONPathExtractor** | Extract values from JSON using path expressions | `b12647281` |
| **Jira** | Full Jira operations (issues, comments, users, JQL) | `9d9135bed` |
| **Gmail** | Full Gmail operations (drafts, messages, labels, threads) | `30c4180d9` |
| **Google Docs** | Create, read, update documents, text manipulation | `2387a06ce` |
| **Google Calendar** | Calendar event management | `30c4180d9` |
| **Google Drive** | File management | `30c4180d9` |
| **Google Sheets** | Spreadsheet operations | `30c4180d9` |
| **Microsoft Teams** | Channels, chats, messages management | `30c4180d9` |
| **Microsoft Outlook** | Calendars, events, messages | `30c4180d9` |
| **Arxiv** | Search academic papers | - |
| **RequestsPut/Delete** | HTTP PUT and DELETE tools | - |

#### New Document Loaders

| Loader | Description | Commit |
|--------|-------------|--------|
| **Oxylabs** | Web scraping via Oxylabs API | `a25c5c451` |
| **Google Sheets** | Load spreadsheet data as documents | - |
| **Microsoft Excel** | Load .xlsx, .xls, .xlsm, .xlsb files | `fbe9f34a6` |
| **Microsoft PowerPoint** | Load PowerPoint files | `fbe9f34a6` |
| **Microsoft Word** | Load Word documents | - |

#### New Vector Stores

| Store | Description | Commit |
|-------|-------------|--------|
| **AWS Kendra** | Intelligent search with document retrieval | `af1464f7c` |
| **Teradata VectorStore** | Teradata vector storage support | `ac565b898` |

#### New MCP Servers

| Server | Description | Commit |
|--------|-------------|--------|
| **Supergateway MCP** | Run MCP stdio servers over SSE/WebSockets | `954e6c88f` |
| **Teradata MCP** | Remote HTTP streamable MCP for Teradata | `dd284e37c` |

#### New Credentials (15 total)

- `AgentflowApi`, `CometApi`, `ElevenLabsApi`
- `GmailOAuth2`, `GoogleCalendarOAuth2`, `GoogleDocsOAuth2`, `GoogleDriveOAuth2`, `GoogleSheetsOAuth2`
- `MicrosoftOutlookOAuth2`, `MicrosoftTeamsOAuth2`
- `OxylabsApi`, `SambanovaApi`
- `TeradataBearerToken`, `TeradataTD2`, `TeradataVectorStoreApi`

#### Other Notable Additions

| Component | Description | Commit |
|-----------|-------------|--------|
| Cheerio Web Scraper | Fast web scraping node | `925ca7be8` |
| FireCrawl Extract Tool | Updated Firecrawl with extraction | `572fb31a1` |
| Mem0 Memory Node | Mem0 integration | `13fce4585` |
| Perplexity Node | Perplexity AI integration | `df26e8aef` |
| LiteLLM Component | LiteLLM proxy support | `d75e84709` |
| Text-to-Speech | Built-in TTS | `9b8fee3d8` |
| OpenAI Response API | OpenAI response format support | `b60821964` |
| Gemini Built-In Tools | Native Gemini tools | `f56076813` |

---

### Authentication & Multi-Tenancy

This release implements a complete overhaul of the authentication and authorization system, adopting Flowise's native RBAC while maintaining Auth0 integration for TheAnswer.

#### Authentication Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request → Check Whitelist → Check Header → Auth Method         │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Whitelisted │ YES │   Pass       │     │              │    │
│  │  Endpoint?   │────▶│   Through    │     │              │    │
│  └──────┬───────┘     └──────────────┘     │              │    │
│         │ NO                                │              │    │
│         ▼                                   │              │    │
│  ┌──────────────┐     ┌──────────────┐     │              │    │
│  │ x-request-   │ aai │ verifyAAI    │     │              │    │
│  │ from header? │────▶│ Token        │     │              │    │
│  └──────┬───────┘     └──────┬───────┘     │              │    │
│         │ internal          │              │              │    │
│         ▼                   ▼              │              │    │
│  ┌──────────────┐     ┌──────────────┐     │              │    │
│  │ Enterprise   │     │ Auth0 RS256  │ FAIL│ Enterprise   │    │
│  │ HS256        │     │ JWT Check    │────▶│ HS256        │    │
│  └──────────────┘     └──────────────┘     │ Fallback     │    │
│                             │ SUCCESS      └──────┬───────┘    │
│                             ▼                     │ FAIL       │
│                       ┌──────────────┐            ▼            │
│                       │ Enrich User  │     ┌──────────────┐    │
│                       │ Data         │     │ 401          │    │
│                       └──────────────┘     │ Unauthorized │    │
│                                            └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

#### Auth0 RS256 JWT Verification (Primary)

**Location:** `packages/server/src/middlewares/authentication/verifyAAIToken.ts`

The new `verifyAAIToken` middleware handles `x-request-from: aai` header requests with Auth0 RS256 JWT as the primary verification method.

**Implementation Details:**

```typescript
// JWT Configuration
const jwtCheck = auth({
    authRequired: true,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: process.env.AUTH0_TOKEN_SIGN_ALG ?? 'RS256'
})
```

**Authentication Flow:**

1. **Primary: Auth0 RS256 JWT**
   - Validates token signature using Auth0's public key
   - Verifies audience matches `AUTH0_AUDIENCE`
   - Verifies issuer matches `AUTH0_ISSUER_BASE_URL`
   - Extracts `org_id` from token payload

2. **Fallback: Enterprise HS256**
   - Used when Auth0 verification fails
   - Maintains backwards compatibility
   - Uses passport-based verification

3. **Failure: 401 Unauthorized**
   - No anonymous access allowed
   - Both methods must fail to return 401

**Organization Validation:**

```typescript
// Validates user belongs to allowed Auth0 organizations
const userOrgId = authPayload.org_id
const allowedOrgs = process.env.AUTH0_ORGANIZATION_ID?.split(',')
const isValidOrg = userOrgId && allowedOrgs?.includes(userOrgId)

if (!isValidOrg) {
    return res.status(401).json({
        message: "Unauthorized: Organization doesn't match"
    })
}
```

**Required Environment Variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `AUTH0_AUDIENCE` | API identifier | `https://api.theanswer.ai` |
| `AUTH0_ISSUER_BASE_URL` | Auth0 tenant URL | `https://theanswer.auth0.com` |
| `AUTH0_TOKEN_SIGN_ALG` | Signing algorithm | `RS256` (default) |
| `AUTH0_ORGANIZATION_ID` | Allowed org IDs | `org_abc123,org_def456` |

**Commit:** `e689e9b40`

---

#### Workspace-Based RBAC System

**Location:** `packages/server/src/services/*/index.ts`

Adopted Flowise's native RBAC system with workspace-based filtering replacing the previous organization-based filtering.

**Key Changes:**

| Before (v1.x) | After (v2.0.0) |
|---------------|----------------|
| Filter by `organizationId` | Filter by `workspaceId` |
| Organization-level permissions | Workspace-level permissions |
| Single permission set per user | Role-based permissions per workspace |

**Service Layer Changes:**

```typescript
// BEFORE: Organization-based filtering
const chatflows = await repository.find({
    where: { organizationId: user.organizationId }
})

// AFTER: Workspace-based filtering
const chatflows = await repository.find({
    where: { workspaceId: user.activeWorkspaceId }
})
```

**Permission Resolution:**

Permissions are resolved in priority order:

1. **Auth0 Admin Role** → Wildcard permissions `['*']`
2. **Workspace Role** → Permissions from `role.permissions` JSON
3. **Default** → No permissions (access denied)

```typescript
// Permission resolution logic
if (roles?.includes('Admin')) {
    permissions = ['*']  // Full access
} else if (workspaceData.roleId) {
    const role = await RoleRepository.findOne({
        where: { id: workspaceData.roleId }
    })
    permissions = JSON.parse(role.permissions)  // Role-specific
}
```

**RBAC Enforcement:**

```typescript
// In controllers - enforceAbility middleware
router.get('/', enforceAbility('Chatflow'), controller.getAll)

// In services - workspace filtering
const chatflows = await queryBuilder
    .where('chatflow.workspaceId = :workspaceId', {
        workspaceId: user.activeWorkspaceId
    })
    .getMany()
```

**Commit:** `bc6679fce`

---

#### User Enrichment System

**Location:** `packages/server/src/aai/auth/enrichUserData.ts`

Centralized user enrichment logic shared between `/auth/me` endpoint and `aaiPostAuthMiddleware`.

**Enriched User Data Structure:**

```typescript
interface EnrichedUserData {
    // === User Identity ===
    id: string                    // Database user ID
    auth0Id?: string              // Auth0 subject ID
    email: string                 // User email
    name?: string                 // Display name

    // === Organization Context ===
    organizationId: string        // Primary organization
    stripeCustomerId?: string     // Stripe customer ID
    defaultChatflowId?: string    // User's default chatflow

    // === RBAC Fields ===
    roles: string[]               // Auth0 roles (e.g., ['Admin', 'User'])
    permissions: string[]         // Resolved permissions (e.g., ['chatflow:read', 'chatflow:write'])

    // === Subscription/Billing (Flowise Parity) ===
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    features: Record<string, string>  // Feature flags from subscription

    // === Workspace Fields ===
    activeWorkspaceId?: string    // Currently active workspace
    activeOrganizationId?: string // Active organization
    activeWorkspace?: string      // Workspace name
    roleId?: string               // Role in active workspace
    isOrganizationAdmin?: boolean // Admin status

    // === Workspace List ===
    assignedWorkspaces?: Array<{
        id: string
        name: string
        role: string              // Role name
        organizationId: string
    }>
}
```

**Enrichment Process:**

```
1. Fetch user from database by auth0Id
2. Get organization data with Stripe info
3. Get workspace assignments from workspace_user
4. Resolve permissions from workspace role
5. Get subscription features
6. Return enriched user object
```

**Commit:** `8f119fb90`

---

#### AAIAuthProvider for Redux Store

**Location:** `apps/web/components/AAIAuthProvider.tsx`

Client component that dispatches `loginSuccess` to Redux store with enriched user data from server-side session.

**Implementation:**

```typescript
'use client'
import { useEffect } from 'react'
import { store } from 'flowise-ui/src/store'
import { loginSuccess } from 'flowise-ui/src/store/reducers/authSlice'

interface AAIAuthProviderProps {
    user: EnrichedUserData | null
    children: React.ReactNode
}

export function AAIAuthProvider({ user, children }: AAIAuthProviderProps) {
    useEffect(() => {
        if (user) {
            // Sync Auth0 session to Redux for Flowise UI compatibility
            store.dispatch(loginSuccess({
                ...user,
                features: user.features || {}
            }))
        }
    }, [user])

    return <>{children}</>
}
```

**Usage in Layout:**

```typescript
// apps/web/app/(Main UI)/(Studio Layout)/layout.tsx
export default async function StudioLayout({ children }) {
    const session = await getCachedSession()

    return (
        <AAIAuthProvider user={session?.user}>
            <AppLayout apiHost={apiHost} accessToken={session?.accessToken}>
                {children}
            </AppLayout>
        </AAIAuthProvider>
    )
}
```

**Why This Is Needed:**
- Flowise UI expects user data in Redux store
- Auth0 session is server-side only
- This bridges the gap between server session and client state

**Commit:** `69909baf1`

---

#### Enterprise Features for Auth0 Admins

Users with the `Admin` role in Auth0 automatically get all enterprise features enabled:

```typescript
const features = roles?.includes('Admin')
    ? getAllFeaturesEnabled()  // All features = true
    : getSubscriptionFeatures(organizationId)  // Based on subscription
```

**Commit:** `50edca5f3`

---

### Workspace System

This release introduces a comprehensive workspace system for multi-tenant resource isolation.

#### Workspace Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Organization                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Default Workspace                      │    │
│  │  (Org-level resources, shared across users)              │    │
│  │                                                          │    │
│  │  • Shared chatflows (visibility: Organization)           │    │
│  │  • Shared credentials                                    │    │
│  │  • Shared tools                                          │    │
│  │  • Team-level document stores                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Personal    │  │   Personal    │  │   Personal    │       │
│  │   Workspace   │  │   Workspace   │  │   Workspace   │       │
│  │   (User A)    │  │   (User B)    │  │   (User C)    │       │
│  │               │  │               │  │               │       │
│  │ • Private     │  │ • Private     │  │ • Private     │       │
│  │   chatflows   │  │   chatflows   │  │   chatflows   │       │
│  │ • Private     │  │ • Private     │  │ • Private     │       │
│  │   credentials │  │   credentials │  │   credentials │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Workspace Types

| Type | Purpose | Created |
|------|---------|---------|
| **Default Workspace** | Organization-level shared resources | Auto-created per organization |
| **Personal Workspace** | User-private resources | Auto-created per user |
| **Custom Workspaces** | Team/project workspaces | Manually created |

#### Workspace-User Relationship

```typescript
// workspace_user table structure
interface WorkspaceUser {
    id: string
    workspaceId: string       // FK to workspace
    userId: string            // FK to user
    roleId: string            // FK to role (permissions)
    status: 'active' | 'inactive' | 'pending'
    lastLogin: Date           // Last workspace access
    createdDate: Date
    updatedDate: Date
}
```

#### Resource Isolation by Workspace

All resources are now filtered by `workspaceId`:

| Resource | Filter | Migration |
|----------|--------|-----------|
| `chat_flow` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `credential` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `variable` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `tool` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `custom_template` | `workspaceId = activeWorkspaceId` | Backfilled based on visibility |
| `assistant` | `workspaceId = activeWorkspaceId` | Backfilled |
| `document_store` | `workspaceId = activeWorkspaceId` | Backfilled |
| `apikey` | `workspaceId = activeWorkspaceId` | Backfilled |
| `execution` | `workspaceId = activeWorkspaceId` | Backfilled |
| `evaluation` | `workspaceId = activeWorkspaceId` | Backfilled |
| `chat_message` | Inherits from chatflow | Backfilled via chatflow |

#### Workspace ID Backfill Logic

During migration, existing resources are assigned to workspaces:

```typescript
// Migration logic for workspace assignment
if (resource.visibility === 'Organization' || resource.visibility === 'Marketplace') {
    resource.workspaceId = defaultWorkspace.id  // Shared resource
} else {
    resource.workspaceId = personalWorkspace.id  // Private resource
}
```

#### Workspace Switching

Users can switch workspaces via:

1. **Profile Menu** - Inline workspace list with active indicator
2. **API** - `POST /api/workspaces/switch` endpoint

```typescript
// Workspace switch persists via lastLogin timestamp
await workspaceUserRepository.update(
    { userId, workspaceId },
    { lastLogin: new Date() }
)
```

#### Multi-Workspace Resource Sharing (AGENT-610)

New opt-in feature allowing Personal Workspace users to access Default Workspace resources:

```bash
# Enable in .env
AAI_MULTI_WORKSPACE_SHARING=true
AAI_SHARED_WORKSPACE_NAME="Default Workspace"
AAI_WORKSPACE_DEBUG=true  # Optional: Enable debug logging
```

**How It Works:**

The Smart Repository Decorator intercepts queries and expands workspace filters:

```typescript
// Without sharing: Only personal workspace
WHERE workspaceId = 'personal-ws-123'

// With sharing enabled: Personal + Default workspace
WHERE workspaceId IN ('personal-ws-123', 'default-ws-456')
```

**Use Cases:**
- Share organization tools with all users
- Provide base templates in Default Workspace
- Allow personal customization in Personal Workspace

**Commit:** `e0d891f47` (AGENT-610)

---

### Database Migrations

#### Critical: Enterprise Database Refactoring

**Migration:** `RefactorEnterpriseDatabase1737076223692`

**New table structures:**

| Table | Key Changes |
|-------|-------------|
| `user` | New schema with `name`, `email`, `credential`, `status`, audit fields |
| `organization` | New schema with `customerId`, `subscriptionId`, audit fields |
| `login_method` | NEW - SSO configurations per organization |
| `role` | NEW - Permission definitions |
| `organization_user` | NEW - User-organization junction with roles |
| `workspace_user` | NEW - User-workspace junction with roles, `lastLogin` |

**Required actions:**
1. **BACKUP DATABASE BEFORE MIGRATING**
2. Migrations handle AAI schema differences automatically
3. Creates "Default Workspace" and "Personal Workspace" per organization

#### AAI Data Migration Sandwich

1. `BackupAAIData1737076223690` - Preserves `auth0Id`, `stripeCustomerId`, etc.
2. `RefactorEnterpriseDatabase1737076223692` - Main restructure
3. `AAIRestoreDataAndCreateWorkspaces1737076223693` - Restores AAI data, creates workspaces

#### New Tables

| Table | Purpose | Migration |
|-------|---------|-----------|
| `evaluation` | Evaluation configurations and results | `AddEvaluation1714548873039` |
| `evaluation_run` | Individual evaluation run results | `AddEvaluation1714548873039` |
| `dataset` | Dataset definitions for evaluations | `AddDatasets1714548903384` |
| `dataset_row` | Individual dataset rows | `AddDatasets1714548903384` |
| `evaluator` | Evaluator definitions | `AddEvaluator1714808591644` |

#### New Columns

| Table | Column | Purpose |
|-------|--------|---------|
| `chat_flow` | `textToSpeech` | TTS configuration |
| `chat_flow` | `currentVersion`, `s3Location` | Versioning support |
| `chat_flow` | `templateId` | Template linking |
| `chat_message` | `tracking_metadata` | Analytics tracking |
| `chat_message` | `guardrails_metadata` | Guardrails data |
| `organization` | `organizationConfig` | Organization settings |
| `organization` | `enabledIntegrations` | Integration toggles |
| `user` | `defaultChatflowId` | Default chatflow |

#### New Indexes

- `IDX_chatflow_name` on `chat_flow(name)`
- `IDX_custom_template_userId` on `custom_template(userId)`
- `IDX_custom_template_organizationId` on `custom_template(organizationId)`
- `IDX_custom_template_parentId` on `custom_template(parentId)`
- `IDX_chat_flow_templateId` on `chat_flow(templateId)`

---

### UI/UX Improvements

#### Canvas Improvements

| Feature | Description | Commit |
|---------|-------------|--------|
| **Grid Toggle** | Toggle background grid on/off | `a0dca552a` |
| **Fuzzy Node Search** | Intelligent search with typo tolerance and ranking | `97515989a` |
| **Snapping Controls** | ReactFlow snapping functionality | `82d60c7d1` |
| **Edge Remove Button** | Remove edges directly | `cd36924bf` |
| **Tooltip on Icons** | Hover tooltips in chatflows/marketplace | `7ef0e99eb` |

#### Theme and Accessibility

| Fix | Description | Commits |
|-----|-------------|---------|
| **Light Mode Contrast** | Fixed invisible text in light mode across billing, admin pages | `44d50c55d`, `2bc8a55c2`, `1389c0e04`, `9b72787b3` |
| **WCAG AA Compliance** | All text now meets 4.5:1 contrast ratio | - |

#### Profile Menu Redesign

New menu layout with:
- Email header with account switching
- Organization indicator with switch icon
- Inline workspace list with active indicator
- Add teammates (admin/builder only)
- Workspace settings (admin/builder only)
- Personalization (theme toggle)
- User profile card at bottom

**Commits:** `965801bea`, `06155238a`, `30254fea5`

#### Marketplace Improvements

- Autocomplete dropdown for use case selection
- Multi-select chips with overflow indicator
- Tooltip for truncated content
- Better grid spacing

**Commit:** `9d438529a`

#### Other UI Fixes

| Fix | Ticket | Commit |
|-----|--------|--------|
| Modals render above drawer | AGENT-597 | `6c6785e0b` |
| AsyncDropdown width | - | `15dd28356` |
| API Code Dialog for AgentFlow V2 | - | `5dd30b1a7` |
| Snackbar auto-close | - | `12b4259a0` |

---

### Bug Fixes

#### Critical & High Severity AAI Fixes (Detailed)

---

##### AGENT-589: Cross-Workspace Chat Data Leak (CRITICAL)

**See:** [Breaking Changes → AGENT-589](#1-agent-589-cross-workspace-chat-isolation-critical-security-fix)

---

##### AGENT-593: Chatflow Configuration Data Loss (CRITICAL)

**See:** [Breaking Changes → AGENT-593](#2-agent-593-chatflow-configuration-data-loss-critical-data-integrity-fix)

---

##### AGENT-588: Corrupted Images Throughout Application (HIGH)

**Severity:** HIGH - Visual functionality broken

**Problem:** PNG images (node icons, tab images in AddNodes panel) displayed as broken/corrupted throughout the application.

**Root Cause:** A custom webpack rule in `next.config.js` was double-processing images:

```javascript
// PROBLEMATIC CODE (removed)
{
    test: /\.(png|jpg|gif|svg)$/,
    use: [
        {
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
                publicPath: '/_next/static/images/',
                outputPath: 'static/images/'
            }
        }
    ]
}
```

This rule, combined with `transpilePackages: ['ui']`, caused binary PNG files to be processed twice, corrupting them.

**The Fix:**

1. Removed the corrupting 11-line webpack rule from `next.config.js`
2. Simplified `getImage()` function to handle Next.js `StaticImageData`:

```typescript
// FIXED: Properly handle Next.js static images
export const getImage = (name: string): string | StaticImageData => {
    return images[name] || name
}
```

**Impact:**
- All node icons display correctly
- AddNodes panel is fully functional
- No more broken image placeholders

**Commits:** `27a4a29a2`, `143545c9f`

---

##### AGENT-617: Google Drive Document Loader Crashes (HIGH)

**Severity:** HIGH - Feature completely broken

**Problem:** Adding Google Drive as a document loader caused a `ReferenceError` crash:

```
ReferenceError: selectedCredential is not defined
```

**Root Cause:** The credential selection state variables and handler were missing from the component:

```typescript
// MISSING (caused crash)
const [selectedCredential, setSelectedCredential] = useState(null)
const [selectedCredentialData, setSelectedCredentialData] = useState(null)

const handleCredentialDataChange = useCallback((credentialData) => {
    setSelectedCredentialData(credentialData)
}, [])
```

**The Fix:**

Added missing state and handler to both affected components:

1. **Direct component fix:** Added state to specific loader component
2. **NodeInputHandler fix:** Applied fix to parent handler for comprehensive coverage

```typescript
// Added to component
const [selectedCredential, setSelectedCredential] = useState(
    nodeData?.inputs?.credential || null
)
const [selectedCredentialData, setSelectedCredentialData] = useState(
    nodeData?.inputs?.credentialData || null
)

const handleCredentialDataChange = useCallback((credentialData: any) => {
    setSelectedCredentialData(credentialData)
}, [])
```

**Impact:**
- Google Drive document loader works correctly
- Document ingestion workflows are functional
- RAG pipelines with Google Drive sources can be built

**Commits:** `93034fca3`, `2e21ff60d`

---

##### AGENT-592: Sidekick Selection Broken with Workspace RBAC (HIGH)

**Severity:** HIGH - Core feature broken

**Problem:** Two related issues with sidekick selection:

1. Used `isOwner` check instead of `isExecutable`, breaking workspace-level RBAC
2. JSON parsing crashed on null/undefined values during sidekick switching

**Root Cause 1:** Owner-based access check:
```typescript
// BROKEN: Only owner could select sidekick
if (chatflow.isOwner) {
    // Allow selection
}
```

**Root Cause 2:** Unsafe JSON parsing:
```typescript
// CRASHED: No null check
const config = JSON.parse(chatflow.chatbotConfig)  // Error if null
```

**The Fix:**

1. Changed to `isExecutable` for proper RBAC:
```typescript
// FIXED: Server handles workspace access filtering
// isExecutable is set to true since server already filters by workspace
if (chatflow.isExecutable) {
    // Allow selection
}
```

2. Added null checks to JSON parsing:
```typescript
// FIXED: Safe JSON parsing
export function parseFlowData(flowData: string | null | undefined) {
    if (!flowData) return null
    try {
        return JSON.parse(flowData)
    } catch (error) {
        console.error('Failed to parse flow data:', error)
        return null
    }
}
```

**Impact:**
- Shared sidekicks are accessible to all authorized workspace users
- No crashes when switching sidekicks
- Proper RBAC enforcement

**Commits:** `a16ef564d`, `ea6f2f6b9`

---

##### AGENT-618: User Variables Section 404 Errors (HIGH)

**Severity:** HIGH - Feature causes errors

**Problem:** The User Variables section in the profile page called a non-existent API endpoint (`/api/users`), showing 404 errors when users tried to save.

**Root Cause:** The UI was implemented before the API:
```typescript
// Called non-existent endpoint
const response = await fetch('/api/users', {
    method: 'PATCH',
    body: JSON.stringify({ contextFields })
})
// Result: 404 Not Found
```

**The Fix:**

Hidden the User Variables section until API is implemented:

```typescript
// Temporarily hidden with implementation notes
{/*
TODO: User Variables API needed
- POST /api/users/:id/context-fields
- GET /api/users/:id/context-fields
- See AGENT-618 for implementation details
*/}
{false && <UserVariablesSection />}
```

**Impact:**
- No more confusing 404 errors
- Cleaner UI without non-functional features
- Clear path for future implementation

**Commit:** `844942177`

---

##### AGENT-598: Light Mode Text Invisible (MEDIUM)

**Severity:** MEDIUM - Accessibility issue

**Problem:** Multiple pages had white text hardcoded (`color: '#fff'`), making content invisible in light mode:

**Affected Pages:**
- Billing Dashboard
- TotalCreditsProgress component
- BillingOverview
- UsageEventsTable
- CostCalculator
- Admin DocumentStores table
- Admin Chatflows table

**The Fix:**

Replaced 200+ hardcoded colors with theme-aware values:

| Before | After |
|--------|-------|
| `color: '#fff'` | `color: theme.palette.text.primary` |
| `color: 'rgba(255,255,255,0.7)'` | `color: theme.palette.text.secondary` |
| `background: 'rgba(0,0,0,0.2)'` | `background: alpha(theme.palette.background.paper, 0.8)` |
| `border: 'rgba(255,255,255,0.1)'` | `border: theme.palette.divider` |

**Result:**
- WCAG AA compliance (4.5:1 contrast ratio)
- All text readable in both themes
- Consistent theming across application

**Commits:** `44d50c55d`, `2bc8a55c2`, `1389c0e04`, `9b72787b3`

---

#### AAI-Specific Fixes Summary

| Severity | Ticket | Description | Status |
|----------|--------|-------------|--------|
| **Critical** | AGENT-589 | Cross-workspace chat data leak | ✅ Fixed |
| **Critical** | AGENT-593 | Chatflow config data loss on import/export | ✅ Fixed |
| **High** | AGENT-588 | Corrupted images throughout app | ✅ Fixed |
| **High** | AGENT-617 | Google Drive loader crashes | ✅ Fixed |
| **High** | AGENT-592 | Sidekick selection broken with RBAC | ✅ Fixed |
| **High** | AGENT-618 | User Variables 404 errors | ✅ Hidden |
| **Medium** | AGENT-598 | Light mode text invisible | ✅ Fixed |
| **Medium** | AGENT-616 | Rate limit config not saving | ✅ Fixed |
| **Medium** | AGENT-609 | Variables page tab switching broken | ✅ Fixed |
| **Medium** | AGENT-614 | Dataset ID extraction failing | ✅ Fixed |
| **Low** | AGENT-597 | Modals behind drawer | ✅ Fixed |
| **Low** | AGENT-615 | Duplicate button | ✅ Fixed |

---

#### Flowise Upstream Fixes (80+)

**Security Fixes:**
- Path traversal via chatId (`03c1750d7`, `c00ae7848`)
- File path validation (`6e291cf05`)
- Container filesystem vulnerability (`4111ec31b`)
- Insecure link fetching (`e002e617d`)
- Arbitrary file upload (`c2b830f27`)
- ID validation for imports (`f963e5aa4`)

**AgentFlow/Sequential Agents:**
- Supervisor Node with Azure OpenAI (`94cae3b66`)
- Iteration blocking after human input (`62d34066c`)
- Human Input as first node (`6e2f2df26`)
- Agent/LLM nodes when streaming off (`68dc041d0`)
- State interpolation (`bbcfb5ab6`)
- AgentflowV2 State management (`01dab4365`)
- Past image retrieval (`6cf1c82f0`)
- Redis event subscription (`10f85ef47`)

**Chat Models:**
- Anthropic package issues (`a92f7dfc3`)
- Gemini empty contents error (`fc50f2308`)
- Gemini structured output (`2e42dfb63`)
- Gemini image input (`d06b7d7ae`)
- AWS Bedrock vision model override (`ddba891dc`)

**Vector Stores:**
- Weaviate metadata special chars (`7dfa26950`)
- Vector store config not saving (`a6506b3bf`)
- PGVectorStore base class retrieval (`3bd2d63a1`)

**API/Backend:**
- CORS configuration (`fd7fc2f4d`)
- Redis socket crashes (`4326cbe6b`)
- Redis idle timeout (`eadf1b11b`)
- PostgreSQL Record Manager (`7e7ff2494`, `e467d0615`)
- Duplicate metrics in Prometheus/OpenTelemetry (`3098c8e75`)

**Parsing/Data:**
- Zod schema parsing (`4417102f6`)
- JSON metadata parsing (`601de76ae`)
- JSON5 parsing (`4af067a44`)
- Iteration JSON parsing (`44087bc70`)
- Null byte import errors (`9e743e4aa`)

---

### Security

This release includes **15+ security fixes** addressing critical vulnerabilities including path traversal, arbitrary file upload, SSRF, session fixation, and credential leakage.

---

#### Critical Security Fixes

##### 1. Path Traversal via chatId (CRITICAL)

**Vulnerability:** Attackers could use specially crafted `chatId` parameters to access files outside the intended directory.

**Attack Vector:**
```
GET /api/v1/chatmessages?chatId=../../../etc/passwd
```

**Fix:** Added path traversal validation to `chatId` parameter:

```typescript
// packages/server/src/utils/validateChatId.ts
export function validateChatId(chatId: string): boolean {
    // Block path traversal attempts
    if (chatId.includes('..') || chatId.includes('/') || chatId.includes('\\')) {
        throw new InternalFlowiseError(
            StatusCodes.BAD_REQUEST,
            'Invalid chatId format'
        )
    }
    return true
}
```

**Commits:** `03c1750d7`, `c00ae7848`

##### 2. File Path Validation (CRITICAL)

**Vulnerability:** Insufficient file path validation allowed access to unauthorized files.

**Fix:** Enhanced file path validation and sanitization:

```typescript
// Validates paths don't escape allowed directories
function validateFilePath(filePath: string, allowedBase: string): boolean {
    const normalizedPath = path.normalize(filePath)
    const resolvedPath = path.resolve(allowedBase, normalizedPath)
    return resolvedPath.startsWith(path.resolve(allowedBase))
}
```

**Commit:** `6e291cf05`

##### 3. Arbitrary File Upload (CRITICAL)

**Vulnerability:** Attachment creation endpoint allowed uploading files with arbitrary paths, potentially overwriting system files.

**Fix:** Restricted file upload to designated directories with extension validation.

**Commit:** `c2b830f27`

##### 4. Container Filesystem Vulnerability (HIGH)

**Vulnerability:** Docker compose configuration (`metrics/otel/compose.yaml`) allowed unauthorized file modifications within the container.

**Fix:** Restricted container filesystem permissions and implemented non-root execution.

**Commit:** `4111ec31b`

##### 5. Insecure Link Fetching (HIGH)

**Vulnerability:** Links were fetched without proper URL validation, allowing SSRF attacks.

**Fix:** Added URL validation before fetching external resources.

**Commit:** `e002e617d`

##### 6. Import ID Validation (MEDIUM)

**Vulnerability:** Imported data IDs were not validated, allowing injection attacks.

**Fix:** All imported IDs are now validated against expected formats.

**Commit:** `f963e5aa4`

---

#### SSRF Protection (Server-Side Request Forgery)

**New Feature:** HTTP Deny List

Prevents SSRF attacks by blocking requests to internal/private IP ranges:

```bash
# .env configuration
HTTP_DENY_LIST=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,169.254.0.0/16
```

**Implementation:**

```typescript
// packages/components/src/httpSecurity.ts
import { isIPInCIDR } from './utils'

export function validateURL(url: string): void {
    const denyList = process.env.HTTP_DENY_LIST?.split(',') || []
    const parsedUrl = new URL(url)
    const resolvedIP = dns.resolve(parsedUrl.hostname)

    for (const cidr of denyList) {
        if (isIPInCIDR(resolvedIP, cidr)) {
            throw new Error(`Request to ${url} blocked by HTTP_DENY_LIST`)
        }
    }

    // Also validates redirect chains
}
```

**Protected Against:**
- Access to internal services (localhost, 10.x.x.x, 192.168.x.x)
- Cloud metadata endpoints (169.254.169.254)
- Internal Kubernetes services
- Docker host networking attacks

**Commits:** `0998bf432`, `a3f47af02`, `d081221a9`

---

#### Session Security

##### Session Fixation Prevention

**Vulnerability:** Session tokens were not regenerated after authentication, allowing session fixation attacks.

**Fix:** Sessions are now regenerated on login for all SSO providers:

```typescript
// After successful authentication
req.session.regenerate((err) => {
    if (err) {
        return next(err)
    }
    // Store user data in new session
    req.session.user = authenticatedUser
    req.session.save()
})
```

**Affected Providers:**
- Auth0
- Google OAuth
- GitHub OAuth
- Azure AD

**Commit:** `e8c36b689`

##### Secure Cookies Configuration

**New Feature:** Explicit cookie security control

```bash
# .env configuration
SECURE_COOKIES=true  # Force secure cookies (HTTPS only)
SECURE_COOKIES=false # Allow insecure (development)
# Omit for auto-detection based on environment
```

**Cookie Settings When Enabled:**
```typescript
{
    secure: true,           // HTTPS only
    httpOnly: true,         // No JavaScript access
    sameSite: 'strict',     // CSRF protection
    maxAge: 86400000        // 24 hour expiry
}
```

**Commit:** `a86f61818`

---

#### MCP Security Validation

Enhanced validation for Model Context Protocol (MCP) configurations to prevent malicious server connections.

**New Environment Variables:**

```bash
# Enable custom MCP security checks
CUSTOM_MCP_SECURITY_CHECK=true

# Allowed MCP protocols
CUSTOM_MCP_PROTOCOL=stdio,http,https

# Block dangerous protocols
CUSTOM_MCP_BLOCKED_PROTOCOLS=file,data
```

**Validation Checks:**
- Protocol whitelist validation
- URL format validation
- Hostname resolution validation
- Argument sanitization

**Commits:** `41131dfac`, `d29db16bf`, `e8dac2048`

---

#### Sensitive Data Protection

##### Log Sanitization

**Vulnerability:** Sensitive data (API keys, tokens, passwords) could appear in application logs.

**Fix:** Request headers and body are sanitized before logging:

```typescript
// Sanitized fields
const sensitiveFields = [
    'authorization',
    'x-api-key',
    'password',
    'secret',
    'token',
    'apiKey',
    'accessToken',
    'refreshToken',
    'credential'
]

function sanitizeForLogging(data: object): object {
    const sanitized = { ...data }
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]'
        }
    }
    return sanitized
}
```

**Commit:** `2ae4678da`

---

#### Telemetry Privacy

**Change:** Telemetry is now **disabled by default** (opt-in instead of opt-out).

```bash
# Telemetry is OFF unless explicitly enabled
DISABLE_FLOWISE_TELEMETRY=true  # Default (redundant but explicit)
DISABLE_FLOWISE_TELEMETRY=false # Opt-in to telemetry
```

**What Was Collected:**
- Anonymous usage statistics
- Feature usage counts
- Error reports (sanitized)

**Privacy Impact:**
- No data sent without explicit opt-in
- Compliant with GDPR and similar regulations
- Suitable for air-gapped deployments

**Commit:** `624143ad1`

---

#### Dangerous Tools Removed

##### File System Tools Removed

**Security Decision:** Read/Write file system tools have been removed from the default distribution.

**Removed Tools:**
- `ReadFile` - Read arbitrary files
- `WriteFile` - Write arbitrary files

**Rationale:**
- High risk of path traversal attacks
- Potential for data exfiltration
- Container escape vectors

**Alternative:** Use specific document loaders for controlled file access.

**Commits:** `3cab80391`, `1fb12cd93`

---

#### Non-Root Docker Execution

**Security Enhancement:** Docker containers now run as non-root user by default.

**Dockerfile Changes:**

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 flowise && \
    adduser --system --uid 1001 --gid 1001 flowise

# Set ownership
RUN chown -R flowise:flowise /app

# Switch to non-root user
USER flowise
```

**Security Benefits:**
- Limits container escape impact
- Prevents root-level file modifications
- Follows container security best practices
- Required for some Kubernetes security policies

**Commit:** `366d38b86`

---

#### Security Configuration Summary

| Setting | Purpose | Recommended Value |
|---------|---------|-------------------|
| `DISABLE_FLOWISE_TELEMETRY` | Disable telemetry | `true` |
| `HTTP_DENY_LIST` | SSRF protection | `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8` |
| `SECURE_COOKIES` | Force HTTPS cookies | `true` (production) |
| `CUSTOM_MCP_SECURITY_CHECK` | MCP validation | `true` |
| `FLOWISE_SECRETKEY_OVERWRITE` | Credential encryption | Strong random key |

---

### Infrastructure

#### Docker Improvements

| Feature | Description | Commit |
|---------|-------------|--------|
| Native health checks | Added curl for proper health checks | `786748972` |
| Non-root execution | Container runs as non-root user | `366d38b86` |
| Split workflows | Separated Docker CI/CD | `a7b6f9b20` |
| Worker updates | Updated worker Dockerfile | `8ba1a0907` |

#### New Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `DISABLE_FLOWISE_TELEMETRY` | Disable telemetry | `true` |
| `HTTP_DENY_LIST` | SSRF protection | - |
| `SECURE_COOKIES` | Force secure cookies | auto |
| `TRUST_PROXY` | Express proxy trust | `true` |
| `ENABLE_BULLMQ_DASHBOARD` | Queue monitoring UI | disabled |
| `REMOVE_ON_AGE` | Queue job age cleanup | - |
| `REMOVE_ON_COUNT` | Queue job count cleanup | - |
| `CUSTOM_MCP_SECURITY_CHECK` | MCP validation | - |
| `AAI_MULTI_WORKSPACE_SHARING` | Resource sharing | `false` |
| `AAI_SHARED_WORKSPACE_NAME` | Shared workspace | "Default Workspace" |

#### Observability

| Feature | Description | Commit |
|---------|-------------|--------|
| Phoenix Tracing | Self-hosted and cloud Phoenix support | `b02667188` |
| Opik Tracer | New Opik integration | `dd56d03b7` |
| LangWatch Metadata | Config override for metadata | `763e33b07` |
| Mistral Cost Metrics | Cost tracking for Mistral models | `f8ca10582` |

#### Caching Improvements

- SSO token caching (`d272683a9`)
- MCP toolkit caching (`2b7a074c8`)
- Google GenAI cache support (`d3510d105`)
- Turbo build caching for DB (`7beb1bb0b`)

---

### Deprecations

| Item | Replacement | Notes |
|------|-------------|-------|
| AgentFlow V1 (Sequential Agents) | AgentFlow V2 | V1 still works, migration recommended |
| `importChatflows` method | New import system | Better validation |
| `x-request-from: internal` | `x-request-from: aai` | Header change |
| `teradatasql` package | Teradata MCP | Removed |
| `rehyperaw` package | - | Removed |
| Read/Write File Tools | - | Security removal |

---

### Migration Checklist

#### Pre-Deployment

- [ ] **BACKUP DATABASE COMPLETELY**
- [ ] Review Auth0 user/organization sync status
- [ ] Verify all users have valid `organizationId` references
- [ ] Document current workspace structure for rollback reference
- [ ] Update client code to use `x-request-from: aai` header

#### During Deployment

- [ ] Run migrations in a maintenance window
- [ ] Monitor migration logs for AAI migration messages
- [ ] Watch for WARNING messages about orphaned users

#### Post-Deployment

- [ ] Verify users can log in via Auth0
- [ ] Verify workspace access is correct
- [ ] Verify chatflows are visible in correct workspaces
- [ ] Test evaluation and dataset features
- [ ] Clean up backup tables after verification

---

### Contributors

This release includes contributions from the Flowise team and TheAnswer AI team.

### Full Changelog

[v1.13.0...v2.0.0](https://github.com/the-answerai/theanswer/compare/v1.13.0...v2.0.0)

---

*For previous releases, see [GitHub Releases](https://github.com/the-answerai/theanswer/releases).*
