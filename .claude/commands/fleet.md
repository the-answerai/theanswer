---
description: Parallel work orchestration - tickets, goals, or any task
---

# /fleet - Parallel Work Orchestration

You ARE the orchestrator (team lead). Do not delegate orchestration to another agent.

## Quick Reference

```bash
/fleet AAI-123 AAI-456          # Work on tickets in parallel
/fleet "add logging to routes"  # Any goal, auto-decomposed
/fleet                          # Check status
/fleet test                     # Add tests to completed work
/fleet verify                   # Review code quality (spawns reviewers)
/fleet push                     # Commit and create PRs
/fleet cleanup                  # Remove worktrees and tear down team
```

## Execution Mode

Fleet supports two modes. Detect which to use:

- **Agent Teams mode**: If the Teammate and SendMessage tools are available (requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings). Preferred — teammates are full Claude Code sessions that can communicate.
- **Subagent mode** (fallback): Use the Task tool with fleet agents. Works without Agent Teams enabled.

## Fleet Roles

| Role | Agent | Model | Skills | Purpose |
|------|-------|-------|--------|---------|
| **Implementer** | `fleet-implementer` | Sonnet | theanswer-patterns, error-handling, fleet-patterns | Write production code |
| **Reviewer** | `fleet-reviewer` | Haiku | pr-review-workflow, theanswer-patterns, error-handling | Review code (read-only) |
| **Tester** | `fleet-tester` | Sonnet | theanswer-patterns, fleet-patterns | Write focused tests |
| **Architect** | `fleet-architect` | Opus | theanswer-patterns, error-handling | Plan before implementing (plan mode) |

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

### Mode: Agent Teams / Subagent (auto-detected)
### Roles: Implementer (default) | Architect → Implementer (complex tickets)

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

**Step 5: Spawn Workers**

#### Agent Teams Mode (preferred)

Create an agent team and spawn one **fleet-implementer** teammate per work unit:

```
Create an agent team called "fleet-{timestamp}" for parallel ticket implementation.

For each work unit, spawn a teammate:
- Name: impl-{id} (e.g., impl-AAI-123)
- Role: fleet-implementer
- Model: Sonnet
- Prompt:
  "You are a fleet implementer working on ticket {id}: {title}.

   ## Your Worktree
   Work ONLY in: /home/max/dev/theanswer-worktrees/{id}
   Branch: feature/{id}-{slug}

   ## Your Tasks
   Claim tasks prefixed with [{id}] from the shared task list.
   Use TaskList to find unclaimed tasks, then TaskUpdate to claim (in_progress) and complete them.
   When you finish a task, check TaskList for the next unclaimed [{id}] task.

   ## Communication
   - Message the lead when you complete all your tasks
   - Message the lead if you are blocked or need clarification
   - Message other teammates if your work overlaps with theirs

   ## Rules
   - Work ONLY in your worktree — never touch files outside it
   - Do NOT commit or push — the lead handles all git operations
   - No TODOs or placeholders — be complete
   - Follow existing code patterns in the codebase"
```

For **complex tickets** (large scope, architectural decisions needed), spawn a **fleet-architect** first:
```
Spawn an architect teammate with plan approval required:
- Name: arch-{id}
- Role: fleet-architect
- Model: Opus
- Prompt: "Plan the implementation for ticket {id}: {title}. Explore the codebase,
   identify patterns, and design the implementation approach.
   Worktree: /home/max/dev/theanswer-worktrees/{id}"

After architect's plan is approved, spawn a fleet-implementer to execute it.
```

After spawning all teammates:
- Enter delegate mode — you (the lead) only coordinate, never implement code
- Monitor teammate progress via the shared task list and incoming messages
- Steer teammates if they go off track by messaging them directly
- When all teammates report completion, proceed to the report step

#### Subagent Mode (fallback)

In ONE message, spawn all workers using **fleet-implementer**:

```yaml
Task:
  subagent_type: fleet-implementer
  description: "Implement AAI-123"
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
    ...

    ## Rules
    - Work ONLY in your worktree
    - Do NOT commit
    - End with RESULT summary

Task:
  subagent_type: fleet-implementer
  description: "Implement AAI-456"
  run_in_background: true
  prompt: |
    ...
```

**Step 6: Report**

```
## Fleet Launched

| ID | Worktree | Role | Mode | Status |
|----|----------|------|------|--------|
| AAI-123 | .../AAI-123 | Implementer | Teams/Subagent | Running |
| AAI-456 | .../AAI-456 | Implementer | Teams/Subagent | Running |

Use `/fleet` to check progress.
```

---

### Input: Nothing or "status"

Check progress:

1. Run `TaskList` to show task status

2. **Agent Teams mode**: Check teammate status — are they active, idle, or finished? Review any pending messages.

3. **Subagent mode**: Check worktrees:
```bash
for dir in /home/max/dev/theanswer-worktrees/*/; do
  echo "$(basename $dir): $(cd $dir && git status --short | wc -l) files changed"
done
```

---

### Input: "test"

Spawn **fleet-tester** agents for each work unit:

1. List worktrees with changes

2. **Agent Teams mode**: Spawn test teammates:
```
For each work unit with changes, spawn a teammate:
- Name: tester-{id}
- Role: fleet-tester
- Model: Sonnet
- Prompt: "Add tests for the implementation in /home/max/dev/theanswer-worktrees/{id}.
   Read changed files, find existing test patterns, create ONE focused test file.
   Do NOT commit."
```

3. **Subagent mode**: Spawn fleet-tester subagents:
```yaml
Task:
  subagent_type: fleet-tester
  run_in_background: true
  prompt: |
    Worktree: /home/max/dev/theanswer-worktrees/{id}
    Read changed files, find existing test patterns, create ONE focused test file.
    Do NOT commit.
```

---

### Input: "verify"

Spawn **fleet-reviewer** agents for each work unit:

1. List worktrees with changes

2. **Agent Teams mode**: Spawn reviewer teammates:
```
For each work unit with changes, spawn a teammate:
- Name: reviewer-{id}
- Role: fleet-reviewer
- Model: Haiku
- Prompt: "Review the implementation in /home/max/dev/theanswer-worktrees/{id}.
   Check for security, multi-tenancy, error handling, and code quality.
   Report findings to the lead. Do NOT modify any files."
```

3. **Subagent mode**: Spawn fleet-reviewer subagents:
```yaml
Task:
  subagent_type: fleet-reviewer
  run_in_background: true
  prompt: |
    Worktree: /home/max/dev/theanswer-worktrees/{id}
    Review for security, multi-tenancy, error handling, code quality.
    Report findings. Do NOT modify files.
```

4. Collect and summarize all reviewer findings:
```
## Verification

| ID | Reviewer | Critical | Major | Minor |
|----|----------|----------|-------|-------|
| AAI-123 | reviewer-AAI-123 | 0 | 1 | 2 |
| AAI-456 | reviewer-AAI-456 | 1 | 0 | 1 |
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

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

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

Tear down everything:

1. **Agent Teams mode** (do these first):
   - Ask each teammate to shut down gracefully
   - Wait for teammates to confirm shutdown
   - Clean up the team

2. **Both modes** — remove worktrees:
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

1. **You orchestrate directly** — don't spawn an orchestrator agent
2. **Always create tasks first** — 5-10 per work unit
3. **Always get approval** — before creating worktrees
4. **Prefer Agent Teams** — use if Teammate tool is available
5. **Use the right role** — implementer (default), tester (/fleet test), reviewer (/fleet verify), architect (complex)
6. **Worktree per worker** — each worker gets isolated worktree (prevents file conflicts)
7. **Delegate mode in Agent Teams** — lead never implements, only coordinates
8. **Workers never commit** — you (the lead) handle all git operations
9. **Spawn workers in parallel** — all at once, whether teammates or subagents
