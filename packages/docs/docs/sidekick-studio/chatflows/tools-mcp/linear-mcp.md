# Linear MCP

**Version:** 1.0
**Last Updated:** 2025-12-08
**Category:** MCP Servers
**Integration:** [Linear](/docs/integrations/linear)

## Overview

The Linear MCP (Model Context Protocol) Server provides AI agents with comprehensive access to Linear's project management API. This integration enables automated issue management, sprint planning, project tracking, and team collaboration workflows through natural language interactions.

**Connection Type:** Remote SSE (Server-Sent Events)
**Server URL:** `https://mcp.linear.app/sse`
**Official**: Maintained by Linear

## Features

- **Issue Management**: Create, read, update, and search issues
- **Project Management**: Manage projects, milestones, and roadmaps
- **Team Collaboration**: Access team data, cycles, and user information
- **Label Management**: Create and manage issue labels
- **Comment System**: Add and retrieve comments on issues
- **Status Tracking**: Manage issue statuses and workflows
- **Documentation**: Access and search Linear's documentation

## Configuration

### Credentials

This component requires a **Linear API** credential with:
- **API Key**: Personal API key from Linear

### Getting Your API Key

1. Log in to your Linear workspace at [https://linear.app/](https://linear.app/)
2. Click on your profile picture (bottom left)
3. Navigate to **Settings → API**
4. Click **Create new key**
5. Give it a descriptive label (e.g., "AnswerAgent Integration")
6. Copy the API key immediately (it's only shown once)

## Available Tools

### Issue Management

#### `list_issues`
Search and list issues with flexible filtering options.

**Parameters:**
- `query` (optional): Search text for issue titles and descriptions
- `assignee` (optional): Filter by assignee (email, name, or "me")
- `team` (optional): Filter by team name or ID
- `project` (optional): Filter by project name or ID
- `state` (optional): Filter by issue state
- `label` (optional): Filter by label name or ID
- `priority` (optional): Filter by priority (0-4)
- `createdAt` (optional): Filter by creation date (ISO-8601 or duration)
- `updatedAt` (optional): Filter by update date (ISO-8601 or duration)
- `limit` (optional): Maximum results (default: 50, max: 250)
- `orderBy` (optional): Sort order ("createdAt" or "updatedAt")
- `includeArchived` (optional): Include archived issues (default: true)

**Returns:** Array of issues with metadata

#### `get_issue`
Retrieve detailed information about a specific issue.

**Parameters:**
- `id` (required): Issue ID

**Returns:** Complete issue details including attachments and git branch name

#### `create_issue`
Create a new issue in Linear.

**Parameters:**
- `title` (required): Issue title
- `team` (required): Team name or ID
- `description` (optional): Issue description (markdown)
- `assignee` (optional): User to assign (email, name, or "me")
- `state` (optional): Issue state (type, name, or ID)
- `priority` (optional): Priority level (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low)
- `labels` (optional): Array of label names or IDs
- `project` (optional): Project name or ID
- `cycle` (optional): Cycle name, number, or ID
- `dueDate` (optional): Due date (ISO format)
- `parentId` (optional): Parent issue ID for sub-issues

**Returns:** Created issue object

#### `update_issue`
Update an existing issue.

**Parameters:**
- `id` (required): Issue ID
- `title` (optional): New title
- `description` (optional): New description
- `assignee` (optional): New assignee
- `state` (optional): New state
- `priority` (optional): New priority
- `labels` (optional): Labels to set
- `project` (optional): Project to assign
- `cycle` (optional): Cycle to assign
- `dueDate` (optional): New due date
- `estimate` (optional): Estimate value

**Returns:** Updated issue object

### Status Management

#### `list_issue_statuses`
List available issue statuses for a team.

**Parameters:**
- `team` (required): Team name or ID

**Returns:** Array of available issue statuses

### Label Management

#### `list_issue_labels`
List labels available for issues.

**Parameters:**
- `team` (optional): Filter by team name or ID
- `name` (optional): Filter by label name
- `limit` (optional): Maximum results (default: 50, max: 250)
- `orderBy` (optional): Sort order

**Returns:** Array of issue labels

#### `create_issue_label`
Create a new issue label.

**Parameters:**
- `name` (required): Label name
- `color` (optional): Hex color code
- `description` (optional): Label description
- `teamId` (optional): Team UUID (workspace label if not provided)
- `isGroup` (optional): Create as label group (default: false)
- `parentId` (optional): Parent label UUID for child labels

**Returns:** Created label object

### Comment Management

#### `list_comments`
List comments for a specific issue.

**Parameters:**
- `issueId` (required): Issue ID

**Returns:** Array of comments

#### `create_comment`
Add a comment to an issue.

**Parameters:**
- `issueId` (required): Issue ID
- `body` (required): Comment content (markdown)
- `parentId` (optional): Parent comment ID for replies

**Returns:** Created comment object

### Project Management

#### `list_projects`
List projects in the workspace.

**Parameters:**
- `query` (optional): Search text
- `team` (optional): Filter by team
- `state` (optional): Filter by project state
- `member` (optional): Filter by team member
- `initiative` (optional): Filter by initiative
- `limit` (optional): Maximum results (default: 50, max: 250)
- `includeArchived` (optional): Include archived projects (default: false)
- `orderBy` (optional): Sort order
- `createdAt` (optional): Filter by creation date
- `updatedAt` (optional): Filter by update date

**Returns:** Array of projects

#### `get_project`
Get detailed project information.

**Parameters:**
- `query` (required): Project ID or name

**Returns:** Complete project details

#### `create_project`
Create a new project.

**Parameters:**
- `name` (required): Project name
- `team` (required): Team name or ID
- `description` (optional): Full description (markdown)
- `summary` (optional): Concise summary (max 255 chars)
- `lead` (optional): Project lead (email, name, or "me")
- `state` (optional): Project state
- `priority` (optional): Priority (0-4)
- `startDate` (optional): Start date (ISO format)
- `targetDate` (optional): Target date (ISO format)
- `labels` (optional): Array of labels

**Returns:** Created project object

#### `update_project`
Update an existing project.

**Parameters:**
- `id` (required): Project ID
- `name` (optional): New name
- `description` (optional): New description
- `summary` (optional): New summary
- `lead` (optional): New lead
- `state` (optional): New state
- `priority` (optional): New priority
- `startDate` (optional): New start date
- `targetDate` (optional): New target date
- `labels` (optional): Labels to set

**Returns:** Updated project object

### Cycle Management

#### `list_cycles`
Retrieve cycles (sprints) for a team.

**Parameters:**
- `teamId` (required): Team ID
- `type` (optional): Cycle type ("current", "previous", "next")

**Returns:** Array of cycles

### Team Management

#### `list_teams`
List all teams in the workspace.

**Parameters:**
- `query` (optional): Search text
- `limit` (optional): Maximum results (default: 50, max: 250)
- `includeArchived` (optional): Include archived teams (default: false)
- `orderBy` (optional): Sort order
- `createdAt` (optional): Filter by creation date
- `updatedAt` (optional): Filter by update date

**Returns:** Array of teams

#### `get_team`
Get detailed team information.

**Parameters:**
- `query` (required): Team UUID, key, or name

**Returns:** Complete team details

#### `list_users`
List workspace members.

**Parameters:**
- `query` (optional): Filter by name or email

**Returns:** Array of users

#### `get_user`
Get detailed user information.

**Parameters:**
- `query` (required): User ID, name, email, or "me"

**Returns:** Complete user details

### Documentation

#### `list_documents`
List Linear documents and project documentation.

**Parameters:**
- `query` (optional): Search text
- `projectId` (optional): Filter by project ID
- `limit` (optional): Maximum results (default: 50, max: 250)
- `includeArchived` (optional): Include archived documents (default: false)
- `orderBy` (optional): Sort order
- `createdAt` (optional): Filter by creation date
- `updatedAt` (optional): Filter by update date

**Returns:** Array of documents

#### `get_document`
Retrieve a specific document.

**Parameters:**
- `id` (required): Document ID or slug

**Returns:** Complete document content

#### `search_documentation`
Search Linear's official documentation.

**Parameters:**
- `query` (required): Search query
- `page` (optional): Page number (default: 0)

**Returns:** Search results from Linear docs

## Usage Examples

### Example 1: Create an Issue

```typescript
// Using the Linear MCP in a chatflow
const result = await linearMCP.create_issue({
    title: "Fix login button on mobile",
    team: "Engineering",
    description: "The login button is not responding on iPhone Safari",
    priority: 1,  // Urgent
    labels: ["bug", "frontend", "mobile"],
    assignee: "sarah@example.com"
})
```

### Example 2: List Team Issues

```typescript
// Get all high-priority issues assigned to current user
const issues = await linearMCP.list_issues({
    assignee: "me",
    priority: 2,  // High
    state: "In Progress",
    orderBy: "updatedAt"
})
```

### Example 3: Sprint Planning

```typescript
// Get current sprint and analyze workload
const cycles = await linearMCP.list_cycles({
    teamId: "team_uuid",
    type: "current"
})

const issues = await linearMCP.list_issues({
    cycle: cycles[0].name,
    team: "Engineering"
})
```

## Best Practices

### Issue Management
- Use descriptive titles and detailed descriptions
- Set appropriate priorities based on urgency
- Apply consistent labeling for better organization
- Link related issues using parent/child relationships

### Team Collaboration
- Use `assignee: "me"` for user context in agents
- Filter by team to scope operations appropriately
- Leverage cycles for sprint-based workflows

### Performance
- Use specific filters to reduce result sets
- Implement pagination for large queries
- Cache frequently accessed data
- Respect rate limits (2000 requests/hour)

### Security
- Store API keys in environment variables
- Use dedicated API keys for integrations
- Rotate keys regularly
- Monitor API usage and access logs

## Error Handling

Common error scenarios:

- **Unauthorized**: Invalid or expired API key
- **Not Found**: Issue, project, or team doesn't exist
- **Forbidden**: Insufficient permissions for operation
- **Rate Limited**: Exceeded API rate limits

Implement retry logic with exponential backoff for transient errors.

## Rate Limits

Linear API rate limits:
- **Standard**: 2000 requests per hour per API key
- **Complex queries**: May count as multiple requests

Monitor usage and implement caching to stay within limits.

## Resources

- [Linear API Documentation](https://developers.linear.app/docs)
- [Linear MCP Announcement](https://linear.app/changelog/2025-05-01-mcp)
- [Linear Integration Guide](/docs/integrations/linear)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## Support

For issues or questions:
- Check the [Linear API Status](https://status.linear.app/)
- Review [Linear Developer Documentation](https://developers.linear.app/)
- Contact Linear support for API-specific issues
