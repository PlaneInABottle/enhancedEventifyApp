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

---
*See global configuration in ~/.claude/CLAUDE.md for general guidelines*