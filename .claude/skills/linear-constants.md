---
name: linear-constants
description: "Pre-cached Linear configuration - team IDs, label IDs, and status mappings"
---

# Linear Constants Skill

Pre-cached Linear configuration to avoid repeated API calls. Use these constants instead of querying Linear for common lookups.

## Team Configuration

```yaml
team:
  id: "5436d595-4ca2-4312-8f39-9e02ba251c42"
  name: "AnswerAgentAI"
  key: "AGENT"
```

## Label IDs

Use these IDs when creating/updating issues with `mcp__claude_ai_Linear__create_issue` or `mcp__claude_ai_Linear__update_issue`.

### Engineering Labels

| Label | ID | Description |
|-------|-----|-------------|
| Engineering → Github issue | `2400a57d-9a69-42f6-8e31-82659a6a98be` | Issue created via GitHub |
| Engineering → Bug | `136398d1-b6fc-450d-957d-ec65997ec07a` | Something is broken |
| Engineering → Feature | `1550fe7f-e1c3-4bb9-9ec9-0487ae82c8a7` | New capability |
| Engineering → Improvement | `b16954d1-586e-4dfa-b8c7-f7f0526042ad` | Enhancement to existing |
| Engineering → Maintenance | `30494fa3-c1f1-4bf6-bea8-213811dc5735` | Tech debt, refactoring |
| Engineering → Chore | `6b55301d-c034-4d95-b1f6-bcb31de4b249` | Routine tasks |

### Product Labels

| Label | ID | Description |
|-------|-----|-------------|
| Product → AnswerSidekick | `42f0386b-f6bb-4e93-a9d3-4a2d14d22ca2` | Browser extension for Chrome |
| Product → AnswerAgent Studio | `135f1576-19af-4666-9211-1e9e53607130` | Flowise platform, canvas, chatflows |
| Product → AnswerChat | `739a4541-fd35-419b-8d80-932d4c9b1db9` | Chat interface features |
| Product → AnswerApps | `58a1247d-c485-474c-881b-96e51b016600` | Micro apps: video, image, bulk analysis |
| Product → AnswerEngine | `3b81702c-1428-4665-bcbd-1ea0123b3a0c` | Data engine for ingestion, analysis |
| Product → AlphaAgent | `71523ca6-29fa-4642-8cac-80d0ba990bb6` | AI agent product for workflows |

### Operations Labels

| Label | ID | Description |
|-------|-----|-------------|
| Ops → Infrastructure | `db3ea833-0312-48d1-812a-2da1909c92b8` | Render, deployments, DevOps |
| Ops → Automation | `5f586dce-3c74-4542-b33d-b1c93280bdcd` | n8n flows, scheduled jobs |
| Ops → Internal Tools | `80a00521-7617-417f-935a-9c77e9371316` | Tools for the team |

### QA Phase Labels

| Label | ID | Description |
|-------|-----|-------------|
| QA Phase → Phase 1 - Critical | `3c2bf938-b4c1-4db8-9efc-181e298d1a52` | Must complete before beta |
| QA Phase → Phase 2 - Core Features | `90cc45a2-396d-4722-87c9-d298b92903c5` | Core feature fixes |
| QA Phase → Phase 3 - Completion | `f5a73afe-073f-4cc4-a966-33305c97a793` | Feature completion |
| QA Phase → Phase 4 - Polish | `9a2c98d7-37ab-425f-8d6e-cbaf8659b0aa` | Polish and UX improvements |

### Other Labels

| Label | ID | Description |
|-------|-----|-------------|
| Customer Request | `cd13ab88-0204-4725-98cb-124c5141ea01` | Customer-reported issues |
| Support Escalation | `88458312-1114-44a2-921d-d8491c27824c` | Issues from support |
| Tech Debt | `73a5392d-b246-42bb-a1f8-8aa5c8d120c3` | Refactoring, cleanup |
| Sprint | `d2e09492-3217-4bb3-a64b-a095f5bc49c2` | Part of weekly sprint |
| Release | `0d509bd7-236a-434a-970d-7f1eaac1e8e3` | Part of a release |

## Status Names

Linear uses these status names (case-sensitive):

```yaml
statuses:
  - Backlog
  - Todo
  - In Progress
  - In Review
  - QA / Staging
  - Blocked
  - Done
  - Canceled
```

## Usage Examples

### Creating Issue with Labels

```python
# Use label names directly - Linear MCP resolves them
mcp__claude_ai_Linear__create_issue(
    title="Fix authentication bug",
    team="AGENT",
    labels=["Engineering → Bug", "Engineering → Github issue"]
)

# Or use IDs for performance (no lookup needed)
mcp__claude_ai_Linear__create_issue(
    title="Fix authentication bug",
    team="AGENT",
    labels=["136398d1-b6fc-450d-957d-ec65997ec07a", "2400a57d-9a69-42f6-8e31-82659a6a98be"]
)
```

### Product Label Selection

Choose product label based on GitHub issue content:

| Keywords in Issue | Product Label |
|-------------------|---------------|
| extension, chrome, browser, sidekick | Product → AnswerSidekick |
| canvas, chatflow, agentflow, studio, flowise | Product → AnswerAgent Studio |
| chat, conversation, message | Product → AnswerChat |
| video, image, bulk, csv, analyzer | Product → AnswerApps |
| MCP, tool, integration | Product → AnswerAgent Studio |
| document store, vector, embedding | Product → AnswerEngine |

### Issue Type Mapping

Map GitHub labels to Linear labels:

| GitHub Label | Linear Label |
|--------------|--------------|
| bug | Engineering → Bug |
| enhancement, feature | Engineering → Feature |
| documentation | Engineering → Maintenance |
| good first issue | (no equivalent) |
| (no label, is bug) | Engineering → Bug |
| (no label, is feature) | Engineering → Feature |

## Integration

Used by:
- `github-issue-triager` agent - For creating Linear tickets efficiently
- Any agent that creates/updates Linear issues

## Maintenance

**Last updated:** 2026-01-24

To refresh these constants:
1. Query `mcp__claude_ai_Linear__list_issue_labels`
2. Query `mcp__claude_ai_Linear__get_team` with query="AGENT"
3. Update this file with new IDs
