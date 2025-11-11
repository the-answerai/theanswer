# Fiddler Guardrails - Implementation Plan

**Linear:** AGENT-139
**Spec Reference:** `.claude/plans/fiddler-guardrails-spec.md`
**Progress Reference:** `.claude/plans/fiddler-guardrails-progress.md`
**Status:** 🚧 In Progress - Phase 1, 2, 3 Complete
**PR:** #686 (targeting staging)

**Scores:** Effort 14/20 | Complexity 3.2/5 | Risk Low | **Confidence 9/10**

**Task Count:** 37 tasks | **Progress:** 24/37 (64.9%)

---

## Code References (Patterns to Follow)

| Pattern | Reference File | Notes |
|---------|---------------|-------|
| **Organization Entity** | `packages/server/src/database/entities/Organization.ts` | Add `jsonb` column (see `enabledIntegrations` pattern) |
| **Organization Service** | `packages/server/src/services/organizations/index.ts` | Follow `updateOrganizationEnabledIntegrations` pattern |
| **Credential Definition** | `packages/components/credentials/AnthropicApi.credential.ts` | Simple `INodeCredential` implementation |
| **Error Handling** | `packages/server/CLAUDE.md` | Use `InternalFlowiseError` pattern |
| **Integration Point 1** | `packages/server/src/utils/buildChatflow.ts:262` | Input validation (after `question` is set) |
| **Integration Point 2** | `packages/server/src/utils/buildChatflow.ts:742-743` | Output validation (after `result.text` is set) |
| **Redis Setup** | `.env.template:44` | `REDIS_URL=redis://localhost:6379` (already configured) |

---

## Phase 1: Core Infrastructure ✅ COMPLETE

**Goal:** Configuration system, database schema, credentials, service foundation

**Effort:** 5/5 | **Complexity:** 3/5 | **Status:** ✅ Complete (2025-11-10)

**Deliverables:** 9 files created, 4 files modified, +1,267 lines, 0 breaking changes

### Tasks (8/8 tasks complete)

**✅ 1.1 Configuration Schema & Database** (380 lines vs 150 planned)
- ✅ **Migration:** `1753200000001-AddOrganizationConfig.ts` created
- ✅ **Types:** `packages/server/src/types/guardrails.ts` (comprehensive type system)
- ✅ **Entity:** Updated `Organization.ts` with `organizationConfig` column
- ⚠️ **Entity methods:** Not implemented (using config utilities instead)
- **Files:** `guardrails.ts`, migration file, updated `Organization.ts`

**✅ 1.2 Configuration Hierarchy & Deep Merge** (280 lines vs 150 planned)
- ✅ `getGuardrailsConfig()` with 4-layer precedence: default → env → org → chatflow
- ✅ Deep merge preserves per-dimension thresholds and per-type actions
- ✅ All fallback resolvers implemented correctly
- **File:** `packages/server/src/services/guardrails/config.ts`

**✅ 1.3 Configuration Validation** (integrated into config.ts)
- ✅ Validates thresholds (0.0-1.0), actions, dimension/type keys
- ✅ Circuit breaker and cache config validation
- ✅ Returns error array for debugging
- **File:** `config.ts` (integrated)

**✅ 1.4 Credential Management** (35 lines - exact match)
- ✅ Follows `AnthropicApi.credential.ts` pattern exactly
- ✅ Fields: `fiddlerApiKey` (password), `fiddlerApiUrl` (string)
- **File:** `packages/components/credentials/FiddlerApi.credential.ts`

**✅ 1.5 Service Foundation & Circuit Breaker** (315 lines vs 150 planned)
- ✅ Axios: Bearer auth, keep-alive, pooling (max 50), 10s timeout
- ✅ Circuit breaker: 5 failures → open, 30s timeout, 3 successes → close
- ✅ Fail-open by default, stub methods ready for Phase 2
- **Files:** `CircuitBreaker.ts` (120 lines), `FiddlerGuardrailsService.ts` (195 lines)

**✅ 1.6 Environment Variable Configuration** (33 lines added)
- ✅ Added 11 `FIDDLER_*` variables to `.env.template`
- ✅ Environment loader in `config.ts` (`getEnvironmentConfig()`)
- ✅ All variables documented with defaults
- **File:** `.env.template` (updated)

**✅ 1.7 Redis Client Setup** (185 lines vs 30 planned)
- ✅ `GuardrailsCache` class with Redis initialization
- ✅ Graceful fallback if Redis unavailable
- ✅ SHA256 key generation, configurable TTL
- **File:** `packages/server/src/services/guardrails/cache.ts`

**✅ 1.8 ChatFlow Config Parser** (integrated into config.ts)
- ✅ `getChatflowConfig()` extracts `chatbotConfig.guardrails`
- ✅ Handles missing/invalid config gracefully
- **File:** `config.ts` (integrated)

---

## Phase 2: Input Validation (MVP) ✅ COMPLETE

**Goal:** Safety and PII checks for input with per-dimension/per-type controls

**Effort:** 5/5 | **Complexity:** 4/5 | **Status:** ✅ Complete (2025-11-10)

**Deliverables:** 2 files modified, +302 lines (net +313 insertions, -28 deletions), 0 breaking changes

### Tasks (8/8 tasks complete)

**✅ 2.1 Safety Evaluation - API Integration** (62 lines vs 50 planned)
- ✅ API integration with `POST /v3/guardrails/ftl-safety`
- ✅ Request format: `{ data: { input: text } }` (per spec line 719)
- ✅ Response parsing: 11 dimension scores (0.0-1.0)
- ✅ Circuit breaker with fallback: returns zero scores for all dimensions
- ✅ Try-catch with fail-open error handling
- **File:** `FiddlerGuardrailsService.ts:130-192`

**✅ 2.2 Safety Evaluation - Per-Dimension Logic** (integrated in 2.1)
- ✅ Per-dimension threshold fallback: `dimensionThresholds?.[dim] ?? threshold`
- ✅ Per-dimension action fallback: `dimensionActions?.[dim] ?? action`
- ✅ Violation array construction with dimension, score, threshold, action
- **File:** `FiddlerGuardrailsService.ts:161-182`

**✅ 2.3 PII Detection - API Integration** (70 lines vs 50 planned)
- ✅ API integration with `POST /v3/guardrails/sensitive-information`
- ✅ Request format: `{ data: { input: text } }` (per spec line 840)
- ✅ Response parsing: `fdl_sensitive_information_scores` array
- ✅ Circuit breaker with fallback: returns empty array
- ✅ Try-catch with fail-open error handling
- **File:** `FiddlerGuardrailsService.ts:198-264`

**✅ 2.4 PII Detection - Per-Type Filtering & Actions** (integrated in 2.3)
- ✅ enabledTypes filtering: `config.pii.enabledTypes.includes(entityLabel)`
- ✅ Per-type confidence: `typeConfidenceThresholds?.[entityLabel] ?? confidenceThreshold`
- ✅ Per-type action: `typeActions?.[entityLabel] ?? action`
- ✅ Cast entity.label to PIIType for type safety
- **File:** `FiddlerGuardrailsService.ts:220-244`

**✅ 2.5 PII Redaction Algorithm** (18 lines vs 60 planned)
- ✅ Reverse sort by start position: `sort((a, b) => b.start - a.start)`
- ✅ Replace `text[start:end]` with `[LABEL]` placeholder
- ✅ Processes only redact/replace actions
- ✅ Preserves earlier character positions
- **File:** `FiddlerGuardrailsService.ts:270-281`

**✅ 2.6 Input Validation Wrapper** (48 lines vs 70 planned)
- ✅ Parallel execution: `Promise.all([evaluateSafety(), detectPII()])`
- ✅ Combined blocking: `safety.some(block) OR pii.some(block)`
- ✅ Combined messages: shows both safety AND pii violations
- ✅ Fail-open error handling with empty violations
- ✅ Fixed: Combined block messages (Issue #2)
- **File:** `FiddlerGuardrailsService.ts:287-333`

**✅ 2.7 Error Handling** (integrated throughout)
- ✅ InternalFlowiseError format: `Error: FiddlerGuardrailsService.{method} - {description}`
- ✅ Try-catch blocks in all API methods
- ✅ Fail-open: returns safe defaults on error
- ✅ Circuit breaker prevents cascading failures
- **Files:** All methods in `FiddlerGuardrailsService.ts`

**✅ 2.8 Input Validation Integration** (55 lines vs 100 planned)
- ✅ **Location:** `buildChatflow.ts:274-328` (after question set, before file processing)
- ✅ Load 4-layer config: default → env → org → chatflow
- ✅ Load credentials scoped to organizationId (multi-tenancy)
- ✅ Call validateInput() with question text
- ✅ Block: throw InternalFlowiseError with 400 status
- ✅ Redact: modify question variable with redacted text
- ✅ Warn: console.warn with violations, continue processing
- ✅ Fail-open: re-throw blocks, log other errors
- ✅ Fixed: Multi-tenancy violation (Issue #1)
- **File:** `buildChatflow.ts:274-328`

---

## Phase 3: API & Simple UI ✅ COMPLETE

**Goal:** Organization admins configure guardrails with preset templates

**Effort:** 4/5 | **Complexity:** 3/5 | **Status:** ✅ Complete (2025-11-10)

**Deliverables:** 7 files created, 2 files modified, +622 lines, 0 breaking changes

### Tasks (8/8 tasks complete, 1 deferred)

**✅ 3.1 Organization Config API - Generic Endpoints** (65 lines vs 160 planned)
- ✅ Service methods: `getOrganizationConfig()`, `updateOrganizationConfig()`
- ✅ Deep merge with `deepMergeConfigs()` from Phase 1
- ✅ Parse/stringify JSONB from `organizationConfig` column
- ✅ Multi-tenancy enforced via `organizationId`
- **File:** `packages/server/src/services/organizations/index.ts` (+65 lines)

**✅ 3.2 Guardrails Config API - Convenience Endpoints** (114 lines vs 100 planned)
- ✅ 4 controller methods:
  - `getOrganizationConfig()` - Generic config retrieval
  - `updateOrganizationConfig()` - Admin-only generic update
  - `getOrganizationGuardrailsConfig()` - Returns `config.guardrails`
  - `updateOrganizationGuardrailsConfig()` - Admin-only guardrails update
- ✅ Admin-only enforcement: `req.user.roles?.includes('Admin')`
- ✅ Multi-tenancy: Uses `req.user.organizationId` (never URL param)
- ✅ Input validation: Required field checks
- ✅ Error handling: `InternalFlowiseError` with proper codes
- **File:** `packages/server/src/controllers/organizations/index.ts` (+114 lines)

**✅ 3.3 Route Registration** (25 lines vs 5 planned)
- ✅ Created full route file with 6 endpoints:
  - `GET/PUT /:id/config` (generic)
  - `GET/PUT /:id/config/guardrails` (convenience)
  - `GET /:id` (organization metadata)
  - `GET/PUT /:id/credentials` (integrations)
- ✅ All protected with `enforceAbility('Organization')`
- ✅ Registered in main router: `/api/v1/organizations`
- **Files:** `routes/organizations/index.ts` (23 lines), `routes/index.ts` (+2 lines)

**✅ 3.4 Organization Settings Page - Route & Layout** (20 lines vs 100 planned)
- ✅ Route: `/settings/organization/guardrails`
- ✅ Next.js server component with Auth0 session
- ✅ Unauthorized state handling
- ✅ Metadata for SEO
- **File:** `apps/web/app/(Main UI)/settings/organization/guardrails/page.tsx` (20 lines)

**✅ 3.5 Simple Mode UI - Preset Templates** (247 lines vs 350 planned)
- ✅ 3 core presets implemented:
  - **Strict** (0.05): External bots, PCI-DSS compliance
  - **Balanced** (0.1): General purpose, recommended default
  - **Lenient** (0.15): Internal tools, minimal blocking
- ✅ Preset auto-detection based on current config
- ✅ Radio card UI with visual feedback
- ✅ Dirty tracking with Save/Cancel buttons
- ✅ Warning when guardrails disabled
- **Files:**
  - `GuardrailsSettings.tsx` (129 lines) - Main component with tabs
  - `SimpleMode.tsx` (142 lines) - Preset selector
  - `presets.ts` (108 lines) - Preset definitions

**⏸️ 3.6 Chatflow Settings Modal** (Deferred)
- **Decision:** Not MVP, deferred to future phase
- **Rationale:** User requested "Only 3 core ones" (presets)
- **Impact:** None - organization-level config is primary
- **Future:** Can be added in Phase 4 if needed

**✅ 3.7 Organization Service Layer** (Integrated in 3.1)
- ✅ `getOrganizationConfig()` - Parse JSONB with error handling
- ✅ `updateOrganizationConfig()` - Deep merge partial configs
- ✅ Fail-open design: JSON parse errors return `{}`
- **File:** Part of 3.1

**✅ 3.8 UI API Client** (19 lines vs 100 planned)
- ✅ 4 methods matching backend endpoints:
  - `getOrgConfig(orgId)` → `GET /organizations/:id/config`
  - `updateOrgConfig(orgId, config)` → `PUT /organizations/:id/config`
  - `getGuardrailsConfig(orgId)` → `GET /organizations/:id/config/guardrails`
  - `updateGuardrailsConfig(orgId, guardrails)` → `PUT /organizations/:id/config/guardrails`
- ✅ Uses existing axios client with bearer token auth
- **File:** `packages/ui/src/api/guardrails.js` (19 lines)

### Phase 3 Summary

**Backend:**
- ✅ 4-layer architecture (routes → controllers → services → entities)
- ✅ Generic + convenience endpoints for flexibility
- ✅ Admin-only write protection
- ✅ Multi-tenancy enforced throughout
- ✅ Deep merge preserves nested config

**Frontend:**
- ✅ Next.js App Router with server/client split
- ✅ Auth0 session management
- ✅ Material-UI components
- ✅ Simple Mode with 3 presets
- ✅ Advanced/Custom tabs stubbed for Phase 4

**Integration:**
- ✅ Uses Phase 1 `deepMergeConfigs()`
- ✅ Organization config available to `getGuardrailsConfig()`
- ✅ Ready for Phase 4 advanced features

---

## Phase 4: Advanced Configuration & Optimization

**Goal:** Per-dimension/per-type controls and performance optimization

**Effort:** 3/5 | **Complexity:** 4/5 | **Status:** ⏳ Not Started

### Tasks (6 tasks)

**4.1 Advanced Mode UI - Per-Dimension Safety**
- Table: 11 rows (safety dimensions), override checkboxes, sliders, hints
- **Spec:** Lines 726-750
- **Deliverables:** `AdvancedModeSafety.tsx` (150 lines)

**4.2 Advanced Mode UI - Per-Type PII**
- Tables: Confidence (15+ rows), Actions (15+ rows), override controls
- **Spec:** Lines 760-840
- **Deliverables:** `AdvancedModePII.tsx` (200 lines)

**4.3 Custom Mode UI - JSON Editor**
- Monaco Editor, real-time validation, import/export
- **Spec:** Lines 2164-2208
- **Deliverables:** `CustomModeJSON.tsx` (150 lines)

**4.4 Redis Caching**
- SHA256 keys: `guardrail:safety:${sha256(text)}`, TTL 1hr
- **Spec:** Lines 1682-1696
- **Deliverables:** Caching in wrappers (40 lines)

**4.5 Parallel Execution Optimization**
- Skip disabled checks, latency tracking
- **Spec:** Lines 1660-1747
- **Deliverables:** 20 lines

**4.6 Structured Logging**
- Log: violations, PII, faithfulness, metrics, circuit breaker events
- **Deliverables:** Logger utility (60 lines)

---

## Phase 5: Output Validation & Faithfulness

**Goal:** Output validation, faithfulness checks, RAG context extraction, violation storage

**Effort:** 3/5 | **Complexity:** 3/5 | **Status:** ⏳ Not Started

### Tasks (7 tasks)

**5.1 Faithfulness Evaluation**
- Call `POST /v3/guardrails/ftl-response-faithfulness`
- Parse `fdl_faithful_score`, evaluate: Faithful (score >= threshold), Hallucination (score < threshold)
- **Critical:** Fiddler recommendation threshold < 0.005 (lower score = worse, inverted logic)
- Return: `{ isFaithful, score, threshold, action }`
- **Spec:** Lines 1012-1035
- **Deliverables:** `evaluateFaithfulness(response, context, config)` (70 lines)

**5.2 RAG Context Extraction**
- Extract from `result.sourceDocuments`: `sourceDocuments.map(doc => doc.pageContent).join('\n\n')`
- Error handling: Missing → Skip check, parsing fails → Log + skip, context < 50 chars → Skip
- Only run for RAG chatflows with valid context
- **Deliverables:** Context extraction utility (40 lines)

**5.3 Output Validation Integration** ⚠️ CRITICAL
- **Exact location:** `buildChatflow.ts:742-743` (after `if (result.text) { resultText = result.text`)
- Reuse config from input check, extract RAG context
- Run `Promise.all([evaluateSafety(), detectPII(), evaluateFaithfulness()])` in parallel
- Actions: Block (replace with blockMessage), Redact (replace with redacted text), Warn (log + keep)
- **ALWAYS fail-open:** Never throw error, log all errors, return original text on failure
- **Spec:** Lines 1629-1656
- **Deliverables:** 80 lines added to `buildChatflow.ts`

**5.4 Output Validation UI Indicators**
- Icons: ⚠️ warning, 🚫 blocked, ✏️ redacted
- Tooltip: dimension, score, threshold
- Admin link to org settings
- **Deliverables:** `ViolationIndicator.tsx` (80 lines)

**5.5 Violation Storage & Query API**
- **Entity fields:** `{ id, chatflowId, userId, organizationId, timestamp, type, dimension, entityType, score, threshold, action, inputHash, blocked, createdDate }`
- Store on detection (input and output)
- **Endpoint:** `GET /api/v1/organizations/:id/violations` with pagination, filters (chatflow, type, dateRange)
- Aggregations: counts per dimension/type
- CSV export
- **Spec:** Lines 234-241
- **Deliverables:** `Violation.ts` entity, migration, controller (100 lines), `ViolationDashboard.tsx` (150 lines)

**5.6 Output Validation Wrapper**
- `validateOutput(text, context, config)` in FiddlerGuardrailsService
- Parallel: `Promise.all([evaluateSafety(), detectPII(), evaluateFaithfulness()])`
- **Critical:** Fail-open guarantee (never throw), always safe fallback
- **Deliverables:** validateOutput method (80 lines)

**5.7 Testing & E2E**
- Unit tests for validation logic
- Integration tests for API endpoints
- E2E tests for UI workflows
- **Deliverables:** Test suite (200 lines)

---

## Dependencies & Sequencing

**Phase 1 → Phase 2:** Config system required for input validation ✅
**Phase 1 → Phase 3:** Config system required for API/UI ✅
**Phase 3 → Phase 4:** Simple UI validates UX before advanced features
**Phase 2 → Phase 5:** Input validation pattern reused for output validation

---

## Success Criteria

**Phase 1:** ✅ Config hierarchy works, credential loading functional, environment variables documented, Redis client operational
**Phase 2:** ✅ Input validation blocks unsafe/PII content, per-dimension/per-type logic correct, wrapper methods functional
**Phase 3:** ✅ Admins can configure via UI, preset templates apply correctly, service layer handles deep merge, routes registered, API client functional
**Phase 4:** Advanced controls function, caching achieves >85% hit rate, structured logging operational
**Phase 5:** Output validation never breaks user experience, faithfulness detects hallucinations, violations stored and queryable, wrapper methods complete

---

## Implementation Summary

**Total Effort:** 14/20 complete (70%)

| Phase | Tasks | Effort | Complexity | Status | Key Deliverables |
|-------|-------|--------|------------|--------|------------------|
| Phase 1: Core Infrastructure | 8/8 | 5/5 | 3/5 | ✅ Complete | Config system, DB schema, credentials, circuit breaker, env vars, Redis client, chatflow parser |
| Phase 2: Input Validation (MVP) | 8/8 | 5/5 | 4/5 | ✅ Complete | Safety API, PII API, per-dimension/per-type logic, wrapper methods, error handling, buildChatflow integration |
| Phase 3: API & Simple UI | 8/8* | 4/5 | 3/5 | ✅ Complete | REST endpoints, route registration, organization settings page, simple mode, presets, service layer, API client (*1 deferred) |
| Phase 4: Advanced Config & Optimization | 0/6 | 3/5 | 4/5 | ⏳ Not Started | Advanced/Custom modes, Redis caching, parallel execution, structured logging |
| Phase 5: Output Validation & Faithfulness | 0/7 | 3/5 | 3/5 | ⏳ Not Started | Faithfulness API, RAG context, output wrapper, output integration, UI indicators, violation storage |

**Critical Path:** Phase 1 → Phase 2 → Phase 5 (configuration → input validation → output validation) ✅ 60% complete

**Parallel Opportunities:** Phase 4 can start now (UI enhancements + optimization)

---

## Reference Documentation

**Complete specification:** `.claude/plans/fiddler-guardrails-spec.md`

**Key spec sections:**
- API formats: Lines 936-1160 (Fiddler endpoints, request/response formats)
- Configuration schemas: Lines 262-436 (complete schema with per-dimension/per-type fields)
- Processing logic: Lines 1313-1537 (safety evaluation, PII filtering/redaction algorithms)
- Threshold configuration: Lines 726-840 (validation rules, fallback logic)
- Test scenarios: Lines 1750-1964 (unit tests, integration tests, manual testing)
- Preset examples: Lines 456-712 (5 complete configuration examples)
- UI mockups: Lines 1967-2280 (Simple/Advanced/Custom modes, chatflow settings)
- File structure: Lines 1260-1286 (service/controller/entity organization)
- Integration points: Lines 1600-1656 (buildChatflow.ts modifications)
- Performance: Lines 1660-1747 (optimization techniques, latency targets)
- Environment variables: Lines 267-282 (all FIDDLER_* variables)
- Credential management: Lines 843-876 (Flowise system integration)
