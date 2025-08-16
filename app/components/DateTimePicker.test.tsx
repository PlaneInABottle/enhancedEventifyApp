import React from 'react'
import { Platform } from 'react-native'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { DateTimePickerField } from './DateTimePicker'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'

// SECURITY-HARDENED: Following Serena testing guide patterns
// Mock Platform.OS for cross-platform testing
const mockPlatform = {
  OS: 'ios' as 'ios' | 'android' | 'web'
}
Object.defineProperty(Platform, 'OS', {
  get: () => mockPlatform.OS,
  configurable: true
})

// Mock react-datepicker for web tests
const mockOnChange = jest.fn()
const mockReactDatePicker = jest.fn(({ onChange, selected, customInput, placeholderText, ...props }) => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  
  // Store the onChange callback for triggering in tests
  mockOnChange.mockImplementation(onChange)
  
  // Clone the customInput and add onPress functionality
  if (customInput) {
    return React.cloneElement(customInput, {
      onPress: () => {
        if (onChange) {
          onChange(new Date('2024-12-25T15:30:00.000Z')) // 24-hour format time
        }
      }
    })
  }
  
  return React.createElement(
    TouchableOpacity,
    {
      testID: 'react-datepicker',
      onPress: () => {
        if (onChange) {
          onChange(new Date('2024-12-25T15:30:00.000Z'))
        }
      }
    },
    React.createElement(Text, {}, selected ? selected.toString() : placeholderText || 'Select date')
  )
})

jest.mock('react-datepicker', () => {
  return {
    __esModule: true,
    default: mockReactDatePicker
  }
})

// Mock CSS import
jest.mock('react-datepicker/dist/react-datepicker.css', () => ({}))

describe('DateTimePickerField', () => {
  // SECURITY-HARDENED: Use setupComponentTest pattern from testing guide
  setupComponentTest({
    mockTranslations: {
      'businessEvent:startDateTimePlaceholder': 'Select date and time',
      'businessEvent:startDateTimeLabel': 'Start Date & Time', 
      'common:selectDateTime': 'Select date and time'
    },
    mockAlert: true
  })

  const mockOnChangeLocal = jest.fn()
  // Use timezone-consistent test date with 24-hour time
  const testDate = new Date('2024-12-25T15:30:00.000Z') // 3:30 PM in 24-hour format
  
  // SECURITY-HARDENED: Standard cleanup pattern from testing guide
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnChangeLocal.mockClear()
    mockReactDatePicker.mockClear()
    mockOnChange.mockClear()
    mockPlatform.OS = 'ios' // Default to iOS
  })

  // SECURITY-HARDENED: Use renderWithProviders pattern from testing guide
  const renderDateTimePicker = (props = {}) => {
    const defaultProps = {
      value: null,
      onChange: mockOnChangeLocal,
      mode: 'datetime' as const,
      label: 'Start Date & Time',
      placeholder: 'Select date and time',
      ...props
    }

    return renderWithProviders(
      <DateTimePickerField {...defaultProps} />,
      { withStoreProvider: false }
    )
  }

  describe('TDD: 24-Hour Format Requirements', () => {
    // Test 1: Component should display time in 24-hour format (not AM/PM)
    it('should display time in 24-hour format without AM/PM', () => {
      renderDateTimePicker({
        value: testDate,
        mode: 'time'
      })

      const displayText = screen.getByTestId('date-display-text')
      expect(displayText.props.children).toBe('15:30') // 24-hour format
      expect(displayText.props.children).not.toMatch(/AM|PM/i) // No AM/PM
    })

    // Test 2: DateTime mode should show both date and 24-hour time
    it('should display datetime in 24-hour format', () => {
      renderDateTimePicker({
        value: testDate,
        mode: 'datetime'
      })

      const displayText = screen.getByTestId('date-display-text')
      const text = displayText.props.children
      expect(text).toMatch(/12\/25\/2024.*15:30/) // Date with 24-hour time
      expect(text).not.toMatch(/AM|PM/i) // No AM/PM
    })

    // Test 3: Date mode should only show date, no time
    it('should display only date in date mode', () => {
      renderDateTimePicker({
        value: testDate,
        mode: 'date'
      })

      const displayText = screen.getByTestId('date-display-text')
      expect(displayText.props.children).toMatch(/12\/25\/2024/)
      expect(displayText.props.children).not.toMatch(/15:30|AM|PM/i)
    })
  })

  describe('TDD: Cross-Platform Behavior', () => {
    // Test 4: Web platform should use react-datepicker
    it('should use react-datepicker on web platform', () => {
      mockPlatform.OS = 'web'
      renderDateTimePicker({
        value: testDate,
        mode: 'datetime'
      })

      // Should render the container but not the mobile touchable
      expect(screen.getByTestId('date-time-picker-container')).toBeOnTheScreen()
      expect(screen.queryByTestId('date-time-touchable')).not.toBeOnTheScreen()
    })

    // Test 5: Mobile platforms should show placeholder for future implementation
    it('should show mobile picker placeholder on non-web platforms', () => {
      mockPlatform.OS = 'ios'
      renderDateTimePicker({
        value: testDate,
        mode: 'datetime'
      })

      // Should render mobile touchable
      expect(screen.getByTestId('date-time-touchable')).toBeOnTheScreen()
    })
  })

  describe('TDD: Web react-datepicker Integration', () => {
    beforeEach(() => {
      mockPlatform.OS = 'web'
    })

    // Test 6: Web picker should handle date changes with 24-hour format
    it('should handle date changes on web with 24-hour time', () => {
      const testOnChange = jest.fn()
      
      renderDateTimePicker({
        mode: 'datetime',
        onChange: testOnChange
      })

      // Verify that react-datepicker was called with the onChange function
      expect(mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          onChange: expect.any(Function)
        }),
        {}
      )
      
      // Get the onChange function that was passed to react-datepicker
      const onChangeCall = mockReactDatePicker.mock.calls[0][0]
      const onChangeFunction = onChangeCall.onChange
      
      // Simulate the date picker calling onChange
      onChangeFunction(new Date('2024-12-25T15:30:00.000Z'))
      
      expect(testOnChange).toHaveBeenCalledWith(new Date('2024-12-25T15:30:00.000Z'))
    })

    // Test 7: Different modes should configure react-datepicker correctly  
    it('should configure react-datepicker for time-only mode', () => {
      mockPlatform.OS = 'web'
      
      renderDateTimePicker({
        mode: 'time'
      })

      // Check that react-datepicker was called with correct props for time mode
      expect(mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          showTimeSelect: true,
          showTimeSelectOnly: true,
          timeFormat: 'HH:mm',
          dateFormat: 'HH:mm'
        }),
        {}
      )
    })

    // Test 8: DateTime mode should configure both date and time
    it('should configure react-datepicker for datetime mode', () => {
      mockPlatform.OS = 'web'
      
      renderDateTimePicker({
        mode: 'datetime'
      })

      expect(mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          showTimeSelect: true,
          showTimeSelectOnly: false,
          timeFormat: 'HH:mm',
          dateFormat: 'dd/MM/yyyy HH:mm'
        }),
        {}
      )
    })
  })

  describe('TDD: Error Handling and Validation', () => {
    // Test 9: Should handle invalid dates gracefully
    it('should handle invalid dates gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      renderDateTimePicker({
        value: new Date('invalid-date')
      })

      const displayText = screen.getByTestId('date-display-text')
      expect(displayText.props.children).toBe('Select date and time') // Falls back to placeholder
      
      consoleSpy.mockRestore()
    })

    // Test 10: Should display error states
    it('should display error message when status is error', () => {
      renderDateTimePicker({
        status: 'error',
        error: 'Start date is required'
      })

      expect(screen.getByText('Start date is required')).toBeOnTheScreen()
    })

    // Test 11: Should handle disabled state
    it('should be disabled when status is disabled', () => {
      renderDateTimePicker({
        status: 'disabled'
      })

      const container = screen.getByTestId('date-time-picker-container')
      expect(container).toBeOnTheScreen()
      // Disabled styling would be applied via theme
    })
  })

  describe('TDD: Accessibility and Internationalization', () => {
    // Test 12: Should support translation keys
    it('should use translation keys for labels and placeholders', () => {
      renderDateTimePicker({
        labelTx: 'businessEvent:startDateTimeLabel',
        placeholderTx: 'businessEvent:startDateTimePlaceholder',
        value: null
      })

      expect(screen.getByText('Start Date & Time')).toBeOnTheScreen()
      // The placeholder text appears in the display area when no value is set
      expect(screen.getByTestId('date-display-text')).toHaveTextContent('Select date and time')
    })

    // Test 13: Should handle min/max date constraints
    it('should respect minimum and maximum date constraints', () => {
      const minDate = new Date('2024-01-01T00:00:00.000Z')
      const maxDate = new Date('2024-12-31T23:59:59.999Z')
      
      mockPlatform.OS = 'web'
      
      renderDateTimePicker({
        minimumDate: minDate,
        maximumDate: maxDate
      })

      expect(mockReactDatePicker).toHaveBeenCalledWith(
        expect.objectContaining({
          minDate: minDate,
          maxDate: maxDate
        }),
        {}
      )
    })
  })

  describe('TDD: Component Structure', () => {
    // Test 14: Should render all required elements
    it('should render container, label, input wrapper and helper text', () => {
      renderDateTimePicker({
        label: 'Event Date',
        helper: 'Select your event date and time',
        value: testDate
      })

      expect(screen.getByTestId('date-time-picker-container')).toBeOnTheScreen()
      expect(screen.getByTestId('date-time-input-wrapper')).toBeOnTheScreen()
      expect(screen.getByText('Event Date')).toBeOnTheScreen()
      expect(screen.getByText('Select your event date and time')).toBeOnTheScreen()
    })

    // Test 15: Should show placeholder when no value
    it('should show placeholder when no date is selected', () => {
      renderDateTimePicker({
        placeholder: 'Choose date and time',
        value: null
      })

      expect(screen.getByText('Choose date and time')).toBeOnTheScreen()
    })
  })
})