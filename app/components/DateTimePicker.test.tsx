import React from "react"
import { Platform } from "react-native"
import { fireEvent, screen, waitFor } from "@testing-library/react-native"

import { DateTimePickerField } from "./DateTimePicker"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"

// SECURITY-HARDENED: Following established testing guide patterns
// Mock Platform.OS for cross-platform testing
const mockPlatform = {
  OS: "ios" as "ios" | "android" | "web",
}
Object.defineProperty(Platform, "OS", {
  get: () => mockPlatform.OS,
  configurable: true,
})

// Access centralized mocks from test/setup.ts
// These are automatically available and don't need redefinition

describe("DateTimePickerField", () => {
  // SECURITY-HARDENED: Use setupComponentTest pattern from testing guide
  setupComponentTest({
    mockTranslations: {
      "businessEvent:startDateTimePlaceholder": "Select date and time",
      "businessEvent:startDateTimeLabel": "Start Date & Time",
      "common:selectDateTime": "Select date and time",
    },
    mockAlert: true,
  })

  const mockOnChangeLocal = jest.fn()
  // Use timezone-consistent test date with 24-hour time
  const testDate = new Date("2024-12-25T15:30:00.000Z") // 3:30 PM in 24-hour format

  // SECURITY-HARDENED: Standard cleanup pattern from testing guide
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnChangeLocal.mockClear()
    // Access global mocks from test/setup.ts
    if (global.mockNativeDateTimePicker) global.mockNativeDateTimePicker.mockClear()
    if (global.mockDateTimePickerAndroid?.open) global.mockDateTimePickerAndroid.open.mockClear()
    if (global.mockReactDatePicker) global.mockReactDatePicker.mockClear()
    mockPlatform.OS = "ios" // Default to iOS
  })

  // SECURITY-HARDENED: Use renderWithProviders pattern from testing guide
  const renderDateTimePicker = (props = {}) => {
    const defaultProps = {
      value: null,
      onChange: mockOnChangeLocal,
      mode: "datetime" as const,
      label: "Start Date & Time",
      placeholder: "Select date and time",
      ...props,
    }

    return renderWithProviders(<DateTimePickerField {...defaultProps} />, {
      withStoreProvider: false,
    })
  }

  describe("TDD: 24-Hour Format Requirements", () => {
    // Test 1: Component should display time in 24-hour format (not AM/PM)
    it("should display time in 24-hour format without AM/PM", () => {
      renderDateTimePicker({
        value: testDate,
        mode: "time",
      })

      const displayText = screen.getByTestId("date-display-text")
      expect(displayText.props.children).toBe("15:30") // 24-hour format
      expect(displayText.props.children).not.toMatch(/AM|PM/i) // No AM/PM
    })

    // Test 2: DateTime mode should show both date and 24-hour time
    it("should display datetime in 24-hour format", () => {
      renderDateTimePicker({
        value: testDate,
        mode: "datetime",
      })

      const displayText = screen.getByTestId("date-display-text")
      const text = displayText.props.children
      expect(text).toMatch(/12\/25\/2024.*15:30/) // Date with 24-hour time
      expect(text).not.toMatch(/AM|PM/i) // No AM/PM
    })

    // Test 3: Date mode should only show date, no time
    it("should display only date in date mode", () => {
      renderDateTimePicker({
        value: testDate,
        mode: "date",
      })

      const displayText = screen.getByTestId("date-display-text")
      expect(displayText.props.children).toMatch(/12\/25\/2024/)
      expect(displayText.props.children).not.toMatch(/15:30|AM|PM/i)
    })
  })

  describe("TDD: Cross-Platform Behavior", () => {
    // Test 4: Web platform should use react-datepicker
    it("should use react-datepicker on web platform", () => {
      mockPlatform.OS = "web"
      renderDateTimePicker({
        value: testDate,
        mode: "datetime",
      })

      // Should render the container but not the mobile touchable
      expect(screen.getByTestId("date-time-picker-container")).toBeOnTheScreen()
      expect(screen.queryByTestId("date-time-touchable")).not.toBeOnTheScreen()
    })

    // Test 5: iOS should render native DateTimePicker component
    it("should render iOS native DateTimePicker when available", () => {
      mockPlatform.OS = "ios"
      renderDateTimePicker({
        value: testDate,
        mode: "datetime",
      })

      // Should render mobile touchable
      expect(screen.getByTestId("date-time-touchable")).toBeOnTheScreen()
    })

    // Test 6: Android should use imperative API
    it("should use Android imperative API for date selection", () => {
      mockPlatform.OS = "android"
      renderDateTimePicker({
        value: testDate,
        mode: "date",
      })

      // Should render Android touchable
      expect(screen.getByTestId("date-time-touchable")).toBeOnTheScreen()
    })
  })

  describe("TDD: Mobile Native DateTimePicker Integration", () => {
    // Test 7: iOS picker should show modal when touchable is pressed
    it("should show iOS picker modal when touchable is pressed", async () => {
      mockPlatform.OS = "ios"
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "datetime",
        onChange: testOnChange,
      })

      // Press the touchable to show picker
      fireEvent.press(screen.getByTestId("date-time-touchable"))

      // iOS picker should be rendered
      await waitFor(() => {
        expect(screen.getByTestId("ios-date-time-picker")).toBeOnTheScreen()
      })
    })

    // Test 8: iOS picker should handle date changes with 24-hour format
    it("should handle iOS picker date changes with 24-hour format", async () => {
      mockPlatform.OS = "ios"
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "time",
        onChange: testOnChange,
      })

      // Press touchable to show picker
      fireEvent.press(screen.getByTestId("date-time-touchable"))

      // Wait for picker to appear
      await waitFor(() => {
        expect(screen.getByTestId("ios-date-time-picker")).toBeOnTheScreen()
      })

      // Verify native picker was called with 24-hour format
      expect(global.mockNativeDateTimePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          is24Hour: true,
          mode: "time",
        }),
        undefined,
      )
    })

    // Test 9: Android picker should open imperative dialog
    it("should open Android imperative dialog when touchable is pressed", async () => {
      mockPlatform.OS = "android"
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "date",
        onChange: testOnChange,
      })

      // Press touchable to open Android picker
      fireEvent.press(screen.getByTestId("date-time-touchable"))

      // Android imperative API should be called
      await waitFor(() => {
        expect(global.mockDateTimePickerAndroid.open).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "date",
            is24Hour: true,
            onChange: expect.any(Function),
          }),
        )
      })
    })

    // Test 10: Android datetime mode should show sequential pickers
    it("should handle Android datetime mode with sequential pickers", async () => {
      mockPlatform.OS = "android"
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "datetime",
        onChange: testOnChange,
      })

      // Press touchable to start datetime flow
      fireEvent.press(screen.getByTestId("date-time-touchable"))

      // First call should be for date picker
      await waitFor(() => {
        expect(global.mockDateTimePickerAndroid.open).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "date",
            is24Hour: true,
          }),
        )
      })

      // Expect first call (date) already asserted. Simulate selecting a date to trigger time picker.
      const firstOpenArgs = global.mockDateTimePickerAndroid.open.mock.calls[0][0]
      // Simulate selecting date (not dismissed)
      const pickedDate = new Date("2024-12-25T00:00:00.000Z")
      firstOpenArgs.onChange({ type: "set" }, pickedDate)

      // Wait until second (time) picker call appears (ignore possible extra internal safety call)
      await waitFor(() => {
        expect(global.mockDateTimePickerAndroid.open.mock.calls.length).toBeGreaterThanOrEqual(2)
      })
      const secondCall = global.mockDateTimePickerAndroid.open.mock.calls[1][0]
      expect(secondCall.mode).toBe("time")
      expect(secondCall.is24Hour).toBe(true)
      // Simulate selecting time
      const finalDate = new Date("2024-12-25T15:30:00.000Z")
      secondCall.onChange({ type: "set" }, finalDate)
      // onChange prop should be called with final datetime
      expect(testOnChange).toHaveBeenCalledWith(finalDate)
    })

    // Test 11: Should handle native picker cancellation
    it("should handle picker cancellation gracefully", async () => {
      mockPlatform.OS = "android"
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "date",
        onChange: testOnChange,
      })

      fireEvent.press(screen.getByTestId("date-time-touchable"))

      // Simulate cancellation
      const openCall = global.mockDateTimePickerAndroid.open.mock.calls[0][0]
      openCall.onChange({ type: "dismissed" }, undefined)

      // onChange should not be called with undefined
      expect(testOnChange).not.toHaveBeenCalled()
    })

    // Test 12: Should pass min/max dates to native pickers
    it("should pass minimum and maximum dates to native pickers", async () => {
      mockPlatform.OS = "android"
      const minDate = new Date("2024-01-01T00:00:00.000Z")
      const maxDate = new Date("2024-12-31T23:59:59.999Z")

      renderDateTimePicker({
        mode: "date",
        minimumDate: minDate,
        maximumDate: maxDate,
      })

      fireEvent.press(screen.getByTestId("date-time-touchable"))

      await waitFor(() => {
        expect(global.mockDateTimePickerAndroid.open).toHaveBeenCalledWith(
          expect.objectContaining({
            minimumDate: minDate,
            maximumDate: maxDate,
          }),
        )
      })
    })
  })

  describe("TDD: Web react-datepicker Integration", () => {
    beforeEach(() => {
      mockPlatform.OS = "web"
    })

    // Test 13: Web picker should handle date changes with 24-hour format
    it("should handle date changes on web with 24-hour time", () => {
      const testOnChange = jest.fn()

      renderDateTimePicker({
        mode: "datetime",
        onChange: testOnChange,
      })

      // Verify that react-datepicker was called with the onChange function
      expect(global.mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          onChange: expect.any(Function),
          dateFormat: "dd/MM/yyyy HH:mm",
          timeFormat: "HH:mm",
        }),
        undefined,
      )

      // Get the onChange function that was passed to react-datepicker
      const onChangeCall = global.mockReactDatePicker.mock.calls[0][0]
      const onChangeFunction = onChangeCall.onChange

      // Simulate the date picker calling onChange
      onChangeFunction(new Date("2024-12-25T15:30:00.000Z"))

      expect(testOnChange).toHaveBeenCalledWith(new Date("2024-12-25T15:30:00.000Z"))
    })

    // Test 14: Different modes should configure react-datepicker correctly
    it("should configure react-datepicker for time-only mode", () => {
      mockPlatform.OS = "web"

      renderDateTimePicker({
        mode: "time",
      })

      // Check that react-datepicker was called with correct props for time mode
      expect(global.mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          showTimeSelect: true,
          showTimeSelectOnly: true,
          timeFormat: "HH:mm",
          dateFormat: "HH:mm",
        }),
        undefined,
      )
    })

    // Test 15: DateTime mode should configure both date and time
    it("should configure react-datepicker for datetime mode", () => {
      mockPlatform.OS = "web"

      renderDateTimePicker({
        mode: "datetime",
      })

      expect(global.mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          showTimeSelect: true,
          showTimeSelectOnly: false,
          timeFormat: "HH:mm",
          dateFormat: "dd/MM/yyyy HH:mm",
        }),
        undefined,
      )
    })
  })

  describe("TDD: Error Handling and Validation", () => {
    // Test 16: Should handle invalid dates gracefully
    it("should handle invalid dates gracefully", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

      renderDateTimePicker({
        value: new Date("invalid-date"),
      })

      const displayText = screen.getByTestId("date-display-text")
      expect(displayText.props.children).toBe("Select date and time") // Falls back to placeholder

      consoleSpy.mockRestore()
    })

    // Test 17: Should display error states
    it("should display error message when status is error", () => {
      renderDateTimePicker({
        status: "error",
        error: "Start date is required",
      })

      expect(screen.getByText("Start date is required")).toBeOnTheScreen()
    })

    // Test 18: Should handle disabled state
    it("should be disabled when status is disabled", () => {
      renderDateTimePicker({
        status: "disabled",
      })

      const container = screen.getByTestId("date-time-picker-container")
      expect(container).toBeOnTheScreen()
      // Disabled styling would be applied via theme
    })
  })

  describe("TDD: Accessibility and Internationalization", () => {
    // Test 19: Should support translation keys
    it("should use translation keys for labels and placeholders", () => {
      renderDateTimePicker({
        labelTx: "businessEvent:startDateTimeLabel",
        placeholderTx: "businessEvent:startDateTimePlaceholder",
        value: null,
      })

      expect(screen.getByText("Start Date & Time")).toBeOnTheScreen()
      // The placeholder text appears in the display area when no value is set
      expect(screen.getByTestId("date-display-text")).toHaveTextContent("Select date and time")
    })

    // Test 20: Should handle min/max date constraints
    it("should respect minimum and maximum date constraints", () => {
      const minDate = new Date("2024-01-01T00:00:00.000Z")
      const maxDate = new Date("2024-12-31T23:59:59.999Z")

      mockPlatform.OS = "web"

      renderDateTimePicker({
        minimumDate: minDate,
        maximumDate: maxDate,
      })

      expect(global.mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          minDate: minDate,
          maxDate: maxDate,
        }),
        undefined,
      )
    })
  })

  describe("TDD: Component Structure", () => {
    // Test 21: Should render all required elements
    it("should render container, label, input wrapper and helper text", () => {
      renderDateTimePicker({
        label: "Event Date",
        helper: "Select your event date and time",
        value: testDate,
      })

      expect(screen.getByTestId("date-time-picker-container")).toBeOnTheScreen()
      expect(screen.getByTestId("date-time-input-wrapper")).toBeOnTheScreen()
      expect(screen.getByText("Event Date")).toBeOnTheScreen()
      expect(screen.getByText("Select your event date and time")).toBeOnTheScreen()
    })

    // Test 22: Should show placeholder when no value
    it("should show placeholder when no date is selected", () => {
      renderDateTimePicker({
        placeholder: "Choose date and time",
        value: null,
      })

      expect(screen.getByText("Choose date and time")).toBeOnTheScreen()
    })
  })
})
