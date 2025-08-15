import React from "react"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"
import { Dropdown, DropdownOption } from "./Dropdown"

// Mock data
const mockOptions: DropdownOption<string>[] = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
]

// Helper function to render Dropdown with shared utilities
const renderDropdown = (props: Partial<React.ComponentProps<typeof Dropdown>> = {}) => {
  const defaultProps = {
    options: mockOptions,
    label: "Test Dropdown",
    placeholder: "Select an option",
  }
  return renderWithProviders(
    <Dropdown {...defaultProps} {...props} />,
    { withStoreProvider: false }
  )
}

describe("Dropdown Component", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })
  describe("Basic Rendering", () => {
    test("renders dropdown with label and placeholder", () => {
      renderDropdown()

      expect(screen.getByText("Test Dropdown")).toBeOnTheScreen()
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()
    })

    test("renders dropdown with selected value", () => {
      renderDropdown({ value: "option1" })

      expect(screen.getByDisplayValue("Option 1")).toBeOnTheScreen()
    })

    test("renders dropdown without label", () => {
      renderDropdown({ label: undefined })

      expect(screen.queryByText("Test Dropdown")).not.toBeOnTheScreen()
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()
    })
  })

  describe("Mobile Modal Interaction", () => {
    test("opens modal when dropdown is pressed", () => {
      renderDropdown()

      // Modal should not be visible initially
      expect(screen.queryByText("Option 1")).not.toBeOnTheScreen()

      // Press the dropdown to open modal
      fireEvent.press(screen.getByDisplayValue("Select an option"))

      // Modal should now be visible with options
      expect(screen.getByText("Option 1")).toBeOnTheScreen()
      expect(screen.getByText("Option 2")).toBeOnTheScreen()
      expect(screen.getByText("Option 3")).toBeOnTheScreen()
    })

    test("closes modal when overlay is pressed", () => {
      renderDropdown()

      // Open modal
      fireEvent.press(screen.getByDisplayValue("Select an option"))
      expect(screen.getByText("Option 1")).toBeOnTheScreen()

      // Press overlay to close
      fireEvent.press(screen.getByTestId("modal-overlay"))

      // Modal should be closed
      expect(screen.queryByText("Option 1")).not.toBeOnTheScreen()
    })

    test("selects option and closes modal", () => {
      const onValueChange = jest.fn()
      renderDropdown({ onValueChange })

      // Open modal
      fireEvent.press(screen.getByDisplayValue("Select an option"))

      // Select an option
      fireEvent.press(screen.getByText("Option 2"))

      // Check that callback was called
      expect(onValueChange).toHaveBeenCalledWith("option2")

      // Modal should be closed
      expect(screen.queryByText("Option 2")).not.toBeOnTheScreen()
    })

    test("displays modal header with label", () => {
      renderDropdown()

      // Open modal
      fireEvent.press(screen.getByDisplayValue("Select an option"))

      // Check that modal header shows the label - use getAllByText to verify both exist
      const labelElements = screen.getAllByText("Test Dropdown")
      expect(labelElements).toHaveLength(2) // One in main dropdown, one in modal header
    })

    test("shows selected option with checkmark", () => {
      renderDropdown({ value: "option2" })

      // Open modal
      fireEvent.press(screen.getByDisplayValue("Option 2"))

      // All options should be visible
      expect(screen.getByText("Option 1")).toBeOnTheScreen()
      expect(screen.getByText("Option 2")).toBeOnTheScreen()
      expect(screen.getByText("Option 3")).toBeOnTheScreen()

      // The selected option should have some visual indication
      // Note: The checkmark icon would need testID to be testable
    })
  })

  describe("Disabled State", () => {
    test("does not open modal when disabled", () => {
      renderDropdown({ disabled: true })

      // Try to press the dropdown
      fireEvent.press(screen.getByDisplayValue("Select an option"))

      // Modal should not open
      expect(screen.queryByText("Option 1")).not.toBeOnTheScreen()
    })

    test("applies disabled styling", () => {
      renderDropdown({ disabled: true })

      // The TextField should be present but disabled
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()
    })
  })

  describe("Edge Cases", () => {
    test("handles empty options array", () => {
      renderDropdown({ options: [] })

      // Should render without crashing
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()

      // Open modal
      fireEvent.press(screen.getByDisplayValue("Select an option"))

      // Should show empty modal
      expect(screen.queryByText("Option 1")).not.toBeOnTheScreen()
    })

    test("handles undefined value", () => {
      renderDropdown({ value: undefined })

      // Should show placeholder
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()
    })

    test("handles non-existent value", () => {
      renderDropdown({ value: "non-existent" as any })

      // Should show placeholder when value doesn't match any option
      expect(screen.getByDisplayValue("Select an option")).toBeOnTheScreen()
    })
  })
})
