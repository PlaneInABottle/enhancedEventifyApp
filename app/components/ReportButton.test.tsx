import React from 'react'
import { fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'
import { ReportButton } from './ReportButton'
import { supabase } from '@/clients/supabase'
import { useStores } from '@/models'
import { createSupabaseMockChain, createSuccessResponse, createErrorResponse } from '../../test/helpers/supabaseMocks'

// Mock dependencies
jest.mock('@/clients/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))
jest.mock('@/models')
jest.mock('./Button', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    Button: ({ tx, onPress, style }: any) => React.createElement(TouchableOpacity, {
      onPress,
      style,
      testID: `button-${tx}`,
    }, React.createElement(Text, {}, tx)),
  }
})
// Mock ReportModal to avoid complex modal testing
jest.mock('./ReportModal', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    ReportModal: ({ visible, onSubmit }: any) => {
      if (!visible) return null
      // Automatically submit when modal becomes visible for testing
      React.useEffect(() => {
        if (visible) {
          // Simulate user selecting spam and submitting
          setTimeout(() => onSubmit('spam', 'Test description'), 0)
        }
      }, [visible, onSubmit])
      return React.createElement(View, { testID: 'report-modal' })
    },
  }
})

const MockedView = ({ children, testID, onPress, ...props }: any) => {
  return (
    <div 
      data-testid={testID}
      onClick={onPress}
      {...props}
    >
      {children}
    </div>
  )
}

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const mockUseStores = useStores as jest.MockedFunction<typeof useStores>

// Mock Alert
jest.spyOn(Alert, 'alert')

describe('ReportButton', () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false, // We're testing Alert.alert manually
  })

  const mockAuthStore = {
    user: { id: 'user-123' },
  }

  const renderReportButton = (props = {}) => {
    const defaultProps = {
      contentType: 'event' as const,
      contentId: 'event-123',
    }
    return renderWithProviders(
      <ReportButton {...defaultProps} {...props} />,
      { withStoreProvider: false }
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStores.mockReturnValue({ authenticationStore: mockAuthStore } as any)
    
    // Set up Supabase mock chain using shared utilities
    const mockSupabaseChain = createSupabaseMockChain()
    mockSupabaseChain.insert.mockResolvedValue(createSuccessResponse({}))
    mockSupabase.from.mockReturnValue(mockSupabaseChain)
  })

  it('renders report button', () => {
    const { getByText } = renderReportButton()
    
    expect(getByText('common:report')).toBeTruthy()
  })

  it('opens modal when button is pressed', async () => {
    const { getByText, queryByTestId } = renderReportButton()
    
    expect(queryByTestId('report-modal')).toBeFalsy()
    
    // Press the button to open modal
    fireEvent.press(getByText('common:report'))
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(queryByTestId('report-modal')).toBeTruthy()
    }, { timeout: 1000 })
  })

  it('submits report successfully', async () => {
    const mockSupabaseChain = createSupabaseMockChain()
    mockSupabaseChain.insert.mockResolvedValue(createSuccessResponse({}))
    mockSupabase.from.mockReturnValue(mockSupabaseChain)

    const { getByText, queryByTestId } = renderReportButton()
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })

    await waitFor(() => {
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        reporter_id: 'user-123',
        content_type: 'event',
        content_id: 'event-123',
        reason: 'spam',
        description: 'Test description',
      })
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Report Submitted',
      'Thank you for helping keep our community safe.'
    )
  })

  it('handles duplicate report error', async () => {
    const mockSupabaseChain = createSupabaseMockChain()
    const duplicateError = createErrorResponse('duplicate key violation', '23505', 409)
    mockSupabaseChain.insert.mockResolvedValue(duplicateError)
    mockSupabase.from.mockReturnValue(mockSupabaseChain)

    const { getByText, queryByTestId } = renderReportButton()
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Already Reported',
        'You have already reported this content.'
      )
    })
  })

  it('handles generic error', async () => {
    const mockSupabaseChain = createSupabaseMockChain()
    const genericError = createErrorResponse('Something went wrong', 'GENERIC', 400)
    mockSupabaseChain.insert.mockResolvedValue(genericError)
    mockSupabase.from.mockReturnValue(mockSupabaseChain)

    const { getByText, queryByTestId } = renderReportButton()
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to submit report. Please try again.'
      )
    })
  })

  it('shows error when user is not logged in', async () => {
    mockUseStores.mockReturnValue({ 
      authenticationStore: { user: null } 
    } as any)

    const { getByText, queryByTestId } = renderReportButton()
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'You must be logged in to report content'
      )
    })
  })
})