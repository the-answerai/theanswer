# AAI UI Extension Pattern

Extend Flowise UI components WITHOUT modifying original source files.

## Core Principle

All AAI UI customizations are isolated in `packages/ui/src/aai/`. Views only need to change their import path to get enhanced components.

## Pattern: Wrapper with Overlay

### Structure

```
packages/ui/src/aai/
├── index.js              # Single export entry point
├── SharedBadge.jsx       # Reusable badge component
├── useSharedBadge.jsx    # Hook for custom usage
├── ItemCard.jsx          # Wrapper for original ItemCard
└── DocumentStoreCard.jsx # Wrapper for original DocumentStoreCard
```

### Implementation Steps

1. **Create wrapper component** in `packages/ui/src/aai/`
2. **Import original component** from `@/ui-component/`
3. **Add enhancements** via CSS absolute positioning
4. **Export from index.js** for clean imports
5. **Update views** - swap import path only

### Example Wrapper

```jsx
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import OriginalItemCard from '@/ui-component/cards/ItemCard'
import { SharedBadge } from './SharedBadge'

const ItemCard = (props) => {
    const activeWorkspaceId = useSelector((state) => state.auth?.user?.activeWorkspaceId)
    const isShared = props.data?.workspaceId && props.data.workspaceId !== activeWorkspaceId

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <OriginalItemCard {...props} />
            {isShared && (
                <Box sx={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }}>
                    <SharedBadge />
                </Box>
            )}
        </Box>
    )
}

export default ItemCard
```

### View Update (1 line change)

```diff
- import ItemCard from '@/ui-component/cards/ItemCard'
+ import { ItemCard } from '@/aai'
```

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Zero core changes** | Original Flowise components untouched |
| **Easy upgrades** | Merge upstream Flowise without conflicts |
| **Isolated code** | All AAI code in one folder |
| **Minimal view changes** | Only swap import line |
| **Extensible** | Add more enhancements to wrappers |

## Extending the Pattern

### Adding New Enhancements

To add another visual indicator (e.g., "Locked" badge):

```jsx
const ItemCard = (props) => {
    // ... existing logic
    const isLocked = props.data?.locked

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <OriginalItemCard {...props} />
            {isShared && <SharedBadge sx={{ position: 'absolute', top: 12, right: 12 }} />}
            {isLocked && <LockedBadge sx={{ position: 'absolute', top: 12, left: 12 }} />}
        </Box>
    )
}
```

### Adding Event Interception

```jsx
const ItemCard = (props) => {
    const handleClick = (e) => {
        // Custom analytics or logging
        trackEvent('card_click', { id: props.data?.id })
        props.onClick?.(e)
    }

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <OriginalItemCard {...props} onClick={handleClick} />
        </Box>
    )
}
```

### Wrapping New Components

1. Create `packages/ui/src/aai/NewComponent.jsx`
2. Follow the wrapper pattern above
3. Add export to `packages/ui/src/aai/index.js`
4. Update views to import from `@/aai`

## Files Reference

| File | Purpose |
|------|---------|
| `aai/index.js` | Export all wrapped components |
| `aai/SharedBadge.jsx` | "Shared" badge UI |
| `aai/useSharedBadge.jsx` | Hook for custom usage |
| `aai/ItemCard.jsx` | Wrapped ItemCard |
| `aai/DocumentStoreCard.jsx` | Wrapped DocumentStoreCard |

## When to Use

- Adding visual indicators (badges, icons, overlays)
- Intercepting events (tracking, logging)
- Conditionally modifying props
- Adding context-dependent UI

## When NOT to Use

- Major structural changes to component internals
- Changes that require DOM restructuring
- Performance-critical rendering paths
