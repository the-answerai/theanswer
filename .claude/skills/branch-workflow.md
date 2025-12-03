# Branch Workflow Skill

This skill provides comprehensive patterns for the complete branch lifecycle: creation, validation, protection, and status synchronization.

## Purpose

Manage the full branch workflow:
- Validate current branch before operations
- Block operations on protected branches
- Extract and verify Linear ticket IDs
- Create properly named branches
- Synchronize with Linear ticket status
- Enforce TheAnswer branching conventions

## Branch Naming Convention

```
{type}/{ticket-id}-{sanitized-title}
```

### Valid Branch Types

```
feature/  - New features, enhancements
fix/      - Bug fixes, corrections
chore/    - Maintenance, dependencies, refactoring
docs/     - Documentation updates
test/     - Testing improvements
perf/     - Performance optimizations
style/    - Code formatting, style changes
```

### Examples

```
✅ Valid:
  feature/AAI-123-add-oauth2-support
  fix/AAI-456-resolve-memory-leak-in-chat
  chore/AAI-789-update-langchain-dependencies
  docs/AAI-101-update-api-documentation

❌ Invalid:
  my-feature (no ticket ID)
  feature-oauth (wrong format)
  AAI-123 (no type prefix)
  staging (protected branch)
```

## Protected Branches

**NEVER allow direct commits or operations on:**

```
Protected Branches:
- staging
- main
- production
- master
- develop
```

**Why protected:**
- `staging` - Integration branch, receives PRs from feature branches
- `main`/`production` - Production deployment branch
- `master` - Legacy production branch
- `develop` - Development integration (if used)

## Workflow Patterns

### Pattern 1: Branch Validation (Pre-Operation Check)

**ALWAYS run this before commit/push/other operations:**

```bash
# Get current branch
current_branch=$(git branch --show-current)

echo "Current branch: $current_branch"
```

**Validation logic:**

```bash
# Check if on protected branch
protected_branches=("staging" "main" "production" "master" "develop")

for protected in "${protected_branches[@]}"; do
  if [[ "$current_branch" == "$protected" ]]; then
    echo "❌ ERROR: Cannot perform operation on protected branch '$protected'"
    echo ""
    echo "Protected branches: staging, main, production, master, develop"
    echo ""
    echo "You must work on a feature branch. Use:"
    echo "  /ticket-start AAI-XXX  - Start work on existing ticket"
    echo "  /ticket-create         - Create new ticket and branch"
    exit 1
  fi
done

echo "✓ Branch validation passed"
```

**Example error message:**

```
⚠️  FATAL: Cannot commit to protected branch

Current branch: staging

You CANNOT commit directly to staging/main/production branches.

STOP THE OPERATION IMMEDIATELY.

Next steps:
  1. Use /ticket-start AAI-XXX to create proper feature branch
  2. Or use /ticket-create if no ticket exists
  3. Never work directly on staging/main/production

DO NOT PROCEED.
```

### Pattern 2: Ticket ID Extraction and Verification

**Extract ticket ID from branch name:**

```bash
# Branch name pattern: {type}/{TICKET-ID}-{description}
# Example: feature/AAI-123-add-oauth2-support → AAI-123

current_branch=$(git branch --show-current)

# Extract ticket ID using regex
ticket_id=$(echo "$current_branch" | grep -oE '[A-Z]+-[0-9]+')

if [[ -z "$ticket_id" ]]; then
  echo "❌ No Linear ticket ID found in branch name"
  echo ""
  echo "Current branch: $current_branch"
  echo "Expected pattern: {type}/AAI-###-description"
  echo ""
  echo "All work must be tracked in Linear tickets."
  echo ""
  echo "Next steps:"
  echo "  1. Use /ticket-create to create ticket"
  echo "  2. Use /ticket-start to create proper branch"
  echo ""
  echo "DO NOT PROCEED without ticket."
  exit 1
fi

echo "✓ Ticket ID extracted: $ticket_id"
```

**Verify ticket exists in Linear:**

```bash
# Using MCP Linear tool
linear_ticket=$(mcp__linear__get_issue --id "$ticket_id")

if [[ $? -ne 0 ]]; then
  echo "❌ Ticket $ticket_id not found in Linear"
  echo ""
  echo "The branch references a ticket that doesn't exist."
  echo ""
  echo "Options:"
  echo "  1. Create ticket: /ticket-create"
  echo "  2. Switch to correct branch: git checkout <branch>"
  echo "  3. Fix branch name to match existing ticket"
  echo ""
  echo "DO NOT PROCEED until resolved."
  exit 1
fi

echo "✓ Ticket verified: $ticket_id"
```

**Full validation flow:**

```bash
#!/bin/bash

validate_branch() {
  local current_branch=$(git branch --show-current)

  # Step 1: Check protected branches
  case "$current_branch" in
    staging|main|production|master|develop)
      echo "❌ ERROR: Cannot work on protected branch: $current_branch"
      echo "Use /ticket-start to create feature branch"
      return 1
      ;;
  esac

  # Step 2: Extract ticket ID
  local ticket_id=$(echo "$current_branch" | grep -oE '[A-Z]+-[0-9]+')

  if [[ -z "$ticket_id" ]]; then
    echo "❌ ERROR: No ticket ID in branch name: $current_branch"
    echo "Use /ticket-create to create tracked work"
    return 1
  fi

  # Step 3: Verify ticket exists
  if ! mcp__linear__get_issue --id "$ticket_id" &>/dev/null; then
    echo "❌ ERROR: Ticket $ticket_id not found in Linear"
    echo "Create ticket first: /ticket-create"
    return 1
  fi

  echo "✓ Branch validated: $current_branch (Ticket: $ticket_id)"
  return 0
}

# Usage
validate_branch || exit 1
```

### Pattern 3: Branch Creation from Linear Ticket

**Complete branch creation flow:**

#### Step 1: Fetch Ticket Details

```bash
# Get ticket information
ticket_id="AAI-123"
ticket_json=$(mcp__linear__get_issue --id "$ticket_id")

# Extract fields
title=$(echo "$ticket_json" | jq -r '.title')
labels=$(echo "$ticket_json" | jq -r '.labels[].name')
status=$(echo "$ticket_json" | jq -r '.state.name')

echo "Ticket: $ticket_id"
echo "Title: $title"
echo "Labels: $labels"
echo "Status: $status"
```

#### Step 2: Determine Branch Type

```bash
# Determine type from labels
determine_branch_type() {
  local labels="$1"

  if echo "$labels" | grep -qi "bug"; then
    echo "fix"
  elif echo "$labels" | grep -qi "feature\|enhancement"; then
    echo "feature"
  elif echo "$labels" | grep -qi "chore\|maintenance\|dependency"; then
    echo "chore"
  elif echo "$labels" | grep -qi "docs\|documentation"; then
    echo "docs"
  elif echo "$labels" | grep -qi "test"; then
    echo "test"
  elif echo "$labels" | grep -qi "perf\|performance"; then
    echo "perf"
  else
    # Ask user
    echo "feature" # default
  fi
}

branch_type=$(determine_branch_type "$labels")
echo "Branch type: $branch_type"
```

**If ambiguous, ask user:**

```
Unable to determine branch type from ticket labels.

Ticket: AAI-123
Title: Add OAuth2 Support for External APIs
Labels: backend, api

What type of work is this?

[1] feature  - New feature or enhancement
[2] fix      - Bug fix
[3] chore    - Maintenance, dependencies, refactor
[4] docs     - Documentation
[5] test     - Testing improvements

Your choice (1-5):
```

#### Step 3: Sanitize Title for Branch Name

```bash
sanitize_title() {
  local title="$1"

  # Convert to lowercase
  title=$(echo "$title" | tr '[:upper:]' '[:lower:]')

  # Replace spaces with hyphens
  title=$(echo "$title" | tr ' ' '-')

  # Remove special characters (keep alphanumeric and hyphens)
  title=$(echo "$title" | sed 's/[^a-z0-9-]//g')

  # Remove multiple consecutive hyphens
  title=$(echo "$title" | sed 's/-\+/-/g')

  # Remove leading/trailing hyphens
  title=$(echo "$title" | sed 's/^-\+//; s/-\+$//')

  # Truncate to 50 characters
  title=$(echo "$title" | cut -c1-50)

  # Remove trailing hyphen if truncation created one
  title=$(echo "$title" | sed 's/-$//')

  echo "$title"
}

# Example usage
title="Add OAuth2 Support for External APIs"
sanitized=$(sanitize_title "$title")
echo "$sanitized"
# Output: add-oauth2-support-for-external-apis
```

#### Step 4: Construct Branch Name

```bash
ticket_id="AAI-123"
branch_type="feature"
title="Add OAuth2 Support for External APIs"

sanitized_title=$(sanitize_title "$title")
branch_name="${branch_type}/${ticket_id}-${sanitized_title}"

echo "Branch name: $branch_name"
# Output: feature/AAI-123-add-oauth2-support-for-external-apis
```

#### Step 5: Check for Conflicts

```bash
# Check if branch already exists locally
if git show-ref --verify --quiet "refs/heads/$branch_name"; then
  echo "❌ Branch '$branch_name' already exists locally"
  echo ""
  echo "Options:"
  echo "  1. Checkout existing: git checkout $branch_name"
  echo "  2. Delete and recreate: git branch -D $branch_name"
  echo "  3. Use different name: ${branch_name}-v2"
  echo ""
  read -p "Your choice (1-3): " choice
fi

# Check if branch exists on remote
if git ls-remote --heads origin "$branch_name" | grep -q "$branch_name"; then
  echo "⚠️  Branch '$branch_name' exists on remote"
  echo ""
  echo "Options:"
  echo "  1. Checkout remote: git checkout $branch_name"
  echo "  2. Use different name: ${branch_name}-v2"
  echo ""
  read -p "Your choice (1-2): " choice
fi
```

#### Step 6: Create Branch from Staging

```bash
# Ensure we have latest staging
echo "Fetching latest staging..."
git fetch origin staging

# Checkout staging
git checkout staging

# Pull latest changes
git pull origin staging

# Create and checkout new branch
echo "Creating branch: $branch_name"
git checkout -b "$branch_name"

echo "✓ Branch created and checked out: $branch_name"
echo "  Base: staging ($(git rev-parse --short staging))"
echo "  Ticket: $ticket_id"
```

#### Step 7: Update Linear Ticket Status

```bash
# Ask user permission
read -p "Update ticket status to 'In Progress'? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Update status
  mcp__linear__update_issue \
    --id "$ticket_id" \
    --state "In Progress"

  # Add comment with branch info
  mcp__linear__create_comment \
    --issueId "$ticket_id" \
    --body "Started work in branch: \`$branch_name\`"

  echo "✓ Ticket updated: Todo → In Progress"
  echo "  Comment added with branch name"
fi
```

### Pattern 4: Branch Status Synchronization

**Sync branch operations with Linear ticket status:**

#### Branch Created → In Progress

```bash
sync_ticket_on_branch_create() {
  local ticket_id="$1"
  local branch_name="$2"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Linear Ticket Status Update"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Ticket: $ticket_id"
  echo "Branch: $branch_name"
  echo ""
  echo "Current Status: Todo"
  echo "Proposed Status: In Progress"
  echo ""
  echo "Reason: Work started on this ticket"
  echo ""
  read -p "Update ticket status? (y/n) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mcp__linear__update_issue --id "$ticket_id" --state "In Progress"
    mcp__linear__create_comment \
      --issueId "$ticket_id" \
      --body "Started work in branch: \`$branch_name\`
Base: staging"

    echo "✓ Ticket updated: Todo → In Progress"
  else
    echo "⊘ Skipped ticket update"
  fi
}
```

#### PR Created → In Review

```bash
sync_ticket_on_pr_create() {
  local ticket_id="$1"
  local pr_number="$2"
  local pr_url="$3"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Linear Ticket Status Update"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Ticket: $ticket_id"
  echo "PR: #$pr_number"
  echo ""
  echo "Current Status: In Progress"
  echo "Proposed Status: In Review"
  echo ""
  echo "Reason: Pull request created for review"
  echo ""
  read -p "Update ticket status? (y/n) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mcp__linear__update_issue --id "$ticket_id" --state "In Review"
    mcp__linear__create_comment \
      --issueId "$ticket_id" \
      --body "Pull request created: [#$pr_number]($pr_url)
Target: staging"

    echo "✓ Ticket updated: In Progress → In Review"
    echo "  PR link added to ticket"
  else
    echo "⊘ Skipped ticket update"
  fi
}
```

#### PR Merged → Done

```bash
sync_ticket_on_pr_merge() {
  local ticket_id="$1"
  local pr_number="$2"

  # Auto-update (no prompt for merge)
  mcp__linear__update_issue --id "$ticket_id" --state "Done"
  mcp__linear__create_comment \
    --issueId "$ticket_id" \
    --body "Pull request merged: [#$pr_number]
Merged to: staging
Status: Done"

  echo "✓ Ticket auto-updated: In Review → Done"
}
```

### Pattern 5: Branch Cleanup

**After PR is merged:**

```bash
cleanup_merged_branch() {
  local branch_name="$1"
  local current_branch=$(git branch --show-current)

  # Don't delete if we're on it
  if [[ "$current_branch" == "$branch_name" ]]; then
    echo "Switching to staging before cleanup..."
    git checkout staging
    git pull origin staging
  fi

  # Delete local branch
  echo "Deleting local branch: $branch_name"
  git branch -d "$branch_name"

  # Delete remote branch
  echo "Deleting remote branch: $branch_name"
  git push origin --delete "$branch_name"

  echo "✓ Branch cleanup complete"
}
```

## Complete Branch Lifecycle Example

```bash
# 1. Start work on ticket
/ticket-start AAI-123

→ Validates ticket exists
→ Creates branch: feature/AAI-123-add-oauth2-support
→ Updates ticket: Todo → In Progress
→ Adds comment to ticket with branch name

# 2. Make changes and commit
git add .
/commit "add OAuth2 token refresh logic"

→ Validates branch (not on staging/main)
→ Verifies ticket AAI-123 exists
→ Creates commit: feat(AAI-123): add OAuth2 token refresh logic

# 3. Push and create PR
/push

→ Pushes commits to remote
→ Creates PR targeting staging
→ Updates ticket: In Progress → In Review
→ Adds PR link to ticket

# 4. PR is reviewed and merged
(Reviewer merges PR)

→ Ticket auto-updates: In Review → Done
→ Adds merge comment to ticket

# 5. Cleanup (optional)
git branch -d feature/AAI-123-add-oauth2-support
git push origin --delete feature/AAI-123-add-oauth2-support
```

## Error Handling Patterns

### Error: Working on Protected Branch

```
⚠️  FATAL: Cannot commit to staging

Current branch: staging

You CANNOT commit directly to staging/main/production branches.

Next steps:
  1. Stash changes: git stash
  2. Switch to feature branch: git checkout feature/AAI-XXX-description
  3. Apply changes: git stash pop
  4. Or create new branch: /ticket-start AAI-XXX

DO NOT PROCEED.
```

### Error: No Ticket ID in Branch

```
⚠️  No Linear ticket ID in branch name

Current branch: my-feature-branch
Expected pattern: {type}/AAI-###-description

All work must be tracked in Linear tickets.

Options:
  1. Create ticket: /ticket-create
  2. Start ticket work: /ticket-start AAI-XXX
  3. Rename branch (advanced):
     git branch -m feature/AAI-XXX-description

Recommended: Use /ticket-create or /ticket-start
```

### Error: Ticket Not Found

```
⚠️  Ticket AAI-999 not found in Linear

Current branch: feature/AAI-999-some-feature

The branch references a ticket that doesn't exist.

Possible causes:
  1. Ticket was deleted
  2. Ticket ID is incorrect
  3. You don't have access to this ticket

Options:
  1. Create new ticket: /ticket-create
  2. Fix branch name to match existing ticket
  3. Check ticket exists in Linear

DO NOT PROCEED until resolved.
```

## Integration with Commands

This skill is used by:
- `/ticket-start` - Branch creation from ticket
- `/push` - Branch validation before commit/push
- `/commit` - Branch validation before commit
- All git operations requiring branch validation

## Integration with Agents

Used by:
- `linear-ticket-planner` - Creates branches after planning
- `git-pr-manager` - Validates branches before PR creation
- `commit-helper` - Validates branch before commit

## Configuration

**Per CLAUDE.md:**
- Base branch: `staging` (not main)
- Branch format: `{type}/{ticket-id}-{title}`
- Protected branches: staging, main, production, master, develop
- Always sync Linear status with branch operations
- Always ask permission before Linear updates
