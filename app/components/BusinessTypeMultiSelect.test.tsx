import React from "react"
import { render, screen, fireEvent } from "@testing-library/react-native"
import { NavigationContainer } from "@react-navigation/native"

import { ThemeProvider } from "@/theme/context"

import { BusinessTypeMultiSelect } from "./BusinessTypeMultiSelect"

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe("BusinessTypeMultiSelect", () => {
  const mockOnValueChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders with placeholder text when no values selected", () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <BusinessTypeMultiSelect
            value={[]}
            onValueChange={mockOnValueChange}
            labelTx="profile:businessTypes"
            placeholderTx="common:chooseOption"
          />
        </NavigationContainer>
      </ThemeProvider>,
    )

    expect(screen.getByTestId("business-type-label")).toBeOnTheScreen()
    expect(screen.getByTestId("business-type-selection")).toBeOnTheScreen()
  })

  it("displays selected business types", () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <BusinessTypeMultiSelect
            value={["restaurant", "bar"]}
            onValueChange={mockOnValueChange}
            labelTx="profile:businessTypes"
          />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const selectionText = screen.getByTestId("business-type-selection")
    expect(selectionText).toBeOnTheScreen()
    // Selection should contain the business types (translation keys in test environment)
    expect(selectionText.props.children).toContain("businessTypes:restaurant")
    expect(selectionText.props.children).toContain("businessTypes:bar")
  })

  it("opens modal when selection container is pressed", () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <BusinessTypeMultiSelect
            value={[]}
            onValueChange={mockOnValueChange}
            labelTx="profile:businessTypes"
          />
        </NavigationContainer>
      </ThemeProvider>,
    )

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
    render(
      <ThemeProvider>
        <NavigationContainer>
          <BusinessTypeMultiSelect
            value={[]}
            onValueChange={mockOnValueChange}
            labelTx="profile:businessTypes"
            disabled={true}
          />
        </NavigationContainer>
      </ThemeProvider>,
    )

    const selectionContainer = screen.getByTestId("business-type-selector")
    fireEvent.press(selectionContainer)

    // Modal should not open when disabled
    expect(screen.queryByText("businessTypes:restaurant")).not.toBeOnTheScreen()
  })
})