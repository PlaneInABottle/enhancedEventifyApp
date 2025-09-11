import { FC, useState } from "react"
import { ActivityIndicator, ViewStyle, TextStyle } from "react-native"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"

interface ForgotPasswordScreenProps extends AppStackScreenProps<"ForgotPassword"> {}

export const ForgotPasswordScreen: FC<ForgotPasswordScreenProps> = observer(
  function ForgotPasswordScreen({ navigation }) {
    const { authenticationStore } = useStores()
    const {
      themed,
      theme: { colors },
    } = useAppTheme()

    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async () => {
      if (submitted) return
      const result = await authenticationStore.requestPasswordReset(email.trim())
      if (result.success) {
        setSubmitted(true)
      }
    }

    return (
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text tx="forgotPassword:title" preset="heading" style={themed($title)} />
        <Text
          tx={submitted ? "forgotPassword:checkEmail" : "forgotPassword:enterEmail"}
          preset="subheading"
          style={themed($subtitle)}
        />

        {authenticationStore.lastError && !submitted && (
          <Text
            text={translate(authenticationStore.lastError as any)}
            size="sm"
            weight="light"
            style={themed($errorText)}
          />
        )}

        {!submitted && (
          <>
            <TextField
              value={email}
              onChangeText={setEmail}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              labelTx="forgotPassword:emailLabel"
              placeholderTx="forgotPassword:emailPlaceholder"
              editable={!authenticationStore.isLoading}
            />
            <Button
              tx={
                authenticationStore.isLoading
                  ? "forgotPassword:sending"
                  : "forgotPassword:sendButton"
              }
              onPress={handleSubmit}
              disabled={authenticationStore.isLoading || !email}
              preset="reversed"
              style={themed($submitButton)}
              RightAccessory={
                authenticationStore.isLoading
                  ? () => <ActivityIndicator size="small" color={colors.background} />
                  : undefined
              }
            />
          </>
        )}

        {submitted && (
          <Button
            tx="forgotPassword:backToLogin"
            onPress={() => navigation.navigate("Login")}
            preset="default"
            style={themed($backButton)}
          />
        )}

        <Button
          tx="forgotPassword:cancel"
          onPress={() => navigation.goBack()}
          preset="default"
          style={themed($cancelButton)}
        />
      </Screen>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $submitButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $cancelButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
