# Ticket Status Sync Skill

This skill synchronizes Linear ticket status with git workflow events, keeping tickets up-to-date with development progress.

## Purpose

Automatically update Linear tickets when:
- Branch is created → "In Progress"
- PR is created → "In Review"
- PR is merged → "Done"
- PR is closed without merge → Back to "Todo"

**Important:** Always ask user permission before updating Linear.

## Status Mapping

```
Git Event          → Linear Status
─────────────────────────────────────
Branch created     → In Progress
PR created         → In Review
PR merged          → Done
PR closed (no mer  ge) → Todo
PR draft           → In Progress
```

## Workflow

### 1. Detect Git Event

**Branch Creation:**
```bash
# After creating branch
# Already have: branch name with ticket ID
# Example: feature/AAI-123-add-oauth2-support
```

**PR Creation:**
```bash
# After PR is created
gh pr view [number] --json number,state,isDraft,headRefName
```

**PR Status Change:**
```bash
# Check PR status
gh pr view [number] --json state,merged,mergedAt,closedAt
```

### 2. Extract Ticket ID

**From branch name:**
```bash
# Current branch
git branch --show-current

# Pattern: {type}/{ticket-id}-{description}
# Extract: AAI-123
```

**From PR:**
```bash
# Get PR branch
gh pr view [number] --json headRefName

# Or from PR body
gh pr view [number] --json body | grep -o "AAI-[0-9]\+"
```

### 3. Verify Ticket Exists

```bash
# Using MCP Linear tool
mcp__linear__get_issue --id AAI-123
```

**If ticket not found:**
```
Warning: Ticket AAI-123 not found in Linear.

Possible reasons:
  1. Ticket ID is incorrect
  2. Ticket was deleted
  3. You don't have access to this ticket

Skip status update? (yes/no)
```

### 4. Get Current Ticket Status

```bash
# From ticket details
mcp__linear__get_issue --id AAI-123 --include state
```

**Status hierarchy:**
```
Todo → In Progress → In Review → Done
  ↑         ↑            ↑         ↑
Backlog   Started      PR Open   PR Merged
```

### 5. Determine Target Status

**Event: Branch Created**
```
Current status: Todo
Target status: In Progress

Reason: Work has started on this ticket.
```

**Event: PR Created**
```
Current status: In Progress
Target status: In Review

Reason: PR #123 created for review.
```

**Event: PR Merged**
```
Current status: In Review
Target status: Done

Reason: PR #123 merged to staging.
```

**Event: PR Closed (no merge)**
```
Current status: In Review
Target status: In Progress

Reason: PR #123 closed without merging. Work continues.
```

### 6. Ask User Permission

**Format:**
```
Linear Ticket Update

Ticket: AAI-123 - Add OAuth2 token refresh support
Current Status: In Progress
Proposed Status: In Review

Reason: PR #456 created

Update ticket? (yes/no/never)

[yes]  - Update this ticket
[no]   - Skip this time
[never] - Don't ask again for this ticket
```

**Remember user preferences:**
Store in temporary state (session-based):
```
User preferences for this session:
- AAI-123: always update
- AAI-456: never update
```

### 7. Update Ticket Status

```bash
# Using MCP Linear tool
mcp__linear__update_issue \
  --id AAI-123 \
  --state "In Review"
```

**Handle state names:**
Different teams may use different state names:
- "In Progress" vs "Started" vs "Doing"
- "In Review" vs "Review" vs "Code Review"
- "Done" vs "Completed" vs "Closed"

**Find correct state:**
```bash
# Get team's available states
mcp__linear__list_issue_statuses --team [team-id]

# Match to closest state:
# "In Progress" → find state with type "started"
# "In Review" → find state with type "inreview"
# "Done" → find state with type "done"
```

### 8. Add Comment to Ticket

After status update, add context:

**Branch created:**
```
Started work in branch: `feature/AAI-123-add-oauth2-support`
Base: staging
```

**PR created:**
```
Pull request created: [#456](https://github.com/the-answerai/theanswer/pull/456)
Branch: `feature/AAI-123-add-oauth2-support`
Target: staging
```

**PR merged:**
```
Pull request merged: [#456](https://github.com/the-answerai/theanswer/pull/456)
Merged to: staging
Commits: 12
```

**PR closed:**
```
Pull request closed: [#456](https://github.com/the-answerai/theanswer/pull/456)
Reason: [User can specify]
Status reverted to: In Progress
```

### 9. Confirm Success

```
✓ Linear ticket updated

Ticket: AAI-123
Status: Todo → In Review
Comment: Added PR link #456
URL: https://linear.app/theanswer/issue/AAI-123
```

## Error Handling

**Linear API error:**
```
Error: Failed to update Linear ticket

Details: Rate limit exceeded (429)

Actions:
  [1] Retry in 60 seconds
  [2] Skip for now
  [3] Update manually: https://linear.app/theanswer/issue/AAI-123
```

**Invalid state transition:**
```
Error: Cannot transition from "Done" to "In Progress"

Current: Done
Requested: In Progress

Possible reasons:
  1. Ticket was manually marked Done
  2. This PR was already merged
  3. You're working on a different branch

Skip update? (yes/no)
```

**No permissions:**
```
Error: Insufficient permissions to update ticket

Ticket: AAI-123
Team: Engineering

You need "Edit" permissions for this team.
Contact your Linear admin.

Skip update? (yes/no)
```

## Integration with Commands

This skill is invoked by:
- `/ticket-start` - When creating branch
- `/pr-create` - When creating PR
- Post-merge hooks (if configured)

## Integration with Agents

Used by:
- `linear-ticket-planner` - Updates status when starting work
- `git-pr-manager` - Updates status when creating PR

## Auto-Sync Configuration

**Optional: Automatic sync**

If user wants automatic updates without prompts:

```bash
# Enable auto-sync in settings
echo "CLAUDE_LINEAR_AUTO_SYNC=true" >> .env.local
```

**Safe defaults:**
- Branch created → Always ask
- PR created → Auto-update
- PR merged → Auto-update
- PR closed → Always ask (reason needed)

**Per-ticket override:**
```
# User can mark tickets for auto-sync
mcp__linear__create_comment \
  --issueId AAI-123 \
  --body "auto-sync:enabled"
```

## Special Cases

**Multiple PRs for one ticket:**
```
Notice: Multiple PRs found for AAI-123

PRs:
  - #456 (open, in review)
  - #789 (merged)

Which PR triggered this update?
  [1] #456 (most recent)
  [2] #789
  [3] Both
  [4] Skip update
```

**Ticket already Done:**
```
Notice: Ticket AAI-123 is already marked Done

You're creating a PR for a completed ticket.

Possible reasons:
  1. Follow-up work
  2. Additional changes needed
  3. Ticket was closed prematurely

Actions:
  [1] Keep ticket as Done
  [2] Reopen ticket (→ In Progress)
  [3] Create new follow-up ticket
```

**Draft PR:**
```
Notice: PR #456 is in draft mode

Draft PRs indicate work in progress.
Status: In Progress (not In Review)

Mark as In Review when PR is ready:
  gh pr ready
```

## Quality Checks

Before updating ticket:
- [ ] Ticket ID is valid
- [ ] Ticket exists in Linear
- [ ] User has permission to update
- [ ] Status transition is valid
- [ ] User confirmed update (or auto-sync enabled)
- [ ] Comment added with context
- [ ] Success confirmed

## Configuration

**Per CLAUDE.md:**
- Always ask before updating (unless auto-sync)
- Always add comment with git context
- Use team's actual state names
- Link PRs in comments
- Handle multiple PRs gracefully

## Example Flow

**Full workflow:**

```bash
# 1. User starts work
/ticket-start AAI-123

→ Branch created: feature/AAI-123-add-oauth2-support

Sync: Update AAI-123 to "In Progress"? (yes/no)
User: yes

✓ Ticket updated: Todo → In Progress
  Comment: Started work in branch

# 2. User creates PR
/pr-create

→ PR created: #456

Sync: Update AAI-123 to "In Review"? (yes/no)
User: yes (auto-sync enabled for PR creation)

✓ Ticket updated: In Progress → In Review
  Comment: PR #456 created

# 3. PR is merged (user or teammate)
# Post-merge hook detects:

→ PR #456 merged to staging

Sync: Update AAI-123 to "Done"? (yes/no)
User: yes (auto-sync enabled for PR merge)

✓ Ticket updated: In Review → Done
  Comment: PR #456 merged
```

## User Preferences

**Remember settings:**
```
Session preferences saved:

Auto-sync enabled for:
  ✓ PR creation
  ✓ PR merge

Always ask for:
  - Branch creation
  - PR closure

Tickets with auto-sync:
  - AAI-123
  - AAI-456
```

## Success Metrics

- **Accuracy:** 100% correct status transitions
- **User friction:** Minimal prompts (respect preferences)
- **Reliability:** Handle all error cases gracefully
- **Transparency:** Always show what will change before updating
