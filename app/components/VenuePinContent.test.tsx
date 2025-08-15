import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders, setupComponentTest } from '../../test/helpers/componentTestHelpers'
import { VenuePinContent } from './VenuePinContent'
import type { VenueWithEvents } from '@/stores/MapStore'

// Mock Text component
jest.mock('./Text', () => {
  const React = require('react')
  const { Text: RNText } = require('react-native')
  return {
    Text: ({ text, size, style }: any) => 
      React.createElement(RNText, { style, testID: `text-size-${size}` }, text),
  }
})

// Mock venue factory for consistent test data
const createMockVenue = (eventCount: number = 1): VenueWithEvents => ({
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
  events: Array.from({ length: eventCount }, (_, i) => ({
    instance_id: `event-${i + 1}`,
    event_id: `event-${i + 1}`,
    venue_id: 'venue-123',
    event_title: `Event ${i + 1}`,
    // ... other required fields
  } as any)),
})

describe('VenuePinContent', () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderVenuePinContent = (venue: VenueWithEvents, onPress?: () => void) => {
    return renderWithProviders(
      <VenuePinContent venue={venue} onPress={onPress} />,
      { withStoreProvider: false }
    )
  }
  it('renders correctly for single event venue', () => {
    const mockVenue = createMockVenue(1)
    const { getByText } = renderVenuePinContent(mockVenue, jest.fn())
    
    // Should display "1" for single event
    expect(getByText('1')).toBeTruthy()
  })

  it('renders correctly for multiple event venue', () => {
    const mockVenue = createMockVenue(3)
    const { getByText } = renderVenuePinContent(mockVenue, jest.fn())
    
    // Should display "3" for three events
    expect(getByText('3')).toBeTruthy()
  })

  it('displays correct event count', () => {
    const mockVenue = createMockVenue(5)
    const { getByText } = renderVenuePinContent(mockVenue, jest.fn())
    
    expect(getByText('5')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn()
    const mockVenue = createMockVenue(1)
    
    const { root } = renderVenuePinContent(mockVenue, mockOnPress)
    
    // Find the touchable element (first child should be TouchableOpacity)
    const touchable = root.children[0]
    
    // Test onPressOut instead of onPress (as per the component implementation)
    fireEvent(touchable, 'pressOut')
    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  it('does not crash when onPress is not provided', () => {
    const mockVenue = createMockVenue(1)
    
    const { root } = renderVenuePinContent(mockVenue)
    
    const touchable = root.children[0]
    
    // Should not throw when pressed without onPress handler
    expect(() => fireEvent(touchable, 'pressOut')).not.toThrow()
  })

  it('displays text with correct size', () => {
    const mockVenue = createMockVenue(2)
    const { getByTestId } = renderVenuePinContent(mockVenue, jest.fn())
    
    // Check that our mocked Text component received the correct size prop
    expect(getByTestId('text-size-xs')).toBeTruthy()
  })

  it('renders correctly for large event counts', () => {
    const mockVenue = createMockVenue(99)
    const { getByText } = renderVenuePinContent(mockVenue, jest.fn())
    
    expect(getByText('99')).toBeTruthy()
  })

  it('renders text with styled properties', () => {
    const mockVenue = createMockVenue(1)
    const { root } = renderVenuePinContent(mockVenue, jest.fn())
    
    // Find our mocked Text component
    const texts = root.findAllByType('Text')
    expect(texts.length).toBeGreaterThan(0)
    
    const text = texts[0]
    // Verify the text content
    expect(text.props.children).toBe('1')
  })

  it('handles venues with zero events', () => {
    const mockVenue = createMockVenue(0)
    const { getByText } = renderVenuePinContent(mockVenue, jest.fn())
    
    expect(getByText('0')).toBeTruthy()
  })

  it('component structure is valid', () => {
    const mockVenue = createMockVenue(1)
    const { root } = renderVenuePinContent(mockVenue, jest.fn())
    
    // Component should render with children
    expect(root).toBeTruthy()
    expect(root.type).toBeTruthy()
  })
})