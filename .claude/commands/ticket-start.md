---
description: Begin work on a Linear ticket with full context, codebase exploration, and implementation planning
---

I'll help you start work on a Linear ticket using the `linear-ticket-planner` agent.

Please use the Task tool to launch the `linear-ticket-planner` agent with the ticket ID provided by the user (or ask for it if not provided).

The agent will:
1. Fetch complete ticket details from Linear
2. Explore the codebase for relevant context
3. Create a detailed implementation plan
4. Create a properly named git branch using the `git-branch` skill
5. Update the Linear ticket status to "In Progress" using the `ticket-status-sync` skill

After the agent completes, provide a summary of the branch created, implementation plan, and next steps.
