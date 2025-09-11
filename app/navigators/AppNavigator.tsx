/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { ComponentProps } from "react"
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"

import Config from "@/config"
import { useStores } from "@/models"
import { EnhancedEventifyWelcomeScreen } from "@/screens/EnhancedEventifyWelcomeScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LoginScreen } from "@/screens/LoginScreen"
import { SignUpScreen } from "@/screens/SignUpScreen"
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen"
import { useAppTheme } from "@/theme/context"

import { BusinessNavigator, BusinessTabParamList } from "./BusinessNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { UserNavigator, UserTabParamList } from "./UserNavigator"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type AppStackParamList = {
  Login: undefined
  SignUp: undefined
  ForgotPassword: undefined
  Welcome: undefined
  User: NavigatorScreenParams<UserTabParamList>
  Business: NavigatorScreenParams<BusinessTabParamList>
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = observer(function AppStack() {
  const {
    authenticationStore: { isAuthenticated, shouldUseBusinessFlow, shouldUseUserFlow },
  } = useStores()

  const {
    theme: { colors },
  } = useAppTheme()

  // Determine which navigator to use based on user type
  const getMainNavigator = () => {
    if (shouldUseBusinessFlow) {
      return <Stack.Screen name="Business" component={BusinessNavigator} />
    } else {
      // Default to user flow for all other cases
      return <Stack.Screen name="User" component={UserNavigator} />
    }
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? (shouldUseBusinessFlow ? "Business" : "User") : "Welcome"}
    >
      {isAuthenticated ? (
        <>{getMainNavigator()}</>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={EnhancedEventifyWelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
})

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}

export const AppNavigator = observer(function AppNavigator(props: NavigationProps) {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
})
