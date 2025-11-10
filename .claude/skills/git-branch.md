# Git Branch Skill

This skill helps create standardized branch names from Linear tickets and sets up the branch with proper conventions.

## Purpose

Create git branches that follow TheAnswer conventions:
- Include ticket ID for traceability
- Use conventional prefixes (feature/fix/chore)
- Sanitize titles for git compatibility
- Optionally update Linear ticket status

## Branch Naming Convention

```
{type}/{ticket-id}-{sanitized-title}
```

**Types:**
- `feature/` - New features, enhancements
- `fix/` - Bug fixes
- `chore/` - Maintenance, refactoring, dependencies
- `docs/` - Documentation updates
- `test/` - Testing improvements

## Workflow

### 1. Gather Ticket Information

If ticket ID provided, fetch from Linear:
```bash
# Get ticket details
linear issue view {ticket-id}
```

Extract:
- Ticket ID (e.g., "AAI-123")
- Title
- Labels (to determine type)
- Current status

### 2. Determine Branch Type

Based on Linear labels or user input:
- `feature`, `enhancement` label → `feature/`
- `bug` label → `fix/`
- `maintenance`, `refactor`, `dependencies` label → `chore/`
- `documentation` label → `docs/`
- `testing` label → `test/`

**Ask user if ambiguous:**
"What type of work is this? (feature/fix/chore/docs/test)"

### 3. Sanitize Title

Convert ticket title to branch-friendly format:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters except hyphens
- Truncate to ~50 characters max
- Remove trailing/leading hyphens

**Example:**
- Title: "Add OAuth2 Support for External APIs"
- Sanitized: "add-oauth2-support-for-external-apis"

### 4. Construct Branch Name

Format: `{type}/{ticket-id}-{sanitized-title}`

**Examples:**
- `feature/AAI-123-add-oauth2-support`
- `fix/AAI-456-resolve-memory-leak-in-chatflows`
- `chore/AAI-789-update-dependencies`

### 5. Verify Branch Doesn't Exist

```bash
git branch --list {branch-name}
```

If exists, suggest alternatives:
- `{branch-name}-v2`
- `{branch-name}-{date}`
- Ask user for different name

### 6. Create and Checkout Branch

```bash
# Ensure we're on latest staging
git checkout staging
git pull origin staging

# Create and checkout new branch
git checkout -b {branch-name}
```

Confirm to user:
```
✓ Created and checked out branch: feature/AAI-123-add-oauth2-support
  Base: staging
  Ticket: AAI-123
```

### 7. Update Linear Ticket Status (Optional)

**Ask user:** "Update ticket status to 'In Progress'? (yes/no)"

If yes:
```bash
# Update ticket status via MCP Linear tool
mcp__linear__update_issue --id {ticket-id} --state "In Progress"
```

Add comment to ticket:
```
Started work in branch: `{branch-name}`
```

## Error Handling

**No git repository:**
```
Error: Not in a git repository
→ Navigate to repository root first
```

**Dirty working directory:**
```
Warning: You have uncommitted changes
→ Options:
  1. Commit changes first
  2. Stash changes: git stash
  3. Discard changes (dangerous!)
```

**Branch already exists:**
```
Branch '{branch-name}' already exists
→ Options:
  1. Checkout existing: git checkout {branch-name}
  2. Create with different name
  3. Delete existing and recreate (dangerous!)
```

**Can't access Linear:**
```
Warning: Couldn't fetch ticket details
→ Proceeding with manual input
```

## Integration with Commands

This skill is invoked by:
- `/ticket-start` - Automatically creates branch
- `/branch` - Direct branch creation command

## Integration with Agents

Used by:
- `linear-ticket-planner` - Creates branch after planning
- `git-pr-manager` - Validates branch name format

## Example Usage

**Scenario 1: Create branch from ticket**
```
Input: Ticket AAI-123 with title "Add pagination to chatflows API"
Labels: feature

Output:
1. Fetch ticket details
2. Determine type: feature
3. Sanitize: "add-pagination-to-chatflows-api"
4. Branch: feature/AAI-123-add-pagination-to-chatflows-api
5. Create from staging
6. Update ticket to In Progress
```

**Scenario 2: Create branch manually**
```
Input: Type "fix", Title "Memory leak in chat processing"

Output:
1. Sanitize: "memory-leak-in-chat-processing"
2. Branch: fix/memory-leak-in-chat-processing
3. Create from staging
4. No ticket update (no ticket ID)
```

## Quality Checks

Before completing:
- [ ] Branch name follows convention
- [ ] Branch created from latest staging
- [ ] Working directory is clean
- [ ] Ticket ID is valid (if provided)
- [ ] Linear status updated (if requested)
- [ ] User confirmed branch name

## Configuration

Respects these repository settings:
- Default base branch: `staging` (from CLAUDE.md)
- Branch naming convention: `{type}/{id}-{title}`
- Linear integration: Via MCP Linear tools
- Status mapping: "In Progress" when branch created
