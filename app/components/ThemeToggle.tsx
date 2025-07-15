import React, { FC } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text } from "./Text"
import { Icon } from "./Icon"
import { translate } from "@/i18n/translate"

export interface ThemeToggleProps {
  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Component for toggling between light, dark, and system theme modes
 */
export const ThemeToggle: FC<ThemeToggleProps> = React.memo(({
  style: $styleOverride,
}) => {
  const { themed, theme, themeContext, setThemeContextOverride } = useAppTheme()

  const toggleTheme = () => {
    // Simple toggle between light and dark
    const newTheme = themeContext === "dark" ? "light" : "dark"
    setThemeContextOverride(newTheme)
  }

  return (
    <TouchableOpacity
      testID="theme-toggle-button"
      style={[themed($container), $styleOverride]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={themed($themeInfo)}>
        <Icon
          icon={themeContext === "dark" ? "hidden" : "view"}
          size={24}
          color={theme.colors.tint}
          containerStyle={themed($themeIcon)}
        />
        <View style={themed($themeContent)}>
          <Text
            tx="profile:appearance"
            size="md"
            weight="semiBold"
            style={themed($themeTitle)}
          />
          <Text
            text={themeContext === "dark" ? translate("profile:darkMode") : translate("profile:lightMode")}
            size="sm"
            style={themed($themeDescription)}
          />
        </View>
      </View>

      <View style={themed($themeButton)}>
        <Icon
          icon="caretRight"
          size={20}
          color={theme.colors.textDim}
        />
      </View>
    </TouchableOpacity>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  borderWidth: 1,
  borderColor: colors.border,
})

const $themeInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
})

const $themeIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $themeContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $themeTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginBottom: spacing.xs,
})

const $themeDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $themeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingLeft: spacing.sm,
})
