# Theme ESLint Quick Fix Guide

Quick reference for fixing common theme linting errors.

## Error Messages & Fixes

### ❌ "Avoid direct theme.palette access"

**What this means:** You're using `theme.palette.*` instead of `theme.vars.palette.*`

**Quick Fix:**
```diff
- color: theme.palette.primary.main
+ color: theme.vars.palette.primary.main
```

**Full Example:**
```typescript
// ❌ Wrong
const MyComponent = () => {
    const theme = useTheme()
    return <Box sx={{ color: theme.palette.primary.main }} />
}

// ✅ Correct
const MyComponent = () => {
    return (
        <Box sx={(theme) => ({
            color: theme.vars.palette.primary.main
        })} />
    )
}
```

---

### ⚠️ "Use theme.vars.palette instead"

**What this means:** Same as above, but with suggested replacement.

**ESLint can auto-fix this:**
```bash
pnpm lint --fix
```

---

### ⚠️ "palette.common is deprecated"

**What this means:** You're using `theme.palette.common.white` or similar.

**Quick Fix:**
```diff
- color: theme.palette.common.white
+ color: '#ffffff'

- background: theme.palette.common.black
+ background: '#000000'

- border: `1px solid ${theme.palette.common.white}`
+ border: '1px solid rgba(255, 255, 255, 0.2)'
```

**Full Example:**
```typescript
// ❌ Wrong
const MyComponent = styled(Box)(({ theme }) => ({
    color: theme.palette.common.white,
    borderColor: theme.palette.common.black
}))

// ✅ Correct
const MyComponent = styled(Box)(({ theme }) => ({
    color: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    // Or use CSS Variables:
    color: 'var(--theanswer-palette-text-onGlass)'
}))
```

---

### ℹ️ "useTheme() may bypass CSS Variables"

**What this means:** You're using `useTheme()` to access theme, which may not support dynamic color switching.

**Quick Fix - Convert to sx prop:**
```typescript
// ❌ Before
const MyComponent = () => {
    const theme = useTheme()
    const color = theme.palette.primary.main

    return <Box sx={{ color }} />
}

// ✅ After
const MyComponent = () => {
    return (
        <Box sx={(theme) => ({
            color: theme.vars.palette.primary.main
        })} />
    )
}
```

**Quick Fix - If you must use useTheme():**
```typescript
// ✅ OK (but not ideal)
const MyComponent = () => {
    const theme = useTheme()
    return (
        <Box sx={{ color: theme.vars.palette.primary.main }} />
    )
}
```

---

## Pattern Replacements

### useTheme() → sx prop

```typescript
// ❌ Don't
const MyComponent = () => {
    const theme = useTheme()
    return (
        <Box sx={{
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.background.default
        }} />
    )
}

// ✅ Do
const MyComponent = () => {
    return (
        <Box sx={(theme) => ({
            color: theme.vars.palette.primary.main,
            backgroundColor: theme.vars.palette.background.default
        })} />
    )
}
```

### styled() component

```typescript
// ❌ Wrong
const StyledBox = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider
}))

// ✅ Correct
const StyledBox = styled(Box)(({ theme }) => ({
    color: theme.vars.palette.text.primary,
    backgroundColor: theme.vars.palette.background.paper,
    borderColor: theme.vars.palette.divider
}))
```

### Alpha transparency

```typescript
// ❌ Old way
import { alpha } from '@mui/material/styles'
const color = alpha(theme.palette.primary.main, 0.5)

// ✅ New way (CSS Variables)
// Use rgba directly:
const color = 'rgba(0, 0, 0, 0.5)'

// Or CSS variable:
const color = 'rgba(var(--theanswer-palette-primary-main-rgb), 0.5)'

// Or with alpha helper on theme.vars:
const color = alpha(theme.vars.palette.primary.main, 0.5)
```

### Conditional styling

```typescript
// ❌ Using theme from useTheme()
const MyComponent = ({ isActive }) => {
    const theme = useTheme()
    return (
        <Box sx={{
            color: isActive ? theme.palette.primary.main : theme.palette.text.secondary
        }} />
    )
}

// ✅ Using sx prop with function
const MyComponent = ({ isActive }) => {
    return (
        <Box sx={(theme) => ({
            color: isActive
                ? theme.vars.palette.primary.main
                : theme.vars.palette.text.secondary
        })} />
    )
}
```

---

## Color Replacements

### Common replacements:

```typescript
// White colors
theme.palette.common.white → '#ffffff' or 'white'

// Black colors
theme.palette.common.black → '#000000' or 'black'

// Text colors
theme.palette.text.primary → theme.vars.palette.text.primary
theme.palette.text.secondary → theme.vars.palette.text.secondary

// Background colors
theme.palette.background.default → theme.vars.palette.background.default
theme.palette.background.paper → theme.vars.palette.background.paper

// Status colors
theme.palette.success.main → theme.vars.palette.success.main
theme.palette.error.main → theme.vars.palette.error.main
theme.palette.warning.main → theme.vars.palette.warning.main
```

---

## Auto-Fix

ESLint can automatically fix some issues:

```bash
# Fix all files
pnpm lint --fix

# Fix specific file
pnpm lint --fix path/to/file.tsx

# Fix specific directory
pnpm lint --fix packages-answers/ui/src/
```

## Manual Search & Replace

If auto-fix doesn't work, use find & replace:

**In VS Code:**
1. Open Find and Replace (Cmd/Ctrl + H)
2. Find: `theme\.palette\.`
3. Replace: `theme.vars.palette.`
4. Replace in specific folder (scope to `packages-answers/ui/src/`)

**In terminal:**
```bash
# Find all occurrences
grep -r "theme\.palette\." packages-answers/ui/src/

# Count
grep -r "theme\.palette\." packages-answers/ui/src/ | wc -l

# Replace with sed (macOS)
find packages-answers/ui/src -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i '' 's/theme\.palette\./theme.vars.palette./g'
```

---

## Prevention

### Pre-commit hook catches issues

Issues will be caught before commit:
```bash
git commit -m "message"
# ESLint runs automatically
# If there are errors, commit will fail with helpful messages
```

### Enable IDE warnings

Most IDEs can show ESLint errors inline:

**VS Code:**
1. Install ESLint extension
2. Settings: `"eslint.validate": ["typescript", "typescriptreact"]`
3. Errors show as squiggles

**WebStorm:**
1. Preferences → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Enable ESLint
3. Errors show inline

---

## Testing Your Changes

After fixing errors, verify:

```bash
# Run linter
pnpm lint

# Run type check
pnpm --filter ui tsc --noEmit

# Run theme validation
pnpm run theme:validate

# Run tests
pnpm test:theme
```

---

## Help & Support

If you're stuck:

1. **Read the rule message** - Usually tells you exactly what to fix
2. **Check LINTING_RULES.md** - Detailed guide for each rule
3. **Ask in Slack** - Share the error message and context
4. **Check git history** - See how others fixed similar issues

---

## Common Mistakes

### ❌ Disabling rules without reason

Don't just add `// eslint-disable` to silence warnings.

```typescript
// ❌ Don't do this
// eslint-disable-next-line no-restricted-syntax
const color = theme.palette.primary.main
```

Instead, actually fix the issue.

### ❌ Mixing old and new patterns

```typescript
// ❌ Don't mix
const theme = useTheme()
const color = theme.vars.palette.primary.main // Good
const bg = theme.palette.background.default    // Bad - in same file
```

### ❌ Forgetting CSS Variables prefix

```typescript
// ❌ Wrong variable name
color: var(--palette-primary-main)

// ✅ Correct prefix
color: var(--theanswer-palette-primary-main)
```

---

## Before & After Examples

### Example 1: Simple color change

```typescript
// ❌ Before
const metadata = {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(2)
}

// ✅ After
const metadata = (theme) => ({
    backgroundColor: theme.vars.palette.primary.main,
    color: '#ffffff',
    padding: theme.spacing(2)
})
```

### Example 2: Styled component

```typescript
// ❌ Before
const CardBox = styled(Box)(({ theme }) => ({
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary
}))

// ✅ After
const CardBox = styled(Box)(({ theme }) => ({
    background: theme.vars.palette.background.paper,
    border: `1px solid ${theme.vars.palette.divider}`,
    color: theme.vars.palette.text.primary
}))
```

### Example 3: Complex condition

```typescript
// ❌ Before
const Component = ({ isDark }) => {
    const theme = useTheme()

    return (
        <Box sx={{
            color: isDark
                ? theme.palette.primary.main
                : theme.palette.secondary.main
        }} />
    )
}

// ✅ After
const Component = ({ isDark }) => {
    return (
        <Box sx={(theme) => ({
            color: isDark
                ? theme.vars.palette.primary.main
                : theme.vars.palette.secondary.main
        })} />
    )
}
```

---

## Summary Checklist

When fixing theme linting errors:

- [ ] Replace `theme.palette.` with `theme.vars.palette.`
- [ ] Replace `theme.palette.common.white` with `'#ffffff'`
- [ ] Replace `useTheme()` calls with sx prop functions
- [ ] Verify color values are correct
- [ ] Run `pnpm lint --fix` to auto-fix remaining issues
- [ ] Run `pnpm lint` to verify all issues resolved
- [ ] Run theme validator: `pnpm run theme:validate`
- [ ] Test in browser to verify styling works
