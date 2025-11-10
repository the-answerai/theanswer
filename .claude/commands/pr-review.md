---
description: Conduct comprehensive pull request reviews with security, architecture, and quality checks
---

I'll conduct a comprehensive code review of a pull request using the `git-pr-reviewer` agent.

**Steps:**

1. **Identify PR to review**:
   - If user provided PR number/URL: Use that
   - If no argument: Find PR for current branch with `gh pr list --head $(git branch --show-current)`
   - If no PR found: Error and suggest using `/push` to create one first

2. **Launch git-pr-reviewer agent**:
   - Use the Task tool to launch `git-pr-reviewer` agent
   - Pass the PR number to review

3. **The agent will**:
   - Fetch PR details and diff from GitHub
   - Analyze changes for:
     - Security (secrets, SQL injection, XSS, authentication)
     - Multi-tenancy (organizationId filters required)
     - Authentication (enforceAbility middleware on routes)
     - Code quality and architecture
     - Test coverage
     - TheAnswer-specific patterns
   - Generate structured review with:
     - Critical issues (must fix)
     - Suggestions (nice to have)
     - Positive observations
   - Ask permission to post review to GitHub

4. **After review**:
   - Provide summary of findings
   - Show review status (Approve/Request Changes/Comment)
   - Suggest next steps

**IMPORTANT**: The agent has access to TheAnswer-specific validation rules and will check for organizationId filters and enforceAbility middleware.
