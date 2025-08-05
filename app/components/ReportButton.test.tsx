import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert } from 'react-native'

import { ReportButton } from './ReportButton'
import { supabase } from '@/clients/supabase'
import { useStores } from '@/models'

// Mock dependencies
jest.mock('@/clients/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))
jest.mock('@/models')
jest.mock('@/theme/context', () => ({
  useAppTheme: () => ({
    themed: (style: any) => style,
  }),
}))
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
  const mockAuthStore = {
    user: { id: 'user-123' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStores.mockReturnValue({ authenticationStore: mockAuthStore } as any)
    
    // Mock supabase.from chain
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert } as any)
    mockSupabase.from = mockFrom
  })

  it('renders report button', () => {
    const { getByText } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
    expect(getByText('common:report')).toBeTruthy()
  })

  it('opens modal when button is pressed', async () => {
    const { getByText, queryByTestId } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
    expect(queryByTestId('report-modal')).toBeFalsy()
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })
    
    expect(queryByTestId('report-modal')).toBeTruthy()
  })

  it('submits report successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

    const { getByText, queryByTestId } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
    await act(async () => {
      fireEvent.press(getByText('common:report'))
    })

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
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
    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: '23505', message: 'duplicate key violation' }
    })
    mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

    const { getByText, queryByTestId } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
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
    const mockInsert = jest.fn().mockResolvedValue({
      error: { code: 'GENERIC', message: 'Something went wrong' }
    })
    mockSupabase.from.mockReturnValue({ insert: mockInsert } as any)

    const { getByText, queryByTestId } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
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

    const { getByText, queryByTestId } = render(
      <ReportButton contentType="event" contentId="event-123" />
    )
    
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