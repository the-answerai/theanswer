---
name: issue-triage
description: Triage GitHub issues - analyze relevance, close fixed/outdated issues, or create Linear tickets
---

# Issue Triage Command

Analyze GitHub issues to determine if they're still relevant. Close resolved issues or create Linear tickets for valid ones.

## Usage

```bash
# Triage a single issue
/issue-triage 278

# Triage multiple issues (processed in parallel)
/issue-triage 278 316 331 343

# Triage all issues without Linear tickets (from CSV)
/issue-triage --pending
```

## What This Command Does

For each issue:
1. **Fetches issue details** from GitHub
2. **Searches codebase** for related code and fixes
3. **Determines relevance** based on code changes and age
4. **Takes action**:
   - Close if fixed (with PR/commit reference)
   - Close if outdated (architecture changed)
   - Create Linear ticket if still valid

## Single Issue Mode

```bash
/issue-triage 278
```

Launches `github-issue-triager` agent to analyze issue #278.

**Output:**
```
TRIAGE COMPLETE
Issue: #278
Title: [BUG] Clone Sidekick from Chats Page Redirects Incorrectly
Action: CREATE_TICKET
Result: Created AGENT-650
Details: Click event propagation bug still present in ChatCard component
```

## Batch Mode (Parallel)

```bash
/issue-triage 278 316 331 343
```

Launches multiple `github-issue-triager` agents in parallel, one per issue.

**Output:**
```
Triaging 4 issues in parallel...

Issue #278: Created AGENT-650 (bug still exists)
Issue #316: Closed (feature implemented in PR #567)
Issue #331: Created AGENT-651 (UX improvement valid)
Issue #343: Closed (outdated - chatflow list refactored)

Summary: 2 tickets created, 2 issues closed
```

## Pending Issues Mode

```bash
/issue-triage --pending
```

Reads from `github_issues_linear_status.csv` and triages all issues marked "Create Linear ticket".

## Integration

This command uses:
- **Agent**: `github-issue-triager` - Autonomous issue analysis
- **Skills**:
  - `github-issue-analysis` - Analysis methodology
  - `linear-constants` - Pre-cached Linear configuration
  - `ticket-duplicate-detection` - Avoid duplicate tickets

## Labels Applied

When creating Linear tickets:
- `Engineering → Github issue` (always)
- `Engineering → Bug` or `Engineering → Feature` (based on content)
- Appropriate product label (AnswerSidekick, AnswerAgent Studio, etc.)

## Example Workflow

```bash
# 1. Review issues without Linear tickets
cat github_issues_linear_status.csv | grep "Create Linear ticket"

# 2. Triage a batch
/issue-triage 278 316 331 343 351 355

# 3. Check results
cat github_issues_linear_status.csv | grep "Create Linear ticket"
```

## Parallel Execution

When triaging multiple issues, the orchestrator spawns separate agents:

```python
# Orchestrator logic
for issue_number in issue_numbers:
    Task(
        subagent_type="github-issue-triager",
        prompt=f"Triage GitHub issue #{issue_number}",
        run_in_background=True  # Parallel execution
    )
```

This allows processing many issues simultaneously.
