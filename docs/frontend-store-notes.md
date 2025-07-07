# Frontend Store Architecture Implementation Notes

**Note**: This design is not final and can be changed with user permissions and requirements.

## Overview
Implementation notes for the MobX-State-Tree store architecture with complete user/business separation and shared authentication.

## Architecture Principles

### 1. Shared Authentication Only
- **AuthStore**: Single shared store for authentication logic
- **User/Business Separation**: Complete separation for all other functionality
- **Conditional Initialization**: RootStore initializes either UserStores OR BusinessStores based on user type

### 2. Store Isolation
- **Zero Cross-Contamination**: User and business stores are completely independent
- **Memory Efficiency**: Only load stores relevant to current user type
- **Clear Boundaries**: Each user type has tailored stores for their workflows

### 3. Performance Optimization
- **Spatial Queries**: Optimized for bounding box queries and map-based discovery
- **Mobile-First**: Single operations instead of nested transformations
- **Efficient Caching**: Store-level caching for frequently accessed data

## Store Responsibilities

### Shared Store

#### AuthStore
**Purpose**: Central authentication and user type management
**Responsibilities**:
- User authentication (login/logout/token refresh)
- User type determination (regular user vs business user)
- Session management and persistence
- Provides user context to other stores

**Key Features**:
- Handles both user and business authentication flows
- Determines which store set to initialize
- Manages access tokens and refresh logic
- Provides computed properties for user type checks

### User Stores (Regular Users)

#### UserLocationStore
**Purpose**: Location management for event discovery
**Responsibilities**:
- User location tracking and permissions
- Map viewport management for discovery
- Bounding box calculations for spatial queries
- Triggers event queries when map bounds change

**Key Features**:
- Location permission handling
- Map bounds tracking with debounced queries
- Integration with UserEventStore for spatial discovery

#### UserEventStore
**Purpose**: Event discovery and browsing
**Responsibilities**:
- Spatial event queries using bounding box
- Event filtering and search functionality
- Event instance selection and detail management
- Cache management for discovered instances

**Key Features**:
- Bounding box spatial queries to Supabase
- Client-side filtering on fetched results
- Search functionality across event titles/descriptions
- Event clustering for map display (future)

#### UserProfileStore
**Purpose**: User profile and preferences management
**Responsibilities**:
- User profile CRUD operations
- User preferences and settings
- Profile completion tracking
- Personal data management

#### UserUIStore
**Purpose**: User app UI state management
**Responsibilities**:
- Navigation state for user app
- Loading states and error handling
- Map view mode management
- User-specific UI preferences

### Business Stores (Business Users)

#### BusinessLocationStore
**Purpose**: Location management for business operations
**Responsibilities**:
- Business location and venue address management
- Geocoding services for venue addresses
- Map viewport for business venue management
- Address validation and storage

**Key Features**:
- Venue address management
- Geocoding integration for address validation
- Business location context for venue creation

#### BusinessEventStore
**Purpose**: Event creation and management
**Responsibilities**:
- Business event CRUD operations
- Event instance scheduling and management
- Event status tracking (draft/published/cancelled)
- Event analytics and performance tracking

**Key Features**:
- Event creation with venue assignment
- Event instance scheduling with time/venue management
- Event status workflow management
- Integration with BusinessVenueStore for venue selection

#### BusinessVenueStore
**Purpose**: Venue creation and management
**Responsibilities**:
- Business venue CRUD operations
- Venue capacity and amenities management
- Venue status tracking (active/inactive)
- Venue-address relationship management

**Key Features**:
- Venue creation with address geocoding
- Venue capacity and amenities management
- Integration with BusinessLocationStore for address management

#### BusinessProfileStore
**Purpose**: Business profile and verification management
**Responsibilities**:
- Business profile CRUD operations
- Business verification status tracking
- Business settings and configuration
- Business capabilities management

**Key Features**:
- Business verification workflow
- Business type management (restaurant, bar, cafe, event_organizer)
- Business settings and preferences

#### BusinessUIStore
**Purpose**: Business dashboard UI state management
**Responsibilities**:
- Navigation state for business dashboard
- Loading states and error handling
- Dashboard tab management
- Business-specific UI preferences

## Data Flow Patterns

### User Discovery Flow
1. User opens app → AuthStore authenticates → RootStore initializes UserStores
2. UserLocationStore gets location → triggers bounding box query
3. UserEventStore queries events within bounds → caches results
4. User pans map → UserLocationStore updates bounds → triggers new query
5. User applies filters → UserEventStore filters cached results client-side

### Business Management Flow
1. Business user logs in → AuthStore determines business type → RootStore initializes BusinessStores
2. BusinessProfileStore loads business data
3. BusinessVenueStore loads venues → BusinessLocationStore manages addresses
4. Business creates event → BusinessEventStore creates event → references BusinessVenueStore

## Store Dependencies

### Dependency Graph
```
AuthStore (shared)
├── UserStores
│   ├── UserLocationStore
│   ├── UserEventStore (depends on UserLocationStore)
│   ├── UserProfileStore
│   └── UserUIStore
└── BusinessStores
    ├── BusinessLocationStore
    ├── BusinessEventStore (depends on BusinessVenueStore)
    ├── BusinessVenueStore (depends on BusinessLocationStore)
    ├── BusinessProfileStore
    └── BusinessUIStore
```

### Dependency Rules
- **UserEventStore** depends on **UserLocationStore** for bounding box queries
- **BusinessEventStore** depends on **BusinessVenueStore** for venue selection
- **BusinessVenueStore** depends on **BusinessLocationStore** for address management
- All stores can access **AuthStore** for authentication context
- No dependencies between UserStores and BusinessStores

## Performance Considerations

### Spatial Query Optimization
- **Debounced Queries**: Map movements trigger debounced bounding box queries
- **Spatial Caching**: Cache results by geographic tiles for efficiency
- **Single Queries**: Use Supabase joins to fetch event + venue + business data in single query

### Mobile Performance
- **Lazy Loading**: Only initialize stores for current user type
- **Memory Management**: Clear unused data when switching contexts
- **Efficient Updates**: Use MobX computed values to minimize re-renders

### Caching Strategy
- **Event Caching**: UserEventStore caches events by geographic region
- **Profile Caching**: Profile stores cache user/business data locally
- **Image Caching**: Future Phase 2 media caching considerations

## Security Considerations

### Data Isolation
- **Complete Separation**: User and business data never mix in stores
- **RLS Integration**: Stores respect Supabase Row Level Security
- **Token Management**: AuthStore manages tokens securely

### Access Control
- **Store Access**: Only appropriate stores initialized based on user type
- **API Permissions**: Stores only call APIs they're authorized to use
- **Data Validation**: All stores validate data before API calls

## Testing Strategy

### Store Testing
- **Unit Tests**: Each store tested in isolation
- **Integration Tests**: Store interactions and dependencies
- **Mock Data**: Consistent mock data across all store tests

### User Flow Testing
- **Authentication Flows**: Login → store initialization → data loading
- **Discovery Flows**: Location → bounding box → event loading → filtering
- **Management Flows**: Business → venue creation → event creation

## Future Extensibility

### Phase 2 Additions
- Add favorites management to UserStores
- Add media management stores for both user types
- Enhanced search capabilities in UserEventStore

### Phase 3 Commerce
- Add commerce stores to both user types
- Order management for users
- Sales tracking for businesses

### Phase 4 Social Features
- Add communication stores for chat functionality
- Review and rating stores for both user types
- Notification management stores

## Implementation Guidelines

### MobX-State-Tree Patterns
- Use `types.model()` for all store definitions
- Implement proper `actions()` for all state mutations
- Use `views()` for computed properties and getters
- Implement `flow()` for async operations

### Error Handling
- Consistent error state management across all stores
- Proper error propagation to UI stores
- Graceful fallbacks for network failures

### State Persistence
- AuthStore persists tokens securely
- Profile stores cache user data locally
- Location stores remember user preferences

---

**Architecture Version**: 1.0 (MVP)  
**Store Count**: 1 shared + 4 user + 5 business = 10 total stores  
**Next Review**: Before Phase 2 implementation