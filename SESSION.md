# Venue Management - Next Steps

## Current Status
VenueEditModal component is complete with comprehensive i18n, form state management, and full test coverage. Ready for integration with VenuesScreen.

## Immediate Next Tasks
1. **Add modal state to VenuesScreen** - visibility and selectedVenue state
2. **Connect edit buttons to venue cards** - trigger modal with venue data
3. **Wire up VenueStore.updateVenue** - save functionality
4. **Add venue creation mode** - reuse modal for "Add Venue" button

## Component Development Pattern Established
- **Form State**: Single formData object with nested address structure
- **Input Handlers**: useCallback for updateFormField and updateAddressField
- **i18n**: Namespace translations (venueModal:key format)
- **Testing**: Mock translations, test all interactions and edge cases
- **Validation**: Use Gemini for code review to prevent over-engineering

## Key Files Ready
- `app/components/VenueEditModal.tsx` - Complete modal with tests
- `app/i18n/en.ts` & `tr.ts` - Translation keys added
- `app/stores/VenueStore.ts` - updateVenue action ready
- `app/screens/VenuesScreen.tsx` - needs modal integration

## Integration Pattern
```typescript
// In VenuesScreen
const [modalVisible, setModalVisible] = useState(false)
const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

// Edit handler
const handleEditVenue = (venue: Venue) => {
  setSelectedVenue(venue)
  setModalVisible(true)
}

// Save handler  
const handleSaveVenue = async (formData: VenueEditFormData) => {
  await venueStore.updateVenue(selectedVenue.id, formData)
  setModalVisible(false)
}
```

## Next Implementation
Follow Component Development Guide in CLAUDE.md - use TodoWrite for step planning, get Gemini validation for complex components.