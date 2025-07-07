# Enhanced Eventify MVP Database Implementation Notes

**Note**: This design is not final and can be changed with user permissions and requirements.

## Overview
Implementation notes and technical details for the Phase 1 MVP database structure.

## Implementation Status
- **Database**: Supabase PostgreSQL with PostGIS
- **Tables**: 6 core tables implemented
- **RLS**: Enabled on all tables
- **Spatial**: Full PostGIS support for bounding box queries

## Table Implementation Details

### user_profiles
- **Purpose**: Basic user profile data for authenticated users
- **Authentication**: Links to Supabase auth.users via foreign key
- **Localization**: Uses turkish_city enum for location
- **Profile Completion**: Tracks if user has completed required fields

### business_profiles  
- **Purpose**: Business registration and verification data
- **Multi-type Support**: Array field allows businesses to have multiple types
- **Verification**: Status tracking for manual business approval
- **Same Auth**: Uses same auth.users table as regular users (role differentiation in app)

### addresses
- **Purpose**: Centralized address management with geocoding
- **Spatial**: PostGIS geography type for coordinates
- **Performance**: GIST index on coordinates for fast spatial queries
- **Reusable**: Shared by venues, future user addresses, etc.

### venues
- **Purpose**: Physical locations owned by businesses
- **Ownership**: Each venue belongs to exactly one business
- **Location**: References addresses table for geographic data
- **Capacity**: Optional field for venue size limits

### events
- **Purpose**: Event information and metadata
- **Separation**: Intentionally separated from scheduling (event_instances)
- **Ownership**: Created and managed by businesses only
- **Reusable**: Same event can have multiple instances

### event_instances
- **Purpose**: Specific scheduled occurrences of events
- **Scheduling**: Links event + venue + time
- **Status**: Tracks lifecycle (scheduled → completed/cancelled)
- **Capacity**: Optional attendee limits per instance

## Row Level Security (RLS) Policies

### user_profiles
```sql
-- Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles  
  FOR UPDATE USING (auth.uid() = id);
```

### business_profiles
```sql
-- Business users can only see and edit their own profile
CREATE POLICY "Business can view own profile" ON business_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Business can update own profile" ON business_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### venues
```sql
-- Anyone can view venues, only business owner can modify
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Business can manage own venues" ON venues
  FOR ALL USING (auth.uid() = business_id);
```

### events
```sql
-- Anyone can view events, only business owner can modify  
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Business can manage own events" ON events
  FOR ALL USING (auth.uid() = business_id);
```

### event_instances
```sql
-- Anyone can view instances, only business owner can modify
CREATE POLICY "Anyone can view event instances" ON event_instances
  FOR SELECT USING (true);

CREATE POLICY "Business can manage own event instances" ON event_instances
  FOR ALL USING (
    auth.uid() = (
      SELECT business_id FROM events WHERE id = event_instances.event_id
    )
  );
```

## Key Indexes

```sql
-- Spatial index for bounding box queries (critical for performance)
CREATE INDEX idx_addresses_coordinates ON addresses USING GIST (coordinates);

-- Business entity lookups
CREATE INDEX idx_venues_business_id ON venues (business_id);
CREATE INDEX idx_events_business_id ON events (business_id);

-- Event scheduling queries
CREATE INDEX idx_event_instances_venue_id ON event_instances (venue_id);
CREATE INDEX idx_event_instances_event_id ON event_instances (event_id);
CREATE INDEX idx_event_instances_datetime ON event_instances (start_datetime, end_datetime);

-- Status filtering
CREATE INDEX idx_event_instances_status ON event_instances (event_instance_status);
```

## Critical Spatial Queries

### Bounding Box Event Discovery
```sql
-- Main query for map-based event discovery
SELECT 
  ei.id as instance_id,
  ei.start_datetime,
  ei.end_datetime,
  ei.event_instance_status,
  ei.max_attendees,
  e.id as event_id,
  e.title,
  e.description,
  v.id as venue_id,
  v.name as venue_name,
  v.description as venue_description,
  v.capacity as venue_capacity,
  a.full_address,
  a.city,
  a.coordinates,
  bp.id as business_id,
  bp.business_name,
  bp.business_types
FROM event_instances ei
JOIN events e ON ei.event_id = e.id
JOIN venues v ON ei.venue_id = v.id  
JOIN addresses a ON v.address_id = a.id
JOIN business_profiles bp ON e.business_id = bp.id
WHERE a.coordinates && ST_MakeEnvelope($1, $2, $3, $4, 4326)
AND ei.start_datetime >= NOW()
AND ei.event_instance_status = 'scheduled'
AND v.is_active = true
ORDER BY ei.start_datetime
LIMIT 100;
```

## Performance Considerations

### Optimizations Implemented
- **Spatial Indexing**: GIST index on coordinates for O(log n) bounding box queries
- **Selective Queries**: RLS automatically filters data at database level
- **Denormalized Reads**: Single query with joins for event discovery
- **Status Filtering**: Index on event_instance_status for active events only

### Query Performance Targets
- **Bounding Box Query**: < 100ms for 100 results
- **Business Data Load**: < 50ms for venues and events
- **Profile Updates**: < 25ms for simple CRUD operations

## Data Integrity

### Enforced Constraints
- Foreign key relationships prevent orphaned records
- Check constraints on max_attendees (> 0 or NULL)
- Business types array must have at least one element
- Event instances must have valid start/end times

### Automatic Timestamps
- All tables have created_at and updated_at
- Updated via database triggers for consistency
- Timezone-aware (TIMESTAMPTZ)

## Migration Strategy

### Current Version
- Schema version: 1.0 (MVP)
- All tables created with proper indexes and RLS
- PostGIS extension enabled

### Future Migrations
- Phase 2: Add event_categories table
- Phase 3: Add commerce tables (orders, payments)
- Phase 4: Add social tables (chat, reviews)
- Phase 5: Add analytics and advanced business tables

## Known Limitations

### MVP Simplifications
- **No Categories**: Events not categorized (coming in Phase 2)
- **No Media**: No image/media support yet
- **No Favorites**: User favorites system not implemented
- **No Reviews**: Rating/review system not implemented
- **Basic Search**: Only text search, no advanced filtering

### Technical Debt
- Some denormalization needed for performance in future phases
- May need to add caching layer for high-traffic queries
- Consider read replicas for analytics queries in Phase 5

## Deployment Notes

### Supabase Configuration
- Project: enhancedEventify
- Region: Europe (closest to Turkey)
- PostGIS enabled
- RLS enforced on all tables
- Connection pooling: PgBouncer enabled

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

---

**Last Updated**: January 2025  
**Schema Version**: 1.0 (MVP)  
**Next Review**: Before Phase 2 implementation