# Theme Examples Quick Start

Get started with theme system examples in 60 seconds.

## Option 1: View All Examples (Recommended)

**Create a demo page to see all examples:**

```bash
# Create the page file
cat > apps/web/app/theme-examples/page.tsx << 'EOF'
import { ThemeExamplesDemo } from '@ui/theme/examples/demo'

export default function ThemeExamplesPage() {
  return <ThemeExamplesDemo />
}
EOF
```

**Then visit:** `http://localhost:3000/theme-examples`

---

## Option 2: Use Individual Components

**Import and use components directly:**

### Glass Card

```tsx
import { GlassCard } from '@ui/theme/examples'

<GlassCard
  title="My Card"
  description="A glassmorphism card with hover effects"
>
  <Button>Action</Button>
</GlassCard>
```

### Theme Toggle

```tsx
import { ThemeToggle } from '@ui/theme/examples'

// In your app header/navbar
<AppBar>
  <Toolbar>
    <Typography>My App</Typography>
    <Box sx={{ flexGrow: 1 }} />
    <ThemeToggle />
  </Toolbar>
</AppBar>
```

### Alpha Transparency

```tsx
import { AlphaTransparencyShowcase } from '@ui/theme/examples'

// Show alpha transparency patterns
<AlphaTransparencyShowcase />

// Or use alpha directly in your code:
import { useTheme } from '@mui/material'

const theme = useTheme()

<Box
  sx={{
    backgroundColor: theme.vars.palette.primary.alpha20 // 20% opacity
  }}
>
  Content
</Box>
```

---

## Option 3: Copy-Paste for Customization

**All examples are self-contained. Copy the code and modify:**

1. Open `packages-answers/ui/src/theme/examples/glass-card.tsx`
2. Copy the entire `GlassCard` component
3. Paste into your component file
4. Customize as needed

**Example customization:**

```tsx
// Original
<GlassCard title="Title" description="Description" />

// Custom styling
<GlassCard
  title="Title"
  description="Description"
  sx={{
    maxWidth: 500,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
  }}
/>
```

---

## Common Use Cases

### Use Case 1: Add Theme Toggle to Header

```tsx
// apps/web/app/layout.tsx or your header component
import { ThemeToggle } from '@ui/theme/examples'

<header>
  <nav>
    <Logo />
    <Navigation />
    <ThemeToggle /> {/* Add here */}
  </nav>
</header>
```

### Use Case 2: Create Feature Cards

```tsx
import { GlassCard } from '@ui/theme/examples'
import { Grid } from '@mui/material'

const features = [
  { title: 'Fast', description: 'Lightning quick performance' },
  { title: 'Secure', description: 'Enterprise-grade security' },
  { title: 'Scalable', description: 'Grows with your needs' }
]

<Grid container spacing={3}>
  {features.map(feature => (
    <Grid item xs={12} md={4} key={feature.title}>
      <GlassCard {...feature} />
    </Grid>
  ))}
</Grid>
```

### Use Case 3: Custom Alpha Backgrounds

```tsx
import { useTheme } from '@mui/material'
import { alphaVar } from '@ui/theme/utils/alpha'

function MyComponent() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        // Pre-calculated (best performance)
        backgroundColor: theme.vars.palette.primary.alpha10,

        // Dynamic (custom opacity)
        '&:hover': {
          backgroundColor: alphaVar(
            'var(--theanswer-palette-primary-main)',
            0.25,
            'rgba(37, 99, 235, 0.25)'
          )
        }
      }}
    >
      Content
    </Box>
  )
}
```

---

## Tips

1. **Always use `useTheme()` hook** to access theme values
2. **Pre-calculated alpha is faster** than dynamic for common opacities
3. **All components are accessible** - they include ARIA labels and keyboard support
4. **Glassmorphism requires backdrop** - ensure there's content behind glass elements
5. **Theme persists automatically** - uses localStorage via CSS Variables

---

## Troubleshooting

### "Module not found: @ui/theme/examples"

**Solution:** Check import alias in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@ui/*": ["packages-answers/ui/src/*"]
    }
  }
}
```

### "Property 'alpha10' does not exist"

**Solution:** The type definitions are in `packages-answers/ui/src/theme/types/palette.d.ts`. Ensure it's included in your TypeScript build.

### "Glassmorphism not showing"

**Solution:** Glassmorphism requires:
1. Content behind the element (for blur effect)
2. Modern browser (Chrome 76+, Safari 9+, Firefox 103+)
3. Non-opaque background

### "Theme not persisting"

**Solution:** CSS Variables theme uses localStorage key `'mui-mode'`. Check:
1. localStorage is enabled
2. No conflicting localStorage operations
3. ThemeProvider is wrapping your app

---

## Next Steps

- Read full documentation: `packages-answers/ui/src/theme/examples/README.md`
- Explore theme tokens: `packages-answers/ui/src/theme/tokens/`
- Learn about accessibility: Search for "useReducedMotion" in examples
- View source code: All examples include detailed inline comments

---

## Support

Questions? Check:
1. Main theme README: `packages-answers/ui/src/theme/README.md`
2. Create GitHub issue: Tag with `documentation` label
3. Ask in team Slack

---

**Happy coding!**
