---
description: Intelligent workflow orchestrator that commits, pushes, and creates/updates PRs automatically
---

I'll handle the complete git workflow: commit → push → create/update PR.

**Workflow:**

1. **Validate current branch** (CRITICAL - do this first):
   - Check current branch with `git branch --show-current`
   - If on staging/main/production/master: STOP and error - cannot commit to protected branches
   - Extract ticket ID from branch name (pattern: `{type}/AAI-###-description`)
   - Verify ticket exists in Linear using `mcp__linear__get_issue`
   - If no ticket ID or ticket doesn't exist: STOP and guide user to `/ticket-create`

2. **Handle uncommitted changes**:
   - Check `git status` for staged/unstaged files
   - If changes exist: Use `commit-helper` skill to create validated commit
   - Extract ticket ID from branch, enhance commit message to conventional format
   - Run security checks (no secrets, no debug code)
   - Check multi-tenancy patterns (organizationId filters)
   - Check authentication patterns (enforceAbility middleware)

3. **Push to remote**:
   - Check for unpushed commits
   - Push to remote: `git push origin $(git branch --show-current)` or `git push -u` if new branch

4. **Handle PR** (use `git-pr-manager` agent):
   - Check if PR exists: `gh pr list --head $(git branch --show-current)`
   - If no PR: Launch `git-pr-manager` agent to create PR
     - Agent will use `pr-description-generator` skill for comprehensive description
     - Agent will ensure PR targets `staging` (ENFORCED)
     - Agent will use `ticket-status-sync` skill to update Linear to "In Review"
   - If PR exists: Report that PR was updated with new commits

5. **Provide summary**:
   - Show what was committed, pushed, and PR status
   - Include PR URL and Linear ticket URL
   - Suggest next steps (continue working, review PR, etc.)

**IMPORTANT**: Always validate the branch first. Never allow commits to staging/main/production.
