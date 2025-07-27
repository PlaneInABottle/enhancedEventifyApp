# Enhanced Eventify App - Project Configuration

*Project-specific guidelines for React Native development*

## Project Context

**Tech Stack:**
- React Native 0.79.5 with Expo
- TypeScript
- MobX State Tree for state management
- React Navigation for routing
- Supabase for backend
- React Native Testing Library
- i18n for translations (TR/EN)

**Project Structure:**
```
app/
  ├── components/     # Reusable UI components
  ├── screens/        # Screen components
  ├── stores/         # MobX stores
  ├── services/       # API and business logic
  ├── navigators/     # Navigation configuration
  ├── theme/          # Theming and styling
  └── i18n/          # Translations
```

**Key Patterns:**
- Functional components with hooks
- Observer pattern for MobX reactivity
- Themed styling with `useAppTheme()`
- Translation keys instead of hardcoded text

## Development Commands

**Essential Commands:**
```bash
# Development
expo start              # Start dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web browser

# Quality Checks (Run before committing)
npx tsc --noEmit       # TypeScript check
npm run lint           # ESLint check
npm test               # Run all tests
npm run test:watch     # Watch mode for TDD

# Database Testing (pgTAP with CRITICAL rollback requirement)
# ALWAYS run with rollback - tests modify database state
mcp__supabase__execute_sql    # Execute test files with automatic rollback
```

## Project Patterns

### Component Pattern
```typescript
// Always use functional components with proper typing
import React from 'react'
import { observer } from 'mobx-react-lite'
import { useAppTheme } from '@/theme/context'
import { translate } from '@/i18n/translate'

interface ComponentNameProps {
  // Props here
}

export const ComponentName = observer(function ComponentName(props: ComponentNameProps) {
  const { themed } = useAppTheme()
  
  return (
    <View style={themed($container)}>
      <Text tx="translationKey" />
    </View>
  )
})

const $container: ThemedStyle = (theme) => ({
  // Themed styles
})
```

### Store Pattern (MobX)
```typescript
// Stores use MobX State Tree
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

### Testing Pattern
```typescript
// Modified TDD: Implement first, then test
// 1. Write complete function
// 2. Run npx tsc --noEmit
// 3. Write comprehensive tests
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByTestId('test-id')).toBeOnTheScreen()
  })
})
```

## Common Tasks

### Creating a New Screen
1. Create screen file in `app/screens/`
2. Use the Screen component wrapper
3. Add to navigator in `app/navigators/`
4. Add translation keys to `app/i18n/`

### Adding Supabase Functionality
Use `mcp__supabase__*` tools for database operations instead of CLI commands

### Adding Translations
1. Add keys to `app/i18n/en.ts` and `app/i18n/tr.ts`
2. Use `tx` prop: `<Text tx="namespace:key" />`
3. Or translate function: `translate("namespace:key")`

### Writing Component Tests
```bash
# Create test file: ComponentName.test.tsx
# Run in watch mode while developing
npm run test:watch ComponentName

# Always mock these:
jest.mock('@/theme/context')
jest.mock('@/i18n/translate')
```

## MCP Integration

**Database (Supabase):** Use `mcp__supabase__*` for migrations, queries, and branch management
**Web Testing (Playwright):** Use `mcp__playwright__*` for testing Expo web builds  
**Mobile Testing (Maestro):** Use `mcp__maestro__*` for React Native app testing

*Use tab completion to discover specific commands for each tool*

## Agent Integration

For analysis tasks, use global agents with Gemini:
```bash
# Example: Review component quality
echo "Review code quality. Analyze ONLY ProfileScreen.tsx" |
  cat ~/.claude/agents/code-quality-reviewer.md app/screens/ProfileScreen.tsx | 
  gemini -m gemini-2.5-flash
```

## Session Documentation

**Check for existing SESSION.md:**
```bash
# Always check for active session documentation first
ls SESSION*.md 2>/dev/null || echo "No active session"
cat SESSION.md  # Read current session context if exists
```

**Session handoff workflow:**
- Read existing SESSION.md for current feature context
- Update Context7 research findings as you discover them
- Document technical decisions and implementation breadcrumbs
- Use global SESSION.md template when starting new complex features

## Project Memory

### Key Decisions
- 2025-01: Using modified TDD (implement first, then test) - better fits rapid prototyping needs
- 2025-01: MobX State Tree for state management - predictable updates and debugging

### Known Issues
- **Theme switching on Android**: Requires app restart - React Native limitation
- **i18n missing keys**: Check both en.ts and tr.ts when adding translations
- **Supabase RLS**: Test with actual user roles, not admin token

---
*See global configuration in ~/.claude/CLAUDE.md for general guidelines*