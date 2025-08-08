# Translation Key Format Fix

## Issue Discovered
Translation keys in the i18n system were using incorrect format with dots (.) instead of colons (:) for namespace separation.

### Incorrect Format
```typescript
"errors.postalCodeInvalid"  // ❌ Wrong - shows raw key
```

### Correct Format
```typescript
"errors:postalCodeInvalid"  // ✅ Correct - shows translated text
```

## Root Cause
The i18n translation system uses colon (:) to separate namespaces from keys, not dots (.). Using dots causes the system to look for a key literally named "errors.postalCodeInvalid" instead of looking in the "errors" namespace for "postalCodeInvalid".

## Files Fixed
1. **VenueEditModal.tsx** - All validation error keys
2. **VenuesScreen.tsx** - Error messages for save operations
3. **VenueStore.ts** - All error messages in store actions
4. **venueService.ts** - All service error returns
5. **Test files** - Updated to match new format

## Pattern to Remember
- Always use colon (:) for namespace separation in translation keys
- Format: `"namespace:key"` not `"namespace.key"`
- Common namespaces: `common:`, `errors:`, `venueModal:`, etc.

## Example Usage
```typescript
// In components
<Text tx="errors:venueNameRequired" />
helperTx="errors:postalCodeInvalid"

// In code
setSaveError("errors:updateVenueFailed")
return { success: false, error: "errors:createVenueFailed" }
```

This fix ensures all error messages display properly translated text instead of showing raw translation keys to users.