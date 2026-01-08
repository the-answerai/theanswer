# Claude Code Architecture Optimization Plan

This document outlines the comprehensive refactoring of the `.claude/` directory to align with Anthropic's 2026 best practices for Opus 4.5.

## Executive Summary

**Goal:** Optimize skills/agents/commands for token efficiency and maintainability.

**Scope:** 23 files (excluding blog system - deferred to future)

**Key Changes:**
1. Add YAML frontmatter to all skills and agents
2. Create 2 new atomic skills
3. Slim down 2 large skills (~1900 lines → ~800 lines)
4. Create 3 path-specific rules
5. Update README with new standards

---

## 2026 Best Practices Applied

| Practice | Implementation |
|----------|----------------|
| YAML frontmatter | All skills/agents get standardized metadata |
| Files under 500 lines | Slim large skills, extract reusable patterns |
| Path-specific rules | `.claude/rules/` for location-aware guidance |
| Progressive disclosure | Reference supporting files instead of embedding |
| Single responsibility | One skill = one capability |
| Token efficiency | Link to docs, don't duplicate content |

---

## YAML Frontmatter Standards

### Skills Format

```yaml
---
name: skill-name
description: One-line description of what this skill does
---
```

**Example (commit-helper.md):**
```yaml
---
name: commit-helper
description: Validates and creates conventional commits with semantic versioning
---
```

### Agents Format

```yaml
---
name: agent-name
description: Trigger patterns with examples showing when to invoke
model: sonnet
color: blue
---
```

**Example (git-pr-manager.md - existing template):**
```yaml
---
name: git-pr-manager
description: Use this agent when the user has completed work and needs to commit, push, and create a PR...
model: sonnet
color: blue
---
```

### Color Palette for Agents

| Agent Type | Color |
|------------|-------|
| Git/PR workflows | blue |
| Linear/ticket workflows | cyan |
| Review/validation | yellow |
| Documentation | green |
| Integration | purple |

---

## Current State Analysis

### File Line Counts (Verified)

| File | Current Lines | Target | Action |
|------|--------------|--------|--------|
| **Skills** |
| ticket-planning-workflow.md | 1284 | ~500 | Slim down |
| branch-workflow.md | 658 | ~300 | Slim down |
| pr-review-workflow.md | 638 | ~500 | Add frontmatter |
| commit-helper.md | 215 | 215 | Add frontmatter |
| git-branch.md | 207 | 207 | Add frontmatter |
| pr-description-generator.md | 193 | 193 | Add frontmatter |
| ticket-status-sync.md | 116 | 116 | Add frontmatter |
| ticket-duplicate-detection.md | 100 | 100 | Add frontmatter |
| **Agents** |
| integration-docs-updater.md | 557 | ~400 | Add frontmatter, slim |
| git-pr-manager.md | 131 | 131 | ✓ Already has frontmatter |
| linear-ticket-creator.md | 147 | 147 | ✓ Already has frontmatter |
| linear-ticket-planner.md | ~200 | ~200 | Add frontmatter |
| linear-ticket-optimizer.md | ~150 | ~150 | Add frontmatter |
| git-pr-reviewer.md | ~150 | ~150 | Add frontmatter |
| integration-validator.md | ~150 | ~150 | Add frontmatter |

### Deferred (Blog System - Future Work)

| File | Lines | Reason |
|------|-------|--------|
| blog-writing-workflow.md | 2015 | Massive - needs separate treatment |
| blog-post-writer.md | 559 | Part of blog system |
| **Total** | 2574 | Defer to dedicated refactor |

---

## Phase 1: Add YAML Frontmatter (15 files)

### Skills to Update (8 files)

**1. branch-workflow.md**
```yaml
---
name: branch-workflow
description: Git branch validation, creation, and lifecycle management
---
```

**2. commit-helper.md**
```yaml
---
name: commit-helper
description: Validates and creates conventional commits with semantic versioning
---
```

**3. git-branch.md**
```yaml
---
name: git-branch
description: Creates properly formatted git branches from Linear ticket IDs
---
```

**4. pr-description-generator.md**
```yaml
---
name: pr-description-generator
description: Generates comprehensive PR descriptions with Linear integration
---
```

**5. pr-review-workflow.md**
```yaml
---
name: pr-review-workflow
description: Comprehensive PR review methodology with security and quality checks
---
```

**6. ticket-planning-workflow.md**
```yaml
---
name: ticket-planning-workflow
description: Patterns for creating well-researched Linear tickets with codebase context
---
```

**7. ticket-status-sync.md**
```yaml
---
name: ticket-status-sync
description: Synchronizes Linear ticket status with git workflow events
---
```

**8. ticket-duplicate-detection.md**
```yaml
---
name: ticket-duplicate-detection
description: Detects similar/duplicate tickets before creating new ones
---
```

### Agents to Update (6 files)

Already have frontmatter:
- ✓ git-pr-manager.md
- ✓ linear-ticket-creator.md

Need frontmatter:

**1. linear-ticket-planner.md**
```yaml
---
name: linear-ticket-planner
description: Use when starting work on a Linear ticket. Fetches details, explores codebase, creates implementation plan, and sets up git branch.
model: sonnet
color: cyan
---
```

**2. linear-ticket-optimizer.md**
```yaml
---
name: linear-ticket-optimizer
description: Use when improving Linear ticket quality or finding poorly-described tickets.
model: sonnet
color: cyan
---
```

**3. git-pr-reviewer.md**
```yaml
---
name: git-pr-reviewer
description: Use when reviewing PRs. Conducts security, architecture, and quality checks.
model: sonnet
color: yellow
---
```

**4. integration-docs-updater.md**
```yaml
---
name: integration-docs-updater
description: Use when reviewing/updating MCP integration documentation.
model: sonnet
color: green
---
```

**5. integration-validator.md**
```yaml
---
name: integration-validator
description: Use when validating integration docs for completeness and standards compliance.
model: sonnet
color: purple
---
```

---

## Phase 2: Create New Atomic Skills (2 files)

### 1. theanswer-patterns.md (~100 lines)

```yaml
---
name: theanswer-patterns
description: TheAnswer-specific patterns for multi-tenancy, authentication, and authorization
---
```

**Content:**
- Multi-tenancy requirements (organizationId in all queries)
- Authentication patterns (enforceAbility middleware)
- Authorization checks (checkOwnership utility)
- Entity requirements (userId, organizationId, timestamps)
- Code examples from existing patterns

### 2. error-handling.md (~80 lines)

```yaml
---
name: error-handling
description: InternalFlowiseError patterns and error message formatting
---
```

**Content:**
- InternalFlowiseError usage
- Error message format: `Error: {service}.{method} - {description}`
- getErrorMessage utility
- StatusCodes mapping
- Common error scenarios

---

## Phase 3: Slim Down Large Skills (2 files)

### 1. ticket-planning-workflow.md (1284 → ~500 lines)

**Current structure (1284 lines):**
- Core methodology (~300 lines)
- Detailed OAuth2 example (~400 lines)
- Exploration patterns (~200 lines)
- Question frameworks (~200 lines)
- Misc content (~184 lines)

**Actions:**
1. Keep core methodology and exploration patterns
2. Extract detailed OAuth2 example to `examples/oauth2-ticket-example.md`
3. Condense question frameworks
4. Reference `theanswer-patterns` skill instead of duplicating

**Target structure (~500 lines):**
- YAML frontmatter
- Core methodology (~200 lines)
- Exploration patterns (~150 lines)
- Condensed questions (~100 lines)
- References to examples and other skills (~50 lines)

### 2. branch-workflow.md (658 → ~300 lines)

**Current structure (658 lines):**
- Branch validation (~150 lines)
- Branch creation (~100 lines)
- Git operations (~150 lines)
- Duplicate content with git-branch.md (~100 lines)
- Examples (~158 lines)

**Actions:**
1. Remove duplication with git-branch.md (207 lines)
2. Consolidate branch validation rules
3. Keep essential examples only
4. Reference git-branch skill for creation details

**Target structure (~300 lines):**
- YAML frontmatter
- Branch validation rules (~100 lines)
- Git operations (~100 lines)
- Essential examples (~80 lines)
- References (~20 lines)

---

## Phase 4: Create Path-Specific Rules (3 files)

Create `.claude/rules/` directory with context-aware guidance.

### 1. api-routes.md

```yaml
---
paths:
  - packages/server/src/routes/**
---

# API Routes Rules

When working in API routes:

## Required Middleware
- All routes MUST use `enforceAbility` middleware
- Import from `../../middleware/enforceAbility`

## Controller Pattern
- Route handlers call controllers, not services directly
- Controllers use `checkOwnership()` for authorization

## Multi-tenancy
- All database operations MUST filter by `organizationId`
- Use `req.user.organizationId` from authenticated request

## Error Handling
- Use `InternalFlowiseError` with appropriate StatusCodes
- Format: `Error: {route}.{handler} - {description}`
```

### 2. components.md

```yaml
---
paths:
  - packages/components/nodes/**
  - packages/components/credentials/**
---

# Flowise Components Rules

When creating/modifying components:

## Required Tags
- TheAnswer components MUST include `tags: ['AAI']`

## Interface
- Implement `INode` interface
- Include: label, name, version, type, category, inputs

## Credentials
- Create credential file in `credentials/` if needed
- Reference with `credential` property

## Testing
- Test in Flowise UI after building
- Run `pnpm --filter flowise-components build`
```

### 3. web-app.md

```yaml
---
paths:
  - apps/web/**
---

# Next.js App Rules

When working in the web app:

## Component Types
- Server Components (default): Data fetching, DB access
- Client Components (`'use client'`): Hooks, browser APIs, interactivity

## Authentication
- Protected routes via middleware.ts
- Use Auth0 session for user context

## API Routes
- Create in `app/api/` directory
- Use Server Component patterns

## Testing
- E2E tests in `e2e/tests/`
- Run with `pnpm test:e2e`
```

---

## Phase 5: Update README.md

### Changes to Make

1. **Add YAML Frontmatter Section**
   - Document standard format for skills and agents
   - Reference git-pr-manager.md as example

2. **Update Architecture Diagram**
   - Add rules layer
   - Show skill→agent relationships

3. **Add Token Efficiency Guidelines**
   - Keep files under 500 lines
   - Reference instead of embed
   - Progressive disclosure pattern

4. **Update Directory Structure**
   ```
   .claude/
   ├── README.md
   ├── ARCHITECTURE.md              # NEW: This document
   ├── commands/                    # User commands
   ├── agents/                      # Specialized agents
   ├── skills/                      # Reusable patterns
   ├── rules/                       # NEW: Path-specific rules
   │   ├── api-routes.md
   │   ├── components.md
   │   └── web-app.md
   └── examples/                    # NEW: Detailed examples
       └── oauth2-ticket-example.md
   ```

---

## Implementation Checklist

### Phase 1: Add YAML Frontmatter (15 files)

**Skills (8 files):**
- [ ] branch-workflow.md
- [ ] commit-helper.md
- [ ] git-branch.md
- [ ] pr-description-generator.md
- [ ] pr-review-workflow.md
- [ ] ticket-planning-workflow.md
- [ ] ticket-status-sync.md
- [ ] ticket-duplicate-detection.md

**Agents (6 files):**
- [x] git-pr-manager.md (already done)
- [x] linear-ticket-creator.md (already done)
- [ ] linear-ticket-planner.md
- [ ] linear-ticket-optimizer.md
- [ ] git-pr-reviewer.md
- [ ] integration-docs-updater.md
- [ ] integration-validator.md

### Phase 2: Create New Atomic Skills (2 files)

- [ ] theanswer-patterns.md
- [ ] error-handling.md

### Phase 3: Slim Down Large Skills (2 files)

- [ ] ticket-planning-workflow.md (1284→500)
- [ ] branch-workflow.md (658→300)

### Phase 4: Create Path-Specific Rules (3 files)

- [ ] rules/api-routes.md
- [ ] rules/components.md
- [ ] rules/web-app.md

### Phase 5: Update README.md

- [ ] Add frontmatter documentation
- [ ] Update architecture diagram
- [ ] Add token efficiency guidelines
- [ ] Update directory structure

---

## Complexity Assessment

| Phase | Files | Effort | Risk |
|-------|-------|--------|------|
| Phase 1: Frontmatter | 15 | Low | Low |
| Phase 2: New Skills | 2 | Low | Low |
| Phase 3: Slim Skills | 2 | Medium | Medium |
| Phase 4: Rules | 3 | Low | Low |
| Phase 5: README | 1 | Low | Low |
| **Total** | **23** | **Low-Medium** | **Low** |

---

## Future Work: Blog System

**Deferred from this refactor due to size (2574 lines total):**

| File | Lines |
|------|-------|
| blog-writing-workflow.md | 2015 |
| blog-post-writer.md | 559 |

**Future actions needed:**
- Break into multiple smaller skills
- Create blog-specific rules directory
- Consider external content strategy documentation
- May require separate plugin/module approach

---

## Validation Criteria

After implementation, verify:

1. **All files have frontmatter** - Run: `grep -L "^---$" .claude/skills/*.md .claude/agents/*.md`
2. **No files over 500 lines** (except deferred blog) - Run: `wc -l .claude/skills/*.md .claude/agents/*.md | sort -n`
3. **Rules directory exists** - Verify `.claude/rules/` with 3 files
4. **README updated** - Check for new sections
5. **Workflows still function** - Test `/push`, `/ticket-start`, `/pr-review`

---

## Rollback Plan

If issues arise:
1. All changes are additive (frontmatter) or extractive (slimming)
2. Git history preserved for all modifications
3. Original content moved to examples/, not deleted
4. Can revert individual phases independently

---

*Document created: 2026-01-08*
*Status: Ready for review*
