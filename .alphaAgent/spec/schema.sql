-- ==============================================
-- TheAnswer Database Schema (PostgreSQL)
-- Generated: 2025-01-22
-- Source: TypeORM entities + Prisma schema
-- ==============================================

-- ============================================
-- ENTERPRISE ENTITIES (TypeORM)
-- ============================================

-- Table: user
-- Purpose: Core user entity with Auth0 integration
-- Multi-tenancy: Supports organization membership
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    credential TEXT,
    "tempToken" TEXT UNIQUE,
    "tokenExpiry" TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'unverified',
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL REFERENCES "user"(id),
    "updatedBy" UUID NOT NULL REFERENCES "user"(id),
    "auth0Id" VARCHAR UNIQUE,
    "stripeCustomerId" VARCHAR,
    "organizationId" UUID,
    "trialPlanId" UUID,
    "defaultChatflowId" UUID,
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'invited', 'unverified', 'deleted'))
);

CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_organizationId ON "user"("organizationId");
CREATE INDEX idx_user_auth0Id ON "user"("auth0Id");

-- Table: organization
-- Purpose: Organization/workspace entity with billing integration
-- Multi-tenancy: Root of organization hierarchy
CREATE TABLE "organization" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'Default Organization',
    "customerId" VARCHAR(100),
    "subscriptionId" VARCHAR(100),
    "auth0Id" VARCHAR,
    "organizationConfig" JSONB,
    "currentPaidPlanId" UUID,
    "billingPoolEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "stripeCustomerId" VARCHAR,
    "enabledIntegrations" JSONB,
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL REFERENCES "user"(id),
    "updatedBy" UUID NOT NULL REFERENCES "user"(id)
);

CREATE INDEX idx_organization_auth0Id ON "organization"("auth0Id");

-- ============================================
-- FLOWISE CORE ENTITIES (TypeORM)
-- ============================================

-- Table: chatflow
-- Purpose: Chatflow/workflow definitions
-- Multi-tenancy: Filtered by organizationId and userId
CREATE TABLE "chatflow" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    "flowData" TEXT NOT NULL,
    deployed BOOLEAN,
    "isPublic" BOOLEAN,
    apikeyid VARCHAR,
    "chatbotConfig" TEXT,
    visibility TEXT[], -- ARRAY of 'Private', 'Public', 'Organization', 'AnswerAI', 'Marketplace'
    "answersConfig" TEXT,
    "apiConfig" TEXT,
    analytic TEXT,
    "speechToText" TEXT,
    "textToSpeech" TEXT,
    "followUpPrompts" TEXT,
    category VARCHAR,
    type VARCHAR(20) NOT NULL DEFAULT 'CHATFLOW',
    "browserExtConfig" JSONB,
    "parentChatflowId" TEXT,
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedDate" TIMESTAMP,
    "templateId" UUID,
    "currentVersion" INTEGER DEFAULT 1,
    "s3Location" TEXT,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT chk_chatflow_type CHECK (type IN ('CHATFLOW', 'AGENTFLOW', 'MULTIAGENT', 'ASSISTANT'))
);

CREATE INDEX idx_chatflow_userId ON "chatflow"("userId");
CREATE INDEX idx_chatflow_organizationId ON "chatflow"("organizationId");
CREATE INDEX idx_chatflow_parentChatflowId ON "chatflow"("parentChatflowId");
CREATE INDEX idx_chatflow_templateId ON "chatflow"("templateId");

-- Table: chat_message
-- Purpose: Messages within chatflows
-- Multi-tenancy: Filtered by organizationId
CREATE TABLE "chat_message" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR NOT NULL,
    chatflowid UUID NOT NULL REFERENCES "chatflow"(id),
    "executionId" UUID,
    content TEXT NOT NULL,
    "sourceDocuments" TEXT,
    "usedTools" TEXT,
    "fileAnnotations" TEXT,
    "agentReasoning" TEXT,
    "fileUploads" TEXT,
    artifacts TEXT,
    action TEXT,
    "chatType" VARCHAR NOT NULL,
    "chatId" VARCHAR NOT NULL,
    "memoryType" VARCHAR,
    "sessionId" VARCHAR,
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadEmail" TEXT,
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    "deletedDate" TIMESTAMP,
    "followUpPrompts" TEXT,
    "guardrails_metadata" TEXT,
    "tracking_metadata" TEXT
);

CREATE INDEX idx_chat_message_chatflowid ON "chat_message"(chatflowid);
CREATE INDEX idx_chat_message_userId ON "chat_message"("userId");
CREATE INDEX idx_chat_message_organizationId ON "chat_message"("organizationId");

-- Table: credential
-- Purpose: API credentials for integrations
-- Security: Encrypted data storage
CREATE TABLE "credential" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    "credentialName" VARCHAR NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    visibility TEXT[], -- ARRAY of 'Private', 'Organization', 'Platform'
    "workspaceId" TEXT NOT NULL
);

CREATE INDEX idx_credential_userId ON "credential"("userId");
CREATE INDEX idx_credential_organizationId ON "credential"("organizationId");

-- Table: tool
-- Purpose: Custom tools/integrations
-- Multi-tenancy: Private or Organization-scoped
CREATE TABLE "tool" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT NOT NULL,
    color VARCHAR NOT NULL,
    "iconSrc" VARCHAR,
    schema TEXT,
    func TEXT,
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    visibility TEXT[], -- ARRAY of 'Private', 'Organization'
    "workspaceId" TEXT NOT NULL
);

CREATE INDEX idx_tool_userId ON "tool"("userId");
CREATE INDEX idx_tool_organizationId ON "tool"("organizationId");

-- Table: execution
-- Purpose: Agent flow execution state and history
-- Multi-tenancy: Filtered by organizationId
CREATE TABLE "execution" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "executionData" TEXT NOT NULL,
    state VARCHAR NOT NULL,
    "agentflowId" UUID NOT NULL REFERENCES "chatflow"(id),
    "sessionId" VARCHAR NOT NULL,
    action TEXT,
    "isPublic" BOOLEAN,
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedDate" TIMESTAMP NOT NULL,
    "workspaceId" TEXT NOT NULL
);

CREATE INDEX idx_execution_agentflowId ON "execution"("agentflowId");
CREATE INDEX idx_execution_sessionId ON "execution"("sessionId");
CREATE INDEX idx_execution_userId ON "execution"("userId");
CREATE INDEX idx_execution_organizationId ON "execution"("organizationId");

-- ============================================
-- THEANSWER EXTENSIONS (Prisma)
-- ============================================

-- Table: chat
-- Purpose: User conversations and chat sessions
-- Multi-tenancy: Scoped to organization
CREATE TABLE "chat" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR,
    "promptId" UUID,
    "journeyId" UUID,
    "ownerId" UUID REFERENCES "user"(id),
    "chatflowChatId" VARCHAR,
    "organizationId" UUID REFERENCES "organization"(id),
    filters JSONB NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_promptId ON "chat"("promptId");
CREATE INDEX idx_chat_journeyId ON "chat"("journeyId");
CREATE INDEX idx_chat_ownerId ON "chat"("ownerId");
CREATE INDEX idx_chat_organizationId ON "chat"("organizationId");

-- Table: prompt
-- Purpose: Reusable conversation prompts
-- Global resource with usage tracking
CREATE TABLE "prompt" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR,
    description TEXT,
    content TEXT NOT NULL UNIQUE,
    usages INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX idx_prompt_content ON "prompt"(content);

-- Table: message
-- Purpose: Individual messages within chats
-- AI tracking: Links to ai_request for cost tracking
CREATE TABLE "message" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR NOT NULL DEFAULT 'assistant',
    content TEXT NOT NULL,
    "contextSourceFilesUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    context TEXT NOT NULL DEFAULT '',
    "sidekickJson" JSONB NOT NULL DEFAULT '{}',
    "promptId" UUID REFERENCES "prompt"(id),
    "userId" UUID REFERENCES "user"(id),
    "chatId" UUID NOT NULL REFERENCES "chat"(id),
    likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiRequestId" UUID UNIQUE REFERENCES "ai_request"(id)
);

CREATE INDEX idx_message_promptId ON "message"("promptId");
CREATE INDEX idx_message_userId ON "message"("userId");
CREATE INDEX idx_message_chatId ON "message"("chatId");

-- Table: journey
-- Purpose: User journey tracking for analytics
-- Goal tracking and completion metrics
CREATE TABLE "journey" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR,
    goal VARCHAR,
    "completedAt" TIMESTAMP,
    filters JSONB NOT NULL,
    "organizationId" UUID REFERENCES "organization"(id),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journey_organizationId ON "journey"("organizationId");

-- Table: document
-- Purpose: Knowledge base documents
-- Syncing: Tracks last sync time for document updates
CREATE TABLE "document" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR NOT NULL,
    title VARCHAR,
    domain VARCHAR,
    url VARCHAR NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}',
    status VARCHAR NOT NULL DEFAULT 'pending',
    "lastSyncedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_url ON "document"(url);
CREATE INDEX idx_document_source ON "document"(source);

-- Table: document_permission
-- Purpose: Control document access by organization
CREATE TABLE "document_permission" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "documentId" UUID NOT NULL REFERENCES "document"(id),
    "organizationId" UUID NOT NULL REFERENCES "organization"(id),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_permission_documentId ON "document_permission"("documentId");
CREATE INDEX idx_document_permission_organizationId ON "document_permission"("organizationId");

-- Table: sidekick
-- Purpose: AI assistant configurations
-- Sharing: Can be global, system, or org-scoped
CREATE TABLE "sidekick" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "isGlobal" BOOLEAN DEFAULT FALSE,
    "isSystem" BOOLEAN DEFAULT FALSE,
    "isSharedWithOrg" BOOLEAN DEFAULT FALSE,
    "isFavoriteByDefault" BOOLEAN DEFAULT FALSE,
    chatflow JSONB,
    "chatflowApiKey" VARCHAR,
    "chatflowDomain" VARCHAR,
    "organizationId" UUID REFERENCES "organization"(id),
    label VARCHAR NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" UUID NOT NULL REFERENCES "user"(id),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temperature FLOAT NOT NULL DEFAULT 1,
    frequency FLOAT NOT NULL DEFAULT 0,
    presence FLOAT NOT NULL DEFAULT 0,
    "maxCompletionTokens" INTEGER NOT NULL DEFAULT 500,
    "aiModel" VARCHAR,
    "systemPromptTemplate" TEXT,
    "userPromptTemplate" TEXT,
    "contextStringRender" TEXT,
    placeholder VARCHAR
);

CREATE INDEX idx_sidekick_organizationId ON "sidekick"("organizationId");
CREATE INDEX idx_sidekick_userId ON "sidekick"("userId");

-- Table: api_key
-- Purpose: API authentication
-- Types: USER or ORGANIZATION scoped
CREATE TABLE "api_key" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "user"(id),
    "organizationId" UUID REFERENCES "organization"(id),
    type VARCHAR NOT NULL DEFAULT 'USER',
    key VARCHAR NOT NULL UNIQUE,
    CONSTRAINT chk_api_key_type CHECK (type IN ('USER', 'ORGANIZATION'))
);

CREATE INDEX idx_api_key_userId ON "api_key"("userId");
CREATE INDEX idx_api_key_organizationId ON "api_key"("organizationId");

-- Table: ai_request
-- Purpose: Track AI API requests for billing and analytics
-- Cost tracking: Stores token usage and USD costs
CREATE TABLE "ai_request" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL,
    method VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "tokensUsedUser" INTEGER NOT NULL,
    "costUsdTotal" DECIMAL NOT NULL,
    "costUsdTotalUser" DECIMAL NOT NULL,
    "userId" UUID NOT NULL REFERENCES "user"(id),
    request JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_request_userId ON "ai_request"("userId");

-- Table: message_feedback
-- Purpose: User feedback on messages
-- Ratings: thumbsUp or thumbsDown
CREATE TABLE "message_feedback" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating VARCHAR NOT NULL DEFAULT 'thumbsUp',
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" UUID NOT NULL REFERENCES "user"(id),
    "messageId" UUID NOT NULL REFERENCES "message"(id),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "messageId"),
    CONSTRAINT chk_message_feedback_rating CHECK (rating IN ('thumbsUp', 'thumbsDown'))
);

CREATE INDEX idx_message_feedback_userId ON "message_feedback"("userId");
CREATE INDEX idx_message_feedback_messageId ON "message_feedback"("messageId");

-- Table: plan
-- Purpose: Subscription plans with token limits
CREATE TABLE "plan" (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR NOT NULL,
    description TEXT NOT NULL,
    "tokenLimit" INTEGER NOT NULL
);

-- Table: active_user_plan
-- Purpose: Current active plan for user
-- Renewal tracking and token management
CREATE TABLE "active_user_plan" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES "user"(id),
    "planId" INTEGER NOT NULL REFERENCES "plan"(id),
    "renewalDate" TIMESTAMP NOT NULL,
    "tokensLeft" INTEGER NOT NULL,
    "startDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gpt3RequestCount" INTEGER NOT NULL DEFAULT 0,
    "gpt4RequestCount" INTEGER NOT NULL DEFAULT 0,
    "stripeSubscriptionId" VARCHAR,
    "shouldRenew" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_active_user_plan_userId ON "active_user_plan"("userId");

-- Table: app_config
-- Purpose: Per-app configuration storage
CREATE TABLE "app_config" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "user"(id),
    "appId" VARCHAR NOT NULL,
    "appType" VARCHAR NOT NULL,
    config JSONB NOT NULL
);

CREATE INDEX idx_app_config_userId ON "app_config"("userId");

-- Table: app_csv_parse_runs
-- Purpose: Track CSV processing jobs
-- Status: pending -> inProgress -> complete/completeWithErrors -> generatingCsv -> ready
CREATE TABLE "app_csv_parse_runs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "user"(id),
    "orgId" UUID NOT NULL REFERENCES "organization"(id),
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP,
    "rowsRequested" INTEGER NOT NULL,
    "rowsProcessed" INTEGER,
    name VARCHAR NOT NULL,
    configuration JSONB NOT NULL,
    "originalCsvUrl" TEXT NOT NULL,
    "processedCsvUrl" TEXT,
    "chatflowChatId" VARCHAR NOT NULL,
    "includeOriginalColumns" BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR NOT NULL DEFAULT 'pending',
    "errorMessages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT chk_csv_parse_run_status CHECK (status IN ('pending', 'inProgress', 'completeWithErrors', 'complete', 'generatingCsv', 'ready'))
);

CREATE INDEX idx_app_csv_parse_runs_userId ON "app_csv_parse_runs"("userId");
CREATE INDEX idx_app_csv_parse_runs_orgId ON "app_csv_parse_runs"("orgId");

-- Table: app_csv_parse_rows
-- Purpose: Track individual row processing in CSV jobs
-- Status: pending -> inProgress -> complete/completeWithError
CREATE TABLE "app_csv_parse_rows" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "csvParseRunId" UUID NOT NULL REFERENCES "app_csv_parse_runs"(id),
    "rowNumber" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,
    "generatedData" JSONB,
    status VARCHAR NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_csv_parse_row_status CHECK (status IN ('pending', 'inProgress', 'completeWithError', 'complete'))
);

CREATE INDEX idx_app_csv_parse_rows_csvParseRunId ON "app_csv_parse_rows"("csvParseRunId");

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- User self-references
ALTER TABLE "user" ADD CONSTRAINT fk_user_createdBy FOREIGN KEY ("createdBy") REFERENCES "user"(id);
ALTER TABLE "user" ADD CONSTRAINT fk_user_updatedBy FOREIGN KEY ("updatedBy") REFERENCES "user"(id);
ALTER TABLE "user" ADD CONSTRAINT fk_user_organizationId FOREIGN KEY ("organizationId") REFERENCES "organization"(id);

-- Chat relations
ALTER TABLE "chat" ADD CONSTRAINT fk_chat_promptId FOREIGN KEY ("promptId") REFERENCES "prompt"(id);
ALTER TABLE "chat" ADD CONSTRAINT fk_chat_journeyId FOREIGN KEY ("journeyId") REFERENCES "chat"(id);

-- ============================================
-- MULTI-TENANCY NOTES
-- ============================================

-- All resources must filter by organizationId to ensure data isolation
-- All resources should track userId for audit and permission purposes
-- All resources should include createdAt/updatedAt timestamps
-- Soft deletes use deletedDate column where applicable

-- ============================================
-- AUDIT & TRACKING
-- ============================================

-- All tables include created/updated timestamps for audit trails
-- user and organization include createdBy/updatedBy for creator tracking
-- ai_request tracks all API calls for billing and usage analytics
-- message_feedback captures user feedback for quality improvement
