# Theme Colors Migration Guide

## Overview

The theme system has been migrated from static color tokens (`theme.colors.*`) to CSS Variables (`theme.vars.palette.*`). This provides instant theme switching, SSR support, and better performance.

**Legacy approach:** `theme.colors.*` is now deprecated but still works for backward compatibility.

**New approach:** Use `theme.palette.*` or `theme.vars.palette.*` (recommended).

## Why Migrate?

1. **Performance**: CSS Variables enable instant theme switching (<10ms vs 120-250ms)
2. **SSR**: Zero Flash of Unstyled Content (FOUC) on server-side rendering
3. **Dynamic**: Theme changes propagate automatically without component re-renders
4. **Future-proof**: Aligned with MUI's CSS Variables architecture

## Migration Patterns

### Background Colors

```javascript
// ❌ Old (deprecated)
backgroundColor: theme.colors.paper

// ✅ New (recommended)
backgroundColor: theme.vars.palette.background.paper

// ✅ Alternative (static)
backgroundColor: theme.palette.background.paper
```

### Primary Colors

```javascript
// ❌ Old
color: theme.colors.primaryMain
backgroundColor: theme.colors.primaryLight
borderColor: theme.colors.primaryDark

// ✅ New
color: theme.vars.palette.primary.main
backgroundColor: theme.vars.palette.primary.light
borderColor: theme.vars.palette.primary.dark
```

### Secondary Colors

```javascript
// ❌ Old
color: theme.colors.secondaryMain
backgroundColor: theme.colors.secondary200

// ✅ New
color: theme.vars.palette.secondary.main
backgroundColor: theme.vars.palette.secondary.light
```

### Grey Scale

```javascript
// ❌ Old
color: theme.colors.grey500
backgroundColor: theme.colors.grey100
borderColor: theme.colors.grey300

// ✅ New
color: theme.palette.grey[500]
backgroundColor: theme.palette.grey[100]
borderColor: theme.palette.grey[300]

// ✅ Alternative (CSS vars - recommended for dynamic theming)
// Note: Grey doesn't generate CSS variables by default in MUI
color: theme.palette.grey[500]
```

### Status Colors

```javascript
// ❌ Old
color: theme.colors.successMain
backgroundColor: theme.colors.errorLight
borderColor: theme.colors.warningDark

// ✅ New
color: theme.vars.palette.success.main
backgroundColor: theme.vars.palette.error.light
borderColor: theme.vars.palette.warning.dark
```

### Text Colors

```javascript
// ❌ Old
color: theme.colors.darkTextPrimary
color: theme.colors.darkTextSecondary

// ✅ New
color: theme.vars.palette.text.primary
color: theme.vars.palette.text.secondary
```

### Dark Theme Specific

```javascript
// ❌ Old
backgroundColor: theme.colors.darkPaper
backgroundColor: theme.colors.darkLevel1
color: theme.colors.darkTextTitle

// ✅ New (theme automatically switches based on mode)
backgroundColor: theme.vars.palette.background.paper
backgroundColor: theme.vars.palette.background.default
color: theme.vars.palette.text.primary
```

## Complete Legacy to New Mapping

| Legacy (`theme.colors.*`)      | New (`theme.palette.*` or `theme.vars.palette.*`) |
|--------------------------------|---------------------------------------------------|
| `paper`                        | `background.paper`                                |
| `primaryLight`                 | `primary.light`                                   |
| `primaryMain`                  | `primary.main`                                    |
| `primaryDark`                  | `primary.dark`                                    |
| `primary200`                   | `primary.light`                                   |
| `primary800`                   | `primary.dark`                                    |
| `secondaryLight`               | `secondary.light`                                 |
| `secondaryMain`                | `secondary.main`                                  |
| `secondaryDark`                | `secondary.dark`                                  |
| `secondary200`                 | `secondary.light`                                 |
| `secondary800`                 | `secondary.dark`                                  |
| `grey50`                       | `grey[50]`                                        |
| `grey100`                      | `grey[100]`                                       |
| `grey200`                      | `grey[200]`                                       |
| `grey300`                      | `grey[300]`                                       |
| `grey500`                      | `grey[500]`                                       |
| `grey600`                      | `grey[600]`                                       |
| `grey700`                      | `grey[700]`                                       |
| `grey900`                      | `grey[900]`                                       |
| `successLight`                 | `success.light`                                   |
| `successMain`                  | `success.main`                                    |
| `successDark`                  | `success.dark`                                    |
| `errorLight`                   | `error.light`                                     |
| `errorMain`                    | `error.main`                                      |
| `errorDark`                    | `error.dark`                                      |
| `warningLight`                 | `warning.light`                                   |
| `warningMain`                  | `warning.main`                                    |
| `warningDark`                  | `warning.dark`                                    |
| `infoLight`                    | `info.light`                                      |
| `infoMain`                     | `info.main`                                       |
| `infoDark`                     | `info.dark`                                       |
| `darkPaper`                    | `background.paper` (auto-switches)                |
| `darkBackground`               | `background.default` (auto-switches)              |
| `darkTextPrimary`              | `text.primary` (auto-switches)                    |
| `darkTextSecondary`            | `text.secondary` (auto-switches)                  |

## Real-World Examples

### Example 1: Button Styling

```javascript
// ❌ Old
const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.colors.primaryMain,
  color: theme.colors.paper,
  '&:hover': {
    backgroundColor: theme.colors.primaryDark
  }
}))

// ✅ New
const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.common.white,
  '&:hover': {
    backgroundColor: theme.vars.palette.primary.dark
  }
}))
```

### Example 2: Card Component

```javascript
// ❌ Old
const CardWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.paper,
  borderColor: theme.colors.grey300,
  color: theme.colors.darkTextPrimary
}))

// ✅ New
const CardWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  borderColor: theme.palette.grey[300],
  color: theme.vars.palette.text.primary
}))
```

### Example 3: Conditional Dark Mode Styling

```javascript
// ❌ Old (manually checking mode)
const Component = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.colors.darkPaper
    : theme.colors.paper
}))

// ✅ New (automatic via CSS vars)
const Component = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper
  // Automatically uses dark value in dark mode!
}))
```

### Example 4: Icon Colors

```javascript
// ❌ Old
<IconButton sx={{ color: theme.colors.grey500 }}>
  <Icon />
</IconButton>

// ✅ New
<IconButton sx={{ color: theme.palette.grey[500] }}>
  <Icon />
</IconButton>

// ✅ Better (semantic color)
<IconButton sx={{ color: theme.vars.palette.text.secondary }}>
  <Icon />
</IconButton>
```

## Migration Strategy

### Phase 1: Backward Compatibility (Current)
- `theme.colors.*` still works (proxied with deprecation warnings)
- No immediate breaking changes
- Development mode shows warnings to guide migration

### Phase 2: Gradual Migration (Recommended)
1. Update new components to use `theme.vars.palette.*`
2. Update modified components when making changes
3. Use deprecation warnings to track remaining usage

### Phase 3: Complete Migration (Future)
- Remove `theme.colors.*` support
- All components use CSS Variables
- Clean up legacy code

## How to Check for Usage

### Find all usages in your code:
```bash
# Search for theme.colors usage
grep -r "theme\.colors\." packages/ui/src --include="*.js" --include="*.jsx"

# Search for specific color tokens
grep -r "theme\.colors\.primaryMain" packages/ui/src
```

### Development warnings:
In development mode, accessing `theme.colors.*` will log:
```
[Theme Deprecation] Accessing theme.colors.primaryMain is deprecated.
Migration:
  - For palette colors: Use theme.palette.* (e.g., theme.palette.primary.main)
  - For CSS variables: Use theme.vars.palette.* (recommended for dynamic theming)
  - See packages/ui/src/themes/MIGRATION.md for full guide
```

## Benefits After Migration

### Performance
```
Theme Toggle Time:
❌ Old: 120-250ms (Redux state change + re-render)
✅ New: <10ms (CSS variable update)
```

### Bundle Size
```
❌ Old: Includes all color tokens in JS bundle
✅ New: Colors in CSS (better caching, smaller JS)
```

### Developer Experience
```javascript
// ✅ Simpler conditional logic
const MyComponent = styled(Box)(({ theme }) => ({
  // No need for ternary operators!
  backgroundColor: theme.vars.palette.background.paper,

  // Automatically adjusts for dark/light mode
  color: theme.vars.palette.text.primary
}))
```

## FAQ

**Q: Do I need to migrate all components immediately?**
A: No, backward compatibility is maintained. Migrate gradually as you work on components.

**Q: What's the difference between `theme.palette.*` and `theme.vars.palette.*`?**
A:
- `theme.palette.*` - Returns the current theme's color value (static at render time)
- `theme.vars.palette.*` - Returns a CSS variable reference (dynamic, updates automatically)

**Q: Why use CSS variables over static palette?**
A: CSS variables enable instant theme switching without component re-renders, better SSR support, and future-proof architecture.

**Q: Can I mix old and new approaches?**
A: Yes, but it's not recommended. Stick to one approach per component for consistency.

**Q: How do I handle grey colors?**
A: Use `theme.palette.grey[500]` syntax. Grey doesn't generate CSS variables by default in MUI.

**Q: What if a component breaks after migration?**
A: Check the mapping table above. Most issues are due to nested property access (e.g., using `dark` variant where it should be `main`).

## Need Help?

- Check console warnings in development mode
- Review the mapping table above
- See real-world examples in this guide
- Refer to MUI CSS Variables documentation: https://mui.com/material-ui/experimental-api/css-variables/

## Related Files

- `/packages/ui/src/themes/legacyColors.js` - Legacy color token definitions
- `/packages/ui/src/themes/index.js` - Theme wrapper with backward compatibility
- `/packages-answers/ui/src/theme/cssVarsTheme.tsx` - New CSS Variables theme
- `/packages-answers/ui/src/theme/tokens/colors.ts` - Color token definitions

---

## ✅ Migration Complete

The theme migration to CSS Variables is now complete. All components have been updated to use the new theme system.

### What Changed
- ❌ Removed: `theme.customization.isDarkMode` (use `useThemeMode()` hook instead)
- ❌ Removed: `theme.darkTextPrimary` (use `theme.palette.text.primary`)
- ❌ Removed: `theme.colors.*` (use `theme.palette.*`)
- ✅ Added: `useThemeMode()` hook for theme state
- ✅ Added: CSS Variables for instant theme switching
- ✅ Added: Automatic localStorage migration

### For Component Authors

When creating new components:

```typescript
// ✅ DO: Use CSS Variables theme
import { useThemeMode } from '@ui/theme/cssVarsTheme'

const { mode } = useThemeMode()
const isDark = mode === 'dark'

// ✅ DO: Use standard palette
color={theme.palette.text.primary}

// ❌ DON'T: Use legacy properties
color={theme.darkTextPrimary}  // Doesn't exist
if (theme.customization?.isDarkMode) { ... }  // Always undefined
```

### For Styled Components

Hooks cannot be used in styled components. Use `theme.palette.mode` instead:

```typescript
const StyledComponent = styled(Box)(({ theme }) => ({
    // ✅ DO: Access mode from palette
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',

    // ✅ BETTER: Use palette colors that adapt automatically
    color: theme.palette.text.primary
}))
```

### Testing Your Component

1. Test in both light and dark modes
2. Ensure text is readable (check contrast)
3. Ensure interactive elements are visible
4. Test theme toggle (should update instantly)

### Common Mistakes to Avoid

❌ **Don't** use hooks in styled components:
```typescript
const StyledBox = styled(Box)(({ theme }) => {
    const { mode } = useThemeMode()  // ❌ Error
    return { ... }
})
```

✅ **Do** use `theme.palette.mode`:
```typescript
const StyledBox = styled(Box)(({ theme }) => ({
    color: theme.palette.mode === 'dark' ? '#fff' : '#000'  // ✅
}))
```

❌ **Don't** access customization from Redux:
```typescript
const customization = useSelector(state => state.customization)
const isDark = customization?.isDarkMode  // ❌ Always undefined
```

✅ **Do** use the `useThemeMode()` hook:
```typescript
const { mode } = useThemeMode()
const isDark = mode === 'dark'  // ✅
```

### Migration History

**Completed Phases:**
- ✅ Phase 1: Fixed 16 component files with broken theme properties
- ✅ Phase 2: Added localStorage migration to all entry points
- ✅ Phase 3: Consolidated inline theme scripts
- ✅ Phase 4: Standardized configuration across all providers
- ✅ Phase 5: Visual regression testing
- ✅ Phase 6: Documentation and cleanup

---

## Naming Conventions

### Theme Mode Access

The theme system uses consistent naming for accessing and checking the current theme mode:

**✅ Recommended Patterns:**

```typescript
// In components (hooks allowed)
import { useThemeMode } from '@ui/theme/cssVarsTheme'

const { mode } = useThemeMode()
const isDarkMode = mode === 'dark'  // Only when boolean is needed

// In styled components (hooks NOT allowed)
const StyledBox = styled(Box)(({ theme }) => ({
  // Access mode from palette
  const mode = theme.palette.mode
  color: mode === 'dark' ? '#fff' : '#000',

  // Better: Use palette colors that adapt automatically
  color: theme.palette.text.primary
}))
```

**❌ Avoid These Patterns:**

```typescript
// ❌ Don't use legacy Redux state
const customization = useSelector(state => state.customization)
const isDark = customization?.isDarkMode  // Always undefined

// ❌ Don't use inconsistent variable names
const isDark = theme.palette.mode === 'dark'     // Inconsistent
const darkMode = theme.palette.mode === 'dark'   // Inconsistent
const isLight = theme.palette.mode === 'light'   // Inconsistent

// ✅ Consistent approach
const mode = theme.palette.mode
const isDarkMode = mode === 'dark'  // When boolean needed
const isLightMode = mode === 'light'  // When boolean needed
```

### Component Styling

**✅ Use CSS Variables (Recommended):**

```typescript
const StyledComponent = styled(Box)(({ theme }) => ({
  // ✅ CSS variables - automatic theme switching
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary,
  borderColor: theme.vars.palette.divider
}))
```

**✅ Use applyStyles for Conditional Styles:**

```typescript
const StyledComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.grey[900]
  })
}))
```

**❌ Avoid Manual Mode Checks:**

```typescript
// ❌ Don't do this (verbose and error-prone)
const StyledComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.grey[900]
    : theme.palette.grey[50]
}))

// ✅ Do this instead (cleaner)
const StyledComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper
}))
```

### Variable Naming Standards

When you need to store theme mode in a variable:

```typescript
// ✅ Preferred
const mode = theme.palette.mode
const isDarkMode = mode === 'dark'

// ❌ Avoid
const isDark = ...
const darkMode = ...
const colorScheme = ...
const theme = ...  // Don't shadow 'theme'
```

### Event Handling

When dispatching theme change events:

```typescript
// ✅ Consistent event detail structure
window.dispatchEvent(
  new CustomEvent('theme-mode-change', {
    detail: { isDarkMode: newMode === 'dark' }
  })
)

// The event uses 'isDarkMode' for backward compatibility
// but your component code should use 'mode'
```

---

## Deprecation Timeline

### Component Files

| Component | Deprecated In | Remove In | Alternative |
|-----------|--------------|-----------|-------------|
| `packages/ui/src/themes/palette.js` | v3.0.0 | v4.0.0 | `theme.vars.palette.*` or `theme.palette.*` |
| `packages/ui/src/themes/compStyleOverride.js` | v3.0.0 | v4.0.0 | `packages-answers/ui/src/theme/components/muiOverridesCssVars.ts` |
| `packages/ui/src/themes/typography.js` | v3.0.0 | v4.0.0 | `theme.typography.*` |

### Theme Properties

| Property | Deprecated In | Remove In | Alternative |
|----------|--------------|-----------|-------------|
| `theme.customization.isDarkMode` | v3.0.0 | v4.0.0 | `useThemeMode()` hook → `mode === 'dark'` |
| `theme.colors.*` | v3.0.0 | v4.0.0 | `theme.vars.palette.*` or `theme.palette.*` |
| `theme.darkTextPrimary` | v3.0.0 | v4.0.0 | `theme.palette.text.primary` |
| `theme.darkLevel1` | v3.0.0 | v4.0.0 | `theme.palette.background.paper` |

### Storage Keys

| Key | Deprecated In | Remove In | Alternative |
|-----|--------------|-----------|-------------|
| `isDarkMode` (localStorage) | v3.0.0 | v4.0.0 | `mode` (auto-migrated) |

### Migration Support

**Current (v3.x):**
- ✅ Deprecated APIs still work (with warnings)
- ✅ Automatic localStorage migration
- ✅ Deprecation warnings in development mode
- ✅ Clear migration paths documented

**Future (v4.0):**
- ❌ Deprecated files removed
- ❌ Legacy properties removed
- ✅ CSS Variables theme only
- ✅ Cleaner, faster codebase

### How to Check Your Code

**Find deprecated API usage:**

```bash
# Search for deprecated function calls
grep -r "themePalette\|componentStyleOverrides\|themeTypography" packages/

# Search for deprecated properties
grep -r "theme\.customization\.isDarkMode\|theme\.colors\.\|theme\.darkTextPrimary" packages/

# Search for deprecated storage key
grep -r "isDarkMode.*localStorage" packages/
```

**Development warnings:**

When you use deprecated APIs in development mode, you'll see warnings like:

```
[DEPRECATED] themePalette() from packages/ui/src/themes/palette.js is deprecated.
Use theme.vars.palette.* (recommended) or theme.palette.* instead.
Will be removed in v4.0.0.
  For CSS variables: theme.vars.palette.primary.main
  For static colors: theme.palette.primary.main
  See packages/ui/src/themes/MIGRATION.md for details.
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using Legacy Redux State

```typescript
// ❌ Wrong
const customization = useSelector(state => state.customization)
const isDark = customization?.isDarkMode  // Always undefined
```

```typescript
// ✅ Right
import { useThemeMode } from '@ui/theme/cssVarsTheme'

const { mode } = useThemeMode()
const isDarkMode = mode === 'dark'
```

### ❌ Mistake 2: Inconsistent Variable Names

```typescript
// ❌ Inconsistent
const isDark = theme.palette.mode === 'dark'
const darkMode = theme.palette.mode === 'dark'
const colorScheme = theme.palette.mode
```

```typescript
// ✅ Consistent
const mode = theme.palette.mode
const isDarkMode = mode === 'dark'
const isLightMode = mode === 'light'
```

### ❌ Mistake 3: Using Hooks in Styled Components

```typescript
// ❌ Wrong (hooks can't be used in styled components)
const StyledBox = styled(Box)(({ theme }) => {
  const { mode } = useThemeMode()  // ERROR!
  return { ... }
})
```

```typescript
// ✅ Right (access mode from theme)
const StyledBox = styled(Box)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#000'
}))

// ✅ Better (use palette colors)
const StyledBox = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary
}))
```

### ❌ Mistake 4: Manual Theme Checks Instead of CSS Variables

```typescript
// ❌ Verbose and error-prone
const MyComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.grey[900]
    : theme.palette.grey[50],
  color: theme.palette.mode === 'dark'
    ? '#fff'
    : '#000'
}))
```

```typescript
// ✅ Clean and automatic
const MyComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary
}))
```
