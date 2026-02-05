---
description: Orchestrate parallel work with autonomous agents - tickets, tasks, or any goal
---

# Fleet Command

**YOU MUST use the `fleet-orchestrator` agent for all fleet operations.**

## Immediate Action

Based on the input, take ONE of these actions:

### Starting New Work (tickets or goal)

If input contains ticket IDs (AAI-###) OR a quoted goal string:

**MANDATORY: Launch the fleet-orchestrator agent:**

```yaml
Task:
  subagent_type: fleet-orchestrator
  description: "Orchestrate fleet work"
  prompt: |
    ## Fleet Request
    Input: {user's input}

    ## Your Workflow (FOLLOW EXACTLY)

    ### Step 1: Analyze & Plan
    - If tickets: Fetch each from Linear via mcp__linear__get_issue
    - If goal: Explore codebase to understand scope and decompose into parallel chunks

    ### Step 2: Create Task Breakdown (MANDATORY)
    For EACH work unit, create 5-10 tasks using TaskCreate:

    Example for ticket AAI-123:
    - TaskCreate: "[AAI-123] 1. Explore existing patterns"
    - TaskCreate: "[AAI-123] 2. Create service class"
    - TaskCreate: "[AAI-123] 3. Add route endpoint"
    - TaskCreate: "[AAI-123] 4. Update controller"
    - TaskCreate: "[AAI-123] 5. Add validation"
    - TaskCreate: "[AAI-123] 6. Add error handling"
    - TaskCreate: "[AAI-123] 7. Verify multi-tenancy"
    - TaskCreate: "[AAI-123] 8. Final review"

    ### Step 3: Show Plan & Get Approval
    Display the task breakdown and ask: "Proceed with this plan?"

    ### Step 4: Create Worktrees
    For each work unit:
    git worktree add -b {branch} /home/max/dev/theanswer-worktrees/{id} origin/staging

    ### Step 5: Spawn Worker Agents (PARALLEL)
    In a SINGLE message, spawn fleet-worker for each work unit:

    Task 1:
      subagent_type: fleet-worker
      run_in_background: true
      prompt: |
        Work Unit: {id}
        Worktree: /home/max/dev/theanswer-worktrees/{id}

        Your tasks:
        1. {task 1}
        2. {task 2}
        ...

        Update tasks via TaskUpdate as you complete each.
        Do NOT commit. Report completion with RESULT.

    Task 2: (parallel)
      ...

    ### Step 6: Report Status
    Show status table with agent IDs and output file paths.
```

### Checking Status (`/fleet` or `/fleet status`)

Check worktrees and task list:
```bash
# List worktrees
ls /home/max/dev/theanswer-worktrees/

# Check git status in each
for dir in /home/max/dev/theanswer-worktrees/*/; do
  echo "=== $(basename $dir) ==="
  cd "$dir" && git status --short
done
```

Then use TaskList to show progress.

### Running Subcommands

| Subcommand | Action |
|------------|--------|
| `test` | Spawn `ticket-tester` agents for completed worktrees |
| `docs` | Spawn `ticket-documenter` agents for completed worktrees |
| `verify` | Spawn `fleet-verifier` agent to validate all work |
| `push` | Commit, push, create PRs for all worktrees |
| `cleanup` | Remove worktrees: `git worktree remove {path}` |

For `test`, `docs`, `verify`: Launch appropriate agent with worktree context.

For `push`: Execute git operations directly (commit, push, gh pr create).

## Usage Examples

```bash
/fleet AAI-123 AAI-456              # Work on tickets
/fleet "refactor auth services"     # Goal-based work
/fleet                              # Check status
/fleet test                         # Add tests
/fleet verify                       # Validate
/fleet push                         # Create PRs
/fleet cleanup                      # Clean up
```

## Key Enforcement Rules

1. **ALWAYS use fleet-orchestrator** for new work (tickets/goals)
2. **ALWAYS create tasks** before spawning workers (5-10 per work unit)
3. **ALWAYS get approval** before creating worktrees
4. **ALWAYS spawn workers in parallel** (single message, multiple Task calls)
5. **Workers NEVER commit** - main session handles git

## Worktree Location

```
/home/max/dev/theanswer-worktrees/{work-unit-id}/
```
