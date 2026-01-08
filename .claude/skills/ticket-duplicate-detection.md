---
name: ticket-duplicate-detection
description: "Detects similar/duplicate tickets before creating new ones"
---

# Ticket Duplicate Detection Skill

This skill provides patterns for checking Linear for similar/duplicate tickets before creating new ones.

## Purpose

Avoid creating duplicate tickets by:
- Searching Linear with multiple query patterns
- Presenting potential duplicates to user
- Offering options: link, sub-issue, or proceed

## Detection Methodology

### Step 1: Extract Search Keywords

From the user's issue description, extract:
1. **Primary keywords**: Main noun/verb (e.g., "drawer", "modal", "z-index")
2. **Technical terms**: Component names, error messages, file names
3. **Synonyms**: Related terms (e.g., "sidebar" for "drawer", "dialog" for "modal")

### Step 2: Search Linear (Last 30 Days)

Use `mcp__linear__list_issues` with multiple queries:

```
# Search 1: Primary keywords
mcp__linear__list_issues with query="drawer z-index", updatedAt="-P30D", limit=20

# Search 2: Error messages (if applicable)
mcp__linear__list_issues with query="handleTabChange undefined", updatedAt="-P30D", limit=10

# Search 3: Component/file names
mcp__linear__list_issues with query="AppDrawer", updatedAt="-P30D", limit=10
```

**Time range**: Search issues updated in last 30 days (`updatedAt: "-P30D"`)

### Step 3: Filter Results

Check results for:
- Open issues (active work)
- Recently closed (might be reopened)
- Same component/area
- Similar symptoms

### Step 4: Present to User

If potential duplicates found:

```markdown
## Potential Duplicate Tickets Found

I found these similar tickets before creating a new one:

1. **AGENT-123**: "Fix drawer z-index issue" (Open)
   - Similar: Both about drawer layering

2. **AGENT-100**: "Modal appears behind sidebar" (Done - 2 weeks ago)
   - Similar: Same UI area

**Options:**
A) Link to existing ticket (add as related)
B) Create as sub-issue of existing ticket
C) Proceed with new ticket (different issue)

Which option?
```

### Step 5: Take Action

Based on user choice:
- **Option A**: Add link/comment to existing ticket
- **Option B**: Create with parentId set
- **Option C**: Create new ticket as planned

## Search Patterns Reference

| Issue Type | Primary Search | Secondary Search |
|------------|---------------|------------------|
| UI Bug | Component name + symptom | "modal", "dialog", "overlay" |
| Error | Error message | Function/file name |
| Feature | Feature name | Related features |
| Performance | "slow", "performance" | Component name |
| Styling | "z-index", "css", "style" | Component name |

## Common Synonym Mappings

| Term | Also search for |
|------|-----------------|
| drawer | sidebar, nav, navigation |
| modal | dialog, popup, overlay |
| button | btn, click, action |
| form | input, field, validation |
| error | bug, crash, fail |

## Integration

Used by:
- `linear-ticket-creator` agent (required first step)
- `/ticket-create` command (via agent)
