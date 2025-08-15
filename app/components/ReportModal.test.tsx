import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'
import { ReportModal } from './ReportModal'

// Mock dependencies - theme is provided by renderWithProviders

// Mock Text component to render tx prop
jest.mock('./Text', () => ({
  Text: ({ tx, children, ...props }: any) => {
    const mockText: Record<string, string> = {
      'report:title': 'Report Content',
      'report:selectReason': 'Why are you reporting this?',
      'report:inappropriateContent': 'Inappropriate content',
      'report:spam': 'Spam',
      'report:misleading': 'Misleading information',
      'report:offensive': 'Offensive content',
      'report:other': 'Other',
      'report:descriptionLabel': 'Please provide more details (minimum 10 characters):',
      'report:submitReport': 'Submit Report',
      'common:cancel': 'Cancel',
    }
    return <div {...props}>{tx ? mockText[tx] : children}</div>
  },
}))

// Mock Button component
jest.mock('./Button', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    Button: ({ tx, onPress, disabled, ...props }: any) => {
      const mockText: Record<string, string> = {
        'report:submitReport': 'Submit Report',
        'common:cancel': 'Cancel',
      }
      return React.createElement(TouchableOpacity, {
        onPress,
        disabled,
        testID: tx ? `button-${tx}` : 'button',
        accessibilityRole: 'button',
        ...props
      }, React.createElement(Text, {}, tx ? mockText[tx] : 'Button'))
    },
  }
})

// Mock TextField component  
jest.mock('./TextField', () => {
  const React = require('react')
  return {
    TextField: ({ onChangeText, placeholder, value, editable = true, ...props }: any) => {
      // Handle React Native's fireEvent.changeText
      React.useEffect(() => {
        if (props.testID) {
          (global as any)[`__textField_${props.testID}_onChangeText`] = onChangeText
        }
      }, [onChangeText, props.testID])
      
      return React.createElement('input', {
        placeholder,
        value,
        onChange: (e: any) => onChangeText?.(e.target.value),
        editable,
        ...props
      })
    }
  }
})

describe('ReportModal', () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    isSubmitting: false,
  }

  it('renders when visible', () => {
    const { root } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    expect(root).toHaveTextContent(/Report Content/)
    expect(root).toHaveTextContent(/Why are you reporting this/)
  })

  it('does not render when not visible', () => {
    const { queryByText } = renderWithProviders(
      <ReportModal {...defaultProps} visible={false} />,
      { withStoreProvider: false }
    )
    
    expect(queryByText('Report Content')).toBeFalsy()
  })

  it('shows all report reasons', () => {
    const { root } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    expect(root).toHaveTextContent(/Inappropriate content/)
    expect(root).toHaveTextContent(/Spam/)
    expect(root).toHaveTextContent(/Misleading information/)
    expect(root).toHaveTextContent(/Offensive content/)
    expect(root).toHaveTextContent(/Other/)
  })


  it('calls onSubmit with selected reason', () => {
    const { getByTestId, getByLabelText } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    // Select spam using accessibility label
    fireEvent.press(getByLabelText('Select spam as report reason'))
    
    // Submit
    fireEvent.press(getByTestId('button-report:submitReport'))
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('spam', undefined)
  })

  it('calls onClose when close button is pressed', () => {
    const { getByLabelText } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    fireEvent.press(getByLabelText('Close report modal'))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when cancel is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    fireEvent.press(getByTestId('button-common:cancel'))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not submit without reason selected', () => {
    const { getByTestId } = renderWithProviders(
      <ReportModal {...defaultProps} />,
      { withStoreProvider: false }
    )
    
    // Try to submit without selecting reason
    fireEvent.press(getByTestId('button-report:submitReport'))
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })
})