import React from "react"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"
import { BusinessTypeMultiSelect } from "./BusinessTypeMultiSelect"

describe("BusinessTypeMultiSelect", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const mockOnValueChange = jest.fn()

  const renderBusinessTypeSelect = (props = {}) => {
    const defaultProps = {
      value: [],
      onValueChange: mockOnValueChange,
      labelTx: "profile:businessTypes",
      ...props,
    }
    return renderWithProviders(
      <BusinessTypeMultiSelect {...defaultProps} />,
      { withNavigation: true, withStoreProvider: false }
    )
  }

  it("renders with placeholder text when no values selected", () => {
    renderBusinessTypeSelect({ placeholderTx: "common:chooseOption" })

    expect(screen.getByTestId("business-type-label")).toBeOnTheScreen()
    expect(screen.getByTestId("business-type-selection")).toBeOnTheScreen()
  })

  it("displays selected business types", () => {
    renderBusinessTypeSelect({ value: ["restaurant", "bar"] })

    const selectionText = screen.getByTestId("business-type-selection")
    expect(selectionText).toBeOnTheScreen()
    // Selection should contain the business types (translation keys in test environment)
    expect(selectionText.props.children).toContain("businessTypes:restaurant")
    expect(selectionText.props.children).toContain("businessTypes:bar")
  })

  it("opens modal when selection container is pressed", () => {
    renderBusinessTypeSelect()

    // Press the selection container
    const selectionContainer = screen.getByTestId("business-type-selector")
    fireEvent.press(selectionContainer)

    // Modal should be visible with options (using translation keys in test environment)
    expect(screen.getByText("businessTypes:restaurant")).toBeOnTheScreen()
    expect(screen.getByText("businessTypes:bar")).toBeOnTheScreen()
    expect(screen.getByText("businessTypes:cafe")).toBeOnTheScreen()
    expect(screen.getByText("businessTypes:eventOrganizer")).toBeOnTheScreen()
    expect(screen.getByText("businessTypes:other")).toBeOnTheScreen()
  })

  it("handles disabled state correctly", () => {
    renderBusinessTypeSelect({ disabled: true })

    const selectionContainer = screen.getByTestId("business-type-selector")
    fireEvent.press(selectionContainer)

    // Modal should not open when disabled
    expect(screen.queryByText("businessTypes:restaurant")).not.toBeOnTheScreen()
  })
})
