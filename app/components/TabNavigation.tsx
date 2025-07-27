import React from 'react'
import { View, Text, ViewStyle, FlatList } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MapScreen } from "@/screens/MapScreen"
import { EventCard } from "@/components/EventCard"
import { useStores } from "@/models/helpers/useStores"
import { observer } from 'mobx-react-lite'

// BREADCRUMB: Just added MapView import
// TODO: Update MapTabScreen to use real map components next

const Tab = createMaterialTopTabNavigator()

// Wrapper to adapt props for MapScreen
const MapTabScreen = (props: any) => <MapScreen {...props} />

// BREADCRUMB: Created wrapper for MapScreen to avoid prop issues
// TODO: Create EventListScreen for List tab next

const ListTabScreen = observer(() => {
  const { mapStore } = useStores()

  const loadTestEvents = () => {
    // Temporary test data to verify UI components work  
    const testEvents = [
      {
        instance_id: "test-1",
        event_id: "event-1", 
        venue_id: "venue-1",
        start_datetime: "2025-01-28T19:00:00Z",
        end_datetime: "2025-01-28T22:00:00Z",
        event_instance_status: "active",
        max_attendees: 100,
        event_title: "Test Concert",
        event_description: "A great test event",
        venue_name: "Test Venue",
        venue_capacity: 200,
        coordinates: { type: "Point" as const, coordinates: [29.0, 41.0] },
        full_address: "123 Test Street",
        city: "Test City"
      },
      {
        instance_id: "test-2",
        event_id: "event-2",
        venue_id: "venue-2", 
        start_datetime: "2025-01-29T20:00:00Z",
        end_datetime: "2025-01-29T23:00:00Z",
        event_instance_status: "active",
        max_attendees: 50,
        event_title: "Test Workshop", 
        event_description: "Learn something new",
        venue_name: "Learning Center",
        venue_capacity: 75,
        coordinates: { type: "Point" as const, coordinates: [29.1, 41.1] },
        full_address: "456 Learning Ave",
        city: "Test City"
      }
    ]
    mapStore.setEvents(testEvents as any)
  }

  return (
    <View style={{ flex: 1 }}>
      {mapStore.events.length === 0 && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>No events found</Text>
          <Text style={{ marginBottom: 16, fontSize: 12 }}>Load test events to verify the UI:</Text>
          <Text 
            style={{ color: 'blue', textDecorationLine: 'underline' }}
            onPress={loadTestEvents}
          >
            Load Test Events
          </Text>
        </View>
      )}
      <FlatList
        data={mapStore.events}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={(item) => item.instance_id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
})

// BREADCRUMB: Just completed both placeholder screen components
// TODO: Add Tab.Screen configurations next

export interface TabNavigationProps {
  // No props needed - component will manage its own state
}

// BREADCRUMB: Just simplified TabNavigationProps
// TODO: Move map logic into MapTabScreen component next

export const TabNavigation = (props: TabNavigationProps) => {
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: false,
      }}
    >
      <Tab.Screen name="Map" component={MapTabScreen} />
      <Tab.Screen name="List" component={ListTabScreen} />
    </Tab.Navigator>
  )
}

// BREADCRUMB: Just completed props passing to MapTabScreen
// TODO: Update MapScreen to pass actual props to TabNavigation

// BREADCRUMB: Just completed TabNavigation using existing MapScreen
// TODO: Create EventListScreen for List tab next