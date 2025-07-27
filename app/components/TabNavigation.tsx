import React from 'react'
import { View, Text, ViewStyle } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { MapScreen } from "@/screens/MapScreen"

// BREADCRUMB: Just added MapView import
// TODO: Update MapTabScreen to use real map components next

const Tab = createMaterialTopTabNavigator()

// Wrapper to adapt props for MapScreen
const MapTabScreen = (props: any) => <MapScreen {...props} />

// BREADCRUMB: Created wrapper for MapScreen to avoid prop issues
// TODO: Create EventListScreen for List tab next

const ListTabScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Event List Placeholder</Text>
  </View>
)

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