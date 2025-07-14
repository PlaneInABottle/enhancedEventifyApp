import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from './LoginScreen'
import { useStores } from '@/models'
import { ThemeProvider } from '@/theme/context'

/**
 * Unit tests for LoginScreen component
 */

// Mock the stores
const mockAuthenticationStore = {
  signIn: jest.fn(),
  isLoading: false,
  lastError: null,
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

describe('LoginScreen', () => {
  const defaultProps = {
    navigation: {} as any,
    route: { key: 'Login', name: 'Login' as const },
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

  it('should render login form elements', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <LoginScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(screen.getByTestId('login-heading')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('loginScreen:emailFieldPlaceholder')).toBeOnTheScreen()
    expect(screen.getByPlaceholderText('loginScreen:passwordFieldPlaceholder')).toBeOnTheScreen()
    expect(screen.getByTestId('login-button')).toBeOnTheScreen()
  })

  it('should update email field when user types', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <LoginScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const emailInput = screen.getByPlaceholderText('loginScreen:emailFieldPlaceholder')
    fireEvent.changeText(emailInput, 'test@example.com')

    expect(emailInput.props.value).toBe('test@example.com')
  })

  it('should toggle password visibility when eye icon is pressed', () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <LoginScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const passwordInput = screen.getByPlaceholderText('loginScreen:passwordFieldPlaceholder')
    const toggleButton = screen.getByTestId('password-toggle')

    // Initially password should be hidden (secureTextEntry=true)
    expect(passwordInput.props.secureTextEntry).toBe(true)

    // Press the toggle button
    fireEvent.press(toggleButton)

    // Password should now be visible (secureTextEntry=false)
    expect(passwordInput.props.secureTextEntry).toBe(false)
  })

  it('should call signIn when form is submitted with valid credentials', async () => {
    render(
      <ThemeProvider>
        <NavigationContainer>
          <LoginScreen {...defaultProps} />
        </NavigationContainer>
      </ThemeProvider>
    )

    const emailInput = screen.getByPlaceholderText('loginScreen:emailFieldPlaceholder')
    const passwordInput = screen.getByPlaceholderText('loginScreen:passwordFieldPlaceholder')
    const loginButton = screen.getByTestId('login-button')

    // Fill in the form
    fireEvent.changeText(emailInput, 'test@example.com')
    fireEvent.changeText(passwordInput, 'password123')

    // Submit the form
    fireEvent.press(loginButton)

    // Verify signIn was called with correct credentials
    await waitFor(() => {
      expect(mockAuthenticationStore.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})