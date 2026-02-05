---
name: fleet-patterns
description: "Patterns for parallel work: worktrees, task tracking, and git operations"
---

# Fleet Patterns

Consolidated patterns for the `/fleet` command.

## Worktree Management

### Location
```
/home/max/dev/theanswer-worktrees/{id}/
```

### Create Worktree
```bash
mkdir -p /home/max/dev/theanswer-worktrees
git fetch origin staging
git worktree add -b feature/{id}-{slug} /home/max/dev/theanswer-worktrees/{id} origin/staging
```

### List Worktrees
```bash
git worktree list
ls /home/max/dev/theanswer-worktrees/
```

### Check Worktree Status
```bash
cd /home/max/dev/theanswer-worktrees/{id}
git status --short
git diff --stat
```

### Remove Worktree
```bash
git worktree remove /home/max/dev/theanswer-worktrees/{id}
# or force:
git worktree remove --force /home/max/dev/theanswer-worktrees/{id}
```

### Cleanup All
```bash
for dir in /home/max/dev/theanswer-worktrees/*/; do
  git worktree remove "$dir" --force
done
```

## Task Tracking

### Create Tasks
```
TaskCreate:
  subject: "[AAI-123] 1. Task description"
  description: "Detailed description of what to do"
  activeForm: "Doing the task"
```

### Update Task Status
```
TaskUpdate:
  taskId: "X"
  status: "in_progress" | "completed"
```

### List Tasks
```
TaskList
```

## Parallel Agent Spawning

### Key Rule
Spawn ALL agents in ONE message for true parallelism.

### Pattern
```yaml
# Single message with multiple Task calls:

Task:
  subagent_type: fleet-worker
  description: "Work on AAI-123"
  run_in_background: true
  prompt: |
    ID: AAI-123
    Worktree: /home/max/dev/theanswer-worktrees/AAI-123
    Tasks: [list]

Task:
  subagent_type: fleet-worker
  description: "Work on AAI-456"
  run_in_background: true
  prompt: |
    ID: AAI-456
    Worktree: /home/max/dev/theanswer-worktrees/AAI-456
    Tasks: [list]
```

## Git Operations (Post-Completion)

### Commit
```bash
cd /home/max/dev/theanswer-worktrees/{id}
git add -A
git commit -m "feat({id}): description

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Push
```bash
git push -u origin $(git branch --show-current)
```

### Create PR
```bash
gh pr create --base staging --title "feat({id}): title" --body "## Summary
...
## Linear
{id}"
```

## Verification Checks

### Console.log
```bash
git diff --name-only | xargs grep -l "console.log" 2>/dev/null
```

### TODOs
```bash
git diff --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null
```

### TheAnswer Patterns
Check for:
- `organizationId` in database queries
- `enforceAbility` on route handlers
- `InternalFlowiseError` for errors
- `tags: ['AAI']` in components

## Branch Naming

```
feature/{ticket-id}-{short-description}
fleet/{task-id}-{short-description}
```

Examples:
- `feature/AAI-123-oauth-refresh`
- `fleet/task-1-auth-logging`
