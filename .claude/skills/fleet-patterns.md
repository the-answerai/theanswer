---
name: fleet-patterns
description: "Patterns for parallel work: worktrees, task tracking, agent teams, and git operations"
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

## Agent Teams Management

Use when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is enabled and SpawnTeammate/SendMessage tools are available.

### Create Fleet Team
```
Create an agent team called "fleet-{timestamp}".
Team purpose: parallel ticket implementation with isolated worktrees.
```

### Spawn Teammate per Worktree
```
Spawn a teammate:
- Name: worker-{id}
- Model: Sonnet
- Prompt: instructions including worktree path, task prefix, patterns, communication rules
```

Each teammate is a full Claude Code session that:
- Loads CLAUDE.md and project context automatically
- Has access to all tools
- Can message the lead and other teammates
- Self-claims tasks from the shared task list

### Delegate Mode
After spawning all teammates, enter delegate mode:
- Lead only coordinates — never implements code directly
- Lead monitors via shared task list and incoming messages
- Lead steers teammates by messaging them if they go off track
- Lead handles all git operations (commit, push, PR)

### Teammate Communication

**Lead → specific teammate** (steering):
```
Message worker-AAI-123: "Focus on the service layer first, the route can wait."
```

**Lead → all teammates** (broadcast):
```
Broadcast: "Reminder: all database queries must filter by organizationId."
```
Use broadcast sparingly — costs scale with team size.

**Teammate → lead** (status):
Teammates message the lead when:
- All their tasks are complete
- They are blocked or need clarification
- They discover something that affects other work units

**Teammate → teammate** (coordination):
Teammates message each other when:
- Their work overlaps (e.g., shared utility files)
- They discover a pattern another teammate should follow
- They need to coordinate on a shared interface

### Task Self-Claiming

In Agent Teams mode, teammates claim tasks from the shared pool:

1. Teammate runs `TaskList` to find unclaimed tasks matching their prefix (e.g., `[AAI-123]`)
2. Teammate runs `TaskUpdate(taskId="X", status="in_progress", owner="worker-AAI-123")` to claim
3. Teammate completes the task and runs `TaskUpdate(taskId="X", status="completed")`
4. Teammate checks `TaskList` again for the next unclaimed task
5. When no unclaimed tasks remain, teammate messages the lead

### Shut Down Teammates
```
Ask worker-AAI-123 to shut down.
```
Teammate can approve (exits gracefully) or reject with explanation.
Always shut down ALL teammates before cleaning up the team.

### Clean Up Team
```
Clean up the team.
```
Only the lead should run cleanup. Fails if teammates are still active.

### Plan Approval (optional)

For complex tickets, require teammates to plan before implementing:
```
Spawn worker-AAI-123 with plan approval required.
Prompt: "Plan the implementation for ticket AAI-123 before making changes."
```

Lead reviews the plan when submitted:
- Approve: teammate exits plan mode and implements
- Reject with feedback: teammate revises and resubmits

## Parallel Agent Spawning (Subagent Fallback)

Used when Agent Teams is not available.

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

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
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
