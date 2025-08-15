import React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { screen, fireEvent, waitFor } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'

import { useStores } from "@/models"

import { LoginScreen } from "./LoginScreen"

/**
 * Unit tests for LoginScreen component
 */

// Mock the stores
const mockAuthenticationStore = {
  signIn: jest.fn(),
  clearError: jest.fn(),
  isLoading: false,
  lastError: null as string | null,
}

jest.mock("@/models", () => ({
  useStores: jest.fn(),
}))

// Mock SafeAreaProvider
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

describe("LoginScreen", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const defaultProps = {
    navigation: { navigate: jest.fn() } as any,
    route: { key: "Login", name: "Login" as const },
  }

  const renderLoginScreen = (props = {}) => {
    return renderWithProviders(
      <NavigationContainer>
        <LoginScreen {...defaultProps} {...props} />
      </NavigationContainer>,
      { withStoreProvider: false }
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStores.mockReturnValue({
      authenticationStore: mockAuthenticationStore,
    } as any)

    // Reset mock store state
    mockAuthenticationStore.isLoading = false
    mockAuthenticationStore.lastError = null
  })

  it("should render login form elements", () => {
    renderLoginScreen()

    expect(screen.getByTestId("login-heading")).toBeOnTheScreen()
    expect(screen.getByPlaceholderText("loginScreen:emailFieldPlaceholder")).toBeOnTheScreen()
    expect(screen.getByPlaceholderText("loginScreen:passwordFieldPlaceholder")).toBeOnTheScreen()
    expect(screen.getByTestId("login-button")).toBeOnTheScreen()
  })

  it("should update email field when user types", () => {
    renderLoginScreen()

    const emailInput = screen.getByPlaceholderText("loginScreen:emailFieldPlaceholder")
    fireEvent.changeText(emailInput, "test@example.com")

    expect(emailInput.props.value).toBe("test@example.com")
  })

  it("should toggle password visibility when eye icon is pressed", () => {
    renderLoginScreen()

    const passwordInput = screen.getByPlaceholderText("loginScreen:passwordFieldPlaceholder")
    const toggleButton = screen.getByTestId("password-toggle")

    // Initially password should be hidden (secureTextEntry=true)
    expect(passwordInput.props.secureTextEntry).toBe(true)

    // Press the toggle button
    fireEvent.press(toggleButton)

    // Password should now be visible (secureTextEntry=false)
    expect(passwordInput.props.secureTextEntry).toBe(false)
  })

  it("should call signIn when form is submitted with valid credentials", async () => {
    renderLoginScreen()

    const emailInput = screen.getByPlaceholderText("loginScreen:emailFieldPlaceholder")
    const passwordInput = screen.getByPlaceholderText("loginScreen:passwordFieldPlaceholder")
    const loginButton = screen.getByTestId("login-button")

    // Fill in the form
    fireEvent.changeText(emailInput, "test@example.com")
    fireEvent.changeText(passwordInput, "password123")

    // Submit the form
    fireEvent.press(loginButton)

    // Verify signIn was called with correct credentials
    await waitFor(() => {
      expect(mockAuthenticationStore.signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
    })
  })

  it("should show loading indicator when authentication is in progress", () => {
    // Set loading state to true
    mockAuthenticationStore.isLoading = true

    renderLoginScreen()

    // Should show loading indicator
    expect(screen.getByTestId("loading-indicator")).toBeOnTheScreen()

    // Login button should be disabled during loading
    const loginButton = screen.getByTestId("login-button")
    expect(loginButton.props.accessibilityState.disabled).toBe(true)
  })

  it("should display error message when authentication fails", () => {
    // Set error state
    mockAuthenticationStore.lastError = "errors:invalidCredentials"

    renderLoginScreen()

    // Should show error message
    expect(screen.getByText("errors:invalidCredentials")).toBeOnTheScreen()
  })

  it("should not display error message when no error exists", () => {
    // Ensure no error state
    mockAuthenticationStore.lastError = null

    renderLoginScreen()

    // Should not show any error message
    expect(screen.queryByText("errors:invalidCredentials")).not.toBeOnTheScreen()
  })

  it("should have enabled button and fields when not loading", () => {
    // Ensure not loading state
    mockAuthenticationStore.isLoading = false

    renderLoginScreen()

    // Login button should be enabled
    const loginButton = screen.getByTestId("login-button")
    expect(loginButton.props.accessibilityState.disabled).toBe(false)

    // Form fields should be editable
    const emailInput = screen.getByPlaceholderText("loginScreen:emailFieldPlaceholder")
    const passwordInput = screen.getByPlaceholderText("loginScreen:passwordFieldPlaceholder")
    expect(emailInput.props.editable).toBe(true)
    expect(passwordInput.props.editable).toBe(true)

    // Should show normal login text
    expect(screen.getByText("loginScreen:tapToLogIn")).toBeOnTheScreen()
  })

  it("should have proper accessibility attributes", () => {
    renderLoginScreen()

    // Login button should have button role
    const loginButton = screen.getByTestId("login-button")
    expect(loginButton.props.accessibilityRole).toBe("button")

    // Password toggle should be accessible
    const passwordToggle = screen.getByTestId("password-toggle")
    expect(passwordToggle.props.accessible).toBe(true)

    // Form fields should be accessible
    const emailInput = screen.getByPlaceholderText("loginScreen:emailFieldPlaceholder")
    const passwordInput = screen.getByPlaceholderText("loginScreen:passwordFieldPlaceholder")
    expect(emailInput.props.accessible).not.toBe(false)
    expect(passwordInput.props.accessible).not.toBe(false)
  })

  it("should navigate to SignUp screen when sign up link is pressed", () => {
    const mockNavigate = jest.fn()
    const propsWithMockNav = {
      navigation: { navigate: mockNavigate } as any,
    }

    renderLoginScreen(propsWithMockNav)

    const signUpLink = screen.getByTestId("signup-link")
    expect(signUpLink).toBeOnTheScreen()
    expect(screen.getByText("loginScreen:dontHaveAccount")).toBeOnTheScreen()

    fireEvent.press(signUpLink)

    expect(mockNavigate).toHaveBeenCalledWith("SignUp")
  })
})
