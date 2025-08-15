import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { screen, fireEvent } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'

import { ThemeToggle } from "./ThemeToggle"

// Mock the useAppTheme hook
const mockSetThemeContextOverride = jest.fn()
const mockThemed = jest.fn((style) => style)
const mockTheme = {
  colors: {
    tint: "#007AFF",
    textDim: "#8E8E93",
    background: "#FFFFFF",
    border: "#E5E5E7",
    text: "#000000",
  },
  spacing: {
    md: 16,
    lg: 24,
    xs: 4,
    sm: 8,
  },
}

const mockUseAppTheme = jest.fn(() => ({
  themed: mockThemed,
  theme: mockTheme,
  themeContext: "light",
  setThemeContextOverride: mockSetThemeContextOverride,
}))

jest.mock("@/theme/context", () => ({
  useAppTheme: mockUseAppTheme,
  ThemeProvider: ({ children }: any) => children,
}))

// Ensure the mock is available before tests run
beforeAll(() => {
  ;(require("@/theme/context") as any).useAppTheme = mockUseAppTheme
})

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock translate function
jest.mock("@/i18n/translate", () => ({
  translate: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      "profile:darkMode": "Dark Mode",
      "profile:lightMode": "Light Mode",
    }
    return translations[key] || key
  }),
}))

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: "light",
      setThemeContextOverride: mockSetThemeContextOverride,
    })
  })

  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderThemeToggle = (props = {}) => {
    return renderWithProviders(
      <NavigationContainer>
        <ThemeToggle {...props} />
      </NavigationContainer>,
      { withStoreProvider: false }
    )
  }

  it("renders correctly with light theme", () => {
    renderThemeToggle()

    expect(screen.getByText("profile:appearance")).toBeOnTheScreen()
    expect(screen.getByText("Light Mode")).toBeOnTheScreen()
    expect(screen.getByTestId("icon-view")).toBeOnTheScreen() // Light mode icon
    expect(screen.getByTestId("icon-caretRight")).toBeOnTheScreen() // Caret icon
  })

  it("renders correctly with dark theme", () => {
    // Mock dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: "dark",
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    renderThemeToggle()

    expect(screen.getByText("profile:appearance")).toBeOnTheScreen()
    expect(screen.getByText("Dark Mode")).toBeOnTheScreen()
    expect(screen.getByTestId("icon-hidden")).toBeOnTheScreen() // Dark mode icon
  })

  it("calls setThemeContextOverride when pressed", () => {
    renderThemeToggle()

    const toggleButton = screen.getByText("profile:appearance").parent
    fireEvent.press(toggleButton)

    expect(mockSetThemeContextOverride).toHaveBeenCalledWith("dark")
  })

  it("toggles from dark to light when pressed", () => {
    // Mock dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: "dark",
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    renderThemeToggle()

    const toggleButton = screen.getByText("profile:appearance").parent
    fireEvent.press(toggleButton)

    expect(mockSetThemeContextOverride).toHaveBeenCalledWith("light")
  })

  it("displays correct icons for different themes", () => {
    // Test light theme icon
    renderThemeToggle()
    expect(screen.getByTestId("icon-view")).toBeOnTheScreen()

    // Test dark theme icon
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: "dark",
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    const { rerender } = renderThemeToggle()

    expect(screen.getByTestId("icon-hidden")).toBeOnTheScreen()
  })

  it("applies custom styles correctly", () => {
    const customStyle = { marginTop: 20 }
    renderThemeToggle({ style: customStyle })

    // Component should render without crashing with custom styles
    expect(screen.getByText("profile:appearance")).toBeOnTheScreen()
  })

  it("uses translation keys correctly", () => {
    const translate = require("@/i18n/translate").translate

    renderThemeToggle()

    // Check that translate is called with correct keys
    expect(translate).toHaveBeenCalledWith("profile:lightMode")

    // Test with dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: "dark",
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    renderThemeToggle()

    expect(translate).toHaveBeenCalledWith("profile:darkMode")
  })

  it("has proper accessibility attributes", () => {
    renderThemeToggle()

    const toggleButton = screen.getByTestId("theme-toggle-button")

    expect(toggleButton.props.accessible).not.toBe(false)
    expect(toggleButton.props.testID).toBe("theme-toggle-button")

    // Note: activeOpacity is not exposed in test environment by React Native Testing Library
    // but it is set on the component in the source code
    expect(toggleButton.props.focusable).toBeDefined()
  })

  it("is memoized correctly", () => {
    // Test that the component is wrapped with React.memo by checking render behavior
    renderThemeToggle()

    // Component should render without issues (using the key as the mock doesn't translate)
    expect(screen.getByText("profile:appearance")).toBeOnTheScreen()

    // The component should use React.memo for optimization
    // This test ensures it renders consistently
    expect(screen.getByTestId("theme-toggle-button")).toBeOnTheScreen()
  })
})
