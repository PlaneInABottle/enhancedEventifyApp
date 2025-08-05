import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

import { ReportModal } from './ReportModal'

// Mock dependencies
jest.mock('@/theme/context', () => ({
  useAppTheme: () => ({
    themed: (style: any) => style,
  }),
}))

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
jest.mock('./Button', () => ({
  Button: ({ tx, onPress, disabled, ...props }: any) => {
    const mockText: Record<string, string> = {
      'report:submitReport': 'Submit Report',
      'common:cancel': 'Cancel',
    }
    return (
      <button onClick={onPress} disabled={disabled} {...props}>
        {tx ? mockText[tx] : 'Button'}
      </button>
    )
  },
}))

// Mock TextField component
jest.mock('./TextField', () => ({
  TextField: ({ onChangeText, placeholder, ...props }: any) => (
    <input
      placeholder={placeholder}
      onChange={(e) => onChangeText?.(e.target.value)}
      {...props}
    />
  ),
}))

describe('ReportModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    isSubmitting: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when visible', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    expect(getByText('Report Content')).toBeTruthy()
    expect(getByText('Why are you reporting this?')).toBeTruthy()
  })

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <ReportModal {...defaultProps} visible={false} />
    )
    
    expect(queryByText('Report Content')).toBeFalsy()
  })

  it('shows all report reasons', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    expect(getByText('Inappropriate content')).toBeTruthy()
    expect(getByText('Spam')).toBeTruthy()
    expect(getByText('Misleading information')).toBeTruthy()
    expect(getByText('Offensive content')).toBeTruthy()
    expect(getByText('Other')).toBeTruthy()
  })

  it('shows description field when "other" is selected', () => {
    const { getByText, queryByPlaceholderText } = render(
      <ReportModal {...defaultProps} />
    )
    
    // Initially no description field
    expect(queryByPlaceholderText('Please provide more details...')).toBeFalsy()
    
    // Select "Other"
    fireEvent.press(getByText('Other'))
    
    // Description field should appear
    expect(queryByPlaceholderText('Please provide more details...')).toBeTruthy()
  })

  it('calls onSubmit with selected reason', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    // Select spam
    fireEvent.press(getByText('Spam'))
    
    // Submit
    fireEvent.press(getByText('Submit Report'))
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('spam', undefined)
  })

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    fireEvent.press(getByText('✕'))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when cancel is pressed', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    fireEvent.press(getByText('Cancel'))
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('does not submit without reason selected', () => {
    const { getByText } = render(<ReportModal {...defaultProps} />)
    
    // Try to submit without selecting reason
    fireEvent.press(getByText('Submit Report'))
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('validates description for "other" reason', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportModal {...defaultProps} />
    )
    
    // Select "Other"
    fireEvent.press(getByText('Other'))
    
    // Enter short description
    const textInput = getByPlaceholderText('Please provide more details...')
    fireEvent.changeText(textInput, 'short')
    
    // Try to submit
    fireEvent.press(getByText('Submit Report'))
    
    // Should not submit due to validation
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('submits with valid description for "other" reason', () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportModal {...defaultProps} />
    )
    
    // Select "Other"
    fireEvent.press(getByText('Other'))
    
    // Enter valid description
    const textInput = getByPlaceholderText('Please provide more details...')
    fireEvent.changeText(textInput, 'This is a detailed description')
    
    // Submit
    fireEvent.press(getByText('Submit Report'))
    
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      'other',
      'This is a detailed description'
    )
  })
})