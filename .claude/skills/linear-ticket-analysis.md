# Linear Ticket Analysis Skill

Methodology for analyzing Linear tickets to find duplicates, check relevance, and determine if issues have been fixed.

## Analysis Steps

### 1. Extract Key Information

From each Linear ticket, identify:
- **Title and description** - Core problem statement
- **Keywords** - Component names, error messages, feature names
- **Labels** - Bug, Feature, product area
- **Created date** - Age of ticket
- **Status** - Current workflow state
- **Related tickets** - Already linked duplicates/relations
- **GitHub links** - Associated GitHub issues

### 2. Duplicate Detection

Search for potential duplicates by:

```
mcp__claude_ai_Linear__list_issues with:
  query="{keywords}"
  team="AGENT"
  limit=20
```

**Duplicate indicators:**
- Same error message or component
- Similar title (>70% word overlap)
- Same root cause described differently
- Created within days of each other
- Same reporter

**NOT duplicates:**
- Related but distinct issues
- Same component, different bugs
- Follow-up issues with new scope

### 3. Codebase Investigation

For bugs, search for fixes:

```bash
# Search git history for ticket references
git log --oneline --all --since="2025-01-01" --grep="AGENT-{number}"

# Search for keyword-related commits
git log --oneline --all --since="2025-01-01" --grep="{keyword}"

# Check if error pattern still exists
rg "{error_pattern}" --type ts
```

For features, check implementation status:

```bash
# Search for component/feature implementation
rg "{feature_keyword}" --type ts --type tsx

# Check for related PRs
gh pr list --repo the-answerai/theanswer --state merged \
  --search "AGENT-{number}" --json number,title,mergedAt
```

### 4. Classification Criteria

#### CLOSE_DUPLICATE
- Another ticket covers same issue
- Original ticket is more complete/active
- Link to original before closing

#### CLOSE_FIXED
- Found PR/commit addressing the issue
- Error pattern no longer in codebase
- Feature has been implemented

#### CLOSE_OUTDATED
- Ticket is 6+ months old with no activity
- Component/feature no longer exists
- Requirements have fundamentally changed

#### KEEP_OPEN
- Issue still exists in codebase
- Feature not yet implemented
- Clear path to resolution

#### NEEDS_CLARIFICATION
- Insufficient detail to investigate
- Unclear requirements
- Add comment requesting more info

### 5. Status Transitions

When closing tickets, use appropriate status:
- `Done` - For fixed/implemented issues
- `Canceled` - For duplicates, outdated, won't fix

## Label Reference

### Product Labels (from linear-constants skill)
- AnswerSidekick: `42f0386b-f6bb-4e93-a9d3-4a2d14d22ca2`
- AnswerAgent Studio: `135f1576-19af-4666-9211-1e9e53607130`
- AnswerChat: `739a4541-fd35-419b-8d80-932d4c9b1db9`
- AnswerApps: `2d70e80f-7db9-4e5e-9781-1dc3cc3b6e08`
- AnswerEngine: `91fbd9d7-4b04-4c92-8f4e-e90d8077e3ca`

### Type Labels
- Bug: `136398d1-b6fc-450d-957d-ec65997ec07a`
- Feature: `1550fe7f-e1c3-4bb9-9ec9-0487ae82c8a7`
- Improvement: `68a2e6d0-d15b-4491-8829-5c6f4620e97c`
- Github issue: `2400a57d-9a69-42f6-8e31-82659a6a98be`

## Output Format

For each analyzed ticket:

```
TICKET: AGENT-{number}
TITLE: {title}
AGE: {months} months
STATUS: {current_status}
LABELS: {labels}

ANALYSIS:
- Duplicate check: {result}
- Codebase check: {result}
- Relevance: {assessment}

RECOMMENDATION: {CLOSE_DUPLICATE | CLOSE_FIXED | CLOSE_OUTDATED | KEEP_OPEN | NEEDS_CLARIFICATION}
REASON: {brief explanation}
ACTION: {what to do}
```
