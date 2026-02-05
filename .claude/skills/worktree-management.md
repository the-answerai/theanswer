---
name: worktree-management
description: "Git worktree patterns for parallel development on multiple tickets"
---

# Worktree Management Skill

This skill provides patterns for managing git worktrees to enable parallel development across multiple Linear tickets.

## Purpose

Enable isolated development environments for each ticket:
- Each ticket gets its own directory with full git history
- Parallel work without branch switching
- Clean separation of concerns
- Easy cleanup after PRs merge

## Worktree Directory Convention

```
/home/max/dev/theanswer-worktrees/
├── AAI-123/                    # Worktree for ticket AAI-123
├── AAI-456/                    # Worktree for ticket AAI-456
└── AAI-789/                    # Worktree for ticket AAI-789
```

**Base path:** `/home/max/dev/theanswer-worktrees`
**Naming:** Ticket ID (e.g., `AAI-123`)

## Core Operations

### 1. Create Worktree

```bash
# Ensure base directory exists
mkdir -p /home/max/dev/theanswer-worktrees

# Create worktree with new branch from staging
git worktree add -b feature/AAI-123-description /home/max/dev/theanswer-worktrees/AAI-123 staging
```

**Parameters:**
- `-b feature/AAI-123-description`: Create new branch
- `/home/max/dev/theanswer-worktrees/AAI-123`: Worktree path
- `staging`: Base branch

### 2. List Worktrees

```bash
git worktree list
```

**Output format:**
```
/home/max/dev/theanswer           abc1234 [staging]
/home/max/dev/theanswer-worktrees/AAI-123  def5678 [feature/AAI-123-description]
/home/max/dev/theanswer-worktrees/AAI-456  ghi9012 [feature/AAI-456-description]
```

### 3. Check Worktree Status

```bash
# Check git status in worktree
cd /home/max/dev/theanswer-worktrees/AAI-123 && git status --porcelain

# Check diff summary
cd /home/max/dev/theanswer-worktrees/AAI-123 && git diff --stat

# Check files changed
cd /home/max/dev/theanswer-worktrees/AAI-123 && git status --short
```

### 4. Remove Worktree

```bash
# Remove worktree (after PR merged)
git worktree remove /home/max/dev/theanswer-worktrees/AAI-123

# Force remove (if uncommitted changes)
git worktree remove --force /home/max/dev/theanswer-worktrees/AAI-123
```

### 5. Prune Stale Worktrees

```bash
# Clean up stale worktree references
git worktree prune
```

## Workflow Patterns

### Create Worktree for Ticket

1. **Fetch ticket details** to get sanitized branch name
2. **Create worktree directory** with ticket ID
3. **Create new branch** from staging
4. **Verify worktree** is ready

```bash
# Full creation flow
TICKET_ID="AAI-123"
BRANCH_NAME="feature/AAI-123-add-oauth-support"
WORKTREE_PATH="/home/max/dev/theanswer-worktrees/$TICKET_ID"

# Ensure staging is up to date
git fetch origin staging

# Create worktree
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/staging

# Verify
ls -la "$WORKTREE_PATH"
```

### Check All Worktrees Status

```bash
# List all worktrees with status
for worktree in /home/max/dev/theanswer-worktrees/*/; do
  echo "=== $(basename $worktree) ==="
  cd "$worktree" && git status --short
done
```

### Cleanup After PR Merge

```bash
TICKET_ID="AAI-123"
WORKTREE_PATH="/home/max/dev/theanswer-worktrees/$TICKET_ID"
BRANCH_NAME=$(cd "$WORKTREE_PATH" && git branch --show-current)

# Remove worktree
git worktree remove "$WORKTREE_PATH"

# Delete branch (if merged)
git branch -d "$BRANCH_NAME"
```

## Error Handling

### Worktree Already Exists

```
fatal: '$WORKTREE_PATH' already exists
```

**Resolution:**
1. Check if existing worktree is for same ticket
2. If yes, reuse existing worktree
3. If no, ask user to resolve conflict

### Branch Already Exists

```
fatal: A branch named 'feature/AAI-123-description' already exists
```

**Resolution:**
1. Check if branch is for same ticket
2. If yes, use existing branch: `git worktree add /path $BRANCH_NAME`
3. If no, use different branch name or ask user

### Worktree Path Has Uncommitted Changes

```
error: '$WORKTREE_PATH' contains modified or untracked files
```

**Resolution:**
1. Commit or stash changes first
2. Or use `--force` flag (with user confirmation)

## Integration with Fleet Commands

This skill is used by:
- `/fleet-start`: Creates worktrees for multiple tickets
- `/fleet-status`: Checks status of all worktrees
- `/fleet-push`: Commits and pushes from all worktrees

## Path Constants

```bash
# Main repository
MAIN_REPO="/home/max/dev/theanswer"

# Worktrees base directory
WORKTREES_BASE="/home/max/dev/theanswer-worktrees"

# Individual worktree path
WORKTREE_PATH="$WORKTREES_BASE/$TICKET_ID"
```

## Best Practices

1. **Always create from staging**: Ensures latest code
2. **Use ticket ID for directory**: Easy identification
3. **Include ticket ID in branch**: Traceability
4. **Clean up after merge**: Prevent clutter
5. **Don't share worktrees**: Each ticket gets its own

## Quality Checks

Before completing worktree operations:
- [ ] Staging is up to date (`git fetch origin staging`)
- [ ] Worktree path doesn't conflict
- [ ] Branch name follows convention
- [ ] Worktree is accessible and functional
- [ ] Main repository not affected
