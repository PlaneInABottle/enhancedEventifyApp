import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { BusinessEventListScreen } from './BusinessEventListScreen'
import { ThemeProvider } from '@/theme/context'
import type { IBusinessEvent } from '@/models/BusinessEventModels'
import { BusinessEventModel } from '@/models/BusinessEventModels'
import { EventInstanceStatus } from '@/services/event/businessEventTypes'

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/i18n/translate', () => ({
  translate: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'common:error': 'Error',
      'errors:unknownError': 'Unknown error occurred',
      'businessEvent:upcomingEvents': 'Upcoming Events',
      'businessEvent:activeEvents': 'Active Events',
      'businessEvent:pastEvents': 'Past Events',
      'businessEvent:noEventsTitle': 'No Events',
      'businessEvent:noEventsMessage': 'You have no events yet',
      'businessEvent:createFirstEvent': 'Create Your First Event',
      'businessEvent:createNewEvent': 'Create New Event',
      'businessEvent:deleteEventTitle': 'Delete Event',
      'businessEvent:deleteEventMessage': 'Are you sure you want to delete {{title}}?',
      'businessEvent:instanceCount': '{{count}} instances',
      'businessEvent:nextInstance': 'Next Instance',
      'businessEvent:status': 'Status',
      'common:cancel': 'Cancel',
      'common:delete': 'Delete',
      'common:edit': 'Edit',
      'errors:eventNotFound': 'Event not found',
      'errors:deleteFailed': 'Failed to delete event',
    }
    
    // Handle interpolation
    if (options && key === 'businessEvent:deleteEventMessage') {
      return `Are you sure you want to delete ${options.title}?`
    }
    if (options && key === 'businessEvent:instanceCount') {
      return `${options.count} instances`
    }
    
    return translations[key] || key
  }),
}))

// Mock stores
const mockBusinessEventStore = {
  events: [] as any[],
  isLoading: false,
  fetchEvents: jest.fn(),
}

const mockBusinessProfileStore = {
  profile: {
    id: 'business-1',
  } as any,
}

jest.mock('@/models', () => ({
  useStores: () => ({
    businessEventStore: mockBusinessEventStore,
    businessProfileStore: mockBusinessProfileStore,
  }),
}))

// Mock BusinessEventList component
jest.mock('@/components/BusinessEventList', () => ({
  BusinessEventList: ({ 
    events, 
    isLoading, 
    isRefreshing, 
    onRefresh, 
    onEventPress, 
    onEditEvent, 
    onDeleteEvent, 
    onCreateEvent, 
    showActions 
  }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    
    return React.createElement(View, { testID: 'business-event-list' },
      React.createElement(Text, { testID: 'events-count' }, `Events: ${events.length}`),
      React.createElement(Text, { testID: 'loading-state' }, `Loading: ${isLoading}`),
      React.createElement(Text, { testID: 'refreshing-state' }, `Refreshing: ${isRefreshing}`),
      React.createElement(Text, { testID: 'show-actions' }, `Actions: ${showActions}`),
      onRefresh && React.createElement(TouchableOpacity, {
        testID: 'refresh-button',
        onPress: onRefresh
      }, React.createElement(Text, {}, 'Refresh')),
      onCreateEvent && React.createElement(TouchableOpacity, {
        testID: 'create-event-button',
        onPress: onCreateEvent
      }, React.createElement(Text, {}, 'Create Event')),
      events.length > 0 && events.map((event: IBusinessEvent, index: number) => 
        React.createElement(View, { key: event.id, testID: `event-${event.id}` },
          React.createElement(Text, {}, event.title),
          React.createElement(TouchableOpacity, {
            testID: `event-press-${event.id}`,
            onPress: () => onEventPress(event)
          }, React.createElement(Text, {}, 'View Event')),
          React.createElement(TouchableOpacity, {
            testID: `edit-event-${event.id}`,
            onPress: () => onEditEvent(event)
          }, React.createElement(Text, {}, 'Edit Event')),
          React.createElement(TouchableOpacity, {
            testID: `delete-event-${event.id}`,
            onPress: () => onDeleteEvent(event)
          }, React.createElement(Text, {}, 'Delete Event'))
        )
      )
    )
  },
}))

// Mock Screen component
jest.mock('@/components/Screen', () => ({
  Screen: ({ children, preset, safeAreaEdges, contentContainerStyle }: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { 
      testID: 'screen',
      'data-preset': preset,
      'data-safe-area-edges': JSON.stringify(safeAreaEdges),
      style: contentContainerStyle 
    }, children)
  },
}))

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
}

// Mock Alert
jest.spyOn(Alert, 'alert')

// Helper function to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

// Mock event data factory
function createMockEvent(overrides?: any): IBusinessEvent {
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + 7)
  const endDate = new Date(futureDate)
  endDate.setHours(endDate.getHours() + 2)
  
  const defaultData = {
    id: 'event-1',
    business_id: 'business-1',
    title: 'Test Event',
    description: 'Test Description',
    imageUrl: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    instances: [{
      id: 'instance-1',
      event_id: 'event-1',
      venue_id: 'venue-1',
      start_datetime: futureDate.toISOString(),
      end_datetime: endDate.toISOString(),
      max_attendees: 50,
      event_instance_status: 'published' as EventInstanceStatus,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }],
    ...overrides,
  }
  
  const mockEvent = BusinessEventModel.create(defaultData)
  
  // Mock the actions and computed values that aren't part of the model snapshot
  ;(mockEvent as any).setProp = jest.fn()
  ;(mockEvent as any).update = jest.fn()
  ;(mockEvent as any).delete = jest.fn().mockResolvedValue({ success: true })
  ;(mockEvent as any).addNewInstance = jest.fn()
  
  // Mock instance actions
  mockEvent.instances.forEach((instance: any) => {
    instance.setProp = jest.fn()
    instance.update = jest.fn()
    instance.delete = jest.fn()
  })
  
  return mockEvent
}

describe('BusinessEventListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset stores
    mockBusinessEventStore.events = []
    mockBusinessEventStore.isLoading = false
    mockBusinessProfileStore.profile = { id: 'business-1' }
  })

  describe('Initial Loading', () => {
    it('renders screen with correct preset and safe area edges', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      const screenComponent = screen.getByTestId('screen')
      expect(screenComponent).toBeOnTheScreen()
      expect(screenComponent.props['data-preset']).toBe('fixed')
      expect(JSON.parse(screenComponent.props['data-safe-area-edges'])).toEqual(['top'])
    })

    it('renders BusinessEventList with correct props', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('business-event-list')).toBeOnTheScreen()
      expect(screen.getByTestId('events-count')).toHaveTextContent('Events: 0')
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading: false')
      expect(screen.getByTestId('show-actions')).toHaveTextContent('Actions: true')
    })

    it('fetches events on mount when business profile exists', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledWith('business-1')
    })

    it('does not fetch events when no business profile', () => {
      mockBusinessProfileStore.profile = null
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).not.toHaveBeenCalled()
    })

    it('refetches events when business profile ID changes', () => {
      const { rerender } = renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledWith('business-1')
      
      // Change business profile ID
      mockBusinessProfileStore.profile = { id: 'business-2' }
      rerender(
        <ThemeProvider>
          <BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />
        </ThemeProvider>
      )
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledWith('business-2')
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledTimes(2)
    })
  })

  describe('Event Display', () => {
    it('displays events from store', () => {
      const events = [
        createMockEvent({ id: 'event-1', title: 'Event 1' }),
        createMockEvent({ id: 'event-2', title: 'Event 2' }),
      ]
      mockBusinessEventStore.events = events
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('events-count')).toHaveTextContent('Events: 2')
      expect(screen.getByText('Event 1')).toBeOnTheScreen()
      expect(screen.getByText('Event 2')).toBeOnTheScreen()
    })

    it('shows loading state from store', () => {
      mockBusinessEventStore.isLoading = true
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading: true')
      expect(screen.getByTestId('refreshing-state')).toHaveTextContent('Refreshing: true')
    })
  })

  describe('Refresh Functionality', () => {
    it('handles refresh action', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('refresh-button'))
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledWith('business-1')
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledTimes(2) // Once on mount, once on refresh
    })

    it('does not refresh when no business profile', () => {
      mockBusinessProfileStore.profile = null
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('refresh-button'))
      
      expect(mockBusinessEventStore.fetchEvents).not.toHaveBeenCalled()
    })
  })

  describe('Navigation Actions', () => {
    it('navigates to create event screen', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('create-event-button'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateEvent')
    })

    it('navigates to event detail screen', () => {
      const event = createMockEvent({ id: 'event-1' })
      mockBusinessEventStore.events = [event]
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('event-press-event-1'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditEvent', { eventId: 'event-1' })
    })

    it('navigates to edit event screen', () => {
      const event = createMockEvent({ id: 'event-1' })
      mockBusinessEventStore.events = [event]
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('edit-event-event-1'))
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditEvent', { eventId: 'event-1' })
    })
  })

  describe('Delete Event Functionality', () => {
    it('deletes event successfully', async () => {
      const event = createMockEvent({ id: 'event-1', title: 'Test Event' })
      mockBusinessEventStore.events = [event]
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('delete-event-event-1'))
      
      await waitFor(() => {
        expect(event.delete).toHaveBeenCalled()
      })
      
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('shows error alert when delete fails', async () => {
      const event = createMockEvent({ id: 'event-1', title: 'Test Event' })
      // Override default success mock for this failure test
      event.delete = jest.fn().mockResolvedValue({ success: false, error: 'errors:deleteFailed' })
      mockBusinessEventStore.events = [event]
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('delete-event-event-1'))
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete event')
      }, { timeout: 2000 })
    })

    it('shows error alert when delete throws exception', async () => {
      const event = createMockEvent({ id: 'event-1', title: 'Test Event' })
      // Override default success mock for this exception test
      event.delete = jest.fn().mockRejectedValue(new Error('Network error'))
      mockBusinessEventStore.events = [event]
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('delete-event-event-1'))
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Unknown error occurred')
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete event:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Store Integration', () => {
    it('passes correct store data to BusinessEventList', () => {
      const events = [createMockEvent()]
      mockBusinessEventStore.events = events
      mockBusinessEventStore.isLoading = true
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('events-count')).toHaveTextContent('Events: 1')
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading: true')
      expect(screen.getByTestId('refreshing-state')).toHaveTextContent('Refreshing: true')
    })

    it('uses isLoading for both loading and refreshing states', () => {
      mockBusinessEventStore.isLoading = false
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading: false')
      expect(screen.getByTestId('refreshing-state')).toHaveTextContent('Refreshing: false')
    })
  })

  describe('Component Props', () => {
    it('passes showActions as true', () => {
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('show-actions')).toHaveTextContent('Actions: true')
    })

    it('passes all required callbacks to BusinessEventList', () => {
      const event = createMockEvent()
      mockBusinessEventStore.events = [event]
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      // All callback buttons should be present
      expect(screen.getByTestId('refresh-button')).toBeOnTheScreen()
      expect(screen.getByTestId('create-event-button')).toBeOnTheScreen()
      expect(screen.getByTestId(`event-press-${event.id}`)).toBeOnTheScreen()
      expect(screen.getByTestId(`edit-event-${event.id}`)).toBeOnTheScreen()
      expect(screen.getByTestId(`delete-event-${event.id}`)).toBeOnTheScreen()
    })
  })

  describe('Screen Layout', () => {
    it('applies correct container styling', () => {
      const { getByTestId } = renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      const screenComponent = getByTestId('screen')
      expect(screenComponent.props.style).toEqual({ flex: 1 })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty events array', () => {
      mockBusinessEventStore.events = []
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('events-count')).toHaveTextContent('Events: 0')
    })

    it('handles business profile becoming null after mount', () => {
      const { rerender } = renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledWith('business-1')
      
      // Business profile becomes null
      mockBusinessProfileStore.profile = null
      rerender(
        <ThemeProvider>
          <BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />
        </ThemeProvider>
      )
      
      // Should not fetch again
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledTimes(1)
    })

    it('handles rapid business profile ID changes', () => {
      const { rerender } = renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      mockBusinessProfileStore.profile = { id: 'business-2' }
      rerender(
        <ThemeProvider>
          <BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />
        </ThemeProvider>
      )
      
      mockBusinessProfileStore.profile = { id: 'business-3' }
      rerender(
        <ThemeProvider>
          <BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />
        </ThemeProvider>
      )
      
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenCalledTimes(3)
      expect(mockBusinessEventStore.fetchEvents).toHaveBeenLastCalledWith('business-3')
    })

    it('handles navigation without route params', () => {
      const mockNavigationWithoutRoute = {
        navigate: jest.fn(),
      }
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigationWithoutRoute as any} route={{} as any} />)
      
      fireEvent.press(screen.getByTestId('create-event-button'))
      
      expect(mockNavigationWithoutRoute.navigate).toHaveBeenCalledWith('CreateEvent')
    })
  })

  describe('Memory Management', () => {
    it('uses useCallback for event handlers', () => {
      // This test verifies that the component renders without errors
      // useCallback prevents unnecessary re-renders
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(screen.getByTestId('business-event-list')).toBeOnTheScreen()
    })
  })

  describe('Business Profile Dependency', () => {
    it('handles undefined business profile', () => {
      mockBusinessProfileStore.profile = undefined
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).not.toHaveBeenCalled()
    })

    it('handles business profile without ID', () => {
      mockBusinessProfileStore.profile = {} as any
      
      renderWithTheme(<BusinessEventListScreen navigation={mockNavigation as any} route={{} as any} />)
      
      expect(mockBusinessEventStore.fetchEvents).not.toHaveBeenCalled()
    })
  })
})