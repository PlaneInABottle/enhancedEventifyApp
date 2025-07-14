import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
import { TextInput, TextStyle, ViewStyle, ActivityIndicator } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { Checkbox } from "@/components/Toggle/Checkbox"
import { useStores } from "@/models"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { translate } from "@/i18n/translate"

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

export const SignUpScreen: FC<SignUpScreenProps> = observer(function SignUpScreen({ navigation }) {
  const passwordInput = useRef<TextInput>(null)
  const confirmPasswordInput = useRef<TextInput>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [isBusinessAccount, setIsBusinessAccount] = useState(false)
  
  const { authenticationStore } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    // Clear any previous errors when component mounts
    authenticationStore.clearError()
  }, [])

  const handleSignUp = async () => {
    const result = await authenticationStore.signUp({
      email: email.trim(),
      password,
      confirmPassword,
      userType: isBusinessAccount ? "business" : "user"
    })

    if (result.success && result.requiresEmailVerification) {
      // Navigate to email verification screen or show message
      // For now, we'll just show an alert (you might want to handle this differently)
      navigation.navigate("Login")
    }
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

  const ConfirmPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function ConfirmPasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isConfirmPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
            testID="confirm-password-toggle"
          />
        )
      },
    [isConfirmPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text testID="signup-heading" tx="signUpScreen:signUp" preset="heading" style={themed($signUp)} />
      <Text tx="signUpScreen:createAccount" preset="subheading" style={themed($enterDetails)} />
      
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
        labelTx="signUpScreen:emailFieldLabel"
        placeholderTx="signUpScreen:emailFieldPlaceholder"
        onSubmitEditing={() => passwordInput.current?.focus()}
        editable={!authenticationStore.isLoading}
      />

      <TextField
        ref={passwordInput}
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password-new"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        labelTx="signUpScreen:passwordFieldLabel"
        placeholderTx="signUpScreen:passwordFieldPlaceholder"
        onSubmitEditing={() => confirmPasswordInput.current?.focus()}
        RightAccessory={PasswordRightAccessory}
        editable={!authenticationStore.isLoading}
      />

      <TextField
        ref={confirmPasswordInput}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password-new"
        autoCorrect={false}
        secureTextEntry={isConfirmPasswordHidden}
        labelTx="signUpScreen:confirmPasswordFieldLabel"
        placeholderTx="signUpScreen:confirmPasswordFieldPlaceholder"
        onSubmitEditing={handleSignUp}
        RightAccessory={ConfirmPasswordRightAccessory}
        editable={!authenticationStore.isLoading}
      />

      <Checkbox
        value={isBusinessAccount}
        onValueChange={setIsBusinessAccount}
        containerStyle={themed($toggle)}
        labelTx="signUpScreen:businessAccount"
        editable={!authenticationStore.isLoading}
      />

      <Button
        testID="signup-button"
        tx={authenticationStore.isLoading ? "signUpScreen:signingUp" : "signUpScreen:createAccountButton"}
        style={themed($tapButton)}
        preset="reversed"
        onPress={handleSignUp}
        disabled={authenticationStore.isLoading}
        RightAccessory={authenticationStore.isLoading ? 
          (props) => <ActivityIndicator size="small" color={colors.background} style={themed($loadingIndicator)} testID="loading-indicator" /> : 
          undefined
        }
      />

      <Button
        testID="login-link"
        tx="signUpScreen:alreadyHaveAccount"
        style={themed($loginLink)}
        preset="default"
        onPress={() => navigation.navigate("Login")}
        disabled={authenticationStore.isLoading}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $signUp: ThemedStyle<TextStyle> = ({ spacing }) => ({
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

const $toggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $loginLink: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $loadingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.xs,
})