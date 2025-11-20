# Theme System Examples

Production-ready React components demonstrating the CSS Variables theme system with glassmorphism design patterns.

## Available Examples

### 1. GlassCard (`glass-card.tsx`)

A glassmorphism-styled card component with smooth hover animations.

**Features:**
- Semi-transparent background with backdrop blur
- 3D hover transform effects
- Responsive sizing (mobile-first)
- Accessibility support (reduced motion, keyboard focus)
- Fully type-safe with TypeScript

**Usage:**
```tsx
import { GlassCard } from '@ui/theme/examples/glass-card'

<GlassCard
  title="Feature Card"
  description="This demonstrates glassmorphism effects"
>
  <Button variant="contained">Action</Button>
</GlassCard>
```

**Key Concepts:**
- Using `theme.vars.palette.glass.glassSecondary`
- Respecting `prefers-reduced-motion` for accessibility
- Implementing hover states with `sx` prop

---

### 2. ThemeToggle (`theme-toggle.tsx`)

Complete theme switcher implementation with full accessibility support.

**Features:**
- Instant theme switching via CSS Variables
- Automatic persistence to localStorage
- ARIA labels for screen readers
- Keyboard navigation support
- Animated icon transitions
- Tooltip for better UX
- Compact variant for tight spaces

**Usage:**
```tsx
import { ThemeToggle } from '@ui/theme/examples/theme-toggle'

// Full variant with tooltip
<ThemeToggle tooltipPlacement="left" />

// Compact variant
import { ThemeToggleCompact } from '@ui/theme/examples/theme-toggle'
<ThemeToggleCompact size="small" />
```

**Key Concepts:**
- Using `useThemeMode()` hook
- Implementing accessible buttons (ARIA, keyboard)
- Persisting theme preference across sessions

---

### 3. AlphaTransparencyShowcase (`alpha-transparency.tsx`)

Demonstrates two approaches to color transparency in the theme system.

**Features:**
- Pre-calculated alpha variants (10%, 20%, 30%, 40%, 50%)
- Dynamic alpha with `alphaVar()` utility
- Visual comparison with checkered backgrounds
- Browser compatibility fallbacks

**Components:**
- `PreCalculatedAlphaExample` - Shows theme alpha variants
- `DynamicAlphaExample` - Shows custom opacity with alphaVar()
- `AlphaTransparencyShowcase` - Combined demonstration

**Usage:**
```tsx
import { AlphaTransparencyShowcase } from '@ui/theme/examples/alpha-transparency'

<AlphaTransparencyShowcase />
```

**Pre-calculated Alpha:**
```tsx
const theme = useTheme()

<Box
  sx={{
    backgroundColor: theme.vars.palette.primary.alpha20 // 20% opacity
  }}
/>
```

**Dynamic Alpha:**
```tsx
import { alphaVar } from '@ui/theme/utils/alpha'

<Box
  sx={{
    backgroundColor: alphaVar(
      'var(--theanswer-palette-primary-main)',
      0.65, // 65% opacity
      'rgba(37, 99, 235, 0.65)' // Fallback
    )
  }}
/>
```

**Key Concepts:**
- When to use pre-calculated vs dynamic alpha
- Browser compatibility considerations
- Performance implications of each approach

---

## Running Examples Locally

### Option 1: Import in Your App

```tsx
// In any component
import { GlassCard } from '@ui/theme/examples/glass-card'
import { ThemeToggle } from '@ui/theme/examples/theme-toggle'
import { AlphaTransparencyShowcase } from '@ui/theme/examples/alpha-transparency'

function ExamplesPage() {
  return (
    <Stack spacing={4} p={3}>
      <ThemeToggle />

      <GlassCard
        title="Example Card"
        description="Glassmorphism with hover effects"
      />

      <AlphaTransparencyShowcase />
    </Stack>
  )
}
```

### Option 2: Create a Demo Page

Create `apps/web/app/theme-examples/page.tsx`:

```tsx
'use client'

import { Stack, Container, Typography } from '@mui/material'
import { GlassCard } from '@ui/theme/examples/glass-card'
import { ThemeToggle } from '@ui/theme/examples/theme-toggle'
import { AlphaTransparencyShowcase } from '@ui/theme/examples/alpha-transparency'

export default function ThemeExamplesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h3" fontWeight={700}>
            Theme System Examples
          </Typography>
          <ThemeToggle />
        </Stack>

        <GlassCard
          title="Glassmorphism Card"
          description="Hover over this card to see the 3D transform effect"
        />

        <AlphaTransparencyShowcase />
      </Stack>
    </Container>
  )
}
```

Then visit: `http://localhost:3000/theme-examples`

---

## Common Patterns

### Pattern 1: Glassmorphism Button

```tsx
import { Button, useTheme } from '@mui/material'

<Button
  sx={{
    ...theme.vars.palette.glass.glassSubtle,
    '&:hover': {
      ...theme.vars.palette.glass.glassHover
    }
  }}
>
  Glass Button
</Button>
```

### Pattern 2: Theme-Aware Component

```tsx
import { useThemeMode } from '@ui/theme'

function MyComponent() {
  const { mode } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Box sx={{ color: isDark ? 'white' : 'black' }}>
      Content
    </Box>
  )
}
```

### Pattern 3: Responsive Glass Effect

```tsx
<Card
  sx={{
    ...theme.vars.palette.glass.glassSecondary,
    p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
    maxWidth: { xs: '100%', sm: 600 } // Responsive width
  }}
/>
```

---

## TypeScript Support

All examples are fully typed with TypeScript:

```tsx
// Props are type-safe
<GlassCard
  title="string"           // ✓ Valid
  description="string"     // ✓ Valid
  title={123}              // ✗ Type error
/>

// useThemeMode returns typed values
const { mode } = useThemeMode()
// mode is 'light' | 'dark' (not string)
```

---

## Accessibility Features

All examples follow WCAG 2.1 AA guidelines:

1. **Keyboard Navigation:** All interactive elements are keyboard-accessible
2. **Screen Readers:** Proper ARIA labels and semantic HTML
3. **Reduced Motion:** Respects `prefers-reduced-motion` media query
4. **Focus Indicators:** Visible focus states for keyboard users
5. **Color Contrast:** WCAG AA compliant (4.5:1 for text)

---

## Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| CSS Variables | ✓ 49+ | ✓ 9.1+ | ✓ 31+ | ✓ 15+ |
| Glassmorphism | ✓ 76+ | ✓ 9+ | ✓ 103+ | ✓ 79+ |
| alphaVar (color-mix) | ✓ 111+ | ✓ 16.2+ | ✓ 113+ | ✓ 111+ |
| alphaVar (fallback) | ✓ All | ✓ All | ✓ All | ✓ All |

**Note:** All examples include fallbacks for broader browser support.

---

## Performance

- **Theme Toggle:** <10ms switch time (zero re-renders)
- **Glassmorphism:** GPU-accelerated via `backdrop-filter`
- **Alpha Variants:** Zero runtime cost (pre-calculated)
- **Dynamic Alpha:** Modern browsers use `color-mix()`, older use fallback

---

## Documentation Links

- **Main Theme Docs:** `packages-answers/ui/src/theme/README.md`
- **CSS Variables Theme:** `packages-answers/ui/src/theme/cssVarsTheme.tsx`
- **Glassmorphism Tokens:** `packages-answers/ui/src/theme/tokens/glassmorphism.ts`
- **Alpha Utilities:** `packages-answers/ui/src/theme/utils/alpha.ts`
- **Hooks:** `packages-answers/ui/src/theme/hooks/`

---

## Contributing

Found a bug or have a suggestion? Create an issue or PR:

```bash
# Report issue
gh issue create --title "Theme Example: [issue]" --label "documentation"

# Suggest improvement
gh issue create --title "Feature: Add [example] to theme examples" --label "enhancement"
```

---

## License

These examples are part of TheAnswer project and follow the project's license.
