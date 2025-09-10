import { supabase } from "@/clients/supabase/SupabaseClient"

import { getEventsInBounds } from "./mapService"

// Mock the Supabase client
jest.mock("@/clients/supabase/SupabaseClient", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe("MapService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getEventsInBounds", () => {
    it("should successfully fetch events within bounds including image", async () => {
      const mockEvents = [
        {
          instance_id: "123",
          event_id: "456",
          venue_id: "789",
          start_datetime: "2025-01-27T10:00:00Z",
          end_datetime: "2025-01-27T12:00:00Z",
          max_attendees: 100,
          event_title: "Test Event",
          event_description: "Test Description",
          event_image_url: "https://example.com/event.jpg",
          venue_name: "Test Venue",
          venue_capacity: 200,
          coordinates: {
            type: "Point" as const,
            coordinates: [29.0, 41.0],
          },
          full_address: "Test Address",
          city: "Istanbul",
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockEvents,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      })

      const bounds = {
        north: 41.1,
        south: 40.9,
        east: 29.1,
        west: 28.9,
      }

      const result = await getEventsInBounds(bounds)

      expect(result.success).toBe(true)
      expect(result.events).toEqual(mockEvents)
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_events_in_bounds_with_media",
        expect.objectContaining({
          north: 41.1,
          south: 40.9,
          east: 29.1,
          west: 28.9,
          start_date: null,
          end_date: null,
        }),
      )
    })

    it("should handle events without image", async () => {
      const mockEventsNoImage = [
        {
          instance_id: "321",
          event_id: "654",
          venue_id: "987",
          start_datetime: "2025-02-01T10:00:00Z",
          end_datetime: "2025-02-01T12:00:00Z",
          max_attendees: null,
          event_title: "No Image Event",
          event_description: null,
          event_image_url: null,
          venue_name: "Venue B",
          venue_capacity: null,
          coordinates: {
            type: "Point" as const,
            coordinates: [28.95, 41.05],
          },
          full_address: "Another Address",
          city: "Istanbul",
        },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockEventsNoImage,
        error: null,
        count: null,
        status: 200,
        statusText: "OK",
      })

      const bounds = {
        north: 41.1,
        south: 40.9,
        east: 29.1,
        west: 28.9,
      }

      const result = await getEventsInBounds(bounds)

      expect(result.success).toBe(true)
      expect(result.events).toEqual(mockEventsNoImage)
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_events_in_bounds_with_media",
        expect.objectContaining({
          north: 41.1,
          south: 40.9,
          east: 29.1,
          west: 28.9,
          start_date: null,
          end_date: null,
        }),
      )
    })

    it("should handle Supabase errors", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
          details: "",
          hint: "",
          code: "PGRST000",
          name: "DatabaseError",
        },
        count: null,
        status: 400,
        statusText: "Bad Request",
      })

      const bounds = {
        north: 41.1,
        south: 40.9,
        east: 29.1,
        west: 28.9,
      }

      const result = await getEventsInBounds(bounds)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Database error")
    })

    it("should handle unexpected errors", async () => {
      mockSupabase.rpc.mockRejectedValue(new Error("Network error"))

      const bounds = {
        north: 41.1,
        south: 40.9,
        east: 29.1,
        west: 28.9,
      }

      const result = await getEventsInBounds(bounds)

      expect(result.success).toBe(false)
      expect(result.error).toBe("map:errorLoadingEvents")
    })
  })
})
