**Note**: This design is not final and can be changed with user permissions and requirements.

```mermaid
classDiagram
    class RootStore {
        -authStore: AuthStore
        -userStores: UserStores?
        -businessStores: BusinessStores?
        +initializeForUser(userType: UserType): void
        +reset(): void
        +getCurrentStores(): UserStores | BusinessStores
    }

    class AuthStore {
        -isAuthenticated: boolean
        -accessToken: string?
        -refreshToken: string?
        -currentUser: User?
        -currentBusiness: Business?
        -isLoading: boolean
        -error: string?
        +signIn(email: string, password: string): Promise~void~
        +signOut(): void
        +refreshToken(): Promise~void~
        +getCurrentUserType(): UserType
        +isBusinessUser: boolean
        +isRegularUser: boolean
    }

    class UserStores {
        -userLocationStore: UserLocationStore
        -userEventStore: UserEventStore
        -userProfileStore: UserProfileStore
        -userUIStore: UserUIStore
        +initialize(): void
        +reset(): void
    }

    class BusinessStores {
        -businessLocationStore: BusinessLocationStore
        -businessEventStore: BusinessEventStore
        -businessVenueStore: BusinessVenueStore
        -businessProfileStore: BusinessProfileStore
        -businessUIStore: BusinessUIStore
        +initialize(): void
        +reset(): void
    }

    class UserLocationStore {
        -userLocation: Location?
        -mapBounds: BoundingBox?
        -locationPermission: PermissionStatus
        -isQuerying: boolean
        +requestLocationPermission(): Promise~void~
        +updateUserLocation(lat: number, lng: number): void
        +updateMapBounds(bounds: BoundingBox): void
        +triggerEventQuery(): void
        +hasLocation: boolean
        +currentCenter: Point
    }

    class UserEventStore {
        -currentInstances: EventInstance[]
        -searchFilters: SearchFilters
        -isLoading: boolean
        -selectedInstance: EventInstance?
        -currentBounds: BoundingBox?
        +fetchEventsByBounds(bounds: BoundingBox, filters: SearchFilters): Promise~void~
        +applyFilters(filters: SearchFilters): Promise~void~
        +selectInstance(instanceId: string): void
        +hasActiveFilters: boolean
    }

    class UserProfileStore {
        -profile: UserProfile
        -preferences: UserPreferences
        -isProfileComplete: boolean
        -isLoading: boolean
        +updateProfile(data: UserProfileData): Promise~void~
        +updatePreferences(prefs: UserPreferences): void
        +checkProfileCompletion(): boolean
        +loadProfile(): Promise~void~
    }

    class UserUIStore {
        -currentScreen: string
        -isLoading: boolean
        -error: string?
        -mapViewMode: string
        +setCurrentScreen(screen: string): void
        +setLoading(loading: boolean): void
        +setError(error: string?): void
        +setMapViewMode(mode: string): void
    }

    class BusinessLocationStore {
        -businessLocation: Location?
        -venueAddresses: Map~string, Address~
        -mapBounds: BoundingBox?
        -isGeocoding: boolean
        +setBusinessLocation(location: Location): void
        +addVenueAddress(venueId: string, address: Address): void
        +geocodeAddress(address: string): Promise~Coordinates~
        +updateMapBounds(bounds: BoundingBox): void
        +getVenueLocation(venueId: string): Address?
    }

    class BusinessEventStore {
        -myEvents: Map~string, BusinessEvent~
        -eventInstances: Map~string, EventInstance~
        -isLoading: boolean
        -selectedEvent: BusinessEvent?
        +createEvent(eventData: EventData): Promise~BusinessEvent~
        +scheduleInstance(data: InstanceData): Promise~EventInstance~
        +updateEvent(id: string, data: EventData): Promise~void~
        +deleteEvent(id: string): Promise~void~
        +loadMyEvents(): Promise~void~
        +getEventInstances(eventId: string): EventInstance[]
    }

    class BusinessVenueStore {
        -myVenues: Map~string, Venue~
        -isLoading: boolean
        -selectedVenue: Venue?
        +createVenue(venueData: VenueData): Promise~Venue~
        +updateVenue(id: string, data: VenueData): Promise~void~
        +deleteVenue(id: string): Promise~void~
        +loadMyVenues(): Promise~void~
        +getVenueById(id: string): Venue?
        +venueCount: number
    }

    class BusinessProfileStore {
        -profile: BusinessProfile
        -verificationStatus: VerificationStatus
        -businessSettings: BusinessSettings
        -isLoading: boolean
        +updateProfile(data: BusinessProfileData): Promise~void~
        +submitVerification(docs: Documents): Promise~void~
        +updateSettings(settings: BusinessSettings): void
        +loadProfile(): Promise~void~
        +isVerified: boolean
    }

    class BusinessUIStore {
        -currentScreen: string
        -isLoading: boolean
        -error: string?
        -dashboardTab: string
        +setCurrentScreen(screen: string): void
        +setLoading(loading: boolean): void
        +setError(error: string?): void
        +setDashboardTab(tab: string): void
    }

    %% Relationships
    RootStore *-- AuthStore : contains
    RootStore o-- UserStores : contains
    RootStore o-- BusinessStores : contains
    
    UserStores *-- UserLocationStore : contains
    UserStores *-- UserEventStore : contains
    UserStores *-- UserProfileStore : contains
    UserStores *-- UserUIStore : contains
    
    BusinessStores *-- BusinessLocationStore : contains
    BusinessStores *-- BusinessEventStore : contains
    BusinessStores *-- BusinessVenueStore : contains
    BusinessStores *-- BusinessProfileStore : contains
    BusinessStores *-- BusinessUIStore : contains

    %% Dependencies
    UserEventStore ..> UserLocationStore : depends on
    BusinessEventStore ..> BusinessVenueStore : depends on
    BusinessVenueStore ..> BusinessLocationStore : depends on
```