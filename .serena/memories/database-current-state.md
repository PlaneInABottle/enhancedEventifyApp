# Current Database State - Updated

## Tables Structure
- **addresses**: Has `coordinates` column of type `geography` (PostGIS extension)
- **venues**: Links to addresses via `address_id`
- **PostGIS extension**: Installed and active

## RPC Functions Status
### Still Exists (but no longer used by our app):
- `insert_address_with_coordinates` - NOT USED (using direct insert)
- `update_address_coordinates` - NOT USED (using direct update)
- `update_address_with_coordinates` - NOT USED (using direct update)
- `create_address_with_coordinates` - NOT USED (using direct insert)
- `get_venues_by_business` - STILL USED (returns venues with formatted addresses)
- `get_coordinates_as_geojson` - NOT USED (but could be useful)

### Should Clean Up:
The first 4 RPC functions can be removed as we now use direct PostgREST operations.

## Coordinate Storage - RESOLVED ✅
- **Storage**: `geography` column type with PostGIS
- **Insert/Update Format**: Direct `Point(longitude latitude)` string
- **Select Format**: Returns as binary/hex string (requires processing)
- **RPC Format**: Returns as GeoJSON object with lat/lng fields

## Current Implementation
- ✅ Direct PostgREST operations for insert/update using `Point(lng lat)` format
- ✅ No more complex RPC functions for coordinate handling
- ✅ `get_venues_by_business` RPC still used for listing (returns consistent format)
- ✅ After venue creation, we refresh the list to ensure format consistency

## PostGIS Coordinate Formats
1. **WKT (Well-Known Text)**: `Point(29.0 41.0)` - What we use for insert/update
2. **Binary/Hex**: `0101000020E6100000...` - What PostGIS returns on direct select
3. **GeoJSON**: `{"type":"Point","coordinates":[29,41]}` - What RPC returns

## Translation Keys
- Fixed all translation keys to use colon (:) notation instead of dot (.)
- Format: `"namespace:key"` (e.g., `"errors:postalCodeInvalid"`)
- All error messages now display properly translated text