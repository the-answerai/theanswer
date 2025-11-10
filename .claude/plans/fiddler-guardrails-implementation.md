# Fiddler Guardrails - Implementation Plan

**Linear:** AGENT-139
**Spec Reference:** `.claude/plans/fiddler-guardrails-spec.md`
**Progress Reference:** `.claude/plans/fiddler-guardrails-progress.md`
**Status:** 🚧 In Progress - Phase 1 Complete

**Scores:** Effort 22/25 | Complexity 3.2/5 | Risk Low-Medium | **Confidence 9/10**

**Task Count:** 37 tasks | **Progress:** 8/37 (21.6%)

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

## Phase 2: Input Validation (MVP)

**Goal:** Safety and PII checks for input with per-dimension/per-type controls

**Effort:** 5/5 | **Complexity:** 4/5

### Tasks (8 tasks)

**2.1 Safety Evaluation - API Integration**
- `POST /v3/guardrails/ftl-safety` → Parse 11 dimension scores
- **Spec:** Lines 957-979
- **Deliverables:** `evaluateSafety(text, config)` (50 lines)

**2.2 Safety Evaluation - Per-Dimension Logic**
- `dimensionThresholds?.[dim] ?? threshold` for each dimension
- **Spec:** Lines 1313-1385 (with scenarios)
- **Deliverables:** Per-dimension evaluation (80 lines)

**2.3 PII Detection - API Integration**
- `POST /v3/guardrails/sensitive-information` → Parse entity array
- **Spec:** Lines 1068-1104
- **Deliverables:** `detectPII(text, config)` (50 lines)

**2.4 PII Detection - Per-Type Filtering & Actions**
- Filter: `entity.score >= (typeConfidenceThresholds?.[label] ?? confidenceThreshold)`
- Action: `typeActions?.[label] ?? action`
- **Spec:** Lines 1388-1537 (with scenarios)
- **Deliverables:** Filtering/action logic (100 lines)

**2.5 PII Redaction Algorithm**
- Sort reverse, replace `text[start:end]` with `[LABEL]`
- **Spec:** Lines 1134-1143
- **Deliverables:** Redaction logic (60 lines)

**2.6 Input Validation Wrapper**
- `validateInput()` calls `Promise.all([evaluateSafety(), detectPII()])`
- **Deliverables:** Wrapper method (70 lines)

**2.7 Error Handling**
- **Follow:** `InternalFlowiseError` pattern in `packages/server/CLAUDE.md`
- Format: `Error: guardrails.{methodName} - {description}`
- **Deliverables:** Integrated in all methods

**2.8 Input Validation Integration** ⚠️ CRITICAL
- **Exact location:** `buildChatflow.ts:262` (after `let question = incomingInput.question || ''`)
- Block (throw 400), Redact (modify `question`), Warn (log), failOpen handling
- **Spec:** Lines 1606-1628
- **Deliverables:** 100 lines added to `buildChatflow.ts`

---

## Phase 3: API & Simple UI

**Goal:** Organization admins configure guardrails with preset templates

**Effort:** 4/5 | **Complexity:** 3/5

### Tasks (8 tasks)

**3.1 Organization Config API - Generic Endpoints**
- **Follow:** `services/organizations/index.ts` pattern (`updateOrganizationEnabledIntegrations`)
- `GET/PUT /api/v1/organizations/:id/config` with `enforceAbility`, `checkOwnership()`
- **Spec:** Lines 1178-1210
- **Deliverables:** Route (40), Controller (60), Service (60 lines)

**3.2 Guardrails Config API - Convenience Endpoints**
- `GET/PUT /api/v1/organizations/:id/config/guardrails` (admin only)
- **Spec:** Lines 1211-1241
- **Deliverables:** Route (40), Controller (60 lines)

**3.3 Route Registration**
- Mount at `/api/v1/organizations` in `packages/server/src/routes/index.ts`
- **Deliverables:** 5 lines

**3.4 Organization Settings Page - Route & Layout**
- Route: `/settings/organization/guardrails`
- Mode tabs: Simple, Advanced, Custom (JSON)
- **Spec:** Lines 1967-2065
- **Deliverables:** `GuardrailsSettings.tsx` (100 lines)

**3.5 Simple Mode UI - Preset Templates**
- 6 presets: Strict, Balanced, Lenient, Financial, Healthcare, Community
- **Spec:** Lines 461-712 (preset configs)
- **Deliverables:** `SimpleModeUI.tsx` (200), `presets.ts` (150 lines)

**3.6 Chatflow Settings Modal**
- "Guardrails" tab, inheritance display, override toggles
- Save to `chatbotConfig.guardrails`
- **Spec:** Lines 2226-2280
- **Deliverables:** `ChatflowGuardrailsSettings.tsx` (150 lines)

**3.7 Organization Service Layer**
- **Extend:** `services/organizations/index.ts` with config methods
- Deep merge logic for partial updates
- **Deliverables:** 120 lines added

**3.8 UI API Client**
- `packages/ui/src/api/guardrails.ts`
- Methods: `getOrgConfig()`, `updateOrgConfig()`, `getGuardrailsConfig()`, `updateGuardrailsConfig()`
- **Deliverables:** 100 lines

---

## Phase 4: Advanced Configuration & Optimization

**Goal:** Per-dimension/per-type controls and performance optimization

**Effort:** 3/5 | **Complexity:** 4/5

### Tasks

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

**Effort:** 3/5 | **Complexity:** 3/5

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

---

## Dependencies & Sequencing

**Phase 1 → Phase 2:** Config system required for input validation
**Phase 1 → Phase 3:** Config system required for API/UI (PARALLEL with Phase 2)
**Phase 3 → Phase 4:** Simple UI validates UX before advanced features
**Phase 2 → Phase 5:** Input validation pattern reused for output validation

---

## Success Criteria

**Phase 1:** Config hierarchy works, credential loading functional, environment variables documented, Redis client operational
**Phase 2:** Input validation blocks unsafe/PII content, per-dimension/per-type logic correct, wrapper methods functional
**Phase 3:** Admins can configure via UI, preset templates apply correctly, service layer handles deep merge, routes registered, API client functional
**Phase 4:** Advanced controls function, caching achieves >85% hit rate, structured logging operational
**Phase 5:** Output validation never breaks user experience, faithfulness detects hallucinations, violations stored and queryable, wrapper methods complete

---

## Implementation Summary

**Total Effort:** 22/25 across 37 tasks

| Phase | Tasks | Effort | Complexity | Key Deliverables |
|-------|-------|--------|------------|------------------|
| Phase 1: Core Infrastructure | 8 | 5/5 | 3/5 | Config system, DB schema, credentials, circuit breaker, env vars, Redis client, chatflow parser |
| Phase 2: Input Validation (MVP) | 8 | 5/5 | 4/5 | Safety API, PII API, per-dimension/per-type logic, wrapper methods, error handling, buildChatflow integration |
| Phase 3: API & Simple UI | 8 | 4/5 | 3/5 | REST endpoints, route registration, organization settings page, simple mode, presets, chatflow modal, service layer, API client |
| Phase 4: Advanced Config & Optimization | 6 | 3/5 | 4/5 | Advanced/Custom modes, Redis caching, parallel execution, structured logging |
| Phase 5: Output Validation & Faithfulness | 7 | 3/5 | 3/5 | Faithfulness API, RAG context, output wrapper, output integration, UI indicators, violation storage |

**Critical Path:** Phase 1 → Phase 2 → Phase 5 (configuration → input validation → output validation)

**Parallel Opportunities:** Phase 3 can start after Phase 1 completion (parallel with Phase 2)

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
