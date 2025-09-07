/**
 * BusinessEvent Service Test Suite
 *
 * Tests service functions for business event management
 * Refactored to use shared Supabase mocking utilities
 */

import {
  createEvent,
  getEvent,
  getEventsForBusiness,
  updateEvent,
  deleteEvent,
  createEventInstance,
  getEventInstances,
  updateEventInstance,
  deleteEventInstance,
} from "./businessEventService"

import { supabase } from "@/clients/supabase/SupabaseClient"
import {
  createSupabaseMockChain,
  createSuccessResponse,
  createErrorResponse,
  COMMON_ERRORS,
  setupMockChainResponse,
  MOCK_CHAINS,
} from "../../../test/helpers/supabaseMocks"

// Mock the media service
jest.mock("@/services/media/mediaService", () => ({
  createMediaEntries: jest.fn(),
  updateMediaEntries: jest.fn(),
  getMediaEntries: jest.fn(),
  deleteMediaEntries: jest.fn(),
  uploadMedia: jest.fn(),
  deleteMedia: jest.fn(),
  getMediaForEntity: jest.fn(),
}))

const mockMediaService = require("@/services/media/mediaService")

describe("createEvent", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMockChain>

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock system time to make date validation predictable
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2025-01-01T12:00:00.000Z"))

    // Set up the mock chain using shared utilities
    mockSupabase = createSupabaseMockChain()
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("creates event successfully with instances", async () => {
    const eventData = {
      title: "Test Event",
      description: "Test Description",
      instances: [
        {
          venue_id: "venue-1",
          start_datetime: "2025-02-01T10:00:00.000Z",
          end_datetime: "2025-02-01T12:00:00.000Z",
          max_attendees: 50,
          // status removed as const,
        },
      ],
    }

    const mockCreatedEvent = {
      id: "event-1",
      business_id: "business-1",
      title: "Test Event",
      description: "Test Description",
      created_at: "2025-01-15T08:00:00.000Z",
      updated_at: "2025-01-15T08:00:00.000Z",
    }

    const mockCreatedInstance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2025-02-01T10:00:00.000Z",
      end_datetime: "2025-02-01T12:00:00.000Z",
      // status removed
      max_attendees: 50,
      created_at: "2025-01-15T08:00:00.000Z",
      updated_at: "2025-01-15T08:00:00.000Z",
    }

    // Mock event creation - first single() call
    mockSupabase.single.mockResolvedValueOnce(createSuccessResponse(mockCreatedEvent))

    // Mock instance creation - second single() call
    mockSupabase.single.mockResolvedValueOnce(createSuccessResponse(mockCreatedInstance))

    const result = await createEvent("business-1", eventData)

    expect(result.success).toBe(true)
    expect(result.event).toEqual(mockCreatedEvent)
    expect(result.eventInstances).toEqual([mockCreatedInstance])

    // Verify Supabase calls
    expect(supabase.from).toHaveBeenCalledWith("events")
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "business-1",
        title: "Test Event",
        description: "Test Description",
      }),
    )
  })

  test("handles event creation failure", async () => {
    const eventData = {
      title: "Test Event",
      description: "Test Description",
      instances: [
        {
          venue_id: "venue-1",
          start_datetime: "2025-02-01T10:00:00.000Z",
          end_datetime: "2025-02-01T12:00:00.000Z",
          max_attendees: 50,
          // status removed as const,
        },
      ],
    }

    mockSupabase.single.mockResolvedValueOnce(COMMON_ERRORS.DATABASE_ERROR)

    const result = await createEvent("business-1", eventData)

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:databaseError")
  })

  test("handles missing business ID", async () => {
    const result = await createEvent("", {
      title: "Test Event",
      description: "Test Description",
      instances: [],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:noInstances")
  })

  test("handles missing instances", async () => {
    const result = await createEvent("business-1", {
      title: "Test Event",
      description: "Test Description",
      instances: [],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:noInstances")
  })
})

describe("getEvent", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMockChain>

  beforeEach(() => {
    jest.clearAllMocks()

    // Set up the mock chain using shared utilities
    mockSupabase = createSupabaseMockChain()
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("retrieves event with instances successfully", async () => {
    const mockEvent = {
      id: "event-1",
      business_id: "business-1",
      title: "Test Event",
      description: "Test Description",
      created_at: "2025-01-15T08:00:00.000Z",
      updated_at: "2025-01-15T08:00:00.000Z",
      event_instances: [
        {
          id: "instance-1",
          event_id: "event-1",
          venue_id: "venue-1",
          start_datetime: "2025-02-01T10:00:00.000Z",
          end_datetime: "2025-02-01T12:00:00.000Z",
          // status removed
          max_attendees: 50,
          created_at: "2025-01-15T08:00:00.000Z",
          updated_at: "2025-01-15T08:00:00.000Z",
          venues: {
            id: "venue-1",
            name: "Test Venue",
            address: "Test Address",
            city: "Test City",
            country: "Test Country",
            latitude: 41.0082,
            longitude: 28.9784,
          },
        },
      ],
    }

    mockSupabase.single.mockResolvedValueOnce(createSuccessResponse(mockEvent))

    mockMediaService.getMediaForEntity.mockResolvedValue([])

    const result = await getEvent("event-1")

    expect(result.success).toBe(true)
    expect(result.event).toEqual(
      expect.objectContaining({
        id: "event-1",
        title: "Test Event",
        instances: expect.arrayContaining([
          expect.objectContaining({
            id: "instance-1",
            venues: expect.objectContaining({
              name: "Test Venue",
            }),
          }),
        ]),
        media: expect.any(Array),
      }),
    )
  })

  test("handles event not found", async () => {
    mockSupabase.single.mockResolvedValueOnce(COMMON_ERRORS.NOT_FOUND)

    const result = await getEvent("nonexistent-event")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:eventNotFound")
  })

  test("handles database error", async () => {
    mockSupabase.single.mockResolvedValueOnce(COMMON_ERRORS.DATABASE_ERROR)

    const result = await getEvent("event-1")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:databaseError")
  })
})

describe("updateEvent", () => {
  let mockSupabase: ReturnType<typeof createSupabaseMockChain>

  beforeEach(() => {
    jest.clearAllMocks()

    // Set up the mock chain using shared utilities
    mockSupabase = createSupabaseMockChain()
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("updates event successfully", async () => {
    const updateData = {
      title: "Updated Event",
      description: "Updated Description",
    }

    const mockUpdatedEvent = {
      id: "event-1",
      business_id: "business-1",
      title: "Updated Event",
      description: "Updated Description",
      created_at: "2024-01-15T08:00:00.000Z",
      updated_at: "2024-01-15T09:00:00.000Z",
    }

    mockSupabase.single.mockResolvedValueOnce(createSuccessResponse(mockUpdatedEvent))

    const result = await updateEvent("event-1", updateData)

    expect(result.success).toBe(true)
    expect(result.event).toEqual(mockUpdatedEvent)

    expect(supabase.from).toHaveBeenCalledWith("events")
    expect(mockSupabase.update).toHaveBeenCalledWith({
      title: "Updated Event",
      description: "Updated Description",
      updated_at: expect.any(String),
    })
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", "event-1")
  })

  test("handles update failure", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Update failed" },
    })

    const result = await updateEvent("event-1", { title: "Updated Event" })

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:databaseError")
  })
})

describe("deleteEvent", () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("deletes event successfully", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "event-1" },
      error: null,
    })

    mockMediaService.deleteMedia.mockResolvedValue({
      success: true,
    })

    const result = await deleteEvent("event-1")

    expect(result.success).toBe(true)

    expect(supabase.from).toHaveBeenCalledWith("events")
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", "event-1")
  })

  test("handles delete failure", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Delete failed" },
    })

    const result = await deleteEvent("event-1")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:databaseError")
  })
})

describe("createEventInstance", () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock system time to make date validation predictable
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2025-01-01T12:00:00.000Z"))

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("creates event instance successfully", async () => {
    const instanceData = {
      venue_id: "venue-1",
      start_datetime: "2025-02-01T10:00:00.000Z",
      end_datetime: "2025-02-01T12:00:00.000Z",
      max_attendees: 50,
    }

    const mockCreatedInstance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2025-02-01T10:00:00.000Z",
      end_datetime: "2025-02-01T12:00:00.000Z",
      // status removed
      max_attendees: 50,
      created_at: "2025-01-15T08:00:00.000Z",
      updated_at: "2025-01-15T08:00:00.000Z",
    }

    mockSupabase.single.mockResolvedValueOnce({
      data: mockCreatedInstance,
      error: null,
    })

    const result = await createEventInstance("event-1", instanceData)

    expect(result.success).toBe(true)
    expect(result.eventInstance).toEqual(mockCreatedInstance)

    expect(supabase.from).toHaveBeenCalledWith("event_instances")
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2025-02-01T10:00:00.000Z",
      end_datetime: "2025-02-01T12:00:00.000Z",
      // status removed
      max_attendees: 50,
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })
  })
})

describe("updateEventInstance", () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("updates event instance successfully", async () => {
    const updateData = {
      venue_id: "venue-2",
      max_attendees: 100,
    }

    const mockUpdatedInstance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-2",
      start_datetime: "2024-02-01T10:00:00.000Z",
      end_datetime: "2024-02-01T12:00:00.000Z",
      // status removed
      max_attendees: 100,
      created_at: "2024-01-15T08:00:00.000Z",
      updated_at: "2024-01-15T09:00:00.000Z",
    }

    mockSupabase.single.mockResolvedValueOnce({
      data: mockUpdatedInstance,
      error: null,
    })

    const result = await updateEventInstance("instance-1", updateData)

    expect(result.success).toBe(true)
    expect(result.eventInstance).toEqual(mockUpdatedInstance)

    expect(supabase.from).toHaveBeenCalledWith("event_instances")
    expect(mockSupabase.update).toHaveBeenCalledWith({
      venue_id: "venue-2",
      max_attendees: 100,
      updated_at: expect.any(String),
    })
  })
})

describe("deleteEventInstance", () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("deletes event instance successfully", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "instance-1" },
      error: null,
    })

    const result = await deleteEventInstance("instance-1")

    expect(result.success).toBe(true)

    expect(supabase.from).toHaveBeenCalledWith("event_instances")
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", "instance-1")
  })
})

describe("getEventsForBusiness", () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    }
    ;(supabase.from as jest.Mock).mockReturnValue(mockSupabase)
  })

  test("retrieves events for business successfully", async () => {
    const mockEvents = [
      {
        id: "event-1",
        business_id: "business-1",
        title: "Event 1",
        description: "Description 1",
        created_at: "2025-01-15T08:00:00.000Z",
        updated_at: "2025-01-15T08:00:00.000Z",
        event_instances: [
          {
            id: "instance-1",
            event_id: "event-1",
            venue_id: "venue-1",
            start_datetime: "2025-02-01T10:00:00.000Z",
            end_datetime: "2025-02-01T12:00:00.000Z",
            // status removed
            max_attendees: 50,
            created_at: "2025-01-15T08:00:00.000Z",
            updated_at: "2025-01-15T08:00:00.000Z",
            venues: {
              id: "venue-1",
              name: "Test Venue",
              address: "Test Address",
              city: "Test City",
              country: "Test Country",
              latitude: 41.0082,
              longitude: 28.9784,
            },
          },
        ],
      },
    ]

    mockSupabase.order.mockResolvedValueOnce({
      data: mockEvents,
      error: null,
    })

    mockMediaService.getMediaForEntity.mockResolvedValue([])

    const result = await getEventsForBusiness("business-1")

    expect(result.success).toBe(true)
    expect(result.events).toHaveLength(1)
    expect(result.events?.[0]).toEqual(
      expect.objectContaining({
        id: "event-1",
        title: "Event 1",
      }),
    )

    expect(supabase.from).toHaveBeenCalledWith("events")
    expect(mockSupabase.eq).toHaveBeenCalledWith("business_id", "business-1")
  })

  test("handles empty events list", async () => {
    mockSupabase.order.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const result = await getEventsForBusiness("business-1")

    expect(result.success).toBe(true)
    expect(result.events).toEqual([])
  })

  test("handles database error", async () => {
    mockSupabase.order.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    })

    const result = await getEventsForBusiness("business-1")

    expect(result.success).toBe(false)
    expect(result.error).toBe("errors:databaseError")
  })
})
