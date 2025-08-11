import { TextStyle, ViewStyle } from "react-native"
import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon } from "@/components/Icon"
import { translate } from "@/i18n/translate"
import { BusinessProfileScreen } from "@/screens/BusinessProfileScreen"
import { VenuesScreen } from "@/screens/VenuesScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { BusinessEventNavigator } from "./BusinessEventNavigator"

export type BusinessTabParamList = {
  Events: undefined
  Venues: undefined
  Profile: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 */
export type BusinessTabScreenProps<T extends keyof BusinessTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<BusinessTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<BusinessTabParamList>()

/**
 * This is the business navigator for Enhanced Eventify app.
 * Business-focused navigation with event management, venues, and analytics.
 */
export function BusinessNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Events"
        component={BusinessEventNavigator}
        options={{
          tabBarLabel: translate("common:events"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="view" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Venues"
        component={VenuesScreen}
        options={{
          tabBarLabel: translate("common:venues"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="components" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={BusinessProfileScreen}
        options={{
          tabBarLabel: translate("common:profile"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="settings" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})
