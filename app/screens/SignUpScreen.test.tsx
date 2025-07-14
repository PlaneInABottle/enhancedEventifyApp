import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { SignUpScreen } from './SignUpScreen'
import { useStores } from '@/models'
import { ThemeProvider } from '@/theme/context'

/**
 * Unit tests for SignUpScreen component
 */

// Mock the stores
const mockAuthenticationStore = {
  signUp: jest.fn(),
  isLoading: false,
  lastError: null as string | null,
}

jest.mock('@/models', () => ({
  useStores: jest.fn(),
}))

// Mock SafeAreaProvider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

describe('SignUpScreen', () => {
  const defaultProps = {
    navigation: { navigate: jest.fn() } as any,
    route: { key: 'SignUp', name: 'SignUp' as const },
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

  it('should render sign up form elements', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(screen.getByTestId('signup-heading')).toBeTruthy()
    expect(screen.getByText('signUpScreen:signUp')).toBeTruthy()
    expect(screen.getByText('signUpScreen:createAccount')).toBeTruthy()
  })

  it('should display all form fields', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(screen.getByText('signUpScreen:emailFieldLabel')).toBeTruthy()
    expect(screen.getByPlaceholderText('signUpScreen:emailFieldPlaceholder')).toBeTruthy()
    expect(screen.getByText('signUpScreen:passwordFieldLabel')).toBeTruthy()
    expect(screen.getByPlaceholderText('signUpScreen:passwordFieldPlaceholder')).toBeTruthy()
    expect(screen.getByText('signUpScreen:confirmPasswordFieldLabel')).toBeTruthy()
    expect(screen.getByPlaceholderText('signUpScreen:confirmPasswordFieldPlaceholder')).toBeTruthy()
    expect(screen.getByText('signUpScreen:businessAccount')).toBeTruthy()
  })

  it('should handle form input changes', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const emailInput = screen.getByPlaceholderText('signUpScreen:emailFieldPlaceholder')
    const passwordInput = screen.getByPlaceholderText('signUpScreen:passwordFieldPlaceholder')
    const confirmPasswordInput = screen.getByPlaceholderText('signUpScreen:confirmPasswordFieldPlaceholder')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.changeText(confirmPasswordInput, 'password123')

    expect(emailInput.props.value).toBe('test@example.com')
    expect(passwordInput.props.value).toBe('password123')
    expect(confirmPasswordInput.props.value).toBe('password123')
  })

  it('should call signUp with correct parameters for regular user', async () => {
    mockAuthenticationStore.signUp.mockResolvedValueOnce({ success: true, requiresEmailVerification: false })

    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const emailInput = screen.getByPlaceholderText('signUpScreen:emailFieldPlaceholder')
    const passwordInput = screen.getByPlaceholderText('signUpScreen:passwordFieldPlaceholder')
    const confirmPasswordInput = screen.getByPlaceholderText('signUpScreen:confirmPasswordFieldPlaceholder')
    const signUpButton = screen.getByTestId('signup-button')

    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.changeText(confirmPasswordInput, 'password123')

    fireEvent.press(signUpButton)

    await waitFor(() => {
      expect(mockAuthenticationStore.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'user',
      })
    })
  })

  it('should call signUp with business userType when checkbox is selected', async () => {
    mockAuthenticationStore.signUp.mockResolvedValueOnce({ success: true, requiresEmailVerification: false })

    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const emailInput = screen.getByPlaceholderText('signUpScreen:emailFieldPlaceholder')
    const passwordInput = screen.getByPlaceholderText('signUpScreen:passwordFieldPlaceholder')
    const confirmPasswordInput = screen.getByPlaceholderText('signUpScreen:confirmPasswordFieldPlaceholder')
    const businessCheckbox = screen.getByText('signUpScreen:businessAccount')
    const signUpButton = screen.getByTestId('signup-button')

    fireEvent.changeText(emailInput, 'business@example.com')
    fireEvent.changeText(passwordInput, 'password123')
    fireEvent.changeText(confirmPasswordInput, 'password123')
    fireEvent.press(businessCheckbox)

    fireEvent.press(signUpButton)

    await waitFor(() => {
      expect(mockAuthenticationStore.signUp).toHaveBeenCalledWith({
        email: 'business@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'business',
      })
    })
  })

  it('should display error messages and loading state', () => {
    mockAuthenticationStore.lastError = 'errors:emailAlreadyInUse'
    mockAuthenticationStore.isLoading = true

    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    // Check error display
    expect(screen.getByText('errors:emailAlreadyInUse')).toBeTruthy()

    // Check loading state
    expect(screen.getByTestId('loading-indicator')).toBeTruthy()
    expect(screen.getByText('signUpScreen:signingUp')).toBeTruthy()

    // Check fields are disabled during loading
    const emailInput = screen.getByPlaceholderText('signUpScreen:emailFieldPlaceholder')
    expect(emailInput.props.editable).toBe(false)
  })

  it('should navigate to login screen when login link is pressed', () => {
    const mockNavigate = jest.fn()
    const propsWithMockNav = {
      ...defaultProps,
      navigation: { navigate: mockNavigate } as any
    }

    render(
      <ThemeProvider>
        <NavigationContainer>
          <SignUpScreen {...propsWithMockNav} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const loginLink = screen.getByTestId('login-link')
    expect(loginLink).toBeTruthy()

    fireEvent.press(loginLink)

    expect(mockNavigate).toHaveBeenCalledWith('Login')
  })
})