# Enhanced Eventify App - Project Configuration

*Project-specific guidelines for React Native development*

## 🚀 **BEFORE YOU START CODING**

### **Essential Reading (REQUIRED):**
1. **Read this CLAUDE.md file** - Core project commands and patterns
2. **Check relevant Serena memories** - Use `mcp__serena__list_memories` for detailed guides:
   - `react-native-testing-patterns` - Testing patterns and security
   - `react-native-platform-patterns` - Platform patterns and troubleshooting
   - `comprehensive-testing-guide` - Complete testing guide with 760 tests
3. **Review recent commits** - `git log --oneline -10`

### **🤖 PROACTIVE SUB-AGENT USAGE (MANDATORY):**
- **Architecture Advisor (Sonnet)** - Architecture decisions, Supabase design, MobX State Tree patterns
- **Code Reviewer (Auto-triggered)** - After ANY code changes for security, performance, maintainability
- **Debugger (Haiku)** - Errors, unexpected behavior, test failures, build issues
- **Testing Strategist (Haiku)** - Before implementing features for comprehensive test planning

**💡 Sub-agents activate automatically - leverage their specialized expertise for complex analysis!**

## Project Context

**Tech Stack:** React Native 0.79.5 + Expo, TypeScript, MobX State Tree, React Navigation, Supabase, React Native Testing Library, i18n (TR/EN)

**Key Patterns:** Functional components + hooks, MobX Observer pattern, `useAppTheme()` styling, translation keys only

## Development Commands

**Essential Commands:**
```bash
# Development
bun start               # Start dev server (expo start --dev-client)
bun run ios             # Run on iOS simulator
bun run android         # Run on Android emulator
bun run web             # Run on web browser

# Quality Checks (Run before committing)
bun run compile         # TypeScript check (tsc --noEmit)
bun run lint            # ESLint check with auto-fix
bun run lint:check      # ESLint check without fixing
bun run test            # Run all tests (IMPORTANT: Use 'bun run test', NOT 'bun test')
bun run test:watch      # Watch mode for TDD

# Build Commands
bun run bundle:web      # Export web build
bun run serve:web       # Serve web build locally
bun run prebuild:clean  # Clean prebuild

# Testing
bun run test:maestro        # Run Maestro mobile app tests

# EAS Build Commands (Local builds)
bun run build:ios:sim      # iOS simulator build
bun run build:ios:dev      # iOS device development
bun run build:ios:preview  # iOS preview build
bun run build:ios:prod     # iOS production build
bun run build:android:sim  # Android simulator build
bun run build:android:dev  # Android device development
bun run build:android:preview # Android preview build
bun run build:android:prod    # Android production build

# Android Development Setup
bun run adb                # Setup ADB port forwarding

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

### Critical MobX List Pattern
```typescript
// CRITICAL: Wrap list items with Observer for MobX reactivity
// See 'react-native-platform-patterns' memory for full details

import { observer, Observer } from 'mobx-react-lite'

const renderEventItem = useCallback(({ item: event }) => (
  <Observer>
    {() => (
      <Pressable onPress={() => onEventPress?.(event)}>
        <Text text={event.title} />
      </Pressable>
    )}
  </Observer>
), [onEventPress])
```

### Key Patterns
```typescript
// Error Handling - NEVER hardcode, use translation keys
return { success: false, error: "errors.venueNotFound" }

// Avoid Overengineering - Single loading state
isLoading // Not: isCreating, isUpdating, isDeleting

// RLS Security - Validate ownership through business level
WHERE entity_id IN (
  SELECT t.id FROM table t
  JOIN business_profiles bp ON t.business_id = bp.id  
  WHERE t.id = folder_id AND bp.owner_id = auth.uid()
)
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

### Writing Tests
- Use `renderWithProviders` and `setupComponentTest` from `test/helpers/`
- See `react-native-testing-patterns` memory for security patterns
- Run: `bun run test:watch ComponentName`


## MCP Integration

### MCP Integration

**Serena (Code Intelligence):** Primary tool for code navigation, pattern search, and memory management
**Supabase:** `mcp__supabase__*` for database operations  
**Playwright:** `mcp__playwright__*` for web testing
**Maestro:** `mcp__maestro__*` for mobile app testing


## Development Workflow

1. **Plan with TodoWrite** for complex components
2. **TypeScript first** - Run `bun run compile` frequently
3. **i18n from day one** - Never use hardcoded text
4. **Follow existing patterns** - Check similar components

## Key Serena Memories

**Testing:**
- `react-native-testing-patterns` - Security patterns, mocking, async handling
- `comprehensive-testing-guide` - Complete guide with 760 tests

**Platform Patterns:**
- `react-native-platform-patterns` - Navigation, MobX, theming, troubleshooting

## Quick Troubleshooting

**TypeScript errors:** `bun run compile` → Check versions → Clean reinstall  
**Metro issues:** `npx react-native start --reset-cache`  
**Expo cache:** `expo start -c` + `rm -rf .expo`

*See `react-native-platform-patterns` memory for detailed troubleshooting*

## 🤖 Specialized Sub-Agents (Detailed Configuration)

### Architecture Advisor (Sonnet Model)
**PROACTIVE TRIGGERS:**
- React Native architecture decisions and component design
- Supabase schema design, RLS policies, Edge Functions
- MobX State Tree store architecture and relationships
- Navigation structure and cross-platform patterns
- Technology integration decisions (libraries, frameworks)

### Code Reviewer (Automatically Triggered)
**MANDATORY for ANY code changes:**
- Security analysis (RLS, authentication, data validation)
- Performance review (MobX reactivity, list rendering, bundle size)
- Maintainability assessment (overengineering detection, pattern consistency)
- Type safety and React Native best practices

### Debugger (Haiku Model - Fast Analysis)
**AUTOMATIC TRIGGERS:**
- Runtime errors, logic bugs, unexpected behavior
- Test failures, build errors, TypeScript compilation issues
- Performance problems (slow rendering, memory leaks)
- Integration issues (Supabase, navigation, platform-specific)

### Testing Strategist (Haiku Model - Fast Planning)
**PROACTIVE USAGE (Before Implementation):**
- Comprehensive test planning for new features
- Coverage gap analysis and test strategy recommendations
- React Native testing patterns with security considerations
- MobX store testing and Observer pattern validation

**💡 Sub-agents activate automatically based on task context - structured expertise for complex analysis!**

---
*See global configuration in ~/.claude/CLAUDE.md for general guidelines*