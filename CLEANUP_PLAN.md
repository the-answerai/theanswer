# Documentation Cleanup Plan

## Current Problems

1. **Duplicate files**: `docs-registry.json` duplicates what's already in `integration-mapping.json`
2. **New sidebar not applied**: `sidebars-new.ts` exists but real `sidebars.ts` unchanged
3. **Heavy documentation files**: 4 new markdown files explaining systems
4. **Wrong sidebar structure**: Mentions "chatflows" but that's actually current reality
5. **Missing variables**: Variables doc exists but not in sidebar

## Reality Check

### What Actually Exists:
```
sidekick-studio/
├── agentflows/          # Deprecated
├── agentflowsv2/        # Current agent flows
├── chatflows/           # ALL component docs (agents, tools, mcp, etc.)
├── credentials/
├── custom-tools/
├── documents/
├── sidekick-settings/
└── variables.md         # NOT in sidebar!
```

### What We Should Do:

**Option 1: Keep Current Structure (Recommended)**
- Keep `chatflows/` as is (it's working)
- Add variables to sidebar
- Just improve current structure slightly
- NO reorganization yet

**Option 2: Light Reorganization**
- Rename `chatflows/` → `components/`
- Move agentflowsv2 → agentflows
- Add variables section
- Update all references

## Recommended Action: MINIMAL CLEANUP

### 1. Delete Unnecessary Files

These were exploratory/planning docs:
```bash
rm packages/docs/DOCUMENTATION_REORGANIZATION_PLAN.md
rm packages/docs/DOCUMENTATION_SYSTEM_SUMMARY.md
rm packages/docs/README-DOCS-SYSTEM.md
rm packages/docs/DOCUMENTATION_SYSTEM_CORRECTIONS.md
rm packages/docs/sidebars-new.ts
rm packages/docs/docs-registry.json
rm scripts/integration-mapping-schema.json
```

Keep only:
- `.claude/INTEGRATION_SYSTEM_UPDATES.md` (explains what changed)
- `scripts/integration-mapping.json` (SINGLE source of truth)
- `scripts/doc-coverage-report.js` (useful tool)
- `scripts/check-doc-versions.js` (future tool)

### 2. Update Real Sidebar (Small Changes Only)

Add to existing `packages/docs/sidebars.ts`:

```typescript
// In Studio section, add Variables
{
    type: 'doc',
    id: 'sidekick-studio/variables',
    label: 'Variables'
}

// Update Integrations section to have the new ones
{
    type: 'category',
    label: 'Integrations',
    link: {
        type: 'doc',
        id: 'integrations/README'
    },
    items: [
        'integrations/github',
        'integrations/salesforce',
        'integrations/contentful',
        'integrations/zapier-zaps',
        'integrations/make',
        'integrations/lacework'
    ]
}
```

### 3. Keep integration-mapping.json as Single Source

**DO NOT CREATE** `docs-registry.json` or other duplicates.

Use `integration-mapping.json` for:
- Component versions
- Integration metadata
- File paths
- Everything

### 4. Documentation Scripts

Keep these useful scripts:
- `scripts/doc-coverage-report.js` - Shows what's documented
- `scripts/check-doc-versions.js` - Future version checking

Both use `integration-mapping.json` directly.

## Why This Approach?

### ✅ Benefits:
1. **Minimal disruption** - Docs keep working
2. **No big migration** - Don't break existing links
3. **Single source of truth** - Only integration-mapping.json
4. **Add value incrementally** - Variables sidebar, integrations section
5. **Keep what works** - chatflows/ structure is fine

### ❌ Avoid:
1. Renaming directories (breaks links, builds, references)
2. Multiple JSON registries (technical debt)
3. Heavy reorganization before docs complete
4. Complex migration scripts

## Implementation Steps

### Step 1: Delete Unnecessary Files
```bash
cd packages/docs
rm DOCUMENTATION_REORGANIZATION_PLAN.md
rm DOCUMENTATION_SYSTEM_SUMMARY.md
rm README-DOCS-SYSTEM.md
rm DOCUMENTATION_SYSTEM_CORRECTIONS.md
rm sidebars-new.ts
rm docs-registry.json

cd ../../scripts
rm integration-mapping-schema.json
```

### Step 2: Update Sidebar (Minor)

Edit `packages/docs/sidebars.ts`:
1. Add Variables to Studio section
2. Add new integrations to Integrations section
3. Don't touch chatflows structure

### Step 3: Verify Build
```bash
cd packages/docs
pnpm dev
# Check no errors
# Check variables accessible
# Check new integrations show up
```

### Step 4: Update Integration Agents

Both agents should ONLY reference:
- `scripts/integration-mapping.json` (data source)
- `packages/docs/docs/integrations/` (marketing pages)
- `packages/docs/docs/sidekick-studio/chatflows/` (component docs)

NO references to:
- `docs-registry.json` (doesn't exist)
- `integration-mapping-schema.json` (not needed)

## Future: When to Reorganize?

**Wait until:**
1. All integrations documented (currently 3 of 103)
2. Documentation complete and stable
3. Clear user need for different structure
4. Time to handle broken links and references

**Then consider:**
- `chatflows/` → `components/` rename
- `agentflowsv2/` → `agentflows/` simplification
- More organized categories

## Summary

**Delete:** 6 exploratory/duplicate files
**Keep:** Real improvements (agent updates, GitHub example, coverage script)
**Add:** Variables to sidebar, integrations section
**Don't:** Reorganize directories yet

This gives us:
- ✅ Working version tracking system
- ✅ Validation capabilities (agents ready)
- ✅ Better coverage visibility
- ✅ Clean, minimal changes
- ✅ Foundation for future growth

Let's complete documentation first, THEN reorganize if needed.
