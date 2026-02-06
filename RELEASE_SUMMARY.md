# TheAnswer v2.0 Release Summary

**Release Date:** January 13, 2026
**Current Version:** v2.2.9 (February 4, 2026)

---

## What's New in v2.0.0

### Flowise 3.0.11 Core Upgrade

We've integrated 400+ commits from Flowise upstream, bringing the platform from v1.x to v3.0.11. This is the largest upgrade in TheAnswer's history.

### AgentFlow V2

A complete redesign of the multi-agent workflow system, replacing the LangGraph-based Sequential Agents with a more flexible, visual architecture.

**Key Capabilities:**
- Simplified model config - each node selects its own LLM via dropdown (no wiring required)
- Built-in flow state - define state in the Start node, update from any node
- Execution tracking - full history with shareable execution links
- Form input support - Start node supports form-based input with validation
- Rich variable system - reference data with `{{ $question }}`, `{{ $form.field }}`, `{{ nodeId.output }}`
- Human-in-the-loop - native approval workflows with Human Input node
- Iteration support - process arrays in parallel or sequence

**16 Node Types:** Start, LLM, Agent, Condition, ConditionAgent, Human Input, Loop, Iteration, HTTP, Execute Flow, Custom Function, Tool, Direct Reply, Retriever, Sticky Note

**15+ Marketplace Templates:** Agentic RAG V2, Deep Research V2, Agents Handoff, Email Reply HITL Agent, Financial Research Agent, Human In The Loop, SQL Agent, Slack Agent, Supervisor Worker, and more.

### 40+ New Components

**Chat Models:** Claude 4, Claude Opus 4.1, Claude Sonnet 4.5, GPT-5 series, GPT-4.1 series, Gemini 2.5 Flash with Thinking Budget, Llama 4 on Groq, ChatSambanova, ChatCometAPI, AWS Bedrock OSS models

**Tools (15+):** AWS SNS, AWS DynamoDB KV Storage, Gmail, Google Docs, Google Calendar, Google Drive, Google Sheets, Microsoft Teams, Microsoft Outlook, Jira, JSONPathExtractor, RequestsPut/Delete, Arxiv

**Document Loaders:** Microsoft Excel, PowerPoint, Word, Google Sheets, Oxylabs (web scraping)

**Vector Stores:** AWS Kendra, Teradata VectorStore

**MCP Servers:** Supergateway MCP, Teradata MCP

### Workspace System & Multi-Tenancy

Organizations now contain workspaces: a Default Workspace for shared resources, Personal Workspaces for each user's private resources, and optional custom workspaces for teams/projects.

- Workspace-based RBAC - permissions resolved per workspace, not organization
- Resource isolation - all resources filtered by active workspace
- Workspace switching via profile menu
- Optional cross-workspace sharing to access Default Workspace resources

### Authentication Overhaul

New auth flow: Auth0 RS256 JWT as primary, Enterprise HS256 as fallback, API key for scoped access.

User enrichment now includes roles and permissions from workspace, subscription features from Stripe, and auto-enabled enterprise features for Admin role.

**Breaking change:** Header changed from `x-request-from: internal` to `x-request-from: aai`

### Security Fixes

**Critical:** Cross-workspace chat leak (users could see chats from all workspaces), chatflow config data loss on import/export, path traversal via chatId, arbitrary file upload

**High:** SSRF vulnerability, session fixation

**New security features:** HTTP_DENY_LIST for SSRF protection, SECURE_COOKIES option, non-root Docker execution, telemetry disabled by default, MCP security validation

### Evaluation System

New dataset-based evaluation for chatflows and agentflows: create datasets with input/expected output pairs, run evaluations, track results over time, compare performance across versions.

### UI/UX Improvements

Canvas: grid toggle, fuzzy node search, snapping controls, edge remove button. Theme: fixed light mode contrast issues (WCAG AA compliance). Profile menu redesigned with inline workspace list. Marketplace: autocomplete use case selection.

### Database Migrations

New tables: evaluation, evaluation_run, dataset, dataset_row, evaluator, login_method, role, organization_user, workspace_user

Migration preserves AAI data (auth0Id, stripeCustomerId, organizationId), restructures user/organization tables, then creates Default and Personal workspaces.

**BACKUP YOUR DATABASE BEFORE UPGRADING**

---

## Post-2.0.0 Updates (v2.0.1 - v2.2.9)

17 releases focused on stability and multi-tenancy refinements:

- Auth & RBAC: Fixed workspace data population for API key users, JWT auth enrichment, auth middleware race conditions
- Vector stores: Consistent organizationId/workspaceId filtering across all operations
- Guardrails: Fiddler credential management improvements, embed endpoint integration
- UI: Fixed chat selector switching, AppDrawer overlap, Google OAuth callback URLs
- Migrations: Made migrations idempotent, fixed orphaned user handling

---

## Configuration

**Required:** AUTH0_AUDIENCE, AUTH0_ISSUER_BASE_URL, AUTH0_ORGANIZATION_ID

**Recommended:** HTTP_DENY_LIST (SSRF protection), SECURE_COOKIES (production)

**Optional:** AAI_MULTI_WORKSPACE_SHARING, DISABLE_FLOWISE_TELEMETRY (default: true)

---

## Migration Checklist

1. Backup database before upgrading
2. Update client code to use `x-request-from: aai` header
3. Run migrations during maintenance window
4. Verify user workspace access post-migration
5. Test chatflow visibility in correct workspaces
6. Clean up backup tables after verification

---

*Full changelog: [CHANGELOG.md](./CHANGELOG.md)*
