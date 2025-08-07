# Coordinate Handling Simplification Guide

## Discovery
PostgREST CAN handle direct coordinate updates using `Point(lng lat)` format on geography columns! We were overengineering with RPC functions.

## Original Eventify Pattern
```typescript
lat_long: `Point(${regionRef.current.longitude} ${regionRef.current.latitude})`
```

## Test Results
- ✅ Direct update works: `UPDATE addresses SET coordinates = 'Point(29.0 41.0)'`
- ✅ Coordinate stored correctly as PostGIS geography type
- ✅ Can read back as both binary and text format

## Simplification Plan

### 1. venueService.ts Changes
**BEFORE (overengineered):**
```typescript
// Two-phase update with RPC functions
const { error: addressError } = await supabase.from("addresses").update({...})
const { error: coordError } = await supabase.rpc('update_address_coordinates', {...})
```

**AFTER (simple):**
```typescript
// Single update with Point format
const { error: addressError } = await supabase
  .from("addresses")
  .update({
    full_address: updates.address.full_address,
    city: updates.address.city,
    coordinates: updates.address.coordinates 
      ? `Point(${updates.address.coordinates.coordinates[0]} ${updates.address.coordinates.coordinates[1]})`
      : null
  })
  .eq("id", venue.address_id)
```

### 2. VenueEditModal.tsx Changes
Keep the same coordinate conversion (GeoJSON to {lat, lng} and back) but send Point format to service

### 3. Files to Modify
1. `app/services/venue/venueService.ts` - Simplify coordinate updates
2. `app/components/VenueEditModal.tsx` - Update coordinate format sent to service
3. Remove RPC function dependencies

### 4. Benefits
- ❌ Remove complex RPC functions
- ❌ Remove two-phase updates
- ❌ Remove coordinate update error handling complexity
- ✅ Single atomic update operation
- ✅ Standard PostgREST patterns
- ✅ Matches original Eventify approach

## Implementation Strategy
1. Test direct updates work in all scenarios
2. Update service layer to use Point format
3. Update components to send Point format
4. Remove RPC function calls
5. Test thoroughly to ensure no regressions