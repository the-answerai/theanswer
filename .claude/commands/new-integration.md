# /new-integration - Create Complete Integration Documentation

## Command Syntax

```bash
/new-integration <integration-name>
```

**Examples:**
```bash
/new-integration salesforce
/new-integration hubspot
/new-integration confluence
```

## What This Command Does

Automates the complete integration documentation workflow from Linear ticket to pull request:

1. ✅ Creates Linear ticket using `/ticket-create`
2. ✅ Creates feature branch using `/ticket-start`
3. ✅ Launches `integration-docs-updater` agent to create:
   - Documentation page (`packages/docs/docs/integrations/{name}.mdx`)
   - Marketing page (`packages/docs/src/pages/integrations/{name}.tsx`)
   - Integration listing card update
4. ✅ Reviews generated content and provides feedback
5. ✅ Agent incorporates feedback
6. ✅ Commits and creates PR using `/push`
7. ✅ Reports completion with PR link

## Your Task

You are Claude Code executing the `/new-integration` command. Follow this workflow exactly:

### Phase 1: Linear Ticket Creation

**Use the `/ticket-create` command to create a Linear ticket with:**

**Title format:**
```
Create comprehensive {Integration Name} integration documentation
```

**Description template:**
```markdown
## Overview

Implement comprehensive integration documentation following the INTEGRATION_DOCS_STRATEGY.md template for the {Integration Name} integration.

## Context

* Strategy document: `INTEGRATION_DOCS_STRATEGY.md`
* Integration mapping: `scripts/integration-mapping.json`
* Target documentation file: `packages/docs/docs/integrations/{integration-name}.mdx`
* Target marketing page: `packages/docs/src/pages/integrations/{integration-name}.tsx`

## Deliverables

### 1. Documentation Page (`docs/integrations/{integration-name}.mdx`)
- [ ] LogoKit logo at top (80px height) - **MUST use https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe**
- [ ] Title: "{Integration Name} Agent Integration"
- [ ] 6 AskAlpha buttons with contextual questions
- [ ] Auto-generated timestamp callout
- [ ] Overview section
- [ ] Quick Start guide
- [ ] Available Components section (all components with versions)
- [ ] Configuration examples
- [ ] Use Cases section (3-5 scenarios)
- [ ] Advanced Configuration
- [ ] FAQ section (15-20 items)
- [ ] Resources and links

### 2. Marketing Page (`src/pages/integrations/{integration-name}.tsx`)
- [ ] ThreeJS SphereScene animation background
- [ ] LogoKit logo integration - **MUST use https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe**
- [ ] Compelling headline emphasizing: "AI that actually works", "Easy setup", "Save time", "Be better at your job"
- [ ] Dual CTAs: "Book a Demo" (Calendly) and "Setup Guide" (docs link)
- [ ] Value propositions section (3 key benefits with quantified time savings)
- [ ] Use cases section (6 scenarios with time-saving badges)
- [ ] "How It Works" section (4-step workflow)
- [ ] Final CTA section with trust indicators
- [ ] JSON-LD structured data for SEO
- [ ] Responsive design with Tailwind CSS

### 3. Integration Listing Update
- [ ] Add card to `packages/docs/src/pages/integrations.tsx` INTEGRATIONS array
- [ ] Include: name, domain, category, difficulty, description

## Acceptance Criteria

- [ ] Documentation follows INTEGRATION_DOCS_STRATEGY.md template exactly
- [ ] Marketing page matches Contentful reference implementation quality
- [ ] All AskAlpha buttons have contextual, relevant questions
- [ ] Time savings are realistic and quantified
- [ ] Integration listing card is properly formatted
- [ ] No linting errors
- [ ] All links are valid and functional
- [ ] Component versions match integration-mapping.json

## Testing Checklist

- [ ] Documentation renders correctly at `http://localhost:4242/docs/integrations/{integration-name}`
- [ ] Marketing page renders at `http://localhost:4242/integrations/{integration-name}`
- [ ] ThreeJS animation loads without errors
- [ ] All AskAlpha buttons open with correct context
- [ ] JSON-LD validates in Google Rich Results Test
- [ ] Integration card appears on `/integrations` page
- [ ] All CTAs link to correct destinations
- [ ] Mobile responsive design verified
- [ ] No console errors in browser

## Reference Implementation

* Documentation: `packages/docs/docs/integrations/contentful.mdx` (823 lines)
* Marketing: `packages/docs/src/pages/integrations/contentful.tsx` (365 lines)
* Strategy: `INTEGRATION_DOCS_STRATEGY.md` (complete checklist lines 957-1206)

## Resources

* Strategy guide: `/INTEGRATION_DOCS_STRATEGY.md`
* Integration data: `/scripts/integration-mapping.json`
* Agent instructions: `/.claude/agents/integration-docs-updater.md`
```

**Important:**
- Set team to "AnswerAgentAI"
- Add label "integration-docs"
- Set priority to "Normal" (3)

### Phase 2: Branch Creation

**Use the `/ticket-start` command** with the ticket ID returned from Phase 1.

This will:
- Create branch: `agent-{id}-create-comprehensive-{integration-name}-integration-documentation`
- Update Linear ticket to "In Progress"
- Provide implementation context

### Phase 3: Launch Integration Agent

**Use the Task tool to launch the `integration-docs-updater` agent:**

```typescript
Task({
    subagent_type: "integration-docs-updater",
    description: "Create {Integration Name} integration pages",
    prompt: `Create comprehensive integration documentation and marketing page for {Integration Name}.

**Integration Name:** {Integration Name}
**Integration Domain:** {domain from integration-mapping.json or best guess}

**Requirements:**
1. Create documentation page at: packages/docs/docs/integrations/{integration-name}.mdx
   - Include LogoKit logo, title, 6 AskAlpha buttons
   - **CRITICAL**: LogoKit URL MUST be https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe
   - **DO NOT use img.logo.dev** - only img.logokit.com is correct
   - Follow Contentful reference implementation

2. Create marketing page at: packages/docs/src/pages/integrations/{integration-name}.tsx
   - ThreeJS animation, dual CTAs, value props, use cases
   - **CRITICAL**: LogoKit URL MUST be https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe
   - **DO NOT use img.logo.dev** - only img.logokit.com is correct
   - Follow Contentful reference implementation

3. Update integration listing at: packages/docs/src/pages/integrations.tsx
   - Add card to INTEGRATIONS array

**Reference implementations:**
- Documentation: packages/docs/docs/integrations/contentful.mdx
- Marketing: packages/docs/src/pages/integrations/contentful.tsx
- Strategy: INTEGRATION_DOCS_STRATEGY.md

**IMPORTANT:**
- Use integration-mapping.json for component metadata
- All AskAlpha questions must be contextual and relevant
- Time savings must be realistic and quantified
- Follow all templates in INTEGRATION_DOCS_STRATEGY.md exactly
- **VERIFY LogoKit URLs use img.logokit.com NOT img.logo.dev**

Please create both pages and report back when complete.`
})
```

### Phase 4: Review Agent Output

When the agent completes, **review the generated content:**

**Documentation Page Checklist:**
- [ ] LogoKit logo present and correctly sized (80px)
- [ ] **LogoKit URL is correct**: https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe (NOT img.logo.dev)
- [ ] Title is "{Integration Name} Agent Integration"
- [ ] All 6 AskAlpha buttons have relevant, contextual questions
- [ ] Auto-generated timestamp callout present
- [ ] Component versions match integration-mapping.json
- [ ] FAQ has 15-20 relevant items
- [ ] All code examples are valid and complete
- [ ] Use cases are practical and detailed

**Marketing Page Checklist:**
- [ ] ThreeJS SphereScene animation renders
- [ ] **LogoKit URL is correct**: https://img.logokit.com/{domain}?token=pk_fr8710fea017bdf10b13fe (NOT img.logo.dev)
- [ ] Headline emphasizes key value props
- [ ] Both CTAs present and properly linked
- [ ] Time savings are quantified (hours/week)
- [ ] 6 use cases with time-saving badges
- [ ] JSON-LD schema is complete and valid
- [ ] Styling matches Contentful page

**Integration Listing Checklist:**
- [ ] Card added to INTEGRATIONS array
- [ ] Category is appropriate
- [ ] Difficulty level is accurate
- [ ] Description is concise and compelling

### Phase 5: Provide Feedback

**If issues found, provide specific feedback to the agent:**

Example feedback format:
```
I reviewed the pages. Here's feedback:

**Documentation Page:**
1. AskAlpha button in "Quick Start" section - Question is too generic. Make it specific to {Integration Name} authentication setup.
2. FAQ item 5 - Add information about rate limits specific to {Integration Name} API.
3. Use Case 2 - Time savings seem inflated. Adjust from 20 hours to 10 hours weekly.

**Marketing Page:**
1. Hero headline - Emphasize the "{unique benefit}" more prominently.
2. Value Prop 2 - Quantify the time savings (currently says "faster", should say "5x faster" or specific hours).
3. Use Case 4 badge - Says "Save 50 hours/month" but seems unrealistic for this scenario. Adjust to 15-20 hours/month.

**Integration Listing:**
1. Category should be "{correct category}" not "{current category}".

Please incorporate this feedback and regenerate.
```

**If everything looks good:**
```
Excellent work! Both pages look great. Please proceed to commit.
```

### Phase 6: Agent Incorporates Feedback

The agent will update the files based on your feedback and report back.

**Repeat Phase 4-5 until satisfied.**

### Phase 7: Commit and Create PR

**Use the `/push` command with a descriptive message:**

```bash
/push "feat(AGENT-{id}): Add comprehensive {Integration Name} integration documentation and marketing page"
```

This will:
- Validate branch and ticket
- Run linting checks
- Create commit with conventional format
- Push to remote
- Create PR targeting `staging` branch (NOT main)
- Update Linear ticket to "In Review"
- Link PR to Linear ticket

### Phase 8: Report Completion

**Provide a summary report to the user:**

```
✅ **{Integration Name} Integration Documentation Complete!**

**Created:**
- 📄 Documentation: `packages/docs/docs/integrations/{integration-name}.mdx` ({X} lines)
- 🎨 Marketing page: `packages/docs/src/pages/integrations/{integration-name}.tsx` ({X} lines)
- 🗂️ Integration listing: Card added to `/integrations` page

**Pull Request:** #{PR-number}
**Linear Ticket:** AGENT-{id} (In Review)
**Branch:** `agent-{id}-create-comprehensive-{integration-name}-integration-documentation`

**Next Steps:**
1. Review PR at: {PR URL}
2. Test locally:
   - Documentation: http://localhost:4242/docs/integrations/{integration-name}
   - Marketing: http://localhost:4242/integrations/{integration-name}
3. Merge to staging when approved
4. Deploy to production

**Iterations:** {number of feedback rounds}
**Total files modified:** {count}
```

## Important Guidelines

### DO:
✅ Follow all phases sequentially - don't skip steps
✅ Use `/ticket-create`, `/ticket-start`, and `/push` commands
✅ Launch the `integration-docs-updater` agent (not general-purpose)
✅ Review agent output thoroughly before accepting
✅ Provide specific, actionable feedback
✅ Iterate until quality matches Contentful reference implementation
✅ Verify all links, logos, and animations work
✅ Check that component versions match integration-mapping.json
✅ Ensure time savings are realistic and quantified

### DON'T:
❌ Create files manually - always use the agent
❌ Skip the review phase
❌ Accept generic AskAlpha questions
❌ Allow unrealistic time savings claims
❌ Forget to update the integration listing
❌ Create PR targeting `main` branch
❌ Proceed without Linear ticket
❌ Use placeholder text or TODOs in final output

## Error Handling

**If `/ticket-create` fails:**
- Check Linear API connectivity
- Verify team ID is correct
- Ensure labels exist

**If agent produces incomplete output:**
- Provide detailed feedback
- Reference specific sections that need work
- Point agent to reference implementations

**If linting fails during `/push`:**
- Agent should have already run `pnpm lint-fix`
- Review the specific errors
- Fix and retry

**If PR creation fails:**
- Check branch name format
- Verify staging branch exists
- Ensure ticket ID is in branch name

## Success Criteria

The command is successful when:

1. ✅ Linear ticket created with complete description
2. ✅ Feature branch created and checked out
3. ✅ Both documentation and marketing pages created
4. ✅ Integration listing updated
5. ✅ Content matches quality of Contentful reference
6. ✅ All AskAlpha buttons have contextual questions
7. ✅ Time savings are realistic and quantified
8. ✅ No linting errors
9. ✅ PR created targeting staging branch
10. ✅ Linear ticket updated to "In Review"
11. ✅ User receives completion report with links

## Reference Files

**Strategy and templates:**
- `INTEGRATION_DOCS_STRATEGY.md` - Complete documentation strategy (1,206 lines)
- `INTEGRATION_DOCS_STRATEGY.md` lines 164-366 - Documentation page template
- `INTEGRATION_DOCS_STRATEGY.md` lines 368-395 - Marketing page requirements
- `INTEGRATION_DOCS_STRATEGY.md` lines 957-1206 - Complete 245+ item checklist

**Reference implementations:**
- `packages/docs/docs/integrations/contentful.mdx` - Gold standard docs (823 lines)
- `packages/docs/src/pages/integrations/contentful.tsx` - Marketing page (365 lines)

**Agent instructions:**
- `.claude/agents/integration-docs-updater.md` - Agent workflow and responsibilities

**Data sources:**
- `scripts/integration-mapping.json` - Component metadata and versions
- `packages/docs/src/pages/integrations.tsx` - Integration listing page

## Command Initialization

When the user runs `/new-integration {name}`, extract the integration name and begin Phase 1 immediately.

**Integration name processing:**
- Convert to lowercase for file paths: `Salesforce` → `salesforce`
- Preserve capitalization for display: `Salesforce` → "Salesforce"
- Remove special characters: `HubSpot CRM` → `hubspot-crm` (file), "HubSpot CRM" (display)

---

**Now execute the workflow for: {integration-name}**
