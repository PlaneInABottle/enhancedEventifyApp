# Venue Management Implementation Session

*Comprehensive implementation plan for venue creation and editing functionality in Enhanced Eventify App*

## Project Context

**Tech Stack:**
- React Native 0.79.5 with Expo
- TypeScript
- MobX State Tree for state management
- Supabase for backend (PostgreSQL)
- React Navigation for routing
- React Native Testing Library for testing

## Existing Database Structure

### `venues` Table
```sql
venues:
- id: uuid (PK)
- business_id: uuid (FK to business_profiles)
- address_id: uuid (FK to addresses) 
- name: text (NOT NULL)
- description: text
- capacity: integer
- is_active: boolean (default: true)
- created_at: timestamptz
- updated_at: timestamptz
```

### `addresses` Table
```sql
addresses:
- id: uuid (PK)
- full_address: text
- city: turkish_city (enum: İstanbul, Ankara, İzmir, etc.)
- country: varchar (default: 'Turkey')
- postal_code: varchar
- coordinates: geography (lat/lng)
- created_at: timestamptz
- updated_at: timestamptz
```

### Relationships
- Business → Venues (1:many via business_id)
- Venues → Addresses (1:1 via address_id)
- Venues → Event Instances (1:many)

## Implementation Plan

### Phase 1: Analyze Current Venue Implementation
**Goal:** Check existing venue-related code in the project

**Files to Review:**
- Check if venue services already exist in `app/services/`
- Look for venue stores in `app/stores/`
- Review any existing venue screens in `app/screens/`
- Check venue types in `app/models/`

### Phase 2: TypeScript Types & Interfaces
**Goal:** Create comprehensive venue and address types

**Files to Create/Update:**
- `app/services/venue/venueTypes.ts` - Venue interfaces
- `app/services/venue/addressTypes.ts` - Address interfaces
- `app/models/VenueModels.ts` - MobX State Tree models

**Key Types to Implement:**
```typescript
// TODO: Implement these types
interface Venue {
  id: string
  business_id: string
  address_id: string
  name: string
  description?: string
  capacity?: number
  is_active: boolean
  created_at: string
  updated_at: string
  address?: Address // Joined address data
}

interface Address {
  id: string
  full_address?: string
  city?: TurkishCity
  country?: string
  postal_code?: string
  coordinates?: {lat: number, lng: number}
  created_at: string
  updated_at: string
}

type TurkishCity = 'İstanbul' | 'Ankara' | 'İzmir' | 'Bursa' | 'Antalya' | /* ... */
```

### Phase 3: Service Layer Implementation
**Goal:** Create business logic for venue and address operations

**Service Functions to Implement:**
```typescript
// TODO: Implement venue service functions
- createVenue(venueData: CreateVenueRequest) // Creates venue + address
- updateVenue(id: string, updates: UpdateVenueRequest)
- deleteVenue(id: string) // Soft delete (is_active = false)
- getVenuesByBusiness(businessId: string)
- getVenueById(id: string)
- searchVenues(query: string, filters?: VenueFilters)

// TODO: Implement address service functions  
- createAddress(addressData: CreateAddressRequest)
- updateAddress(id: string, updates: UpdateAddressRequest)
- geocodeAddress(address: string) // Get coordinates
- validatePostalCode(postalCode: string)
```

### Phase 4: State Management (MobX)
**Goal:** Implement reactive state management for venues

**Store to Create:**
- `app/stores/VenueStore.ts` - Venue state management
- Integration with existing BusinessProfileStore

**Store Structure:**
```typescript
// TODO: Implement VenueStore
export const VenueStoreModel = types
  .model('VenueStore')
  .props({
    venues: types.array(VenueModel),
    isLoading: false,
    error: types.maybeNull(types.string)
  })
  .views((self) => ({
    get venuesByBusiness() {
      // Filter venues by current business
    },
    get activeVenues() {
      // Filter active venues only
    }
  }))
  .actions((self) => ({
    // CRUD operations
    // Loading states
    // Error handling
  }))
```

### Phase 5: UI Components & Screens
**Goal:** Create user interface for venue management

**Screens to Implement:**
- `VenueListScreen.tsx` - View business venues
- `CreateVenueScreen.tsx` - Create new venue
- `EditVenueScreen.tsx` - Edit existing venue  
- `VenueDetailScreen.tsx` - View venue details

**Components to Create:**
- `VenueCard.tsx` - Venue summary display
- `VenueForm.tsx` - Venue creation/editing form
- `AddressForm.tsx` - Address input component
- `CitySelector.tsx` - Turkish city dropdown
- `MapLocationPicker.tsx` - Map integration for coordinates

**Form Features:**
- Venue name (required)
- Description (optional)
- Capacity (optional, positive integer)
- Full address input
- City selection (Turkish cities enum)
- Postal code validation
- Map integration for coordinate selection

### Phase 6: Navigation Integration
**Goal:** Add venue screens to business navigation

**Navigation Updates:**
- Add venue routes to `BusinessNavigator.tsx`
- Update navigation types
- Add venue management to business dashboard
- Implement proper navigation flow

## Implementation Strategy

### Incremental Development Approach
Each component implemented with breadcrumb comments:

```typescript
// TODO: Add venue validation logic
// BREADCRUMB: Integrate with map service for coordinates
// BREADCRUMB: Add venue image upload functionality
// BREADCRUMB: Implement venue search and filtering
```

### Database Considerations
- Venues and addresses already have proper foreign key relationships
- RLS policies needed for business data isolation
- Consider adding indexes for venue search performance
- Coordinates field ready for map integration

### Form Validation Requirements
- Venue name: required, min 2 characters
- Capacity: optional, positive integer only
- Address: basic format validation
- City: must be from Turkish cities enum
- Postal code: Turkish postal code format (5 digits)

### Map Integration
- Use existing `@rnmapbox/maps` for coordinate selection
- Integrate with map service in `app/services/map/`
- Support both address input and map picking

## Key Project Patterns to Follow

### Service Layer Pattern (from businessProfileService.ts)
```typescript
// Follow existing Supabase integration pattern
export const createVenue = async (venueData: CreateVenueRequest) => {
  // TODO: Implement using existing service patterns
}
```

### MobX Store Pattern (from BusinessProfileStore.ts)
```typescript
// Follow existing store structure
// Use withSetPropAction for mutations
// Implement proper error handling
```

### Screen Component Pattern
```typescript
// Use observer pattern for MobX reactivity
// Follow existing themed styling approach
// Use translation keys for all text
```

### Testing Strategy
1. Implement functionality first
2. Run TypeScript checks (`npx tsc --noEmit`)
3. Write comprehensive tests
4. Follow existing test patterns in project

## Session Continuation Notes

**For AI Agent Context:**
1. This is venue management for Turkish event/venue businesses
2. Focus on CRUD operations for venues and addresses
3. Use existing database schema (venues + addresses tables)
4. Follow established React Native + MobX patterns
5. Support Turkish cities and postal codes
6. Integrate with existing map service
7. Implement incrementally with breadcrumbs

**Current Database Status:**
- ✅ Venues table exists with proper structure
- ✅ Addresses table exists with Turkish city support
- ✅ Foreign key relationships established
- ❌ No venue management UI exists yet
- ❌ No venue service layer exists yet

**Next Steps:**
1. Check existing venue-related code in project
2. Implement venue and address TypeScript types
3. Create venue service layer
4. Build MobX venue store
5. Develop venue management screens
6. Add navigation routes

---
*Last Updated: 2025-01-27*
*Ready for venue management implementation*