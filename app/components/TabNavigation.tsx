import React from 'react'
import { View, Text } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

const Tab = createMaterialTopTabNavigator()

const MapTabScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Map View Placeholder</Text>
  </View>
)

const ListTabScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Event List Placeholder</Text>
  </View>
)

// BREADCRUMB: Just completed both placeholder screen components
// TODO: Add Tab.Screen configurations next

export interface TabNavigationProps {
  // TODO: Add specific props as needed
}

export const TabNavigation = (props: TabNavigationProps) => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapTabScreen} />
      <Tab.Screen name="List" component={ListTabScreen} />
    </Tab.Navigator>
  )
}

// BREADCRUMB: Just completed basic TabNavigation with Map and List screens
// TODO: Integrate this component into MapScreen next