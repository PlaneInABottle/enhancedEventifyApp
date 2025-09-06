import React from "react"
import { EventCard } from "./EventCard"
import { MapEventInstanceModel } from "@/models/MapModels"
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"

// Mock ReportButton component
jest.mock("./ReportButton", () => {
  const React = require("react")
  const { TouchableOpacity, Text } = require("react-native")
  return {
    ReportButton: ({ contentType, contentId, style }: any) => {
      return React.createElement(
        TouchableOpacity,
        {
          testID: `report-button-${contentType}-${contentId}`,
          style,
        },
        React.createElement(Text, {}, "Report"),
      )
    },
  }
})

// Mock event data factory
const createMockEvent = (overrides?: Partial<typeof MapEventInstanceModel.Type>) => ({
  instance_id: "instance-123",
  event_id: "event-123",
  venue_id: "venue-123",
  start_datetime: "2025-09-15T18:00:00Z",
  end_datetime: "2025-09-15T22:00:00Z",
  // status removed (derived from timing),
  max_attendees: 100,
  event_title: "Test Event Title",
  event_description: "Test event description",
  venue_name: "Test Venue",
  venue_capacity: 200,
  coordinates: {
    type: "Point",
    coordinates: [28.9784, 41.0082], // Istanbul coordinates
  },
  full_address: "123 Test Street, Test District",
  city: "Istanbul",
  formattedStartTime: "Sep 15, 2025, 6:00 PM", // Mock the computed property
  ...overrides,
})

describe("EventCard", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false,
  })
  it("renders all required event information", () => {
    const mockEvent = createMockEvent()
    const { getByText } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Verify event title is displayed
    expect(getByText("Test Event Title")).toBeTruthy()

    // Verify venue name is displayed
    expect(getByText("Test Venue")).toBeTruthy()

    // Verify formatted time is displayed
    expect(getByText("Sep 15, 2025, 6:00 PM")).toBeTruthy()
  })

  it("renders event description when provided", () => {
    const mockEvent = createMockEvent({
      event_description: "This is a detailed event description",
    })
    const { getByText } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    expect(getByText("This is a detailed event description")).toBeTruthy()
  })

  it("does not render description section when event_description is null", () => {
    const mockEvent = createMockEvent({
      event_description: null,
    })
    const { queryByText, getByText } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Title and venue should still be rendered
    expect(getByText("Test Event Title")).toBeTruthy()
    expect(getByText("Test Venue")).toBeTruthy()

    // But no description text should be present
    expect(queryByText(/description/i)).toBeFalsy()
  })

  it("renders ReportButton with correct props", () => {
    const mockEvent = createMockEvent()
    const { getByTestId } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    const reportButton = getByTestId("report-button-event-event-123")
    expect(reportButton).toBeTruthy()
  })

  it("limits title to 2 lines with numberOfLines prop", () => {
    const mockEvent = createMockEvent({
      event_title:
        "This is a very long event title that should be truncated after two lines to prevent layout issues",
    })
    const { root } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Find the title Text component
    const titleText = root.findByProps({ preset: "subheading" })
    expect(titleText.props.numberOfLines).toBe(2)
  })

  it("limits venue name to 1 line", () => {
    const mockEvent = createMockEvent({
      venue_name: "This is a very long venue name that should be truncated",
    })
    const { root } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Find the venue Text component by traversing the tree
    const texts = root.findAllByType("Text")
    const venueText = texts.find(
      (text: any) =>
        text.props.children === "This is a very long venue name that should be truncated",
    )
    expect(venueText?.props.numberOfLines).toBe(1)
  })

  it("limits description to 2 lines when present", () => {
    const mockEvent = createMockEvent({
      event_description: "This is a very long description that should be truncated after two lines",
    })
    const { root } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Find the description Text component
    const texts = root.findAllByType("Text")
    const descriptionText = texts.find(
      (text: any) =>
        text.props.children ===
        "This is a very long description that should be truncated after two lines",
    )
    expect(descriptionText?.props.numberOfLines).toBe(2)
  })

  it("applies correct styles from theme", () => {
    const mockEvent = createMockEvent()
    const { root } = renderWithProviders(<EventCard event={mockEvent as any} />, {
      withStoreProvider: false,
    })

    // Check that the component renders with views that have styles
    const views = root.findAllByType("View")
    expect(views.length).toBeGreaterThan(0)

    // Verify that at least one view has a style prop (our mock returns the style function)
    const styledView = views.find((view: any) => view.props.style)
    expect(styledView).toBeTruthy()
  })

  it("handles events without optional fields gracefully", () => {
    const minimalEvent = createMockEvent({
      event_description: null,
      max_attendees: null,
      venue_capacity: null,
    })

    // Should render without crashing
    const { getByText } = renderWithProviders(<EventCard event={minimalEvent as any} />, {
      withStoreProvider: false,
    })
    expect(getByText("Test Event Title")).toBeTruthy()
    expect(getByText("Test Venue")).toBeTruthy()
  })
})
