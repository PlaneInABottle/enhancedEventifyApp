import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { CompositeScreenProps } from "@react-navigation/native"

import { BusinessEventFormScreen } from "@/screens/BusinessEventFormScreen"
import { BusinessEventListScreen } from "@/screens/BusinessEventListScreen"

import type { BusinessTabScreenProps } from "./BusinessNavigator"

export type BusinessEventStackParamList = {
  EventList: undefined
  CreateEvent: undefined
  EditEvent: { eventId: string }
  EventDetail: { eventId: string }
}

/**
 * Helper for automatically generating navigation prop types for each route.
 */
export type BusinessEventStackScreenProps<T extends keyof BusinessEventStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<BusinessEventStackParamList, T>,
    BusinessTabScreenProps<"Events">
  >

const Stack = createNativeStackNavigator<BusinessEventStackParamList>()

/**
 * This is the business event navigator for the Enhanced Eventify app.
 * Handles the event management flow including list, create, edit, and detail views.
 */
export function BusinessEventNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="EventList"
    >
      <Stack.Screen
        name="EventList"
        component={BusinessEventListScreen}
      />
      
      <Stack.Screen
        name="CreateEvent"
        component={BusinessEventFormScreen}
      />
      
      <Stack.Screen
        name="EditEvent"
        component={BusinessEventFormScreen}
      />
    </Stack.Navigator>
  )
}