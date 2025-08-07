# Known Issues & Solutions - Enhanced Eventify App

## React Native Specific Issues

**Theme switching on Android requires app restart:**
- **Issue**: React Native limitation with theme switching
- **Workaround**: Document this as expected behavior
- **Future**: Consider react-native-restart library if becomes critical

**Navigation TypeScript prop mismatches:**
- **Solution**: Use wrapper components for navigation prop compatibility
```typescript
const WrappedScreen = (props: any) => <OriginalScreen {...props} />
```

**Platform-specific shadow handling:**
- **Pattern**: Always use conditional logic for web vs native shadows
```typescript
...(Platform.OS === "web"
  ? { boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)` }
  : {
      shadowColor: theme.colors.palette.neutral800,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      elevation: 4,
    })
```

## Testing Issues

**Button component mocking in tests:**
- Always mock Button component with proper testID structure
- Use regex for text content matching instead of exact strings
- Wrap async operations in `act()` for proper timing

**Missing translation keys:**
- **Check both**: `app/i18n/en.ts` and `app/i18n/tr.ts` when adding translations
- **Testing**: Mock translate function with key-value pairs

## Map Integration Issues

**@rnmapbox/maps cross-platform:**
- **Web compatibility**: Use `MarkerView` instead of `PointAnnotation` for universal support
- **Avoid**: Direct map instance access via `_map` properties
- **Prefer**: Official component APIs over internal methods

## Database/Supabase Issues

**RLS (Row Level Security):**
- **Testing**: Always test with actual user roles, not admin token
- **Development**: Use branch databases for testing schema changes
- **Production**: Ensure all tables have appropriate RLS policies