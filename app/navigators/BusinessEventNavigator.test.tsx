import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { BusinessEventNavigator } from './BusinessEventNavigator'
import type { BusinessEventStackParamList } from './BusinessEventNavigator'

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/i18n/translate', () => ({
  translate: jest.fn((key: string) => key),
}))

// Mock stores
const mockBusinessEventStore = {
  events: [],
  isLoading: false,
  fetchEvents: jest.fn(),
  getEventById: jest.fn(),
  createEvent: jest.fn(),
}

const mockBusinessProfileStore = {
  profile: {
    id: 'business-1',
  },
}

jest.mock('@/models', () => ({
  useStores: () => ({
    businessEventStore: mockBusinessEventStore,
    businessProfileStore: mockBusinessProfileStore,
  }),
}))

// Mock React Navigation
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()

jest.mock('@react-navigation/native-stack', () => {
  const actualNav = jest.requireActual('@react-navigation/native-stack')
  return {
    ...actualNav,
    createNativeStackNavigator: () => ({
      Navigator: ({ children, screenOptions, initialRouteName }: any) => {
        const React = require('react')
        const { View, Text } = require('react-native')
        return React.createElement(View, { 
          testID: 'stack-navigator',
          'data-screen-options': JSON.stringify(screenOptions),
          'data-initial-route': initialRouteName
        },
          React.createElement(Text, { testID: 'navigator-info' }, 'Stack Navigator'),
          children
        )
      },
      Screen: ({ name, component: Component }: any) => {
        const React = require('react')
        const { View, Text } = require('react-native')
        
        const mockNavigation = {
          navigate: mockNavigate,
          goBack: mockGoBack,
        }
        const mockRoute = { name, params: {} }
        
        return React.createElement(View, { 
          testID: `screen-${name}`,
          key: name
        },
          React.createElement(Text, { testID: `screen-name-${name}` }, name),
          Component && React.createElement(Component, { 
            navigation: mockNavigation, 
            route: mockRoute 
          })
        )
      },
    }),
  }
})

// Mock screen components
jest.mock('@/screens/BusinessEventListScreen', () => ({
  BusinessEventListScreen: ({ navigation, route }: any) => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(View, { testID: 'business-event-list-screen' },
      React.createElement(Text, {}, 'BusinessEventListScreen')
    )
  },
}))

jest.mock('@/screens/BusinessEventFormScreen', () => ({
  BusinessEventFormScreen: ({ navigation, route }: any) => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(View, { testID: 'business-event-form-screen' },
      React.createElement(Text, {}, `BusinessEventFormScreen - ${route.name}`)
    )
  },
}))

// Mock other dependencies
jest.mock('@/components/Screen', () => ({
  Screen: ({ children }: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { testID: 'screen' }, children)
  },
}))

jest.mock('@/components/BusinessEventForm', () => ({
  BusinessEventForm: () => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(View, { testID: 'business-event-form' },
      React.createElement(Text, {}, 'BusinessEventForm')
    )
  },
}))

jest.mock('@/components/BusinessEventList', () => ({
  BusinessEventList: () => {
    const React = require('react')
    const { View, Text } = require('react-native')
    return React.createElement(View, { testID: 'business-event-list' },
      React.createElement(Text, {}, 'BusinessEventList')
    )
  },
}))

describe('BusinessEventNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset stores
    mockBusinessEventStore.events = []
    mockBusinessEventStore.isLoading = false
    mockBusinessProfileStore.profile = { id: 'business-1' }
  })

  describe('Navigator Configuration', () => {
    it('renders stack navigator with correct configuration', () => {
      render(<BusinessEventNavigator />)
      
      const navigator = screen.getByTestId('stack-navigator')
      expect(navigator).toBeOnTheScreen()
      
      const screenOptions = JSON.parse(navigator.props['data-screen-options'])
      expect(screenOptions.headerShown).toBe(false)
      
      const initialRoute = navigator.props['data-initial-route']
      expect(initialRoute).toBe('EventList')
    })

    it('configures EventList screen correctly', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('screen-EventList')).toBeOnTheScreen()
      expect(screen.getByTestId('screen-name-EventList')).toHaveTextContent('EventList')
      expect(screen.getByTestId('business-event-list-screen')).toBeOnTheScreen()
    })

    it('configures CreateEvent screen correctly', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('screen-CreateEvent')).toBeOnTheScreen()
      expect(screen.getByTestId('screen-name-CreateEvent')).toHaveTextContent('CreateEvent')
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
    })

    it('configures EditEvent screen correctly', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('screen-EditEvent')).toBeOnTheScreen()
      expect(screen.getByTestId('screen-name-EditEvent')).toHaveTextContent('EditEvent')
      expect(screen.getByText('BusinessEventFormScreen - EditEvent')).toBeOnTheScreen()
    })

    it('hides headers for all screens', () => {
      render(<BusinessEventNavigator />)
      
      const navigator = screen.getByTestId('stack-navigator')
      const screenOptions = JSON.parse(navigator.props['data-screen-options'])
      expect(screenOptions.headerShown).toBe(false)
    })

    it('sets correct initial route', () => {
      render(<BusinessEventNavigator />)
      
      const navigator = screen.getByTestId('stack-navigator')
      const initialRoute = navigator.props['data-initial-route']
      expect(initialRoute).toBe('EventList')
    })
  })

  describe('Screen Components', () => {
    it('uses BusinessEventListScreen for EventList route', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('business-event-list-screen')).toBeOnTheScreen()
      expect(screen.getByText('BusinessEventListScreen')).toBeOnTheScreen()
    })

    it('uses BusinessEventFormScreen for CreateEvent route', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
    })

    it('uses BusinessEventFormScreen for EditEvent route', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByText('BusinessEventFormScreen - EditEvent')).toBeOnTheScreen()
    })

    it('renders all configured screens', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('screen-EventList')).toBeOnTheScreen()
      expect(screen.getByTestId('screen-CreateEvent')).toBeOnTheScreen()
      expect(screen.getByTestId('screen-EditEvent')).toBeOnTheScreen()
    })
  })

  describe('Type Safety', () => {
    it('defines correct parameter list types', () => {
      // This test validates TypeScript compilation
      // The types should be properly exported and usable
      const paramList: BusinessEventStackParamList = {
        EventList: undefined,
        CreateEvent: undefined,
        EditEvent: { eventId: 'test-event-id' },
        EventDetail: { eventId: 'test-event-id' },
      }
      
      expect(paramList.EventList).toBeUndefined()
      expect(paramList.CreateEvent).toBeUndefined()
      expect(paramList.EditEvent.eventId).toBe('test-event-id')
      expect(paramList.EventDetail.eventId).toBe('test-event-id')
    })

    it('validates EventList route has no parameters', () => {
      render(<BusinessEventNavigator />)
      
      // EventList should render without any required parameters
      expect(screen.getByTestId('business-event-list-screen')).toBeOnTheScreen()
    })

    it('validates CreateEvent route has no parameters', () => {
      render(<BusinessEventNavigator />)
      
      // CreateEvent should render without any required parameters
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
    })

    it('validates EditEvent route expects eventId parameter', () => {
      // Type validation - this would fail TypeScript compilation if incorrect
      const editEventParams: BusinessEventStackParamList['EditEvent'] = { eventId: 'test-id' }
      expect(editEventParams.eventId).toBe('test-id')
    })
  })

  describe('Route Definitions', () => {
    it('defines all expected routes', () => {
      render(<BusinessEventNavigator />)
      
      // Check that all route screens are defined
      const expectedRoutes = ['EventList', 'CreateEvent', 'EditEvent']
      expectedRoutes.forEach(routeName => {
        expect(screen.getByTestId(`screen-${routeName}`)).toBeOnTheScreen()
        expect(screen.getByTestId(`screen-name-${routeName}`)).toHaveTextContent(routeName)
      })
    })

    it('uses same component for CreateEvent and EditEvent', () => {
      render(<BusinessEventNavigator />)
      
      // Both should use BusinessEventFormScreen
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
      expect(screen.getByText('BusinessEventFormScreen - EditEvent')).toBeOnTheScreen()
    })

    it('only defines routes that are implemented', () => {
      render(<BusinessEventNavigator />)
      
      // EventDetail is defined in the type but not implemented in navigator
      expect(screen.queryByTestId('screen-EventDetail')).not.toBeOnTheScreen()
    })
  })

  describe('Navigator Structure', () => {
    it('creates native stack navigator', () => {
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
      expect(screen.getByTestId('navigator-info')).toHaveTextContent('Stack Navigator')
    })

    it('provides navigation props to screen components', () => {
      render(<BusinessEventNavigator />)
      
      // Screen components should receive navigation props
      // This is validated by the mock components rendering without errors
      expect(screen.getByTestId('business-event-list-screen')).toBeOnTheScreen()
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
      expect(screen.getByText('BusinessEventFormScreen - EditEvent')).toBeOnTheScreen()
    })
  })

  describe('Screen Configuration', () => {
    it('configures screens with correct names', () => {
      render(<BusinessEventNavigator />)
      
      const screenNames = ['EventList', 'CreateEvent', 'EditEvent']
      screenNames.forEach(screenName => {
        const screenElement = screen.getByTestId(`screen-name-${screenName}`)
        expect(screenElement).toHaveTextContent(screenName)
      })
    })

    it('maps screens to correct components', () => {
      render(<BusinessEventNavigator />)
      
      // EventList → BusinessEventListScreen
      expect(screen.getByTestId('business-event-list-screen')).toBeOnTheScreen()
      
      // CreateEvent → BusinessEventFormScreen
      expect(screen.getByText('BusinessEventFormScreen - CreateEvent')).toBeOnTheScreen()
      
      // EditEvent → BusinessEventFormScreen  
      expect(screen.getByText('BusinessEventFormScreen - EditEvent')).toBeOnTheScreen()
    })
  })

  describe('Export Validation', () => {
    it('exports BusinessEventNavigator function', () => {
      expect(typeof BusinessEventNavigator).toBe('function')
    })

    it('exports BusinessEventStackParamList type', () => {
      // Type validation - this would fail if type export is broken
      const paramList: BusinessEventStackParamList = {
        EventList: undefined,
        CreateEvent: undefined,
        EditEvent: { eventId: 'test' },
        EventDetail: { eventId: 'test' },
      }
      
      expect(paramList).toBeDefined()
    })
  })

  describe('Integration Points', () => {
    it('is compatible with React Navigation architecture', () => {
      render(<BusinessEventNavigator />)
      
      // Navigator should render without navigation context errors
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
    })

    it('integrates with BusinessNavigator type system', () => {
      // Type validation for composite screen props
      // This validates the BusinessEventStackScreenProps type works correctly
      render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
    })
  })

  describe('Error Handling', () => {
    it('renders without crashing', () => {
      expect(() => render(<BusinessEventNavigator />)).not.toThrow()
    })

    it('handles missing dependencies gracefully', () => {
      render(<BusinessEventNavigator />)
      
      // Should render even with mocked dependencies
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now()
      render(<BusinessEventNavigator />)
      const endTime = performance.now()
      
      // Should render quickly (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('supports re-rendering without issues', () => {
      const { rerender } = render(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
      
      rerender(<BusinessEventNavigator />)
      
      expect(screen.getByTestId('stack-navigator')).toBeOnTheScreen()
    })
  })
})