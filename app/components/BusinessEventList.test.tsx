import React from "react"
import { screen, fireEvent, waitFor } from "@testing-library/react-native"
import { Alert } from "react-native"
import { BusinessEventList } from "./BusinessEventList"
import type { IBusinessEvent } from "@/models/BusinessEventModels"
// EventInstanceStatus removed (status derived from timing)
import { renderWithProviders, setupComponentTest } from "../../test/helpers/componentTestHelpers"

// Mock dependencies
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

jest.mock("@/i18n/translate", () => ({
  translate: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      "businessEvent:upcomingEvents": "Upcoming Events",
      "businessEvent:activeEvents": "Active Events",
      "businessEvent:pastEvents": "Past Events",
      "businessEvent:noEventsTitle": "No Events",
      "businessEvent:noEventsMessage": "You have no events yet",
      "businessEvent:createFirstEvent": "Create Your First Event",
      "businessEvent:createNewEvent": "Create New Event",
      "businessEvent:deleteEventTitle": "Delete Event",
      "businessEvent:deleteEventMessage": "Are you sure you want to delete {{title}}?",
      "businessEvent:instanceCount": "{{count}} instances",
      "businessEvent:nextInstance": "Next Instance",
      "businessEvent:status": "Status",
      // Deprecated status count keys retained for backward compatibility (no longer asserted)
      "businessEvent:statusPublishedCount": "{{count}}",
      "businessEvent:statusScheduledCount": "{{count}}",
      "businessEvent:statusDraftCount": "{{count}}",
      "businessEvent:statusCancelledCount": "{{count}}",
      "businessEvent:statusPostponedCount": "{{count}}",
      "businessEvent:statusCompletedCount": "{{count}}",
      "common:cancel": "Cancel",
      "common:delete": "Delete",
      "common:edit": "Edit",
    }

    // Handle interpolation
    if (options && key === "businessEvent:deleteEventMessage") {
      return `Are you sure you want to delete ${options.title}?`
    }
    if (options && key === "businessEvent:instanceCount") {
      return `${options.count} instances`
    }
    if (options && key.includes("businessEvent:status") && key.includes("Count")) {
      return `${options.count}`
    }

    return translations[key] || key
  }),
}))

// Mock components
jest.mock("./Card", () => ({
  Card: ({ children, onPress, style }: any) => {
    const React = require("react")
    const { TouchableOpacity } = require("react-native")
    return React.createElement(
      TouchableOpacity,
      {
        testID: "event-card",
        onPress,
        style,
      },
      children,
    )
  },
}))

jest.mock("./EmptyState", () => ({
  EmptyState: ({ heading, content, button, buttonOnPress }: any) => {
    const React = require("react")
    const { View, Text, TouchableOpacity } = require("react-native")
    return React.createElement(
      View,
      { testID: "empty-state" },
      React.createElement(Text, {}, heading),
      React.createElement(Text, {}, content),
      button &&
        React.createElement(
          TouchableOpacity,
          {
            testID: "empty-state-button",
            onPress: buttonOnPress,
          },
          React.createElement(Text, {}, button),
        ),
    )
  },
}))

jest.mock("./Button", () => ({
  Button: ({ tx, onPress, disabled, style }: any) => {
    const React = require("react")
    const { TouchableOpacity, Text } = require("react-native")
    const mockText: Record<string, string> = {
      "businessEvent:createNewEvent": "Create New Event",
    }
    return React.createElement(
      TouchableOpacity,
      {
        onPress,
        disabled,
        testID: `button-${tx}`,
        style,
      },
      React.createElement(Text, {}, mockText[tx] || tx),
    )
  },
}))

// Mock Alert
jest.spyOn(Alert, "alert")

// Helper function to render BusinessEventList with shared utilities
const renderBusinessEventList = (props = {}) => {
  const defaultProps = {
    events: [],
    isLoading: false,
    isRefreshing: false,
    onRefresh: jest.fn(),
    onEventPress: jest.fn(),
    onEditEvent: jest.fn(),
    onDeleteEvent: jest.fn(),
    onCreateEvent: jest.fn(),
    showActions: true,
  }
  return renderWithProviders(<BusinessEventList {...defaultProps} {...props} />, {
    withStoreProvider: false,
  })
}

// Mock event data
const createMockEvent = (overrides?: Partial<IBusinessEvent>): IBusinessEvent => {
  const now = new Date()
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + 7)
  const endDate = new Date(futureDate)
  endDate.setHours(endDate.getHours() + 2)

  return {
    id: "event-1",
    business_id: "business-1",
    title: "Test Event",
    description: "Test Description",
    imageUrl: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    instances: [
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: futureDate.toISOString(),
        end_datetime: endDate.toISOString(),
        max_attendees: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        venue: undefined,
        setProp: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    ],
    // Computed properties
    instanceCount: 1,
    hasUpcomingInstances: true,
    nextInstance: {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: futureDate.toISOString(),
      end_datetime: endDate.toISOString(),
      max_attendees: 50,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      venue: undefined,
      setProp: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activeInstances: [],
    upcomingInstances: [
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: futureDate.toISOString(),
        end_datetime: endDate.toISOString(),
        max_attendees: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        venue: undefined,
        setProp: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    ],
    setProp: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addNewInstance: jest.fn(),
    ...overrides,
  } as IBusinessEvent
}

describe("BusinessEventList", () => {
  // Setup component test with shared utilities
  setupComponentTest({
    mockAlert: false, // We have custom Alert mocking
  })

  describe("Empty State", () => {
    it("shows empty state when no events", () => {
      renderBusinessEventList()

      expect(screen.getByTestId("empty-state")).toBeOnTheScreen()
      expect(screen.getByText("No Events")).toBeOnTheScreen()
      expect(screen.getByText("You have no events yet")).toBeOnTheScreen()
      expect(screen.getByText("Create Your First Event")).toBeOnTheScreen()
    })

    it("handles empty state button press", () => {
      const onCreateEvent = jest.fn()
      renderBusinessEventList({ onCreateEvent })

      fireEvent.press(screen.getByTestId("empty-state-button"))
      expect(onCreateEvent).toHaveBeenCalled()
    })

    it("hides create button in empty state when no callback", () => {
      renderBusinessEventList({ onCreateEvent: undefined })

      expect(screen.queryByTestId("empty-state-button")).not.toBeOnTheScreen()
    })

    it("does not show empty state when loading", () => {
      renderBusinessEventList({ isLoading: true })

      expect(screen.queryByTestId("empty-state")).not.toBeOnTheScreen()
    })
  })

  describe("Event Grouping", () => {
    it("groups events by timeframe correctly", () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      const pastEndDate = new Date(pastDate)
      pastEndDate.setHours(pastEndDate.getHours() + 2)

      const activeStartDate = new Date()
      activeStartDate.setHours(activeStartDate.getHours() - 1)
      const activeEndDate = new Date()
      activeEndDate.setHours(activeEndDate.getHours() + 1)

      const events = [
        createMockEvent({
          id: "upcoming-1",
          title: "Upcoming Event",
        }),
        createMockEvent({
          id: "active-1",
          title: "Active Event",
          hasUpcomingInstances: false,
          activeInstances: [
            {
              id: "active-instance-1",
              event_id: "active-1",
              venue_id: "venue-1",
              start_datetime: activeStartDate.toISOString(),
              end_datetime: activeEndDate.toISOString(),
              max_attendees: 50,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              venue: undefined,
              setProp: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            } as any,
          ],
          upcomingInstances: [],
        }),
        createMockEvent({
          id: "past-1",
          title: "Past Event",
          hasUpcomingInstances: false,
          activeInstances: [],
          upcomingInstances: [],
          nextInstance: undefined,
          instances: [
            {
              id: "past-instance-1",
              event_id: "past-1",
              venue_id: "venue-1",
              start_datetime: pastDate.toISOString(),
              end_datetime: pastEndDate.toISOString(),
              max_attendees: 50,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              venue: undefined,
              setProp: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          ] as any,
        }),
      ]

      renderBusinessEventList({ events })

      // Check section headers
      expect(screen.getByText("Upcoming Events")).toBeOnTheScreen()
      expect(screen.getByText("Active Events")).toBeOnTheScreen()
      expect(screen.getByText("Past Events")).toBeOnTheScreen()

      // Check event titles
      expect(screen.getByText("Upcoming Event")).toBeOnTheScreen()
      expect(screen.getByText("Active Event")).toBeOnTheScreen()
      expect(screen.getByText("Past Event")).toBeOnTheScreen()
    })

    it("only shows sections with events", () => {
      const events = [createMockEvent({ title: "Only Upcoming" })]
      renderBusinessEventList({ events })

      expect(screen.getByText("Upcoming Events")).toBeOnTheScreen()
      expect(screen.queryByText("Active Events")).not.toBeOnTheScreen()
      expect(screen.queryByText("Past Events")).not.toBeOnTheScreen()
    })
  })

  describe("Event Card Display", () => {
    it("displays event information correctly", () => {
      const event = createMockEvent({
        title: "Sample Event",
        description: "This is a sample event description",
      })
      renderBusinessEventList({ events: [event] })

      expect(screen.getByText("Sample Event")).toBeOnTheScreen()
      expect(screen.getByText("This is a sample event description")).toBeOnTheScreen()
      expect(screen.getByText("1 instances")).toBeOnTheScreen() // Default mock has 1 instance
      expect(screen.getByText("Next Instance")).toBeOnTheScreen()
    })

    it("handles events without description", () => {
      const event = createMockEvent({ description: null })
      renderBusinessEventList({ events: [event] })

      expect(screen.getByText("Test Event")).toBeOnTheScreen()
      // Description should not be rendered
    })

    it("handles events without next instance", () => {
      const event = createMockEvent({
        nextInstance: undefined,
        hasUpcomingInstances: false,
      })
      renderBusinessEventList({ events: [event] })

      expect(screen.queryByText("Next Instance")).not.toBeOnTheScreen()
    })
  })

  describe("Actions", () => {
    it("shows action buttons when showActions is true", () => {
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], showActions: true })

      expect(screen.getByText("Edit")).toBeOnTheScreen()
      expect(screen.getByText("Delete")).toBeOnTheScreen()
    })

    it("hides action buttons when showActions is false", () => {
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], showActions: false })

      expect(screen.queryByText("Edit")).not.toBeOnTheScreen()
      expect(screen.queryByText("Delete")).not.toBeOnTheScreen()
    })

    it("handles edit button press", () => {
      const onEditEvent = jest.fn()
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onEditEvent })

      fireEvent.press(screen.getByText("Edit"))
      expect(onEditEvent).toHaveBeenCalledWith(event)
    })

    it("shows delete confirmation dialog", async () => {
      const event = createMockEvent({ title: "Event to Delete" })
      renderBusinessEventList({ events: [event] })

      fireEvent.press(screen.getByText("Delete"))

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Delete Event",
          "Are you sure you want to delete Event to Delete?",
          expect.arrayContaining([
            expect.objectContaining({ text: "Cancel", style: "cancel" }),
            expect.objectContaining({ text: "Delete", style: "destructive" }),
          ]),
        )
      })
    })

    it("handles delete confirmation", async () => {
      const onDeleteEvent = jest.fn()
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onDeleteEvent })

      // Mock Alert.alert to immediately call the delete callback
      ;(Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress() // Press "Delete" button
      })

      fireEvent.press(screen.getByText("Delete"))

      await waitFor(() => {
        expect(onDeleteEvent).toHaveBeenCalledWith(event)
      })
    })

    it("handles delete cancellation", async () => {
      const onDeleteEvent = jest.fn()
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onDeleteEvent })

      // Mock Alert.alert to do nothing (simulating cancel)
      ;(Alert.alert as jest.Mock).mockImplementationOnce(() => {
        // Cancel button doesn't call onPress, just closes dialog
      })

      fireEvent.press(screen.getByText("Delete"))

      await waitFor(() => {
        expect(onDeleteEvent).not.toHaveBeenCalled()
      })
    })
  })

  describe("Create Event Button", () => {
    it("shows create button when callback provided", () => {
      const event = createMockEvent()
      renderBusinessEventList({ events: [event] })

      expect(screen.getByText("Create New Event")).toBeOnTheScreen()
    })

    it("hides create button when no callback", () => {
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onCreateEvent: undefined })

      expect(screen.queryByText("Create New Event")).not.toBeOnTheScreen()
    })

    it("handles create button press", () => {
      const onCreateEvent = jest.fn()
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onCreateEvent })

      fireEvent.press(screen.getByText("Create New Event"))
      expect(onCreateEvent).toHaveBeenCalled()
    })
  })

  describe("Event Card Press", () => {
    it("handles event card press", () => {
      const onEventPress = jest.fn()
      const event = createMockEvent()
      renderBusinessEventList({ events: [event], onEventPress })

      fireEvent.press(screen.getByTestId("event-card"))
      expect(onEventPress).toHaveBeenCalledWith(event)
    })
  })

  describe("Pull to Refresh", () => {
    it("shows refresh control when onRefresh provided", () => {
      const event = createMockEvent()
      const { getByTestId } = renderBusinessEventList({ events: [event], onRefresh: jest.fn() })

      // SectionList should have refreshControl prop
      const sectionList = getByTestId("event-card").parent?.parent?.parent
      expect(sectionList).toBeTruthy()
    })

    it("handles pull to refresh", () => {
      const onRefresh = jest.fn()
      const event = createMockEvent()
      const { UNSAFE_getByType } = renderBusinessEventList({
        events: [event],
        onRefresh,
        isRefreshing: false,
      })

      const SectionList = require("react-native").SectionList
      const sectionList = UNSAFE_getByType(SectionList)

      // Trigger refresh
      sectionList.props.refreshControl.props.onRefresh()
      expect(onRefresh).toHaveBeenCalled()
    })
  })

  describe("List Performance", () => {
    it("uses SectionList for better performance", () => {
      const event = createMockEvent()
      const { UNSAFE_getByType } = renderBusinessEventList({ events: [event] })

      const SectionList = require("react-native").SectionList
      expect(() => UNSAFE_getByType(SectionList)).not.toThrow()
    })

    it("provides keyExtractor for list items", () => {
      const event = createMockEvent()
      const { UNSAFE_getByType } = renderBusinessEventList({ events: [event] })

      const SectionList = require("react-native").SectionList
      const sectionList = UNSAFE_getByType(SectionList)

      expect(sectionList.props.keyExtractor(event)).toBe(event.id)
    })

    it("disables sticky section headers", () => {
      const event = createMockEvent()
      const { UNSAFE_getByType } = renderBusinessEventList({ events: [event] })

      const SectionList = require("react-native").SectionList
      const sectionList = UNSAFE_getByType(SectionList)

      expect(sectionList.props.stickySectionHeadersEnabled).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("handles empty event arrays", () => {
      renderBusinessEventList({ events: [] })
      expect(screen.getByTestId("empty-state")).toBeOnTheScreen()
    })

    it("handles multiple events in same section", () => {
      const events = [
        createMockEvent({ id: "1", title: "Event 1" }),
        createMockEvent({ id: "2", title: "Event 2" }),
        createMockEvent({ id: "3", title: "Event 3" }),
      ]
      renderBusinessEventList({ events })

      expect(screen.getByText("Event 1")).toBeOnTheScreen()
      expect(screen.getByText("Event 2")).toBeOnTheScreen()
      expect(screen.getByText("Event 3")).toBeOnTheScreen()
      expect(screen.getAllByText("Upcoming Events")).toHaveLength(1) // Only one section header
    })

    it("formats dates correctly", () => {
      const event = createMockEvent()
      renderBusinessEventList({ events: [event] })

      // Should display date in locale format
      const dateElement = screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
      expect(dateElement).toBeOnTheScreen()
    })
  })
})
