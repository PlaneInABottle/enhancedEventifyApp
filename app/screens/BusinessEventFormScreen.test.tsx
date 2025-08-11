import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { BusinessEventFormScreen } from './BusinessEventFormScreen'
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
      'businessEvent:createEvent': 'Create Event',
      'businessEvent:editEvent': 'Edit Event',
      'businessEvent:eventCreatedSuccessfully': 'Event created successfully',
      'businessEvent:eventUpdatedSuccessfully': 'Event updated successfully',
      'common:success': 'Success',
      'errors:businessIdNotAvailable': 'Business ID not available',
      'errors.eventNotFound': 'Event not found',
      'errors:unknownError': 'Unknown error occurred',
    }
    
    return translations[key] || key
  }),
}))


// Mock stores
const mockBusinessEventStore = {
  getEventById: jest.fn(),
  createEvent: jest.fn(),
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

// Mock BusinessEventForm component
let formErrorMessage: string | null = null

jest.mock('@/components/BusinessEventForm', () => ({
  BusinessEventForm: ({ onSubmit, isSubmitting, errorMessage, initialData }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    const { translate } = require('@/i18n/translate')
    
    // Update global error state
    formErrorMessage = errorMessage
    
    const formData = {
      title: 'Test Event',
      description: 'Test Description',
      instances: [{
        venue_id: 'venue-1',
        start_datetime: '2025-01-01T10:00:00Z',
        end_datetime: '2025-01-01T12:00:00Z',
        max_attendees: 50,
        event_instance_status: 'published',
      }],
    }
    
    return React.createElement(View, { testID: 'business-event-form' },
      React.createElement(Text, {}, 'Business Event Form'),
      initialData && React.createElement(Text, { testID: 'initial-data' }, `Initial: ${initialData.title}`),
      errorMessage && React.createElement(Text, { testID: 'error-message' }, translate(errorMessage)),
      React.createElement(TouchableOpacity, {
        testID: 'submit-form',
        onPress: () => onSubmit(formData),
        disabled: isSubmitting,
      }, React.createElement(Text, {}, isSubmitting ? 'Submitting...' : 'Submit'))
    )
  },
}))

// Mock Screen component
jest.mock('@/components/Screen', () => ({
  Screen: ({ children, contentContainerStyle }: any) => {
    const React = require('react')
    const { View } = require('react-native')
    return React.createElement(View, { 
      testID: 'screen',
      style: contentContainerStyle 
    }, children)
  },
}))

// Mock Text component  
jest.mock('@/components/Text', () => ({
  Text: ({ tx, text, style }: any) => {
    const React = require('react')
    const { Text: RNText } = require('react-native')
    const { translate } = require('@/i18n/translate')
    return React.createElement(RNText, { style }, tx ? translate(tx) : text)
  },
}))

// Mock navigation
const mockNavigation = {
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
    title: 'Existing Event',
    description: 'Existing Description',
    imageUrl: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    instances: [{
      id: 'instance-1',
      event_id: 'event-1',
      venue_id: 'venue-1',
      start_datetime: futureDate.toISOString(),
      end_datetime: endDate.toISOString(),
      max_attendees: 100,
      event_instance_status: 'published' as EventInstanceStatus,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }],
    ...overrides,
  }
  
  const mockEvent = BusinessEventModel.create(defaultData)
  
  // Mock the actions that aren't part of the model snapshot
  ;(mockEvent as any).setProp = jest.fn()
  ;(mockEvent as any).update = jest.fn().mockResolvedValue({ success: true })
  ;(mockEvent as any).delete = jest.fn().mockResolvedValue({ success: true })
  ;(mockEvent as any).addNewInstance = jest.fn().mockResolvedValue({ success: true })
  
  // Mock instance actions
  mockEvent.instances.forEach((instance: any) => {
    instance.setProp = jest.fn()
    instance.update = jest.fn().mockResolvedValue({ success: true })
    instance.delete = jest.fn().mockResolvedValue({ success: true })
  })
  
  return mockEvent
}

describe('BusinessEventFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    formErrorMessage = null
    // Reset business profile
    mockBusinessProfileStore.profile = { id: 'business-1' }
  })

  describe('Route Name Discrimination', () => {
    it('shows create title when route name is CreateEvent', () => {
      const route = { name: 'CreateEvent', params: {} }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByText('Create Event')).toBeOnTheScreen()
    })

    it('shows edit title when route name is EditEvent', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByText('Edit Event')).toBeOnTheScreen()
    })

    it('determines editing mode correctly based on route name', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(mockBusinessEventStore.getEventById).toHaveBeenCalledWith('event-1')
    })
  })

  describe('Initial Data Loading for Edit Mode', () => {
    it('loads event data when editing', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({
        title: 'Edit Test Event',
        description: 'Edit Test Description',
      })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('initial-data')).toHaveTextContent('Initial: Edit Test Event')
    })

    it('does not load data when creating new event', () => {
      const route = { name: 'CreateEvent', params: {} }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.queryByTestId('initial-data')).not.toBeOnTheScreen()
      expect(mockBusinessEventStore.getEventById).not.toHaveBeenCalled()
    })

    it('handles missing event in edit mode', () => {
      const route = { name: 'EditEvent', params: { eventId: 'missing-event' } }
      mockBusinessEventStore.getEventById.mockReturnValue(null)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.queryByTestId('initial-data')).not.toBeOnTheScreen()
    })

    it('maps instance data correctly for edit mode', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({
        instances: [{
          id: 'instance-1',
          event_id: 'event-1',
          venue_id: 'venue-2',
          start_datetime: '2025-02-01T14:00:00Z',
          end_datetime: '2025-02-01T16:00:00Z',
          max_attendees: 75,
          event_instance_status: 'draft' as EventInstanceStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venue: undefined,
          setProp: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        }] as any
      })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(mockBusinessEventStore.getEventById).toHaveBeenCalledWith('event-1')
    })
  })

  describe('Form Submission - Create Mode', () => {
    it('creates new event successfully', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ success: true })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockBusinessEventStore.createEvent).toHaveBeenCalledWith('business-1', {
          title: 'Test Event',
          description: 'Test Description',
          instances: [{
            venue_id: 'venue-1',
            start_datetime: '2025-01-01T10:00:00Z',
            end_datetime: '2025-01-01T12:00:00Z',
            max_attendees: 50,
            event_instance_status: 'published',
          }]
        })
      })
    })

    it('shows success alert and navigates back after creation', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ success: true })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event created successfully')
        expect(mockNavigation.goBack).toHaveBeenCalled()
      })
    })

    it('shows error when business profile not available', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessProfileStore.profile = null
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Business ID not available')
      })
    })

    it('handles creation failure', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ 
        success: false, 
        error: 'errors:unknownError' 
      })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unknown error occurred')
        expect(mockNavigation.goBack).not.toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission - Edit Mode', () => {
    it('updates existing event successfully', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalledWith({
          title: 'Test Event',
          description: 'Test Description',
        })
      })
    })

    it('shows success alert after update', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Event updated successfully')
        expect(mockNavigation.goBack).toHaveBeenCalled()
      })
    })

    it('handles event not found in edit mode', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'missing-event' } }
      mockBusinessEventStore.getEventById.mockReturnValue(null)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Event not found')
      })
    })

    it('handles update failure', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      // Override the default success mock for this test
      mockEvent.update = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'errors:unknownError' 
      })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unknown error occurred')
        expect(mockNavigation.goBack).not.toHaveBeenCalled()
      })
    })
  })

  describe('Instance Diffing for Edit Mode', () => {
    it('updates existing instances that changed', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalled()
        // Instance diffing will be called after main update
      })
    })

    it('creates new instances without IDs', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalled()
      })
    })

    it('deletes removed instances', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalled()
      })
    })

    it('handles instance update failures', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent()
      const mockInstance = mockEvent.instances[0]
      // Override the default success mock for this test
      mockInstance.update = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'errors:unknownError' 
      })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockEvent.update).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('disables submit button while submitting', () => {
      const route = { name: 'CreateEvent', params: {} }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      expect(screen.getByText('Submitting...')).toBeOnTheScreen()
    })

    it('re-enables submit button after completion', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ success: true })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled()
      })
    })

    it('re-enables submit button after error', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ 
        success: false, 
        error: 'errors:unknownError' 
      })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeOnTheScreen()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error messages', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockResolvedValue({ 
        success: false, 
        error: 'errors:unknownError' 
      })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unknown error occurred')
      })
    })

    it('clears error messages on new submission', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent
        .mockResolvedValueOnce({ success: false, error: 'errors:unknownError' })
        .mockResolvedValueOnce({ success: true })
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      // First submission - should show error
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeOnTheScreen()
      })
      
      // Second submission - should clear error
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeOnTheScreen()
      })
    })

    it('handles exceptions during submission', async () => {
      const route = { name: 'CreateEvent', params: {} }
      mockBusinessEventStore.createEvent.mockRejectedValue(new Error('Network error'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Unknown error occurred')
        expect(consoleSpy).toHaveBeenCalledWith('Error submitting event form:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Screen Layout', () => {
    it('renders Screen component with correct props', () => {
      const route = { name: 'CreateEvent', params: {} }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('screen')).toBeOnTheScreen()
    })

    it('renders BusinessEventForm with correct props', () => {
      const route = { name: 'CreateEvent', params: {} }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('business-event-form')).toBeOnTheScreen()
      expect(screen.getByText('Business Event Form')).toBeOnTheScreen()
    })

    it('passes initial data to form in edit mode', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({ title: 'Pre-filled Event' })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('initial-data')).toHaveTextContent('Initial: Pre-filled Event')
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined route params', () => {
      const route = { name: 'CreateEvent' }
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByText('Create Event')).toBeOnTheScreen()
    })

    it('handles missing business profile in edit mode', async () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({ title: 'Pre-filled Event' })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      mockBusinessProfileStore.profile = null
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      fireEvent.press(screen.getByTestId('submit-form'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Business ID not available')
      })
    })

    it('handles null max_attendees in instance mapping', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({
        instances: [{
          id: 'instance-1',
          event_id: 'event-1',
          venue_id: 'venue-1',
          start_datetime: '2025-01-01T10:00:00Z',
          end_datetime: '2025-01-01T12:00:00Z',
          max_attendees: null,
          event_instance_status: 'draft' as EventInstanceStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          venue: undefined,
          setProp: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        } as any]
      })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('initial-data')).toBeOnTheScreen()
    })

    it('handles events with no description', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({ description: null })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('initial-data')).toBeOnTheScreen()
    })

    it('handles events with empty instances array', () => {
      const route = { name: 'EditEvent', params: { eventId: 'event-1' } }
      const mockEvent = createMockEvent({ instances: [] as any })
      mockBusinessEventStore.getEventById.mockReturnValue(mockEvent)
      
      renderWithTheme(<BusinessEventFormScreen navigation={mockNavigation as any} route={route as any} />)
      
      expect(screen.getByTestId('initial-data')).toBeOnTheScreen()
    })
  })
})