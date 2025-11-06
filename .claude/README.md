# Claude Code Architecture for TheAnswer

Streamlined 3-layer architecture for Linear ticket management and Git workflows.

## Quick Start

**4 Core Commands:**
```bash
/ticket-create          # Create new Linear ticket
/ticket-start AAI-123   # Start work on ticket
/push                   # Commit + Push + Create/Update PR
/pr-review 456          # Review pull request
```

**Daily Workflow:**
```bash
/ticket-start AAI-123   # Start work
# ... write code ...
/push                   # Commit, push, create PR
# ... write more ...
/push                   # Commit, push, update PR
/pr-review             # Review your PR
```

## Architecture

3-layer system: **Commands** → **Agents** → **Skills**

```
USER
  ↓
COMMANDS (4 core)
  /ticket-create  /ticket-start  /push  /pr-review
  ↓
AGENTS (4 specialized)
  linear-ticket-creator   linear-ticket-planner
  git-pr-manager         git-pr-reviewer
  ↓
SKILLS (7 patterns)
  branch-workflow  commit-helper  pr-description-generator
  ticket-planning-workflow  pr-review-workflow  etc.
```

## Commands

### `/ticket-create [title]`
Create new Linear tickets with guided prompts.

**What it does:**
- Explores codebase for context
- Asks clarifying questions
- Suggests labels and priority
- Creates comprehensive ticket
- Offers to start work immediately

**Example:**
```bash
/ticket-create Add OAuth2 token refresh
```

### `/ticket-start [ticket-id]`
Start work on a Linear ticket.

**What it does:**
- Fetches ticket details from Linear
- Explores relevant codebase sections
- Creates detailed implementation plan
- Creates git branch: `{type}/AAI-###-description`
- Updates Linear status: "In Progress"

**Example:**
```bash
/ticket-start AAI-123
```

### `/push`
⭐ **Primary workflow command** - handles commit, push, and PR creation/update.

**What it does:**
- Validates branch (blocks staging/main/production)
- Verifies Linear ticket exists
- Commits changes with conventional format
- Runs security checks (secrets, debug code)
- Validates multi-tenancy patterns (organizationId)
- Validates authentication (enforceAbility middleware)
- Pushes to remote
- Creates PR (if none exists) OR updates existing PR
- Ensures PR targets staging (never main)
- Updates Linear status: "In Review"

**Example:**
```bash
/push
# Intelligently handles: commit → push → PR
```

**Use this throughout your day** - it detects state and does the right thing.

### `/pr-review [number]`
Review pull requests with comprehensive checks.

**What it does:**
- Fetches PR diff from GitHub
- Analyzes for security vulnerabilities
- Validates TheAnswer patterns:
  - Multi-tenancy (organizationId in all queries)
  - Authentication (enforceAbility on all routes)
  - Error handling (InternalFlowiseError)
- Checks code quality and architecture
- Posts structured review to GitHub

**Example:**
```bash
/pr-review 456
```

## Directory Structure

```
.claude/
├── README.md                          # This file
├── commands/                          # 4 core user commands
│   ├── ticket-create.md
│   ├── ticket-start.md
│   ├── push.md                        # ⭐ Main workflow command
│   └── pr-review.md
├── agents/                            # 4 specialized agents
│   ├── linear-ticket-creator.md
│   ├── linear-ticket-planner.md
│   ├── git-pr-manager.md
│   └── git-pr-reviewer.md
└── skills/                            # 7 reusable patterns
    ├── branch-workflow.md             # Branch lifecycle
    ├── commit-helper.md               # Commit validation
    ├── git-branch.md                  # Branch creation
    ├── pr-description-generator.md    # PR descriptions
    ├── pr-review-workflow.md          # Review methodology
    ├── ticket-planning-workflow.md    # Ticket planning
    └── ticket-status-sync.md          # Linear sync
```

## TheAnswer-Specific Patterns

All commands enforce TheAnswer requirements:

**Multi-tenancy:**
- All database queries MUST include `organizationId` filter
- Validated automatically in commits and PR reviews

**Authentication:**
- All routes MUST have `enforceAbility` middleware
- Validated automatically in commits and PR reviews

**Error Handling:**
- Use `InternalFlowiseError` consistently
- Format: `Error: {service}.{method} - {description}`

**Git Conventions:**
- Branch: `{type}/{ticket-id}-{description}`
- Commits: `{type}(AAI-###): {description}` (conventional commits)
- PRs: Always target `staging`, never `main`
- Types: feat, fix, chore, docs, refactor, test, perf, style

## How It Works

**Example: Complete workflow**

1. **User runs command:**
   ```bash
   /ticket-start AAI-123
   ```

2. **Command invokes agent:**
   - Reads `.claude/commands/ticket-start.md`
   - Launches `linear-ticket-planner` agent

3. **Agent executes workflow:**
   - Fetches ticket using `mcp__linear__get_issue`
   - Explores codebase using search tools
   - Creates implementation plan
   - Uses `git-branch` skill to create branch
   - Uses `ticket-status-sync` skill to update Linear

4. **Results returned to user:**
   - Branch created and checked out
   - Implementation plan provided
   - Linear status updated

## Integration Points

**Linear:**
- MCP tools for ticket operations
- Auto-sync: Todo → In Progress → In Review → Done

**GitHub:**
- GitHub CLI (`gh`) for PR operations
- Automatic PR creation targeting staging
- PR review posting

**Git:**
- Branch validation and creation
- Conventional commit enforcement
- Pre-commit hook handling

## Common Workflows

### Feature Development
```bash
/ticket-start AAI-123       # Setup
# ... implement feature ...
/push                       # First PR creation
# ... add more code ...
/push                       # Update PR
# ... add tests ...
/push                       # Update PR
/pr-review                  # Self-review
```

### Bug Fix
```bash
/ticket-create Fix memory leak in chat
/ticket-start AAI-456
# ... fix bug ...
/push                       # Commit + PR
```

### Code Review
```bash
/pr-review 789              # Review teammate's PR
```

## Extending the System

### Add a New Skill
1. Create `.claude/skills/your-skill.md`
2. Document workflow and patterns
3. Reference in relevant agents

### Add a New Agent
1. Create `.claude/agents/your-agent.md`
2. Define responsibilities and workflow
3. Reference in relevant commands

### Add a New Command
1. Create `.claude/commands/your-command.md`
2. Write as concise executable prompt
3. Reference agents/skills to use

**Best Practices:**
- Commands: Concise prompts (< 50 lines)
- Agents: Workflow orchestration (100-150 lines)
- Skills: Detailed patterns (400-600 lines)

## Support

**Need help?**
1. Check this README for overview
2. Check command files in `commands/*.md`
3. Ask in team Slack
4. Create GitHub issue: `gh issue create --label claude-code`

**Contributing:**
- Follow existing patterns in skills/agents/commands
- Update documentation
- Submit PR with clear description

## Documentation

| File | Purpose |
|------|---------|
| README.md | Architecture overview (this file) |
| COMMAND_STRUCTURE.md | How layers work together |
| commands/*.md | Individual command reference |
| skills/*.md | Detailed implementation patterns |
| agents/*.md | Agent behaviors |

**Start here:** This README → Try `/ticket-start` or `/push`
