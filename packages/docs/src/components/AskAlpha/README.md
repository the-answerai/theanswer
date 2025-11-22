# Ask Alpha - Contextual AI Assistant

A composable AI assistant component that provides contextual help across your website. Built on top of the AnswerAI embed for reliable chat functionality.

## Features

- 🎯 **Context-Aware**: Automatically injects page URL, title, section, and custom content into every request
- 📡 **Full Embed Integration**: Uses the production-tested AnswerAI embed with all its features
- 💬 **Built-in Chat**: Full chat interface with message history, markdown rendering, and file uploads
- 🎨 **Multiple Variants**: Icon, chip, or full button styles
- 🔧 **Composable**: Use anywhere with custom context
- ⚡ **Thinking Animation**: Built-in loading states and progress indicators
- 🌐 **Chrome Extension**: Link to browser extension in footer

## Quick Start

### 1. Install (Already done in this project)

The component is located at `src/components/AskAlpha/`

### 2. Usage in Docusaurus (Automatic)

The Ask Alpha panel is automatically included in the layout. The chat bubble in the bottom-right corner triggers it.

### 3. Add Custom Buttons

You can add "Ask Alpha" buttons anywhere in your docs:

#### In MDX Files

```mdx
import { AskAlphaButton } from '@site/src/components/AskAlpha';

# My Page Title

Need help with this page? <AskAlphaButton
  variant="chip"
  context={{
    section: "Getting Started",
    content: "This page explains how to get started with AnswerAI..."
  }}
/>

## Section Title

<AskAlphaButton
  variant="icon"
  size="small"
  context={{
    section: "API Reference - Authentication",
    content: "Authentication uses API keys..."
  }}
/>
```

#### In React Components

```tsx
import { AskAlphaButton } from '@site/src/components/AskAlpha';

export function MyComponent() {
  return (
    <div>
      <h2>Complex Topic</h2>
      <AskAlphaButton
        variant="chip"
        size="medium"
        context={{
          page: "Custom Page Name",
          section: "Complex Topic",
          url: window.location.href,
          content: "Additional context about this topic..."
        }}
      />
    </div>
  );
}
```

## API Reference

### `<AskAlphaButton>`

A button that opens the Ask Alpha panel with custom context.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'icon' \| 'chip' \| 'button'` | `'chip'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `context` | `object` | `{}` | Custom context to pass to Alpha |
| `onClick` | `function` | - | Additional click handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Context Object

| Field | Type | Description |
|-------|------|-------------|
| `page` | `string` | Page name (auto: document.title) |
| `url` | `string` | Page URL (auto: window.location.href) |
| `section` | `string` | Section identifier |
| `content` | `string` | Page/section content for context |
| `...custom` | `any` | Any custom fields you want to send |

### `<AskAlpha>`

The main panel component (already included in layout).

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `chatflowId` | `string` | `'d480f12e-0f35-48a3-bac8-a2cacb924f78'` | Chatflow ID |
| `apiHost` | `string` | `'https://api.staging.theanswer.ai'` | API host URL |

## Examples

### 1. Documentation Page with Section-Specific Help

```mdx
---
title: API Authentication
---

import { AskAlphaButton } from '@site/src/components/AskAlpha';

# API Authentication

Learn how to authenticate with our API.

<AskAlphaButton
  variant="chip"
  context={{
    section: "API Authentication",
    content: `
      Our API uses Bearer token authentication.
      You can get your API key from the dashboard.
      Include it in the Authorization header.
    `
  }}
/>

## Getting Your API Key

<AskAlphaButton
  variant="icon"
  size="small"
  context={{
    section: "Getting API Key",
    content: "Navigate to Settings > API Keys to generate a new key."
  }}
/>
```

### 2. Tutorial with Step-Specific Help

```mdx
import { AskAlphaButton } from '@site/src/components/AskAlpha';

# Quick Start Tutorial

## Step 1: Installation

\`\`\`bash
npm install answerai
\`\`\`

<AskAlphaButton
  context={{
    section: "Step 1 - Installation",
    content: "Install AnswerAI using npm or yarn."
  }}
/>

## Step 2: Configuration

Create a `.env` file...

<AskAlphaButton
  context={{
    section: "Step 2 - Configuration",
    content: "Configure your environment variables including API_KEY and API_HOST."
  }}
/>
```

### 3. Programmatic Usage

```tsx
// Trigger from JavaScript
const openAskAlpha = (customContext) => {
  const event = new CustomEvent('ask-alpha-open', {
    detail: { context: customContext },
    bubbles: true
  });
  window.dispatchEvent(event);
};

// Usage
document.getElementById('help-btn').addEventListener('click', () => {
  openAskAlpha({
    section: "Checkout Flow",
    page: "Payment Page",
    content: "User is on payment step of checkout...",
    cartValue: "$120.50",
    userType: "premium"
  });
});
```

## Styling

The component uses CSS modules. To customize:

1. Override CSS variables in your global styles:

```css
:root {
  --ask-alpha-primary: #16213E;
  --ask-alpha-hover: #243050;
}
```

2. Or pass custom className:

```tsx
<AskAlphaButton
  className="my-custom-button"
  variant="chip"
/>
```

## How It Works

1. **Button Click**: When an `AskAlphaButton` is clicked, it dispatches a custom `ask-alpha-open` event
2. **Event Listener**: The `AskAlpha` component (in layout) listens for this event
3. **Context Capture**: The event carries context data (page, section, content, etc.)
4. **Panel Opens**: The slide-out panel opens with the AnswerAI embed
5. **Embed Initialization**: The full chatbot embed is loaded with custom theme
6. **Context Injection**: The `onRequest` hook intercepts API calls and injects context via `overrideConfig.promptValues`
7. **User Question**: User types their question in the embed chat interface
8. **API Call**: Question + injected context sent to chatflow
9. **Streaming Response**: AI streams back answer using embed's built-in streaming
10. **References**: Source documents displayed by embed if available

## Context Injection

The `AskAlphaPanel` uses the embed's `onRequest` hook to inject context into every API call:

```typescript
onRequest: async (request: RequestInit) => {
  if (request.body) {
    const body = JSON.parse(request.body as string)

    // Add overrideConfig with context
    body.overrideConfig = {
      ...body.overrideConfig,
      promptValues: {
        pageUrl: initialContext.url || window.location.href,
        pageName: initialContext.page || document.title,
        section: initialContext.section || '',
        pageContent: initialContext.content || '',
        ...initialContext
      }
    }

    request.body = JSON.stringify(body)
  }
}
```

The final API payload looks like:

```json
{
  "question": "How do I authenticate?",
  "streaming": true,
  "chatId": "uuid-here",
  "overrideConfig": {
    "promptValues": {
      "pageUrl": "https://docs.answerai.com/api/auth",
      "pageName": "API Authentication",
      "section": "Getting Started",
      "pageContent": "Our API uses Bearer tokens...",
      ...customContext
    }
  }
}
```

Your chatflow can access these values in prompts using `{{pageUrl}}`, `{{section}}`, etc.

## Best Practices

1. **Add to Complex Sections**: Place buttons near complex topics that users might need help with
2. **Provide Context**: Include relevant content in the `content` field for better AI responses
3. **Name Sections Clearly**: Use descriptive section names so users know what they're asking about
4. **Keep It Accessible**: Always include `aria-label` or descriptive text
5. **Test Responses**: Try asking questions to ensure context is being used effectively

## Troubleshooting

### Panel not opening?

Check browser console for errors. Make sure:
- `AskAlpha` component is in your layout
- Event listener is active

### No context being sent?

Verify:
- Context object is properly formatted
- `overrideConfig` is supported by your chatflow

### Streaming not working?

Ensure:
- API host is correct
- Chatflow supports streaming
- Network allows SSE connections

## Support

For issues or questions, ask Alpha! 😉

Or open an issue in the GitHub repo.
