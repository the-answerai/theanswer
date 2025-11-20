# Theme API Reference

Complete API documentation for TheAnswer unified glassmorphism theme system.

## Table of Contents

- [Theme Structure](#theme-structure)
  - [Palette](#palette)
  - [Typography](#typography)
  - [Spacing](#spacing)
  - [Breakpoints](#breakpoints)
  - [Transitions](#transitions)
  - [Glassmorphism](#glassmorphism)
- [Hooks](#hooks)
  - [useThemeMode](#usethememode)
  - [useReducedMotion](#usereducedmotion)
  - [useTransition](#usetransition)
- [Utilities](#utilities)
  - [Alpha Utilities](#alpha-utilities)
  - [Blur Optimization](#blur-optimization)
- [TypeScript Support](#typescript-support)

---

## Theme Structure

The theme uses MUI CSS Variables (experimental API for v5.15.0) to enable instant theme switching with zero FOUC.

### Accessing Theme Values

```tsx
import { useTheme } from '@mui/material/styles'

function MyComponent() {
  const theme = useTheme()

  // Access colors
  const primaryColor = theme.vars.palette.primary.main
  const primaryAlpha = theme.vars.palette.primary.alpha30

  // Access glassmorphism
  const glassStyle = theme.vars.palette.glass.glassSecondary
}
```

### Palette

All colors include alpha variants at 10%, 20%, 30%, 40%, and 50% opacity.

#### Primary Colors

```tsx
theme.vars.palette.primary = {
  main: string        // Base color (#0f172a light, #ffffff dark)
  light: string       // Lighter variant
  dark: string        // Darker variant
  alpha10: string     // 10% opacity
  alpha20: string     // 20% opacity
  alpha30: string     // 30% opacity
  alpha40: string     // 40% opacity
  alpha50: string     // 50% opacity
  gradient: string    // Gradient for special effects
}
```

**Usage:**

```tsx
// Solid color
<Box sx={{ bgcolor: theme => theme.vars.palette.primary.main }}>

// Semi-transparent
<Box sx={{ bgcolor: theme => theme.vars.palette.primary.alpha20 }}>

// Gradient background
<Box sx={{ background: theme => theme.vars.palette.primary.gradient }}>
```

#### Secondary Colors

Same structure as primary:

```tsx
theme.vars.palette.secondary = {
  main: string        // #ff6e40 light, #ff9e80 dark
  light: string
  dark: string
  alpha10: string
  alpha20: string
  alpha30: string
  alpha40: string
  alpha50: string
}
```

#### Status Colors

Success, warning, error, and info colors with alpha variants:

```tsx
theme.vars.palette.success = {
  main: '#4caf50'
  light: '#81c784'
  dark: '#388e3c'
  alpha10: string
  alpha20: string
  alpha30: string
  alpha40: string
  alpha50: string
}

// Same structure for warning, error, info
theme.vars.palette.warning
theme.vars.palette.error
theme.vars.palette.info
```

**Usage:**

```tsx
// Success badge with transparency
<Chip
  label="Success"
  sx={{
    bgcolor: theme => theme.vars.palette.success.alpha20,
    color: theme => theme.vars.palette.success.dark,
    border: `1px solid ${theme => theme.vars.palette.success.main}`
  }}
/>
```

#### Background & Text

```tsx
theme.vars.palette.background = {
  default: string     // '#ffffff' light, '#0b0b0b' dark
  paper: string       // '#ffffff' light, '#161616' dark
}

theme.vars.palette.text = {
  primary: string     // Main text color
  secondary: string   // Secondary text color
  disabled: string    // Disabled text color
  onGlass: string     // Text color for glass surfaces (always white)
}

theme.vars.palette.divider = string  // Divider color with opacity
```

#### Action States

```tsx
theme.vars.palette.action = {
  hover: string      // Background color on hover
  selected: string   // Background color when selected
  disabled: string   // Opacity for disabled states
}
```

**Usage:**

```tsx
<Button
  sx={{
    '&:hover': {
      bgcolor: theme => theme.vars.palette.action.hover
    },
    '&.Mui-selected': {
      bgcolor: theme => theme.vars.palette.action.selected
    }
  }}
>
```

### Typography

Font sizes and weights following a harmonious scale:

```tsx
theme.typography = {
  fontFamily: 'var(--font-poppins), system-ui, -apple-system, sans-serif',

  // Headings
  h1: {
    fontSize: '2.5rem',    // 40px
    fontWeight: 700,
    lineHeight: 1.2
  },
  h2: {
    fontSize: '2rem',      // 32px
    fontWeight: 700,
    lineHeight: 1.3
  },
  h3: {
    fontSize: '1.75rem',   // 28px
    fontWeight: 600,
    lineHeight: 1.3
  },
  h4: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 600,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 600,
    lineHeight: 1.4
  },
  h6: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 600,
    lineHeight: 1.4
  },

  // Body text
  body1: {
    fontSize: '1rem',      // 16px
    lineHeight: 1.5
  },
  body2: {
    fontSize: '0.875rem',  // 14px
    lineHeight: 1.5
  },

  button: {
    textTransform: 'none'  // Disable uppercase
  }
}
```

**Usage:**

```tsx
import { Typography } from '@mui/material'

<Typography variant="h1">Heading 1</Typography>
<Typography variant="body1">Regular text</Typography>
<Typography variant="body2" color="text.secondary">
  Secondary text
</Typography>
```

### Spacing

MUI spacing uses a base unit of 8px:

```tsx
theme.spacing(0)   // 0px
theme.spacing(1)   // 8px
theme.spacing(2)   // 16px
theme.spacing(3)   // 24px
theme.spacing(4)   // 32px
theme.spacing(5)   // 40px
theme.spacing(6)   // 48px
theme.spacing(8)   // 64px
theme.spacing(10)  // 80px
```

**Usage:**

```tsx
<Box sx={{
  p: 2,              // padding: 16px
  mb: 3,             // margin-bottom: 24px
  gap: 1             // gap: 8px
}}>
```

### Breakpoints

Responsive breakpoints with custom `xxl` breakpoint:

```tsx
theme.breakpoints.values = {
  xs: 0,      // Mobile
  sm: 600,    // Mobile landscape
  md: 900,    // Tablet
  lg: 1200,   // Desktop
  xl: 1536,   // Large desktop
  xxl: 1920   // Extra large (custom)
}
```

**Usage:**

```tsx
<Box sx={{
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: '50%'
  },
  [theme.breakpoints.up('xxl')]: {
    width: '33.33%'
  }
}}>
```

### Transitions

Standard transition timings and easing functions:

```tsx
theme.transitions = {
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }
}
```

**Usage:**

```tsx
<Box sx={{
  transition: theme =>
    theme.transitions.create(['opacity', 'transform'], {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut
    })
}}>
```

### Glassmorphism

Pre-configured glass effect variants for consistent styling:

```tsx
theme.vars.palette.glass = {
  glassPrimary: GlassStyle     // Headers, navigation (vibrant)
  glassSecondary: GlassStyle   // Cards, panels (subtle)
  glassSubtle: GlassStyle      // Buttons, inputs (minimal)
  glassHover: GlassStyle       // Hover state
  glassSuccess: GlassStyle     // Success states
  glassWarning: GlassStyle     // Warning states
  glassError: GlassStyle       // Error states
  transition: string           // Standard transition
}
```

Each `GlassStyle` includes:

```tsx
interface GlassStyle {
  background: string           // Background with opacity
  backdropFilter: string       // Blur effect
  WebkitBackdropFilter: string // Safari support
  border: string              // Border with opacity
  boxShadow: string           // Depth shadow
  color?: string              // Text color (for glassPrimary)
}
```

**Usage:**

```tsx
// Primary glass for headers
<AppBar sx={theme => ({
  ...theme.vars.palette.glass.glassPrimary,
  transition: theme.vars.palette.glass.transition
})}>

// Secondary glass for cards
<Card sx={theme => ({
  ...theme.vars.palette.glass.glassSecondary,
  '&:hover': theme.vars.palette.glass.glassHover
})}>

// Subtle glass for buttons
<Button sx={theme => ({
  ...theme.vars.palette.glass.glassSubtle
})}>

// Status variants
<Alert sx={theme => ({
  ...theme.vars.palette.glass.glassSuccess
})}>
```

---

## Hooks

### useThemeMode

Access and control the current theme mode (light/dark).

**Returns:**

```tsx
{
  mode: 'light' | 'dark',
  setMode: (mode: 'light' | 'dark') => void,
  toggleMode: () => void,
  systemMode: 'light' | 'dark' | undefined  // System preference
}
```

**Usage:**

```tsx
import { useThemeMode } from '@ui/theme/cssVarsTheme'

function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode()

  return (
    <IconButton onClick={toggleMode}>
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  )
}

// Set specific mode
function ThemeSelector() {
  const { mode, setMode } = useThemeMode()

  return (
    <Select value={mode} onChange={e => setMode(e.target.value)}>
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
    </Select>
  )
}

// Show system preference
function SystemModeInfo() {
  const { systemMode } = useThemeMode()

  return <Typography>System prefers: {systemMode}</Typography>
}
```

**Notes:**
- Changes persist to localStorage automatically
- Triggers custom `themeChange` event for backward compatibility
- Zero FOUC on SSR

### useReducedMotion

Detects if user prefers reduced motion for accessibility.

**Returns:** `boolean` - `true` if user prefers reduced motion

**Usage:**

```tsx
import { useReducedMotion } from '@ui/theme/hooks/useReducedMotion'

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <Box
      sx={{
        transition: prefersReducedMotion
          ? 'none'
          : 'all 0.3s ease',
        animation: prefersReducedMotion
          ? 'none'
          : 'fadeIn 0.5s ease'
      }}
    >
      Content
    </Box>
  )
}
```

**Notes:**
- Respects `prefers-reduced-motion` media query
- Updates automatically when system preference changes
- SSR-safe (returns `false` on server)

### useTransition

Combined hook for transitions with reduced motion support.

**Returns:**

```tsx
{
  prefersReducedMotion: boolean,
  transitions: TransitionConfig,
  transition: (props, options?) => string,
  animate: (animation: string) => string
}
```

**Usage:**

```tsx
import { useTransition } from '@ui/theme/hooks/useReducedMotion'

function AnimatedBox() {
  const { transition, animate } = useTransition()

  return (
    <Box
      sx={{
        // Create transition for specific properties
        transition: transition(['opacity', 'transform'], {
          duration: 300,
          easing: 'ease-in-out'
        }),

        // Apply animation with reduced motion support
        animation: animate('fadeIn 0.5s ease')
      }}
    >
      Content
    </Box>
  )
}

// Access full transition config
function CustomTransitions() {
  const { transitions, prefersReducedMotion } = useTransition()

  if (prefersReducedMotion) {
    return <StaticContent />
  }

  return (
    <Box sx={{
      transition: `opacity ${transitions.duration.standard}ms ${transitions.easing.easeInOut}`
    }}>
      Animated content
    </Box>
  )
}
```

---

## Utilities

### Alpha Utilities

Create and manipulate color transparency.

#### withAlpha

Generate alpha variants for a color.

**Signature:**

```tsx
withAlpha(hex: string): Partial<PaletteColorOptions>
```

**Returns:**

```tsx
{
  main: string,      // Original hex color
  alpha10: string,   // rgba(..., 0.10)
  alpha20: string,   // rgba(..., 0.20)
  alpha30: string,   // rgba(..., 0.30)
  alpha40: string,   // rgba(..., 0.40)
  alpha50: string    // rgba(..., 0.50)
}
```

**Usage:**

```tsx
import { withAlpha } from '@ui/theme/utils/alpha'

// In theme configuration
const primaryColor = withAlpha('#2563eb')

console.log(primaryColor)
// {
//   main: '#2563eb',
//   alpha10: 'rgba(37, 99, 235, 0.10)',
//   alpha20: 'rgba(37, 99, 235, 0.20)',
//   alpha30: 'rgba(37, 99, 235, 0.30)',
//   alpha40: 'rgba(37, 99, 235, 0.40)',
//   alpha50: 'rgba(37, 99, 235, 0.50)'
// }

// Use in components
<Box sx={{
  bgcolor: primaryColor.main,
  borderColor: primaryColor.alpha30
}}>
```

#### alphaVar

Dynamically adjust color opacity using CSS color-mix.

**Signature:**

```tsx
alphaVar(
  cssVar: string,
  opacity: number,
  fallback?: string
): string
```

**Parameters:**
- `cssVar` - CSS custom property (e.g., `'--color-primary'`)
- `opacity` - Opacity value between 0 and 1
- `fallback` - Fallback color for browsers without color-mix support

**Usage:**

```tsx
import { alphaVar } from '@ui/theme/utils/alpha'

// Dynamic opacity with modern CSS
<Box sx={{
  bgcolor: alphaVar('--theanswer-palette-primary-main', 0.5, 'rgba(37, 99, 235, 0.5)')
}}>

// Use with theme variables
<Box sx={theme => ({
  bgcolor: alphaVar(
    theme.vars.palette.primary.main,
    0.3,
    theme.vars.palette.primary.alpha30
  )
})}>
```

**Notes:**
- Uses `color-mix()` in modern browsers
- Falls back to provided color in older browsers
- Enables dynamic opacity without pre-calculated values

#### hexToRgb

Convert hex color to RGB components.

**Signature:**

```tsx
hexToRgb(hex: string): { r: number, g: number, b: number }
```

**Usage:**

```tsx
import { hexToRgb } from '@ui/theme/utils/alpha'

const rgb = hexToRgb('#2563eb')
// { r: 37, g: 99, b: 235 }

// Create custom rgba
const customAlpha = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`
```

### Blur Optimization

Performance-optimized blur effects based on z-index.

#### getOptimalBlur

Get optimal blur value for a given z-index.

**Signature:**

```tsx
getOptimalBlur(zIndex: number): string
```

**Returns:**
- `'blur(8px)'` for z-index < 100 (backgrounds)
- `'blur(12px)'` for z-index < 1000 (cards)
- `'blur(16px)'` for z-index < 1300 (modals)
- `'blur(20px)'` for z-index >= 1300 (tooltips)

**Usage:**

```tsx
import { getOptimalBlur } from '@ui/theme/utils/optimizeBlur'

// Based on z-index
<Box sx={{
  backdropFilter: getOptimalBlur(50),  // 'blur(8px)'
  zIndex: 50
}}>

// Modal with strong blur
<Dialog sx={{
  '& .MuiBackdrop-root': {
    backdropFilter: getOptimalBlur(1300)  // 'blur(16px)'
  }
}}>
```

#### getOptimalBlurWithPrefix

Get blur with webkit prefix for cross-browser support.

**Signature:**

```tsx
getOptimalBlurWithPrefix(zIndex: number): {
  backdropFilter: string,
  WebkitBackdropFilter: string
}
```

**Usage:**

```tsx
import { getOptimalBlurWithPrefix } from '@ui/theme/utils/optimizeBlur'

<Box sx={theme => ({
  ...getOptimalBlurWithPrefix(theme.zIndex.modal),
  // Results in:
  // backdropFilter: 'blur(16px)',
  // WebkitBackdropFilter: 'blur(16px)'
})}>
```

#### getBlurForComponent

Get recommended blur for common component types.

**Signature:**

```tsx
getBlurForComponent(
  type: 'background' | 'card' | 'appBar' | 'drawer' | 'modal' | 'tooltip'
): string
```

**Usage:**

```tsx
import { getBlurForComponent } from '@ui/theme/utils/optimizeBlur'

<AppBar sx={{
  backdropFilter: getBlurForComponent('appBar')  // 'blur(12px)'
}}>

<Dialog sx={{
  '& .MuiBackdrop-root': {
    backdropFilter: getBlurForComponent('modal')  // 'blur(16px)'
  }
}}>

<Card sx={{
  backdropFilter: getBlurForComponent('card')  // 'blur(12px)'
}}>
```

#### Z_INDEX_REFERENCE

Reference values for common z-index levels:

```tsx
import { Z_INDEX_REFERENCE } from '@ui/theme/utils/optimizeBlur'

Z_INDEX_REFERENCE = {
  background: 0,
  content: 100,
  card: 200,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
}
```

---

## TypeScript Support

The theme is fully type-safe with complete IntelliSense support.

### Module Augmentation

The theme extends MUI's TypeScript definitions:

```tsx
// packages-answers/ui/src/theme/types/palette.d.ts
import '@mui/material/styles'

declare module '@mui/material/styles' {
  // Alpha variants on palette colors
  interface PaletteColor {
    alpha10?: string
    alpha20?: string
    alpha30?: string
    alpha40?: string
    alpha50?: string
  }

  interface SimplePaletteColorOptions {
    alpha10?: string
    alpha20?: string
    alpha30?: string
    alpha40?: string
    alpha50?: string
  }

  // Glassmorphism tokens
  interface Palette {
    glass: GlassTokens
  }

  interface PaletteOptions {
    glass?: GlassTokens
  }
}
```

### Autocomplete Examples

Full IntelliSense is available throughout:

```tsx
import { useTheme } from '@mui/material/styles'

function TypeSafeComponent() {
  const theme = useTheme()

  // Autocomplete for palette colors
  theme.vars.palette.primary.     // ← autocomplete shows all options
  //                  ├─ main
  //                  ├─ light
  //                  ├─ dark
  //                  ├─ alpha10
  //                  ├─ alpha20
  //                  └─ ...

  // Autocomplete for glass variants
  theme.vars.palette.glass.       // ← autocomplete shows variants
  //                  ├─ glassPrimary
  //                  ├─ glassSecondary
  //                  ├─ glassSubtle
  //                  └─ ...

  // Type-safe theme access
  const color: string = theme.vars.palette.primary.main  // ✓
  const alpha: string = theme.vars.palette.primary.alpha30  // ✓
  const glass: GlassStyle = theme.vars.palette.glass.glassPrimary  // ✓
}
```

### Generic Types

```tsx
import type { Theme } from '@mui/material/styles'
import type { GlassStyle, GlassTokens } from '@ui/theme/tokens/glassmorphism'
import type { PaletteColorOptions } from '@mui/material/styles'

// Use in component props
interface CardProps {
  theme: Theme
  glassVariant: keyof GlassTokens
}

// Type-safe color utilities
function createColorVariant(hex: string): PaletteColorOptions {
  return withAlpha(hex)
}
```

---

## Common Patterns

### Glassmorphic Card

```tsx
import { Card, CardContent, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

function GlassCard({ children }) {
  const theme = useTheme()

  return (
    <Card
      sx={{
        ...theme.vars.palette.glass.glassSecondary,
        transition: theme.vars.palette.glass.transition,
        '&:hover': {
          ...theme.vars.palette.glass.glassHover
        }
      }}
    >
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

### Theme-Aware Button

```tsx
import { Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'

function ThemedButton({ children, variant = 'primary', ...props }) {
  const theme = useTheme()

  return (
    <Button
      {...props}
      sx={{
        ...theme.vars.palette.glass.glassSubtle,
        color: theme.vars.palette[variant].main,
        borderColor: theme.vars.palette[variant].alpha30,
        '&:hover': {
          bgcolor: theme.vars.palette[variant].alpha10,
          borderColor: theme.vars.palette[variant].main
        }
      }}
    >
      {children}
    </Button>
  )
}
```

### Accessible Animation

```tsx
import { Box } from '@mui/material'
import { useTransition } from '@ui/theme/hooks/useReducedMotion'

function FadeInBox({ children }) {
  const { transition, animate } = useTransition()

  return (
    <Box
      sx={{
        transition: transition(['opacity', 'transform']),
        animation: animate('fadeIn 0.5s ease'),
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      {children}
    </Box>
  )
}
```

### Performance-Optimized Modal

```tsx
import { Dialog, DialogContent } from '@mui/material'
import { getOptimalBlurWithPrefix } from '@ui/theme/utils/optimizeBlur'

function OptimizedDialog({ open, onClose, children }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiBackdrop-root': {
          ...getOptimalBlurWithPrefix(1300),
          bgcolor: theme => theme.vars.palette.primary.alpha40
        }
      }}
    >
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}
```

---

## Migration from Old Theme

If migrating from the Redux-based theme:

### Before (Redux Theme)

```tsx
import { useSelector } from 'react-redux'

function OldComponent() {
  const customization = useSelector(state => state.customization)
  const isDark = customization.navType === 'dark'

  return (
    <Box sx={{
      bgcolor: isDark ? '#161616' : '#ffffff'
    }}>
  )
}
```

### After (CSS Variables Theme)

```tsx
import { useTheme } from '@mui/material/styles'

function NewComponent() {
  const theme = useTheme()

  return (
    <Box sx={{
      bgcolor: theme.vars.palette.background.paper
    }}>
  )
}
```

**Benefits:**
- Instant theme switching (<10ms vs 120-250ms)
- Zero FOUC on SSR
- No Redux dependency
- Type-safe with autocomplete
- Automatic CSS variable generation

---

## Browser Support

- **Modern browsers:** Full support with color-mix and CSS variables
- **Safari:** Webkit prefixes included for backdrop-filter
- **Older browsers:** Graceful degradation with fallback values
- **SSR:** Zero FOUC with proper hydration

---

## Performance Notes

1. **CSS Variables:** Theme changes update CSS vars directly, no React re-render
2. **Blur Optimization:** Use `getOptimalBlur()` to reduce GPU load on lower layers
3. **Reduced Motion:** Automatically respects user accessibility preferences
4. **Tree Shaking:** Unused theme tokens are removed in production builds
5. **Caching:** Theme is created once and reused across all components

---

## Related Documentation

- [Getting Started Guide](./getting-started.md) - Basic setup and usage
- [Migration Guide](./migration.md) - Migrating from old theme
- [Component Showcase](./showcase.md) - Visual examples of theme usage
- [Best Practices](./best-practices.md) - Recommended patterns
