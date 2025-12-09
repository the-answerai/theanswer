# /validate-integration - Validate and Update Existing Integration Documentation

## Command Syntax

```bash
/validate-integration <integration-name>
```

**Examples:**
```bash
/validate-integration github
/validate-integration salesforce
/validate-integration contentful
```

## What This Command Does

Validates existing integration documentation for completeness, accuracy, and compliance with current standards:

1. ✅ Checks documentation page exists and is complete
2. ✅ Validates marketing page exists and follows standards
3. ✅ Verifies integration listing card is present
4. ✅ Cross-references with `integration-mapping.json` for accuracy
5. ✅ Validates all component versions are up-to-date
6. ✅ Checks all web links are functional
7. ✅ Verifies LogoKit URLs use correct domain
8. ✅ Ensures version tracking and last updated dates are present
9. ✅ Provides detailed feedback report
10. ✅ Optionally fixes issues automatically

## Your Task

You are Claude Code executing the `/validate-integration` command. Follow this workflow exactly:

### Phase 1: Initial Validation

**Launch the `integration-validator` agent:**

```typescript
Task({
    subagent_type: "integration-validator",
    description: "Validate {Integration Name} documentation",
    prompt: `Validate the integration documentation for {Integration Name}.

**Integration Name:** {Integration Name}

**Validation Checklist:**

1. **Documentation Page** (packages/docs/docs/integrations/{name}.mdx)
   - [ ] File exists
   - [ ] Has version tracking metadata
   - [ ] Has last updated date
   - [ ] LogoKit URL uses img.logokit.com (NOT img.logo.dev)
   - [ ] All 6 AskAlpha buttons present
   - [ ] Component versions match integration-mapping.json
   - [ ] All components are listed
   - [ ] All links are functional
   - [ ] No broken images
   - [ ] Auto-generated timestamp callout present

2. **Marketing Page** (packages/docs/src/pages/integrations/{name}.tsx)
   - [ ] File exists
   - [ ] ThreeJS animation present
   - [ ] LogoKit URL uses img.logokit.com (NOT img.logo.dev)
   - [ ] Both CTAs present and functional
   - [ ] Time savings are quantified
   - [ ] JSON-LD schema present and valid
   - [ ] Responsive design implemented

3. **Integration Listing** (packages/docs/src/pages/integrations.tsx)
   - [ ] Card present in INTEGRATIONS array
   - [ ] Category is correct
   - [ ] Difficulty level is accurate
   - [ ] Description is compelling

4. **Component Documentation** (packages/docs/docs/sidekick-studio/chatflows/...)
   - [ ] All MCP servers have node reference docs
   - [ ] All document loaders have node reference docs
   - [ ] All tools have node reference docs
   - [ ] Version numbers are documented
   - [ ] Last updated dates are present

5. **Data Accuracy**
   - [ ] Integration-mapping.json has correct component count
   - [ ] All component versions match actual code versions
   - [ ] Component descriptions are accurate
   - [ ] No deprecated components listed

**Please perform comprehensive validation and report all findings.**`
})
```

### Phase 2: Review Validation Report

The agent will return a detailed report structured as:

```markdown
## Validation Report: {Integration Name}

### ✅ Passed Checks (X/Y)
- List of passing validations

### ❌ Failed Checks (X/Y)
- Detailed list of issues found
- Specific file/line references
- Suggested fixes

### ⚠️ Warnings (X)
- Non-critical issues
- Improvement suggestions

### 📊 Component Coverage
- Total components: X
- Documented: Y
- Missing docs: Z
- Version mismatches: W

### 🔗 Link Validation
- Total links checked: X
- Working: Y
- Broken: Z (with URLs)

### 📝 Recommended Actions
1. Priority actions (must fix)
2. Secondary improvements (should fix)
3. Optional enhancements (nice to have)
```

### Phase 3: Decide on Action

Based on the validation report, choose one of these paths:

**Path A: Auto-Fix (if issues are minor)**
```bash
Please fix all issues automatically and commit the changes.
```

**Path B: User Review Required (if issues need decisions)**
```
I need to review the following issues before proceeding:
1. [Issue requiring user input]
2. [Issue requiring user input]

Please provide recommendations for each.
```

**Path C: All Good**
```
Validation passed! Documentation is up-to-date and complete.
```

### Phase 4: Apply Fixes (if needed)

If proceeding with fixes, the agent will:

1. Update documentation page with:
   - Correct component versions
   - Last updated date (today)
   - Fixed LogoKit URLs
   - Missing components
   - Broken link fixes

2. Update marketing page with:
   - Fixed LogoKit URLs
   - Updated time savings (if needed)
   - JSON-LD corrections

3. Update component docs with:
   - Version numbers
   - Last updated dates
   - Links to parent integration

4. Update integration-mapping.json if needed

### Phase 5: Commit Changes

**If changes were made, use `/push`:**

```bash
/push "docs(AGENT-XXX): validate and update {Integration Name} integration documentation"
```

### Phase 6: Final Report

Provide summary to user:

```markdown
✅ **{Integration Name} Integration Documentation Validated**

**Validation Results:**
- Total checks: {X}
- Passed: {Y}
- Fixed: {Z}
- Remaining issues: {W}

**Changes Made:**
{if changes}
- Updated {file1}: {description}
- Updated {file2}: {description}
- Fixed {X} broken links
- Updated {Y} component versions
{else}
- No changes needed - documentation is up-to-date!
{endif}

**Component Status:**
- Total components: {X}
- Fully documented: {Y} ({Z}%)
- Missing docs: {W}

**Next Steps:**
{if remaining issues}
1. Review remaining issues
2. Address {specific issues}
{else}
1. Documentation is complete and accurate ✓
{endif}
```

## Validation Criteria

### Critical Issues (Must Fix)
- ❌ Missing documentation or marketing page
- ❌ LogoKit using wrong domain (img.logo.dev)
- ❌ Component versions don't match integration-mapping.json
- ❌ Broken links to external resources
- ❌ Missing version tracking metadata
- ❌ Missing last updated dates
- ❌ Missing AskAlpha buttons
- ❌ Components not listed in documentation

### Warnings (Should Fix)
- ⚠️ Component docs missing version numbers
- ⚠️ Component docs missing last updated dates
- ⚠️ Time savings not quantified
- ⚠️ JSON-LD schema incomplete
- ⚠️ Integration card description too generic
- ⚠️ Use cases lack detail

### Optional (Nice to Have)
- 💡 Additional AskAlpha questions
- 💡 More use case examples
- 💡 Expanded FAQ section
- 💡 Additional code examples

## Version Tracking Standard

All integration documentation must include:

### Documentation Page Header
```markdown
---
title: {Integration Name}
description: {One-line description}
sidebar_position: {number}
---

:::info Auto-Generated Documentation
This page is automatically synchronized with integration components.

**Last Updated:** {YYYY-MM-DD}
**Component Version Tracking:**
- {Component Name}: v{version} (updated {YYYY-MM-DD})
- {Component Name}: v{version} (updated {YYYY-MM-DD})

[View integration in code →](https://github.com/the-answerai/theanswer/tree/main/packages/components/nodes/tools/MCP/{Name})
:::
```

### Component Node Reference Header
```markdown
---
title: {Component Name}
description: {Brief description}
sidebar_position: {number}
---

# {Component Name}

**Version:** {version}
**Last Updated:** {YYYY-MM-DD}
**Category:** {category}
**Integration:** [{Integration Name}](/docs/integrations/{integration})

{rest of content}
```

## Important Guidelines

### DO:
✅ Always check integration-mapping.json first
✅ Verify actual component code versions
✅ Test all links before marking as valid
✅ Update last modified dates when making changes
✅ Cross-reference component docs with integration docs
✅ Ensure LogoKit uses img.logokit.com
✅ Validate JSON-LD with schema.org validator
✅ Check mobile responsiveness

### DON'T:
❌ Skip version verification
❌ Assume links work without testing
❌ Accept img.logo.dev URLs
❌ Leave outdated component versions
❌ Ignore missing component docs
❌ Skip last updated date updates
❌ Accept generic placeholder text

## Error Handling

**If integration not found:**
- Check for alternate naming patterns
- Look in both integrations/ directories
- Suggest similar integrations if typo detected

**If integration-mapping.json is inconsistent:**
- Report discrepancies
- Suggest running integration mapping update script
- Don't proceed with validation until resolved

**If links are broken:**
- List all broken URLs
- Suggest fixes (redirects, updated URLs)
- Mark as critical if official documentation links

## Success Criteria

Validation is successful when:

1. ✅ All files exist and are accessible
2. ✅ All component versions match code
3. ✅ All components are documented
4. ✅ All links work
5. ✅ LogoKit URLs correct
6. ✅ Version tracking present
7. ✅ Last updated dates accurate
8. ✅ No critical issues remain
9. ✅ Component docs reference integration
10. ✅ Integration docs reference component docs

## Reference Files

- Agent: `.claude/agents/integration-validator.md`
- Strategy: `INTEGRATION_DOCS_STRATEGY.md`
- Mapping: `scripts/integration-mapping.json`
- Coverage: Run `node scripts/doc-coverage-report.js`

---

**Now validate integration: {integration-name}**
