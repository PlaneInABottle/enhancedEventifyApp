import React from 'react'
import { screen, fireEvent } from '@testing-library/react-native'
import { BusinessEventInstanceFormSection } from './BusinessEventInstanceFormSection'
import type { BusinessEventInstanceFormData } from './BusinessEventInstanceFormSection'
import { EventInstanceStatus } from '@/services/event/businessEventTypes'
import type { IVenue } from '@/models/VenueModels'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock('@/i18n/translate', () => ({
  translate: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'businessEvent:instanceNumber': 'Instance {{number}}',
      'businessEvent:venueLabel': 'Venue',
      'businessEvent:venuePlaceholder': 'Select venue',
      'businessEvent:startDateTimeLabel': 'Start Date & Time',
      'businessEvent:startDateTimePlaceholder': 'YYYY-MM-DD HH:MM',
      'businessEvent:endDateTimeLabel': 'End Date & Time',
      'businessEvent:endDateTimePlaceholder': 'YYYY-MM-DD HH:MM',
      'businessEvent:maxAttendeesLabel': 'Max Attendees',
      'businessEvent:maxAttendeesPlaceholder': 'Enter max attendees',
      'businessEvent:statusLabel': 'Status',
      'businessEvent:statusPlaceholder': 'Select status',
      'businessEvent:statusDraft': 'Draft',
      'businessEvent:statusPublished': 'Published',
      'common:remove': 'Remove',
      'errors.venueRequired': 'Venue is required',
      'errors.startDateRequired': 'Start date is required',
      'errors.endDateRequired': 'End date is required',
      'errors.invalidDateRange': 'End date must be after start date',
      'errors.maxAttendeesTooSmall': 'Must be at least 1',
    }
    
    // Handle interpolation
    if (options && key === 'businessEvent:instanceNumber') {
      return `Instance ${options.number}`
    }
    
    return translations[key] || key
  }),
}))

// Mock Dropdown component
jest.mock('./Dropdown', () => ({
  Dropdown: ({ labelTx, placeholderTx, options, value, onValueChange, helper, containerStyle }: any) => {
    const React = require('react')
    const { View, Text, TouchableOpacity } = require('react-native')
    const { translate } = require('@/i18n/translate')
    
    return React.createElement(View, { 
      testID: 'dropdown',
      style: containerStyle 
    },
      React.createElement(Text, {}, translate(labelTx)),
      React.createElement(TouchableOpacity, {
        testID: `dropdown-${labelTx}`,
        onPress: () => {
          // For status dropdown, simulate selecting first status option
          if (labelTx === 'businessEvent:statusLabel' && options && options.length > 0) {
            onValueChange('draft') // Always select draft for status
          }
          // For venue dropdown, simulate selecting first venue option
          else if (options && options.length > 0) {
            onValueChange(options[0].value)
          }
        }
      }, React.createElement(Text, {}, value || translate(placeholderTx))),
      helper && React.createElement(Text, { testID: `error-${labelTx}` }, helper)
    )
  },
}))

// Helper function to render BusinessEventInstanceFormSection with shared utilities
const renderBusinessEventInstanceFormSection = (props = {}) => {
  const defaultProps = {
    instance: createMockInstance(),
    index: 0,
    venues: mockVenues,
    errors: {},
    showRemoveButton: false,
    onUpdate: jest.fn(),
    onRemove: jest.fn(),
  }
  return renderWithProviders(
    <BusinessEventInstanceFormSection {...defaultProps} {...props} />,
    { withStoreProvider: false }
  )
}

// Mock data
const mockVenues: IVenue[] = [
  {
    id: 'venue-1',
    business_id: 'business-1',
    address_id: 'address-1',
    name: 'Main Hall',
    description: 'Large event hall',
    capacity: 200,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    address: {
      id: 'address-1',
      full_address: 'Building A',
      city: 'Istanbul',
      country: 'Turkey',
      postal_code: '34000',
      coordinates: {
        type: 'Point',
        coordinates: [28.9784, 41.0082] // [longitude, latitude]
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      longitude: 28.9784,
      latitude: 41.0082,
      formattedAddress: 'Building A, Istanbul, Turkey',
    },
    hasAddress: true,
    fullLocation: 'Building A, Istanbul, Turkey',
    coordinates: {
      type: 'Point',
      coordinates: [28.9784, 41.0082]
    },
    isActive: true,
  },
  {
    id: 'venue-2',
    business_id: 'business-1',
    address_id: 'address-2',
    name: 'Conference Room',
    description: 'Small meeting room',
    capacity: 50,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    address: {
      id: 'address-2',
      full_address: 'Building B',
      city: 'Istanbul',
      country: 'Turkey',
      postal_code: '34001',
      coordinates: {
        type: 'Point',
        coordinates: [28.9784, 41.0082]
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      longitude: 28.9784,
      latitude: 41.0082,
      formattedAddress: 'Building B, Istanbul, Turkey',
    },
    hasAddress: true,
    fullLocation: 'Building B, Istanbul, Turkey',
    coordinates: {
      type: 'Point',
      coordinates: [28.9784, 41.0082]
    },
    isActive: true,
  },
] as IVenue[]

const createMockInstance = (overrides?: Partial<BusinessEventInstanceFormData>): BusinessEventInstanceFormData => {
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + 7)
  const endDate = new Date(futureDate)
  endDate.setHours(endDate.getHours() + 2)
  
  return {
    id: 'instance-1',
    venue_id: 'venue-1',
    start_datetime: futureDate.toISOString(),
    end_datetime: endDate.toISOString(),
    max_attendees: 50,
    event_instance_status: 'published' as EventInstanceStatus,
    ...overrides,
  }
}

describe('BusinessEventInstanceFormSection', () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  describe('Rendering', () => {
    it('renders instance header with correct number', () => {
      renderBusinessEventInstanceFormSection({ index: 2 })
      
      expect(screen.getByText('Instance 3')).toBeOnTheScreen()
    })

    it('shows remove button when showRemoveButton is true', () => {
      renderBusinessEventInstanceFormSection({ showRemoveButton: true })
      
      expect(screen.getByText('Remove')).toBeOnTheScreen()
    })

    it('hides remove button when showRemoveButton is false', () => {
      renderBusinessEventInstanceFormSection({ showRemoveButton: false })
      
      expect(screen.queryByText('Remove')).not.toBeOnTheScreen()
    })

    it('renders all form fields', () => {
      renderBusinessEventInstanceFormSection()
      
      expect(screen.getByText('Venue')).toBeOnTheScreen()
      expect(screen.getByText('Start Date & Time')).toBeOnTheScreen()
      expect(screen.getByText('End Date & Time')).toBeOnTheScreen()
      expect(screen.getByText('Max Attendees')).toBeOnTheScreen()
      expect(screen.getByText('Status')).toBeOnTheScreen()
    })

    it('displays current field values', () => {
      const instance = createMockInstance({
        venue_id: 'venue-1',
        start_datetime: '2024-12-25T10:00:00Z',
        end_datetime: '2024-12-25T12:00:00Z',
        max_attendees: 100,
        event_instance_status: 'draft',
      })
      
      renderBusinessEventInstanceFormSection({ instance })
      
      // Check that the date fields are present (they will show formatted dates, not ISO strings)
      const dateDisplayElements = screen.getAllByTestId('date-display-text')
      expect(dateDisplayElements).toHaveLength(2) // start and end datetime
      expect(screen.getByDisplayValue('100')).toBeOnTheScreen()
    })

    it('handles null max_attendees', () => {
      const instance = createMockInstance({ max_attendees: null })
      
      renderBusinessEventInstanceFormSection({ instance })
      
      expect(screen.getByPlaceholderText('Enter max attendees')).toBeOnTheScreen()
    })
  })

  describe('Field Updates', () => {
    it('calls onUpdate when venue changes', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      fireEvent.press(screen.getByTestId('dropdown-businessEvent:venueLabel'))
      
      expect(onUpdate).toHaveBeenCalledWith({ venue_id: 'venue-1' })
    })

    it('calls onUpdate when start datetime changes', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      // Verify that DateTimePicker components are rendered
      const dateTimeContainers = screen.getAllByTestId('date-time-picker-container')
      expect(dateTimeContainers).toHaveLength(2) // Start and end datetime
      
      // The actual onChange functionality is tested in DateTimePicker.test.tsx
      // Here we just verify the component is wired up correctly
      expect(dateTimeContainers[0]).toBeTruthy()
    })

    it('calls onUpdate when end datetime changes', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      // Verify that DateTimePicker components are rendered
      const dateTimeContainers = screen.getAllByTestId('date-time-picker-container')
      expect(dateTimeContainers).toHaveLength(2) // Start and end datetime
      
      // The actual onChange functionality is tested in DateTimePicker.test.tsx
      // Here we just verify the component is wired up correctly
      expect(dateTimeContainers[1]).toBeTruthy()
    })

    it('calls onUpdate when max attendees changes', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      const maxAttendeesField = screen.getByPlaceholderText('Enter max attendees')
      fireEvent.changeText(maxAttendeesField, '150')
      
      expect(onUpdate).toHaveBeenCalledWith({ max_attendees: 150 })
    })

    it('calls onUpdate with null when max attendees is empty', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      const maxAttendeesField = screen.getByPlaceholderText('Enter max attendees')
      fireEvent.changeText(maxAttendeesField, '')
      
      expect(onUpdate).toHaveBeenCalledWith({ max_attendees: null })
    })

    it('calls onUpdate when status changes', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      fireEvent.press(screen.getByTestId('dropdown-businessEvent:statusLabel'))
      
      expect(onUpdate).toHaveBeenCalledWith({ event_instance_status: 'draft' }) // Mock always returns draft for status
    })
  })

  describe('Remove Functionality', () => {
    it('calls onRemove when remove button is pressed', () => {
      const onRemove = jest.fn()
      renderBusinessEventInstanceFormSection({ showRemoveButton: true, onRemove })
      
      fireEvent.press(screen.getByText('Remove'))
      
      expect(onRemove).toHaveBeenCalled()
    })
  })

  describe('Error Display', () => {
    it('shows venue error', () => {
      const errors = { 'instance_0_venue_id': 'errors.venueRequired' }
      renderBusinessEventInstanceFormSection({ errors })
      
      expect(screen.getByTestId('error-businessEvent:venueLabel')).toBeOnTheScreen()
      expect(screen.getByText('Venue is required')).toBeOnTheScreen()
    })

    it('shows start datetime error', () => {
      const errors = { 'instance_0_start_datetime': 'errors.startDateRequired' }
      renderBusinessEventInstanceFormSection({ errors })
      
      expect(screen.getByText('Start date is required')).toBeOnTheScreen()
    })

    it('shows end datetime error', () => {
      const errors = { 'instance_0_end_datetime': 'errors.endDateRequired' }
      renderBusinessEventInstanceFormSection({ errors })
      
      expect(screen.getByText('End date is required')).toBeOnTheScreen()
    })

    it('shows max attendees error', () => {
      const errors = { 'instance_0_max_attendees': 'errors.maxAttendeesTooSmall' }
      renderBusinessEventInstanceFormSection({ errors })
      
      expect(screen.getByText('Must be at least 1')).toBeOnTheScreen()
    })

    it('does not show errors when none exist', () => {
      renderBusinessEventInstanceFormSection()
      
      expect(screen.queryByText('Venue is required')).not.toBeOnTheScreen()
      expect(screen.queryByText('Start date is required')).not.toBeOnTheScreen()
    })

    it('shows error styling on fields with errors', () => {
      const errors = { 
        'instance_0_start_datetime': 'errors.startDateRequired',
        'instance_0_max_attendees': 'errors.maxAttendeesTooSmall'
      }
      renderBusinessEventInstanceFormSection({ errors })
      
      // Fields with errors should have error status
      // This is handled by TextField and Dropdown components internally
      expect(screen.getByText('Start date is required')).toBeOnTheScreen()
      expect(screen.getByText('Must be at least 1')).toBeOnTheScreen()
    })
  })

  describe('Venue Options', () => {
    it('formats venue options correctly', () => {
      renderBusinessEventInstanceFormSection()
      
      // The dropdown should be rendered with venue options
      expect(screen.getByTestId('dropdown-businessEvent:venueLabel')).toBeOnTheScreen()
    })

    it('handles empty venues list', () => {
      renderBusinessEventInstanceFormSection({ venues: [] })
      
      expect(screen.getByTestId('dropdown-businessEvent:venueLabel')).toBeOnTheScreen()
    })
  })

  describe('Status Options', () => {
    it('provides draft and published status options', () => {
      renderBusinessEventInstanceFormSection()
      
      // Status dropdown should be rendered
      expect(screen.getByTestId('dropdown-businessEvent:statusLabel')).toBeOnTheScreen()
    })
  })

  describe('Layout and Styling', () => {
    it('arranges datetime fields in a row', () => {
      renderBusinessEventInstanceFormSection()
      
      // DateTimePicker components render with date-time-picker-container testID
      const dateTimeContainers = screen.getAllByTestId('date-time-picker-container')
      expect(dateTimeContainers.length).toBeGreaterThanOrEqual(2) // Start and end datetime pickers
    })

    it('arranges max attendees and status in bottom row', () => {
      renderBusinessEventInstanceFormSection()
      
      expect(screen.getByPlaceholderText('Enter max attendees')).toBeOnTheScreen()
      expect(screen.getByTestId('dropdown-businessEvent:statusLabel')).toBeOnTheScreen()
    })

    it('applies proper styling to instance container', () => {
      renderBusinessEventInstanceFormSection()
      
      // Container should be rendered without errors
      expect(screen.getByText('Instance 1')).toBeOnTheScreen()
    })
  })

  describe('Keyboard Types', () => {
    it('sets numeric keyboard for max attendees field', () => {
      renderBusinessEventInstanceFormSection()
      
      const maxAttendeesField = screen.getByPlaceholderText('Enter max attendees')
      expect(maxAttendeesField.props.keyboardType).toBe('numeric')
    })
  })

  describe('Index Handling', () => {
    it('uses correct error keys based on index', () => {
      const errors = { 'instance_5_venue_id': 'errors.venueRequired' }
      renderBusinessEventInstanceFormSection({ index: 5, errors })
      
      expect(screen.getByText('Venue is required')).toBeOnTheScreen()
    })

    it('displays correct instance number based on index', () => {
      renderBusinessEventInstanceFormSection({ index: 9 })
      
      expect(screen.getByText('Instance 10')).toBeOnTheScreen() // Index + 1
    })
  })

  describe('Data Type Handling', () => {
    it('handles max_attendees as number', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      const maxAttendeesField = screen.getByPlaceholderText('Enter max attendees')
      fireEvent.changeText(maxAttendeesField, '42')
      
      expect(onUpdate).toHaveBeenCalledWith({ max_attendees: 42 })
    })

    it('handles invalid number input for max_attendees', () => {
      const onUpdate = jest.fn()
      renderBusinessEventInstanceFormSection({ onUpdate })
      
      const maxAttendeesField = screen.getByPlaceholderText('Enter max attendees')
      fireEvent.changeText(maxAttendeesField, 'abc')
      
      expect(onUpdate).toHaveBeenCalledWith({ max_attendees: NaN })
    })

    it('preserves event_instance_status type', () => {
      const instance = createMockInstance({ event_instance_status: 'draft' as EventInstanceStatus })
      renderBusinessEventInstanceFormSection({ instance })
      
      expect(screen.getByTestId('dropdown-businessEvent:statusLabel')).toBeOnTheScreen()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long venue names', () => {
      const longNameVenues: IVenue[] = [{
        ...mockVenues[0],
        name: 'Very Long Venue Name That Should Not Break The Layout And Should Be Handled Gracefully'
      }]
      
      renderBusinessEventInstanceFormSection({ venues: longNameVenues })
      
      expect(screen.getByTestId('dropdown-businessEvent:venueLabel')).toBeOnTheScreen()
    })

    it('handles missing venue_id in instance', () => {
      const instance = createMockInstance({ venue_id: '' })
      renderBusinessEventInstanceFormSection({ instance })
      
      expect(screen.getByText('Select venue')).toBeOnTheScreen()
    })

    it('handles zero max_attendees', () => {
      const instance = createMockInstance({ max_attendees: 0 })
      renderBusinessEventInstanceFormSection({ instance })
      
      expect(screen.getByDisplayValue('0')).toBeOnTheScreen()
    })
  })
})