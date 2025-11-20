# Theme ESLint Rules & Validation

This document describes the ESLint rules and validation systems implemented to enforce theme pattern compliance across the codebase.

## Overview

The theme linting system is designed to:
- Prevent direct `theme.palette.*` access (encourage `theme.vars.palette.*`)
- Detect and warn about deprecated patterns
- Validate theme configuration completeness at build and development time
- Enforce glassmorphism design patterns

## ESLint Rules

### 1. Prevent Direct Palette Access

**Rule:** `no-restricted-syntax`
**Severity:** warn
**Pattern:** `theme.palette.*` (without `theme.vars`)

```typescript
// ❌ DON'T - Direct palette access
const color = theme.palette.primary.main
const padding = { color: theme.palette.text.primary }

// ✅ DO - Use theme.vars.palette
const color = theme.vars.palette.primary.main
const padding = (theme) => ({ color: theme.vars.palette.text.primary })

// ✅ DO - Use sx prop with theme function
<Box sx={(theme) => ({ color: theme.vars.palette.text.primary })} />
```

**Fix:** Replace `theme.palette` with `theme.vars.palette`

---

### 2. Prevent Common Color Access

**Rule:** `no-restricted-properties`
**Severity:** warn
**Pattern:** `theme.palette.common.*`

```typescript
// ❌ DON'T - Using palette.common
color: theme.palette.common.white
border: `1px solid ${theme.palette.common.black}`

// ✅ DO - Use explicit values or CSS Variables
color: '#ffffff'
color: 'rgba(255, 255, 255, 0.8)'
color: 'var(--theanswer-palette-text-primary)'
```

---

### 3. Warn on Direct useTheme()

**Rule:** Custom plugin (can be enabled)
**Severity:** info
**Pattern:** `useTheme()` without CSS Variables awareness

```typescript
// ⚠️ MAY BYPASS CSS VARIABLES
const theme = useTheme()
const color = theme.palette.primary.main

// ✅ PREFERRED - Use sx prop with theme function
sx={(theme) => ({
    color: theme.vars.palette.primary.main
})}

// ✅ ALSO OK - Extract from useTheme() and use vars
const theme = useTheme()
const color = theme.vars.palette.primary.main
```

---

## Theme Validators

### Build-Time Validation

**When it runs:** During build process and pre-commit hooks
**What it checks:**
- All required glassmorphism tokens are defined
- All color tokens have both light and dark modes
- All status colors (success, warning, error) are configured
- CSS variable naming follows conventions
- No duplicate color values across tokens

**How to run manually:**
```bash
pnpm run theme:validate
```

### Runtime Validation

**When it runs:** Development mode only (automatic)
**What it checks:**
- Theme structure is valid (palette, typography, spacing)
- CSS variables are initialized in DOM
- Color scheme attribute is set correctly
- Health check runs on theme initialization

**How to run manually:**
```typescript
import { runThemeHealthCheck } from '@theme'

const result = runThemeHealthCheck(theme)
console.log(result) // { isValid: boolean, checks: {...} }
```

## Pattern Detector

The pattern detector runs in development mode to catch deprecated patterns at runtime.

```typescript
import {
    themePatternDetector,
    reportThemePatternViolations
} from '@theme/validators/patternDetector'

// Automatically detects violations
// Returns warnings/suggestions in console

// Generate full report
reportThemePatternViolations()

// Clear violations
themePatternDetector.clearViolations()

// Get summary
const summary = themePatternDetector.getSummary()
// { total: number, errors: number, warnings: number, info: number }
```

## Pre-Commit Hooks

### Theme Validation Hook

**File:** `.husky/theme-validate`
**Trigger:** Pre-commit (automatically integrated into main pre-commit hook)

**What it checks:**
- Theme files were not modified without proper validation
- Glassmorphism tokens are present
- Color tokens are present
- No direct palette access in modified files
- No deprecated patterns introduced

**Output:**
```
🎨 Theme Validation
Theme files detected:
  packages-answers/ui/src/theme/tokens/colors.ts
  packages-answers/ui/src/theme/tokens/glassmorphism.ts

Running theme compliance validation...
Validating theme structure...
✓ Glassmorphism tokens found
✓ Color tokens found
✓ No deprecated patterns detected

Theme validation complete
```

## Development Warnings

### Compliance Check

Add to your app initialization:

```typescript
import { runThemeComplianceCheck } from '@theme/validators/themeCompliance'

// In development, runs full compliance audit
if (process.env.NODE_ENV !== 'production') {
    runThemeComplianceCheck(true) // verbose=true shows full report
}
```

**Output:**
```
🎨 Theme Compliance Audit
Status: ✅ FULLY COMPLIANT
Results: 45/45 checks passed
```

### Pattern Detection

Automatically warns about deprecated patterns:

```
⚠️ [Theme Pattern] Direct theme.palette access detected: theme.palette.primary.main
   → Suggestion: Replace 'theme.palette.primary.main' with 'theme.vars.palette.primary.main' for CSS Variables support
```

## Configuration

### ESLint

The theme rules are built into the main `.eslintrc.cjs`:

```javascript
// .eslintrc.cjs
'no-restricted-syntax': [
    'warn',
    {
        selector: 'MemberExpression[object.name="theme"][property.name="palette"]',
        message: 'Use theme.vars.palette instead...'
    }
]
```

### Lint-Staged

Theme files are automatically linted on commit:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "eslint --fix"
  }
}
```

## Common Patterns & Fixes

### Pattern 1: Converting useTheme() to sx prop

```typescript
// ❌ Before
const MyComponent = () => {
    const theme = useTheme()
    return (
        <Box sx={{ color: theme.palette.primary.main }}>
            Content
        </Box>
    )
}

// ✅ After
const MyComponent = () => {
    return (
        <Box sx={(theme) => ({ color: theme.vars.palette.primary.main })}>
            Content
        </Box>
    )
}
```

### Pattern 2: Alpha transparency with CSS Variables

```typescript
// ❌ Before
const color = alpha(theme.palette.primary.main, 0.5)

// ✅ After
const color = `rgba(var(--theanswer-palette-primary-main-rgb), 0.5)`
// Or use MUI alpha with CSS Variables:
const color = alpha(`var(--theanswer-palette-primary-main)`, 0.5)
```

### Pattern 3: Styled components with theme

```typescript
// ❌ Before
const StyledBox = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default
}))

// ✅ After
const StyledBox = styled(Box)(({ theme }) => ({
    color: theme.vars.palette.text.primary,
    backgroundColor: theme.vars.palette.background.default
}))
```

## Disabling Rules

If you need to disable a rule for a specific line or file:

### Single Line

```typescript
// eslint-disable-next-line no-restricted-syntax
const color = theme.palette.primary.main
```

### Block

```typescript
/* eslint-disable no-restricted-syntax */
const color = theme.palette.primary.main
const bg = theme.palette.background.default
/* eslint-enable no-restricted-syntax */
```

### File-wide

```typescript
/* eslint-disable no-restricted-syntax */
// ... content
```

**Note:** Only disable for good reasons. Comment why you're disabling.

## Validation Report Example

```
🎨 Theme Compliance Audit
Timestamp: 2025-11-19T10:30:00.000Z
Status: ✅ FULLY COMPLIANT
Results: 45/45 checks passed

✓ Glassmorphism Tokens (8 checks)
  ✓ Light mode glassPrimary defined
  ✓ Dark mode glassPrimary defined
  ...

✓ Color Tokens (12 checks)
  ✓ Light mode has primary
  ✓ Dark mode has primary
  ...

✓ Status Colors (5 checks)
  ✓ Status color success defined
  ✓ success has main, light, dark variants
  ...

✓ CSS Variable Naming (2 checks)
  ✓ Expected variables follow convention: --theanswer-category-property
  ...

✓ Color Uniqueness (18 checks)
  ✓ Color #ffffff unique in colorTokens.light.background.default
  ...
```

## Testing

Run the theme validator tests:

```bash
# All tests
pnpm test:theme

# Specific test file
pnpm --filter ui test -- __tests__/themeCompliance.test.ts

# Watch mode
pnpm --filter ui test -- --watch
```

## Integration with CI/CD

The theme validation is integrated into your pre-commit hooks and can be added to CI pipelines:

```yaml
# .github/workflows/lint.yml
- name: Validate theme
  run: pnpm run theme:validate

- name: ESLint
  run: pnpm lint

- name: Type check
  run: pnpm --filter ui tsc --noEmit
```

## Troubleshooting

### "Use theme.vars.palette instead..." warning

This means you're accessing `theme.palette` directly. Convert to using `theme.vars.palette`:

```typescript
// Find: theme.palette.
// Replace: theme.vars.palette.
```

### Pre-commit hook failing

If the theme validation hook fails:

1. Check that theme files weren't corrupted
2. Verify glassmorphism and color tokens exist
3. Run manual validation: `pnpm run theme:validate`
4. Check for merge conflicts in theme files

### Compliance report shows failures

Run the full audit to see what failed:

```typescript
import { runComplianceAudit, printComplianceReport } from '@theme/validators/themeCompliance'

const report = runComplianceAudit()
printComplianceReport(report)
```

## Resources

- [Theme Implementation Guide](./README.md)
- [Safety Checklist](./SAFETY.md)
- [CSS Variables Theme Docs](./docs/api.md)
- [Migration Guide](./docs/migration.md)
