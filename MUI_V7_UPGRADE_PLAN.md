# MUI v5 → v7 Upgrade Plan: Removing Experimental APIs

**Goal:** Migrate from experimental CSS Variables API to stable MUI v7 API
**Estimated Time:** 6-8 hours (including testing)
**Risk Level:** Low (MUI provides automated codemods)
**Branch:** `feature/mui-v7-upgrade`

---

## Pre-Requisites Checklist

- [ ] All team members notified of upcoming upgrade
- [ ] Current branch is clean (`git status` shows no uncommitted changes)
- [ ] All tests passing on current code
- [ ] Node version: >= 18.x (check with `node -v`)
- [ ] pnpm version: >= 8.x (check with `pnpm -v`)

---

## Phase 1: Backup & Preparation (15 minutes)

### Step 1.1: Create Feature Branch

```bash
# Ensure you're on staging and up to date
git checkout staging
git pull origin staging

# Create feature branch
git checkout -b feature/mui-v7-upgrade

# Push branch to remote
git push -u origin feature/mui-v7-upgrade
```

### Step 1.2: Document Current State

```bash
# Save current dependency versions
cat packages/ui/package.json | grep "@mui/" > mui-v5-versions.txt
cat packages-answers/ui/package.json | grep "@mui/" >> mui-v5-versions.txt

# Count files using experimental API
echo "Files using experimental API:" > migration-stats.txt
grep -rl "experimental_extendTheme\|Experimental_CssVarsProvider" packages-answers/ui/src/ | tee -a migration-stats.txt | wc -l

# Save for comparison later
git add mui-v5-versions.txt migration-stats.txt
git commit -m "docs: save pre-migration state"
```

### Step 1.3: Create Rollback Point

```bash
# Tag current state for easy rollback
git tag pre-mui-v7-upgrade
git push origin pre-mui-v7-upgrade
```

**✅ Checkpoint:** You now have a clean feature branch and rollback point.

---

## Phase 2: Upgrade Dependencies (30 minutes)

### Step 2.1: Update package.json Files

**File: `packages/ui/package.json`**

Find and update these lines:

```json
{
  "dependencies": {
    "@mui/material": "7.3.5",          // was: 5.15.0
    "@mui/icons-material": "7.3.5",    // was: 5.0.3
    "@mui/lab": "7.0.0-alpha.21",      // was: 5.0.0-alpha.156
    "@mui/system": "7.3.5",            // was: 6.5.0
    "@mui/base": "7.0.0-beta.57",      // was: 5.0.0-beta.40
    "@mui/x-data-grid": "8.1.3",       // was: 6.8.0
    "@mui/x-tree-view": "8.1.3",       // was: 7.29.1
    "@emotion/react": "11.14.0",       // was: 11.14.0 (no change)
    "@emotion/styled": "11.14.1"       // was: 11.14.1 (no change)
  }
}
```

**File: `packages-answers/ui/package.json`** (if it has MUI deps)

Same updates as above for any `@mui/*` packages.

### Step 2.2: Install Dependencies

```bash
# Clean install
pnpm install

# Verify installation
pnpm list @mui/material
# Should show: @mui/material@7.3.5

# Check for peer dependency warnings
pnpm why @mui/material
```

### Step 2.3: Verify Build (Expect Errors)

```bash
# Try building - this WILL have errors, that's expected
pnpm build 2>&1 | tee build-errors-pre-migration.log

# Count errors
echo "Build errors before migration:" >> migration-stats.txt
cat build-errors-pre-migration.log | grep -c "error" >> migration-stats.txt
```

**✅ Checkpoint:** Dependencies upgraded, build errors documented.

---

## Phase 3: Run MUI Codemods (45 minutes)

MUI provides automated migration scripts (codemods) to handle most changes.

### Step 3.1: Prepare for Codemods

```bash
# Install codemod tool globally (if not already)
npm install -g @mui/codemod

# Verify installation
npx @mui/codemod --version
```

### Step 3.2: Run v7 Codemods on packages-answers/ui

```bash
cd /Users/diegocosta/dev/theanswer

# Run each codemod one by one to track changes

# 1. Migrate deprecated APIs
npx @mui/codemod@latest v7.0.0/deprecations packages-answers/ui/src/

# 2. Update theme color functions (already ran earlier)
npx @mui/codemod@latest v7.0.0/theme-color-functions packages-answers/ui/src/

# 3. Update styled API
npx @mui/codemod@latest v7.0.0/styled packages-answers/ui/src/

# 4. Update variant imports
npx @mui/codemod@latest v7.0.0/variant-imports packages-answers/ui/src/

# 5. Update base UI imports (if using @mui/base)
npx @mui/codemod@latest v7.0.0/base-imports packages-answers/ui/src/
```

### Step 3.3: Run v7 Codemods on packages/ui (Flowise)

```bash
# Same codemods for Flowise UI
npx @mui/codemod@latest v7.0.0/deprecations packages/ui/src/
npx @mui/codemod@latest v7.0.0/theme-color-functions packages/ui/src/
npx @mui/codemod@latest v7.0.0/styled packages/ui/src/
npx @mui/codemod@latest v7.0.0/variant-imports packages/ui/src/
npx @mui/codemod@latest v7.0.0/base-imports packages/ui/src/
```

### Step 3.4: Review Codemod Changes

```bash
# See what changed
git diff --stat

# Review specific changes
git diff packages-answers/ui/src/theme/

# Count modified files
git diff --name-only | wc -l >> migration-stats.txt
```

**⚠️ Important:** Codemods don't handle experimental API migration. That's next.

**✅ Checkpoint:** Automated migrations complete, ready for manual updates.

---

## Phase 4: Manual Migration - Remove Experimental APIs (90 minutes)

This is the core of the migration: converting experimental CSS Variables API to stable v7 API.

### Step 4.1: Update cssVarsTheme.tsx

**File:** `packages-answers/ui/src/theme/cssVarsTheme.tsx`

**BEFORE:**
```typescript
import {
    experimental_extendTheme as extendTheme,
    Experimental_CssVarsProvider as CssVarsProvider,
    useColorScheme
} from '@mui/material/styles'

export const cssVarsTheme = extendTheme({
    cssVarPrefix: 'theanswer',
    defaultColorScheme: 'dark',
    colorSchemes: {
        light: { palette: { /* ... */ } },
        dark: { palette: { /* ... */ } }
    },
    // ...rest of config
})

export const CssVarsThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ThemeErrorBoundary>
            <CssVarsProvider
                theme={cssVarsTheme}
                defaultMode='dark'
                modeStorageKey='mui-mode'
                colorSchemeStorageKey='mui-color-scheme'
            >
                {children}
            </CssVarsProvider>
        </ThemeErrorBoundary>
    )
}
```

**AFTER:**
```typescript
import {
    createTheme,
    ThemeProvider,
    useColorScheme
} from '@mui/material/styles'

// NOTE: In v7, createTheme supports CSS Variables natively
export const cssVarsTheme = createTheme({
    cssVariables: {
        cssVarPrefix: 'theanswer',
        colorSchemeSelector: 'data-theme'  // v7 uses this instead of attribute
    },
    defaultColorScheme: 'dark',
    colorSchemes: {
        light: { palette: { /* ... */ } },
        dark: { palette: { /* ... */ } }
    },
    // ...rest of config stays the same
})

export const CssVarsThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ThemeErrorBoundary>
            <ThemeProvider
                theme={cssVarsTheme}
                defaultMode='dark'
                modeStorageKey='mui-mode'
            >
                {children}
            </ThemeProvider>
        </ThemeErrorBoundary>
    )
}
```

**Key Changes:**
1. ❌ Remove `experimental_extendTheme` → ✅ Use `createTheme`
2. ❌ Remove `Experimental_CssVarsProvider` → ✅ Use `ThemeProvider`
3. ✅ Add `cssVariables` config object
4. ✅ Update `colorSchemeSelector` (v7 uses `data-theme` instead of attribute selector)
5. ✅ Remove `colorSchemeStorageKey` prop (no longer needed in v7)

### Step 4.2: Update Theme Index File

**File:** `packages-answers/ui/src/theme/index.tsx`

**BEFORE:**
```typescript
export { cssVarsTheme, CssVarsThemeProvider, useThemeMode } from './cssVarsTheme'
```

**AFTER:**
```typescript
// Re-exports stay the same - internal implementation changed
export { cssVarsTheme, CssVarsThemeProvider, useThemeMode } from './cssVarsTheme'
```

**Note:** No changes needed here, but verify exports work after cssVarsTheme.tsx updates.

### Step 4.3: Update Legacy Theme File (Backward Compatibility)

**File:** `packages-answers/ui/src/theme.tsx`

**Find line 8:**
```typescript
import createTheme from '@mui/material/styles/createTheme'
```

**Change to:**
```typescript
import { createTheme } from '@mui/material/styles'
```

**Explanation:** v7 no longer supports default imports, use named imports.

### Step 4.4: Update Flowise Theme (packages/ui)

**File:** `packages/ui/src/themes/index.js`

**BEFORE:**
```javascript
import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
```

**AFTER:**
```javascript
// Import stays the same - cssVarsTheme now uses stable API internally
import { cssVarsTheme } from '@ui/theme/cssVarsTheme'
```

**Note:** No changes needed if cssVarsTheme.tsx was updated correctly.

### Step 4.5: Search for Remaining Experimental Imports

```bash
# Find any remaining experimental imports
grep -rn "experimental_extendTheme\|Experimental_CssVarsProvider" packages-answers/ui/src/
grep -rn "experimental_extendTheme\|Experimental_CssVarsProvider" packages/ui/src/

# Should return: no matches found
```

**✅ Checkpoint:** All experimental imports removed, using stable v7 API.

---

## Phase 5: Update Type Declarations (30 minutes)

MUI v7 has updated TypeScript types. Update your theme augmentations.

### Step 5.1: Update Theme Type Augmentation

**File:** `packages-answers/ui/src/theme/cssVarsTheme.tsx`

**BEFORE:**
```typescript
declare module '@mui/material/styles' {
    interface Palette {
        glass: typeof glassmorphismTokens.light
        // ...
    }
    interface PaletteOptions {
        glass?: typeof glassmorphismTokens.light
        // ...
    }
    interface Theme {
        vars: {
            palette: Palette
        }
    }
}
```

**AFTER:**
```typescript
declare module '@mui/material/styles' {
    interface Palette {
        glass: typeof glassmorphismTokens.light
        // ...
    }
    interface PaletteOptions {
        glass?: typeof glassmorphismTokens.light
        // ...
    }
    // NOTE: In v7, Theme.vars is included by default when cssVariables: true
    // Remove manual Theme interface augmentation
}
```

**Key Change:** Remove `Theme { vars: ... }` interface - v7 provides this automatically.

### Step 5.2: Check for Type Errors

```bash
# Run TypeScript compiler check
pnpm --filter @ui tsc --noEmit

# Save type errors for review
pnpm --filter @ui tsc --noEmit 2>&1 | tee type-errors.log

# Count errors
echo "TypeScript errors:" >> migration-stats.txt
cat type-errors.log | grep -c "error" >> migration-stats.txt
```

### Step 5.3: Fix Common Type Issues

**Common Issue 1: `createTheme` signature changed**

If you see: `Type 'X' is not assignable to type 'ThemeOptions'`

**Fix:** Ensure `cssVariables` is an object, not a boolean:

```typescript
// ❌ Wrong
createTheme({ cssVariables: true })

// ✅ Correct for v7
createTheme({
    cssVariables: {
        cssVarPrefix: 'theanswer',
        colorSchemeSelector: 'data-theme'
    }
})
```

**Common Issue 2: `useColorScheme` return type**

If you see type errors in `useThemeMode` hook:

```typescript
// Add explicit return type
export const useThemeMode = (): {
    mode: 'light' | 'dark'
    setMode: (mode: 'light' | 'dark') => void
    toggleMode: () => void
    systemMode: 'light' | 'dark' | undefined
} => {
    const { mode, setMode, systemMode } = useColorScheme()
    // ...
}
```

**✅ Checkpoint:** Type errors resolved, TypeScript compilation clean.

---

## Phase 6: Build & Fix Breaking Changes (60 minutes)

### Step 6.1: Clean Build

```bash
# Clean all build artifacts
pnpm clean

# Rebuild from scratch
pnpm build 2>&1 | tee build-errors-post-migration.log
```

### Step 6.2: Address Common Breaking Changes

**Breaking Change 1: `createMuiTheme` removed**

If build fails with: `'createMuiTheme' is not exported`

**Find:**
```typescript
import { createMuiTheme } from '@mui/material/styles'
```

**Replace with:**
```typescript
import { createTheme } from '@mui/material/styles'
const theme = createTheme({ /* ... */ })  // was: createMuiTheme
```

**Breaking Change 2: Deep imports removed**

If build fails with: `Module not found: Can't resolve '@mui/material/styles/createTheme'`

**Find:**
```typescript
import createTheme from '@mui/material/styles/createTheme'
```

**Replace with:**
```typescript
import { createTheme } from '@mui/material/styles'
```

**Breaking Change 3: Dialog `onBackdropClick` removed**

If build fails with: `Property 'onBackdropClick' does not exist`

**Find:**
```tsx
<Dialog onBackdropClick={handleClose}>
```

**Replace with:**
```tsx
<Dialog onClose={(event, reason) => {
    if (reason === 'backdropClick') {
        handleClose()
    }
}}>
```

**Breaking Change 4: `experimentalStyled` removed**

If build fails with: `'experimentalStyled' is not exported`

**Find:**
```typescript
import { experimentalStyled as styled } from '@mui/material/styles'
```

**Replace with:**
```typescript
import { styled } from '@mui/material/styles'
```

### Step 6.3: Check for Warnings

```bash
# Build again and check for deprecation warnings
pnpm build 2>&1 | grep -i "deprecated\|warning" | tee deprecation-warnings.log

# Review warnings
cat deprecation-warnings.log
```

**✅ Checkpoint:** Build succeeds with no errors, warnings documented.

---

## Phase 7: Testing (120 minutes)

### Step 7.1: Unit Tests

```bash
# Run all unit tests
pnpm test

# Focus on theme-related tests
pnpm test -- --testPathPattern=theme

# Check theme compliance
pnpm --filter @ui test -- __tests__/themeCompliance.test.ts
```

### Step 7.2: Manual Theme Testing

```bash
# Start dev server
pnpm dev
```

**Test Checklist:**

- [ ] **Theme Toggle**
  - [ ] Click theme toggle button
  - [ ] Verify instant switch (< 5ms)
  - [ ] Check browser DevTools: CSS variables update
  - [ ] No console errors

- [ ] **CSS Variables Generated**
  - [ ] Open DevTools → Elements → `:root`
  - [ ] Verify `--theanswer-palette-*` variables exist
  - [ ] Check both `[data-theme="light"]` and `[data-theme="dark"]`

- [ ] **Component Rendering**
  - [ ] Glassmorphic cards render correctly
  - [ ] Colors match design in both modes
  - [ ] No flashing/flickering on theme change

- [ ] **Persistence**
  - [ ] Toggle to light mode
  - [ ] Refresh page
  - [ ] Verify light mode persists

- [ ] **SSR (if applicable)**
  - [ ] Build production: `pnpm build`
  - [ ] Start production: `pnpm start`
  - [ ] Check no FOUC (Flash of Unstyled Content)

### Step 7.3: E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run theme-specific E2E (if exists)
pnpm test:e2e -- tests/theme.spec.ts
```

### Step 7.4: Performance Validation

**Measure theme toggle performance:**

1. Open DevTools → Performance tab
2. Click "Record"
3. Toggle theme
4. Stop recording
5. Verify: Theme change completes in < 5ms

**Expected Results:**
- ✅ Toggle latency: ~3ms
- ✅ Component re-renders: 0
- ✅ Layout shifts: 0

### Step 7.5: Accessibility Testing

```bash
# Run a11y tests (if configured)
pnpm test:a11y
```

**Manual A11y Checks:**

- [ ] Keyboard navigation works (Tab through UI)
- [ ] Focus indicators visible in both themes
- [ ] Screen reader announces theme change
- [ ] High contrast mode works

**✅ Checkpoint:** All tests passing, theme works correctly.

---

## Phase 8: Documentation Updates (30 minutes)

### Step 8.1: Update Theme README

**File:** `packages-answers/ui/src/theme/README.md`

**Find section:** "Current Implementation (MUI v5.15.0)"

**Update to:**
```markdown
## Current Implementation (MUI v7.3.5)

### API Status

**Using Stable APIs:** ✅ Production-ready

- `createTheme` with `cssVariables` - Stable theme creation
- `ThemeProvider` - Standard provider with CSS variables support
- `useColorScheme` - Stable hook for theme mode control

### Migration from v5 Experimental APIs

Previously (v5), this project used experimental CSS Variables APIs:
- `experimental_extendTheme` → Now: `createTheme`
- `Experimental_CssVarsProvider` → Now: `ThemeProvider`

**Migration completed:** [Date]
**No breaking changes** to theme functionality or performance.
```

### Step 8.2: Update Migration Guide

**File:** `packages-answers/ui/src/theme/docs/migration.md`

**Add new section at top:**
```markdown
## ✅ COMPLETED: MUI v7 Upgrade (Stable APIs)

**Date:** [Current Date]
**Status:** Using stable CSS Variables API (MUI v7.3.5)

This project has been upgraded from experimental APIs to stable v7 APIs.

### What Changed

**Before (v5 Experimental):**
```typescript
import {
  experimental_extendTheme as extendTheme,
  Experimental_CssVarsProvider as CssVarsProvider
} from '@mui/material/styles'
```

**After (v7 Stable):**
```typescript
import { createTheme, ThemeProvider } from '@mui/material/styles'

const theme = createTheme({
  cssVariables: { cssVarPrefix: 'theanswer' },
  colorSchemes: { light: {}, dark: {} }
})
```

### Performance Impact

**No performance degradation:**
- Theme toggle: Still ~3ms ✅
- Zero re-renders: Still 0 ✅
- SSR FOUC: Still zero ✅
```

### Step 8.3: Update CLAUDE.md

**File:** `CLAUDE.md` (root)

**Find:** References to experimental APIs

**Update all mentions:**
- "experimental_extendTheme" → "createTheme with cssVariables"
- "Experimental_CssVarsProvider" → "ThemeProvider"
- "MUI v5.15.0" → "MUI v7.3.5"
- "experimental APIs" → "stable v7 APIs"

### Step 8.4: Create Migration Summary

```bash
# Create summary document
cat > MUI_V7_MIGRATION_SUMMARY.md << 'EOF'
# MUI v7 Migration Summary

**Date:** $(date +%Y-%m-%d)
**Status:** ✅ Complete

## Changes Made

### Dependencies Upgraded
- @mui/material: 5.15.0 → 7.3.5
- @mui/icons-material: 5.0.3 → 7.3.5
- @mui/system: 6.5.0 → 7.3.5
- @mui/lab: 5.0.0-alpha.156 → 7.0.0-alpha.21
- @mui/base: 5.0.0-beta.40 → 7.0.0-beta.57
- @mui/x-data-grid: 6.8.0 → 8.1.3

### API Migrations
- experimental_extendTheme → createTheme
- Experimental_CssVarsProvider → ThemeProvider
- Added cssVariables configuration

### Files Modified
$(git diff --name-only pre-mui-v7-upgrade HEAD | wc -l) files

### Breaking Changes Addressed
- Deep imports removed
- createMuiTheme replaced
- Dialog onBackdropClick updated
- experimentalStyled replaced

### Performance Validation
- Theme toggle: ~3ms ✅ (no regression)
- Component re-renders: 0 ✅
- SSR FOUC: Zero ✅
- TypeScript errors: 0 ✅
- Build warnings: [count from logs]

### Testing Results
- Unit tests: [PASS/FAIL count]
- E2E tests: [PASS/FAIL count]
- Manual testing: ✅ Complete

## Rollback Plan

If issues arise, rollback with:
```bash
git checkout staging
git reset --hard pre-mui-v7-upgrade
git push origin staging --force
```

## Next Steps

- [ ] Monitor production for 1 week
- [ ] Remove experimental API deprecation warnings
- [ ] Update team documentation
- [ ] Consider upgrading MUI X components to v8
EOF
```

**✅ Checkpoint:** Documentation updated, migration summary created.

---

## Phase 9: Commit & PR (30 minutes)

### Step 9.1: Review All Changes

```bash
# See all modified files
git status

# Review diff summary
git diff --stat

# Review actual changes
git diff packages-answers/ui/src/theme/
```

### Step 9.2: Commit Changes

```bash
# Stage all changes
git add .

# Create detailed commit
git commit -m "feat: upgrade to MUI v7 stable CSS Variables API

BREAKING CHANGE: Migrated from experimental APIs to stable v7 APIs

### Changes
- Upgrade @mui/material 5.15.0 → 7.3.5
- Replace experimental_extendTheme with createTheme
- Replace Experimental_CssVarsProvider with ThemeProvider
- Add cssVariables configuration to theme
- Update type declarations for v7
- Fix breaking changes (createMuiTheme, Dialog props, etc.)

### Performance
- Theme toggle: ~3ms (no regression)
- Zero component re-renders maintained
- Zero SSR FOUC maintained

### Testing
- All unit tests passing
- All E2E tests passing
- Manual theme testing complete
- Accessibility validation complete

### Documentation
- Updated theme README
- Updated migration guide
- Created migration summary

Refs: MUI_V7_UPGRADE_PLAN.md, MUI_V7_MIGRATION_SUMMARY.md
"
```

### Step 9.3: Push & Create PR

```bash
# Push to remote
git push origin feature/mui-v7-upgrade

# Create PR using /push workflow
/push "upgrade to MUI v7 stable CSS Variables API"
```

### Step 9.4: PR Description

```markdown
## MUI v7 Upgrade: Stable CSS Variables API

### Summary
Migrated from MUI v5 experimental CSS Variables API to stable v7 API, removing all "experimental" labels while maintaining 100% functionality and performance.

### Motivation
- Remove "experimental" API concerns
- Upgrade to stable, production-ready APIs
- Future-proof theme system
- Access v7 features and improvements

### Changes
- ✅ Dependencies: MUI v5.15.0 → v7.3.5
- ✅ API: experimental_extendTheme → createTheme
- ✅ API: Experimental_CssVarsProvider → ThemeProvider
- ✅ Config: Added cssVariables object
- ✅ Types: Updated theme type declarations
- ✅ Docs: Updated all theme documentation

### Performance Validation
- Theme toggle: **3ms** ✅ (no regression)
- Component re-renders: **0** ✅
- SSR FOUC: **Zero** ✅
- TypeScript errors: **0** ✅

### Testing
- ✅ Unit tests: All passing
- ✅ E2E tests: All passing
- ✅ Manual testing: Complete
- ✅ Accessibility: Validated

### Breaking Changes
None for theme functionality. All breaking changes handled internally.

### Documentation
- [x] Updated README
- [x] Updated migration guide
- [x] Created migration summary
- [x] Updated CLAUDE.md

### Rollback Plan
Tagged `pre-mui-v7-upgrade` for easy rollback if needed.

### Next Steps After Merge
- Monitor production for 1 week
- Consider upgrading MUI X to v8 (separate PR)
```

**✅ Checkpoint:** PR created and ready for review.

---

## Phase 10: Post-Merge Monitoring (1 week)

### Step 10.1: Merge to Staging

```bash
# After PR approval, merge to staging
gh pr merge --squash

# Pull latest staging
git checkout staging
git pull origin staging
```

### Step 10.2: Deploy to Staging Environment

```bash
# Deploy to staging (method depends on your setup)
pnpm copilot:auto --env staging

# Or via CI/CD trigger
git push origin staging
```

### Step 10.3: Monitoring Checklist (Daily for 1 week)

**Day 1-7 Checks:**

- [ ] **Performance Monitoring**
  - [ ] Check theme toggle latency (< 5ms)
  - [ ] Monitor CPU usage during theme changes
  - [ ] Check memory leaks (DevTools Memory profiler)

- [ ] **Error Monitoring**
  - [ ] Check Sentry/error logs for theme-related errors
  - [ ] Monitor console errors in production
  - [ ] Review user-reported issues

- [ ] **Browser Compatibility**
  - [ ] Test on Chrome (latest)
  - [ ] Test on Firefox (latest)
  - [ ] Test on Safari (latest)
  - [ ] Test on mobile browsers

- [ ] **Accessibility**
  - [ ] Screen reader testing
  - [ ] Keyboard navigation
  - [ ] High contrast mode

### Step 10.4: Production Deployment

**After 1 week on staging with no issues:**

```bash
# Create PR from staging to production
gh pr create --base production --head staging \
  --title "MUI v7 Upgrade: Stable CSS Variables API" \
  --body "Tested on staging for 1 week with no issues. Ready for production."

# After approval, merge to production
gh pr merge --squash
```

**✅ Checkpoint:** Migration complete, running in production.

---

## Rollback Procedures

### Emergency Rollback (If Critical Issues Found)

**Option 1: Rollback via Git Tag**

```bash
# Return to pre-upgrade state
git checkout staging
git reset --hard pre-mui-v7-upgrade
git push origin staging --force

# Redeploy
pnpm copilot:auto --env staging
```

**Option 2: Revert Merge Commit**

```bash
# Find merge commit
git log --oneline --merges | head -5

# Revert the merge
git revert -m 1 <merge-commit-sha>
git push origin staging
```

**Option 3: Hotfix Branch**

```bash
# Create hotfix from pre-upgrade tag
git checkout -b hotfix/revert-mui-v7 pre-mui-v7-upgrade
git push origin hotfix/revert-mui-v7

# Deploy hotfix
pnpm copilot:auto --env staging --branch hotfix/revert-mui-v7
```

### Partial Rollback (Specific Files)

```bash
# Rollback specific file(s)
git checkout pre-mui-v7-upgrade -- packages-answers/ui/src/theme/cssVarsTheme.tsx
git commit -m "revert: rollback cssVarsTheme to v5 experimental API"
git push origin staging
```

---

## Troubleshooting Guide

### Issue 1: Build Fails with Type Errors

**Symptom:** `Property 'vars' does not exist on type 'Theme'`

**Solution:**
```bash
# Clear TypeScript cache
rm -rf packages-answers/ui/tsconfig.tsbuildinfo
rm -rf node_modules/.cache

# Rebuild
pnpm build
```

### Issue 2: CSS Variables Not Generated

**Symptom:** No `--theanswer-*` variables in `:root`

**Solution:**

Check theme configuration includes `cssVariables`:

```typescript
const theme = createTheme({
  cssVariables: {  // ← Must be an object
    cssVarPrefix: 'theanswer'
  },
  colorSchemes: { /* ... */ }
})
```

### Issue 3: Theme Toggle Not Working

**Symptom:** Click toggle, nothing happens

**Solution:**

Verify `ThemeProvider` is used (not old `CssVarsProvider`):

```typescript
// ❌ Wrong
import { Experimental_CssVarsProvider } from '@mui/material/styles'

// ✅ Correct
import { ThemeProvider } from '@mui/material/styles'
```

### Issue 4: SSR Hydration Mismatch

**Symptom:** "Hydration failed" error in console

**Solution:**

Ensure `defaultMode` matches server/client:

```typescript
<ThemeProvider theme={theme} defaultMode="dark">
  {children}
</ThemeProvider>
```

And in `app/layout.tsx`:

```typescript
import { InitColorSchemeScript } from '@mui/material/styles'

<html>
  <head>
    <InitColorSchemeScript defaultMode="dark" />
  </head>
  ...
</html>
```

### Issue 5: Performance Regression

**Symptom:** Theme toggle slower than 5ms

**Solution:**

1. Check if components are using `theme.palette` instead of `theme.vars.palette`
2. Run ESLint to find violations:
   ```bash
   pnpm lint packages-answers/ui/src/
   ```
3. Fix violations:
   ```bash
   pnpm lint-fix packages-answers/ui/src/
   ```

---

## Success Criteria

✅ Migration is successful when:

- [ ] All tests passing (unit + E2E)
- [ ] Build succeeds with 0 errors
- [ ] TypeScript compilation clean (0 errors)
- [ ] Theme toggle < 5ms
- [ ] Zero component re-renders on toggle
- [ ] Zero SSR FOUC
- [ ] CSS variables generated correctly
- [ ] Browser DevTools shows `--theanswer-*` vars
- [ ] Theme persists across page reloads
- [ ] Accessibility maintained (WCAG AA)
- [ ] No console errors in production
- [ ] All documentation updated
- [ ] 1 week of production monitoring clean

---

## Maintenance After Migration

### Weekly Tasks (First Month)

- [ ] Monitor error logs for theme-related issues
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Test new browser versions

### Monthly Tasks

- [ ] Update MUI dependencies (patch versions)
- [ ] Review deprecation warnings
- [ ] Update documentation if needed

### Quarterly Tasks

- [ ] Consider upgrading to latest MUI v7 minor version
- [ ] Review and update theme tokens
- [ ] Accessibility audit

---

## Resources

### Official Documentation
- [MUI v7 Migration Guide](https://mui.com/material-ui/migration/upgrade-to-v7/)
- [MUI CSS Variables Documentation](https://mui.com/material-ui/customization/css-theme-variables/)
- [MUI v7 Changelog](https://github.com/mui/material-ui/releases)

### Internal Documentation
- `packages-answers/ui/src/theme/README.md` - Theme system overview
- `packages-answers/ui/src/theme/docs/migration.md` - Migration guide
- `THEME_VALIDATION_SETUP_REPORT.md` - Validation system docs

### Support
- MUI GitHub Issues: https://github.com/mui/material-ui/issues
- MUI Discord: https://mui.com/r/discord/
- Team Slack: #frontend-support

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Backup & Preparation | 15 min | ⏳ Pending |
| 2. Upgrade Dependencies | 30 min | ⏳ Pending |
| 3. Run Codemods | 45 min | ⏳ Pending |
| 4. Manual Migration | 90 min | ⏳ Pending |
| 5. Update Types | 30 min | ⏳ Pending |
| 6. Build & Fix | 60 min | ⏳ Pending |
| 7. Testing | 120 min | ⏳ Pending |
| 8. Documentation | 30 min | ⏳ Pending |
| 9. Commit & PR | 30 min | ⏳ Pending |
| 10. Monitoring | 1 week | ⏳ Pending |
| **Total** | **~8 hours + 1 week monitoring** | |

---

**Next Step:** Begin Phase 1 - Create feature branch and backup current state.

Ready to proceed?
