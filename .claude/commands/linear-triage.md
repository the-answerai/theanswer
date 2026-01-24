# Linear Ticket Triage Command

Triage open Linear tickets to find duplicates, check if issues are fixed, and clean up stale tickets.

## Usage

```
/linear-triage [ticket-id]     # Triage a specific ticket
/linear-triage --batch 5       # Triage 5 tickets in parallel
/linear-triage --status        # Show triage progress
```

## Process Overview

1. **Fetch open tickets** from Linear AGENT team
2. **Analyze each ticket** for:
   - Duplicates (same issue, different ticket)
   - Fixed issues (resolved but not closed)
   - Outdated tickets (stale, no longer relevant)
3. **Take action**:
   - Close duplicates (link to original)
   - Close fixed issues (with resolution details)
   - Close outdated (with explanation)
   - Keep open valid issues
4. **Track progress** in CSV

## CSV Tracking

Location: `/Users/bradtaylor/Github/theanswer/linear_tickets_triage_status.csv`

Columns:
- `ticket_id` - Linear ticket identifier (e.g., AGENT-123)
- `title` - Ticket title
- `status` - Current Linear status
- `created` - Creation date
- `age_months` - Age in months
- `labels` - Applied labels
- `triage_status` - PENDING, CLOSED_DUPLICATE, CLOSED_FIXED, CLOSED_OUTDATED, KEPT_OPEN, NEEDS_CLARIFICATION
- `triage_notes` - Action taken or reason
- `duplicate_of` - Original ticket if duplicate
- `fixed_in` - PR/commit if fixed

## Workflow

### Initialize (First Run)

```bash
# Fetch all open tickets and create tracking CSV
mcp__claude_ai_Linear__list_issues with:
  team="AGENT"
  state="Backlog" OR "Todo" OR "In Progress"
  limit=250
```

### Triage Single Ticket

Use the `linear-ticket-triager` agent:

```
Task tool with:
  subagent_type="linear-ticket-triager"
  prompt="Triage Linear ticket AGENT-{number}"
```

### Batch Triage

Launch multiple agents in parallel:

```
Task tool (x5) with:
  subagent_type="linear-ticket-triager"
  prompt="Triage Linear ticket AGENT-{number}"
```

## Agent Behavior

The `linear-ticket-triager` agent will:

1. **Fetch ticket details** from Linear
2. **Search for duplicates** using keywords
3. **Check codebase** for fixes
4. **Classify** the ticket
5. **Take action** (close or keep)
6. **Report results**

## Safety Features

- Agents only modify the ticket they're triaging
- Cannot create new tickets
- Cannot delete tickets
- All actions logged with comments

## Status Values

| Triage Status | Meaning |
|--------------|---------|
| PENDING | Not yet triaged |
| CLOSED_DUPLICATE | Duplicate of another ticket |
| CLOSED_FIXED | Issue has been resolved |
| CLOSED_OUTDATED | No longer relevant |
| KEPT_OPEN | Valid, remains open |
| NEEDS_CLARIFICATION | Awaiting more info |

## Example Session

```
User: /linear-triage --batch 5