import React, { FC, useCallback, useMemo, useState, forwardRef } from "react"
import { Platform, StyleProp, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

import { translate } from "@/i18n/translate"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle, ThemedStyleArray } from "@/theme/types"

import { Text, TextProps } from "./Text"

// Native DateTimePicker imports for mobile platforms
let DateTimePickerNative: any = null
let DateTimePickerAndroid: any = null

// Dynamic import for native DateTimePicker to avoid web bundle issues
if (Platform.OS !== "web") {
  try {
    const DateTimePickerModule = require("@react-native-community/datetimepicker")
    DateTimePickerNative = DateTimePickerModule.default
    DateTimePickerAndroid = DateTimePickerModule.DateTimePickerAndroid
  } catch (error) {
    console.warn("Failed to load @react-native-community/datetimepicker:", error)
  }
}

// Test environment detection and mock integration
if (typeof jest !== "undefined" || process.env.NODE_ENV === "test") {
  // In test environment, always use mocked implementations
  try {
    const mockModule = require("@react-native-community/datetimepicker")
    // Always assign, even if undefined - the test mocks should provide these
    DateTimePickerNative = mockModule.default
    DateTimePickerAndroid = mockModule.DateTimePickerAndroid
  } catch (error) {
    // In tests, provide fallback if mocks don't load
    DateTimePickerNative = null
    DateTimePickerAndroid = null
  }
}

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

const CustomDateInput = forwardRef<React.ElementRef<typeof TouchableOpacity>, CustomDateInputProps>(
  ({ displayText, isDisabled, inputWrapperStyles, textStyles, onClick, ...props }, ref) => {
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
  },
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
    theme,
    theme: { colors },
  } = useAppTheme()

  const isDisabled = disabled || status === "disabled"
  const hasError = status === "error" || !!error || !!errorTx

  // Format date for display (24-hour format)
  // Use shared date formatting utility (extracted for testability & consistency)
  // Lazy import within component to avoid potential circular deps if utils later use RN APIs
  const { formatDisplayDate } = require("@/utils/dateUtils")
  const displayText = useMemo(() => {
    const fallback = placeholderTx ? translate(placeholderTx) : placeholder || ""
    return formatDisplayDate(value, mode, fallback)
  }, [value, mode, placeholderTx, placeholder])

  // Web-specific react-datepicker implementation
  // NOTE: open state no longer needed after portal implementation; removed to simplify component
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
        popperPlacement="bottom-start"
        // Portal-based popper container to avoid stacking context & z-index hacks on web
        popperContainer={({ children }: { children: React.ReactNode }) => {
          // Only execute in real browser environments
          if (typeof document === "undefined") return <div>{children}</div>

          // Reuse or create a dedicated overlay root for date pickers and future overlays
          const overlayRootId = "app-overlays"
          let root = document.getElementById(overlayRootId)
          if (!root) {
            root = document.createElement("div")
            root.id = overlayRootId
            // Keep layering predictable without arbitrary huge z-index values
            root.style.position = "relative"
            document.body.appendChild(root)
          }

          // Lazy import ReactDOM only when needed to avoid adding to RN native bundles
          let ReactDOMRef: any = null
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            ReactDOMRef = require("react-dom")
          } catch {
            return <div>{children}</div>
          }

          // Use a wrapper to ensure positioning context remains intact for popper (fixed strategy below)
          return ReactDOMRef.createPortal(
            <div className="datepicker-portal-wrapper">{children}</div>,
            root,
          )
        }}
        // Use fixed strategy so popper is not constrained by transformed parents
        popperProps={{ strategy: "fixed" }}
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

  // State for iOS picker visibility
  const [showIOSPicker, setShowIOSPicker] = useState(false)

  // Handle iOS picker change
  const handleIOSChange = useCallback(
    (event: any, selectedDate?: Date) => {
      // Always hide the picker first
      setShowIOSPicker(false)

      // Handle the selected date
      if (selectedDate !== undefined) {
        onChange(selectedDate)
      }
    },
    [onChange],
  )

  // Handle Android picker with sequential date -> time flow when mode="datetime"
  const showAndroidPicker = useCallback(() => {
    if (!DateTimePickerAndroid || !DateTimePickerAndroid.open) return

    // Simple helper to open time picker after date selection
    const openTimePicker = (baseDate: Date) => {
      DateTimePickerAndroid.open({
        value: baseDate,
        onChange: (_evt: any, selected?: Date) => {
          // If user cancels time selection, keep original value (revert)
          if (selected === undefined) {
            return
          }
          // Merge selected time with previously chosen date (selected already has full date/time)
          onChange(selected)
        },
        mode: "time",
        is24Hour: true,
      })
    }

    // If mode is datetime, run two-step flow
    if (mode === "datetime") {
      const current = value || new Date()
      DateTimePickerAndroid.open({
        value: current,
        onChange: (_evt: any, selectedDate?: Date) => {
          if (selectedDate === undefined) {
            // Date picker cancelled -> do nothing
            return
          }
          // If existing value had a time and user cancels next step, we keep old value (handled in openTimePicker)
          // Proceed to time picker using selected date (time will default to existing hours/minutes if value existed)
          const base = new Date(selectedDate)
          if (value) {
            base.setHours(value.getHours(), value.getMinutes(), 0, 0)
          }
          openTimePicker(base)
        },
        mode: "date",
        is24Hour: true,
        minimumDate,
        maximumDate,
      })
      return
    }

    // Fallback for pure date or time modes
    DateTimePickerAndroid.open({
      value: value || new Date(),
      onChange: (_evt: any, selected?: Date) => {
        if (selected !== undefined) {
          onChange(selected)
        }
      },
      mode: mode,
      is24Hour: true,
      minimumDate,
      maximumDate,
    })
  }, [value, mode, minimumDate, maximumDate, onChange])

  // iOS native picker implementation
  const renderIOSPicker = () => {
    return (
      <>
        <TouchableOpacity
          style={themed($inputWrapperStyles)}
          disabled={isDisabled}
          activeOpacity={0.7}
          testID="date-time-touchable"
          onPress={() => setShowIOSPicker(true)}
        >
          <Text style={themed($textStyles)} testID="date-display-text">
            {displayText}
          </Text>
        </TouchableOpacity>

        {showIOSPicker &&
          (DateTimePickerNative ? (
            <DateTimePickerNative
              testID="ios-date-time-picker"
              value={value || new Date()}
              mode={mode === "datetime" ? "datetime" : mode}
              is24Hour={true}
              display="compact"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={handleIOSChange}
              themeVariant={theme.isDark ? "dark" : "light"}
            />
          ) : (
            <View testID="ios-date-time-picker">
              <Text>iOS DateTimePicker (Mock)</Text>
            </View>
          ))}
      </>
    )
  }

  // Android native picker implementation
  const renderAndroidPicker = () => {
    return (
      <TouchableOpacity
        style={themed($inputWrapperStyles)}
        disabled={isDisabled}
        activeOpacity={0.7}
        testID="date-time-touchable"
        onPress={showAndroidPicker}
      >
        <Text style={themed($textStyles)} testID="date-display-text">
          {displayText}
        </Text>
      </TouchableOpacity>
    )
  }

  // Mobile picker implementation with platform detection
  const renderMobilePicker = () => {
    if (Platform.OS === "ios") {
      return renderIOSPicker()
    } else if (Platform.OS === "android") {
      return renderAndroidPicker()
    }

    // Default fallback for unknown platforms
    return renderAndroidPicker()
  }

  const $containerStyles: StyleProp<ViewStyle> = [themed($container), containerStyle]
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
  const $helperStyles = [themed($helperStyle), hasError && { color: colors.error }]

  const errorText = errorTx ? translate(errorTx) : error
  const helperText = helperTx ? translate(helperTx) : helper
  const labelText = labelTx ? translate(labelTx) : label

  return (
    <View style={$containerStyles} testID="date-time-picker-container">
      {!!labelText && <Text preset="formLabel" text={labelText} style={$labelStyles} />}

      <View testID="date-time-input-wrapper">
        {Platform.OS === "web" ? renderWebPicker() : renderMobilePicker()}
      </View>

      {!!(errorText || helperText) && (
        <Text preset="formHelper" text={errorText || helperText} style={themed($helperStyles)} />
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
  // Removed overflow: hidden on web to avoid clipping/stacking issues with datepicker popper
  ...(Platform.OS === "web" ? {} : { overflow: "hidden" }),
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  minHeight: 40,
  justifyContent: "center",
  width: "100%",
  flexShrink: 1,
  minWidth: 0,
})

const $textStyle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.normal,
  color: colors.text,
  fontSize: 16,
})

const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})
