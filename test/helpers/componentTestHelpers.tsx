/**
 * Shared Component Test Utilities
 * 
 * Provides consistent wrapper patterns for component testing across the React Native app.
 * Based on the testing-guide-components patterns.
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '@/theme/context'
import { RootStoreProvider } from '@/models/helpers/useStores'
import { setupRootStore } from '@/models/helpers/setupRootStore'
import { RootStoreModel } from '@/models/RootStore'

// Type definitions for test helpers
interface TestUser {
  id: string
  email: string
  userType?: string
  profile?: any
  businessProfile?: any
  userRole?: string
  permissions?: string[]
  isBusinessUser?: boolean
  businessStatus?: string
}

interface TestBusinessProfile {
  id?: string
  business_name?: string
  business_types?: string[]
  description?: string | null
  phone?: string | null
  website_url?: string | null
  logo_url?: string | null
  business_status?: string
  created_at?: string
  updated_at?: string
}

interface TestVenue {
  id: string
  business_id: string
  address_id: string
  name: string
  description?: string | null
  capacity?: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  address: {
    id: string
    full_address: string
    city: string
    country: string
    postal_code?: string | null
    coordinates?: any
    created_at: string
    updated_at: string
  }
}

interface TestRootStore {
  authenticationStore: any
  businessProfileStore: any
  venueStore: any
}

/**
 * Custom render function that wraps components with common providers
 * 
 * @example
 * ```typescript
 * const { getByText } = renderWithProviders(<MyComponent />)
 * ```
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions & {
    rootStore?: TestRootStore
    withNavigation?: boolean
    withStoreProvider?: boolean
  } = {}
) => {
  const { 
    rootStore, 
    withNavigation = false, 
    withStoreProvider = true,
    ...renderOptions 
  } = options

  const createWrapper = ({ children }: { children: React.ReactNode }) => {
    let content = <ThemeProvider>{children}</ThemeProvider>

    if (withStoreProvider) {
      content = (
        <ThemeProvider>
          <RootStoreProvider value={rootStore}>
            {children}
          </RootStoreProvider>
        </ThemeProvider>
      )
    }

    if (withNavigation) {
      return (
        <NavigationContainer>
          {content}
        </NavigationContainer>
      )
    }

    return content
  }

  return render(ui, { wrapper: createWrapper, ...renderOptions })
}

/**
 * Creates a test root store with sensible defaults
 * 
 * @example
 * ```typescript
 * const rootStore = await createTestRootStore({
 *   businessProfile: { business_name: 'Test Business' }
 * })
 * ```
 */
export const createTestRootStore = async (overrides: {
  businessProfile?: Partial<TestBusinessProfile>
  venues?: TestVenue[]
  user?: TestUser
} = {}) => {
  const store = RootStoreModel.create({})
  const { rootStore } = await setupRootStore(store)

  // Set up authenticated user if provided
  if (overrides.user) {
    rootStore.authenticationStore.setProp('user', overrides.user)
    rootStore.authenticationStore.setProp('isAuthenticated', true)
  }

  // Set up business profile if provided
  if (overrides.businessProfile) {
    const defaultBusinessProfile = {
      id: 'business-123',
      business_name: 'Test Business',
      business_types: ['restaurant'],
      description: 'Test Description',
      phone: null,
      website_url: null,
      logo_url: null,
      business_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides.businessProfile,
    }
    rootStore.businessProfileStore.setProp('profile', defaultBusinessProfile)
  }

  // Set up venues if provided
  if (overrides.venues) {
    rootStore.venueStore.setVenues(overrides.venues)
  } else if (overrides.businessProfile) {
    // Default venues when business profile is set
    const defaultVenues = [
      {
        id: 'venue-1',
        business_id: overrides.businessProfile.id || 'business-123',
        address_id: 'address-1',
        name: 'Main Venue',
        description: null,
        capacity: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        address: {
          id: 'address-1',
          full_address: '123 Main St',
          city: 'Test City',
          country: 'Test Country',
          postal_code: null,
          coordinates: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ]
    rootStore.venueStore.setVenues(defaultVenues)
  }

  return rootStore
}

/**
 * Mock translations helper for consistent i18n testing
 */
export const createMockTranslations = (customTranslations: Record<string, string> = {}) => {
  const defaultTranslations: Record<string, string> = {
    'common:save': 'Save',
    'common:cancel': 'Cancel',
    'common:delete': 'Delete',
    'common:edit': 'Edit',
    'common:success': 'Success',
    'common:error': 'Error',
    'common:loading': 'Loading...',
    'common:submit': 'Submit',
    'common:report': 'Report',
    'businessEvent:createEvent': 'Create Event',
    'businessEvent:editEvent': 'Edit Event',
    'businessEvent:updateEvent': 'Update Event',
    'businessEvent:deleteEvent': 'Delete Event',
    'businessEvent:eventCreatedSuccessfully': 'Event created successfully!',
    'businessEvent:eventUpdatedSuccessfully': 'Event updated successfully!',
    'businessEvent:titleLabel': 'Title',
    'businessEvent:descriptionLabel': 'Description',
    'businessEvent:titlePlaceholder': 'Enter event title',
    'businessEvent:descriptionPlaceholder': 'Enter event description (optional)',
    ...customTranslations,
  }

  return {
    translate: (key: string) => defaultTranslations[key] || key,
  }
}

/**
 * Mock navigation helper for consistent navigation testing
 */
export const createMockNavigation = () => {
  const mockNavigate = jest.fn()
  const mockGoBack = jest.fn()
  const mockReplace = jest.fn()
  const mockReset = jest.fn()
  const mockSetParams = jest.fn()

  return {
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: mockReplace,
    reset: mockReset,
    setParams: mockSetParams,
    // Getters for assertions
    getMockNavigate: () => mockNavigate,
    getMockGoBack: () => mockGoBack,
    getMockReplace: () => mockReplace,
    getMockReset: () => mockReset,
    getMockSetParams: () => mockSetParams,
  }
}

/**
 * Standard beforeEach setup for component tests
 * 
 * @example
 * ```typescript
 * describe('MyComponent', () => {
 *   setupComponentTest({
 *     mockTranslations: { 'myKey': 'My Value' },
 *     mockNavigation: true,
 *   })
 * 
 *   it('renders correctly', () => {
 *     const { getByText } = renderWithProviders(<MyComponent />)
 *     expect(getByText('My Value')).toBeOnTheScreen()
 *   })
 * })
 * ```
 */
export const setupComponentTest = (options: {
  mockTranslations?: Record<string, string>
  mockNavigation?: boolean
  mockAlert?: boolean
} = {}) => {
  const {
    mockTranslations = {},
    mockNavigation = false,
    mockAlert = true,
  } = options

  let mockNav: ReturnType<typeof createMockNavigation> | undefined

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Alert if requested
    if (mockAlert) {
      const { Alert } = require('react-native')
      Alert.alert = jest.fn()
    }

    // Mock translations if provided
    if (Object.keys(mockTranslations).length > 0 && global.mockTranslateFunction) {
      global.mockTranslateFunction.mockImplementation((key: string, params?: Record<string, string>) => {
        const translation = mockTranslations[key]
        if (translation) {
          return translation
        }
        return params ? `${key} ${JSON.stringify(params)}` : key
      })
    }

    // Create navigation mock if requested
    if (mockNavigation) {
      mockNav = createMockNavigation()
    }
  })

  return {
    getMockNavigation: () => mockNav,
  }
}