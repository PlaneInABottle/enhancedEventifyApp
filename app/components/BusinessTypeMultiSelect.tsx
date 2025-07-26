import React, { FC, useState, useMemo, useCallback } from "react"
import { View, ViewStyle, TextStyle, Modal, ScrollView, Pressable } from "react-native"

import { translate } from "@/i18n/translate"
import { BusinessType } from "@/services/businessProfile/businessProfileTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon } from "./Icon"
import { Text } from "./Text"

export interface BusinessTypeOption {
  labelTx: string
  value: BusinessType
}

export interface BusinessTypeMultiSelectProps {
  /**
   * The currently selected business types
   */
  value: BusinessType[]
  /**
   * Callback when selection changes
   */
  onValueChange?: (values: BusinessType[]) => void
  /**
   * Label for the field
   */
  label?: string
  /**
   * Label translation key
   */
  labelTx?: string
  /**
   * Placeholder when no values selected
   */
  placeholder?: string
  /**
   * Placeholder translation key
   */
  placeholderTx?: string
  /**
   * Whether the component is disabled
   */
  disabled?: boolean
  /**
   * Container style override
   */
  containerStyle?: ViewStyle
}

// Move business type options outside component for performance
export const businessTypeOptions: BusinessTypeOption[] = [
  {
    labelTx: "businessTypes:restaurant",
    value: "restaurant",
  },
  {
    labelTx: "businessTypes:bar",
    value: "bar",
  },
  {
    labelTx: "businessTypes:cafe",
    value: "cafe",
  },
  {
    labelTx: "businessTypes:eventOrganizer",
    value: "event_organizer",
  },
  {
    labelTx: "businessTypes:other",
    value: "other",
  },
]

export const BusinessTypeMultiSelect: FC<BusinessTypeMultiSelectProps> = ({
  value = [],
  onValueChange,
  label,
  labelTx,
  placeholder,
  placeholderTx,
  disabled = false,
  containerStyle,
}) => {
  const { themed, theme } = useAppTheme()
  const [isModalVisible, setIsModalVisible] = useState(false)

  const handleToggleOption = useCallback(
    (optionValue: BusinessType) => {
      if (disabled) return

      const newValues = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]

      onValueChange?.(newValues)
    },
    [disabled, value, onValueChange],
  )

  const handleOpenModal = useCallback(() => {
    if (!disabled) {
      setIsModalVisible(true)
    }
  }, [disabled])

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  const displayText = useMemo(() => {
    return value.length > 0
      ? value
          .map((v) => {
            const option = businessTypeOptions.find((opt) => opt.value === v)
            return option ? translate(option.labelTx as any) : v
          })
          .join(", ")
      : placeholder || translate((placeholderTx || "common:chooseOption") as any)
  }, [value, placeholder, placeholderTx])

  const displayLabel = useMemo(() => {
    return label || (labelTx ? translate(labelTx as any) : "")
  }, [label, labelTx])

  return (
    <View style={[themed($container), containerStyle]}>
      {/* Label */}
      {displayLabel && (
        <Text
          text={label}
          tx={labelTx as any}
          style={themed($label)}
          size="sm"
          weight="semiBold"
          testID="business-type-label"
        />
      )}

      {/* Selection Display */}
      <Pressable
        style={[themed($selectionContainer), disabled && themed($disabledContainer)]}
        onPress={handleOpenModal}
        disabled={disabled}
        testID="business-type-selector"
        accessibilityRole="button"
        accessibilityLabel={`Select business types. Currently selected: ${value.length} types`}
        accessibilityHint="Opens a modal to select business types for your profile"
        accessibilityState={{ disabled }}
      >
        <Text
          text={displayText}
          style={[themed($selectionText), value.length === 0 && themed($placeholderText)]}
          numberOfLines={2}
          testID="business-type-selection"
        />
        <Icon
          icon="caretRight"
          size={16}
          color={disabled ? theme.colors.textDim : theme.colors.text}
        />
      </Pressable>

      {/* Modal for selection */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
        accessibilityViewIsModal
      >
        <Pressable
          style={themed($modalBackdrop)}
          onPress={handleCloseModal}
          accessibilityLabel="Close business type selection modal"
        >
          <View style={themed($modalContainer)}>
            <View style={themed($modalContent)}>
              <View style={themed($modalHeader)}>
                <Text text={displayLabel} style={themed($modalTitle)} weight="bold" />
                <Pressable
                  onPress={handleCloseModal}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  testID="close-modal-button"
                >
                  <Icon icon="x" size={24} color={theme.colors.text} />
                </Pressable>
              </View>

              <ScrollView style={themed($optionsList)}>
                {businessTypeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={themed($optionItem)}
                    onPress={() => handleToggleOption(option.value)}
                  >
                    <View style={themed($optionContent)}>
                      <Text tx={option.labelTx as any} style={themed($optionText)} />
                      {value.includes(option.value) && (
                        <Icon icon="check" size={20} color={theme.colors.tint} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $label: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.primary600,
  marginBottom: spacing.xs,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: "600",
})

const $selectionContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: colors.palette.neutral200,
  borderRadius: spacing.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  minHeight: 48,
  borderWidth: 1,
  borderColor: colors.palette.neutral400,
})

const $disabledContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
  opacity: 0.6,
})

const $selectionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.text,
  fontSize: 16,
  marginRight: 8,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

const $modalBackdrop: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "90%",
  maxWidth: 400,
  maxHeight: "80%",
  margin: spacing.lg,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  padding: spacing.lg,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.lg,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: "#E5E5E5",
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  color: colors.text,
})

const $optionsList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxHeight: 300,
  marginBottom: spacing.sm,
})

const $optionItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
})

const $optionContent: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
  flex: 1,
})
