import React from 'react'
import { View, FlatList, ViewStyle, TextStyle } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapScreen } from "@/screens/MapScreen"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { EventCard } from "@/components/EventCard"
import { useStores } from "@/models/helpers/useStores"
import { useAppTheme } from "@/theme/context"
import { translate } from "@/i18n/translate"
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
          <Text preset="subheading" tx="eventListing:noEventsTitle" />
          <Text size="sm" style={themed($emptySubtitle)} tx="eventListing:noEventsSubtitle" />
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
  const { themed, theme } = useAppTheme()
  const insets = useSafeAreaInsets()
  
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: false,
        tabBarStyle: {
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.separator,
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme.colors.tint,
          height: 2,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.textDim,
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapTabScreen}
        options={{ title: translate("eventListing:mapTab") }}
      />
      <Tab.Screen 
        name="List" 
        component={ListTabScreen}
        options={{ title: translate("eventListing:listTab") }}
      />
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