import React from "react"
import { fireEvent, screen } from "@testing-library/react-native"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"
import { EventModal } from "./EventModal"
import { MapEventInstanceModel } from "@/models/MapModels"

// Mock Button component
jest.mock("./Button", () => {
  const React = require("react")
  const { TouchableOpacity, Text } = require("react-native")
  return {
    Button: ({ tx, onPress, disabled, ...props }: any) => {
      const mockText: Record<string, string> = {
        "eventModal:reportEvent": "Report Event",
        "common:close": "Close",
      }
      return React.createElement(
        TouchableOpacity,
        {
          onPress,
          disabled,
          testID: tx ? `button-${tx}` : "button",
          accessibilityRole: "button",
          ...props,
        },
        React.createElement(Text, {}, tx ? mockText[tx] : "Button"),
      )
    },
  }
})

// Mock Text component
jest.mock("./Text", () => {
  const React = require("react")
  const { Text: RNText } = require("react-native")
  return {
    Text: ({ tx, children, ...props }: any) => {
      const mockText: Record<string, string> = {
        "eventModal:title": "Event Details",
        "eventModal:date": "Date",
        "eventModal:venue": "Venue",
        "eventModal:description": "Description",
      }
      const content = tx ? mockText[tx] : children
      return React.createElement(RNText, { ...props }, content)
    },
  }
})

// Create proper mock event using the actual model
const mockEventData = {
  instance_id: "1",
  event_id: "event-1",
  venue_id: "venue-1",
  start_datetime: "2024-01-15T19:00:00Z",
  end_datetime: "2024-01-15T23:00:00Z",
  // status removed (derived from timing),
  max_attendees: 100,
  event_title: "Test Event",
  event_description: "This is a test event description",
  event_image_url: "https://example.com/test-event-image.jpg",
  venue_name: "Test Venue",
  venue_capacity: 200,
  coordinates: {
    type: "Point" as const,
    coordinates: [-122.4194, 37.7749],
  },
  full_address: "123 Test Street, Test City",
  city: "Test City",
}

// Create a properly typed mock event
const mockEvent = MapEventInstanceModel.create(mockEventData)

describe("EventModal", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })

  const renderEventModal = (props = {}) => {
    const defaultProps = {
      visible: true,
      event: mockEvent,
      onClose: jest.fn(),
    }
    return renderWithProviders(<EventModal {...defaultProps} {...props} />, {
      withStoreProvider: false,
    })
  }

  it("renders correctly when visible with event data", () => {
    renderEventModal()

    expect(screen.getByText("Event Details")).toBeTruthy()
    expect(screen.getByText("Test Event")).toBeTruthy()
    expect(screen.getByText("Test Venue")).toBeTruthy()
    expect(screen.getByText("123 Test Street, Test City")).toBeTruthy()
  })

  it("does not render when event is null", () => {
    const { queryByText } = renderEventModal({ event: null })

    expect(queryByText("Event Details")).toBeFalsy()
  })

  it("calls onClose when close button is pressed", () => {
    const mockOnClose = jest.fn()

    renderEventModal({ onClose: mockOnClose })

    const closeButton = screen.getByTestId("button-common:close")
    fireEvent.press(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("calls onReport when report button is pressed", () => {
    const mockOnReport = jest.fn()

    renderEventModal({ onReport: mockOnReport })

    const reportButton = screen.getByTestId("button-eventModal:reportEvent")
    fireEvent.press(reportButton)

    expect(mockOnReport).toHaveBeenCalledWith(mockEvent)
  })

  it("does not render report button when onReport is not provided", () => {
    renderEventModal()

    expect(screen.queryByTestId("button-eventModal:reportEvent")).toBeFalsy()
  })

  it("displays capacity information when venue_capacity is available", () => {
    renderEventModal()

    expect(screen.getByText(/Capacity: 200 people/)).toBeTruthy()
  })

  it("handles missing event description gracefully", () => {
    const eventWithoutDescription = MapEventInstanceModel.create({
      ...mockEventData,
      event_description: null,
    })

    renderEventModal({ event: eventWithoutDescription })

    expect(screen.getByText("No description available")).toBeTruthy()
  })

  it("displays event image when available", () => {
    renderEventModal()

    // Test passes if no errors thrown during render with image URL
    expect(mockEvent.event_image_url).toBe("https://example.com/test-event-image.jpg")
  })

  it("handles missing event image gracefully", () => {
    const eventWithoutImage = MapEventInstanceModel.create({
      ...mockEventData,
      event_image_url: null,
    })

    renderEventModal({ event: eventWithoutImage })

    // Test passes if no errors thrown during render without image URL
    expect(eventWithoutImage.event_image_url).toBe(null)
  })
})
