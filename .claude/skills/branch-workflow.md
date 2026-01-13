---
name: branch-workflow
description: "Git branch validation, creation, and lifecycle management"
---

# Branch Workflow Skill

Patterns for the complete branch lifecycle: validation, protection enforcement, and Linear status synchronization.

> For detailed branch creation steps, see the [git-branch skill](git-branch.md).

## Purpose

- Validate current branch before operations
- Block operations on protected branches
- Extract and verify Linear ticket IDs
- Synchronize with Linear ticket status

## Protected Branches

**NEVER allow direct commits or operations on:**

| Branch | Purpose |
|--------|---------|
| `staging` | Integration branch, receives PRs |
| `main` | Production deployment |
| `production` | Production deployment (alias) |
| `master` | Legacy production |
| `develop` | Development integration |

## Branch Naming Convention

```
{type}/{ticket-id}-{sanitized-title}
```

**Types:** `feature/`, `fix/`, `chore/`, `docs/`, `test/`, `perf/`, `style/`

**Examples:**
```
feature/AAI-123-add-oauth2-support
fix/AAI-456-resolve-memory-leak
chore/AAI-789-update-dependencies
```

## Workflow Patterns

### Pattern 1: Pre-Operation Validation

**ALWAYS run before commit/push operations:**

```bash
validate_branch() {
  local current_branch=$(git branch --show-current)

  # Check protected branches
  case "$current_branch" in
    staging|main|production|master|develop)
      echo "ERROR: Cannot work on protected branch: $current_branch"
      echo "Use /ticket-start to create feature branch"
      return 1
      ;;
  esac

  # Extract ticket ID
  local ticket_id=$(echo "$current_branch" | grep -oE '[A-Z]+-[0-9]+')

  if [[ -z "$ticket_id" ]]; then
    echo "ERROR: No ticket ID in branch name: $current_branch"
    echo "Use /ticket-create to create tracked work"
    return 1
  fi

  # Verify ticket exists
  if ! mcp__linear__get_issue --id "$ticket_id" &>/dev/null; then
    echo "ERROR: Ticket $ticket_id not found in Linear"
    return 1
  fi

  echo "Branch validated: $current_branch (Ticket: $ticket_id)"
  return 0
}
```

### Pattern 2: Ticket ID Extraction

```bash
# Extract from branch: feature/AAI-123-description -> AAI-123
ticket_id=$(echo "$current_branch" | grep -oE '[A-Z]+-[0-9]+')

if [[ -z "$ticket_id" ]]; then
  echo "No Linear ticket ID found in branch name"
  echo "Expected pattern: {type}/AAI-###-description"
  exit 1
fi
```

### Pattern 3: Linear Status Synchronization

> For detailed status sync patterns and MCP commands, see the [ticket-status-sync skill](ticket-status-sync.md).

**Status Flow:**
- Branch Created → "In Progress"
- PR Created → "In Review"
- PR Merged → "Done"

**Always ask user permission before updating Linear status.**

### Pattern 4: Branch Cleanup

```bash
cleanup_merged_branch() {
  local branch_name="$1"

  # Switch away if on the branch
  if [[ "$(git branch --show-current)" == "$branch_name" ]]; then
    git checkout staging && git pull origin staging
  fi

  # Delete local and remote
  git branch -d "$branch_name"
  git push origin --delete "$branch_name"
}
```

## Branch Lifecycle Summary

```bash
# 1. Start work
/ticket-start AAI-123
# -> Creates branch, updates Linear to "In Progress"

# 2. Make changes
git add . && /commit "add feature"
# -> Validates branch, creates commit

# 3. Push and create PR
/push
# -> Updates Linear to "In Review", creates PR

# 4. After merge
git branch -d feature/AAI-123-...
# -> Linear auto-updates to "Done"
```

## Error Messages

### Protected Branch Error

```
FATAL: Cannot commit to protected branch

Current branch: staging

Next steps:
  1. Use /ticket-start AAI-XXX to create feature branch
  2. Or use /ticket-create if no ticket exists
```

### Missing Ticket ID Error

```
No Linear ticket ID in branch name

Current branch: my-feature-branch
Expected pattern: {type}/AAI-###-description

Options:
  1. Create ticket: /ticket-create
  2. Start ticket work: /ticket-start AAI-XXX
  3. Rename branch: git branch -m feature/AAI-XXX-description
```

### Ticket Not Found Error

```
Ticket AAI-999 not found in Linear

Options:
  1. Create new ticket: /ticket-create
  2. Fix branch name to match existing ticket
  3. Verify ticket access in Linear
```

## Integration

**Used by commands:**
- `/ticket-start` - Branch creation from ticket
- `/push` - Branch validation before operations
- `/commit` - Branch validation before commit

**Used by agents:**
- `linear-ticket-planner` - Creates branches after planning
- `git-pr-manager` - Validates branches before PR creation

## Configuration

Per CLAUDE.md:
- Base branch: `staging` (not main)
- Protected: staging, main, production, master, develop
- Always sync Linear status with branch operations
- Always ask permission before Linear updates
