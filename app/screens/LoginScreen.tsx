import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, ActivityIndicator } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen({ navigation }) {
  const passwordInput = useRef<TextInput>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const { authenticationStore } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    // Clear any previous errors when component mounts
    authenticationStore.clearError()
  }, [])

  const handleLogin = async () => {
    await authenticationStore.signIn({
      email: email.trim(),
      password,
    })
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
            testID="password-toggle"
          />
        )
      },
    [isPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text testID="login-heading" tx="loginScreen:logIn" preset="heading" style={themed($logIn)} />
      <Text tx="loginScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />

      {authenticationStore.lastError && (
        <Text
          text={translate(authenticationStore.lastError as any)}
          size="sm"
          weight="light"
          style={themed($errorText)}
        />
      )}

      <TextField
        value={email}
        onChangeText={setEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="loginScreen:emailFieldLabel"
        placeholderTx="loginScreen:emailFieldPlaceholder"
        onSubmitEditing={() => passwordInput.current?.focus()}
        editable={!authenticationStore.isLoading}
      />

      <TextField
        ref={passwordInput}
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        labelTx="loginScreen:passwordFieldLabel"
        placeholderTx="loginScreen:passwordFieldPlaceholder"
        onSubmitEditing={handleLogin}
        RightAccessory={PasswordRightAccessory}
        editable={!authenticationStore.isLoading}
      />

      <Button
        testID="forgot-password-link"
        tx="loginScreen:forgotPassword"
        style={themed($forgotPasswordLink)}
        preset="default"
        onPress={() => navigation.navigate("ForgotPassword")}
        disabled={authenticationStore.isLoading}
      />

      <Button
        testID="login-button"
        tx={authenticationStore.isLoading ? "loginScreen:signingIn" : "loginScreen:tapToLogIn"}
        style={themed($tapButton)}
        preset="reversed"
        onPress={handleLogin}
        disabled={authenticationStore.isLoading}
        RightAccessory={
          authenticationStore.isLoading
            ? (props) => (
                <ActivityIndicator
                  size="small"
                  color={colors.background}
                  style={themed($loadingIndicator)}
                  testID="loading-indicator"
                />
              )
            : undefined
        }
      />

      <Button
        testID="signup-link"
        tx="loginScreen:dontHaveAccount"
        style={themed($signUpLink)}
        preset="default"
        onPress={() => navigation.navigate("SignUp")}
        disabled={authenticationStore.isLoading}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $loadingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.xs,
})

const $signUpLink: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $forgotPasswordLink: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})
