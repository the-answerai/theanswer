# Theme Safety & Error Handling

## Quick Reference

This guide covers the theme error handling and type safety features implemented in the theme system.

## Error Boundary

### What It Does
Prevents full app crashes when the theme system encounters an error. Shows a user-friendly fallback UI instead.

### Where It's Active
The error boundary is automatically enabled for all apps using `CssVarsThemeProvider`:

```typescript
import { CssVarsThemeProvider } from '@ui/theme'

// Error boundary is already included
<CssVarsThemeProvider>
    <App />
</CssVarsThemeProvider>
```

### Fallback UI Features
- Beautiful glassmorphism design
- Clear error explanation
- Two recovery options:
  - **Refresh Page** - Quick reload
  - **Reset Theme Settings** - Clears localStorage and reloads
- Expandable technical details for debugging
- Production-safe (hides sensitive info in prod)

### Manual Usage
You can also use the error boundary standalone:

```typescript
import { ThemeErrorBoundary } from '@ui/theme'

<ThemeErrorBoundary>
    <YourComponent />
</ThemeErrorBoundary>
```

---

## Type Safety

### Legacy Color Tokens
The old `theme.colors.*` API now has TypeScript support with runtime validation:

```typescript
// ⚠️ Deprecated but type-safe
const color = theme.colors?.primaryMain

// ✅ Recommended
const color = theme.vars.palette.primary.main
```

### What Happens
1. **In Development:**
   - Deprecation warning logged to console
   - Runtime check prevents undefined access
   - Error logged if property doesn't exist

2. **In Production:**
   - No warnings (performance optimization)
   - Runtime safety still active
   - Graceful fallback to undefined

---

## Validation Tools

### Development Validation
Theme validation runs automatically in development mode:

```typescript
// Runs on mount (dev only)
import { CssVarsThemeProvider } from '@ui/theme'

<CssVarsThemeProvider>
    {/* Validation runs here */}
</CssVarsThemeProvider>
```

### Manual Validation

#### Validate Theme Structure
```typescript
import { validateTheme } from '@ui/theme'
import { cssVarsTheme } from '@ui/theme'

const isValid = validateTheme(cssVarsTheme)
// Logs errors/warnings to console
// Returns: true if valid, false if errors
```

#### Validate CSS Variables
```typescript
import { validateCssVariables } from '@ui/theme'

const hasVars = validateCssVariables('theanswer')
// Checks if CSS variables are initialized in DOM
// Returns: true if present, false if missing
```

#### Validate Color Scheme
```typescript
import { validateColorScheme } from '@ui/theme'

const isCorrect = validateColorScheme('dark')
// Checks if current mode matches expected
// Returns: true if matches, false if mismatch
```

#### Full Health Check
```typescript
import { runThemeHealthCheck } from '@ui/theme'
import { cssVarsTheme } from '@ui/theme'

const health = runThemeHealthCheck(cssVarsTheme, 'theanswer')
console.log(health)
// Returns:
// {
//   isValid: boolean,
//   checks: {
//     themeStructure: boolean,
//     cssVariables: boolean,
//     colorScheme: boolean
//   }
// }
```

---

## Debugging Theme Issues

### Issue: Theme Not Switching

**Check CSS Variables:**
```typescript
import { validateCssVariables } from '@ui/theme'
validateCssVariables('theanswer')
```

**Check Color Scheme Sync:**
```typescript
import { validateColorScheme } from '@ui/theme'
validateColorScheme() // No argument checks current mode
```

**Inspect DOM:**
```javascript
// Open DevTools Console
getComputedStyle(document.documentElement)
    .getPropertyValue('--theanswer-palette-primary-main')
// Should return a color value
```

### Issue: Deprecation Warnings

**Problem:**
```
[Theme Deprecation] Accessing theme.colors.primaryMain is deprecated.
```

**Solution:**
```typescript
// Before (deprecated)
const color = theme.colors.primaryMain

// After (recommended)
const color = theme.vars.palette.primary.main
```

**Migration Guide:**
See `packages/ui/src/themes/MIGRATION.md` for complete migration patterns.

### Issue: Error Boundary Showing

**Steps:**
1. Check error details (expand "Technical Details")
2. Copy error message
3. Check browser console for additional context
4. Try "Reset Theme Settings" button
5. If persists, clear browser cache and cookies

**Common Causes:**
- Corrupted localStorage
- Browser extension interference
- Incompatible cached theme data
- Invalid custom theme configuration

---

## Performance

### Development
- Validation: ~5-10ms on mount
- Deprecation warnings: ~1ms per access
- Zero render performance impact

### Production
- Validation: Disabled (tree-shaken)
- Deprecation warnings: Disabled
- Error boundary: <1ms overhead
- Zero cost when no errors occur

---

## Integration Examples

### Basic App Setup
```typescript
import { CssVarsThemeProvider } from '@ui/theme'

function App() {
    return (
        <CssVarsThemeProvider>
            <YourApp />
        </CssVarsThemeProvider>
    )
}
```

### With Validation in Dev
```typescript
import { CssVarsThemeProvider, runThemeHealthCheck } from '@ui/theme'
import { cssVarsTheme } from '@ui/theme'
import { useEffect } from 'react'

function App() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            runThemeHealthCheck(cssVarsTheme, 'theanswer')
        }
    }, [])

    return (
        <CssVarsThemeProvider>
            <YourApp />
        </CssVarsThemeProvider>
    )
}
```

### With Custom Error Boundary
```typescript
import { ThemeErrorBoundary, CssVarsThemeProvider } from '@ui/theme'

function App() {
    return (
        <ThemeErrorBoundary>
            <CssVarsThemeProvider>
                <YourApp />
            </CssVarsThemeProvider>
        </ThemeErrorBoundary>
    )
}
```

### Standalone Error Boundary
```typescript
import { ThemeErrorBoundary } from '@ui/theme'

// Protect specific component
function FeatureSection() {
    return (
        <ThemeErrorBoundary>
            <ComplexThemeAwareComponent />
        </ThemeErrorBoundary>
    )
}
```

---

## TypeScript Types

### Legacy Color Token
```typescript
interface LegacyColorToken {
    [key: string]: string | LegacyColorToken | (() => string)
}
```

### Theme Augmentation
```typescript
declare module '@mui/material/styles' {
    interface Theme {
        colors?: LegacyColorToken // Optional for backward compat
    }
}
```

### Validation Result
```typescript
interface ValidationResult {
    isValid: boolean
    checks: {
        themeStructure: boolean
        cssVariables: boolean
        colorScheme: boolean
    }
}
```

---

## Best Practices

### DO ✅
- Use `theme.vars.palette.*` for dynamic theming
- Enable validation in development
- Check console for deprecation warnings
- Use error boundaries for theme-dependent components
- Test theme switching in both modes
- Validate custom themes before use

### DON'T ❌
- Access `theme.colors.*` in new code
- Ignore deprecation warnings
- Disable validation in development
- Skip testing theme error states
- Hardcode colors instead of using theme
- Assume theme is always valid

---

## Migration Path

### Step 1: Find Legacy Usage
```bash
# Search for theme.colors usage
grep -r "theme\.colors" src/
```

### Step 2: Update to CSS Variables
```typescript
// Before
const bg = theme.colors.paper
const primary = theme.colors.primaryMain

// After
const bg = theme.vars.palette.background.paper
const primary = theme.vars.palette.primary.main
```

### Step 3: Test
```typescript
// Add validation
import { runThemeHealthCheck } from '@ui/theme'
runThemeHealthCheck(cssVarsTheme)
```

### Step 4: Verify
- Check console for warnings
- Toggle theme light/dark
- Verify CSS variables in DevTools
- Test error boundary (simulate error)

---

## FAQ

**Q: Why do I see deprecation warnings?**
A: You're using `theme.colors.*` which is deprecated. Migrate to `theme.vars.palette.*`

**Q: Will the app crash if theme fails?**
A: No, the error boundary will show a fallback UI with recovery options.

**Q: How do I debug theme issues?**
A: Use `runThemeHealthCheck()` to get a full diagnostic report.

**Q: Does this affect performance?**
A: No impact in production. Minimal impact in development (<10ms on mount).

**Q: Can I disable validation?**
A: It's automatically disabled in production. Don't disable in development.

**Q: What happens to legacy code?**
A: It continues to work with deprecation warnings. Migrate gradually.

---

## Support

For more information:
- Theme Migration: `packages/ui/src/themes/MIGRATION.md`
- Full Implementation: `/THEME_SAFETY_IMPLEMENTATION.md`
- CSS Variables Theme: `packages-answers/ui/src/theme/README.md`

For issues:
- Check console for detailed error messages
- Run `runThemeHealthCheck()` for diagnostics
- Review error boundary fallback UI
- Contact team if issue persists
