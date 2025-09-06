import { getEventsInBounds } from "@/services/map"

import { MapStore } from "./MapStore"
import {
  createServiceSuccessResponse,
  createFailureResponse,
} from "../../test/helpers/supabaseMocks"

// Mock the map service
jest.mock("@/services/map", () => ({
  getEventsInBounds: jest.fn(),
}))

const mockGetEventsInBounds = getEventsInBounds as jest.MockedFunction<typeof getEventsInBounds>

// Mock event factory for consistent test data
const createMockMapEvent = (overrides = {}) => ({
  instance_id: "123",
  event_id: "456",
  venue_id: "789",
  start_datetime: "2025-01-27T10:00:00Z",
  end_datetime: "2025-01-27T12:00:00Z",

  max_attendees: 100,
  event_title: "Test Event",
  event_description: "Test Description",
  venue_name: "Test Venue",
  venue_capacity: 200,
  coordinates: {
    type: "Point" as const,
    coordinates: [29.0, 41.0] as [number, number],
  },
  full_address: "Test Address",
  city: "Istanbul",
  ...overrides,
})

// Mock bounds for consistent test data
const createMockBounds = () => ({
  north: 41.1,
  south: 40.9,
  east: 29.1,
  west: 28.9,
})

describe("MapStore", () => {
  let store: typeof MapStore.Type

  beforeEach(() => {
    store = MapStore.create({
      events: [],
      isLoading: false,
      lastError: null,
    })
    jest.clearAllMocks()
  })

  describe("initial state", () => {
    it("should have correct initial state", () => {
      expect(store.events.length).toBe(0)
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe(null)
      expect(store.eventCount).toBe(0)
      expect(store.hasEvents).toBe(false)
    })
  })

  describe("loadEventsInBounds", () => {
    it("should successfully load events", async () => {
      const mockEvents = [createMockMapEvent()]

      mockGetEventsInBounds.mockResolvedValue(createServiceSuccessResponse({ events: mockEvents }))

      const bounds = createMockBounds()
      const result = await store.loadEventsInBounds(bounds)

      expect(result.success).toBe(true)
      expect(store.events.length).toBe(1)
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe(null)
      expect(store.hasEvents).toBe(true)
    })

    it("should handle service errors", async () => {
      mockGetEventsInBounds.mockResolvedValue(createFailureResponse("Database error"))

      const bounds = createMockBounds()
      const result = await store.loadEventsInBounds(bounds)

      expect(result.success).toBe(false)
      expect(store.events.length).toBe(0)
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe("Database error")
    })

    it("should handle unexpected errors", async () => {
      mockGetEventsInBounds.mockRejectedValue(new Error("Network error"))

      const bounds = createMockBounds()
      const result = await store.loadEventsInBounds(bounds)

      expect(result.success).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.lastError).toBe("map:errorLoadingEvents")
    })
  })

  describe("actions", () => {
    it("should clear events", async () => {
      // Use loadEventsInBounds to add events properly through MST
      const mockEvents = [createMockMapEvent()]

      mockGetEventsInBounds.mockResolvedValue(createServiceSuccessResponse({ events: mockEvents }))

      // Load events first
      await store.loadEventsInBounds(createMockBounds())

      expect(store.events.length).toBe(1)

      store.clearEvents()

      expect(store.events.length).toBe(0)
    })

    it("should clear errors", () => {
      store.setProp("lastError", "Some error")
      expect(store.lastError).toBe("Some error")

      store.clearError()
      expect(store.lastError).toBe(null)
    })
  })
})
