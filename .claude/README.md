# Claude Code Architecture for TheAnswer

Streamlined 3-layer architecture for Linear ticket management and Git workflows.

## Quick Start

**5 Core Commands:**
```bash
/ticket-create          # Create new Linear ticket
/ticket-start AAI-123   # Start work on ticket
/push                   # Commit + Push + Create/Update PR
/pr-review 456          # Review pull request
/blog-write             # Write technical blog posts and articles
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

4-layer system: **Commands** → **Agents** → **Skills** + **Rules**

```
USER
  ↓
COMMANDS (5 core)
  /ticket-create  /ticket-start  /push  /pr-review  /blog-write
  ↓
AGENTS (7 specialized)
  linear-ticket-creator   linear-ticket-planner   linear-ticket-optimizer
  git-pr-manager          git-pr-reviewer
  integration-docs-updater  integration-validator
  ↓
SKILLS (10 reusable patterns)
  branch-workflow       commit-helper         git-branch
  pr-description-gen    pr-review-workflow    ticket-planning-workflow
  ticket-status-sync    ticket-duplicate-detection
  theanswer-patterns    error-handling
  ↓
RULES (3 path-specific)
  api-routes.md → packages/server/src/routes/**
  components.md → packages/components/nodes/**
  web-app.md    → apps/web/**
```

## YAML Frontmatter Standard

All skills and agents use YAML frontmatter for metadata:

**Skills format:**
```yaml
---
name: skill-name
description: One-line description of capability
---
```

**Agents format:**
```yaml
---
name: agent-name
description: When to invoke this agent
model: sonnet
color: blue|cyan|yellow|green|purple
---
```

See `agents/git-pr-manager.md` as the reference template.

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

### `/blog-write [topic]`
Write technical blog posts, articles, and content.

**What it does:**
- Researches codebase to understand the topic
- Asks clarifying questions about audience and goals
- Creates comprehensive blog posts with:
  - SEO-optimized headlines and meta descriptions
  - Engaging introductions and clear structure
  - Code examples and technical details
  - 10 FAQs for external linking opportunities
  - Metadata (keywords, tags, internal links)
- Offers revisions and refinements

**Example:**
```bash
/blog-write OAuth2 authentication implementation
```

## Directory Structure

```
.claude/
├── README.md                          # This file
├── ARCHITECTURE.md                    # Detailed optimization plan
├── commands/                          # 5 core user commands
│   ├── ticket-create.md
│   ├── ticket-start.md
│   ├── push.md                        # ⭐ Main workflow command
│   ├── pr-review.md
│   └── blog-write.md
├── agents/                            # 7 specialized agents
│   ├── linear-ticket-creator.md
│   ├── linear-ticket-planner.md
│   ├── linear-ticket-optimizer.md
│   ├── git-pr-manager.md
│   ├── git-pr-reviewer.md
│   ├── integration-docs-updater.md
│   └── integration-validator.md
├── skills/                            # 10 reusable patterns
│   ├── branch-workflow.md             # Branch lifecycle
│   ├── commit-helper.md               # Commit validation
│   ├── git-branch.md                  # Branch creation
│   ├── pr-description-generator.md    # PR descriptions
│   ├── pr-review-workflow.md          # Review methodology
│   ├── ticket-planning-workflow.md    # Ticket planning
│   ├── ticket-status-sync.md          # Linear sync
│   ├── ticket-duplicate-detection.md  # Duplicate detection
│   ├── theanswer-patterns.md          # Multi-tenancy, auth patterns
│   └── error-handling.md              # InternalFlowiseError patterns
├── rules/                             # 3 path-specific rules
│   ├── api-routes.md                  # packages/server/src/routes/**
│   ├── components.md                  # packages/components/nodes/**
│   └── web-app.md                     # apps/web/**
└── examples/                          # Detailed examples
    └── oauth2-ticket-example.md       # Complete ticket planning example
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

### Blog Post Creation
```bash
/blog-write OAuth2 authentication  # Create technical content
# Agent researches codebase, asks clarifying questions,
# generates comprehensive blog post with SEO optimization
```

## Extending the System

### Add a New Skill
1. Create `.claude/skills/your-skill.md` with YAML frontmatter
2. Document workflow and patterns
3. Reference in relevant agents

### Add a New Agent
1. Create `.claude/agents/your-agent.md` with YAML frontmatter
2. Define responsibilities and workflow
3. Reference in relevant commands

### Add a New Command
1. Create `.claude/commands/your-command.md`
2. Write as concise executable prompt
3. Reference agents/skills to use

### Add Path-Specific Rules
1. Create `.claude/rules/your-rule.md` with globs frontmatter
2. Define rules that apply to specific file paths
3. Rules auto-apply when working in matched paths

**Token Efficiency Guidelines:**
- Keep files under 500 lines (extract examples to `examples/`)
- Reference skills instead of duplicating content
- Use progressive disclosure: summary in main file, details in referenced files
- Single responsibility: one skill = one capability

**Best Practices:**
- Commands: Concise prompts (< 50 lines)
- Agents: Workflow orchestration (100-200 lines)
- Skills: Focused patterns (200-500 lines)
- Rules: Path-specific guidance (50-150 lines)

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
| ARCHITECTURE.md | Detailed optimization plan and standards |
| commands/*.md | Individual command reference |
| agents/*.md | Agent behaviors and triggers |
| skills/*.md | Reusable implementation patterns |
| rules/*.md | Path-specific auto-applied rules |
| examples/*.md | Detailed walkthroughs and examples |

**Start here:** This README → Try `/ticket-start` or `/push`
