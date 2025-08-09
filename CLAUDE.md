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
bun test                # Run all tests
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
- `mcp__serena__replace_symbol_body` - Refactor component methods, store actions safely

**Project Memory:**
- Store React Native patterns, MobX conventions, testing approaches
- Remember architecture decisions and component design patterns
- Track known issues specific to Expo, React Navigation, theming

**Additional Tools:**
- `mcp__serena__get_symbols_overview` - Explore file/directory structure
- `mcp__serena__insert_after_symbol` / `insert_before_symbol` - Add methods to classes
- `mcp__serena__execute_shell_command` - Run project commands when needed
- Many other code navigation and manipulation tools - use tab completion to discover

### Other MCPs
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

## Component Development Guide

### Form Modal Component Pattern (VenueEditModal Experience)

**Step-by-Step Process:**
1. **Plan with TodoWrite**: Break complex components into manageable steps
2. **Design first**: Structure the UI/UX before implementation  
3. **Implement incrementally**: Modal → Header → Form sections → Actions
4. **Add i18n from start**: Never use hardcoded text
5. **Test comprehensively**: Write tests for all interactions and edge cases
6. **Get expert validation**: Use Gemini to review for over-engineering

**Form State Management Best Practices:**
```typescript
// ✅ Single form object for moderate complexity (5-10 fields)
const [formData, setFormData] = useState<FormData>({
  name: "",
  description: "",
  // nested objects for logical grouping
  address: {
    full_address: "",
    city: "İstanbul",
    postal_code: "",
  }
})

// ✅ Generic update handlers with useCallback for performance
const updateFormField = useCallback((field: keyof FormData, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}, [])

// ✅ Initialize from props with useEffect + useCallback
const getInitialFormData = useCallback((): FormData => {
  if (existingData) {
    return {
      name: existingData.name,
      description: existingData.description || "",
      // Handle nullable fields properly
    }
  }
  return defaultFormData
}, [existingData])

useEffect(() => {
  setFormData(getInitialFormData())
}, [getInitialFormData])
```

**i18n Translation Pattern:**
```typescript
// ✅ Namespace translations by component/feature
// In app/i18n/en.ts and app/i18n/tr.ts:
venueModal: {
  addTitle: "Add New Venue",
  editTitle: "Edit Venue", 
  basicInformation: "Basic Information",
  venueName: "Venue Name",
  venueNamePlaceholder: "Enter venue name",
  // ... more keys
}

// ✅ Use tx/labelTx/placeholderTx props (never hardcoded text)
<Text preset="heading" tx={venue ? "venueModal:editTitle" : "venueModal:addTitle"} />
<TextField
  labelTx="venueModal:venueName"
  placeholderTx="venueModal:venueNamePlaceholder"
  value={formData.name}
  onChangeText={(text) => updateFormField("name", text)}
/>
```

**Testing Strategy:**
```typescript
// ✅ Mock translations in tests
jest.mock("@/i18n/translate", () => ({
  translate: (key: string) => {
    const translations: Record<string, string> = {
      "venueModal:addTitle": "Add New Venue",
      // ... all keys used in component
    }
    return translations[key] || key
  },
}))

// ✅ Test categories for form modals:
// - Basic rendering (visible/hidden states)
// - Form field interactions (text input, dropdowns)
// - Button actions (callbacks with correct data)
// - Form sections (structural elements)
// - Edge cases (empty submission, partial data)
```

**Modal Implementation Pattern:**
```typescript
// ✅ Platform-specific animations
<Modal
  visible={visible}
  transparent
  animationType={Platform.OS === "ios" ? "slide" : "fade"}
  onRequestClose={onClose}
  statusBarTranslucent={Platform.OS === "android"}
>
  <Pressable style={themed($modalOverlay)} onPress={onClose} testID="modal-overlay">
    <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
      {/* Content */}
    </Pressable>
  </Pressable>
</Modal>
```

**Performance Optimizations:**
```typescript
// ✅ Memoize static data
const cityOptions = useMemo(() => createTurkishCityOptions("Other"), [])

// ✅ useCallback for event handlers passed to children
const handleSave = useCallback(() => {
  onSave(formData)
  onClose()
}, [formData, onSave, onClose])
```

**Type Safety Guidelines:**
```typescript
// ✅ Define interfaces for props and form data
interface VenueEditModalProps {
  visible: boolean
  onClose: () => void
  onSave: (formData: VenueEditFormData) => void
  venue: Venue | null  // null for create mode
}

// ✅ Handle nullable/optional fields properly
capacity: venue.capacity?.toString() || "",
description: venue.description || "",

// ✅ Use proper TypeScript constraints
city: "İstanbul" as TurkishCity,  // Not just string
coordinates: [29.0, 41.0] as [number, number],  // Tuple not array
```

### Development Workflow Learned

1. **Always start with TodoWrite** - Complex components need task breakdown
2. **Use Gemini for code review** - Prevents over-engineering, validates patterns
3. **TypeScript first** - Run `npx tsc --noEmit` frequently during development
4. **Test incrementally** - Write tests as you build, not after completion
5. **i18n from day one** - Never add hardcoded text, always use translation keys
6. **Follow existing patterns** - Check other screens/components for consistency

### Complexity Thresholds

**When to use TodoWrite:**
- Component has >3 distinct sections or features
- Multiple props with complex interactions
- Form with >5 fields or nested state

**When to get Gemini review:**
- Any useEffect/useCallback usage
- Complex state management
- New patterns not seen in codebase
- After completing any substantial component

## Project Memory

### Key Decisions
- 2025-01: Using modified TDD (implement first, then test) - better fits rapid prototyping needs
- 2025-01: MobX State Tree for state management - predictable updates and debugging
- 2025-01: VenueEditModal pattern established - use for future form modals

### Known Issues
- **Theme switching on Android**: Requires app restart - React Native limitation
- **i18n missing keys**: Check both en.ts and tr.ts when adding translations
- **Supabase RLS**: Test with actual user roles, not admin token
- **Turkish cities**: Use capitalized names ("İstanbul" not "istanbul") for TurkishCity type

### Component Patterns Established
- **Form Modals**: VenueEditModal pattern (single state object, useCallback handlers, proper i18n)
- **Translation Namespacing**: Feature-based keys (componentName:field format)
- **Testing Strategy**: Mock translations, test interactions not just rendering

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

### React Native Theming Best Practices

**When creating new components:**
- ✅ **Always use ThemedStyle<ViewStyle|TextStyle>** instead of static styles
- ✅ **Platform-specific shadows**: `Platform.OS === "web" ? { boxShadow } : { shadowColor, elevation }`
- ✅ **Color patterns**: `theme.colors.palette.neutral100` for backgrounds, `theme.colors.textDim` for secondary text
- ✅ **Spacing consistency**: Use `theme.spacing.lg` instead of hardcoded pixels
- ✅ **Import structure**: `import type { ThemedStyle } from "@/theme/types"`

**Theming Pattern:**
```typescript
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const Component = () => {
  const { themed } = useAppTheme()
  return <View style={themed($container)} />
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  backgroundColor: theme.colors.palette.neutral100,
  padding: theme.spacing.lg,
  ...(Platform.OS === "web"
    ? { boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)` }
    : {
        shadowColor: theme.colors.palette.neutral800,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
      }),
})
```

**Common mistakes prevented:**
- Using hardcoded colors that break in dark mode
- Inconsistent spacing not matching design system
- Missing platform-specific shadow handling
- Wrong import paths for ThemedStyle type

### React Native I18n Best Practices

**When adding new UI text:**
- ✅ **Never use hardcoded strings** - Always use translation keys from the start
- ✅ **Namespace organization**: Group related keys (e.g., `eventListing:`, `map:`, `profile:`)
- ✅ **Consistent key naming**: Use camelCase for translation keys
- ✅ **Complete coverage**: Add both English and Turkish translations simultaneously
- ✅ **Proper syntax**: Use `tx="namespace:key"` for Text components, `translate("namespace:key")` for strings

**Translation Key Patterns:**
```typescript
// Add to both en.ts and tr.ts
featureName: {
  actionButton: "Action Text" / "İşlem Metni",
  emptyStateTitle: "No items found" / "Öğe bulunamadı",
  emptyStateSubtitle: "Try adjusting..." / "Ayarlamayı deneyin...",
}
```

**Common mistakes prevented:**
- Using hardcoded text that breaks localization
- Inconsistent translation key formats
- Missing Turkish translations
- Wrong tx prop syntax (use `:` not `.` for namespaces)

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

### React Native Web Cross-Platform Components

**Before implementing platform-specific solutions:**
1. **Check for universal components first** - Many @rnmapbox/maps components work cross-platform
2. **Use Context7 to research library compatibility** - Always check official docs before assuming platform limitations
3. **Prefer MarkerView over PointAnnotation** - MarkerView works on both native and web
4. **Avoid direct mapbox-gl access** - Internal `_map` properties are unreliable across versions

**Common Web Compatibility Issues:**
- `PointAnnotation` undefined on web → Use `MarkerView` 
- Platform.OS checks often unnecessary → Try universal components first
- Direct map instance access fails → Use official component APIs

**Example Pattern:**
```typescript
// ❌ Complex platform-specific approach
{Platform.OS === 'web' ? <WebPins /> : <NativePins />}

// ✅ Simple universal approach  
<MarkerView coordinate={[lng, lat]}>
  <SharedComponent />
</MarkerView>
```

**Lessons from venue pins implementation:**
- Always research @rnmapbox/maps documentation via Context7 before assuming web limitations
- MarkerView + shared content component is cleaner than platform-specific rendering
- Avoid accessing internal `mapRef.current._map` - use official component APIs

---
*See global configuration in ~/.claude/CLAUDE.md for general guidelines*