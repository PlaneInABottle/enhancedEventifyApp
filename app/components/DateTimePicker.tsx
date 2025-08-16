import React, { FC, useCallback, useMemo, useState, forwardRef } from "react"
import {
  Platform,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"

import { translate } from "@/i18n/translate"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle, ThemedStyleArray } from "@/theme/types"

import { Text, TextProps } from "./Text"

// Type-safe dynamic imports for web-only react-datepicker
type ReactDatePickerType = any
let ReactDatePicker: ReactDatePickerType = null

// Custom input component for react-datepicker that properly handles refs and events
interface CustomDateInputProps {
  displayText: string
  isDisabled: boolean
  inputWrapperStyles: StyleProp<ViewStyle>
  textStyles: StyleProp<TextStyle>
  onClick?: () => void
  value?: string
}

const CustomDateInput = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  CustomDateInputProps
>(({ displayText, isDisabled, inputWrapperStyles, textStyles, onClick, ...props }, ref) => {
    return (
      <TouchableOpacity
        ref={ref}
        style={inputWrapperStyles}
        disabled={isDisabled}
        activeOpacity={0.7}
        onPress={onClick}
        {...props}
      >
        <Text style={textStyles} testID="date-display-text">
          {displayText}
        </Text>
      </TouchableOpacity>
    )
  }
)

export interface DateTimePickerProps {
  /**
   * Current date value
   */
  value: Date | null
  /**
   * Callback when date changes
   */
  onChange: (date: Date | null) => void
  /**
   * Picker mode
   */
  mode?: "date" | "time" | "datetime"
  /**
   * Minimum selectable date
   */
  minimumDate?: Date
  /**
   * Maximum selectable date
   */
  maximumDate?: Date
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string
  /**
   * Placeholder translation key
   */
  placeholderTx?: TextProps["tx"]
  /**
   * Error message to display
   */
  error?: string
  /**
   * Error translation key
   */
  errorTx?: TextProps["tx"]
  /**
   * Label text
   */
  label?: string
  /**
   * Label translation key
   */
  labelTx?: TextProps["tx"]
  /**
   * Helper text
   */
  helper?: string
  /**
   * Helper translation key
   */
  helperTx?: TextProps["tx"]
  /**
   * A style modifier for different input states.
   */
  status?: "error" | "disabled"
  /**
   * Style overrides for the container
   */
  containerStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the input wrapper
   */
  inputWrapperStyle?: StyleProp<ViewStyle>
  /**
   * Style overrides for the display text
   */
  textStyle?: StyleProp<TextStyle>
}

// Helper functions for react-datepicker configuration
const getDateFormat = (mode: DateTimePickerProps["mode"]) => {
  switch (mode) {
    case "date":
      return "dd/MM/yyyy"
    case "time":
      return "HH:mm"
    case "datetime":
    default:
      return "dd/MM/yyyy HH:mm"
  }
}

const getShowTimeSelect = (mode: DateTimePickerProps["mode"]) => {
  return mode === "time" || mode === "datetime"
}

const getShowTimeSelectOnly = (mode: DateTimePickerProps["mode"]) => {
  return mode === "time"
}

/**
 * Cross-platform DateTimePicker component with 24-hour format support
 * - Web: Uses react-datepicker with 24-hour format
 * - Mobile: Placeholder for native picker implementation
 */
export const DateTimePickerField: FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = "datetime",
  minimumDate,
  maximumDate,
  disabled = false,
  placeholder,
  placeholderTx,
  error,
  errorTx,
  label,
  labelTx,
  helper,
  helperTx,
  status,
  containerStyle,
  inputWrapperStyle,
  textStyle,
}) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const isDisabled = disabled || status === "disabled"
  const hasError = status === "error" || !!error || !!errorTx

  // Format date for display (24-hour format)
  const displayText = useMemo(() => {
    if (!value || isNaN(value.getTime())) {
      return placeholderTx ? translate(placeholderTx) : placeholder || ""
    }

    try {
      if (mode === "date") {
        return value.toLocaleDateString(undefined, {
          month: "2-digit",
          day: "2-digit", 
          year: "numeric"
        })
      } else if (mode === "time") {
        // Use 24-hour format for time display
        return value.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
      } else {
        // datetime mode - 24-hour format with user locale
        const dateStr = value.toLocaleDateString(undefined, {
          month: "2-digit",
          day: "2-digit", 
          year: "numeric"
        })
        const timeStr = value.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        })
        return `${dateStr} ${timeStr}`
      }
    } catch (dateError) {
      console.warn("DateTimePicker: Invalid date provided", dateError)
      return placeholderTx ? translate(placeholderTx) : placeholder || ""
    }
  }, [value, mode, placeholderTx, placeholder])

  // Web-specific react-datepicker implementation
  const renderWebPicker = () => {
    if (Platform.OS !== "web") return null

    // Lazy load react-datepicker only when needed
    if (!ReactDatePicker) {
      try {
        // Dynamic import at runtime - module name constructed to avoid TS resolution
        const moduleBase = "react"
        const moduleExt = "datepicker" 
        const fullModuleName = `${moduleBase}-${moduleExt}`
        
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        ReactDatePicker = require(fullModuleName).default
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(`${fullModuleName}/dist/react-datepicker.css`)
      } catch (error) {
        console.warn("Failed to load react-datepicker:", error)
        return null
      }
    }

    if (!ReactDatePicker) return null

    return (
      <ReactDatePicker
        selected={value}
        onChange={(date: Date | null) => onChange(date)}
        showTimeSelect={getShowTimeSelect(mode)}
        showTimeSelectOnly={getShowTimeSelectOnly(mode)}
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat={getDateFormat(mode)}
        timeCaption="Time"
        disabled={isDisabled}
        minDate={minimumDate}
        maxDate={maximumDate}
        placeholderText={placeholderTx ? translate(placeholderTx) : placeholder}
        customInput={
          <CustomDateInput
            displayText={displayText}
            isDisabled={isDisabled}
            inputWrapperStyles={themed($inputWrapperStyles)}
            textStyles={themed($textStyles)}
          />
        }
      />
    )
  }

  // Mobile placeholder - for future native implementation
  const renderMobilePicker = () => {
    return (
      <TouchableOpacity
        style={themed($inputWrapperStyles)}
        disabled={isDisabled}
        activeOpacity={0.7}
        testID="date-time-touchable"
        onPress={() => {
          // TODO: Implement native picker for mobile
          console.log("Mobile date picker not yet implemented")
        }}
      >
        <Text style={themed($textStyles)} testID="date-display-text">
          {displayText}
        </Text>
      </TouchableOpacity>
    )
  }

  const $containerStyles = [themed($container), containerStyle]
  const $labelStyles = [themed($labelStyle)]
  const $inputWrapperStyles: ThemedStyleArray<ViewStyle> = [
    themed($inputWrapperStyle),
    hasError && { borderColor: colors.error },
    inputWrapperStyle,
  ]
  const $textStyles = [
    themed($textStyle),
    !value && { color: colors.textDim },
    isDisabled && { color: colors.textDim },
    textStyle,
  ]
  const $helperStyles = [
    themed($helperStyle),
    hasError && { color: colors.error },
  ]

  const errorText = errorTx ? translate(errorTx) : error
  const helperText = helperTx ? translate(helperTx) : helper
  const labelText = labelTx ? translate(labelTx) : label

  return (
    <View style={$containerStyles} testID="date-time-picker-container">
      {!!labelText && (
        <Text
          preset="formLabel"
          text={labelText}
          style={$labelStyles}
        />
      )}

      <View testID="date-time-input-wrapper">
        {Platform.OS === "web" ? renderWebPicker() : renderMobilePicker()}
      </View>

      {!!(errorText || helperText) && (
        <Text
          preset="formHelper"
          text={errorText || helperText}
          style={themed($helperStyles)}
        />
      )}
    </View>
  )
}

// Styles matching TextField component
const $container: ThemedStyle<ViewStyle> = () => ({})

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "flex-start",
  borderWidth: 1,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral200,
  borderColor: colors.palette.neutral400,
  overflow: "hidden",
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  minHeight: 40,
  justifyContent: "center",
})

const $textStyle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  color: colors.text,
  fontSize: 16,
})

const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})