---
description: Create a new Linear ticket with guided prompts and optional immediate work start
---

I'll help you create a new Linear ticket using the `linear-ticket-creator` agent.

Please use the Task tool to launch the `linear-ticket-creator` agent with the ticket title provided by the user (or ask for it if not provided).

**Important:** If the user has shared any screenshots or images in the conversation, explicitly mention them in the agent prompt so they can be included in the ticket for visual context.

The agent will:
1. Gather ticket requirements through clarifying questions
2. Explore the codebase for relevant context
3. Suggest appropriate labels, team, and priority
4. Draft a comprehensive ticket description
5. Create the ticket in Linear
6. Offer to start work immediately with `/ticket-start`

After the agent completes, provide the ticket ID, URL, and ask if the user wants to start work immediately.
