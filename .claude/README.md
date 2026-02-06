# Claude Code Architecture for TheAnswer

Streamlined 3-layer architecture for Linear ticket management and Git workflows.

## Quick Start

**7 Core Commands:**
```bash
/ticket-create          # Create new Linear ticket
/ticket-start AAI-123   # Start work on ticket
/push                   # Commit + Push + Create/Update PR
/pr-review 456          # Review pull request
/fleet                  # Parallel work on tickets or any goal
/blog-write             # Write technical blog posts
/issue-triage 278       # Triage GitHub issues
```

**Single Ticket Workflow:**
```bash
/ticket-start AAI-123   # Start work
/push                   # Commit, push, create PR
/pr-review             # Review your PR
```

**Parallel Workflow:**
```bash
/fleet AAI-123 AAI-456              # Work on multiple tickets
/fleet "add logging to all routes"  # Or any goal
/fleet                              # Check status
/fleet push                         # Create PRs
```

## Architecture

4-layer system: **Commands** → **Agents** → **Skills** + **Rules**

```
USER
  ↓
COMMANDS (7 core)
  /ticket-create  /ticket-start  /push  /pr-review  /fleet  /blog-write  /issue-triage
  ↓
AGENTS (9 specialized)
  Ticket:  linear-ticket-creator  linear-ticket-planner  linear-ticket-optimizer
  Git:     git-pr-manager  git-pr-reviewer  github-issue-triager
  Fleet:   fleet-worker (one agent handles all parallel tasks)
  Docs:    integration-docs-updater  integration-validator
  ↓
SKILLS (13 reusable patterns)
  Git:     branch-workflow  commit-helper  git-branch  pr-description-gen
  Ticket:  ticket-planning-workflow  ticket-status-sync  ticket-duplicate-detection
  Fleet:   fleet-patterns (worktrees + monitoring + git ops)
  Review:  pr-review-workflow  theanswer-patterns  error-handling
  Config:  linear-constants  github-issue-analysis
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

### `/fleet [tickets|goal|subcommand]`
Orchestrate parallel work with autonomous agents.

**What it does:**
- Accepts Linear tickets OR free-form goals
- Decomposes goals into parallelizable tasks
- Creates isolated worktrees for each task
- Spawns autonomous agents in parallel
- Tracks progress and handles completion

**Subcommands:**
| Usage | Action |
|-------|--------|
| `/fleet AAI-123 AAI-456` | Work on Linear tickets |
| `/fleet "add logging to routes"` | Decompose goal into parallel tasks |
| `/fleet` | Show status |
| `/fleet test` | Add tests to completed work |
| `/fleet verify` | Validate quality, patterns, conflicts |
| `/fleet push` | Commit and create PRs |
| `/fleet cleanup` | Remove worktrees |

**Example:**
```bash
# Ticket-based
/fleet AAI-123 AAI-456 AAI-789
/fleet
/fleet push

# Goal-based
/fleet "refactor error handling in all services"
/fleet
/fleet push
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

### `/issue-triage [issue_numbers...]`
Triage GitHub issues - analyze relevance, close fixed/outdated issues, or create Linear tickets.

**What it does:**
- Fetches GitHub issue details
- Searches codebase for related fixes
- Determines if issue is still relevant
- Takes action:
  - **Close** if fixed (with PR/commit reference)
  - **Close** if outdated (architecture changed)
  - **Create Linear ticket** if still valid

**Example:**
```bash
# Single issue
/issue-triage 278

# Multiple issues (parallel execution)
/issue-triage 278 316 331 343
```

**Output:**
```
Issue #278: Created AGENT-650 (bug still exists)
Issue #316: Closed (feature implemented in PR #567)
Issue #331: Created AGENT-651 (UX improvement valid)
Issue #343: Closed (outdated - chatflow list refactored)

Summary: 2 tickets created, 2 issues closed
```

## Directory Structure

```
.claude/
├── README.md                          # This file
├── ARCHITECTURE.md                    # Detailed optimization plan
├── commands/                          # 7 core user commands
│   ├── ticket-create.md
│   ├── ticket-start.md
│   ├── push.md                        # ⭐ Main workflow command
│   ├── pr-review.md
│   ├── fleet.md                       # 🚀 Parallel work orchestration
│   ├── blog-write.md
│   └── issue-triage.md
├── agents/                            # 9 specialized agents
│   ├── linear-ticket-creator.md
│   ├── linear-ticket-planner.md
│   ├── linear-ticket-optimizer.md
│   ├── git-pr-manager.md
│   ├── git-pr-reviewer.md
│   ├── github-issue-triager.md
│   ├── fleet-worker.md                # 🚀 Generic worker for any parallel task
│   ├── integration-docs-updater.md
│   └── integration-validator.md
├── skills/                            # 13 reusable patterns
│   ├── branch-workflow.md
│   ├── commit-helper.md
│   ├── git-branch.md
│   ├── pr-description-generator.md
│   ├── pr-review-workflow.md
│   ├── ticket-planning-workflow.md
│   ├── ticket-status-sync.md
│   ├── ticket-duplicate-detection.md
│   ├── theanswer-patterns.md
│   ├── error-handling.md
│   ├── linear-constants.md
│   ├── github-issue-analysis.md
│   └── fleet-patterns.md              # 🚀 Worktrees + monitoring + git ops
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

### Parallel Multi-Ticket Development
```bash
/fleet AAI-123 AAI-456 AAI-789   # Start 3 tickets in parallel
/fleet                           # Check progress
/fleet test                      # Add tests when done
/fleet verify                    # Validate before push
/fleet push                      # Create 3 PRs
```

### Goal-Based Parallel Work
```bash
/fleet "add input validation to all API endpoints"
# System decomposes into parallel tasks by route group
/fleet                           # Check progress
/fleet verify                    # Check quality & conflicts
/fleet push                      # Create PRs for each task
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
