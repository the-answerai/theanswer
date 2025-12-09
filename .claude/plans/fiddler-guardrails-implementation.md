# Fiddler Guardrails - Implementation Guide

**Linear:** AGENT-139
**Last Updated:** 2025-11-11
**PR:** #686 (staging)

> **🔨 Document Purpose:** Step-by-step guide for building Fiddler Guardrails integration.
> **📊 For Progress:** See [fiddler-guardrails-status.md](fiddler-guardrails-status.md) for what's complete and what's missing.
> **📖 For Requirements:** See [fiddler-guardrails-spec.md](fiddler-guardrails-spec.md) for schemas, APIs, and acceptance criteria.

---

## Prerequisites

1. **Read these first:**
   - [fiddler-guardrails-spec.md](fiddler-guardrails-spec.md) - Understand requirements
   - [packages/server/CLAUDE.md](../../packages/server/CLAUDE.md) - Backend patterns
   - [apps/web/CLAUDE.md](../../apps/web/CLAUDE.md) - Frontend patterns

2. **Patterns to follow:**
   - Organization Entity: `packages/server/src/database/entities/Organization.ts`
   - Organization Service: `packages/server/src/services/organizations/index.ts`
   - Credential Definition: `packages/components/credentials/AnthropicApi.credential.ts`
   - Error Handling: Always use `InternalFlowiseError`

3. **Integration points:**
   - Input validation: `packages/server/src/utils/buildChatflow.ts:273-331` (DONE)
   - Output validation: `packages/server/src/utils/buildChatflow.ts:843+` (TODO)

4. **Integration Principle:**
   - Keep integration points minimal by extracting complexity into service classes with factory methods
   - The buildChatflow integration is ~35 lines by design—delegate to services rather than embedding logic inline

---

## Phase 1: Core Infrastructure ✅

> **Status:** Complete (1,441 lines)
> **See:** [status.md Phase 1](fiddler-guardrails-status.md#phase-1-core-infrastructure-1441-lines) for completion details

### 1.1 TypeScript Types (375 lines)

**File:** `packages/server/src/types/guardrails.ts`

**What to create:**
- Safety dimensions: `SafetyDimension` enum (11 values)
- PII types: `PIIType` enum (15+ values)
- Actions: `GuardrailAction` type (block/redact/warn/continue)
- Config schema: `GuardrailsConfig` interface with nested per-dimension/per-type overrides
- API response types: `SafetyAPIResponse`, `PIIAPIResponse`, `FaithfulnessAPIResponse`

**See spec for schemas:** [spec.md Configuration Schema](fiddler-guardrails-spec.md#configuration-schema)

---

### 1.2 Credential Definition (33 lines)

**File:** `packages/components/credentials/FiddlerApi.credential.ts`

**Pattern:** Follow `AnthropicApi.credential.ts` exactly

```typescript
import { INodeParams, INodeCredential } from '../src/Interface'

class FiddlerApi implements INodeCredential {
    label = 'Fiddler AI API'
    name = 'fiddlerApi'
    version = 1.0
    inputs: INodeParams[] = [
        {
            label: 'Fiddler API Key',
            name: 'fiddlerApiKey',
            type: 'password'
        },
        {
            label: 'Fiddler API URL',
            name: 'fiddlerApiUrl',
            type: 'string',
            default: 'https://your-org.fiddler.ai/api'
        }
    ]
}

module.exports = { credClass: FiddlerApi }
```

---

### 1.3 Configuration System (302 lines)

**File:** `packages/server/src/services/guardrails/config.ts`

**Key functions:**
1. `getEnvironmentConfig()` - Load from env vars (see [spec.md env vars](fiddler-guardrails-spec.md#environment-variables))
2. `getOrganizationConfig(organizationId)` - Parse `organizationConfig.guardrails` JSONB
3. `getChatflowConfig(chatflowId)` - Parse `chatbotConfig.guardrails` JSONB
4. `getGuardrailsConfig(chatflowId, user)` - **Main function** that merges all 3 tiers
5. `deepMergeConfigs(base, override)` - Preserve per-dimension/per-type overrides
6. `validateConfig(config)` - Validate thresholds, actions, etc.

**Critical implementation detail:**
```typescript
export async function getGuardrailsConfig(chatflowId: string, user: IUser) {
    let config = { ...DEFAULT_GUARDRAILS_CONFIG }

    // Layer 1: Environment (lowest priority)
    config = deepMergeConfigs(config, getEnvironmentConfig())

    // Layer 2: Organization
    const orgConfig = await getOrganizationConfig(user.organizationId)
    config = deepMergeConfigs(config, orgConfig)

    // Layer 3: Chatflow (highest priority)
    const chatflowConfig = await getChatflowConfig(chatflowId)
    config = deepMergeConfigs(config, chatflowConfig)

    return config as GuardrailsConfig
}
```

---

### 1.4 Circuit Breaker (127 lines)

**File:** `packages/server/src/services/guardrails/CircuitBreaker.ts`

**Pattern:** Half-open state with success/failure thresholds

**States:**
- CLOSED (normal) → OPEN after N failures
- OPEN (blocking) → HALF_OPEN after timeout
- HALF_OPEN (testing) → CLOSED after M successes OR OPEN on first failure

**Default config:** 5 failures → open, 30s timeout, 3 successes → close

---

### 1.5 Redis Caching (194 lines)

**File:** `packages/server/src/services/guardrails/cache.ts`

**Key features:**
- SHA256 hash of input text as cache key
- 1-hour TTL default
- Graceful fallback if Redis unavailable
- Separate caches per check type (safety, pii, faithfulness)

---

### 1.6 Fiddler Service (388 lines)

**File:** `packages/server/src/services/guardrails/FiddlerGuardrailsService.ts`

**Class structure:**
```typescript
export class FiddlerGuardrailsService {
    private client: AxiosInstance
    private circuitBreaker: CircuitBreaker
    private config: GuardrailsConfig

    constructor(credentials: FiddlerCredentials, config: GuardrailsConfig)

    // Phase 2: Input validation methods
    async evaluateSafety(text: string): Promise<SafetyEvaluationResult>
    async detectPII(text: string): Promise<PIIDetectionResult>
    private redactPII(text: string, detections: PIIDetection[]): string
    async validateInput(text: string): Promise<InputValidationResult>

    // Phase 5: Output validation methods (TODO)
    async validateOutput(text: string, context?: string): Promise<OutputValidationResult>
    async evaluateFaithfulness(response: string, context: string): Promise<FaithfulnessResult>
}
```

**See spec for API formats:** [spec.md Fiddler API Reference](fiddler-guardrails-spec.md#fiddler-api-reference)

---

### 1.7 Database Migration

**File:** `packages/server/src/database/migrations/*/AddOrganizationConfig.ts`

**What to add:**
```typescript
await queryRunner.query(`
    ALTER TABLE "organization"
    ADD COLUMN "organizationConfig" text
`)
```

**Run migration:** `pnpm migration:run` (user must approve)

---

## Phase 2: Input Validation ✅

> **Status:** Complete (integrated in Phase 1 service)
> **Location:** `buildChatflow.ts:273-331` (59 lines)

### 2.1 Input Validation Integration

**File:** `packages/server/src/utils/buildChatflow.ts`

**Where:** After line 272 (after `question` is set, before file processing)

**Implementation:**
```typescript
try {
    const guardrailsConfig = await getGuardrailsConfig(chatflowid, user!)

    if (guardrailsConfig.enabled && user?.organizationId) {
        // Load credentials (scoped to organization)
        const credentials = await credentialRepository.find({
            where: {
                credentialName: 'fiddlerApi',
                organizationId: user.organizationId
            }
        })

        if (credentials && credentials.length > 0) {
            const credentialData = await decryptCredentialData(credentials[0].encryptedData)
            const fiddlerService = new FiddlerGuardrailsService(
                {
                    apiKey: credentialData.fiddlerApiKey,
                    apiUrl: credentialData.fiddlerApiUrl
                },
                guardrailsConfig
            )

            const validationResult = await fiddlerService.validateInput(question)

            // Handle blocking
            if (validationResult.blocked) {
                throw new InternalFlowiseError(
                    StatusCodes.BAD_REQUEST,
                    validationResult.message || 'Content blocked by guardrails'
                )
            }

            // Handle redaction
            if (validationResult.redacted && validationResult.redactedText) {
                question = validationResult.redactedText
            }

            // Handle warnings (log only)
            if (validationResult.violations.safety || validationResult.violations.pii) {
                console.warn(`Guardrails warnings for chatflow ${chatflowid}:`, {
                    safety: validationResult.violations.safety,
                    pii: validationResult.violations.pii
                })
            }
        }
    }
} catch (error) {
    // Fail-open by default: log error but continue processing
    if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.BAD_REQUEST) {
        // Re-throw blocking errors
        throw error
    }
    console.error('Guardrails validation error (fail-open):', error)
}
```

---

## Phase 3: API & Simple UI ✅

> **Status:** Complete (171 lines frontend + backend routes/controllers)
> **See:** Backend patterns in [packages/server/CLAUDE.md](../../packages/server/CLAUDE.md)

### 3.1 Organization Service Layer

**File:** `packages/server/src/services/organizations/index.ts`

**Add methods:**
```typescript
export async function getOrganizationConfig(organizationId: string) {
    const org = await repository.findOne({ where: { id: organizationId } })
    return org?.organizationConfig ? JSON.parse(org.organizationConfig) : {}
}

export async function updateOrganizationConfig(organizationId: string, config: Partial<OrganizationConfig>) {
    const org = await repository.findOne({ where: { id: organizationId } })
    const currentConfig = org?.organizationConfig ? JSON.parse(org.organizationConfig) : {}
    const newConfig = deepMergeConfigs(currentConfig, config)

    await repository.update(organizationId, {
        organizationConfig: JSON.stringify(newConfig)
    })

    return newConfig
}
```

---

### 3.2 Organization Controllers & Routes

**Files:**
- `packages/server/src/controllers/organizations/index.ts`
- `packages/server/src/routes/organizations/index.ts`

**Endpoints to create:**
- `GET /api/v1/organizations/:id/config` - Get full org config
- `PUT /api/v1/organizations/:id/config` - Update org config (admin only)
- `GET /api/v1/organizations/:id/config/guardrails` - Get guardrails config
- `PUT /api/v1/organizations/:id/config/guardrails` - Update guardrails (admin only)

**Security:** All routes must use `enforceAbility('Organization')` middleware

---

### 3.3 Simple Mode UI (171 lines)

**File:** `packages-answers/ui/src/GuardrailsSettings/SimpleMode.tsx`

**Presets:** See `packages/ui/src/views/organizations/guardrails/presets.ts`
- Strict (0.05): External bots, PCI-DSS
- Balanced (0.1): General purpose (recommended)
- Lenient (0.15): Internal tools

**Component structure:**
- Credential selector dropdown
- Preset radio cards with descriptions
- Save/Cancel buttons
- Success/error alerts

---

## Phase 4: Advanced Config UI ✅

> **Status:** Complete (1,104 lines)
> **Files:** AdvancedMode.tsx (816 lines), MasterConfig.tsx (288 lines)

### 4.1 Advanced Mode (816 lines)

**File:** `packages-answers/ui/src/GuardrailsSettings/AdvancedMode.tsx`

**What to build:**
1. **Per-Dimension Safety Table** (11 rows)
   - Columns: Dimension name, Override checkbox, Threshold slider (0.0-1.0), Action dropdown
   - Default shows global threshold (grayed out)
   - Override enables row-specific config

2. **Per-Type PII Tables** (15+ rows each)
   - Confidence table: Override checkbox, Confidence slider (0.0-1.0)
   - Actions table: Override checkbox, Action dropdown
   - Bulk actions: Set all to strict/lenient/reset

3. **Accordion Organization**
   - Input Guardrails
   - Output Guardrails
   - Advanced Settings (cache, circuit breaker)

---

### 4.2 Master Config Component (288 lines)

**File:** `packages-answers/ui/src/GuardrailsSettings/MasterConfig.tsx`

**Purpose:** Unified component above tabs for:
- Credential selection
- Global enable/disable toggle
- Block message configuration
- Applies to all modes (Simple/Advanced/Custom)

---

## Phase 5: Output Validation ⏸️ (DEPRIORITIZED)

> **Status:** DEPRIORITIZED (0 lines) - Not required for MVP
> **Time (if revisited):** 2-3 hours
> **Why Deferred:** Input validation provides primary protection; output validation adds latency
> **See:** [status.md Deprioritized Features](fiddler-guardrails-status.md#️-deprioritized-features-phase-5)

### 5.1 Add validateOutput() Method

**File:** `packages/server/src/services/guardrails/FiddlerGuardrailsService.ts`

**Add method:**
```typescript
async validateOutput(text: string, sourceDocuments?: any[]): Promise<OutputValidationResult> {
    const checks = []

    // Always run safety and PII
    checks.push(this.evaluateSafety(text))
    checks.push(this.detectPII(text))

    // Only run faithfulness for RAG (when sourceDocuments exist)
    if (sourceDocuments && sourceDocuments.length > 0) {
        const context = sourceDocuments.map(doc => doc.pageContent).join('\n\n')
        if (context.length > 50) {
            checks.push(this.evaluateFaithfulness(text, context))
        }
    }

    const [safetyResult, piiResult, faithfulnessResult] = await Promise.all(checks)

    // Combine violations and determine actions
    const blocked = safetyResult.violations.some(v => v.action === 'block') ||
                    piiResult.violations.some(v => v.action === 'block') ||
                    faithfulnessResult?.action === 'block'

    const redacted = piiResult.violations.some(v => v.action === 'redact')

    return {
        blocked,
        redacted,
        redactedText: redacted ? this.redactPII(text, piiResult.violations) : text,
        violations: {
            safety: safetyResult.violations,
            pii: piiResult.violations,
            faithfulness: faithfulnessResult
        }
    }
}
```

---

### 5.2 Add evaluateFaithfulness() Method

**File:** Same as above

**Fiddler API:** `POST /v3/guardrails/ftl-response-faithfulness`

**Request:**
```json
{
  "data": {
    "input": "context text...",
    "output": "llm response text..."
  }
}
```

**Response:**
```json
{
  "fdl_faithful_score": 0.92  // Lower = worse (inverted logic!)
}
```

**Threshold logic:** score < threshold → hallucination

---

### 5.3 Output Validation Integration

**File:** `packages/server/src/utils/buildChatflow.ts`

**Where:** After line 843 (after `resultText` is set, before saving `apiMessage`)

**Implementation:**
```typescript
// CRITICAL: Output validation ALWAYS fails open (never throw error)
try {
    if (guardrailsConfig.enabled && fiddlerService) {
        const outputValidation = await fiddlerService.validateOutput(
            resultText,
            result.sourceDocuments
        )

        if (outputValidation.blocked) {
            resultText = guardrailsConfig.blockMessage || "I cannot provide this response due to safety concerns."
        } else if (outputValidation.redacted) {
            resultText = outputValidation.redactedText
        }

        // Log warnings
        if (outputValidation.violations.safety || outputValidation.violations.pii || outputValidation.violations.faithfulness) {
            console.warn(`Output guardrails violations for chatflow ${chatflowid}:`, outputValidation.violations)
        }
    }
} catch (error) {
    // ALWAYS fail-open for output (never break user experience)
    console.error('Output guardrails error (fail-open):', error)
}
```

**CRITICAL:** Never throw errors in output validation - always fail-open

---

## Phase 6: Chatflow Overrides ✅

> **Status:** Complete (312 lines)
> **File:** `packages/ui/src/ui-component/extended/ChatflowGuardrails.jsx`

### 6.1 Chatflow Guardrails Component (312 lines)

**Integration point:** `packages/ui/src/ui-component/dialog/ChatflowConfigurationDialog.jsx`

**Add tab:**
```javascript
import ChatflowGuardrails from '@/ui-component/extended/ChatflowGuardrails'

const CHATFLOW_CONFIGURATION_TABS = [
    // ... existing tabs
    {
        label: 'Guardrails',
        id: 'guardrails'
    }
]

// In tab panels:
{item.id === 'guardrails' ? <ChatflowGuardrails dialogProps={dialogProps} /> : null}
```

**Component features:**
- Shows organization config in read-only Alert when override disabled
- Override toggle to enable chatflow-specific config
- Reuses SimpleMode and AdvancedMode components
- Saves to `chatflow.chatbotConfig.guardrails`
- Backend `getGuardrailsConfig()` automatically merges: env → org → chatflow

---

## Testing

### E2E Tests (600 lines)

**File:** `apps/web/e2e/tests/guardrails-settings.spec.ts`

**Test scenarios:**
1. Admin can access org guardrails page (200 OK)
2. Non-admin gets 403
3. Preset selection saves correctly
4. Advanced mode overrides work
5. Chatflow override toggle works
6. Configuration persists across reloads

**Run:** `pnpm test:e2e -- tests/guardrails-settings.spec.ts`

---

### Unit Tests (TODO - 0% coverage)

**Files to create:**
- `test/services/guardrails/FiddlerGuardrailsService.test.ts`
- `test/services/guardrails/config.test.ts`
- `test/services/guardrails/CircuitBreaker.test.ts`

---

## Common Issues

### 1. Import paths for SimpleMode/AdvancedMode

**Wrong:**
```javascript
import SimpleMode from 'packages-answers/ui/src/GuardrailsSettings/SimpleMode'
```

**Correct:**
```javascript
import SimpleMode from '../../../../../packages-answers/ui/src/GuardrailsSettings/SimpleMode'
```

No alias is configured for `packages-answers` in the UI package.

---

### 2. Credential loading must filter by organizationId

**Wrong:**
```typescript
const credentials = await credentialRepository.find({
    where: { credentialName: 'fiddlerApi' }
})
```

**Correct:**
```typescript
const credentials = await credentialRepository.find({
    where: {
        credentialName: 'fiddlerApi',
        organizationId: user.organizationId  // Multi-tenancy!
    }
})
```

---

### 3. Deep merge must preserve per-dimension/per-type overrides

**Wrong:** Shallow merge with `{ ...base, ...override }`

**Correct:** Use `deepMergeConfigs()` from `config.ts`

---

## Environment Variables

**File:** `.env.template`

**Required:**
```bash
# Fiddler Guardrails
FIDDLER_GUARDRAILS_ENABLED=false          # Default: disabled
FIDDLER_API_KEY=                           # Fallback if no org credential
FIDDLER_API_URL=https://your-org.fiddler.ai/api

# Safety
FIDDLER_SAFETY_ENABLED=true
FIDDLER_SAFETY_THRESHOLD=0.1
FIDDLER_SAFETY_ACTION=block

# PII
FIDDLER_PII_ENABLED=true
FIDDLER_PII_THRESHOLD=0.8
FIDDLER_PII_ACTION=redact

# Faithfulness
FIDDLER_FAITHFULNESS_ENABLED=true
FIDDLER_FAITHFULNESS_THRESHOLD=0.7
FIDDLER_FAITHFULNESS_ACTION=warn

# Circuit Breaker
FIDDLER_CIRCUIT_FAILURE_THRESHOLD=5
FIDDLER_CIRCUIT_RESET_TIMEOUT=30000       # 30 seconds
FIDDLER_CIRCUIT_SUCCESS_THRESHOLD=3

# Cache
FIDDLER_CACHE_ENABLED=true
FIDDLER_CACHE_TTL=3600                    # 1 hour
REDIS_URL=redis://localhost:6379          # Already exists
```

---

## Next Steps

### Optional Polish (1-2 hours)

1. **Fix credential fallback** (30 minutes)
2. **Fix SimpleMode bug** (5 minutes)
3. **Enhance logging** (1 hour)

### If Phase 5 Becomes Priority

4. **Implement Output Validation** (2-3 hours) - See Phase 5 section above for complete implementation guide

---

**For current status and gaps:** See [fiddler-guardrails-status.md](fiddler-guardrails-status.md)
**For technical requirements:** See [fiddler-guardrails-spec.md](fiddler-guardrails-spec.md)
