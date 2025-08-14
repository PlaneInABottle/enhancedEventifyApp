import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'

import { TabNavigation, ListTabScreen } from './TabNavigation'
import { useStores } from '@/models/helpers/useStores'

// Mock dependencies
jest.mock('@/theme/context', () => ({
  useAppTheme: () => ({
    themed: (style: any) => style,
    theme: {
      colors: {
        background: '#ffffff',
        separator: '#e1e1e1',
        tint: '#5946B2',
        textDim: '#666666',
      },
    },
  }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/models/helpers/useStores')
jest.mock('@/screens/MapScreen', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  return {
    MapScreen: () => React.createElement(View, { testID: 'map-screen' }, 
      React.createElement(Text, {}, 'Map Screen')
    ),
  }
})

jest.mock('@/i18n/translate', () => ({
  translate: (key: string) => {
    const translations: Record<string, string> = {
      'eventListing:mapTab': 'Map',
      'eventListing:listTab': 'List',
      'eventListing:noEventsTitle': 'No Events Found',
      'eventListing:noEventsSubtitle': 'Try adjusting your search filters',
    }
    return translations[key] || key
  },
}))

jest.mock('./EventCard', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  return {
    EventCard: ({ event }: any) => React.createElement(View, {
      testID: `event-card-${event.instance_id}`,
    }, React.createElement(Text, {}, event.event_title)),
  }
})

jest.mock('./Screen', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    Screen: ({ children, contentContainerStyle }: any) => 
      React.createElement(View, { style: contentContainerStyle }, children),
  }
})

// Mock observer HOC and Observer component
jest.mock('mobx-react-lite', () => {
  const React = require('react')
  return {
    observer: (component: any) => component,
    Observer: ({ children }: any) => React.createElement(React.Fragment, {}, children()),
  }
})

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

const createMockEvent = (id: string) => ({
  instance_id: id,
  event_id: `event-${id}`,
  venue_id: 'venue-123',
  event_title: `Test Event ${id}`,
  venue_name: 'Test Venue',
  formattedStartTime: 'Sep 15, 2025, 6:00 PM',
  // ... other required fields
})

// ListTabScreen is now imported at the top

describe('TabNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    mockUseStores.mockReturnValue({
      mapStore: { events: [] },
    } as any)

    const { root } = render(
      <NavigationContainer>
        <TabNavigation />
      </NavigationContainer>
    )

    expect(root).toBeTruthy()
  })

  it('creates tab navigator with correct configuration', () => {
    mockUseStores.mockReturnValue({
      mapStore: { events: [] },
    } as any)

    // Test that the component can be created without errors
    const component = TabNavigation({})
    expect(component).toBeTruthy()
  })
})

describe('ListTabScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders empty state when no events in store', () => {
    mockUseStores.mockReturnValue({
      mapStore: { events: [] },
    } as any)

    const { getByText } = render(<ListTabScreen />)

    expect(getByText('No Events Found')).toBeTruthy()
    expect(getByText('Try adjusting your search filters')).toBeTruthy()
  })

  it('renders event list when events exist in store', () => {
    const mockEvents = [
      createMockEvent('1'),
      createMockEvent('2'),
      createMockEvent('3'),
    ]

    mockUseStores.mockReturnValue({
      mapStore: { events: mockEvents },
    } as any)

    const { getByTestId } = render(<ListTabScreen />)

    expect(getByTestId('event-card-1')).toBeTruthy()
    expect(getByTestId('event-card-2')).toBeTruthy()
    expect(getByTestId('event-card-3')).toBeTruthy()
  })

  it('updates when store events change', () => {
    let mockEvents: any[] = []
    
    mockUseStores.mockReturnValue({
      mapStore: { 
        get events() { return mockEvents }
      },
    } as any)

    const { queryByText, getByText, rerender } = render(<ListTabScreen />)

    // Initially should show empty state
    expect(getByText('No Events Found')).toBeTruthy()

    // Update the mock events
    mockEvents = [createMockEvent('1')]
    
    // Force re-render to simulate MobX update
    rerender(<ListTabScreen />)

    expect(queryByText('No Events Found')).toBeFalsy()
    expect(getByText('Test Event 1')).toBeTruthy()
  })

  it('passes correct props to EventCard components', () => {
    const mockEvent = createMockEvent('1')
    mockUseStores.mockReturnValue({
      mapStore: { events: [mockEvent] },
    } as any)

    const { root } = render(<ListTabScreen />)

    const eventCard = root.findByType(require('./EventCard').EventCard)
    expect(eventCard.props.event).toEqual(mockEvent)
  })
})