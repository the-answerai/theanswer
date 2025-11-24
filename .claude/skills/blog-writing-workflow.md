---
name: blog-writing-workflow
description: Comprehensive patterns and best practices for writing Docusaurus blog posts, tutorials, and marketing content
---

# Blog Writing Workflow for Docusaurus

This skill provides reusable patterns for creating high-quality blog content in Docusaurus format that balances technical accuracy, readability, and SEO optimization.

## Critical: Docusaurus Blog Requirements

### File Location and Naming
- **Path**: `/packages/docs/blog/`
- **Naming**: `YYYY-MM-DD-slug.md` (e.g., `2025-01-10-oauth2-implementation.md`)
- **Format**: Markdown (`.md`) or MDX (`.mdx`) for advanced React components

### Required Frontmatter
Every blog post MUST start with YAML frontmatter:
```yaml
---
slug: url-friendly-slug           # Required: URL path (e.g., "oauth2-implementation")
title: "Your Blog Post Title"     # Required: ALWAYS QUOTE if contains : ' " special chars
authors: [bradtaylorsf]           # Required: Author ID from authors.yml
tags: [tag1, tag2, tag3]          # Required: 3-5 relevant tags
description: "Meta description"   # ALWAYS QUOTE descriptions
---
```

**CRITICAL YAML Formatting Rules:**
- ✅ **ALWAYS quote** title if it contains `:` (colon) - e.g., `"Title: Subtitle"`
- ✅ **ALWAYS quote** description (usually contains `'` apostrophes)
- ✅ **ALWAYS quote** any value with special characters: `: ' " { } [ ] , & * # ? | - < > = ! % @ \`
- ❌ **Unquoted colons or apostrophes will cause build errors**

**Examples:**
```yaml
# ❌ WRONG - Will cause YAML parse error
title: Human at the Center: Building AI Agents
description: You're scaling your judgment

# ✅ CORRECT - Properly quoted
title: "Human at the Center: Building AI Agents"
description: "You're scaling your judgment"
```

### Optional Frontmatter Fields
```yaml
description: "Custom meta description (150-160 chars)"  # ALWAYS QUOTED
image: /img/blog/featured-image.png
hide_table_of_contents: false
keywords: [keyword1, keyword2]
```

### Content Structure Requirements
1. **Title (H1)**: First line after frontmatter
2. **Introduction**: 1-2 paragraphs
3. **Truncate Marker**: `<!-- truncate -->` after intro (for "Read more" on index)
4. **Body Content**: Multiple H2/H3 sections
5. **Conclusion**: Summary and CTA

## Phase 1: Research & Discovery

### Codebase Exploration Patterns

**Feature-based posts:**
```bash
# Find the feature implementation
Grep "class FeatureName" --type ts
Glob "**/*feature*.ts"

# Understand the API
Read packages/server/src/routes/feature/
Read packages/server/src/controllers/feature/

# Check usage examples
Grep "useFeature" --type tsx
Read apps/web/app/**/page.tsx
```

**Tutorial posts:**
```bash
# Find entry points
Grep "getting started" -i --output-mode content
Read README.md
Read docs/quickstart.md

# Understand setup process
Grep "pnpm install" --output-mode content
Read package.json

# Find common patterns
Grep "example" -i --type ts
```

**Architecture posts:**
```bash
# Understand system design
Read CLAUDE.md
Read .cursorrules
Grep "architecture" -i --output-mode content

# Map components
Glob "**/README.md"
Read packages/*/CLAUDE.md
```

### Documentation Mining

**What to look for:**
- Setup instructions → Tutorial content
- Architecture decisions → Technical deep dives
- Common issues → Problem/solution posts
- Feature descriptions → Announcement posts
- Code examples → Tutorial snippets

**Key files to check:**
- `CLAUDE.md` - Architecture and patterns
- `README.md` - Quick start and overview
- `package.json` - Dependencies and scripts
- `.cursorrules` - Project conventions
- `docs/**/*` - Existing documentation

### Research Checklist

- [ ] Understand the core functionality
- [ ] Identify unique value propositions
- [ ] Gather concrete examples
- [ ] Note technical constraints or requirements
- [ ] Check for existing related content
- [ ] Identify key terminology and jargon
- [ ] Understand target audience needs

## Docusaurus-Specific Features & Formatting

### YouTube Video Embedding

**Standard Format:**
```html
<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="Descriptive Video Title"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{maxWidth: '100%', height: 'auto', aspectRatio: '16/9'}}
  ></iframe>
</div>
```

**Key Points:**
- Replace `VIDEO_ID` with actual YouTube video ID
- Use double curly braces `{{}}` for JSX style objects
- Include `title` attribute for accessibility
- Responsive sizing with `maxWidth: '100%'` and `aspectRatio: '16/9'`

### Gamma Presentation Embedding

**Standard Format (REQUIRED - include in every blog post):**
```html
<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    src="https://gamma.app/embed/GAMMA_ID"
    style={{width: '700px', maxWidth: '100%', height: '450px'}}
    allow="fullscreen"
    title="Presentation Title"
  ></iframe>
</div>
```

**Key Points:**
- Replace `GAMMA_ID` with actual Gamma presentation ID from user
- Use double curly braces `{{}}` for JSX style objects
- Fixed width of 700px with 100% max-width for responsiveness
- Fixed height of 450px
- Include `allow="fullscreen"` attribute
- Include descriptive `title` attribute

**Example:**
```html
<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    src="https://gamma.app/embed/00x4oxty5fnko3t"
    style={{width: '700px', maxWidth: '100%', height: '450px'}}
    allow="fullscreen"
    title="Teaching, Not Replacing: How Humans Train AI"
  ></iframe>
</div>
```

**Placement:**
- Typically placed after YouTube video embed (if present)
- Before the main content sections
- After the `<!-- truncate -->` marker

### Admonitions (Callout Boxes)

Docusaurus provides styled callout boxes:

```markdown
:::note
This is a standard note.
:::

:::tip Pro Tip
Use this for helpful tips and best practices.
:::

:::info Did You Know?
Use this for interesting information.
:::

:::warning Important
Use this for warnings or cautions.
:::

:::danger Critical
Use this for critical security or breaking change notices.
:::
```

**When to Use:**
- `:::note` - Additional context or clarification
- `:::tip` - Best practices, pro tips, shortcuts
- `:::info` - Interesting facts, "did you know" content
- `:::warning` - Important considerations, potential issues
- `:::danger` - Security concerns, breaking changes, critical issues

### Code Blocks with Syntax Highlighting

**Basic Code Block:**
````markdown
```typescript
const example: string = "TypeScript code";
```
````

**With Title:**
````markdown
```typescript title="src/auth/oauth2.ts"
export const refreshToken = async (token: string) => {
  // Implementation
}
```
````

**With Line Highlighting:**
````markdown
```typescript {2,5-7}
const config = {
  apiKey: process.env.API_KEY,  // This line is highlighted
  baseUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,                   // Lines 5-7 are highlighted
  backoff: true,
  maxRetries: 5
}
```
````

**Supported Languages:**
- `typescript`, `javascript`, `jsx`, `tsx`
- `python`, `java`, `go`, `rust`
- `bash`, `shell`, `yaml`, `json`
- `sql`, `graphql`, `markdown`
- Many more via Prism.js

### Inline JSX and Custom Styling

You can use inline JSX for custom layouts:

```html
<div style={{
  textAlign: 'center',
  padding: '2rem',
  backgroundColor: 'var(--ifm-color-primary-lightest)',
  borderRadius: '8px'
}}>
  <h3>Custom Styled Content</h3>
  <p>This content has custom styling.</p>
</div>
```

**CRITICAL MDX Curly Braces Warning:**

MDX parses curly braces `{}` as JavaScript expressions. This causes build errors if used in markdown text.

```markdown
❌ WRONG - Causes "Could not parse expression with acorn" error:
- "Add {detail} here"
- "Claims {X}; source shows {Y}"
- "Expected {format}"

✅ CORRECT - Use square brackets for placeholders:
- "Add [detail] here"
- "Claims [X]; source shows [Y]"
- "Expected [format]"

✅ OK - Double curly braces in JSX attributes:
<div style={{margin: '2rem'}}>content</div>
<iframe style={{maxWidth: '100%', aspectRatio: '16/9'}}></iframe>
```

**Rule of thumb:**
- Regular markdown text → Use `[square brackets]`
- JSX/HTML attributes → Use `{{double curly braces}}`

**Common Use Cases:**
- Centered content sections
- Custom call-to-action boxes
- Feature comparisons or grids
- Image galleries with captions

### Links and Cross-References

**CRITICAL: Always verify links before using them.**

**Internal Documentation Links (TheAnswer):**
```markdown
# ✅ CORRECT paths (verified)
[Getting Started](/docs/intro)           # NOT /docs/getting-started
[AI Agents](/agents)                     # NOT /docs/agents
[Chat](/chat)                            # NOT /docs/chat
[Browser Extension](/browser)
[Sidekick Studio](/sidekick-studio)
[Developer Guide](/docs/developers)
[API Reference](/docs/api)
[Discord Community](https://discord.gg/X54ywt8pzj)

# ❌ WRONG paths (will 404)
[Getting Started](/docs/getting-started)  # Does not exist
[AI Agents](/docs/agents)                 # Wrong path
```

**Internal Blog Links:**
```markdown
[Previous Post](/blog/previous-post-slug)
```

**External Links - Langfuse (Current as of 2024/2025):**
```markdown
# Main & Observability
[Langfuse Docs](https://langfuse.com/docs)
[Traces & Sessions](https://langfuse.com/docs/tracing-features/sessions)
[Data Model](https://langfuse.com/docs/observability/data-model)

# Evaluations
[Evaluation Overview](https://langfuse.com/docs/evaluation/overview)
[Human Annotation](https://langfuse.com/docs/evaluation/evaluation-methods/annotation)
[LLM-as-Judge](https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge)
[Manual Scores](https://langfuse.com/docs/scores/manually)

# Datasets & Experiments
[Datasets](https://langfuse.com/docs/evaluation/experiments/datasets)
[Experiments via SDK](https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk)
[Experiments via UI](https://langfuse.com/docs/evaluation/experiments/experiments-via-ui)

# Metrics
[Custom Dashboards](https://langfuse.com/docs/metrics/features/custom-dashboards)
[Metrics Overview](https://langfuse.com/docs/metrics/overview)
[Metrics API](https://langfuse.com/docs/metrics/features/metrics-api)
```

**Best Practices:**
- ✅ Use absolute paths starting with `/` for internal links
- ✅ Always include descriptive anchor text
- ✅ **Verify internal paths exist in `/packages/docs/docs/` before using**
- ✅ **Use WebSearch to verify external docs URLs are current**
- ✅ Docusaurus handles opening external links appropriately
- ❌ **Never guess link paths - always verify**

### Images

**Standard Image:**
```markdown
![Alt text description](/img/blog/image-name.png)
```

**Image with Caption:**
```html
<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <img src="/img/blog/architecture-diagram.png" alt="System Architecture" style={{maxWidth: '100%', height: 'auto'}} />
  <p style={{fontStyle: 'italic', color: 'var(--ifm-color-emphasis-600)'}}>
    Figure 1: TheAnswer system architecture
  </p>
</div>
```

**Image Best Practices:**
- Store images in `/packages/docs/static/img/blog/`
- Use descriptive alt text for accessibility
- Optimize images for web (compressed, appropriate size)
- Use responsive widths (`maxWidth: '100%'`)

### Tables

Standard Markdown tables work in Docusaurus:

```markdown
| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Chatflows | 5 | Unlimited | Unlimited |
| API Calls | 1000/mo | 100K/mo | Custom |
| Support | Community | Email | Dedicated |
```

### Truncate Marker

**Critical**: Add `<!-- truncate -->` after your introduction:

```markdown
# Blog Post Title

This is the introduction that appears on the blog index page.
It should hook the reader and summarize the post.

<!-- truncate -->

## Main Content

The rest of the content appears only on the full post page.
```

**Purpose:**
- Shows introduction on blog index (`/blog`)
- Adds "Read more" link
- Full content visible on individual post page

## Phase 2: Audience Analysis

### Audience Profiles

**Technical Developers:**
- **Characteristics**: Comfortable with code, wants implementation details
- **Focus**: How it works, architecture, code examples, best practices
- **Tone**: Technical but conversational, use proper terminology
- **Length**: 1,500-2,500 words with deep technical detail
- **Keywords**: Technical terms, framework names, patterns

**Product Users:**
- **Characteristics**: Understands concepts, wants practical guidance
- **Focus**: What it does, how to use it, benefits, tutorials
- **Tone**: Clear and helpful, explain technical terms
- **Length**: 1,200-1,800 words with step-by-step guidance
- **Keywords**: Feature benefits, use cases, workflows

**Business Decision Makers:**
- **Characteristics**: Needs outcomes and ROI, limited technical depth
- **Focus**: Business value, competitive advantages, results
- **Tone**: Professional and persuasive, minimal jargon
- **Length**: 800-1,200 words focused on impact
- **Keywords**: Benefits, ROI, competitive terms, industry trends

**General Public:**
- **Characteristics**: May be new to the topic, needs context
- **Focus**: Why it matters, real-world applications, accessibility
- **Tone**: Friendly and educational, use analogies
- **Length**: 1,000-1,500 words with clear explanations
- **Keywords**: Everyday language, problem-focused

### Questions to Ask

**Audience identification:**
- Who will read this? (developers, users, executives, general public)
- What is their technical skill level? (beginner, intermediate, expert)
- What problem are they trying to solve?
- What do they already know about this topic?

**Content goals:**
- What action should readers take? (try feature, learn concept, adopt tool)
- What is the primary message or takeaway?
- What makes this content unique or valuable?
- How does this fit into overall content strategy?

**Format and constraints:**
- What is the target length?
- Are there specific keywords to include?
- Are there brand guidelines to follow?
- Where will this be published? (blog, docs, medium, dev.to)

## Phase 3: Content Structure

### Headline Formulas

**Problem/Solution:**
- "How to [Achieve Desired Outcome] with [Tool/Approach]"
- "The [Problem] Every [Audience] Faces (And How to Fix It)"
- "[Number] Ways to [Solve Problem] Using [Technology]"

**Tutorial:**
- "Complete Guide to [Topic] in [Timeframe]"
- "Building [Project] with [Technology]: A Step-by-Step Tutorial"
- "From Zero to [Goal]: [Topic] Tutorial"

**Technical Deep Dive:**
- "Understanding [Complex Concept]: A Technical Deep Dive"
- "How We Built [Feature] Using [Technology]"
- "The Architecture Behind [System/Feature]"

**Announcement:**
- "Introducing [Feature]: [Key Benefit]"
- "[Feature] is Here: Everything You Need to Know"
- "What's New in [Product/Version]: [Highlight]"

**Best Practices:**
- "X Best Practices for [Topic/Task]"
- "Common [Topic] Mistakes and How to Avoid Them"
- "Mastering [Skill]: Advanced Techniques and Tips"

### Introduction Hooks

**Story/Anecdote:**
```markdown
Last week, a developer asked us: "Why does [problem] happen?"
It's a question we hear often, and the answer reveals something
fascinating about [topic]...
```

**Problem Statement:**
```markdown
If you've ever struggled with [problem], you're not alone.
According to [source], [statistic] of developers face this
challenge daily. Today, we're going to solve it.
```

**Bold Statement:**
```markdown
[Controversial or surprising statement about the topic].
Let me explain why this matters and what you can do about it.
```

**Question:**
```markdown
What if you could [achieve goal] in half the time?
With [solution], you can. Here's how...
```

### Body Structure Patterns

**Tutorial Format:**
```markdown
## Introduction
- Hook
- What you'll learn
- Prerequisites

## Understanding the Basics
- Core concepts
- Key terminology
- Why it matters

## Step-by-Step Implementation
### Step 1: [Action]
- Clear instruction
- Code example
- Expected outcome

### Step 2: [Action]
- Build on previous step
- Show progression
- Highlight key points

[Repeat for each step]

## Common Issues and Troubleshooting
- Problem: Solution format
- Real-world gotchas

## Next Steps
- Advanced techniques
- Related resources
- Call to action
```

**Feature Announcement Format:**
```markdown
## Introduction
- The problem we're solving
- Why we built this

## Introducing [Feature]
- What it is
- Key capabilities
- Visual/demo (note where needed)

## How It Works
- Technical overview (appropriate to audience)
- Architecture highlights
- Key differentiators

## Getting Started
- Quick start guide
- Code examples
- Integration steps

## Use Cases
- Real-world applications
- Customer stories (if available)
- Benefits for different personas

## What's Next
- Roadmap (if appropriate)
- Resources
- Call to action
```

**Technical Deep Dive Format:**
```markdown
## Introduction
- Technical challenge or question
- Why this matters

## Background and Context
- Prior art
- Design requirements
- Constraints

## Our Approach
- High-level architecture
- Key design decisions
- Tradeoffs considered

## Technical Implementation
- Detailed breakdown
- Code examples
- Performance considerations

## Results and Learnings
- Outcomes achieved
- Lessons learned
- Future improvements

## Conclusion
- Summary of key points
- Takeaways for readers
- Resources for deeper learning
```

### Code Example Best Practices

**Format:**
```typescript
// Use language-specific syntax highlighting
// Add comments explaining what each section does

// Example: Creating a new chatflow with authentication
const createChatflow = async (data: ChatflowData) => {
    // Validate user permissions (TheAnswer pattern)
    if (!await checkOwnership(data.organizationId, user)) {
        throw new InternalFlowiseError(
            StatusCodes.UNAUTHORIZED,
            'Error: Unauthorized access'
        )
    }

    // Create the chatflow with multi-tenancy
    return await chatflowService.create({
        ...data,
        userId: user.id,
        organizationId: user.organizationId
    })
}
```

**Guidelines:**
- Keep examples focused (10-20 lines max per snippet)
- Use realistic variable names from actual codebase
- Add comments explaining non-obvious parts
- Show complete examples when possible
- Include error handling
- Match project conventions and patterns

## Phase 4: CTA Strategy (CRITICAL)

### Why CTAs Throughout Content Matter

**Problem:** Traditional blog posts put a single CTA at the end. By the time readers reach it, many have bounced.

**Solution:** Strategic CTAs throughout the content capture readers when they're most engaged with specific topics.

### CTA Requirements (NON-NEGOTIABLE)

**Every blog post MUST include:**
- **5-10 CTAs total** (varies by post length)
- **One CTA per major section** (after H2 or significant H3)
- **All link to:** `https://calendly.com/brad-theanswer/answeragent-intro`
- **Context-appropriate text** (never generic "Book a call")
- **Bold markdown link format**

### CTA Placement Strategy

**Add CTAs after:**
1. **Problem Statement Sections** - Reader understands pain point
2. **Technical Implementation Sections** - Reader sees complexity
3. **Architecture/Design Sections** - Reader needs strategic guidance
4. **Best Practices/Troubleshooting** - Reader values expertise
5. **Use Case/Example Sections** - Reader relates to scenario
6. **Before Major Transitions** - Natural break in content flow

**Example Placement:**
```markdown
## Understanding Multi-Tenant Architecture

[Technical explanation of multi-tenancy patterns...]

:::tip Pro Tip
Always filter queries by organizationId to ensure data isolation.
:::

**[Building multi-tenant systems? Get architectural guidance and security best practices →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Implementing Database Isolation
```

### CTA Text Patterns

**Formula:** `[Question about pain point] + [Specific benefit] + [Action verb →]`

**Technical Implementation Pattern:**
```markdown
**[Running into [specific challenge]? Get [specific help] for [specific area] →](url)**
**[Need help [specific action]? [Specific service/benefit] →](url)**
**[Want [specific outcome]? [Specific offering] →](url)**
```

**Examples:**
```markdown
**[Running into integration challenges? Get hands-on support for your setup →](url)**
**[Need help implementing observability? Schedule a consultation →](url)**
**[Want to optimize your eval strategy? Book a planning session →](url)**
```

**Debugging/Troubleshooting Pattern:**
```markdown
**[Struggling with [specific issue]? Let's [specific approach] →](url)**
**[Debugging [specific problem]? Get expert guidance on [specific solution] →](url)**
```

**Examples:**
```markdown
**[Struggling with non-deterministic failures? Let's discuss your debugging challenges →](url)**
**[Debugging multi-turn conversations? Get expert guidance on session-based analysis →](url)**
```

**Architecture/Strategy Pattern:**
```markdown
**[Building [specific system]? Let's discuss [specific aspect] for your architecture →](url)**
**[Designing [specific feature]? Get [specific guidance] →](url)**
**[Ready to [specific outcome]? [Specific service/deliverable] →](url)**
```

**Examples:**
```markdown
**[Building complex multi-agent systems? Let's discuss observability strategies for your architecture →](url)**
**[Designing a feedback loop? Get help creating your continuous improvement system →](url)**
**[Ready to launch your review program? Get a complete implementation roadmap →](url)**
```

### CTA Examples by Audience

**For Developers/Engineers:**
```markdown
**[Running into integration challenges? Get hands-on support for your setup →](url)**
**[Want to master trace analysis? Let's walk through your use cases →](url)**
**[Need help debugging production issues? Schedule a deep dive session →](url)**
```

**For Technical Leaders:**
```markdown
**[Building a team evaluation workflow? Get architectural guidance and best practices →](url)**
**[Need a roadmap for production deployment? Book a strategy session →](url)**
**[Ready to scale your AI operations? Let's design your infrastructure →](url)**
```

**For Domain Experts/Reviewers:**
```markdown
**[Training a review team? Get onboarding materials and workflow templates →](url)**
**[Need custom rubrics for your domain? Get templates tailored to your use case →](url)**
**[Setting up your review workflow? Get best practices documentation →](url)**
```

### What NOT to Do - Bad CTA Examples

```markdown
❌ **[Book a call →](url)** - Too generic, no context
❌ **[Contact us](url)** - No specific benefit
❌ **[Learn more →](url)** - Vague, no value proposition
❌ **[Get help here](url)** - Generic, not action-oriented
❌ **[Click here to schedule](url)** - "Click here" is anti-pattern
❌ **[Interested? Let's talk](url)** - Weak, no specific benefit
```

### CTA Density Guidelines

**By Content Length:**
- **1,000-1,500 words:** 4-6 CTAs
- **1,500-2,500 words:** 6-8 CTAs
- **2,500-3,500 words:** 8-10 CTAs
- **3,500+ words:** 10-12 CTAs

**Spacing:**
- One CTA every 250-400 words (approximately)
- Never two CTAs back-to-back without content between
- Place after natural content breaks (after admonitions, code blocks, lists)

### Testing CTA Effectiveness

**Track which patterns work best:**
- CTAs after problem statements (usually highest conversion)
- CTAs in troubleshooting sections (high intent)
- CTAs before code examples (reader seeking implementation help)
- CTAs in FAQ answers (specific pain points)

### Complete CTA Integration Example

```markdown
## Debugging AI Agent Failures

When your AI agent fails in production, traditional debugging approaches fall short. You need observability tools designed specifically for LLM applications.

[Explanation of observability tools...]

**[Struggling with non-deterministic failures? Let's discuss your debugging challenges →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Setting Up Langfuse Tracing

Langfuse provides structured traces that show exactly what your agent is thinking at each step.

[Implementation details...]

```typescript
// Code example
```

**[Running into integration challenges? Get hands-on support for your setup →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Understanding Trace Data

Once tracing is enabled, you can analyze exactly where failures occur.

[Analysis explanation...]

:::tip Pro Tip
Filter traces by error rate to identify systematic issues quickly.
:::

**[Want to master trace analysis for your agents? Let's walk through your use cases →](https://calendly.com/brad-theanswer/answeragent-intro)**

## Building Custom Dashboards

[Dashboard content...]
```

**Key Elements:**
- ✅ 3 CTAs in ~800 words
- ✅ Each CTA is context-specific
- ✅ Placed after natural content breaks
- ✅ Action-oriented with specific benefits
- ✅ Appropriate spacing

### CTA Final Checklist

Before publishing, verify:
- [ ] Total CTA count: 5-10 (based on post length)
- [ ] One CTA per major section
- [ ] All CTAs link to Calendly: `https://calendly.com/brad-theanswer/answeragent-intro`
- [ ] No generic "Book a call" text
- [ ] Each CTA relates to surrounding content
- [ ] CTAs use bold markdown: `**[text →](url)**`
- [ ] Appropriate spacing between CTAs
- [ ] CTAs placed after natural breaks (not mid-paragraph)
- [ ] Action verbs used (Get, Schedule, Book, Let's, Ready to, Need, Want)
- [ ] Specific benefits mentioned in each CTA

## Phase 5: SEO Optimization

### Keyword Research and Usage

**Primary keyword placement:**
- H1 headline (naturally, not forced)
- First paragraph (within first 100 words)
- At least one H2 subheading
- Meta description
- Conclusion paragraph
- Image alt text

**Secondary keywords:**
- Distribute naturally throughout content
- Use in subheadings (H2, H3)
- Include semantic variations
- Don't sacrifice readability for keywords

**Keyword density:**
- Aim for 1-2% keyword density
- Focus on natural language
- Use synonyms and related terms
- Avoid keyword stuffing

### Meta Description Formula

**Format:** [Value proposition] + [Key benefit] + [Call to action]

**Examples:**
```
Learn how to implement OAuth2 authentication in 15 minutes.
This step-by-step guide covers setup, configuration, and best
practices. Start building secure apps today.

Discover the new document store feature in TheAnswer. Organize,
search, and retrieve documents 10x faster with AI-powered indexing.
Try it free.

A technical deep dive into our multi-tenant architecture. Learn
how we handle isolation, scaling, and security for 10,000+
organizations. Read the full case study.
```

**Best practices:**
- 150-160 characters (Google's display limit)
- Include primary keyword
- Make it compelling and actionable
- Match the content's value proposition
- Use active voice

### Internal Linking Strategy

**Link to:**
- Related blog posts
- Documentation pages
- Product pages
- Getting started guides
- API reference (for technical posts)

**Anchor text best practices:**
- Use descriptive phrases (not "click here")
- Include relevant keywords naturally
- Make it clear what users will find
- Keep it concise (3-5 words)

**Example:**
```markdown
To learn more about multi-tenancy patterns, check out our
[authentication guide](link) and [database architecture](link)
documentation.
```

### External References

**When to link externally:**
- Citing statistics or research
- Referencing official documentation
- Providing additional learning resources
- Supporting technical claims
- Comparing with alternatives

**Best practices:**
- Link to authoritative sources only
- Open in new tab for user retention
- Check links aren't broken
- Add rel="nofollow" for untrusted sources (note in output)

## Phase 5: Readability Optimization

### Sentence Structure

**Vary length:**
- Short (5-10 words): Emphasis and clarity
- Medium (10-20 words): Main ideas and explanations
- Long (20-30 words): Complex concepts, when necessary
- Mix them for rhythm and engagement

**Active voice preference:**
```markdown
❌ The database is queried by the service layer.
✅ The service layer queries the database.

❌ Errors are handled through middleware.
✅ Middleware handles errors.
```

**Clarity over cleverness:**
```markdown
❌ Our implementation leverages cutting-edge paradigms...
✅ Our implementation uses modern authentication patterns...
```

### Paragraph Guidelines

**Length:**
- Web content: 2-4 sentences per paragraph
- Technical content: May be longer for complex explanations
- Always break up text walls

**Structure:**
- One main idea per paragraph
- Topic sentence first
- Supporting details follow
- Transition to next paragraph

**Visual breaks:**
- Use subheadings every 2-3 paragraphs
- Add bullet points or lists
- Include code blocks
- Note where images/diagrams would help

### Lists and Formatting

**When to use bullets:**
- Non-sequential items
- Features or benefits
- Options or alternatives
- Key points to remember

**When to use numbers:**
- Sequential steps
- Ranked items
- Ordered processes
- Prioritized lists

**Formatting emphasis:**
- **Bold**: Key terms, important concepts
- *Italic*: Subtle emphasis, terms being defined
- `Code`: Variables, commands, file names
- > Blockquote: Important notes or callouts

### Transitions and Flow

**Between sections:**
- "Now that we understand X, let's explore Y..."
- "With the basics covered, we can dive into..."
- "This brings us to an important consideration..."

**Within sections:**
- "Additionally," "Furthermore," "Moreover,"
- "However," "On the other hand," "In contrast,"
- "For example," "Specifically," "In other words,"
- "As a result," "Therefore," "Consequently,"

## Phase 6: Quality Assurance

### Technical Accuracy Checklist

- [ ] All technical terms used correctly
- [ ] Code examples tested and working
- [ ] Architecture descriptions match codebase
- [ ] Version numbers and compatibility noted
- [ ] Performance claims backed by data
- [ ] Security recommendations verified
- [ ] Links to source code accurate
- [ ] API examples current and complete

### Readability Checklist

- [ ] Headline clear and compelling
- [ ] Introduction hooks reader
- [ ] Logical flow between sections
- [ ] Paragraphs concise and focused
- [ ] Sentence length varied
- [ ] Technical jargon explained
- [ ] Examples relevant and helpful
- [ ] Conclusion summarizes key points
- [ ] **5-10 context-appropriate CTAs throughout (one per major section)**
- [ ] **All CTAs link to:** `https://calendly.com/brad-theanswer/answeragent-intro`
- [ ] **CTA text is specific, not generic** (e.g., not "Book a call")

### SEO Checklist

- [ ] Primary keyword in H1
- [ ] Primary keyword in first 100 words
- [ ] Meta description 150-160 characters
- [ ] Keywords used naturally (1-2% density)
- [ ] Internal links added (3-5)
- [ ] External authoritative sources cited
- [ ] Image alt text noted
- [ ] URL slug optimized
- [ ] Content length appropriate (1,200+ words)

### Brand and Style Checklist

- [ ] Tone matches audience
- [ ] Voice consistent throughout
- [ ] Terminology matches brand
- [ ] No spelling or grammar errors
- [ ] Formatting consistent
- [ ] Company name styled correctly
- [ ] Product names capitalized properly
- [ ] Legal/compliance requirements met

## Phase 7: Revision and Polish

### First Draft Focus

- Get ideas on paper
- Cover all key points
- Don't self-edit while writing
- Note gaps or missing information
- Mark areas needing examples

### Second Draft Focus

- Strengthen weak sections
- Add missing examples or details
- Improve transitions
- Remove redundancy
- Tighten language

### Final Polish Focus

- Check every sentence for clarity
- Verify all links work
- Confirm code examples correct
- Proofread for typos
- Read aloud for flow
- Final SEO check

### Common Improvements

**Strengthen openings:**
```markdown
❌ "In this post, I'm going to talk about authentication."
✅ "Authentication failures cost companies $4M annually.
     Here's how to get it right."
```

**Eliminate filler:**
```markdown
❌ "It's important to note that you should probably consider..."
✅ "You should..."
```

**Simplify complexity:**
```markdown
❌ "The asynchronous nature of the callback mechanism..."
✅ "The callback happens asynchronously..."
```

**Add specificity:**
```markdown
❌ "This improves performance significantly."
✅ "This reduces response time from 500ms to 50ms—a 10x improvement."
```

## Content Types Reference

### Tutorial Posts

**Characteristics:**
- Step-by-step instructions
- Progressive complexity
- Code examples at each step
- Expected outcomes stated
- Troubleshooting section

**Length:** 1,500-2,500 words

**Structure:** Problem → Solution → Implementation → Testing → Next Steps

### Feature Announcements

**Characteristics:**
- Problem/solution focus
- Benefits-driven
- Visual/demo heavy
- Quick start guide
- Future roadmap tease

**Length:** 1,000-1,500 words

**Structure:** Hook → Problem → Solution → How It Works → Get Started

### Technical Deep Dives

**Characteristics:**
- Architecture focus
- Design decisions explained
- Tradeoffs discussed
- Performance data
- Lessons learned

**Length:** 2,000-3,000 words

**Structure:** Challenge → Approach → Implementation → Results → Learnings

### Best Practices Posts

**Characteristics:**
- List format or numbered
- Each practice explained
- Code examples
- Common mistakes section
- Actionable advice

**Length:** 1,200-2,000 words

**Structure:** Introduction → Practice #1 → Practice #2 → ... → Summary

### Case Studies

**Characteristics:**
- Real-world scenario
- Problem clearly defined
- Solution detailed
- Results quantified
- Lessons applicable

**Length:** 1,500-2,500 words

**Structure:** Context → Challenge → Solution → Implementation → Results → Takeaways

## AI-Optimized FAQ Section (CRITICAL)

FAQs are now the **most important** part of blog posts for AI agent discovery. When AI agents (ChatGPT, Claude, Perplexity, etc.) search the web, they prioritize content that directly answers questions. Well-written FAQs dramatically increase the probability your article will be cited by AI systems.

### Why FAQs Matter for AI Discovery

**AI agents look for:**
1. **Direct question-answer pairs** that match user queries
2. **Natural language questions** that users actually ask
3. **Comprehensive answers** with specific details
4. **Semantic relevance** to the main topic
5. **Authority signals** (technical accuracy, examples, data)

**Benefits:**
- ✅ **10-15x higher** chance of AI agent citation
- ✅ Ranks for **long-tail keywords** automatically
- ✅ Answers **"People Also Ask"** queries
- ✅ Captures **voice search** traffic
- ✅ Provides **snippet-worthy** content for search engines

### FAQ Structure Requirements

**Minimum: 10-15 FAQs per blog post**
**Optimal: 15-20 FAQs for technical content**

Each FAQ must follow this format:

```markdown
## Frequently Asked Questions

### What is [specific topic] and how does it work?

[Comprehensive answer in 2-4 paragraphs that includes:
- Direct answer in first sentence
- Technical details and context
- Real-world example or use case
- Link to related resource if applicable]

### How do I [specific action] with [tool/feature]?

[Step-by-step answer with code examples if relevant...]

### Why should I use [feature] instead of [alternative]?

[Comparison answer with specific benefits and trade-offs...]
```

### FAQ Question Formula Patterns

Use these proven patterns to maximize AI agent discovery:

**1. "What is X?" - Definition Questions**
```markdown
### What is OAuth2 token refresh and why is it important?
### What are the key differences between JWT and session tokens?
### What is multi-tenancy in SaaS applications?
```
**Why it works:** AI agents frequently search for definitions and explanations.

**2. "How do I/How to..." - Implementation Questions**
```markdown
### How do I implement OAuth2 authentication in TheAnswer?
### How to configure multi-tenant database queries in TypeORM?
### How do I embed a chatbot using the Flowise API?
```
**Why it works:** Matches user intent for tutorials and guides.

**3. "Why should/Why would..." - Decision Questions**
```markdown
### Why should I use local AI models instead of cloud APIs?
### Why would I choose TheAnswer over other AI platforms?
### Why is multi-tenancy critical for SaaS applications?
```
**Why it works:** Helps users make informed decisions, cited by AI for recommendations.

**4. "What are the benefits/advantages of..." - Value Questions**
```markdown
### What are the benefits of using Docusaurus for documentation?
### What advantages does TypeORM provide over Prisma?
### What are the security benefits of API key authentication?
```
**Why it works:** AI agents look for benefit-driven content.

**5. "Can I..." - Capability Questions**
```markdown
### Can I run TheAnswer agents locally without cloud dependencies?
### Can I integrate custom AI models into Flowise chatflows?
### Can I use TheAnswer for enterprise deployments?
```
**Why it works:** Addresses feasibility and feature availability.

**6. "When should/When to..." - Timing/Context Questions**
```markdown
### When should I use agents vs. simple chatflows?
### When to implement rate limiting for API endpoints?
### When should I migrate from development to production?
```
**Why it works:** Provides contextual guidance for decision-making.

**7. "Troubleshooting: Why is..." - Problem-Solving Questions**
```markdown
### Why is my chatflow not connecting to the database?
### Why am I getting "Unauthorized" errors with my API key?
### Why are my multi-tenant queries returning wrong data?
```
**Why it works:** AI agents heavily cite troubleshooting content.

**8. "Best practices for..." - Expert Guidance Questions**
```markdown
### What are the best practices for securing Flowise API keys?
### Best practices for implementing multi-tenancy in Node.js?
### What are the recommended patterns for error handling in TypeScript?
```
**Why it works:** Positions your content as authoritative.

### Answer Quality Guidelines

**CRITICAL: Every answer must:**

1. **Start with a direct answer** (first 1-2 sentences)
   ```markdown
   ### How do I implement OAuth2 in TheAnswer?

   TheAnswer uses Auth0 for OAuth2 authentication. You configure it by setting
   `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, and `AUTH0_ISSUER_BASE_URL` in your
   environment variables.

   [Then provide detailed explanation...]
   ```

2. **Include specific technical details**
   - Actual code examples
   - File paths and locations
   - Configuration values
   - Command-line examples
   - Version numbers when relevant

3. **Provide context and "why"**
   - Why this approach is recommended
   - What problems it solves
   - When to use alternatives
   - Trade-offs and considerations

4. **Use concrete examples**
   ```markdown
   ### How do I filter queries by organizationId in TheAnswer?

   All database queries in TheAnswer must include `organizationId` for multi-tenancy.
   In your services, add it to the where clause:

   ```typescript
   const chatflows = await this.chatflowRepository.find({
     where: {
       organizationId: user.organizationId,
       userId: user.id
     }
   });
   ```

   This ensures users only access resources within their organization, which is
   critical for security and data isolation. The pattern is enforced in all
   services - see `packages/server/src/services/*` for examples.
   ```

5. **Link to related content**
   - Internal docs: `/docs/path/to/doc`
   - Related blog posts: `/blog/related-post`
   - External resources: `[OpenAI Docs](https://platform.openai.com)`

6. **Length: 100-300 words per answer**
   - Too short: Won't rank well
   - Too long: Loses focus
   - Sweet spot: 2-4 paragraphs

### FAQ Topics to Cover

**For every blog post, include FAQs about:**

1. **Core Concept** (3-4 FAQs)
   - What is [main topic]?
   - How does [concept] work?
   - Why is [concept] important?

2. **Implementation** (3-4 FAQs)
   - How do I implement [feature]?
   - How to configure [setting]?
   - What are the prerequisites?

3. **Troubleshooting** (2-3 FAQs)
   - Why am I getting [common error]?
   - How do I fix [common problem]?
   - What should I check if [issue]?

4. **Comparison** (2-3 FAQs)
   - How does [this] compare to [that]?
   - When should I use [option A] vs [option B]?
   - What are the trade-offs?

5. **Best Practices** (2-3 FAQs)
   - What are best practices for [activity]?
   - How can I optimize [performance/security]?
   - What should I avoid?

### FAQ Formatting in Docusaurus

Place FAQs at the end of the blog post, before the conclusion:

```markdown
## Frequently Asked Questions

### Question 1: Natural language question here?

Answer paragraph 1 with direct response.

Answer paragraph 2 with additional details and examples.

Answer paragraph 3 with links to related resources.

### Question 2: Another natural question?

Answer with specific technical details...

[Continue for 10-15 FAQs]

## Conclusion

[Your conclusion and CTA...]
```

### SEO Optimization for FAQs

**Schema markup** (optional advanced feature):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is OAuth2 authentication?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "OAuth2 is an authorization framework..."
    }
  }]
}
</script>
```
*Note: This can be added to Docusaurus pages via custom components if needed.*

### Real-World Example FAQ

Here's a high-quality FAQ that AI agents will cite:

```markdown
### How do I implement multi-tenant database queries in TheAnswer?

All database queries in TheAnswer must filter by `organizationId` to ensure
proper multi-tenant data isolation. This is a critical security requirement
enforced throughout the codebase.

**Implementation Pattern:**
In your service layer (`packages/server/src/services/`), always include
`organizationId` in query conditions:

```typescript
// ✅ Correct: Multi-tenant query
const resources = await this.resourceRepository.find({
  where: {
    organizationId: user.organizationId,
    userId: user.id  // For non-admin users
  }
});

// ❌ Wrong: No organization filter (security vulnerability!)
const resources = await this.resourceRepository.find({
  where: { userId: user.id }
});
```

**Controller-Level Protection:**
Always use `checkOwnership()` in controllers before operations:

```typescript
if (req.user && !(await checkOwnership(resource, req.user, req))) {
  throw new InternalFlowiseError(
    StatusCodes.UNAUTHORIZED,
    'Unauthorized access'
  );
}
```

For complete implementation details, see the [Multi-Tenancy Guide](/docs/developers/authorization/multi-tenancy)
and review existing services in `packages/server/src/services/` for reference patterns.
```

**Why this works:**
- ✅ Direct answer in first paragraph
- ✅ Code examples with correct/incorrect patterns
- ✅ Specific file paths
- ✅ Security context
- ✅ Links to related docs
- ✅ ~200 words (optimal length)

## Quick Reference: Blog Writing Checklist

### Research Phase
- [ ] Explored codebase thoroughly
- [ ] Reviewed relevant documentation
- [ ] Identified unique value propositions
- [ ] Gathered concrete examples
- [ ] Noted technical constraints

### Planning Phase
- [ ] Defined target audience
- [ ] Clarified content goals
- [ ] Selected appropriate format
- [ ] Identified primary keywords
- [ ] Outlined main sections

### Writing Phase
- [ ] Compelling headline written
- [ ] Strong hook/introduction
- [ ] Truncate marker `<!-- truncate -->` added after intro
- [ ] Logical section flow
- [ ] Code examples included
- [ ] **5-10 context-appropriate CTAs throughout** (REQUIRED - one per major section)
- [ ] **All CTAs link to Calendly booking page** (NON-NEGOTIABLE)
- [ ] **CTA text is specific, not generic** (no "Book a call")
- [ ] **10-15 AI-optimized FAQs** (REQUIRED)
- [ ] Clear conclusion with CTA

### Formatting Phase (CRITICAL - Prevents Build Errors)
- [ ] **Frontmatter title quoted if contains `:` or `'`**
- [ ] **Frontmatter description quoted**
- [ ] **ALL placeholders use `[brackets]` NOT `{curly braces}`**
- [ ] No single `{curly braces}` in markdown text
- [ ] YouTube embed included (with `VIDEO_ID` placeholder if needed)
- [ ] **Gamma presentation embed included** (REQUIRED - with `GAMMA_ID` placeholder)
- [ ] YouTube/Gamma iframes use proper `{{double braces}}` in style attributes

### Optimization Phase
- [ ] SEO keywords integrated
- [ ] Meta description written (and quoted in frontmatter)
- [ ] **Internal links verified against docs structure**
- [ ] **External Langfuse links verified with WebSearch**
- [ ] All links tested (no 404s)
- [ ] CTA links to Calendly: `https://calendly.com/brad-theanswer/answeragent-intro`
- [ ] Readability optimized

### Review Phase
- [ ] Technical accuracy verified
- [ ] Grammar and spelling checked
- [ ] Links tested
- [ ] Formatting consistent
- [ ] Brand guidelines followed

## Publishing Preparation

### Content Delivery Format

**Provide to user:**
1. **Blog post markdown file** with:
   - Complete content
   - Proper heading hierarchy
   - Code blocks formatted
   - Links included

2. **Metadata document** with:
   - Meta description
   - Primary keyword
   - Secondary keywords (3-5)
   - Suggested tags
   - Internal links to add
   - External references

3. **Notes document** with:
   - Image/diagram needs (with descriptions)
   - Screenshots required
   - Data/metrics to verify
   - Reviews recommended
   - Follow-up content ideas

### Publishing Checklist to Provide User

```markdown
## Pre-Publishing Checklist

Content:
- [ ] Final proofread complete
- [ ] All links tested
- [ ] Code examples verified
- [ ] Technical review complete

SEO:
- [ ] Meta description added
- [ ] Keywords optimized
- [ ] Internal links added
- [ ] External links checked
- [ ] Image alt text added

Technical:
- [ ] Markdown formatted correctly
- [ ] Code syntax highlighting set
- [ ] Responsive design verified
- [ ] Load time acceptable

Promotion:
- [ ] Social media posts drafted
- [ ] Email newsletter prepared
- [ ] Internal team notified
- [ ] Relevant communities identified
```

## Tips for Success

**Do:**
- Write for your audience, not yourself
- Show, don't just tell (use examples)
- Be specific and concrete
- Edit ruthlessly
- Test all code examples
- Read content aloud before finalizing
- Get feedback from target audience member

**Don't:**
- Use jargon without explanation
- Include code for code's sake
- Make unsupported claims
- Ignore SEO completely
- Rush the editing process
- Assume prior knowledge
- Sacrifice accuracy for engagement
- **Forget the 10-15 FAQs** (most critical mistake!)

Your goal: Create content that educates, engages, and drives action while maintaining technical accuracy and brand voice.

## Complete Docusaurus Blog Post Example

Here's a fully-formatted example showing all required elements:

````markdown
---
slug: implementing-oauth2-authentication-theanswer
title: Implementing OAuth2 Authentication in TheAnswer: A Complete Guide
authors: [bradtaylorsf]
tags: [authentication, oauth2, security, tutorial, auth0]
description: Learn how to implement OAuth2 authentication in TheAnswer using Auth0. Complete guide with code examples, configuration steps, and best practices.
---

# Implementing OAuth2 Authentication in TheAnswer: A Complete Guide

Secure authentication is the foundation of any multi-tenant SaaS platform. In this comprehensive guide, we'll walk through implementing OAuth2 authentication in TheAnswer using Auth0, ensuring your users' data remains protected while providing a seamless login experience.

<!-- truncate -->

## 🎥 Watch the Full Workshop

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="OAuth2 Implementation Workshop"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{maxWidth: '100%', height: 'auto', aspectRatio: '16/9'}}
  ></iframe>
</div>

## 📊 View the Presentation

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    src="https://gamma.app/embed/GAMMA_ID"
    style={{width: '700px', maxWidth: '100%', height: '450px'}}
    allow="fullscreen"
    title="OAuth2 Authentication Guide"
  ></iframe>
</div>

---

## Why OAuth2 for Multi-Tenant Applications?

OAuth2 has become the industry standard for authentication because it separates user credentials from application access. In TheAnswer's multi-tenant architecture, this is critical—we need to ensure users only access resources within their organization while maintaining a smooth user experience.

:::tip Pro Tip
OAuth2 token refresh allows users to stay logged in without re-entering credentials while maintaining security through short-lived access tokens.
:::

## Understanding TheAnswer's Authentication Flow

TheAnswer uses Auth0 as the OAuth2 provider, implementing the Authorization Code Flow with PKCE (Proof Key for Code Exchange) for maximum security.

**Authentication Flow:**
1. User attempts to access protected route
2. Middleware redirects to Auth0 login
3. User authenticates with Auth0
4. Auth0 returns authorization code
5. Application exchanges code for access token
6. Token stored in secure session
7. Subsequent requests use token for authorization

## Step-by-Step Implementation

### 1. Configure Auth0 Application

First, set up your Auth0 application with the correct settings:

```typescript title=".env"
AUTH0_SECRET='your-secret-here'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_AUDIENCE='your-api-audience'
```

:::warning Security Note
Never commit `.env` files to version control. Use `.env.example` as a template.
:::

### 2. Implement Middleware Protection

TheAnswer uses Next.js middleware to protect routes:

```typescript title="apps/web/middleware.ts" {5-7}
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired({
  returnTo: '/login',
  // Protect all routes under (Main UI)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)'
  ]
});
```

This configuration:
- ✅ Protects all application routes
- ✅ Allows public access to login page
- ✅ Redirects unauthorized users
- ✅ Preserves original destination after login

### 3. Add API Route Handlers

Create API routes for auth operations:

```typescript title="apps/web/app/api/auth/[...auth0]/route.ts"
import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback: async (req, session, state) => {
      // Add custom claims or organization data
      const user = session.user;
      const organizationId = user['https://theanswer.ai/organizationId'];

      return {
        ...session,
        user: {
          ...user,
          organizationId
        }
      };
    }
  })
});
```

### 4. Implement Token Refresh

Configure automatic token refresh in your Auth0 setup:

```typescript title="apps/web/lib/auth0.ts"
import { initAuth0 } from '@auth0/nextjs-auth0';

export default initAuth0({
  auth0Logout: true,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  session: {
    rollingDuration: 60 * 60 * 24 * 7, // 7 days
    rolling: true, // Enable rolling sessions
    absoluteDuration: 60 * 60 * 24 * 30 // 30 days max
  }
});
```

## Multi-Tenancy Integration

Every authenticated request in TheAnswer must include organization context:

```typescript title="packages/server/src/middleware/auth.ts"
export const enforceAbility = async (req, res, next) => {
  const user = req.user;

  if (!user || !user.organizationId) {
    throw new InternalFlowiseError(
      StatusCodes.UNAUTHORIZED,
      'Missing organization context'
    );
  }

  req.organizationId = user.organizationId;
  next();
};
```

All database queries must filter by `organizationId`:

```typescript
const chatflows = await chatflowRepository.find({
  where: {
    organizationId: user.organizationId,
    userId: user.id
  }
});
```

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/VIDEO_ID"
    title="OAuth2 Implementation Tutorial"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    style={{maxWidth: '100%', height: 'auto', aspectRatio: '16/9'}}
  ></iframe>
</div>

## Testing Your Implementation

Create E2E tests to verify authentication:

```typescript title="apps/web/e2e/auth.spec.ts"
import { test, expect } from '@playwright/test';

test('should redirect to login when accessing protected route', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/.*login/);
});

test('should access dashboard after login', async ({ page }) => {
  // Login with test credentials
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

## Frequently Asked Questions

### What is OAuth2 and why should I use it for TheAnswer?

OAuth2 is an authorization framework that enables secure, token-based authentication without exposing user credentials. For TheAnswer's multi-tenant architecture, OAuth2 provides several critical benefits: it separates authentication from your application logic, supports token refresh for seamless user experiences, and integrates easily with enterprise SSO systems. Auth0's implementation also handles security concerns like token encryption, CSRF protection, and secure storage automatically.

### How do I configure Auth0 for local development?

For local development, create a `.env.local` file with your Auth0 credentials. Set `AUTH0_BASE_URL=http://localhost:3000` and configure your Auth0 application's callback URLs to include `http://localhost:3000/api/auth/callback`. In the Auth0 dashboard, add `http://localhost:3000` to both "Allowed Callback URLs" and "Allowed Logout URLs". Never commit your Auth0 secrets—use `.env.example` as a template and keep actual credentials in `.env.local` which is gitignored.

### How does token refresh work in TheAnswer?

TheAnswer implements rolling sessions with Auth0, meaning the access token automatically refreshes as users interact with the application. The session configuration sets a `rollingDuration` of 7 days and an `absoluteDuration` of 30 days. When a user makes a request within the rolling window, Auth0 automatically issues a new token, keeping them logged in. After 30 days of inactivity (absolute duration), users must re-authenticate. This balance provides security while maintaining user convenience.

### What happens if a user's token expires during an API request?

When a token expires mid-request, TheAnswer's middleware catches the expiration and returns a 401 Unauthorized status. The client-side code detects this response and triggers a silent token refresh using Auth0's refresh token mechanism. If the refresh succeeds, the original request retries automatically. If refresh fails (e.g., refresh token also expired), the user is redirected to the login page. This flow is handled by the `@auth0/nextjs-auth0` SDK transparently.

### How do I add custom claims to JWT tokens in Auth0?

Custom claims in Auth0 are added through Rules or Actions in the Auth0 dashboard. For TheAnswer, we add `organizationId` as a custom claim with this Action:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://theanswer.ai';
  const organizationId = event.user.app_metadata.organizationId;

  if (organizationId) {
    api.idToken.setCustomClaim(`${namespace}/organizationId`, organizationId);
  }
};
```

The namespace must be a valid URL. Access it in your app via `user['https://theanswer.ai/organizationId']`.

### How does TheAnswer ensure multi-tenant data isolation with OAuth2?

TheAnswer enforces multi-tenancy at multiple layers. First, the `afterCallback` hook in the Auth0 configuration extracts `organizationId` from the JWT token and adds it to the session. Second, the `enforceAbility` middleware validates every request includes an `organizationId`. Third, all database queries MUST filter by `organizationId` in the where clause. This defense-in-depth approach ensures no user can access data from other organizations, even with a valid token. See `packages/server/src/middleware/auth.ts` and service implementations for reference patterns.

### Can I use OAuth2 with API keys for programmatic access?

Yes! TheAnswer supports both OAuth2 (for user authentication) and API keys (for programmatic access). API keys are managed through the `/api-key` endpoints and stored hashed in the database with `userId` and `organizationId` associations. When an API key is used, the `enforceAbility` middleware validates it and attaches the corresponding user context to the request. This allows the same authorization logic to work for both human users (OAuth2 tokens) and automated systems (API keys).

### How do I implement logout in TheAnswer?

Logout is handled by Auth0's built-in logout endpoint at `/api/auth/logout`. When users click logout, they're redirected to this endpoint which clears the session cookie and redirects to Auth0's logout endpoint, ensuring all tokens are invalidated. The Auth0 configuration includes `auth0Logout: true` which performs a global logout (federated logout). Configure your logout redirect URL in Auth0's dashboard under "Allowed Logout URLs" to return users to your login page.

### What's the difference between access tokens and ID tokens?

In OAuth2, ID tokens contain user identity information (name, email, custom claims) and are used for authentication. Access tokens authorize API requests and don't contain user details. TheAnswer uses ID tokens for authenticating users in the web app and access tokens when making API calls to backend services. Auth0 returns both tokens after successful authentication. The session stores both, with the access token used in the `Authorization: Bearer <token>` header for API requests.

### How do I handle Auth0 rate limits in production?

Auth0 has rate limits based on your subscription tier (e.g., 50 requests/second for free tier). To avoid hitting limits: (1) Implement token caching with rolling sessions to minimize auth requests, (2) Use Auth0's Management API for bulk operations instead of repeated calls, (3) Implement exponential backoff for retry logic, and (4) Monitor rate limit headers (`X-RateLimit-Remaining`) in responses. For high-traffic applications, upgrade to Auth0's Professional tier or implement your own token service for internal APIs.

### How do I test authentication in E2E tests without logging in every time?

TheAnswer uses Playwright's auth state persistence. Create a `globalSetup.ts` that logs in once and saves the auth state to a file. Then reuse that state in all tests:

```typescript
// globalSetup.ts
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/login');
  // ... perform login
  await page.context().storageState({ path: 'auth-state.json' });
  await browser.close();
}

// tests use: { storageState: 'auth-state.json' }
```

This approach runs login once per test suite, dramatically speeding up test execution.

### What security best practices should I follow for OAuth2 in production?

For production OAuth2 implementations: (1) Always use HTTPS—never HTTP—for all auth endpoints, (2) Enable PKCE (Proof Key for Code Exchange) to prevent authorization code interception, (3) Set short access token expiration (15-60 minutes) with longer refresh tokens, (4) Implement CSRF protection (Auth0 handles this automatically), (5) Store tokens in httpOnly cookies, never localStorage, (6) Rotate secrets regularly, (7) Monitor Auth0 logs for suspicious activity, (8) Enable MFA for admin accounts, (9) Whitelist callback URLs explicitly, and (10) Use Auth0's Anomaly Detection features.

### How do I migrate users from another auth system to Auth0?

Auth0 provides database migration capabilities. Export users from your current system, then import them using Auth0's Management API or bulk import tool. For seamless migration, enable Auth0's "Lazy Migration" feature which imports users on their first login. Create a custom database connection in Auth0 that queries your existing auth system during login, then Auth0 automatically migrates the user. After all users have logged in, disable the custom database connection. See Auth0's [User Migration Guide](https://auth0.com/docs/users/migrations) for detailed steps.

### Can I customize the Auth0 login page to match TheAnswer's branding?

Yes! Auth0 provides two options: (1) Universal Login Page customization in the Auth0 dashboard where you can add custom CSS, logos, and modify HTML templates, or (2) Embedded login using Auth0's SDK for complete control over the login UI. TheAnswer recommends Universal Login for security (Auth0 handles session management) with custom branding. In the Auth0 dashboard, go to Branding → Universal Login to customize colors, logos, and background images to match TheAnswer's design system.

### How do I handle authentication in TheAnswer's API routes?

API routes in TheAnswer use the `@auth0/nextjs-auth0` SDK's `getSession()` helper to check authentication:

```typescript
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const organizationId = session.user.organizationId;
  // ... proceed with authenticated request
}
```

This works for both Server Components and API routes in Next.js App Router. The session is automatically available from the request context.

## Conclusion

Implementing OAuth2 authentication with Auth0 provides TheAnswer with enterprise-grade security while maintaining an excellent user experience. By following this guide, you've set up token-based authentication, multi-tenant data isolation, and automatic token refresh—all critical for a production SaaS application.

**Next Steps:**
- [Explore TheAnswer's API Documentation](/docs/api)
- [Learn about Multi-Tenancy Patterns](/docs/developers/authorization/multi-tenancy)
- [Join our Discord Community](https://discord.gg/X54ywt8pzj)

---

_Building secure AI applications?_ [Start with TheAnswer](https://studio.theanswer.ai)
````

**Key Elements This Example Demonstrates:**

1. ✅ **Proper Frontmatter** - All required fields with appropriate tags
2. ✅ **Compelling Title** - Clear value proposition
3. ✅ **Strong Hook** - Immediately establishes relevance
4. ✅ **Truncate Marker** - `<!-- truncate -->` after intro
5. ✅ **YouTube Embed** - Proper responsive iframe with placeholder
6. ✅ **Gamma Presentation Embed** - Required for all blog posts
7. ✅ **Docusaurus Admonitions** - `:::tip` and `:::warning`
8. ✅ **Code Blocks** - With titles and line highlighting
9. ✅ **15 Comprehensive FAQs** - AI-optimized with direct answers
10. ✅ **Technical Details** - File paths, code examples, specific instructions
11. ✅ **Clear Structure** - H2/H3 hierarchy
12. ✅ **Internal Links** - Documentation cross-references
13. ✅ **Strong Conclusion** - Summary and clear CTAs

**Filename:** `2025-01-10-implementing-oauth2-authentication-theanswer.md`
**Location:** `/packages/docs/blog/`
