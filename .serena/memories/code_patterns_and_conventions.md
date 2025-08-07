# Code Patterns & Conventions - Enhanced Eventify App

## Component Patterns

**Functional Components with Observer:**
```typescript
import React from 'react'
import { observer } from 'mobx-react-lite'
import { useAppTheme } from '@/theme/context'

export const ComponentName = observer(function ComponentName(props: Props) {
  const { themed } = useAppTheme()
  return <View style={themed($container)} />
})

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  backgroundColor: theme.colors.palette.neutral100,
})
```

**MobX State Tree Store Pattern:**
```typescript
import { types } from 'mobx-state-tree'

export const StoreModel = types
  .model('StoreName')
  .props({
    // Properties
  })
  .views((self) => ({
    // Computed values
  }))
  .actions((self) => ({
    // Actions that modify state
  }))
```

## Theming Conventions

**Always use ThemedStyle over static styles:**
- Enables dark/light mode switching
- Consistent spacing via `theme.spacing.*`
- Platform-specific shadows via conditional logic
- Color patterns: `theme.colors.palette.neutral100` for backgrounds

## Testing Patterns

**Component Testing Setup:**
- Always mock `useAppTheme` in tests
- Use `@testing-library/react-native` for component tests
- Mock translations with simple key-value pairs
- Test user interactions with `fireEvent`

## Translation Conventions

**Never use hardcoded strings:**
- Always use `tx="namespace:key"` for Text components
- Use `translate("namespace:key")` for string values
- Organize keys by feature/screen namespaces
- Maintain both English and Turkish translations

## File Naming

- Screens: `ScreenName.tsx`
- Components: `ComponentName.tsx` 
- Stores: `StoreName.ts`
- Tests: `ComponentName.test.tsx`
- Types: PascalCase interfaces