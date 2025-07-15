import React, { FC } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Icon } from "./Icon"
import { Text } from "./Text"
import { TextField, TextFieldProps } from "./TextField"

export interface DropdownOption<T = string> {
  label: string
  value: T
}

export interface DropdownProps<T = string> extends Omit<TextFieldProps, "value" | "onChangeText"> {
  /**
   * The array of options to display
   */
  options: DropdownOption<T>[]
  /**
   * The currently selected value
   */
  value?: T
  /**
   * Callback when value changes
   */
  onValueChange?: (value: T) => void
  /**
   * Placeholder text when no value is selected
   */
  placeholder?: string
  /**
   * Whether the dropdown is disabled
   */
  disabled?: boolean
}

export function Dropdown<T = string>(props: DropdownProps<T>) {
  const {
    options,
    value,
    onValueChange,
    placeholder,
    disabled,
    style: $inputStyleOverride,
    containerStyle: $containerStyleOverride,
    ...textFieldProps
  } = props

  const { themed, theme } = useAppTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayText = selectedOption?.label || placeholder || ""

  const handleSelect = (option: DropdownOption<T>) => {
    onValueChange?.(option.value)
    setIsOpen(false)
  }

  if (Platform.OS === "web") {
    // Use native select on web for better accessibility
    const selectRef = React.useRef<HTMLSelectElement>(null)

    const focusSelect = () => {
      if (disabled) return
      selectRef.current?.focus()
    }

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={$containerStyleOverride}
        onPress={focusSelect}
        disabled={disabled}
      >
        {(textFieldProps.label || textFieldProps.labelTx) && (
          <Text
            preset="formLabel"
            text={textFieldProps.label}
            tx={textFieldProps.labelTx}
            txOptions={textFieldProps.labelTxOptions}
            style={themed($webLabel)}
          />
        )}
        <View style={themed($webSelectContainer)}>
          <select
            ref={selectRef}
            value={value as any}
            onChange={(e) => onValueChange?.(e.target.value as T)}
            disabled={disabled}
            style={{
              ...themed($webSelectStyle),
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </View>
      </TouchableOpacity>
    )
  }

  // Mobile implementation with modal
  return (
    <>
      <TouchableOpacity activeOpacity={0.7} disabled={disabled} onPress={() => setIsOpen(true)}>
        <TextField
          {...textFieldProps}
          value={displayText}
          editable={false}
          containerStyle={$containerStyleOverride}
          RightAccessory={(props) => (
            <Icon
              icon="caretRight"
              size={20}
              color={theme.colors.textDim}
              containerStyle={props.style}
            />
          )}
          style={[
            themed($input),
            $inputStyleOverride,
            disabled && themed($disabled),
            themed($inputDisabledPointer),
          ]}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType={Platform.OS === "ios" ? "slide" : "fade"}
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent={Platform.OS === "android"}
      >
        <Pressable
          testID="modal-overlay"
          style={themed($modalOverlay)}
          onPress={() => setIsOpen(false)}
        >
          <View style={themed($modalContent)}>
            <View style={themed($modalHeader)}>
              <Text
                preset="heading"
                text={textFieldProps.label}
                tx={textFieldProps.labelTx}
                txOptions={textFieldProps.labelTxOptions}
              />
            </View>
            <ScrollView style={themed($optionsList)}>
              {options.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={[themed($option), option.value === value && themed($selectedOption)]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    text={option.label}
                    style={[
                      themed($optionText),
                      option.value === value && themed($selectedOptionText),
                    ]}
                  />
                  {option.value === value && (
                    <Icon icon="check" size={20} color={theme.colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const $webSelectContainer: ViewStyle = {
  position: "relative",
}

const $webLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $webSelectStyle: ThemedStyle<any> = ({ colors }) => ({
  width: "100%",
  padding: 16,
  fontSize: 16,
  borderRadius: 4,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.background,
  color: colors.text,
})

const $input: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $disabled: ThemedStyle<TextStyle> = ({ colors }) => ({
  opacity: 0.5,
})

const $inputDisabledPointer: ThemedStyle<TextStyle> = () => ({
  pointerEvents: "none",
})

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  maxHeight: "80%",
  width: "100%",
  maxWidth: 400,
  overflow: "hidden",
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.25)`,
      } as any)
    : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }),
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
  padding: 16,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.border,
})

const $optionsList: ThemedStyle<ViewStyle> = () => ({
  maxHeight: 400,
})

const $option: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 16,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.border,
})

const $selectedOption: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary100,
})

const $optionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
  flex: 1,
})

const $selectedOptionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})
