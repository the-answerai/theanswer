---
name: fleet-monitoring
description: "Status tracking patterns for monitoring parallel agent execution"
---

# Fleet Monitoring Skill

This skill provides patterns for monitoring the status of parallel agents and worktrees during fleet operations.

## Purpose

Track and report on parallel agent progress:
- Monitor agent output files
- Check worktree git status
- Aggregate fleet-wide status
- Identify completed vs running vs failed agents

## Status States

### Agent States

| State | Description | Indicators |
|-------|-------------|------------|
| `pending` | Agent not yet spawned | No output file |
| `running` | Agent actively working | Output file growing, no RESULT |
| `complete` | Agent finished successfully | RESULT line in output |
| `failed` | Agent encountered error | Error in output, no RESULT |

### Worktree States

| State | Description | Indicators |
|-------|-------------|------------|
| `clean` | No changes | `git status --porcelain` empty |
| `modified` | Has uncommitted changes | Files in `git status` |
| `committed` | Changes committed locally | Commits ahead of staging |
| `pushed` | Pushed to remote | No commits ahead of origin |

## Monitoring Commands

### Check Agent Output

```bash
# Read last 100 lines of agent output
tail -100 {output_file}

# Check if agent completed
grep -q "RESULT:" {output_file} && echo "Complete" || echo "Running"

# Count tool invocations
grep -c '"tool_use"' {output_file}
```

### Check Worktree Status

```bash
# Get changed file count
cd {worktree_path} && git status --porcelain | wc -l

# Get diff summary
cd {worktree_path} && git diff --stat

# List modified files
cd {worktree_path} && git status --short
```

### Aggregate Fleet Status

```bash
# Check all worktrees
for dir in /home/max/dev/theanswer-worktrees/*/; do
  TICKET=$(basename "$dir")
  FILES=$(cd "$dir" && git status --porcelain | wc -l)
  echo "$TICKET: $FILES files changed"
done
```

## Status Report Format

### Detailed Status Table

```
Fleet Status Report
===================

| Ticket  | Agent    | Tools | Files | LOC   | Status      |
|---------|----------|-------|-------|-------|-------------|
| AAI-123 | a1b2c3d4 | 42    | 3     | +127  | Complete    |
| AAI-456 | e5f6g7h8 | 28    | 2     | +85   | Running     |
| AAI-789 | i9j0k1l2 | 15    | 0     | +0    | Exploring   |

Summary:
- Total tickets: 3
- Completed: 1
- Running: 2
- Failed: 0
```

### Progress Indicators

```
Completion: [=========>          ] 45%

AAI-123: Complete
AAI-456: Running  (28 tools used)
AAI-789: Exploring (15 tools used)
```

## Metrics Collection

### Tool Usage Metrics

```bash
# Count by tool type
grep -o '"name":"[^"]*"' {output_file} | \
  sed 's/"name":"//;s/"//' | \
  sort | uniq -c | sort -rn

# Example output:
#   12 Read
#    8 Grep
#    6 Edit
#    4 Write
#    2 Bash
```

### File Change Metrics

```bash
# Lines changed
cd {worktree_path} && git diff --numstat | \
  awk '{added+=$1; deleted+=$2} END {print "+"added" -"deleted}'

# Files by type
cd {worktree_path} && git status --porcelain | \
  sed 's/^...//' | \
  xargs -I{} basename {} | \
  sed 's/.*\.//' | \
  sort | uniq -c
```

### Time Metrics

```bash
# Agent runtime (if timestamps in output)
head -1 {output_file}  # Start time
tail -1 {output_file}  # Current/end time
```

## Completion Detection

### Agent Completion

An agent is considered complete when:
1. Output file contains "RESULT:" line
2. Final summary message present
3. No tool calls in last N lines

```bash
# Check for completion marker
if grep -q "RESULT:" {output_file}; then
  echo "Agent completed"
  # Extract result
  grep -A 50 "RESULT:" {output_file}
fi
```

### Phase Completion

A phase is complete when all agents in that phase are complete:

```bash
# Check all agents in phase
COMPLETE=true
for output_file in "${AGENT_OUTPUTS[@]}"; do
  if ! grep -q "RESULT:" "$output_file"; then
    COMPLETE=false
    break
  fi
done
```

## Error Detection

### Common Error Patterns

```bash
# Check for errors in output
grep -i "error\|failed\|exception" {output_file}

# Check for tool failures
grep '"error":' {output_file}
```

### Error Categorization

| Error Type | Pattern | Action |
|------------|---------|--------|
| File not found | `ENOENT` | Check path |
| Permission denied | `EACCES` | Check permissions |
| Git conflict | `CONFLICT` | Manual resolution |
| API error | `StatusCode: 4xx/5xx` | Retry or escalate |

## Integration with Fleet Commands

### `/fleet-status` Usage

```yaml
# Fetch all worktree statuses
worktrees = list_worktrees()

# Fetch all agent statuses
for ticket in worktrees:
  agent_output = read_agent_output(ticket.agent_id)
  git_status = check_git_status(ticket.worktree_path)

  report.add_row(
    ticket=ticket.id,
    agent=ticket.agent_id,
    tools=count_tools(agent_output),
    files=count_files(git_status),
    status=determine_status(agent_output, git_status)
  )

# Display report
display_status_table(report)
```

### Status Persistence

Track status across commands:
```yaml
# Store in memory or temp file
fleet_state:
  tickets:
    AAI-123:
      worktree: /home/max/dev/theanswer-worktrees/AAI-123
      branch: feature/AAI-123-oauth-refresh
      agent_id: a1b2c3d4
      output_file: /tmp/.../a1b2c3d4.output
      status: complete
    AAI-456:
      worktree: /home/max/dev/theanswer-worktrees/AAI-456
      branch: feature/AAI-456-rate-limiting
      agent_id: e5f6g7h8
      output_file: /tmp/.../e5f6g7h8.output
      status: running
```

## Best Practices

1. **Poll periodically**: Don't check status too frequently
2. **Cache results**: Avoid redundant file reads
3. **Aggregate smartly**: Summary first, details on demand
4. **Handle missing data**: Agent may not have output yet
5. **Clear indicators**: Use emojis or symbols for quick scanning

## Status Symbols

```
Complete   Running   Pending   Failed
   [U+2705]          [U+D83D][U+DD04]        [U+23F3]         [U+274C]
```

## Quality Checks

Before reporting status:
- [ ] All worktree paths valid
- [ ] Agent output files accessible
- [ ] Git status commands succeed
- [ ] Metrics calculated correctly

After status report:
- [ ] All tickets accounted for
- [ ] Status reflects actual state
- [ ] Next steps clear to user
