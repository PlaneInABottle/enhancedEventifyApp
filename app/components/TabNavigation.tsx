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

const Tab = createMaterialTopTabNavigator()

// Wrapper to adapt props for MapScreen
const MapTabScreen = (props: any) => <MapScreen {...props} />

const ListTabScreen = observer(() => {
  const { mapStore } = useStores()
  const { themed } = useAppTheme()

  const loadTestEvents = () => {
    const generateTestEvents = (count = 3) => 
      Array.from({length: count}, (_, i) => ({
        instance_id: `test-${i + 1}`,
        event_id: `event-${i + 1}`,
        venue_id: `venue-${i + 1}`,
        start_datetime: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        event_instance_status: "active" as const,
        max_attendees: 100 + i * 25,
        event_title: `Test Event ${i + 1}`,
        event_description: `Sample event description ${i + 1}`,
        venue_name: `Test Venue ${i + 1}`,
        venue_capacity: 200,
        coordinates: { type: "Point" as const, coordinates: [29 + i * 0.1, 41 + i * 0.05] },
        full_address: `${123 + i} Test Street`,
        city: "Istanbul"
      }))
    
    mapStore.setEvents(generateTestEvents() as any)
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)}>
      {mapStore.events.length === 0 && (
        <View style={themed($emptyState)}>
          <Text preset="subheading">No events found</Text>
          <Text size="sm" style={themed($emptySubtitle)}>
            Load test events to verify the UI:
          </Text>
          <Text style={themed($loadButton)} onPress={loadTestEvents}>
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

export interface TabNavigationProps {
  // No props needed - component will manage its own state
}

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


const $screenContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $emptyState: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing.xl,
})

const $emptySubtitle: ThemedStyle<TextStyle> = (theme) => ({
  textAlign: 'center',
  color: theme.colors.textDim,
  marginVertical: theme.spacing.md,
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