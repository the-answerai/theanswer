---
description: Parallel work orchestration - tickets, goals, or any task
---

# /fleet - Parallel Work Orchestration

You ARE the orchestrator. Do not delegate to another agent for orchestration.

## Quick Reference

```bash
/fleet AAI-123 AAI-456          # Work on tickets in parallel
/fleet "add logging to routes"  # Any goal, auto-decomposed
/fleet                          # Check status
/fleet test                     # Add tests to completed work
/fleet push                     # Commit and create PRs
/fleet cleanup                  # Remove worktrees
```

---

## Handle Based on Input

### Input: Ticket IDs (AAI-###) or Goal String

Execute this workflow directly:

**Step 1: Gather Context**

For tickets:
```
Use mcp__linear__get_issue for each ticket ID
Extract: title, description, acceptance criteria
```

For goals:
```
Explore codebase to understand scope
Decompose into 2-5 independent chunks (by file/folder/feature)
Each chunk = one worker
```

**Step 2: Create Task Breakdown (MANDATORY)**

For EACH work unit, create 5-10 tasks using TaskCreate:

```
TaskCreate(subject="[AAI-123] 1. Explore existing patterns", description="...", activeForm="Exploring patterns")
TaskCreate(subject="[AAI-123] 2. Create service class", description="...", activeForm="Creating service")
TaskCreate(subject="[AAI-123] 3. Add route endpoint", description="...", activeForm="Adding endpoint")
TaskCreate(subject="[AAI-123] 4. Update controller", description="...", activeForm="Updating controller")
TaskCreate(subject="[AAI-123] 5. Add validation", description="...", activeForm="Adding validation")
TaskCreate(subject="[AAI-123] 6. Add error handling", description="...", activeForm="Adding errors")
TaskCreate(subject="[AAI-123] 7. Verify patterns", description="...", activeForm="Verifying")
```

**Step 3: Show Plan & Get Approval**

Display:
```
## Fleet Plan

### AAI-123: [title]
1. □ Explore existing patterns
2. □ Create service class
3. □ Add route endpoint
...

### AAI-456: [title]
1. □ ...

Proceed? (You can modify tasks first)
```

**WAIT for user approval.**

**Step 4: Create Worktrees**

```bash
mkdir -p /home/max/dev/theanswer-worktrees
git fetch origin staging

# For each work unit:
git worktree add -b feature/{id}-{slug} /home/max/dev/theanswer-worktrees/{id} origin/staging
```

**Step 5: Spawn Workers (PARALLEL)**

In ONE message, spawn all workers:

```yaml
Task:
  subagent_type: fleet-worker
  description: "Work on AAI-123"
  run_in_background: true
  prompt: |
    ## Your Assignment
    ID: AAI-123
    Title: [title]
    Worktree: /home/max/dev/theanswer-worktrees/AAI-123

    ## Tasks (update via TaskUpdate as you complete)
    1. Explore existing patterns
    2. Create service class
    3. Add route endpoint
    4. Update controller
    5. Add validation
    6. Add error handling
    7. Verify patterns

    ## Rules
    - Work ONLY in your worktree
    - Follow TheAnswer patterns (organizationId, enforceAbility, InternalFlowiseError)
    - Do NOT commit
    - End with RESULT summary

Task:
  subagent_type: fleet-worker
  description: "Work on AAI-456"
  run_in_background: true
  prompt: |
    ...
```

**Step 6: Report**

```
## Fleet Launched

| ID | Worktree | Status |
|----|----------|--------|
| AAI-123 | .../AAI-123 | Running |
| AAI-456 | .../AAI-456 | Running |

Use `/fleet` to check progress.
```

---

### Input: Nothing or "status"

Check progress:

1. Run `TaskList` to show task status
2. Check worktrees:
```bash
for dir in /home/max/dev/theanswer-worktrees/*/; do
  echo "$(basename $dir): $(cd $dir && git status --short | wc -l) files changed"
done
```

---

### Input: "test"

Spawn workers to add tests:

1. List worktrees with changes
2. For each, spawn fleet-worker:
```yaml
Task:
  subagent_type: fleet-worker
  prompt: |
    ## Your Assignment
    Goal: Add tests for the implementation
    Worktree: /home/max/dev/theanswer-worktrees/{id}

    1. Read the changed files to understand what was implemented
    2. Find existing test patterns in the codebase
    3. Create ONE focused test file
    4. Do NOT commit
```

---

### Input: "verify"

Run verification directly (no agent needed):

For each worktree:
```bash
cd {worktree}

# Check for issues
git diff --name-only | while read file; do
  # Check for console.log
  grep -n "console.log" "$file" && echo "⚠️ console.log in $file"
  # Check for TODO
  grep -n "TODO\|FIXME" "$file" && echo "⚠️ TODO in $file"
done

# Check TheAnswer patterns in new/modified .ts files
# - organizationId in queries
# - enforceAbility on routes
```

Report:
```
## Verification

| ID | Files | Issues |
|----|-------|--------|
| AAI-123 | 3 | ✅ None |
| AAI-456 | 2 | ⚠️ 1 console.log |
```

---

### Input: "push"

Commit and create PRs directly:

For each worktree with changes:
```bash
cd {worktree}
BRANCH=$(git branch --show-current)
ID=$(basename $(pwd))

# Commit
git add -A
git commit -m "feat($ID): implement changes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push
git push -u origin $BRANCH

# Create PR
gh pr create --base staging --title "feat($ID): [title]" --body "## Summary
[description]

## Linear
$ID
"
```

Update Linear to "In Review" via `mcp__linear__update_issue`.

---

### Input: "cleanup"

Remove worktrees:
```bash
for dir in /home/max/dev/theanswer-worktrees/*/; do
  git worktree remove "$dir" --force
done
rmdir /home/max/dev/theanswer-worktrees 2>/dev/null
```

---

## Worktree Location

```
/home/max/dev/theanswer-worktrees/{work-unit-id}/
```

## Key Rules

1. **You orchestrate directly** - don't spawn an orchestrator agent
2. **Always create tasks first** - 5-10 per work unit
3. **Always get approval** - before creating worktrees
4. **Spawn workers in parallel** - single message, multiple Task calls
5. **Workers never commit** - you handle git operations
