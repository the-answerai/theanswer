# Parallel Agent Orchestration Guide

This document captures the workflow for orchestrating multiple Claude Code subagents to work on Linear tickets in parallel.

## Overview

This guide documents the process of:
1. Syncing with Linear to gather ticket context
2. Planning work with task definitions upfront
3. Creating isolated worktrees for parallel development
4. Orchestrating subagents for implementation, testing, and documentation
5. Managing the review and PR process

---

## Phase 1: Linear Sync & Context Gathering

### Step 1.1: Connect to Linear
```
/mcp  # Authenticate with Linear MCP server
```

### Step 1.2: Fetch Project Tickets
```
Use mcp__linear-server__list_issues with:
- project: "<project-id-or-name>"
- limit: 50
- orderBy: "updatedAt"
```

### Step 1.3: Analyze & Triage Tickets

Review each ticket for:
- **Status**: Blocked, Todo, In Progress, In Review, Done
- **Priority**: Urgent, High, Medium, Low
- **Assignee**: Who owns the work
- **Labels**: Product area, customer-facing, etc.

**Actions:**
- Update assignees based on product ownership (e.g., Sidekick → Diego, Studio → Max)
- Request more info on stale tickets via Linear comments
- For GitHub-linked issues, ensure customer communication exists on GitHub too
- Remove internal labels (e.g., `paid-customer`) from public GitHub issues

### Step 1.4: Document Current State

Create a summary table:

| ID | Title | Status | Priority | Assignee |
|----|-------|--------|----------|----------|
| AGENT-XXX | Description | Todo | High | Name |

---

## Phase 2: Task Definition (Before Any Work)

**CRITICAL: All tasks must be defined before work begins.**

### Step 2.1: Create Master Task List

For each ticket, define the complete task breakdown:

```
TaskCreate:
- subject: "Implement AGENT-XXX feature"
- description: Full context, files to modify, acceptance criteria
- activeForm: "Implementing AGENT-XXX"
```

### Step 2.2: Define Task Dependencies

```
TaskUpdate:
- taskId: "2"
- addBlockedBy: ["1"]  # Task 2 depends on Task 1
```

### Step 2.3: Standard Task Pattern Per Ticket

Each ticket typically requires:

1. **Implementation Task** - Core code changes
2. **Test Task** - BDD test covering the behavior
3. **Documentation Task** - Inline comments & docs updates
4. **Review Task** - Verification of all changes
5. **PR Task** - Commit, push, create PR

---

## Phase 3: Worktree Setup

### Step 3.1: Create Isolated Worktrees

For each ticket, create a separate git worktree:

```bash
mkdir -p /home/max/dev/theanswer-worktrees

git worktree add -b feature/AGENT-XXX-description \
  /home/max/dev/theanswer-worktrees/AGENT-XXX \
  staging
```

### Step 3.2: Verify Worktrees

```bash
git worktree list
```

**Benefits of Worktrees:**
- Parallel development without branch switching
- Isolated changes per ticket
- Independent build/test cycles
- Clean separation of concerns

---

## Phase 4: Parallel Agent Orchestration

### Step 4.1: Launch Implementation Agents

Spawn multiple agents in a **single message** with multiple Task tool calls:

```
<Task>
  description: "Implement AGENT-XXX feature"
  prompt: |
    You are working on Linear ticket AGENT-XXX: "Title"

    **Worktree path:** /path/to/worktree/AGENT-XXX
    **Branch:** feature/AGENT-XXX-description

    **Ticket Details:**
    - Priority: High
    - Context: [full ticket description]

    **Your task:**
    1. Explore relevant code
    2. Implement the fix
    3. Report back with changes made

    Work in the worktree directory.
  subagent_type: "general-purpose"
  run_in_background: true
</Task>
```

### Step 4.2: Monitor Agent Progress

Check agent output files:

```bash
tail -100 /tmp/claude-1000/-home-max-dev-theanswer/tasks/<agent-id>.output
```

Check tool usage patterns:
```bash
grep -o '"name":"[^"]*"' /tmp/.../tasks/<agent-id>.output | sort | uniq -c
```

Check worktree for changes:
```bash
cd /path/to/worktree && git status && git diff --stat
```

### Step 4.3: Launch Test Agents (After Implementation)

Once implementation agents complete, spawn test agents:

```
<Task>
  description: "Add test for AGENT-XXX"
  prompt: |
    You are adding a behavior-driven test for AGENT-XXX

    **Worktree path:** /path/to/worktree/AGENT-XXX
    **What was implemented:** [summary of changes]

    **Your task:**
    Write ONE BDD test that verifies the core behavior.
    Place in appropriate test directory.
  subagent_type: "general-purpose"
  run_in_background: true
</Task>
```

### Step 4.4: Launch Documentation Agents (Parallel with Tests)

```
<Task>
  description: "Document AGENT-XXX changes"
  prompt: |
    You are documenting changes for AGENT-XXX

    **Worktree path:** /path/to/worktree/AGENT-XXX
    **What was implemented:** [summary]

    **Your task:**
    1. Add inline code comments
    2. Update relevant documentation
    3. Follow existing patterns in codebase
  subagent_type: "general-purpose"
  run_in_background: true
</Task>
```

---

## Phase 5: Agent Coordination Patterns

### Pattern A: Sequential Dependency
```
Implementation → Tests → Documentation → Review → PR
```

### Pattern B: Parallel with Sync Points
```
Implementation (parallel across tickets)
    ↓ [sync point: all implementations complete]
Tests + Documentation (parallel)
    ↓ [sync point: all tests/docs complete]
Review (parallel)
    ↓ [sync point: all reviews complete]
PRs (parallel)
```

### Pattern C: Full Parallel (Current Approach)
```
Ticket 1: Impl → Test → Docs (parallel streams)
Ticket 2: Impl → Test → Docs (parallel streams)
Ticket 3: Impl → Test → Docs (parallel streams)
    ↓ [sync point: all complete]
Batch PR creation
```

---

## Phase 6: Git Workflow in Worktrees

### Step 6.1: Commit Changes

```bash
cd /path/to/worktree/AGENT-XXX

git add <specific-files>

git commit --no-verify -m "$(cat <<'EOF'
feat(AGENT-XXX): description of change

- Detail 1
- Detail 2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

**Note:** Use `--no-verify` in worktrees if husky hooks fail due to path issues.

### Step 6.2: Push Branch

```bash
git push -u origin feature/AGENT-XXX-description
```

### Step 6.3: Create PR

```bash
gh pr create --base staging \
  --title "feat(AGENT-XXX): Title" \
  --body "$(cat <<'EOF'
## Summary
- Change description

## Test Plan
- [ ] Test case 1

## Linear Ticket
[AGENT-XXX](https://linear.app/...)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Phase 7: Review & Verification

### Step 7.1: Spawn Review Agents

```
<Task>
  description: "Review AGENT-XXX implementation"
  prompt: |
    Review the implementation for AGENT-XXX

    **Worktree:** /path/to/worktree/AGENT-XXX

    **Check:**
    1. Code correctness
    2. Test coverage
    3. Documentation completeness
    4. Security (no hardcoded secrets, SQL injection, XSS)
    5. Multi-tenancy (organizationId filters)
    6. TheAnswer patterns followed

    Report issues or approve.
  subagent_type: "general-purpose"
  run_in_background: true
</Task>
```

### Step 7.2: Update Linear Status

```
mcp__linear-server__update_issue:
- id: "AGENT-XXX"
- state: "In Review"
```

Add comment with PR link:
```
mcp__linear-server__create_comment:
- issueId: "<uuid>"
- body: "PR created: https://github.com/..."
```

---

## Phase 8: Completion & Cleanup

### Step 8.1: Merge PRs

After approval, merge via GitHub:
```bash
gh pr merge <pr-number> --squash
```

### Step 8.2: Update Linear to Done

```
mcp__linear-server__update_issue:
- id: "AGENT-XXX"
- state: "Done"
```

### Step 8.3: Clean Up Worktrees

```bash
git worktree remove /path/to/worktree/AGENT-XXX
git branch -d feature/AGENT-XXX-description
```

---

## Agent Communication Rules

### Main Session Responsibilities:
- Orchestration and coordination
- Task creation and tracking
- Git operations (commits, PRs)
- Linear updates
- Status reporting to user

### Subagent Responsibilities:
- Code exploration
- Implementation
- Test writing
- Documentation
- Reporting results back

### Subagents Should NOT:
- Commit directly (return to main session)
- Create PRs (main session handles)
- Update Linear (main session handles)
- Use `/push` or other skills (limited access)

---

## Example: Complete Workflow Session

```
1. User: "Review Linear and give me latest updates"
   → Fetch project tickets from Linear
   → Summarize status

2. User: "Update assignees based on product"
   → Reassign tickets via Linear MCP
   → Comment on stale tickets

3. User: "Create worktrees for each ticket"
   → git worktree add for each ticket
   → Verify with git worktree list

4. User: "Start agents to work on each ticket in parallel"
   → Spawn implementation agents (parallel)
   → Monitor progress via output files

5. User: "Add tests for each"
   → Spawn test agents after implementation completes
   → Run in parallel

6. User: "Document the changes"
   → Spawn documentation agents
   → Run in parallel with tests

7. User: "Review and create PRs"
   → Spawn review agents
   → Commit/push from main session
   → Create PRs via gh CLI
   → Update Linear status
```

---

## Metrics & Monitoring

### Agent Performance Tracking

```bash
# Count tool usage
grep -o '"name":"[^"]*"' /tmp/.../tasks/<agent-id>.output | sort | uniq -c

# Check duration
# Look for timestamps in output file
```

### Status Dashboard Template

| Ticket | Impl | Test | Docs | Review | PR |
|--------|------|------|------|--------|-----|
| AGENT-XXX | ✅ | 🔄 | 🔄 | ⏳ | ⏳ |
| AGENT-YYY | ✅ | ✅ | 🔄 | ⏳ | ⏳ |

**Legend:** ✅ Complete | 🔄 Running | ⏳ Pending | ❌ Failed

---

## Troubleshooting

### Husky Hooks Fail in Worktrees
```bash
git commit --no-verify -m "message"
```

### Remote/PR Creation Issues
Check remotes and use correct repo:
```bash
git remote -v
gh repo view --json nameWithOwner
gh pr create --repo the-answerai/theanswer ...
```

### Agent Stuck/Slow
Check output file for recent activity:
```bash
tail -50 /tmp/.../tasks/<agent-id>.output
```

### Worktree Conflicts
Reset or remove problematic worktree:
```bash
git worktree remove --force /path/to/worktree
```

---

## Best Practices

1. **Define all tasks before starting work** - No surprises mid-execution
2. **Use worktrees for isolation** - Parallel work without conflicts
3. **Spawn agents in single message** - True parallelism
4. **Monitor but don't micromanage** - Let agents complete
5. **Main session handles git/Linear** - Clean separation of concerns
6. **Batch similar operations** - All tests together, all docs together
7. **Update Linear throughout** - Keep tickets in sync with actual status
8. **Document the process** - Future reference and improvement
