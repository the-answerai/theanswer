---
name: blog-write
description: Write technical blog posts, articles, and content about features, tutorials, or announcements
---

You are tasked with writing a high-quality blog post. Launch the `blog-post-writer` agent to handle this task autonomously.

## Agent Instructions

Use the Task tool to launch the blog-post-writer agent with this prompt:

**Context from user request:**
{USER_REQUEST}

**Your task:**
1. **Context Gathering Phase**: Ask the user what they want to write about
   - Ask: "What would you like this blog post to be about?"
   - Wait for user to provide context such as:
     - Latest release notes or changelog
     - Video transcript from a recorded tip/demo
     - Feature documentation or PRD
     - Customer feedback or use case
     - Technical deep dive topic
     - Any other relevant materials
   - Do NOT start researching the codebase until you have this context

2. **Research Phase**: Once context is provided, explore the codebase to understand the topic
   - Search for relevant implementations based on the user's context
   - Review documentation and existing content related to the topic
   - Identify key technical details and unique value propositions
   - Gather concrete examples and use cases

3. **Outline & Planning Phase**: Create outline and confirm with user
   - Draft a blog post outline with main sections
   - Define research criteria (what technical details to include)
   - Identify target persona (developers, business users, general public)
   - Determine content goal (tutorial, announcement, thought leadership, case study)
   - Determine technical depth (beginner, intermediate, expert)
   - Suggest SEO keywords to target
   - Recommend length (800-1200 words, 1500-2000 words, etc.)
   - **Present outline and ask user to confirm before proceeding**

4. **Clarification Phase** (if needed): Ask any remaining questions:
   - Are there specific aspects to emphasize or avoid?
   - Are there related features or context to include?
   - Any specific examples or use cases to highlight?

5. **Writing Phase**: After outline approval, create a comprehensive blog post including:
   - Docusaurus-compliant frontmatter (YAML with slug, title, authors, tags)
     - **CRITICAL**: Quote title if contains `:` or `'` (e.g., `title: "Title: Subtitle"`)
     - **CRITICAL**: Always quote description field
   - Compelling headline optimized for SEO and engagement
   - Meta description (150-160 characters)
   - Hook/introduction that grabs attention
   - **`<!-- truncate -->` marker** after introduction (REQUIRED)
   - Well-structured body with clear sections
   - Code examples and technical details (when appropriate)
   - YouTube video embeds if applicable (proper iframe format)
   - **Gamma presentation embed** (REQUIRED - always include placeholder with `GAMMA_ID`)
   - Docusaurus admonitions for callouts (:::tip, :::warning, etc.)
   - Actionable takeaways and clear conclusions
   - All Blog posts should link to get a free AI Assessment and setup a demo to learn more. Schedule it at https://calendly.com/brad-theanswer/answeragent-intro
   - **10-15 AI-optimized FAQs** (CRITICAL - non-negotiable for AI agent discovery)
     - Use natural language questions users actually ask
     - Start each answer with direct response (first 1-2 sentences)
     - Include code examples, file paths, technical details
     - 100-300 words per answer
   - **CRITICAL FORMATTING**: Use `[brackets]` for placeholders, NEVER `{curly braces}` in markdown text
   - **CRITICAL LINKS**: Verify all links before including:
     - Internal TheAnswer: `/docs/intro`, `/agents`, `/chat`, `/docs/developers`
     - External Langfuse: Use WebSearch to verify current URLs
   - SEO metadata (keywords, tags, internal links)
   - Proper filename: `YYYY-MM-DD-slug.md` format
   - Save location: `/packages/docs/blog/`

6. **Review Phase**: Present the draft and offer revisions
   - Highlight any areas that need user input (e.g., specific metrics, screenshots)
   - Offer to refine tone, length, or technical depth
   - Suggest complementary content or follow-up posts

**Deliverables:**
- Complete blog post in markdown format
- Meta description and SEO keywords
- Notes on images/diagrams needed
- Publishing checklist (links to add, reviews needed, etc.)

Launch the agent now and report back with the final content.
