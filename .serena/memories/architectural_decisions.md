# Architectural Decisions - Enhanced Eventify App

## State Management: MobX State Tree

**Decision Date**: Project inception
**Decision**: Use MobX State Tree instead of Redux/Zustand
**Reasoning**: 
- Better TypeScript integration
- Predictable updates and debugging
- Time-travel debugging capabilities
- Structured data modeling

**Stores Structure**:
- `AuthStore`: User authentication and session management
- `UserProfileStore`: User profile data and preferences
- `BusinessProfileStore`: Business profile management
- `MapStore`: Map state and venue data

## Testing Strategy: Modified TDD

**Decision Date**: January 2025
**Decision**: Implement first, then write comprehensive tests
**Reasoning**: 
- Better fits rapid prototyping needs
- Allows for faster iteration during development
- Still maintains test coverage requirements

**Testing Stack**:
- Jest + React Native Testing Library for unit/integration
- Maestro for end-to-end mobile testing
- Manual testing for complex user flows

## Navigation Architecture

**Decision**: BottomTab → TopTab → Screens pattern
**Reasoning**: 
- Avoids navigation prop conflicts
- Cleaner prop flow through React Navigation
- Better gesture handling (no swipe conflicts)

**Pattern**:
```
AppNavigator (Stack)
├── AuthNavigator (Stack) 
├── UserNavigator (BottomTab)
│   └── Profile Tab (MaterialTopTab)
│       ├── ProfileScreen
│       └── UserProfileScreen
└── BusinessNavigator (BottomTab)
```

## Internationalization Strategy

**Decision**: i18next with namespace organization
**Languages**: English (primary) + Turkish
**Pattern**: Feature-based namespaces (`eventListing:`, `map:`, `profile:`)

## Theme System

**Decision**: Custom ThemedStyle system over styled-components
**Reasoning**:
- Better performance with React Native
- Platform-specific styling support
- Type-safe theme access
- Consistent spacing system

## Cross-Platform Strategy

**Decision**: Expo with custom dev client
**Web Strategy**: React Native Web with platform-specific components where needed
**Map Strategy**: @rnmapbox/maps with universal components (MarkerView > PointAnnotation)