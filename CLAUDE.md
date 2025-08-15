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

### MobX Observer List Pattern
```typescript
// CRITICAL: For list components rendering MobX observables, each item MUST be wrapped with Observer
// This ensures individual items react to changes without re-rendering the entire list

// ❌ Bad - No Observer wrapper, items won't react to MobX changes
import { observer } from 'mobx-react-lite'

const renderEventItem = useCallback(({ item: event }) => (
  <Pressable onPress={() => onEventPress?.(event)}>
    <Text text={event.title} />  {/* Won't update when event.title changes */}
  </Pressable>
), [])

// ✅ Good - Observer wrapper ensures reactivity
import { observer, Observer } from 'mobx-react-lite'

const renderEventItem = useCallback(({ item: event }) => (
  <Observer>
    {() => (
      <Pressable onPress={() => onEventPress?.(event)}>
        <Text text={event.title} />  {/* Updates when event.title changes */}
      </Pressable>
    )}
  </Observer>
), [onEventPress])

// Pattern applies to ALL list rendering:
// - FlatList renderItem
// - SectionList renderItem  
// - ListView renderItem
// - Any list component using MobX data

// Why this works:
// 1. Outer observer() HOC only tracks what the main component accesses directly
// 2. Inner <Observer> ensures each list item has independent reactivity
// 3. Changes to individual MobX observables trigger re-render of specific items only
```

### Error Handling Pattern
```typescript
// NEVER use hardcoded error messages - use translation keys
// Error messages exist in app/i18n/en.ts and app/i18n/tr.ts under 'errors' section

// ❌ Bad - hardcoded
return { success: false, error: "Venue not found" }

// ✅ Good - use translation key  
return { success: false, error: "errors.venueNotFound" }
```

### Overengineering Detection Pattern
```typescript
// ❌ Bad - too many specific loading states
isLoading, isCreating, isUpdating, isDeleting

// ✅ Good - follow existing store patterns
isLoading // Single state for all async operations

// Before adding complexity, check existing stores:
// - BusinessProfileStore: isLoading, isUpdating, isUploading
// - Keep it simple and consistent
```

### Testing Pattern
```typescript
// Modified TDD: Implement first, then test
// 1. Write complete function
// 2. Run bun run compile
// 3. Write comprehensive tests
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByTestId('test-id')).toBeOnTheScreen()
  })
})
```

### RLS Security Pattern
```typescript
// ❌ Bad - Entity existence only (security gap)
WHERE entity_id IN (SELECT id FROM table WHERE id = folder_id)

// ✅ Good - Ownership validation through foreign keys  
WHERE entity_id IN (
  SELECT t.id FROM table t
  JOIN business_profiles bp ON t.business_id = bp.id  
  WHERE t.id = folder_id AND bp.owner_id = auth.uid()
)
```
**Ownership Chain**: user → business → venue/event
- Always validate ownership at the business level
- Use existing foreign key relationships instead of adding redundant user_id columns

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
bun run test:watch ComponentName

# Always mock these:
jest.mock('@/theme/context')
jest.mock('@/i18n/translate')
```

### Test Infrastructure Security & Best Practices 🔒
**Critical security patterns learned from infrastructure review:**

#### Secure Test Mocking
```typescript
// ❌ SECURITY RISK - Exposed JWT structure reveals auth patterns
access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInVzZXJfcm9sZSI6InVzZXIifQ.sig'

// ✅ SECURE - Use opaque tokens in tests
access_token: 'mock-access-token-secure-opaque-string-12345'
```

#### Centralized Mock Management
```typescript
// ❌ BAD - Duplicate mock implementations
// Multiple scattered mock definitions for Supabase across files

// ✅ GOOD - Centralized mock factories
// test/helpers/supabaseMocks.ts with reusable mock functions
import { createSupabaseClientMock, createMockUser } from '../../test/helpers/supabaseMocks'
```

#### Type-Safe Test Utilities
```typescript
// ❌ BAD - Type safety erosion
rootStore?: any
venues?: any[]

// ✅ GOOD - Proper interfaces for test data
interface TestRootStore {
  authenticationStore: any
  businessProfileStore: any
  venueStore: any
}
venues?: TestVenue[]
```

#### Functional Test Helpers
```typescript
// ❌ BAD - Helper functions that ignore parameters
setupComponentTest({ mockNavigation: true }) // Parameter ignored

// ✅ GOOD - Actually implement the functionality
if (mockNavigation) {
  mockNav = createMockNavigation()
}
```

**Jest Mock Variable Scope Rules:**
- Variables referenced in `jest.mock()` must be prefixed with `mock` (case insensitive)
- Use `const mockSupabaseClient = ...` not `const supabaseClientMock = ...`
- This prevents "out-of-scope variable" errors

#### Shared Test Utilities Pattern
```typescript
// ✅ PREFERRED - Use shared test utilities
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'

// Replace manual provider wrapping
const renderMyComponent = (props = {}) => {
  return renderWithProviders(
    <NavigationContainer>
      <MyComponent {...props} />
    </NavigationContainer>,
    { withStoreProvider: false }
  )
}

// Setup with automatic Alert mocking
setupComponentTest({ mockAlert: true })
```

**Available Test Helpers:**
- `test/helpers/componentTestHelpers.tsx` - React component test utilities
- `test/helpers/supabaseMocks.ts` - Centralized Supabase mock factories
- `renderWithProviders()` - Consistent provider wrapping
- `createTestRootStore()` - Test store creation with proper types
- `setupComponentTest()` - Standardized test setup with Alert/navigation mocking

#### Test Refactoring Strategy
**When refactoring tests for consistency:**

1. **Identify patterns first** - Find common manual wrapping patterns like ThemeProvider
2. **Start with high-impact files** - Focus on frequently used components first  
3. **Use batch operations carefully** - Avoid blind search/replace that creates syntax errors
4. **Verify incrementally** - Run tests after each file to catch issues early
5. **Maintain 100% pass rate** - Never let any tests fail during refactoring

**Common Refactoring Patterns:**
```typescript
// Replace this pattern:
render(
  <ThemeProvider>
    <NavigationContainer>
      <Component {...props} />
    </NavigationContainer>
  </ThemeProvider>
)

// With this:
renderWithProviders(
  <NavigationContainer>
    <Component {...props} />
  </NavigationContainer>,
  { withStoreProvider: false }
)
```

### React Native Test Patterns ✅
**Button Component Mocking:**
```typescript
jest.mock('./Button', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    Button: ({ tx, onPress, disabled, ...props }: any) => {
      const mockText: Record<string, string> = {
        'report:submitReport': 'Submit Report',
        'common:cancel': 'Cancel',
      }
      return React.createElement(TouchableOpacity, {
        onPress,
        disabled,
        testID: tx ? `button-${tx}` : 'button',
        accessibilityRole: 'button',
        ...props
      }, React.createElement(Text, {}, tx ? mockText[tx] : 'Button'))
    },
  }
})
```

**Text Content Matching:**
```typescript
// ❌ Exact matching fails with concatenated DOM
expect(root).toHaveTextContent('Report Content')

// ✅ Use regex for partial matching
expect(root).toHaveTextContent(/Report Content/)
```

**Async Test Handling:**
```typescript
// Always wrap async operations in act()
await act(async () => {
  fireEvent.press(getByText('Submit'))
})

// Use waitFor for async assertions
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled()
})
```

## MCP Integration

### Serena (Code Intelligence)
**React Native Workflows:**
- `mcp__serena__find_symbol` - Navigate MobX stores, React components, navigation screens
- `mcp__serena__find_referencing_symbols` - Find all usages of hooks like `useAppTheme`, `useStores`
- `mcp__serena__search_for_pattern` - Find translation keys, styled components, specific patterns
- `mcp__serena__get_symbols_overview` - Understand file/directory structure

**Project Memory Management (PRIMARY APPROACH):**
- `mcp__serena__write_memory` - Store React Native patterns, MobX conventions, testing approaches
- `mcp__serena__read_memory` - Retrieve architecture decisions and component design patterns
- `mcp__serena__list_memories` - See all available project knowledge
- **Key Memory Categories**: Architecture decisions, known issues, established patterns, troubleshooting solutions
- **Memory replaces SESSION.md** - All session context should be stored in Serena memories

**Additional Tools:**
- `mcp__serena__insert_after_symbol` / `insert_before_symbol` - Add methods to classes
- `mcp__serena__execute_shell_command` - Run project commands when needed

### Other MCPs
**Database (Supabase):** Use `mcp__supabase__*` for migrations, queries, and branch management
**Web Testing (Playwright):** Use `mcp__playwright__*` for testing Expo web builds  
**Mobile Testing (Maestro):** Use `mcp__maestro__*` for React Native app testing

*Use tab completion to discover specific commands for each tool*


## Component Development Guide

### Development Workflow

1. **Plan with TodoWrite** for complex components (>3 sections, >5 form fields)
2. **Use Gemini for code review** after substantial changes
3. **TypeScript first** - Run `bun run compile` frequently 
4. **i18n from day one** - Never use hardcoded text
5. **Follow existing patterns** - Check similar components for consistency

## Project Memory (Stored in Serena)

**Use Serena memories for:**
- Key architectural decisions and patterns
- Known issues and troubleshooting solutions  
- Component patterns and established conventions
- Testing strategies and common mocks

### Testing Memory Organization (Security-Hardened)

**Core Testing Memories (READ THESE FIRST):**
- `comprehensive-testing-guide` - Complete security-hardened testing guide with 760 tests patterns
- `testing-guide-setup-configuration` - Test infrastructure setup with JWT security fixes
- `testing-guide-common-patterns` - Shared test utilities and security patterns
- `test-refactoring-analysis` - Completed refactoring work and lessons learned

**When to Reference Testing Memories:**
- **Before writing tests**: Read `testing-guide-common-patterns` for shared utilities
- **Test infrastructure issues**: Check `testing-guide-setup-configuration` for secure patterns
- **Complex testing scenarios**: Reference `comprehensive-testing-guide` for advanced patterns
- **Security concerns**: All memories now include security-hardened patterns (JWT, mocks, types)

**Testing Memory Guidelines:**
- Always use `renderWithProviders` and `setupComponentTest` from shared utilities
- Never expose JWT structure in test mocks (use opaque tokens)
- Use centralized Supabase mocks from `test/helpers/supabaseMocks.ts`
- Follow Jest mock variable naming with 'mock' prefix

### React Native Specific Patterns

**Navigation Prop Issues:**
```typescript
// Common issue: TypeScript prop mismatch between navigator types
// Solution: Simple wrapper component
const WrappedScreen = (props: any) => <OriginalScreen {...props} />
```

**Nested Navigator Patterns:**
- **Gesture Conflicts**: Always add `swipeEnabled: false` when maps/gestures conflict with tab swipers
- **Architecture**: BottomTab → TopTab → Screens (not Screen → TopTab)
- **Props Flow**: React Navigation automatically provides navigation/route props

**Component Reuse Guidelines:**
- ✅ **First choice**: Reuse existing screen with wrapper if prop mismatch
- ✅ **Second choice**: Extract common logic into shared component  
- ❌ **Last resort**: Duplicate screen functionality

**Common TypeScript Fixes:**
```typescript
// Prop adapter for navigation mismatches
const ComponentWrapper = (props: any) => <OriginalComponent {...props} />

// Optional navigation props
interface ScreenProps extends Partial<UserTabScreenProps<"Screen">> {}
```

### React Native Best Practices

**Theming:**
- Always use `ThemedStyle<ViewStyle|TextStyle>` instead of static styles
- Platform-specific shadows: `Platform.OS === "web" ? { boxShadow } : { shadowColor, elevation }`
- Use `theme.colors.palette.neutral100` for backgrounds, `theme.spacing.lg` for consistency

**i18n:**
- Never use hardcoded strings - Always use translation keys from the start
- Namespace organization: `eventListing:`, `map:`, `profile:`
- Use `tx="namespace:key"` for Text components, `translate("namespace:key")` for strings

**MobX State Tree Store Reset Pattern:**
```typescript
// ❌ Bad - Creates new instances, breaks reactivity
resetAllStores() {
  self.userProfileStore = UserProfileStore.create({})
  self.businessProfileStore = BusinessProfileStore.create({}) 
}

// ✅ Good - Resets data while maintaining instance references
resetAllStores() {
  applySnapshot(self.userProfileStore, {})
  applySnapshot(self.businessProfileStore, {})
}
```
**Key Issue**: AsyncStorage persists ALL store state including temporary states like `isUploading`. Store recreation causes "no longer part of state tree" errors when components access detached objects.

## Common Issues & Solutions

### React Native Specific Issues

**"TypeScript errors after changes"**
```bash
bun run compile                   # See all errors (tsc --noEmit)
bun pm ls @types/react-native     # Check RN type versions
rm -rf node_modules && bun i      # Clean reinstall
```

**"Tests passing locally but failing in CI"**
- Check for timing dependencies: `await waitFor(() => ...)`
- Look for platform differences: `Platform.OS` checks
- Ensure all mocks are properly reset: `jest.clearAllMocks()`
- Verify React Native mocks in jest.setup.js

**"Import errors after moving files"**
```bash
# Update all imports automatically
grep -r "old/path" . --exclude-dir=node_modules | cut -d: -f1 | xargs sed -i 's|old/path|new/path|g'
# Update TypeScript paths in tsconfig.json
```

**"Metro bundler issues"**
```bash
npx react-native start --reset-cache   # Clear Metro cache
rm -rf $TMPDIR/metro-*                 # Clear Metro temp files
cd ios && pod install && cd ..         # Reinstall iOS deps
```

**"Dependency version conflicts"**
```bash
bun pm ls packagename            # See all versions in tree
bun run align-deps               # Fix Expo dependencies
npx react-native doctor          # Check RN setup
```

### Expo-Specific Issues

**"Expo Go not updating"**
```bash
expo start -c                    # Clear cache
rm -rf .expo                     # Remove local expo cache
expo prebuild --clean            # Clean prebuild artifacts
```

**"Platform-specific styling issues"**
- Always test on both iOS and Android
- Use Platform.select() for platform differences
- Check shadow properties (iOS) vs elevation (Android)

### Cross-Platform Components

**Mapbox/Maps:**
- Prefer `MarkerView` over `PointAnnotation` (works on both native and web)
- Avoid direct map instance access (`mapRef.current._map`)
- Research universal components before platform-specific solutions

## Local Sub-Agents (Project-specific)

### Architecture Advisor
- **Model**: Claude Sonnet 4
- **When**: Architecture decisions, Supabase design, state management
- **Focus**: React Native patterns, MobX State Tree, Supabase integration
- **Location**: `/.claude/agents/architecture-advisor.md`

### Debugger
- **Model**: Claude Haiku 3.5 (fast)
- **When**: Errors, unexpected behavior, performance issues
- **Focus**: Analysis-only root cause identification and fix recommendations
- **Location**: `/.claude/agents/debugger.md`

### Testing Strategist
- **Model**: Claude Haiku 3.5 (fast)
- **When**: Before implementing features, test planning
- **Focus**: Analysis-only test strategy and coverage gap identification
- **Location**: `/.claude/agents/testing-strategist.md`

---
*See global configuration in ~/.claude/CLAUDE.md for general guidelines*