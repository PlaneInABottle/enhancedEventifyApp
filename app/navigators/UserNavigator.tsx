import { TextStyle, ViewStyle } from "react-native"
import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { observer } from "mobx-react-lite"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon } from "@/components/Icon"
import { TabNavigation } from "@/components/TabNavigation"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import { MapScreen } from "@/screens/MapScreen"
import { UserProfileScreen } from "@/screens/UserProfileScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"

export type UserTabParamList = {
  Map: undefined
  Profile: undefined
  Moderate: undefined // Optional tab for moderators
}

/**
 * Helper for automatically generating navigation prop types for each route.
 */
export type UserTabScreenProps<T extends keyof UserTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<UserTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<UserTabParamList>()

/**
 * This is the user navigator for Enhanced Eventify app.
 * User-focused navigation with event discovery, map, and profile.
 * Includes conditional moderation tab for moderators.
 */
export const UserNavigator = observer(function UserNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const {
    authenticationStore: { isModerator, isAdmin },
  } = useStores()

  // Show moderation tab for moderators and admins
  const showModerationTab = isModerator || isAdmin

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
        name="Map"
        component={TabNavigation}
        options={{
          tabBarLabel: translate("common:map"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="pin" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: translate("common:profile"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="settings" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      {showModerationTab && (
        <Tab.Screen
          name="Moderate"
          component={MapScreen} // TODO: Replace with ModerationScreen
          options={{
            tabBarLabel: translate("userNavigator:moderate"),
            tabBarIcon: ({ focused }) => (
              <Icon icon="lock" color={focused ? colors.tint : colors.tintInactive} size={30} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  )
})

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
