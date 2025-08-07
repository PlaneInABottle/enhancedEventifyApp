# Current Database State Analysis

## Tables Structure
- **addresses**: Has `coordinates` column of type `geography` (PostGIS extension)
- **venues**: Links to addresses via `address_id`
- **PostGIS extension**: Installed and active

## Current RPC Functions
- `insert_address_with_coordinates` - Creates address with coordinates
- `update_address_coordinates` - Updates coordinates separately  
- `update_address_with_coordinates` - Combined update function
- `create_address_with_coordinates` - Alternative creation function

## Key Issue
We're currently using RPC functions to work around PostgREST limitations with PostGIS geography columns. The original Eventify used direct insertions with `Point(lng lat)` format.

## Coordinate Storage
- Current: `geography` column type with GeoJSON format
- Original Eventify: Likely used `POINT` type with WKT format `Point(longitude latitude)`

## Next Steps
Need to check if we can switch to direct PostgREST operations using `Point(lng lat)` format instead of complex RPC functions.