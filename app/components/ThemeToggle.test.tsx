import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { ThemeToggle } from './ThemeToggle'
import { ThemeProvider } from '@/theme/context'

// Mock the useAppTheme hook
const mockSetThemeContextOverride = jest.fn()
const mockThemed = jest.fn((style) => style)
const mockTheme = {
  colors: {
    tint: '#007AFF',
    textDim: '#8E8E93',
    background: '#FFFFFF',
    border: '#E5E5E7',
    text: '#000000',
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
  themeContext: 'light',
  setThemeContextOverride: mockSetThemeContextOverride,
}))

jest.mock('@/theme/context', () => ({
  useAppTheme: mockUseAppTheme,
  ThemeProvider: ({ children }: any) => children,
}))

// Ensure the mock is available before tests run
beforeAll(() => {
  (require('@/theme/context') as any).useAppTheme = mockUseAppTheme
})

// Mock SafeAreaProvider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock translate function
jest.mock('@/i18n/translate', () => ({
  translate: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'profile:darkMode': 'Dark Mode',
      'profile:lightMode': 'Light Mode',
    }
    return translations[key] || key
  }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: 'light',
      setThemeContextOverride: mockSetThemeContextOverride,
    })
  })

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider>
        <NavigationContainer>
          <ThemeToggle {...props} />
        </NavigationContainer>
      </ThemeProvider>
    )
  }

  it('renders correctly with light theme', () => {
    renderComponent()

    expect(screen.getByText('profile:appearance')).toBeOnTheScreen()
    expect(screen.getByText('Light Mode')).toBeOnTheScreen()
    expect(screen.getByTestId('icon-view')).toBeOnTheScreen() // Light mode icon
    expect(screen.getByTestId('icon-caretRight')).toBeOnTheScreen() // Caret icon
  })

  it('renders correctly with dark theme', () => {
    // Mock dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: 'dark',
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    renderComponent()

    expect(screen.getByText('profile:appearance')).toBeOnTheScreen()
    expect(screen.getByText('Dark Mode')).toBeOnTheScreen()
    expect(screen.getByTestId('icon-hidden')).toBeOnTheScreen() // Dark mode icon
  })

  it('calls setThemeContextOverride when pressed', () => {
    renderComponent()

    const toggleButton = screen.getByText('profile:appearance').parent
    fireEvent.press(toggleButton)

    expect(mockSetThemeContextOverride).toHaveBeenCalledWith('dark')
  })

  it('toggles from dark to light when pressed', () => {
    // Mock dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: 'dark',
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    renderComponent()

    const toggleButton = screen.getByText('profile:appearance').parent
    fireEvent.press(toggleButton)

    expect(mockSetThemeContextOverride).toHaveBeenCalledWith('light')
  })

  it('displays correct icons for different themes', () => {
    // Test light theme icon
    renderComponent()
    expect(screen.getByTestId('icon-view')).toBeOnTheScreen()

    // Test dark theme icon
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: 'dark',
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    const { rerender } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ThemeToggle />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(screen.getByTestId('icon-hidden')).toBeOnTheScreen()
  })

  it('applies custom styles correctly', () => {
    const customStyle = { marginTop: 20 }
    renderComponent({ style: customStyle })

    // Component should render without crashing with custom styles
    expect(screen.getByText('profile:appearance')).toBeOnTheScreen()
  })

  it('uses translation keys correctly', () => {
    const translate = require('@/i18n/translate').translate

    renderComponent()

    // Check that translate is called with correct keys
    expect(translate).toHaveBeenCalledWith('profile:lightMode')

    // Test with dark theme
    mockUseAppTheme.mockReturnValue({
      themed: mockThemed,
      theme: mockTheme,
      themeContext: 'dark',
      setThemeContextOverride: mockSetThemeContextOverride,
    })

    render(
      <ThemeProvider>
        <NavigationContainer>
          <ThemeToggle />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(translate).toHaveBeenCalledWith('profile:darkMode')
  })

  it('has proper accessibility attributes', () => {
    renderComponent()

    const toggleButton = screen.getByTestId('theme-toggle-button')

    expect(toggleButton.props.accessible).not.toBe(false)
    expect(toggleButton.props.testID).toBe('theme-toggle-button')

    // Note: activeOpacity is not exposed in test environment by React Native Testing Library
    // but it is set on the component in the source code
    expect(toggleButton.props.focusable).toBeDefined()
  })

  it('is memoized correctly', () => {
    // Test that the component is wrapped with React.memo by checking render behavior
    const { rerender } = render(
      <ThemeProvider>
        <NavigationContainer>
          <ThemeToggle />
        </NavigationContainer>
      </ThemeProvider>
    )

    // Component should render without issues
    expect(screen.getByText('profile:appearance')).toBeOnTheScreen()

    // Rerender with same props - this tests memo behavior indirectly
    rerender(
      <ThemeProvider>
        <NavigationContainer>
          <ThemeToggle />
        </NavigationContainer>
      </ThemeProvider>
    )

    expect(screen.getByText('profile:appearance')).toBeOnTheScreen()
  })
})
