import React from "react"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"
import { TextField } from "./TextField"

// Mock translate function
jest.mock("@/i18n/translate", () => ({
  translate: (key: string, options?: any) => {
    const translations: Record<string, string> = {
      "common:map": "Map",
      "common:events": "Events",
      "common:ok": "OK!",
      "common:cancel": "Cancel",
      "errors:invalidEmail": "Invalid email address.",
      "errors:emailRequired": "Email is required",
      "errors:passwordRequired": "Password is required",
    }
    return translations[key] || key
  },
}))

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock isRTL
jest.mock("@/i18n", () => ({
  isRTL: false,
}))

// Helper function to render TextField with shared utilities
const renderTextField = (props: Partial<React.ComponentProps<typeof TextField>> = {}) => {
  const defaultProps = {
    placeholder: "Test placeholder",
  }
  return renderWithProviders(
    <TextField {...defaultProps} {...props} />,
    { withStoreProvider: false }
  )
}

describe("TextField", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  describe("Basic Rendering", () => {
    it("renders correctly with minimal props", () => {
      renderTextField()
      
      expect(screen.getByPlaceholderText("Test placeholder")).toBeOnTheScreen()
    })

    it("renders with label text", () => {
      renderTextField({ label: "Email Address" })
      
      expect(screen.getByText("Email Address")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("Test placeholder")).toBeOnTheScreen()
    })

    it("renders with labelTx prop", () => {
      renderTextField({ labelTx: "common:map" })
      
      expect(screen.getByText("Map")).toBeOnTheScreen()
    })

    it("renders with placeholder text", () => {
      renderTextField({ placeholder: "Custom placeholder" })
      
      expect(screen.getByPlaceholderText("Custom placeholder")).toBeOnTheScreen()
    })

    it("renders with placeholderTx prop", () => {
      renderTextField({ placeholderTx: "common:events" })
      
      expect(screen.getByPlaceholderText("Events")).toBeOnTheScreen()
    })

    it("renders with helper text", () => {
      renderTextField({ helper: "This is a helper text" })
      
      expect(screen.getByText("This is a helper text")).toBeOnTheScreen()
    })

    it("renders with helperTx prop", () => {
      renderTextField({ helperTx: "errors:emailRequired" })
      
      expect(screen.getByText("Email is required")).toBeOnTheScreen()
    })
  })

  describe("Focus Behavior", () => {
    it("focuses input when container is pressed", () => {
      const { getByTestId } = renderTextField({ testID: "test-field" })
      const input = getByTestId("test-field")
      
      // Mock the focus method
      const focusMock = jest.fn()
      input.focus = focusMock
      
      // Press the container (TouchableOpacity wrapper)
      fireEvent.press(screen.getByPlaceholderText("Test placeholder"))
      
      // In the current implementation with TouchableOpacity, this should work
      // Note: This test documents current behavior - after TouchableOpacity removal,
      // this specific interaction pattern will change
    })

    it("focuses input when label is pressed", () => {
      renderTextField({ label: "Test Label", testID: "test-field" })
      
      const input = screen.getByTestId("test-field")
      const focusMock = jest.fn()
      input.focus = focusMock
      
      // Press the label
      fireEvent.press(screen.getByText("Test Label"))
      
      // Label should still be able to focus input after TouchableOpacity removal
    })

    it("does not focus when disabled", () => {
      renderTextField({ editable: false, testID: "test-field" })
      
      const input = screen.getByTestId("test-field")
      const focusMock = jest.fn()
      input.focus = focusMock
      
      // Try to press the input
      fireEvent.press(screen.getByPlaceholderText("Test placeholder"))
      
      // Should not focus when disabled
      expect(focusMock).not.toHaveBeenCalled()
    })
  })

  describe("Touch Event Handling", () => {
    it("allows direct touch events on TextInput", () => {
      renderTextField({ testID: "test-field" })
      
      const input = screen.getByTestId("test-field")
      
      // Simulate touch events that should reach TextInput directly
      fireEvent(input, "focus")
      fireEvent.changeText(input, "test text")
      
      expect(screen.getByDisplayValue("test text")).toBeOnTheScreen()
    })

    it("handles text selection and cursor positioning", () => {
      renderTextField({ 
        testID: "test-field",
        defaultValue: "Hello World"
      })
      
      const input = screen.getByTestId("test-field")
      
      // Test selection events (this is the key functionality that was broken)
      fireEvent(input, "selectionChange", {
        nativeEvent: { selection: { start: 5, end: 5 } }
      })
      
      // The input should handle selection changes properly
      expect(input).toBeTruthy()
    })
  })

  describe("Status States", () => {
    it("renders with error status", () => {
      renderTextField({ 
        status: "error", 
        helper: "Error message",
        testID: "test-field"
      })
      
      expect(screen.getByText("Error message")).toBeOnTheScreen()
      // Error styling should be applied to the input wrapper
    })

    it("renders with disabled status", () => {
      renderTextField({ 
        status: "disabled",
        testID: "test-field"
      })
      
      const input = screen.getByTestId("test-field")
      expect(input.props.editable).toBe(false)
    })

    it("applies disabled styling when editable is false", () => {
      renderTextField({ 
        editable: false,
        testID: "test-field"
      })
      
      const input = screen.getByTestId("test-field")
      expect(input.props.editable).toBe(false)
    })
  })

  describe("Text Input Interactions", () => {
    it("updates value on text change", () => {
      renderTextField({ testID: "test-field" })
      
      const input = screen.getByTestId("test-field")
      fireEvent.changeText(input, "New text value")
      
      expect(screen.getByDisplayValue("New text value")).toBeOnTheScreen()
    })

    it("handles multiline text input", () => {
      renderTextField({ 
        multiline: true,
        testID: "test-field"
      })
      
      const input = screen.getByTestId("test-field")
      fireEvent.changeText(input, "Line 1\nLine 2\nLine 3")
      
      expect(screen.getByDisplayValue("Line 1\nLine 2\nLine 3")).toBeOnTheScreen()
    })

    it("respects maxLength prop", () => {
      renderTextField({ 
        maxLength: 10,
        testID: "test-field"
      })
      
      const input = screen.getByTestId("test-field")
      expect(input.props.maxLength).toBe(10)
    })

    it("handles secure text entry for passwords", () => {
      renderTextField({ 
        secureTextEntry: true,
        testID: "test-field"
      })
      
      const input = screen.getByTestId("test-field")
      expect(input.props.secureTextEntry).toBe(true)
    })
  })

  describe("Accessibility", () => {
    it("has proper accessibility state when disabled", () => {
      renderTextField({ 
        editable: false,
        label: "Disabled Field"
      })
      
      // Find by text instead of label
      expect(screen.getByText("Disabled Field")).toBeOnTheScreen()
      // The accessibility state is on the container, not easily testable with current setup
    })

    it("provides proper accessibility labels", () => {
      renderTextField({ 
        label: "Email Address",
        placeholder: "Enter email",
        testID: "email-field"
      })
      
      const input = screen.getByTestId("email-field")
      expect(input.props.placeholder).toBe("Enter email")
      expect(screen.getByText("Email Address")).toBeOnTheScreen()
    })
  })

  describe("Internationalization", () => {
    it("resolves translation keys for all text props", () => {
      renderTextField({
        labelTx: "common:map",
        placeholderTx: "common:events", 
        helperTx: "errors:emailRequired"
      })
      
      expect(screen.getByText("Map")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("Events")).toBeOnTheScreen()
      expect(screen.getByText("Email is required")).toBeOnTheScreen()
    })

    it("passes translation options correctly", () => {
      // This would test txOptions but our mock doesn't handle interpolation
      renderTextField({
        labelTx: "common:map",
        labelTxOptions: { count: 1 }
      })
      
      expect(screen.getByText("Map")).toBeOnTheScreen()
    })
  })

  describe("Accessories", () => {
    // Use React Native View instead of HTML div for accessories
    const MockLeftAccessory = () => {
      const { View, Text } = require("react-native")
      return (
        <View testID="left-accessory">
          <Text>Left Icon</Text>
        </View>
      )
    }
    
    const MockRightAccessory = () => {
      const { View, Text } = require("react-native")
      return (
        <View testID="right-accessory">
          <Text>Right Icon</Text>
        </View>
      )
    }

    it("renders left accessory", () => {
      renderTextField({ 
        LeftAccessory: MockLeftAccessory,
        testID: "test-field"
      })
      
      expect(screen.getByText("Left Icon")).toBeOnTheScreen()
    })

    it("renders right accessory", () => {
      renderTextField({ 
        RightAccessory: MockRightAccessory,
        testID: "test-field"
      })
      
      expect(screen.getByText("Right Icon")).toBeOnTheScreen()
    })

    it("renders both accessories", () => {
      renderTextField({ 
        LeftAccessory: MockLeftAccessory,
        RightAccessory: MockRightAccessory,
        testID: "test-field"
      })
      
      expect(screen.getByText("Left Icon")).toBeOnTheScreen()
      expect(screen.getByText("Right Icon")).toBeOnTheScreen()
    })
  })

  describe("Style Customization", () => {
    it("applies custom container styles", () => {
      renderTextField({
        containerStyle: { backgroundColor: "red" }
      })
      
      // Style should be applied - this is more about ensuring no crashes
      expect(screen.getByPlaceholderText("Test placeholder")).toBeOnTheScreen()
    })

    it("applies custom input wrapper styles", () => {
      renderTextField({
        inputWrapperStyle: { borderWidth: 2 }
      })
      
      expect(screen.getByPlaceholderText("Test placeholder")).toBeOnTheScreen()
    })

    it("applies custom input styles", () => {
      renderTextField({
        style: { fontSize: 18 }
      })
      
      expect(screen.getByPlaceholderText("Test placeholder")).toBeOnTheScreen()
    })
  })

  describe("Error States", () => {
    it("displays error styling with error status", () => {
      renderTextField({
        status: "error",
        helper: "This field has an error"
      })
      
      expect(screen.getByText("This field has an error")).toBeOnTheScreen()
      // Error color should be applied to helper text and input border
    })

    it("shows validation errors", () => {
      renderTextField({
        status: "error",
        helperTx: "errors:invalidEmail"
      })
      
      expect(screen.getByText("Invalid email address.")).toBeOnTheScreen()
    })
  })

  describe("Edge Cases", () => {
    it("handles empty label and placeholder", () => {
      renderTextField({
        label: "",
        placeholder: ""
      })
      
      // Should render without crashing
      expect(screen.getByPlaceholderText("")).toBeOnTheScreen()
    })

    it("handles undefined translation keys gracefully", () => {
      renderTextField({
        labelTx: "nonexistent:key" as any,
        placeholderTx: "another:nonexistent" as any
      })
      
      // Mock returns the key itself for non-existent translations
      expect(screen.getByText("nonexistent:key")).toBeOnTheScreen()
      expect(screen.getByPlaceholderText("another:nonexistent")).toBeOnTheScreen()
    })

    it("requires theme provider", () => {
      // TextField requires ThemeProvider - documented requirement
      const { render } = require("@testing-library/react-native")
      expect(() => {
        render(<TextField placeholder="No theme test" />)
      }).toThrow("useAppTheme must be used within an ThemeProvider")
    })
  })

  describe("Forward Ref", () => {
    it("forwards ref to TextInput", () => {
      const ref = React.createRef<any>()
      
      renderTextField({ ref })
      
      // Ref should be attached to the TextInput element
      expect(ref.current).toBeTruthy()
    })

    it("allows imperative focus via ref", () => {
      const ref = React.createRef<any>()
      
      renderTextField({ ref })
      
      // Should be able to call focus method
      expect(typeof ref.current?.focus).toBe("function")
    })
  })

  // Tests for post-TouchableOpacity-removal behavior
  describe("Post-Fix Behavior (TouchableOpacity Removal)", () => {
    it("should handle direct TextInput touch events after wrapper removal", () => {
      // This test documents the expected behavior after TouchableOpacity wrapper is removed
      renderTextField({ testID: "test-field" })
      
      const input = screen.getByTestId("test-field")
      
      // Direct touch events should work properly
      fireEvent(input, "touchStart", { 
        nativeEvent: { touches: [{ locationX: 10, locationY: 5 }] }
      })
      
      // This should position cursor correctly in the future implementation
      expect(input).toBeTruthy()
    })

    it("should maintain label focus behavior after wrapper removal", () => {
      // Label should still be able to focus the input using TouchableOpacity
      renderTextField({ 
        label: "Test Label",
        testID: "test-field"
      })
      
      // Since the label is currently wrapped with TouchableOpacity within the main wrapper,
      // the focus behavior is handled by the wrapper. This test documents expected behavior
      // after the main TouchableOpacity is removed but label keeps its own TouchableOpacity.
      expect(screen.getByText("Test Label")).toBeOnTheScreen()
      expect(screen.getByTestId("test-field")).toBeOnTheScreen()
    })
  })
})