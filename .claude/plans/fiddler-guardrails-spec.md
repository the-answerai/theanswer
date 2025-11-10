# Fiddler Guardrails Integration - Technical Specification

**Linear**: AGENT-139
**Status**: Ready for Implementation
**Last Updated**: 2025-11-10 (Updated: Effort/complexity scoring)

**Project Scores**:

-   **Overall Effort**: Medium-High (15/25 across 5 phases)
-   **Overall Complexity**: Medium-High (17/25 average, 3.0/5)
-   **Risk Level**: Low-Medium (fail-open design reduces deployment risk)
-   **Advanced Features**: Per-dimension safety thresholds (11), per-type PII actions/thresholds (15+)

---

## Executive Summary

Integrate Fiddler AI Guardrails into AnswerAgent prediction endpoints to automatically validate LLM inputs and outputs for safety violations, PII exposure, and hallucinations. The integration provides organization-level credential management with per-chatflow configuration overrides, minimal latency impact through parallel execution and caching, and fail-open error handling to ensure prediction reliability.

**API Coverage**: This specification implements **100% of available Fiddler Guardrails endpoints** (3/3 endpoints, 11/11 safety dimensions, 14+ PII types). See [Coverage Verification](#fiddler-guardrails-coverage-verification) for details.

**Key Metrics**:

-   **Latency Impact**: <150ms (p95) with caching, <10ms on cache hit
-   **Configuration**: 3-level hierarchy (environment → organization → chatflow)
-   **Reliability**: Fail-open by default, circuit breaker protection
-   **Scope**: Phase 1 - Safety, PII, Faithfulness checks

---

## Fiddler Guardrails Coverage Verification

This specification covers **all available Fiddler Guardrails API endpoints** as of 2024-2025:

### ✅ Covered Endpoints (3/3)

| Endpoint                      | Purpose                         | Status             | Implementation               |
| ----------------------------- | ------------------------------- | ------------------ | ---------------------------- |
| **ftl-safety**                | 11-dimension safety check       | ✅ Fully Specified | Input & Output validation    |
| **ftl-response-faithfulness** | Hallucination detection for RAG | ✅ Fully Specified | Output validation (RAG only) |
| **sensitive-information**     | PII detection & redaction       | ✅ Fully Specified | Input & Output validation    |

### 📊 Safety Dimensions Covered (11/11)

All 11 safety dimensions from Fiddler's ftl-safety model are evaluated:

1. ✅ **fdl_harmful** - General harmful content
2. ✅ **fdl_violent** - Violent content or threats
3. ✅ **fdl_unethical** - Unethical behavior
4. ✅ **fdl_illegal** - Illegal activities
5. ✅ **fdl_sexual** - Sexual/adult content
6. ✅ **fdl_racist** - Racist content
7. ✅ **fdl_jailbreaking** - Safety bypass attempts
8. ✅ **fdl_harassing** - Harassment
9. ✅ **fdl_hateful** - Hate speech
10. ✅ **fdl_sexist** - Sexist content
11. ✅ **fdl_roleplaying** - Inappropriate roleplaying

**Configuration**: Single threshold applies to all dimensions (any score > threshold = unsafe)

**Future Enhancement**: Per-dimension thresholds (e.g., stricter for illegal content, lenient for roleplaying)

### 🔐 PII Types Covered (14+/14+)

All documented Fiddler PII entity types are supported:

✅ PERSON, EMAIL, PHONE_NUMBER, ADDRESS, US_SOCIAL_SECURITY_NUMBER, CREDIT_CARD, US_PASSPORT, US_DRIVER_LICENSE, US_BANK_NUMBER, CREDIT_CARD_EXPIRATION, PIN, IBAN_CODE, SWIFT_CODE, USERNAME, AGE

**Detection**: All types detected via single API call
**Redaction**: Generic algorithm handles all entity types uniformly
**Extensibility**: New PII types automatically supported (Fiddler API returns label)

### 🚫 Not Covered (Intentionally Out of Scope)

The following are **not** part of Fiddler Guardrails' public API as of 2024-2025:

-   **Custom Guardrails**: No documented API for custom model deployment (may exist in enterprise plans)
-   **Batch Processing**: No bulk endpoint (process items sequentially or in parallel client-side)
-   **Streaming Validation**: No support for token-by-token checking during streaming (requires complete text)
-   **Multilingual Models**: Not explicitly documented (assumed English-primary)
-   **Confidence Calibration**: No API to adjust model confidence thresholds
-   **Training/Fine-tuning**: Models are pre-trained (no customization API)

### 📝 Specification Completeness

| Aspect                   | Coverage                        |
| ------------------------ | ------------------------------- |
| API Endpoints            | 3/3 (100%)                      |
| Safety Dimensions        | 11/11 (100%)                    |
| PII Entity Types         | 14+/14+ (100%)                  |
| Request/Response Formats | ✅ Documented with examples     |
| Authentication           | ✅ Bearer token pattern         |
| Error Handling           | ✅ Fail-open + circuit breaker  |
| Performance Optimization | ✅ Parallel + caching + pooling |
| Configuration Options    | ✅ 3-level hierarchy            |

### 🔄 Future Fiddler API Additions

If Fiddler releases new guardrails (e.g., tone analysis, brand safety), the integration architecture supports adding them with:

1. New endpoint constant in `FiddlerGuardrailsService`
2. New method (e.g., `evaluateTone()`)
3. Configuration schema update (add `tone` section)
4. UI toggle in organization/chatflow settings

**Estimated effort per new guardrail**: Small (1/5), Complexity: Low (1/5)

---

## Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURATION LAYER                                        │
│  • Environment Variables (instance defaults)                │
│  • Organization Settings (TypeORM: Organization entity)     │
│  • Chatflow Settings (TypeORM: ChatFlow.chatbotConfig)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICE LAYER                                              │
│  • FiddlerGuardrailsService (HTTP client, API calls)        │
│  • Config utilities (load & merge hierarchy)                │
│  • CircuitBreaker (reliability)                             │
│  • Redis cache (performance)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  INTEGRATION LAYER                                          │
│  • buildChatflow.ts (prediction execution)                  │
│  • Pre-check: Input validation (line ~262)                  │
│  • Post-check: Output validation (line ~743)                │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Configuration Layer**:

-   Manage 3-level configuration hierarchy with precedence rules
-   Load and decrypt Fiddler API credentials from Flowise credential system
-   Merge environment defaults with organization and chatflow overrides
-   Provide configuration to service layer on each request

**Service Layer**:

-   Execute HTTP calls to Fiddler Guardrails API
-   Implement parallel execution of multiple checks
-   Provide Redis caching with 1-hour TTL
-   Circuit breaker pattern for API failures
-   Return validation results with violations and modified text

**Integration Layer**:

-   Inject guardrails checks at two points in prediction flow
-   Handle input validation (blocking on violations)
-   Handle output validation (modifying on violations)
-   Pass RAG context to faithfulness checks when available

---

## Data Flow

### Request Flow: Input Validation

```
User Request
    ↓
Parse Question/Input
    ↓
┌───────────────────────────────────────┐
│ GUARDRAILS PRE-CHECK                  │
│                                       │
│ 1. Check if enabled                   │
│    • chatflow.enabled                 │
│    • organization.enabled             │
│    • FIDDLER_ENABLED env var          │
│                                       │
│ 2. Load configuration                 │
│    • Environment defaults             │
│    • Organization credential          │
│    • Organization settings            │
│    • Chatflow overrides               │
│                                       │
│ 3. Initialize service                 │
│    • HTTP client with keep-alive      │
│    • Circuit breaker                  │
│    • Redis connection                 │
│                                       │
│ 4. Run enabled checks (PARALLEL)     │
│    • Safety check (if enabled)        │
│    • PII detection (if enabled)       │
│                                       │
│ 5. Evaluate results                   │
│    • Violations detected?             │
│    • Action = block → Return 400      │
│    • Action = redact → Modify text    │
│    • Action = warn → Log + continue   │
└───────────────────────────────────────┘
    ↓
    ↓ [If not blocked]
    ↓
Execute LLM
```

### Response Flow: Output Validation

```
LLM Generates Response
    ↓
Extract Response Text
    ↓
┌───────────────────────────────────────┐
│ GUARDRAILS POST-CHECK                 │
│                                       │
│ 1. Run enabled checks (PARALLEL)     │
│    • Safety check (if enabled)        │
│    • PII detection (if enabled)       │
│    • Faithfulness (if enabled + RAG)  │
│                                       │
│ 2. Extract RAG context                │
│    • From result.sourceDocuments      │
│    • Pass to faithfulness check       │
│                                       │
│ 3. Evaluate results                   │
│    • Violations detected?             │
│    • Action = block → Replace text    │
│    • Action = redact → Modify text    │
│    • Action = warn → Log + continue   │
│    • NEVER throw error (fail-open)    │
└───────────────────────────────────────┘
    ↓
Return Response to User
```

### Error Handling Flow

```
┌─────────────────────────────────┐
│ Guardrail Check Error           │
│ • Network timeout               │
│ • Fiddler API error (500)       │
│ • Invalid response              │
│ • Circuit breaker open          │
└──────┬──────────────────────────┘
       │
       ↓
   INPUT or OUTPUT?
       │
       ├─→ INPUT VALIDATION
       │   │
       │   └─→ failOpen=true?
       │       ├─→ YES: Log + continue to LLM
       │       └─→ NO: Throw 500 error, block request
       │
       └─→ OUTPUT VALIDATION
           │
           └─→ ALWAYS fail-open
               Log error, return original text
```

---

## Configuration

### Three-Level Hierarchy

**Precedence**: Chatflow Settings > Organization Settings > Environment Variables

#### Level 1: Environment Variables (Instance Defaults)

Global defaults and fallback configuration for the entire AnswerAgent instance.

**Variables**:

-   `FIDDLER_ENABLED` - Global kill switch (true/false)
-   `FIDDLER_API_KEY` - Fallback API credential if no org credential
-   `FIDDLER_API_URL` - API endpoint (default: https://guardrails.cloud.fiddler.ai)
-   `FIDDLER_TIMEOUT_MS` - Request timeout in milliseconds (default: 3000)
-   `FIDDLER_RETRY_ATTEMPTS` - Number of retry attempts (default: 1)
-   `FIDDLER_SAFETY_THRESHOLD` - Safety violation threshold, 0.0-1.0 (default: 0.1)
-   `FIDDLER_FAITHFULNESS_THRESHOLD` - Hallucination threshold, 0.0-1.0 (default: 0.005)
-   `FIDDLER_PII_CONFIDENCE_THRESHOLD` - PII detection confidence threshold, 0.0-1.0 (default: 0.8)
-   `FIDDLER_FAIL_OPEN` - Continue on API errors (true/false, default: true)
-   `FIDDLER_BLOCK_MESSAGE` - Default message for blocked content

**Purpose**: Provide sensible defaults and fallback values when org/chatflow configs are incomplete.

#### Level 2: Organization Settings (TypeORM)

Organization-wide guardrails configuration managed by administrators through the admin UI.

**Storage**: `Organization.organizationConfig` field (JSON) - Generic settings container

**Field Structure**:

```typescript
{
  guardrails: { ... },  // Guardrails-specific configuration
  // Future settings can be added:
  // analytics: { ... },
  // branding: { ... },
  // limits: { ... },
  // notifications: { ... }
}
```

**Guardrails Configuration Schema**:

```typescript
{
  credentialId: string,           // Reference to Fiddler credential (or null to use env var)
  enabled: boolean,               // Master switch for organization
  validateInput: {
    safety: {
      enabled: boolean,
      threshold: number,          // 0.0 - 1.0 (Global threshold, Fiddler recommends > 0.1)
      dimensionThresholds?: {     // Optional per-dimension overrides
        fdl_harmful?: number,
        fdl_violent?: number,
        fdl_unethical?: number,
        fdl_illegal?: number,
        fdl_sexual?: number,
        fdl_racist?: number,
        fdl_jailbreaking?: number,
        fdl_harassing?: number,
        fdl_hateful?: number,
        fdl_sexist?: number,
        fdl_roleplaying?: number
      },
      action: "block" | "warn"
    },
    pii: {
      enabled: boolean,
      confidenceThreshold: number, // 0.0 - 1.0 (Global confidence, Fiddler recommends 0.8)
      typeConfidenceThresholds?: { // Optional per-type confidence overrides
        PERSON?: number,
        EMAIL?: number,
        PHONE_NUMBER?: number,
        ADDRESS?: number,
        US_SOCIAL_SECURITY_NUMBER?: number,
        CREDIT_CARD?: number,
        US_PASSPORT?: number,
        US_DRIVER_LICENSE?: number,
        US_BANK_NUMBER?: number,
        CREDIT_CARD_EXPIRATION?: number,
        PIN?: number,
        IBAN_CODE?: number,
        SWIFT_CODE?: number,
        USERNAME?: number,
        AGE?: number
      },
      action: "block" | "redact" | "warn",  // Global action (fallback)
      typeActions?: {                         // Optional per-type action overrides
        PERSON?: "block" | "redact" | "warn",
        EMAIL?: "block" | "redact" | "warn",
        PHONE_NUMBER?: "block" | "redact" | "warn",
        ADDRESS?: "block" | "redact" | "warn",
        US_SOCIAL_SECURITY_NUMBER?: "block" | "redact" | "warn",
        CREDIT_CARD?: "block" | "redact" | "warn",
        US_PASSPORT?: "block" | "redact" | "warn",
        US_DRIVER_LICENSE?: "block" | "redact" | "warn",
        US_BANK_NUMBER?: "block" | "redact" | "warn",
        CREDIT_CARD_EXPIRATION?: "block" | "redact" | "warn",
        PIN?: "block" | "redact" | "warn",
        IBAN_CODE?: "block" | "redact" | "warn",
        SWIFT_CODE?: "block" | "redact" | "warn",
        USERNAME?: "block" | "redact" | "warn",
        AGE?: "block" | "redact" | "warn"
      }
    }
  },
  validateOutput: {
    safety: {
      enabled: boolean,
      threshold: number,          // 0.0 - 1.0 (Global threshold, Fiddler recommends > 0.1)
      dimensionThresholds?: {     // Optional per-dimension overrides
        fdl_harmful?: number,
        fdl_violent?: number,
        fdl_unethical?: number,
        fdl_illegal?: number,
        fdl_sexual?: number,
        fdl_racist?: number,
        fdl_jailbreaking?: number,
        fdl_harassing?: number,
        fdl_hateful?: number,
        fdl_sexist?: number,
        fdl_roleplaying?: number
      },
      action: "block" | "warn"
    },
    faithfulness: {
      enabled: boolean,
      threshold: number,          // 0.0 - 1.0 (Fiddler recommends < 0.005 for hallucination detection)
      action: "block" | "warn"
    },
    pii: {
      enabled: boolean,
      confidenceThreshold: number, // 0.0 - 1.0 (Global confidence, Fiddler recommends 0.8)
      typeConfidenceThresholds?: { // Optional per-type confidence overrides
        PERSON?: number,
        EMAIL?: number,
        PHONE_NUMBER?: number,
        ADDRESS?: number,
        US_SOCIAL_SECURITY_NUMBER?: number,
        CREDIT_CARD?: number,
        US_PASSPORT?: number,
        US_DRIVER_LICENSE?: number,
        US_BANK_NUMBER?: number,
        CREDIT_CARD_EXPIRATION?: number,
        PIN?: number,
        IBAN_CODE?: number,
        SWIFT_CODE?: number,
        USERNAME?: number,
        AGE?: number
      },
      action: "block" | "redact" | "warn",  // Global action (fallback)
      typeActions?: {                         // Optional per-type action overrides
        PERSON?: "block" | "redact" | "warn",
        EMAIL?: "block" | "redact" | "warn",
        PHONE_NUMBER?: "block" | "redact" | "warn",
        ADDRESS?: "block" | "redact" | "warn",
        US_SOCIAL_SECURITY_NUMBER?: "block" | "redact" | "warn",
        CREDIT_CARD?: "block" | "redact" | "warn",
        US_PASSPORT?: "block" | "redact" | "warn",
        US_DRIVER_LICENSE?: "block" | "redact" | "warn",
        US_BANK_NUMBER?: "block" | "redact" | "warn",
        CREDIT_CARD_EXPIRATION?: "block" | "redact" | "warn",
        PIN?: "block" | "redact" | "warn",
        IBAN_CODE?: "block" | "redact" | "warn",
        SWIFT_CODE?: "block" | "redact" | "warn",
        USERNAME?: "block" | "redact" | "warn",
        AGE?: "block" | "redact" | "warn"
      }
    }
  },
  timeout: number,                // Override default timeout (default: 3000ms)
  retries: number,                // Override default retries (default: 1)
  failOpen: boolean,              // Override default fail-open (default: true)
  blockMessage: string            // Custom block message
}
```

**Access**: Admin users only via `/settings/organization/guardrails`

**Purpose**: Set organization-wide defaults that apply to all chatflows unless overridden.

#### Level 3: Chatflow Settings (TypeORM)

Per-chatflow configuration overrides managed by chatflow owners.

**Storage**: `ChatFlow.chatbotConfig.guardrails` (nested JSON in existing field)

**Schema**: Same structure as organization settings

**Inheritance**: All fields are optional; omitted fields inherit from organization settings

**Access**: Chatflow editors via chatflow configuration modal

## **Purpose**: Allow fine-tuned guardrail settings per chatflow (e.g., stricter for external bots, lenient for internal tools).

### Threshold Configuration Coverage

This section verifies that all Fiddler API capabilities have corresponding threshold controls in our configuration schema.

| Fiddler API Feature              | API Output                               | Threshold Control                                          | Status      | Notes                                  |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------- | ----------- | -------------------------------------- |
| **Safety Check (11 dimensions)** | 11 float scores (0.0-1.0)                | `safety.threshold` + `safety.dimensionThresholds`          | ✅ Complete | Global + per-dimension overrides       |
| **Faithfulness Check**           | Single `fdl_faithful_score`              | `faithfulness.threshold`                                   | ✅ Complete | Lower score = hallucination            |
| **PII Detection (confidence)**   | Array of entities with confidence scores | `pii.confidenceThreshold` + `pii.typeConfidenceThresholds` | ✅ Complete | Global + per-type confidence overrides |
| **PII Detection (actions)**      | 15 entity types                          | `pii.action` + `pii.typeActions`                           | ✅ Complete | Global + per-type action overrides     |

#### Threshold Behavior Details

**1. Safety Threshold (`safety.threshold` + `safety.dimensionThresholds`)**

-   **Range**: 0.0 - 1.0
-   **Fiddler Recommendation**: > 0.1
-   **Global Evaluation**: If ANY of the 11 dimension scores exceeds global threshold → UNSAFE
-   **Per-Dimension Override**: Specific dimensions can have custom thresholds
-   **Fallback Logic**: If dimension not in `dimensionThresholds`, uses global `threshold`
-   **Example**:
    ```json
    {
        "threshold": 0.1,
        "dimensionThresholds": {
            "fdl_illegal": 0.02,
            "fdl_roleplaying": 0.5
        }
    }
    ```
    -   API returns: `{fdl_illegal: 0.03, fdl_harmful: 0.08, fdl_roleplaying: 0.4}`
    -   Evaluation: `fdl_illegal` (0.03 > 0.02) → **UNSAFE** (uses override)
    -   `fdl_harmful` (0.08 < 0.1) → safe (uses global)
    -   `fdl_roleplaying` (0.4 < 0.5) → safe (uses override)
-   **Action**: Determined by `safety.action` (block or warn)
-   **Use Cases**: Stricter on illegal/harmful, lenient on roleplaying/unethical

**2. Faithfulness Threshold (`faithfulness.threshold`)**

-   **Range**: 0.0 - 1.0
-   **Fiddler Recommendation**: < 0.005
-   **Evaluation**: If `fdl_faithful_score` < threshold → HALLUCINATION
-   **Example**: threshold=0.005, score=0.003 → HALLUCINATION DETECTED
-   **Action**: Determined by `faithfulness.action` (block or warn)
-   **Note**: Inverted logic - lower score = worse
-   **No per-check overrides**: Single threshold only (RAG context-specific)

**3. PII Confidence Threshold (`pii.confidenceThreshold` + `pii.typeConfidenceThresholds`)**

-   **Range**: 0.0 - 1.0
-   **Fiddler Recommendation**: 0.8
-   **Global Evaluation**: Filter entities where `entity.score` < global confidenceThreshold
-   **Per-Type Override**: Specific PII types can have custom confidence thresholds
-   **Fallback Logic**: If type not in `typeConfidenceThresholds`, uses global `confidenceThreshold`
-   **Example**:
    ```json
    {
        "confidenceThreshold": 0.8,
        "typeConfidenceThresholds": {
            "US_SOCIAL_SECURITY_NUMBER": 0.7,
            "USERNAME": 0.9
        }
    }
    ```
    -   API returns: `[{label: "US_SOCIAL_SECURITY_NUMBER", score: 0.75}, {label: "EMAIL", score: 0.78}, {label: "USERNAME", score: 0.85}]`
    -   Evaluation:
        -   SSN (0.75 ≥ 0.7) → **DETECTED** (uses override)
        -   EMAIL (0.78 < 0.8) → filtered out (uses global)
        -   USERNAME (0.85 < 0.9) → filtered out (uses override)
-   **Purpose**: Lower threshold for high-value PII (SSN, credit cards), higher for ambiguous types (usernames)

**4. PII Action Overrides (`pii.action` + `pii.typeActions`)**

-   **Actions**: "block", "redact", "warn"
-   **Global Action**: Applied to all detected PII types
-   **Per-Type Override**: Specific PII types can have different actions
-   **Fallback Logic**: If type not in `typeActions`, uses global `action`
-   **Example**:
    ```json
    {
        "action": "redact",
        "typeActions": {
            "US_SOCIAL_SECURITY_NUMBER": "block",
            "CREDIT_CARD": "block",
            "USERNAME": "warn"
        }
    }
    ```
    -   Detected entities: SSN, EMAIL, USERNAME
    -   Actions:
        -   SSN → **block** (returns error, uses override)
        -   EMAIL → **redact** (replaces with `[EMAIL]`, uses global)
        -   USERNAME → **warn** (logs but continues, uses override)
-   **Use Cases**: Block financial PII, redact contact info, warn on non-sensitive data

#### Validation Rules

When validating configuration (both UI and API):

**Basic Validation:**

1. **Safety threshold**: 0.0 ≤ threshold ≤ 1.0
2. **Safety dimensionThresholds**: All values 0.0 ≤ value ≤ 1.0
3. **Faithfulness threshold**: 0.0 ≤ threshold ≤ 1.0
4. **PII confidence threshold**: 0.0 ≤ confidenceThreshold ≤ 1.0
5. **PII typeConfidenceThresholds**: All values 0.0 ≤ value ≤ 1.0
6. **PII typeActions**: All values must be "block" | "redact" | "warn"
7. **At least one check enabled**: If `enabled=true`, at least one of (safety, pii, faithfulness) must be enabled
8. **Faithfulness requires context**: Can only enable faithfulness for output validation

**Advanced Validation:** 9. **Dimension keys**: `dimensionThresholds` keys must match Fiddler dimension names (fdl_harmful, fdl_violent, etc.) 10. **PII type keys**: `typeConfidenceThresholds` and `typeActions` keys must match Fiddler PII types (EMAIL, PERSON, etc.) 11. **Override consistency**: If dimension/type override exists, must have valid threshold/action value

**Warnings for Unusual Values:**

-   Safety global threshold < 0.05 or > 0.2 (outside typical range)
-   Safety dimension threshold < 0.02 or > 0.5 (extreme per-dimension)
-   Faithfulness threshold > 0.01 (very lenient)
-   PII confidence < 0.7 or > 0.95 (high false positive/negative risk)
-   Per-type confidence < 0.6 or > 0.95 (extreme sensitivity)

**Best Practice Recommendations (UI hints):**

-   Illegal content: Use threshold 0.02-0.05 (very strict)
-   Harmful content: Use threshold 0.05-0.1 (strict)
-   Hate/harassment: Use threshold 0.05-0.1 (strict)
-   Roleplaying: Use threshold 0.2-0.5 (lenient)
-   Financial PII (SSN, credit card): Use "block" action
-   Contact PII (email, phone): Use "redact" action
-   Non-sensitive (username, age): Use "warn" action

---

## Credential Management

### Primary: Flowise Credential System

**Credential Type**: `fiddlerApi`

**Fields**:

-   `apiKey` (password, required): Fiddler AI API key
-   `apiUrl` (string, optional): Custom API endpoint for on-prem deployments

**Storage**: Encrypted in TypeORM `credential` table (existing Flowise system)

**Scope**: Organization-level (one credential shared by all chatflows in org)

**Access**:

-   Creation: Admin UI at `/credentials?type=fiddlerApi`
-   Selection: Organization settings page (admin only)
-   Usage: Automatically loaded at runtime, never exposed to client

**Benefits**:

-   Encrypted at rest
-   Standard Flowise credential UI
-   Audit logging (via Flowise)
-   Easy rotation (update credential, all chatflows use new key)

### Fallback: Environment Variable

**Variable**: `FIDDLER_API_KEY`

**Usage**: Used only if organization has no credential configured

**Purpose**: Backwards compatibility, testing, simple deployments

---

## Database Schema

### Organization Entity (TypeORM)

**Table**: `organization`

**New Field**: `organizationConfig` (TEXT, nullable, JSON)

**Migration**:

```sql
ALTER TABLE organization ADD COLUMN organizationConfig TEXT;
```

**Schema**: Generic JSON container for all organization settings

```typescript
{
  guardrails?: GuardrailsConfig,  // Optional guardrails configuration
  analytics?: AnalyticsConfig,     // Future: analytics settings
  branding?: BrandingConfig,       // Future: custom branding
  limits?: UsageLimitsConfig,      // Future: usage limits
  notifications?: NotificationConfig // Future: notification preferences
}
```

**Entity Methods**: Add helper methods for type-safe access:

-   `getConfig()` - Parse and return full config
-   `setConfig(config)` - Stringify and save full config
-   `getGuardrailsConfig()` - Get guardrails section only
-   `updateGuardrailsConfig(guardrails)` - Update guardrails section only

**Indexes**: None required (low-frequency access)

**Extensibility**: Adding new organization settings requires no migration, only TypeScript interface updates

### ChatFlow Entity (TypeORM)

**Table**: `chat_flow`

**Field**: `chatbotConfig` (TEXT, existing field, JSON)

**New Nested Path**: `chatbotConfig.guardrails`

**Migration**: None required (uses existing field)

**Schema**: Same as organization config (all fields optional for inheritance)

### Credential Entity (TypeORM)

**Table**: `credential` (existing)

**New Credential Type**: `fiddlerApi`

**No schema changes**: Uses existing credential system

---

## API Endpoints

### Fiddler Guardrails API

**Base URL**: `https://guardrails.cloud.fiddler.ai`

**Authentication**: All endpoints require Bearer token authentication

```
Authorization: Bearer <FIDDLER_GUARDRAILS_TOKEN>
Content-Type: application/json
```

**API Documentation**: https://docs.fiddler.ai/product-guide/llm-monitoring/guardrails

---

#### 1. Fast Safety Check (ftl-safety)

**Purpose**: Evaluates text safety across 11 dimensions to detect harmful, inappropriate, or malicious content

**Endpoint**: `POST /v3/guardrails/ftl-safety`

**Request Format**:

```json
{
    "data": {
        "input": "text to check"
    }
}
```

**Response Format**: Returns 11 safety dimension scores (floats 0.0-1.0)

```json
{
    "fdl_harmful": 0.119,
    "fdl_violent": 0.073,
    "fdl_unethical": 0.043,
    "fdl_illegal": 0.016,
    "fdl_sexual": 0.005,
    "fdl_racist": 0.003,
    "fdl_jailbreaking": 0.002,
    "fdl_harassing": 0.001,
    "fdl_hateful": 0.001,
    "fdl_sexist": 0.001,
    "fdl_roleplaying": 0.0
}
```

**Safety Dimensions** (11 total):

1. **fdl_harmful** - General harmful content
2. **fdl_violent** - Violent content or threats
3. **fdl_unethical** - Unethical behavior or advice
4. **fdl_illegal** - Illegal activities or instructions
5. **fdl_sexual** - Sexual or adult content
6. **fdl_racist** - Racist content or discrimination
7. **fdl_jailbreaking** - Attempts to bypass safety controls
8. **fdl_harassing** - Harassment or bullying
9. **fdl_hateful** - Hate speech
10. **fdl_sexist** - Sexist content or gender discrimination
11. **fdl_roleplaying** - Inappropriate roleplaying scenarios

**Evaluation Logic**:

-   **Fiddler Recommendation**: Threshold > 0.1 for detection
-   **Safe**: All scores ≤ threshold
-   **Unsafe**: Any score > threshold indicates violation
-   **Highest score**: Determines primary violation type

**Recommended Threshold**: 0.05-0.1 (configurable per dimension)

**Latency**: ~80-100ms per request

**Use Cases**:

-   Input validation (block unsafe user prompts)
-   Output validation (filter unsafe LLM responses)
-   Pre-deployment content screening

---

#### 2. Fast Faithfulness Check (ftl-response-faithfulness)

**Purpose**: Evaluates whether LLM response is faithful to provided context (hallucination detection for RAG)

**Endpoint**: `POST /v3/guardrails/ftl-response-faithfulness`

**Request Format**:

```json
{
    "data": {
        "response": "LLM-generated response text",
        "context": "Source documents or RAG context"
    }
}
```

**Response Format**: Single faithfulness score (float 0.0-1.0)

```json
{
    "fdl_faithful_score": 0.003
}
```

**Evaluation Logic**:

-   **Fiddler Recommendation**: Threshold < 0.005 for hallucination detection
-   **Faithful**: Score ≥ threshold (response aligns with context)
-   **Hallucination**: Score < threshold (response contradicts or invents information)
-   **Lower score = higher hallucination likelihood**

**Recommended Threshold**: 0.005-0.01 (configurable)

**Latency**: ~100-120ms per request

**Requirements**:

-   RAG chatflow with source documents
-   Context must be provided (extracted from `sourceDocuments`)
-   Minimum context length: ~50 characters recommended

**Use Cases**:

-   RAG response validation
-   Citation accuracy verification
-   Fact-checking LLM outputs against knowledge base

**Limitations**:

-   Only applicable to RAG chatflows (requires context)
-   Skipped if no `sourceDocuments` available
-   Cannot detect hallucinations in non-RAG completions

---

#### 3. PII Detection & Redaction (sensitive-information)

**Purpose**: Detects and optionally redacts personally identifiable information (PII) in text

**Endpoint**: `POST /v3/guardrails/sensitive-information`

**Request Format**:

```json
{
    "data": {
        "input": "text to scan for PII"
    }
}
```

**Response Format**: Array of detected PII entities with positions and confidence scores

```json
{
    "fdl_sensitive_information_scores": [
        {
            "score": 0.95,
            "label": "EMAIL",
            "start": 10,
            "end": 26,
            "text": "user@example.com"
        },
        {
            "score": 0.88,
            "label": "US_SOCIAL_SECURITY_NUMBER",
            "start": 45,
            "end": 56,
            "text": "123-45-6789"
        },
        {
            "score": 0.92,
            "label": "PHONE_NUMBER",
            "start": 70,
            "end": 82,
            "text": "555-123-4567"
        }
    ]
}
```

**Supported PII Types** (14+ entity labels):

-   **PERSON** - Full names
-   **EMAIL** - Email addresses
-   **PHONE_NUMBER** - Phone numbers (various formats)
-   **ADDRESS** - Physical addresses
-   **US_SOCIAL_SECURITY_NUMBER** - SSN (123-45-6789)
-   **CREDIT_CARD** - Credit/debit card numbers (13-16 digits)
-   **US_PASSPORT** - US passport numbers
-   **US_DRIVER_LICENSE** - Driver's license numbers
-   **US_BANK_NUMBER** - Bank account numbers
-   **CREDIT_CARD_EXPIRATION** - Expiration dates (MM/YY)
-   **PIN** - Four-digit PIN numbers
-   **IBAN_CODE** - International bank account numbers
-   **SWIFT_CODE** - SWIFT codes (8-11 characters)
-   **USERNAME** - Login/screen names
-   **AGE** - Age with units (e.g., "40 years old")

**Response Fields**:

-   **score**: Confidence level (0.0-1.0, typically >0.8 for valid detections)
-   **label**: PII type (see list above)
-   **start**: Character position where PII begins (0-indexed)
-   **end**: Character position where PII ends (exclusive)
-   **text**: Extracted PII text

**Evaluation Logic**:

-   **No PII**: Empty `fdl_sensitive_information_scores` array
-   **PII Present**: One or more entities with score > confidence threshold

**Redaction Algorithm**:

1. Sort entities by `start` position in **reverse order** (end → start)
2. For each entity: Replace `text[start:end]` with `[LABEL]` placeholder
3. Process in reverse to preserve earlier character positions

**Example Redaction**:

```
Input:  "Contact me at user@example.com or call 555-123-4567"
Output: "Contact me at [EMAIL] or call [PHONE_NUMBER]"
```

**Recommended Confidence Threshold**: 0.8 (filter out low-confidence detections)

**Latency**: ~80-100ms per request

**Use Cases**:

-   Input sanitization (redact PII before sending to LLM)
-   Output compliance (remove PII from responses)
-   Privacy protection for logging/analytics
-   GDPR/HIPAA compliance

**Actions**:

-   **Block**: Return error if PII detected
-   **Redact**: Replace detected PII with placeholders
-   **Warn**: Log detection but continue processing

---

### Performance Characteristics (All Endpoints)

**Concurrent Execution**: All checks support parallel execution via `Promise.all()`

**Total Latency** (parallel execution):

-   Input validation (Safety + PII): max(~80ms, ~80ms) ≈ 100ms
-   Output validation (Safety + PII + Faithfulness): max(~80ms, ~80ms, ~120ms) ≈ 120ms

**Caching**: SHA256-based Redis caching reduces repeat requests to <10ms

**Connection Pooling**: HTTP keep-alive reduces per-request overhead by 20-50ms

**Error Responses**: All endpoints return HTTP 4xx/5xx with JSON error messages

**Rate Limits**: Not documented (likely enforced at account level)

### AnswerAgent API Endpoints

#### Get Organization Config (Generic)

**Endpoint**: `GET /api/v1/organizations/:id/config`

**Authentication**: Organization member

**Response**: Complete organization configuration (JSON)

```json
{
  "guardrails": { ... },
  "analytics": { ... },
  // ... other settings
}
```

**Purpose**: Load all org settings in UI

#### Update Organization Config (Generic)

**Endpoint**: `PUT /api/v1/organizations/:id/config`

**Authentication**: Organization admin only

**Request Body**: Partial or complete organization configuration (JSON)

**Behavior**: Deep merge with existing configuration (partial updates supported)

**Response**: Updated complete configuration

**Purpose**: Save any org settings from admin UI

#### Get Organization Guardrails (Convenience Endpoint)

**Endpoint**: `GET /api/v1/organizations/:id/config/guardrails`

**Authentication**: Organization member

**Response**: Organization guardrails configuration only (JSON)

**Purpose**: Load guardrails settings without fetching entire config

#### Update Organization Guardrails (Convenience Endpoint)

**Endpoint**: `PUT /api/v1/organizations/:id/config/guardrails`

**Authentication**: Organization admin only

**Request Body**: Complete guardrails configuration (JSON)

**Validation**:

-   Schema validation (all fields correct types)
-   Threshold ranges (0.0 - 1.0)
-   Valid action values
-   Valid credential ID (if provided)

**Response**: Updated guardrails configuration

**Purpose**: Save guardrails settings from admin UI

**Implementation**: Internally updates `organizationConfig.guardrails` field

---

## Service Architecture

### TypeScript Type Definitions

**Location**: `packages/server/src/types/organization.ts`

**Main Interfaces**:

-   `OrganizationConfig` - Top-level container with `guardrails`, `analytics`, `branding`, `limits`, `notifications` (all optional)
-   `GuardrailsConfig` - Guardrails configuration (see "Guardrails Configuration Schema" above)
-   `AnalyticsConfig`, `BrandingConfig`, `UsageLimitsConfig`, `NotificationConfig` - Placeholder interfaces for future settings

**Benefits**:

-   Type-safe access to all organization settings
-   Easy to add new settings categories
-   Clear separation of concerns
-   Supports partial updates via TypeScript's `Partial<T>`

### File Structure

```
packages/server/src/types/
└── organization.ts                       # ~150 lines (type definitions with per-dimension/per-type interfaces)

packages/components/credentials/
└── FiddlerApi.credential.ts              # ~35 lines

packages/server/src/services/guardrails/
├── FiddlerGuardrailsService.ts           # ~400 lines (main service + per-dimension/per-type logic)
├── config.ts                             # ~150 lines (config loading + deep merge)
└── CircuitBreaker.ts                     # ~50 lines (reliability)

packages/server/src/database/entities/
└── Organization.ts                       # Add organizationConfig field + helper methods

packages/server/src/controllers/organizations/
├── config.ts                             # ~120 lines (generic config endpoints)
└── guardrails.ts                         # ~60 lines (guardrails convenience endpoints)

packages/server/src/services/organizations/
└── index.ts                              # Add config management methods + deep merge logic

packages/server/src/utils/
└── buildChatflow.ts                      # ~100 lines added (integration)
```

### FiddlerGuardrailsService

**Responsibilities**:

-   HTTP client management (axios with keep-alive, connection pooling)
-   API calls to Fiddler (safety, faithfulness, PII)
-   Redis caching (SHA256 keys, 1hr TTL)
-   Circuit breaker integration
-   Parallel execution via `Promise.all()`
-   **Per-dimension safety threshold evaluation** (11 dimensions)
-   **Per-type PII confidence filtering** (15+ types)
-   **Per-type PII action handling** (block/redact/warn by type)
-   PII redaction logic (replace entities with placeholders)
-   Error handling (fail-open/fail-closed)

**Key Methods**:

-   `evaluateSafety(text, config)` → safety scores + violation flag with per-dimension evaluation
-   `evaluateFaithfulness(response, context, config)` → faithfulness score + hallucination flag
-   `detectPII(text, config)` → detected entities + redacted text with per-type filtering
-   `validateInput(text, config)` → validation result (blocked, modified, violations)
-   `validateOutput(text, context, config)` → validation result

**Wrapper Method Signatures**:

```typescript
validateInput(text: string, config: GuardrailsConfig): Promise<ValidationResult>
validateOutput(text: string, context: string | null, config: GuardrailsConfig): Promise<ValidationResult>

interface ValidationResult {
  blocked: boolean
  modified: string | null
  violations: Violation[]
  action: 'block' | 'redact' | 'warn' | 'pass'
}
```

**Singleton Pattern**: Single instance per process, reused across requests

**Redis Connection Strategy**:

-   Redis client initialized in FiddlerGuardrailsService constructor
-   Load REDIS_URL environment variable
-   Connection pooling: max 10 connections
-   Fallback to no-cache mode if Redis unavailable (graceful degradation)
-   No error thrown on Redis connection failure

---

#### Safety Evaluation Processing Logic

**Method**: `evaluateSafety(text: string, config: SafetyConfig): SafetyResult`

**Input**:

-   `text`: Text to evaluate
-   `config`: { threshold: number, dimensionThresholds?: {...}, action: 'block' | 'warn' }

**Processing Steps**:

1. **Call Fiddler API** → Returns 11 dimension scores

    ```json
    {
      "fdl_harmful": 0.12,
      "fdl_violent": 0.05,
      "fdl_illegal": 0.03,
      ... (11 total)
    }
    ```

2. **Per-Dimension Threshold Evaluation**:

    ```typescript
    for each dimension in [fdl_harmful, fdl_violent, ..., fdl_roleplaying]:
      effectiveThreshold = config.dimensionThresholds?.[dimension] ?? config.threshold
      if (apiResponse[dimension] > effectiveThreshold):
        violations.push({
          dimension,
          score: apiResponse[dimension],
          threshold: effectiveThreshold,
          violated: true
        })
    ```

3. **Determine Overall Result**:

    - `isUnsafe = violations.length > 0` (ANY dimension exceeds its threshold)
    - `action = config.action` (block or warn)
    - `primaryViolation = violations with highest score`

4. **Return Result**:
    ```typescript
    {
      isUnsafe: boolean,
      action: 'block' | 'warn',
      violations: [{ dimension, score, threshold, violated }],
      primaryViolation: { dimension, score },
      allScores: { fdl_harmful: 0.12, ... }
    }
    ```

**Example Scenarios**:

**Scenario 1: Global threshold only**

```typescript
config = { threshold: 0.1, action: 'block' }
apiResponse = { fdl_harmful: 0.12, fdl_illegal: 0.05, ... }
// Result: UNSAFE (fdl_harmful 0.12 > 0.1)
```

**Scenario 2: Per-dimension overrides**

```typescript
config = {
    threshold: 0.1,
    dimensionThresholds: { fdl_illegal: 0.02, fdl_roleplaying: 0.5 },
    action: 'block'
}
apiResponse = { fdl_harmful: 0.08, fdl_illegal: 0.03, fdl_roleplaying: 0.4 }
// Evaluation:
// - fdl_harmful: 0.08 > 0.1? NO (uses global)
// - fdl_illegal: 0.03 > 0.02? YES (uses override) → VIOLATION
// - fdl_roleplaying: 0.4 > 0.5? NO (uses override)
// Result: UNSAFE (fdl_illegal violated)
```

---

#### PII Detection Processing Logic

**Method**: `detectPII(text: string, config: PIIConfig): PIIResult`

**Input**:

-   `text`: Text to scan
-   `config`: {
    confidenceThreshold: number,
    typeConfidenceThresholds?: {...},
    action: 'block' | 'redact' | 'warn',
    typeActions?: {...}
    }

**Processing Steps**:

1. **Call Fiddler API** → Returns detected entities

    ```json
    {
        "fdl_sensitive_information_scores": [
            { "label": "US_SOCIAL_SECURITY_NUMBER", "score": 0.75, "start": 10, "end": 21, "text": "123-45-6789" },
            { "label": "EMAIL", "score": 0.92, "start": 35, "end": 51, "text": "user@example.com" },
            { "label": "USERNAME", "score": 0.65, "start": 60, "end": 67, "text": "john123" }
        ]
    }
    ```

2. **Per-Type Confidence Filtering**:

    ```typescript
    for each entity in apiResponse.fdl_sensitive_information_scores:
      effectiveConfidenceThreshold =
        config.typeConfidenceThresholds?.[entity.label] ?? config.confidenceThreshold

      if (entity.score >= effectiveConfidenceThreshold):
        filteredEntities.push(entity)
      else:
        // Entity filtered out (confidence too low)
        continue
    ```

3. **Per-Type Action Determination**:

    ```typescript
    for each entity in filteredEntities:
      effectiveAction = config.typeActions?.[entity.label] ?? config.action

      processedEntities.push({
        ...entity,
        action: effectiveAction  // 'block', 'redact', or 'warn'
      })
    ```

4. **Action Execution**:

    - **If ANY entity has action='block'**: Return blocked result (stop processing)
    - **For entities with action='redact'**: Replace text with `[LABEL]` placeholder
    - **For entities with action='warn'**: Log but keep original text

5. **Redaction Algorithm** (for action='redact'):

    ```typescript
    // Sort entities by position (reverse order to preserve indices)
    sortedEntities = processedEntities
      .filter(e => e.action === 'redact')
      .sort((a, b) => b.start - a.start)

    redactedText = text
    for each entity in sortedEntities:
      redactedText = redactedText.slice(0, entity.start) +
                     `[${entity.label}]` +
                     redactedText.slice(entity.end)
    ```

6. **Return Result**:
    ```typescript
    {
      hasPII: boolean,
      blockedByPII: boolean,
      detectedEntities: [{ label, score, action, text, start, end }],
      redactedText: string | null,
      warnings: [{ label, score, text }]
    }
    ```

**Example Scenarios**:

**Scenario 1: Global confidence and action only**

```typescript
config = { confidenceThreshold: 0.8, action: 'redact' }
apiResponse = [
    { label: 'EMAIL', score: 0.92, text: 'user@example.com' },
    { label: 'USERNAME', score: 0.65, text: 'john123' }
]
// Filtering:
// - EMAIL: 0.92 >= 0.8 → INCLUDED, action: redact
// - USERNAME: 0.65 < 0.8 → FILTERED OUT
// Result: Redacts email only
```

**Scenario 2: Per-type confidence and action overrides**

```typescript
config = {
    confidenceThreshold: 0.8,
    typeConfidenceThresholds: {
        US_SOCIAL_SECURITY_NUMBER: 0.7,
        USERNAME: 0.9
    },
    action: 'redact',
    typeActions: {
        US_SOCIAL_SECURITY_NUMBER: 'block',
        USERNAME: 'warn'
    }
}
apiResponse = [
    { label: 'US_SOCIAL_SECURITY_NUMBER', score: 0.75, text: '123-45-6789' },
    { label: 'EMAIL', score: 0.85, text: 'user@example.com' },
    { label: 'USERNAME', score: 0.88, text: 'john123' }
]
// Processing:
// 1. Confidence filtering:
//    - SSN: 0.75 >= 0.7 (override) → INCLUDED
//    - EMAIL: 0.85 >= 0.8 (global) → INCLUDED
//    - USERNAME: 0.88 < 0.9 (override) → FILTERED OUT
// 2. Action determination:
//    - SSN: action='block' (override)
//    - EMAIL: action='redact' (global)
// 3. Result: BLOCKED (SSN detected with action='block')
```

**Scenario 3: Mixed actions**

```typescript
config = {
    confidenceThreshold: 0.8,
    action: 'redact',
    typeActions: {
        EMAIL: 'redact',
        PHONE_NUMBER: 'redact',
        USERNAME: 'warn'
    }
}
apiResponse = [
    { label: 'EMAIL', score: 0.92, start: 0, end: 16, text: 'user@example.com' },
    { label: 'PHONE_NUMBER', score: 0.88, start: 20, end: 32, text: '555-123-4567' },
    { label: 'USERNAME', score: 0.85, start: 40, end: 47, text: 'john123' }
]
// Processing:
// - All pass confidence threshold (0.92, 0.88, 0.85 >= 0.8)
// - Actions: EMAIL=redact, PHONE=redact, USERNAME=warn
// - Redaction: Replace EMAIL and PHONE, keep USERNAME
// - Warning: Log USERNAME detection
// Result:
//   redactedText: "[EMAIL] at [PHONE_NUMBER] with john123"
//   warnings: [{ label: "USERNAME", score: 0.85, text: "john123" }]
```

### Organization Service (Config Management)

**Location**: `packages/server/src/services/organizations/index.ts`

**Responsibilities**:

-   Generic CRUD operations for organization configuration
-   Type-safe accessors for specific config sections (guardrails, analytics, etc.)
-   Deep merge support for partial updates
-   Validation before saving

**Key Methods**:

-   `getConfig(orgId)` - Get full organization config
-   `updateConfig(orgId, config)` - Update config with deep merge
-   `getGuardrailsConfig(orgId)` - Get guardrails section only
-   `updateGuardrailsConfig(orgId, guardrails)` - Update guardrails section only
-   Future: Similar methods for analytics, branding, limits, notifications

### Config Module (Guardrails)

**Responsibilities**:

-   Load environment variables
-   Load organization credential (Flowise system or env var fallback)
-   Load organization settings from `organizationConfig.guardrails` (TypeORM query)
-   Load chatflow settings (JSON parse from chatbotConfig)
-   Merge configuration with precedence rules
-   Return complete GuardrailConfig object

**Key Functions**:

-   `getGuardrailConfig(chatflow, orgId, options)` → merged configuration
-   `isGuardrailsEnabled(chatflow, orgId)` → boolean check
-   `parseChatflowGuardrailsConfig(chatflow)` → GuardrailsConfig | null

**Config Loading Process**:

1. Load environment defaults
2. Load organization settings from `organizationConfig.guardrails`
3. Load chatflow overrides from `chatbotConfig.guardrails`
4. Deep merge with precedence: chatflow > org > env

**ChatFlow Config Parsing**:

-   Parse `chatflow.chatbotConfig` JSON field
-   Extract `.guardrails` nested property
-   Handle null/undefined/malformed JSON gracefully
-   Return null if missing or invalid

**Caching**: Configuration loaded per-request with optional Redis cache (5-minute TTL) for high-traffic scenarios

### CircuitBreaker

**Responsibilities**:

-   Track API failure rate
-   Open circuit after sustained failures
-   Half-open state for recovery testing
-   Close circuit after successful recovery

**States**:

-   **Closed**: Normal operation, all requests pass through
-   **Open**: All requests fail immediately (no API calls)
-   **Half-Open**: Test requests allowed, transition to closed/open based on results

**Configuration**:

-   Failure threshold: 5 consecutive failures
-   Timeout: 60 seconds
-   Recovery threshold: 3 consecutive successes

**Purpose**: Prevent cascading failures, reduce load on failing API, fast recovery

---

## Integration Points

### Location: buildChatflow.ts

The integration wraps existing prediction logic without modifying core execution flow.

#### Integration Point 1: Input Validation

**Location**: Line ~262 (after `question` variable is set, before `utilBuildChatflow()`)

**Trigger**: User request arrives with question/input text

**Process**:

1. Check if guardrails enabled
2. Load configuration (org credential + settings)
3. Initialize service
4. Run enabled input checks in parallel
5. Evaluate results:
    - Blocked → Throw 400 error with violation message
    - Redacted → Modify `question` variable with redacted text
    - Warning → Log violation, continue normally

**Error Handling**:

-   API errors respect `failOpen` setting
-   Fail-open: Log error, continue to LLM
-   Fail-closed: Throw 500 error, block request

**Latency Impact**: ~100-150ms (parallel execution), ~5ms (cache hit)

#### Integration Point 2: Output Validation

**Location**: Line ~743 (after `result.text` is set, inside post-processing block)

**Trigger**: LLM generates response

**Process**:

1. Check if guardrails enabled
2. Load configuration (cached from input check)
3. Extract RAG context from `result.sourceDocuments` (if available)
4. Run enabled output checks in parallel
5. Evaluate results:
    - Blocked → Replace `result.text` with `blockMessage`
    - Redacted → Replace `result.text` with redacted version
    - Warning → Log violation, keep original text

**Error Handling**:

-   ALWAYS fail-open (never throw error for output)
-   Log all errors
-   Return original text if checks fail

**Latency Impact**: ~120ms (parallel execution, faithfulness adds ~20ms)

**Special Case: RAG Context**:

-   If `result.sourceDocuments` exists, parse JSON to extract document text
-   Concatenate all document `pageContent` fields with `\n\n` separator
-   Pass concatenated text as `context` to faithfulness check
-   If parsing fails, log error and skip faithfulness check

---

## Performance Optimization

### Target Metrics

| Scenario                                  | Latency (no cache) | Latency (cache hit) | Cache Hit Rate |
| ----------------------------------------- | ------------------ | ------------------- | -------------- |
| Input only (Safety + PII)                 | 100ms (p95)        | 5ms                 | 85%+           |
| Output only (Safety + PII + Faithfulness) | 120ms (p95)        | 5ms                 | 85%+           |
| Both input + output                       | 150ms (p95)        | 10ms                | 85%+           |

### Optimization Techniques

#### 1. Parallel Execution

**Problem**: Sequential checks add latency (Safety 100ms + PII 100ms + Faithfulness 100ms = 300ms)

**Solution**: Run all enabled checks concurrently via `Promise.all()`

**Result**: Total latency = max(check latencies) ≈ 120ms (not sum)

**Implementation**: Collect promises for enabled checks, execute with `Promise.all()`, process results

#### 2. Redis Caching

**Problem**: Same inputs checked repeatedly (e.g., common questions, templated responses)

**Solution**: Cache results with SHA256 hash as key, 1-hour TTL

**Result**: 90% cache hit rate after warmup, <10ms latency on hit

**Cache Keys**:

-   Safety: `guardrail:safety:sha256(text)`
-   Faithfulness: `guardrail:faithfulness:sha256(response+context)`
-   PII: `guardrail:pii:sha256(text)`

**Cache Invalidation**: Time-based (1 hour TTL), no manual invalidation needed

#### 3. HTTP Connection Pooling

**Problem**: New TCP connection per request adds 20-50ms latency

**Solution**: HTTP keep-alive with connection pool (max 50 sockets)

**Result**: Connection reuse reduces per-request latency by 20-50ms

**Implementation**: Configure axios with `http.Agent` and `https.Agent` with `keepAlive: true`

#### 4. Circuit Breaker

**Problem**: Failed API calls wait for timeout (3s) before failing

**Solution**: Circuit breaker opens after 5 failures, fails immediately (<1ms)

**Result**: Fast failure during API outages, prevents cascading failures

**Recovery**: Half-open after 60s, closes after 3 successful requests

#### 5. Selective Execution

**Problem**: Running unnecessary checks wastes time

**Solution**: Only run checks that are enabled in configuration

**Result**: Skipped checks add 0ms latency

**Implementation**: Build promise array only for enabled checks

### Latency Breakdown

**Input Validation (100ms total)**:

-   Config loading: 5ms (TypeORM queries, can be optimized with caching)
-   Safety check: 80ms (Fiddler API)
-   PII check: 80ms (Fiddler API, parallel with safety)
-   Result processing: 5ms

**Output Validation (120ms total)**:

-   Config loading: 0ms (reused from input)
-   RAG context extraction: 5ms
-   Safety check: 80ms (Fiddler API)
-   PII check: 80ms (Fiddler API, parallel)
-   Faithfulness check: 100ms (Fiddler API, parallel)
-   Result processing: 5ms

**Cached Request (<10ms)**:

-   Config loading: 5ms
-   Redis lookup: 2ms (all checks)
-   Result processing: 2ms

---

## UI Components

### UX Strategy: Progressive Disclosure

To manage the complexity of per-dimension safety thresholds and per-type PII actions while maintaining excellent UX, we use **progressive disclosure** with three UI modes:

1. **Simple Mode** (default): Preset templates + global controls only
2. **Advanced Mode**: Full access to per-dimension/per-type controls
3. **Custom Mode**: JSON editor for power users

### Organization Settings Page

**Route**: `/settings/organization/guardrails`

**Access**: Organization admins only

**Purpose**: Configure organization-wide guardrail defaults

---

#### Page Header

-   **Title**: "Guardrails Configuration"
-   **Subtitle**: "Control content safety, PII detection, and hallucination prevention for your organization"
-   **Mode Selector** (tabs):
    -   "Simple" (default)
    -   "Advanced"
    -   "Custom (JSON)"

---

#### Mode 1: Simple Mode (Default)

**Design Philosophy**: 80% of users need 20% of features. Provide preset templates + minimal configuration.

**UI Sections**:

**1. Master Switch & Credential**:

-   Toggle: "Enable Guardrails"
-   Credential dropdown: "Fiddler API Credential"
-   Button: "Create Credential" → opens credential creation modal
-   Help text: "Guardrails protect your chatflows from unsafe content, PII leaks, and hallucinations"

**2. Configuration Presets** (select one):

-   Radio buttons with descriptions:
    -   **"Strict (Recommended for External Bots)"**
        -   Blocks unsafe content (threshold: 0.05)
        -   Redacts all PII (confidence: 0.8)
        -   Detects hallucinations (threshold: 0.005)
        -   Fail-closed mode
    -   **"Balanced (General Purpose)"**
        -   Blocks unsafe content (threshold: 0.1)
        -   Redacts PII (confidence: 0.8)
        -   Detects hallucinations (threshold: 0.005)
        -   Fail-open mode
    -   **"Lenient (Internal Tools)"**
        -   Warns on unsafe content (threshold: 0.15)
        -   Warns on PII (confidence: 0.85)
        -   No hallucination detection
        -   Fail-open mode
    -   **"Financial Services (HIPAA/PCI Compliant)"**
        -   Very strict safety (illegal: 0.02, harmful: 0.05)
        -   Blocks financial PII (SSN, credit cards)
        -   Redacts contact info (email, phone, address)
        -   Detects hallucinations
        -   Fail-closed mode
    -   **"Healthcare (HIPAA Compliant)"**
        -   Strict safety (illegal: 0.05, harmful: 0.08)
        -   Blocks/redacts PHI
        -   Lower confidence thresholds (0.7-0.75)
        -   Detects hallucinations
        -   Fail-closed mode
    -   **"Community Moderation"**
        -   Very strict on hate/harassment (0.05-0.08)
        -   Lenient on roleplaying (0.4)
        -   Redacts contact PII only
        -   No hallucination detection
        -   Fail-open mode
    -   **"Custom"** → Switches to Advanced Mode

**Preset Templates Storage**:

-   Stored as TypeScript constants in `packages/ui/src/views/organizations/guardrails/presets.ts`
-   Exported as PRESET_TEMPLATES object
-   5 configurations: Strict, Financial, Healthcare, Community, Internal

**3. Quick Overrides** (optional, below preset):

-   Expandable section: "Customize This Preset"
-   When expanded, shows:
    -   Slider: "Overall Strictness" (-2 to +2, affects all thresholds proportionally)
        -   -2: Very Lenient (-50% to thresholds)
        -   -1: Lenient (-25%)
        -   0: Preset Default
        -   +1: Strict (+25%)
        -   +2: Very Strict (+50%)
    -   Toggle: "Enable Faithfulness Check" (for RAG chatflows)
    -   Toggle: "Fail-Closed Mode" (block on API errors)
    -   Text input: "Custom Block Message"

**4. Actions**:

-   Button: "Save Configuration" (primary)
-   Button: "Test with Sample Text" (secondary) → opens test modal
-   Link: "Need more control? Switch to Advanced Mode" → changes to Advanced Mode

---

#### Mode 2: Advanced Mode

**Design Philosophy**: Power users need granular control. Show all options with smart grouping and inline recommendations.

**UI Sections**:

**1. Master Switch & Credential** (same as Simple Mode)

**2. Input Validation** (collapsible section, expanded by default):

**2a. Safety Check**:

-   Toggle: "Enable Safety Check"
-   **View toggle**: "Simple" | "Per-Dimension"

**Simple View**:

-   Slider: "Global Threshold" (0.0-1.0, step 0.01, default: 0.1)
-   Inline recommendation: "Fiddler recommends > 0.1"
-   Dropdown: "Action" (Block, Warn)

**Per-Dimension View** (table layout):
| Dimension | Override Threshold | Status |
|-----------|-------------------|--------|
| Harmful | [slider] or "Use Global (0.1)" | ✓ Custom / → Inherited |
| Violent | [slider] or "Use Global (0.1)" | → Inherited |
| Unethical | [slider] or "Use Global (0.1)" | → Inherited |
| Illegal | [slider] or "Use Global (0.1)" | → Inherited |
| Sexual | [slider] or "Use Global (0.1)" | → Inherited |
| Racist | [slider] or "Use Global (0.1)" | → Inherited |
| Jailbreaking | [slider] or "Use Global (0.1)" | → Inherited |
| Harassing | [slider] or "Use Global (0.1)" | → Inherited |
| Hateful | [slider] or "Use Global (0.1)" | → Inherited |
| Sexist | [slider] or "Use Global (0.1)" | → Inherited |
| Roleplaying | [slider] or "Use Global (0.1)" | → Inherited |

-   Bulk actions: "Set All to Strict (0.05)" | "Set All to Lenient (0.2)" | "Reset All"
-   Inline recommendations for common overrides:
    -   "💡 Financial/Healthcare: Set Illegal to 0.02-0.05"
    -   "💡 Community Moderation: Set Hate/Harassment to 0.05-0.08"
    -   "💡 Gaming/Creative: Set Roleplaying to 0.3-0.5"

**2b. PII Detection**:

-   Toggle: "Enable PII Detection"
-   **View toggle**: "Simple" | "Per-Type"

**Simple View**:

-   Slider: "Global Confidence Threshold" (0.0-1.0, step 0.01, default: 0.8)
-   Inline recommendation: "Fiddler recommends 0.8"
-   Dropdown: "Global Action" (Block, Redact, Warn)

**Per-Type View** (table layout):
| PII Type | Confidence Override | Action Override | Status |
|----------|---------------------|-----------------|--------|
| SSN | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| Credit Card | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| Email | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| Phone Number | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| Person Name | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| Address | [slider] or "Use Global (0.8)" | [dropdown] or "Use Global (Redact)" | → Inherited |
| ... (15 types total) | | | |

-   Bulk actions:
    -   "Block All Financial" (SSN, Credit Card, Bank Number, PIN)
    -   "Redact All Contact" (Email, Phone, Address)
    -   "Warn All Non-Sensitive" (Username, Age)
    -   "Reset All"
-   Inline recommendations:
    -   "💡 Financial: Block SSN, Credit Cards, Bank Numbers"
    -   "💡 Healthcare: Block SSN, Redact Address/Phone/Email"
    -   "💡 Community: Redact Email/Phone/Address, Warn Username"

**3. Output Validation** (collapsible section):

-   Same structure as Input Validation
-   Additional subsection:

**3a. Faithfulness Check**:

-   Toggle: "Enable Faithfulness Check"
-   Slider: "Threshold" (0.0-1.0, step 0.01, default: 0.005)
-   Inline recommendation: "Fiddler recommends < 0.005. Lower score = hallucination."
-   Dropdown: "Action" (Block, Warn)
-   Help text: "Only applies to RAG chatflows with source documents"

**4. Advanced Settings** (collapsible section, collapsed by default):

-   Number input: "Timeout (ms)" (default: 3000)
-   Number input: "Retry Attempts" (default: 1)
-   Toggle: "Fail Open" (default: true)
-   Help text: "When enabled, predictions continue if guardrails API fails"
-   Text area: "Custom Block Message"
-   Help text: "Message shown when content is blocked"

**5. Actions**:

-   Button: "Save Configuration" (primary)
-   Button: "Test Configuration" (secondary) → opens test modal
-   Button: "Export as Preset" (secondary) → saves current config as reusable template
-   Link: "Prefer presets? Switch to Simple Mode"

---

### Validation & User Feedback

**Real-time Validation**:

-   Thresholds out of range (0.0-1.0): Red outline + error message
-   No checks enabled: Warning banner "At least one check must be enabled"
-   Unusual values: Yellow warning icon with tooltip
    -   Safety < 0.05 or > 0.2: "⚠️ Unusual threshold. Typical range: 0.05-0.2"
    -   PII confidence < 0.7: "⚠️ Low confidence may cause false positives"

**API Calls**:

-   Load: `GET /api/v1/organizations/:id/config/guardrails`
-   Save: `PUT /api/v1/organizations/:id/config/guardrails`
-   Credentials: `GET /api/v1/credentials?credentialName=fiddlerApi`
-   Test: `POST /api/v1/organizations/:id/guardrails/test` (with sample text)

### Chatflow Settings Component

**Location**: Embedded in chatflow configuration modal/page

**Access**: Chatflow editors

**Purpose**: Override organization guardrail settings for specific chatflow

---

#### Simplified Chatflow UI

**Design Philosophy**: Most chatflows inherit org settings. Provide quick overrides only.

**UI Sections**:

**1. Inheritance Status** (default view):

-   Info banner: "✓ Using organization guardrails settings"
-   Button: "Customize for This Chatflow" → expands override section
-   Read-only summary of inherited settings:
    -   Safety: Enabled (threshold: 0.1)
    -   PII: Enabled (redact, confidence: 0.8)
    -   Faithfulness: Enabled (threshold: 0.005)
    -   Fail Mode: Open

**2. Override Section** (when "Customize" clicked):

-   Same **3-mode UI** as organization settings (Simple/Advanced/Custom)
-   But defaults to "Simple" mode with preset: **"Inherit Organization Settings (with overrides)"**
-   All controls show inheritance status with "← Inherited" badge
-   Visual indicators:
    -   Gray text/controls = inherited from org
    -   Black text/controls = custom override
-   Quick reset: "⟲ Revert to Organization Default" per-setting

**3. Common Override Scenarios** (Simple Mode presets):

-   "Stricter Than Organization" (+25% to all thresholds)
-   "More Lenient Than Organization" (-25% to all thresholds)
-   "Disable PII Detection" (override: PII disabled)
-   "Disable Faithfulness" (override: Faithfulness disabled)
-   "Full Custom" → switches to Advanced Mode

**4. Actions**:

-   Button: "Save" (primary)
-   Button: "Reset to Organization Defaults" (secondary, clears all overrides)

**Storage**:

-   Saved to `ChatFlow.chatbotConfig.guardrails`
-   Only overridden fields saved (sparse storage)
-   Null/undefined fields inherit from organization

**API Calls**:

-   Load chatflow: `GET /api/v1/chatflows/:id` (includes `chatbotConfig.guardrails`)
-   Load org settings: `GET /api/v1/organizations/:orgId/config/guardrails` (for inheritance display)
-   Save: `PUT /api/v1/chatflows/:id` (updates `chatbotConfig.guardrails` only)

---

## Acceptance Criteria

### Backend Functionality

-   [ ] Fiddler credential type (`fiddlerApi`) appears in credential list UI
-   [ ] Organization guardrails config saved to `Organization.organizationConfig.guardrails` (TypeORM)
-   [ ] Chatflow guardrails config saved to `ChatFlow.chatbotConfig.guardrails` (TypeORM)
-   [ ] Configuration hierarchy works: chatflow overrides org overrides env
-   [ ] Credential loaded from organization (Flowise system) or env var fallback
-   [ ] Input validation blocks unsafe content (400 error returned to user)
-   [ ] Input validation redacts PII when action="redact"
-   [ ] Output validation replaces unsafe content with block message
-   [ ] Output validation redacts PII when action="redact"
-   [ ] Faithfulness check works for RAG chatflows (requires source documents)
-   [ ] Faithfulness check skipped when no RAG context available
-   [ ] Parallel execution: all enabled checks run concurrently
-   [ ] Redis caching: cache hit returns result in <10ms
-   [ ] Circuit breaker: opens after 5 failures, closes after 3 successes
-   [ ] Fail-open: Input validation continues on API error when configured
-   [ ] Fail-closed: Input validation blocks on API error when configured
-   [ ] Output validation ALWAYS fails open (never throws error)
-   [ ] Error handling: All errors use InternalFlowiseError
-   [ ] Logging: All violations logged with type and action taken

### Configuration Management

-   [ ] Environment variables documented in `.env.template`
-   [ ] Organization config API endpoints work (GET/PUT)
-   [ ] Organization config requires admin permission
-   [ ] Chatflow config saved with other chatflow settings
-   [ ] Default configuration: disabled, fail-open, sensible thresholds
-   [ ] Configuration changes take effect immediately (no caching)
-   [ ] Missing credential falls back to env var gracefully
-   [ ] Invalid credential ID returns clear error message

### UI Functionality

-   [ ] Organization settings page loads current configuration
-   [ ] Organization settings page requires admin access (403 for non-admins)
-   [ ] Credential selector lists all Fiddler credentials
-   [ ] Credential selector allows creating new credential
-   [ ] All toggles, sliders, and dropdowns work correctly
-   [ ] "Save Changes" button persists configuration to database
-   [ ] "Reset to Defaults" button restores default values
-   [ ] Validation errors shown for invalid inputs
-   [ ] Chatflow settings component shows inheritance status
-   [ ] Chatflow settings "Override" toggle works correctly
-   [ ] Chatflow settings shows which fields are inherited vs custom
-   [ ] Chatflow settings saves only overridden fields (not inherited)

---

## Success Criteria

### Functionality

-   [ ] 100% of unsafe inputs blocked in test scenarios (no false negatives)
-   [ ] PII redaction: Zero false positives in 100 test cases
-   [ ] Faithfulness check detects all hallucinations in RAG test cases
-   [ ] Configuration changes apply immediately (within 1 request)
-   [ ] Zero unhandled errors in guardrails code

### Usability

-   [ ] Admin can configure organization settings in <5 minutes
-   [ ] Chatflow editor can configure overrides in <2 minutes
-   [ ] Documentation complete and accurate
-   [ ] Stakeholder demo successful (show blocking, redaction, faithfulness)

---

## Implementation Phases

### Phase 1: Core Service

**Effort**: Medium-High (4/5) ⬆️ _Increased for per-dimension/per-type logic_
**Complexity**: High (4/5) _Same - already accounting for complex configuration_

**Deliverables**:

-   CircuitBreaker class (50 lines)
-   FiddlerGuardrailsService (400 lines) _+100 lines for per-dimension/per-type processing_
-   Config utilities (150 lines) _+50 lines for advanced config merging_
-   TypeScript type definitions (100 lines) _Per-dimension/per-type interfaces_
-   Unit tests (>80% coverage, including per-dimension/per-type scenarios)

**Key Features**:

-   Per-dimension safety threshold evaluation (11 dimensions)
-   Per-type PII confidence threshold filtering (15+ types)
-   Per-type PII action handling (block/redact/warn by type)
-   Fallback logic (specific override → global threshold)
-   Deep merge for configuration hierarchy

**Files**:

-   `packages/server/src/types/organization.ts` (type definitions)
-   `packages/server/src/services/guardrails/CircuitBreaker.ts`
-   `packages/server/src/services/guardrails/FiddlerGuardrailsService.ts`
-   `packages/server/src/services/guardrails/config.ts`
-   Test files (expanded for per-dimension/per-type tests)

**Verification**:

-   All unit tests pass (including per-dimension/per-type scenarios)
-   Service can call Fiddler API
-   Configuration merging works with deep override logic
-   Per-dimension thresholds correctly override global
-   Per-type PII actions/thresholds correctly override global

### Phase 2: Integration

**Effort**: Small-Medium (2/5)
**Complexity**: Medium (3/5)

**Deliverables**:

-   buildChatflow.ts modifications (~100 lines)
-   Integration tests
-   Manual testing with real API

**Files**:

-   `packages/server/src/utils/buildChatflow.ts`
-   `packages/server/test/api/predictions/guardrails.test.ts`

**Verification**:

-   Input validation blocks unsafe content
-   Output validation modifies unsafe content
-   Integration tests pass

### Phase 3: Backend API

**Effort**: Small-Medium (2/5)
**Complexity**: Low-Medium (2/5)

**Deliverables**:

-   Organization entity update (add `organizationConfig` field + helper methods)
-   Database migration
-   API endpoints (generic config + guardrails convenience endpoints)
-   Service layer methods (config management)
-   Controller tests

**Files**:

-   `packages/server/src/database/entities/Organization.ts`
-   `packages/server/src/database/migrations/XXX_add_organization_config.ts`
-   `packages/server/src/controllers/organizations/config.ts`
-   `packages/server/src/controllers/organizations/guardrails.ts`
-   `packages/server/src/services/organizations/index.ts`
-   `packages/server/src/routes/organizations/index.ts`

**Verification**:

-   Migration applies cleanly
-   API endpoints work
-   Admin-only access enforced

### Phase 4: UI

**Effort**: Medium-High (4/5) ⬆️ _Increased for 3-mode UI system_
**Complexity**: Medium-High (4/5) ⬆️ _Increased for progressive disclosure & presets_

**Deliverables**:

-   Organization settings page with 3 modes (Simple/Advanced/Custom)
    -   Simple Mode: 6 preset templates + quick overrides
    -   Advanced Mode: Per-dimension/per-type table views with bulk actions
    -   Custom Mode: JSON editor with validation
-   Chatflow settings component (simplified with inheritance indicators)
-   Credential selector integration
-   Preset template system
-   Real-time validation & inline recommendations

**Key Features**:

-   Progressive disclosure (Simple → Advanced → Custom)
-   Configuration presets (Strict, Balanced, Financial, Healthcare, Community)
-   Per-dimension safety table (11 rows) with bulk actions
-   Per-type PII table (15+ rows) with bulk actions & dual overrides
-   Inheritance visualization (gray vs black text, badges)
-   JSON editor with syntax highlighting and schema validation
-   Inline recommendations based on use case
-   Test modal for sample text validation

**Files**:

-   `apps/web/app/(Main UI)/settings/organization/guardrails/page.tsx` (main page with mode switching)
-   `apps/web/app/(Main UI)/settings/organization/guardrails/components/SimpleMode.tsx`
-   `apps/web/app/(Main UI)/settings/organization/guardrails/components/AdvancedMode.tsx`
-   `apps/web/app/(Main UI)/settings/organization/guardrails/components/CustomMode.tsx`
-   `apps/web/app/(Main UI)/settings/organization/guardrails/components/SafetyTable.tsx` (per-dimension view)
-   `apps/web/app/(Main UI)/settings/organization/guardrails/components/PIITable.tsx` (per-type view)
-   `apps/web/app/(Main UI)/settings/organization/guardrails/presets.ts` (preset definitions)
-   `packages/ui/src/views/chatflows/GuardrailsSettings.tsx` (chatflow overrides)

**Verification**:

-   All 3 modes functional
-   Mode switching preserves configuration
-   Presets load correctly and apply expected values
-   Per-dimension table allows overrides and shows inheritance
-   Per-type PII table handles dual overrides (confidence + action)
-   Bulk actions work correctly
-   Chatflow overrides show inheritance status
-   JSON mode validates configuration
-   Real-time validation catches errors
-   Test modal validates sample text successfully

## Related Documents

-   **PRD**: `.claude/plans/Fiddler Guardrails Prd.docx.md`
-   **Linear Ticket**: AGENT-139
-   **Environment Template**: `.env.template` (to be updated)
-   **CLAUDE.md**: Root-level architecture documentation (to be updated)
