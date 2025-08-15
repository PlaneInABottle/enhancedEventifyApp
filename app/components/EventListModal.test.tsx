import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'
import { EventListModal } from './EventListModal'
import type { VenueWithEvents } from '@/stores/MapStore'

jest.mock('./EventCard', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  return {
    EventCard: ({ event }: any) => React.createElement(View, {
      testID: `event-card-${event.instance_id}`,
    }, React.createElement(Text, {}, event.event_title)),
  }
})

jest.mock('./ListView', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    ListView: ({ data, renderItem, keyExtractor, ...props }: any) => {
      return React.createElement(View, props,
        data.map((item: any, index: number) => 
          React.createElement(View, { key: keyExtractor?.(item, index) || index },
            renderItem({ item, index })
          )
        )
      )
    },
  }
})

jest.mock('./ReportButton', () => {
  const React = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    ReportButton: ({ contentType, contentId, style }: any) => {
      return React.createElement(TouchableOpacity, {
        testID: `report-button-${contentType}-${contentId}`,
        style,
      }, React.createElement(Text, {}, 'Report'))
    },
  }
})

// Mock translation
jest.mock('@/i18n/translate', () => ({
  translate: (key: string, options?: any) => {
    const translations: Record<string, string> = {
      'common:close': 'Close',
      'map:eventCount': options?.count === 1 ? '1 Event' : `${options?.count} Events`,
    }
    return translations[key] || key
  },
}))

// Create mock venue data
const createMockVenue = (overrides?: Partial<VenueWithEvents>): VenueWithEvents => ({
  venue_id: 'venue-123',
  venue_name: 'Test Venue',
  full_address: '123 Test Street',
  city: 'Istanbul',
  coordinates: {
    type: 'Point' as const,
    coordinates: [28.9784, 41.0082] as any,
  },
  longitude: 28.9784,
  latitude: 41.0082,
  events: [
    {
      instance_id: 'event-1',
      event_id: 'event-1',
      venue_id: 'venue-123',
      start_datetime: '2025-09-15T18:00:00Z',
      end_datetime: '2025-09-15T22:00:00Z',
      event_instance_status: 'active',
      max_attendees: 100,
      event_title: 'Test Event 1',
      event_description: 'Description 1',
      venue_name: 'Test Venue',
      venue_capacity: 200,
      coordinates: {
        type: 'Point' as const,
        coordinates: [28.9784, 41.0082] as any,
      },
      full_address: '123 Test Street',
      city: 'Istanbul',
      longitude: 28.9784,
      latitude: 41.0082,
      formattedStartTime: 'Sep 15, 2025, 6:00 PM',
    } as any,
  ],
  ...overrides,
})

describe('EventListModal', () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderEventListModal = (props = {}) => {
    const defaultProps = {
      visible: true,
      onClose: jest.fn(),
      venue: createMockVenue(),
    }
    return renderWithProviders(
      <EventListModal {...defaultProps} {...props} />,
      { withStoreProvider: false }
    )
  }

  it('returns null when venue is not provided', () => {
    const { queryByText } = renderEventListModal({ venue: null })
    
    expect(queryByText('Test Venue')).toBeFalsy()
  })

  it('renders modal with venue information', () => {
    const { getByText } = renderEventListModal()
    
    expect(getByText('Test Venue')).toBeTruthy()
    expect(getByText('123 Test Street')).toBeTruthy()
    expect(getByText('Istanbul')).toBeTruthy()
  })

  it('calls onClose when close button is pressed', () => {
    const mockOnClose = jest.fn()
    
    const { getByText } = renderEventListModal({ onClose: mockOnClose })
    
    fireEvent.press(getByText('Close'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('displays correct event count', () => {
    const mockVenue = createMockVenue({
      events: [
        { instance_id: 'event-1' } as any,
        { instance_id: 'event-2' } as any,
        { instance_id: 'event-3' } as any,
      ],
    })
    
    const { getByText } = renderEventListModal({ venue: mockVenue })
    
    expect(getByText('3 Events')).toBeTruthy()
  })

  it('displays singular event count for single event', () => {
    const { getByText } = renderEventListModal() // Default venue has 1 event
    
    expect(getByText('1 Event')).toBeTruthy()
  })

  it('renders all events in the list', () => {
    const mockVenue = createMockVenue({
      events: [
        { 
          instance_id: 'event-1',
          event_title: 'Event 1',
        } as any,
        { 
          instance_id: 'event-2',
          event_title: 'Event 2',
        } as any,
        { 
          instance_id: 'event-3',
          event_title: 'Event 3',
        } as any,
      ],
    })
    
    const { getByTestId } = renderEventListModal({ venue: mockVenue })
    
    expect(getByTestId('event-card-event-1')).toBeTruthy()
    expect(getByTestId('event-card-event-2')).toBeTruthy()
    expect(getByTestId('event-card-event-3')).toBeTruthy()
  })

  it('renders report button for venue', () => {
    const { getByTestId } = renderEventListModal()
    
    expect(getByTestId('report-button-venue-venue-123')).toBeTruthy()
  })

  it('does not render when visible is false', () => {
    const { queryByText } = renderEventListModal({ visible: false })
    
    // Modal should not render any content when not visible
    expect(queryByText('Test Venue')).toBeFalsy()
  })

  it('passes event data correctly to EventCard', () => {
    const mockVenue = createMockVenue()
    const { root } = renderEventListModal({ venue: mockVenue })
    
    const eventCard = root.findByType(require('./EventCard').EventCard)
    expect(eventCard.props.event).toEqual(mockVenue.events[0])
  })

  it('applies correct presentationStyle to modal', () => {
    const { root } = renderEventListModal()
    
    const modal = root.findByType('Modal' as any)
    expect(modal.props.presentationStyle).toBe('pageSheet')
    expect(modal.props.animationType).toBe('slide')
  })

  it('handles empty events list gracefully', () => {
    const mockVenue = createMockVenue({ events: [] })
    
    const { getByText } = renderEventListModal({ venue: mockVenue })
    
    // Should still show venue info and count
    expect(getByText('Test Venue')).toBeTruthy()
    expect(getByText('0 Events')).toBeTruthy()
  })
})