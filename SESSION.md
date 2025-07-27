# Event Listing Feature Development Session

## Feature Overview
Adding event listing functionality to the map screen with 2 tabs:
- **Tab 1**: Current map view with event pins
- **Tab 2**: Event cards list view showing the same events

## Current Implementation Status

### Existing Components Analyzed
- **MapScreen** (`app/screens/MapScreen.tsx`): Main screen with map and search functionality
- **MapStore** (`app/stores/MapStore.ts`): Manages event data with `loadEventsInBounds()` 
- **MapEventInstanceModel** (`app/models/MapModels.ts`): Event data structure

### Current Data Flow
1. User taps "Search This Area" button
2. `handleSearchArea()` gets map bounds via `getMapBounds(mapRef)`
3. `mapStore.loadEventsInBounds(bounds)` fetches events
4. Events stored in `mapStore.events` array
5. Map shows pins (implementation pending)

### Available Event Data Structure
```typescript
MapEventInstanceModel {
  instance_id: string
  event_id: string
  venue_id: string
  start_datetime: string
  end_datetime: string
  event_instance_status: string
  max_attendees: number | null
  event_title: string
  event_description: string | null
  venue_name: string
  venue_capacity: number | null
  coordinates: { type: "Point", coordinates: [longitude, latitude] }
  full_address: string
  city: string
  
  // Computed views:
  longitude: number
  latitude: number
  formattedStartTime: string
}
```

## Implementation Plan

### Phase 1: Tab Structure
- [ ] Create `TabNavigation` component for switching views
- [ ] Modify MapScreen to support tabbed interface
- [ ] Maintain map state when switching tabs

### Phase 2: Event Card Components
- [ ] Design `EventCard` component displaying event info
- [ ] Create `EventCardList` component with scrollable cards
- [ ] Handle loading states and empty results

### Phase 3: Data Integration
- [ ] Connect `mapStore.events` to card list
- [ ] Sync map pins with card data
- [ ] Add user interactions (tap card to show on map)

### Phase 4: Polish & Testing
- [ ] Add smooth transitions between tabs
- [ ] Implement error handling for card view
- [ ] Write comprehensive tests
- [ ] Add accessibility features

## Technical Decisions

### Tab Implementation Approach
**Chosen**: React Navigation material-top-tabs pattern
**Reasoning**: 
- Consistent with app navigation patterns
- Built-in swipe gestures
- Easy state management between tabs

### Component Architecture
```
MapScreen (Container)
├── TabNavigation Component
│   ├── Tab 1: Map View 
│   │   ├── Search Button
│   │   └── MapView (existing)
│   └── Tab 2: List View
│       ├── EventCardList
│       └── EventCard (repeating)
└── Shared: mapStore.events data
```

## Implementation Breadcrumbs

### Next Immediate Steps
1. **Create TabNavigation component** - Start with basic structure
2. **Implement EventCard component** - Design card layout first
3. **Build EventCardList** - Connect to mapStore.events
4. **Integrate with MapScreen** - Replace current structure

### Code Patterns to Follow
- Use `observer` for MobX reactivity
- Follow project theming with `useAppTheme()`
- Add translation keys for all text
- Implement proper TypeScript interfaces
- Write tests incrementally

## Context7 Documentation Notes

### React Navigation Material Top Tabs
**Key Findings:**
- Use `@react-navigation/material-top-tabs` package
- Need `react-native-pager-view` for Expo projects  
- Basic implementation: `createMaterialTopTabNavigator()`
- Supports custom styling via `screenOptions`
- Provides swipe gestures and smooth animations

**Implementation Pattern:**
```javascript
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#e91e63',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { backgroundColor: 'powderblue' },
      }}
    >
      <Tab.Screen name="Map" component={MapView} />
      <Tab.Screen name="List" component={EventList} />
    </Tab.Navigator>
  );
}
```

**Installation Required:**
```bash
npm install @react-navigation/material-top-tabs
npx expo install react-native-pager-view
```

## Session Checkpoints
- **Started**: 2025-01-27 - Initial analysis and planning
- **Current Focus**: Creating comprehensive session documentation

## Key Files Being Modified
- `app/screens/MapScreen.tsx` - Main container for tabs
- `app/components/TabNavigation.tsx` - New tab component
- `app/components/EventCard.tsx` - New event card component  
- `app/components/EventCardList.tsx` - New card list component
- `app/i18n/en.ts` & `app/i18n/tr.ts` - Translation keys

## Testing Strategy
- Unit tests for each new component
- Integration tests for tab switching
- Visual tests for card layouts
- Accessibility tests for screen readers

---

*This document tracks our feature development session and provides context for future AI sessions*