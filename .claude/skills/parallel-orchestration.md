---
name: parallel-orchestration
description: "Patterns for coordinating parallel agent execution across multiple tickets"
---

# Parallel Orchestration Skill

This skill provides patterns for spawning and coordinating multiple agents working in parallel on different tickets.

## Purpose

Enable true parallel execution of multiple implementation agents:
- Spawn agents simultaneously using Task tool
- Track agent progress via output files
- Coordinate completion and handoffs
- Maximize development throughput

## Core Concepts

### Agent Spawning

**Key insight:** Multiple agents can run in parallel by including multiple Task tool calls in a single message.

```
# Single message with multiple Task calls = parallel execution
Task(ticket-implementer, AAI-123, run_in_background: true)
Task(ticket-implementer, AAI-456, run_in_background: true)
Task(ticket-implementer, AAI-789, run_in_background: true)
```

### Background Execution

All parallel agents should use `run_in_background: true`:
- Agent executes asynchronously
- Returns immediately with output file path
- Progress can be checked via output file
- Main session continues without blocking

### Output File Location

Agent output files are stored at:
```
/tmp/claude-1000/.../tasks/{agent-id}.output
```

The exact path is returned when spawning with `run_in_background: true`.

## Spawning Patterns

### Spawn Multiple Implementation Agents

```yaml
# In a single message, spawn multiple agents:

Task 1:
  subagent_type: ticket-implementer
  prompt: |
    Implement ticket AAI-123 in worktree at /home/max/dev/theanswer-worktrees/AAI-123

    Ticket details:
    - Title: Add OAuth2 token refresh
    - Description: [full description]
    - Acceptance criteria: [criteria]

    IMPORTANT:
    - Work ONLY in the worktree path
    - DO NOT commit or push (main session handles this)
    - Report completion with summary of changes
  run_in_background: true

Task 2:
  subagent_type: ticket-implementer
  prompt: |
    Implement ticket AAI-456 in worktree at /home/max/dev/theanswer-worktrees/AAI-456
    [... similar structure ...]
  run_in_background: true
```

### Track Agent IDs

Store agent IDs for later status checks and resumption:
```
| Ticket | Agent ID | Output File | Status |
|--------|----------|-------------|--------|
| AAI-123 | a1b2c3d4 | /tmp/.../a1b2c3d4.output | running |
| AAI-456 | e5f6g7h8 | /tmp/.../e5f6g7h8.output | running |
```

## Monitoring Patterns

### Check Agent Progress

```bash
# Read recent output from agent
tail -100 /tmp/claude-1000/.../tasks/{agent-id}.output

# Check if agent is still running
# (Look for final summary or "RESULT:" marker)
grep -l "RESULT:" /tmp/claude-1000/.../tasks/{agent-id}.output
```

### Count Tool Usage

```bash
# Count tool invocations to gauge progress
grep -o '"name":"[^"]*"' {output_file} | sort | uniq -c | sort -rn
```

### Check Completion

Agent completion indicators:
- "RESULT:" line in output
- Final summary message
- No new output for extended period

## Coordination Patterns

### Phase-Based Execution

Execute agents in phases where later phases depend on earlier:

```
Phase 1: Implementation (parallel)
├── ticket-implementer AAI-123
├── ticket-implementer AAI-456
└── ticket-implementer AAI-789
    ↓ (wait for completion)
Phase 2: Testing (parallel)
├── ticket-tester AAI-123
├── ticket-tester AAI-456
└── ticket-tester AAI-789
    ↓ (wait for completion)
Phase 3: Documentation (parallel)
├── ticket-documenter AAI-123
├── ticket-documenter AAI-456
└── ticket-documenter AAI-789
```

### Status Aggregation

Aggregate status from all agents:
```
Fleet Status:
- Total: 3 tickets
- Completed: 1
- Running: 2
- Pending: 0
```

### Handoff Context

When spawning follow-up agents (testers, documenters), include context from previous phase:

```yaml
Task:
  subagent_type: ticket-tester
  prompt: |
    Create tests for ticket AAI-123 implementation.

    Worktree: /home/max/dev/theanswer-worktrees/AAI-123

    Implementation Summary (from previous agent):
    - Added OAuth2TokenRefreshService in packages/server/src/services/
    - Modified AuthMiddleware to check token expiry
    - Added refresh endpoint at /api/v1/auth/refresh

    Create focused BDD test for the token refresh functionality.
```

## Error Handling

### Agent Failure

If an agent fails:
1. Check output file for error messages
2. Identify root cause
3. Options:
   - Resume agent with more context
   - Spawn new agent with fixes
   - Flag for manual intervention

### Partial Completion

If some agents complete and others fail:
1. Proceed with completed work
2. Handle failed agents separately
3. Don't block successful PRs

## Main Session Responsibilities

The main session (not agents) handles:
- Git operations (commit, push, PR creation)
- Linear status updates
- Cross-ticket coordination
- Final review and approval

**Agents should NEVER:**
- Commit changes
- Push to remote
- Create PRs
- Update Linear tickets directly

## Integration with Fleet Commands

This skill is used by:
- `/fleet-start`: Spawns implementation agents in parallel
- `/fleet-status`: Monitors running agents
- `/fleet-test`: Spawns test agents for completed implementations
- `/fleet-push`: Coordinates final git operations

## Best Practices

1. **True parallelism**: Always spawn multiple agents in a single message
2. **Background execution**: Use `run_in_background: true` for async agents
3. **Clear boundaries**: Agents work in isolated worktrees
4. **Main controls git**: Only main session does git operations
5. **Phase coordination**: Wait for phase completion before starting next
6. **Error isolation**: One agent failure shouldn't block others

## Quality Checks

Before spawning parallel agents:
- [ ] All worktrees created and ready
- [ ] Ticket details fetched for each
- [ ] Clear prompts for each agent
- [ ] Output tracking mechanism in place

After agents complete:
- [ ] All agents returned successfully
- [ ] Changes present in each worktree
- [ ] No conflicts between worktrees
- [ ] Ready for commit/push phase
