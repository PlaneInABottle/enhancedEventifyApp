import React from 'react'
import { View, FlatList, ViewStyle, TextStyle } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MapScreen } from "@/screens/MapScreen"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { EventCard } from "@/components/EventCard"
import { useStores } from "@/models/helpers/useStores"
import { useAppTheme } from "@/theme/context"
import { observer } from 'mobx-react-lite'
import type { ThemedStyle } from "@/theme/types"

// BREADCRUMB: Just added MapView import
// TODO: Update MapTabScreen to use real map components next

const Tab = createMaterialTopTabNavigator()

// Wrapper to adapt props for MapScreen
const MapTabScreen = (props: any) => <MapScreen {...props} />

// BREADCRUMB: Created wrapper for MapScreen to avoid prop issues
// TODO: Create EventListScreen for List tab next

const ListTabScreen = observer(() => {
  const { mapStore } = useStores()
  const { themed } = useAppTheme()

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
        event_title: "Jazz Night at Downtown",
        event_description: "Experience an incredible evening of smooth jazz with local artists in an intimate venue setting",
        venue_name: "Blue Note Cafe",
        venue_capacity: 200,
        coordinates: { type: "Point" as const, coordinates: [29.0, 41.0] },
        full_address: "123 Music Street, Downtown",
        city: "Istanbul"
      },
      {
        instance_id: "test-2",
        event_id: "event-2",
        venue_id: "venue-2", 
        start_datetime: "2025-01-29T20:00:00Z",
        end_datetime: "2025-01-29T23:00:00Z",
        event_instance_status: "active",
        max_attendees: 50,
        event_title: "Photography Workshop", 
        event_description: "Learn advanced portrait photography techniques from professional photographers",
        venue_name: "Creative Studio",
        venue_capacity: 75,
        coordinates: { type: "Point" as const, coordinates: [29.1, 41.1] },
        full_address: "456 Art Avenue, Beyoğlu",
        city: "Istanbul"
      },
      {
        instance_id: "test-3",
        event_id: "event-3",
        venue_id: "venue-3", 
        start_datetime: "2025-01-30T18:00:00Z",
        end_datetime: "2025-01-30T21:00:00Z",
        event_instance_status: "active",
        max_attendees: 150,
        event_title: "Food & Wine Tasting",
        event_description: "Discover local flavors and international wines",
        venue_name: "Rooftop Restaurant",
        venue_capacity: 200,
        coordinates: { type: "Point" as const, coordinates: [28.9, 41.05] },
        full_address: "789 Taste Boulevard, Kadıköy",
        city: "Istanbul"
      }
    ]
    mapStore.setEvents(testEvents as any)
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)}>
      {mapStore.events.length === 0 && (
        <View style={themed($emptyStateContainer)}>
          <Text preset="subheading" style={themed($emptyStateTitle)}>
            No events found
          </Text>
          <Text size="sm" style={themed($emptyStateSubtitle)}>
            Load test events to verify the UI:
          </Text>
          <Text 
            style={themed($loadButton)}
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
        contentContainerStyle={themed($listContainer)}
      />
    </Screen>
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

const $screenContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $emptyStateContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing.xl,
})

const $emptyStateTitle: ThemedStyle<ViewStyle> = (theme) => ({
  textAlign: 'center',
  marginBottom: theme.spacing.sm,
})

const $emptyStateSubtitle: ThemedStyle<TextStyle> = (theme) => ({
  textAlign: 'center',
  color: theme.colors.textDim,
  marginBottom: theme.spacing.lg,
})

const $loadButton: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.tint,
  textDecorationLine: 'underline',
  fontWeight: '600',
})

const $listContainer: ThemedStyle<ViewStyle> = (theme) => ({
  paddingTop: theme.spacing.sm,
  paddingBottom: theme.spacing.xl,
})