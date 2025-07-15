import React, { FC, ReactNode } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, Platform } from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon, IconTypes } from "../Icon"
import { Text, TextProps } from "../Text"

export interface ProfileInfoCardProps {
  /**
   * The card title
   */
  title?: string
  /**
   * The card title translation key
   */
  titleTx?: TextProps["tx"]
  /**
   * Icon to display in the header
   */
  headerIcon?: IconTypes
  /**
   * Whether the card is in edit mode
   */
  isEditing?: boolean
  /**
   * Content to display when in view mode
   */
  viewContent?: ReactNode
  /**
   * Content to display when in edit mode
   */
  editContent?: ReactNode
  /**
   * Callback when card is pressed (for edit functionality)
   */
  onPress?: () => void
  /**
   * Whether the card is pressable
   */
  pressable?: boolean
  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Card component for displaying profile information with edit capabilities
 */
export const ProfileInfoCard: FC<ProfileInfoCardProps> = React.memo(
  ({
    title,
    titleTx,
    headerIcon,
    isEditing = false,
    viewContent,
    editContent,
    onPress,
    pressable = false,
    style: $styleOverride,
  }) => {
    const { themed, theme } = useAppTheme()

    const Wrapper = pressable && onPress ? TouchableOpacity : View

    return (
      <Wrapper
        style={[themed($container), $styleOverride]}
        onPress={onPress}
        activeOpacity={pressable ? 0.7 : 1}
      >
        {/* Header */}
        <View style={themed($header)}>
          <View style={themed($headerLeft)}>
            {headerIcon && (
              <Icon
                icon={headerIcon}
                size={20}
                color={theme.colors.tint}
                containerStyle={themed($headerIcon)}
              />
            )}
            <Text text={title} tx={titleTx} preset="subheading" size="md" style={themed($title)} />
          </View>

          {pressable && !isEditing && (
            <Icon icon="caretRight" size={16} color={theme.colors.textDim} />
          )}
        </View>

        {/* Content */}
        <View>{isEditing ? editContent : viewContent}</View>
      </Wrapper>
    )
  },
)

/**
 * Helper component for displaying field information in view mode
 */
export interface ProfileFieldProps {
  /**
   * Field label
   */
  label?: string
  /**
   * Field label translation key
   */
  labelTx?: TextProps["tx"]
  /**
   * Field value
   */
  value?: string | null
  /**
   * Placeholder when value is empty
   */
  placeholder?: string
  /**
   * Placeholder translation key
   */
  placeholderTx?: TextProps["tx"]
  /**
   * Whether to show as multiline
   */
  multiline?: boolean
}

export const ProfileField: FC<ProfileFieldProps> = React.memo(
  ({ label, labelTx, value, placeholder, placeholderTx, multiline = false }) => {
    const { themed } = useAppTheme()

    const displayValue = value || placeholder
    const isPlaceholder = !value

    return (
      <View style={themed($fieldContainer)}>
        {(label || labelTx) && (
          <Text text={label} tx={labelTx} size="sm" weight="semiBold" style={themed($fieldLabel)} />
        )}
        <Text
          text={displayValue}
          tx={isPlaceholder ? placeholderTx : undefined}
          size="md"
          style={[
            themed($fieldValue),
            isPlaceholder && themed($placeholderText),
            multiline && themed($multilineText),
          ]}
          numberOfLines={multiline ? undefined : 1}
        />
      </View>
    )
  },
)

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.lg,
  padding: spacing.xl,
  marginVertical: spacing.md,
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.08)`,
      } as any)
    : {
        shadowColor: colors.palette.neutral800,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
      }),
})

const $header: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $headerLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
})

const $headerIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "700",
  flex: 1,
  fontSize: 16,
  letterSpacing: 0.3,
})

// Content styling handled by children - no additional styles needed

const $fieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  paddingHorizontal: spacing.xs,
})

const $fieldLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary600,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: "600",
})

const $fieldValue: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 16,
  lineHeight: 24,
  paddingVertical: spacing.xs,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

const $multilineText: ThemedStyle<TextStyle> = () => ({
  lineHeight: 22,
})
