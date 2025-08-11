import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { BusinessEventForm } from './BusinessEventForm'
import { EventInstanceStatus } from '@/services/event/businessEventTypes'
import { ThemeProvider } from '@/theme/context'

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('@/i18n/translate', () => ({
  translate: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'businessEvent:eventDetails': 'Event Details',
      'businessEvent:titleLabel': 'Event Title',
      'businessEvent:titlePlaceholder': 'Enter event title',
      'businessEvent:descriptionLabel': 'Event Description',
      'businessEvent:descriptionPlaceholder': 'Enter event description',
      'businessEvent:eventInstances': 'Event Instances',
      'businessEvent:addInstance': 'Add Instance',
      'businessEvent:createEvent': 'Create Event',
      'businessEvent:validationErrorTitle': 'Validation Error',
      'businessEvent:validationErrorMessage': 'Please fix the errors and try again',
      'common:error': 'Error',
      'common:ok': 'OK',
      'errors.titleRequired': 'Title is required',
      'errors.titleTooShort': 'Title is too short',
      'errors.instancesRequired': 'At least one instance is required',
    }
    return translations[key] || key
  }),
}))

jest.mock('@/models', () => ({
  useStores: () => ({
    venueStore: {
      venues: [
        { id: 'venue-1', name: 'Venue 1' },
        { id: 'venue-2', name: 'Venue 2' },
      ],
    },
    businessProfileStore: {
      profile: { id: 'business-1' },
    },
  }),
}))

jest.mock('./BusinessEventInstanceFormSection', () => ({
  BusinessEventInstanceFormSection: ({ instance, index, onRemove, onUpdate, showRemoveButton }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    return React.createElement(View, { testID: `instance-section-${index}` },
      React.createElement(Text, {}, `Instance ${index + 1}`),
      showRemoveButton && React.createElement(TouchableOpacity, {
        testID: `remove-instance-${index}`,
        onPress: () => onRemove()
      }, React.createElement(Text, {}, 'Remove'))
    )
  },
}))

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

describe('BusinessEventForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    isSubmitting: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders all form fields', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      expect(screen.getByText('Event Details')).toBeOnTheScreen()
      expect(screen.getByPlaceholderText('Enter event title')).toBeOnTheScreen()
      expect(screen.getByPlaceholderText('Enter event description')).toBeOnTheScreen()
      expect(screen.getByText('Event Instances')).toBeOnTheScreen()
      expect(screen.getByText('Add Instance')).toBeOnTheScreen()
      expect(screen.getByText('Create Event')).toBeOnTheScreen()
    })

    it('displays initial values when provided', () => {
      const initialData = {
        title: 'Test Event',
        description: 'Test Description',
      }
      renderWithTheme(<BusinessEventForm {...defaultProps} initialData={initialData} />)

      expect(screen.getByDisplayValue('Test Event')).toBeOnTheScreen()
      expect(screen.getByDisplayValue('Test Description')).toBeOnTheScreen()
    })

    it('renders instances when present in initial data', () => {
      const initialData = {
        title: 'Test Event',
        instances: [
          {
            id: 'temp-1',
            venue_id: 'venue-1',
            start_datetime: '2024-03-01T10:00:00Z',
            end_datetime: '2024-03-01T12:00:00Z',
            max_attendees: 50,
            event_instance_status: 'published' as EventInstanceStatus,
          },
        ],
      }
      renderWithTheme(<BusinessEventForm {...defaultProps} initialData={initialData} />)

      expect(screen.getByTestId('instance-section-0')).toBeOnTheScreen()
      expect(screen.getByText('Instance 1')).toBeOnTheScreen()
    })

    it('shows error message when provided', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} errorMessage="errors.someError" />)

      expect(screen.getByText('errors.someError')).toBeOnTheScreen()
    })

    it('disables submit button when submitting', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} isSubmitting={true} />)

      const submitButton = screen.getByText('Create Event')
      expect(submitButton).toBeDisabled()
    })

    it('starts with one empty instance by default', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      expect(screen.getByTestId('instance-section-0')).toBeOnTheScreen()
      expect(screen.queryByTestId('remove-instance-0')).not.toBeOnTheScreen() // No remove button when only one instance
    })
  })

  describe('Interactions', () => {
    it('updates title field', () => {
      const onSubmit = jest.fn()
      renderWithTheme(<BusinessEventForm {...defaultProps} onSubmit={onSubmit} />)

      const titleInput = screen.getByPlaceholderText('Enter event title')
      fireEvent.changeText(titleInput, 'New Event Title')

      // The form won't submit with just a title because instances need to be valid
      // Let's just check the value was updated by checking the input
      expect(titleInput.props.value).toBe('New Event Title')
    })

    it('updates description field', () => {
      const onSubmit = jest.fn()
      renderWithTheme(<BusinessEventForm {...defaultProps} onSubmit={onSubmit} />)

      const descriptionInput = screen.getByPlaceholderText('Enter event description')
      fireEvent.changeText(descriptionInput, 'New Description')
      
      // The form won't submit without valid instances
      // Let's just check the value was updated by checking the input
      expect(descriptionInput.props.value).toBe('New Description')
    })

    it('adds new instance', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      const addButton = screen.getByText('Add Instance')
      fireEvent.press(addButton)

      expect(screen.getByTestId('instance-section-0')).toBeOnTheScreen()
      expect(screen.getByTestId('instance-section-1')).toBeOnTheScreen()
      expect(screen.getByTestId('remove-instance-0')).toBeOnTheScreen() // Remove buttons appear when > 1 instance
      expect(screen.getByTestId('remove-instance-1')).toBeOnTheScreen()
    })

    it('removes instance', () => {
      const initialData = {
        instances: [
          {
            id: 'temp-1',
            venue_id: 'venue-1',
            start_datetime: '2024-03-01T10:00:00Z',
            end_datetime: '2024-03-01T12:00:00Z',
            max_attendees: 50,
            event_instance_status: 'published' as EventInstanceStatus,
          },
          {
            id: 'temp-2',
            venue_id: 'venue-2',
            start_datetime: '2024-03-02T10:00:00Z',
            end_datetime: '2024-03-02T12:00:00Z',
            max_attendees: 30,
            event_instance_status: 'published' as EventInstanceStatus,
          },
        ],
      }
      renderWithTheme(<BusinessEventForm {...defaultProps} initialData={initialData} />)

      const removeButton = screen.getByTestId('remove-instance-0')
      fireEvent.press(removeButton)

      expect(screen.queryByTestId('instance-section-1')).not.toBeOnTheScreen()
      expect(screen.getByTestId('instance-section-0')).toBeOnTheScreen() // Second instance becomes first
      expect(screen.queryByTestId('remove-instance-0')).not.toBeOnTheScreen() // No remove button when only one left
    })

    it('limits instances to 10', () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      const addButton = screen.getByText('Add Instance')
      
      // Add 9 more instances (starts with 1)
      for (let i = 0; i < 9; i++) {
        fireEvent.press(addButton)
      }

      // Should have 10 instances now
      expect(screen.getByTestId('instance-section-9')).toBeOnTheScreen()
      
      // Add button should be disabled
      expect(addButton).toBeDisabled()
    })
  })

  describe('Validation', () => {
    it('shows validation error alert when form is invalid', async () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      const submitButton = screen.getByText('Create Event')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please fix the errors and try again'
        )
      })
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })

    it('submits form with valid data', async () => {
      // Use future dates to pass validation
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const endDate = new Date(futureDate)
      endDate.setHours(endDate.getHours() + 2)
      
      const initialData = {
        title: 'Valid Event Title',
        description: 'Valid description',
        instances: [
          {
            id: 'temp-1',
            venue_id: 'venue-1',
            start_datetime: futureDate.toISOString(),
            end_datetime: endDate.toISOString(),
            max_attendees: 50,
            event_instance_status: 'published' as EventInstanceStatus,
          },
        ],
      }
      renderWithTheme(<BusinessEventForm {...defaultProps} initialData={initialData} />)

      const submitButton = screen.getByText('Create Event')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          title: 'Valid Event Title',
          description: 'Valid description',
          instances: expect.arrayContaining([
            expect.objectContaining({
              venue_id: 'venue-1',
              start_datetime: futureDate.toISOString(),
              end_datetime: endDate.toISOString(),
              max_attendees: 50,
              event_instance_status: 'published',
            })
          ])
        })
      })
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('validates minimum title length', async () => {
      renderWithTheme(<BusinessEventForm {...defaultProps} />)

      const titleInput = screen.getByPlaceholderText('Enter event title')
      fireEvent.changeText(titleInput, 'AB') // Too short

      const submitButton = screen.getByText('Create Event')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled()
      })
      expect(defaultProps.onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form State Management', () => {
    it('maintains instance data when adding/removing instances', () => {
      const onSubmit = jest.fn()
      // Use future dates to pass validation
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const endDate = new Date(futureDate)
      endDate.setHours(endDate.getHours() + 2)
      
      const initialData = {
        title: 'Test Event',
        instances: [
          {
            id: 'temp-1',
            venue_id: 'venue-1',
            start_datetime: futureDate.toISOString(),
            end_datetime: endDate.toISOString(),
            max_attendees: 50,
            event_instance_status: 'published' as EventInstanceStatus,
          },
        ],
      }
      renderWithTheme(<BusinessEventForm {...defaultProps} initialData={initialData} onSubmit={onSubmit} />)

      // Add another instance
      fireEvent.press(screen.getByText('Add Instance'))
      
      // Remove the new instance
      fireEvent.press(screen.getByTestId('remove-instance-1'))

      // Submit and verify original instance data is preserved
      fireEvent.press(screen.getByText('Create Event'))
      
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Event',
        description: '',
        instances: [initialData.instances[0]]
      })
    })
  })
})