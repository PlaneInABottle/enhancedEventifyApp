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

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)}>
      {mapStore.events.length === 0 && (
        <View style={themed($emptyState)}>
          <Text preset="subheading">No events found</Text>
          <Text size="sm" style={themed($emptySubtitle)}>
            Try adjusting the map view to load events from the area
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
  marginTop: theme.spacing.sm,
})

const $listContainer: ThemedStyle<ViewStyle> = (theme) => ({
  paddingTop: theme.spacing.sm,
  paddingBottom: theme.spacing.xl,
})