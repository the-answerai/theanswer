---
name: ticket-planning-workflow
description: "Patterns for creating well-researched Linear tickets with codebase context"
---

# Ticket Planning Workflow Skill

Transform Linear tickets into actionable implementation plans through systematic investigation and collaborative planning.

## Purpose

Transform uncertainty into clarity by:
- Gathering complete ticket context from Linear
- Exploring relevant codebase sections
- Identifying patterns and conventions
- Asking targeted clarifying questions
- Creating detailed, actionable implementation plans

## Planning Methodology

### Phase 1: Ticket Intelligence Gathering

#### Fetch and Parse Ticket

```bash
# Get complete ticket information
ticket_json=$(mcp__linear__get_issue --id "$ticket_id")

# Extract key fields
title=$(echo "$ticket_json" | jq -r '.title')
description=$(echo "$ticket_json" | jq -r '.description')
labels=$(echo "$ticket_json" | jq -r '.labels[].name' | tr '\n' ', ')
comments=$(mcp__linear__list_comments --issueId "$ticket_id")
```

#### Extract Structured Information

Parse from ticket:
- **Type**: Feature/Bug/Chore (from labels)
- **Priority**: Urgency level
- **Acceptance Criteria**: From description checkboxes
- **Related Context**: Parent tickets, dependencies, blockers
- **Discussion Points**: Key decisions from comments

#### Identify Unclear Items

Flag for clarification:
- Ambiguous requirements
- Missing acceptance criteria
- Architectural decisions needed
- Scope boundaries unclear

### Phase 2: Deep Codebase Exploration

#### Step 1: Broad Search

```bash
# Find existing related code
rg "authentication|auth|token" --type ts --files-with-matches

# Find similar implementations
rg "pattern-keyword" --type ts -A 5
```

#### Step 2: Understand Architecture

For each relevant file:
- Document current implementation
- Note patterns used
- Identify extension points
- Flag multi-tenancy requirements

#### Step 3: Find Patterns to Follow

Extract from codebase:
- **Error handling**: InternalFlowiseError usage
- **Entity pattern**: UUID, organizationId, timestamps
- **Route pattern**: enforceAbility middleware
- **Service pattern**: Business logic organization

#### Step 4: Check Project Guidelines

```bash
# Review CLAUDE.md for requirements
cat CLAUDE.md | grep -A 10 "multi-tenancy\|authentication"

# Check .cursorrules for patterns
cat .cursorrules | grep -A 20 "Resource Pattern"
```

### Phase 3: Collaborative Clarification

#### Question Framework

Present 2-4 questions at a time with:
- **Context**: What you found in codebase
- **Options**: Concrete choices (A/B/C)
- **Recommendation**: Your suggested approach
- **Trade-offs**: Pros/cons of each

**Format:**
```markdown
### Question: [Topic]

**Context**: [What codebase exploration revealed]

**Options**:
A) **[Option Name]** - [Description]
   - Pros: [Benefits]
   - Cons: [Drawbacks]

B) **[Option Name]** - [Description]
   - Pros: [Benefits]
   - Cons: [Drawbacks]

**Recommendation**: Option [X] because [reasoning]

**Your choice?** (A/B)
```

### Phase 4: Implementation Plan Generation

#### High-Level Overview

```markdown
# Implementation Plan: {ticket-id} - {title}

## Overview
[1-2 sentence summary]

## Approach
[3-5 bullet points on technical approach]

## Decisions
[List of decisions made during clarification]

## Complexity
[Simple/Moderate/Complex with justification]
```

#### Architecture Changes

Document:
- New entities/tables with schema
- New API endpoints with signature
- Modified services with changes
- Database migrations needed

#### Implementation Steps

For each step:
```markdown
### Step N: [Title] (Est. time)
**Complexity**: Simple/Moderate/Complex

**What**: [Brief description]
**File(s)**: [Paths]

**Key points**:
- [Critical implementation detail]
- [Pattern to follow]
- [Multi-tenancy consideration]

**Dependencies**: Step [X]
**Testing**: [How to verify]
```

#### Testing Strategy

Define:
- **Unit tests**: Coverage goals, test categories
- **Integration tests**: Key scenarios
- **Manual testing**: Verification checklist

#### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | High/Med/Low | [Strategy] |

#### Success Criteria

Checklist covering:
- [ ] Functional requirements
- [ ] Technical requirements (multi-tenancy, auth)
- [ ] Testing requirements
- [ ] Documentation requirements

### Phase 5: Git Strategy

```markdown
## Git Strategy

**Branch**: {type}/{ticket-id}-{sanitized-title}
**Base**: staging

**Commits** (logical units):
1. `feat({ticket}): [description]`
2. `test({ticket}): [description]`
3. `docs({ticket}): [description]`

**PR Target**: staging (enforced)
```

## Example

See [examples/oauth2-ticket-example.md](../examples/oauth2-ticket-example.md) for a complete walkthrough of planning OAuth2 token refresh implementation.

## Integration

**Used by commands:**
- `/ticket-start` - Primary ticket planning command

**Used by agents:**
- `linear-ticket-planner` - Autonomous ticket planning

## Quality Checklist

Before completing plan:
- [ ] Ticket requirements fully understood
- [ ] Codebase exploration thorough
- [ ] All clarifying questions asked
- [ ] Implementation steps are actionable
- [ ] Testing strategy is comprehensive
- [ ] Risks identified and mitigated
- [ ] Success criteria clear and measurable
- [ ] Git strategy defined
