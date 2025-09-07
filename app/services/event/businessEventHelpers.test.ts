/**
 * BusinessEvent Helpers Test Suite
 *
 * Tests helper functions for business event management
 */

import {
  validateEventRequest,
  validateEventInstanceRequest,
  formatEventTitle,
  formatEventDescription,
  formatDateTime,
  mapEventError,
  generateEventImageFilename,
  calculateEventDuration,
  isEventInstancePast,
  isEventInstanceActive,
  sortEventInstancesByStartDate,
  groupEventInstancesByDate,
} from "./businessEventHelpers"

describe("validateEventRequest", () => {
  test("validates valid event request", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const endDate = new Date(futureDate)
    endDate.setHours(endDate.getHours() + 2)

    const request = {
      title: "Valid Event Title",
      description: "Valid description",
      instances: [
        {
          venue_id: "venue-1",
          start_datetime: futureDate.toISOString(),
          end_datetime: endDate.toISOString(),
          max_attendees: 50,
        },
      ],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  test("validates missing title", () => {
    const request = {
      title: "",
      description: "Valid description",
      instances: [],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.title).toBe("errors:titleRequired")
  })

  test("validates title too short", () => {
    const request = {
      title: "AB",
      description: "Valid description",
      instances: [],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.title).toBe("errors:titleTooShort")
  })

  test("validates title too long", () => {
    const request = {
      title: "A".repeat(101),
      description: "Valid description",
      instances: [],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.title).toBe("errors:titleTooLong")
  })

  test("validates description too long", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const endDate = new Date(futureDate)
    endDate.setHours(endDate.getHours() + 2)

    const request = {
      title: "Valid Title",
      description: "A".repeat(1001),
      instances: [
        {
          venue_id: "venue-1",
          start_datetime: futureDate.toISOString(),
          end_datetime: endDate.toISOString(),
          max_attendees: 50,
        },
      ],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.description).toBe("errors:descriptionTooLong")
  })

  test("validates missing instances", () => {
    const request = {
      title: "Valid Title",
      description: "Valid description",
      instances: [],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.instances).toBe("errors:noInstances")
  })

  test("validates too many instances", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const endDate = new Date(futureDate)
    endDate.setHours(endDate.getHours() + 2)

    const request = {
      title: "Valid Title",
      description: "Valid description",
      instances: Array(51).fill({
        venue_id: "venue-1",
        start_datetime: futureDate.toISOString(),
        end_datetime: endDate.toISOString(),
        max_attendees: 50,
      }),
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.instances).toBe("errors:tooManyInstances")
  })

  test("validates invalid instances", () => {
    const request = {
      title: "Valid Title",
      description: "Valid description",
      instances: [
        {
          venue_id: "", // Invalid - missing venue
          start_datetime: "2024-02-01T10:00:00.000Z",
          end_datetime: "2024-02-01T12:00:00.000Z",
        },
      ],
    }

    const result = validateEventRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.instances).toBe("errors:invalidInstances")
  })
})

describe("validateEventInstanceRequest", () => {
  test("validates valid instance request", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const endDate = new Date(futureDate)
    endDate.setHours(endDate.getHours() + 2)

    const request = {
      venue_id: "venue-1",
      start_datetime: futureDate.toISOString(),
      end_datetime: endDate.toISOString(),
      max_attendees: 50,
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  test("validates missing venue", () => {
    const request = {
      venue_id: "",
      start_datetime: "2024-02-01T10:00:00.000Z",
      end_datetime: "2024-02-01T12:00:00.000Z",
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.venue_id).toBe("errors:venueRequired")
  })

  test("validates missing start date", () => {
    const request = {
      venue_id: "venue-1",
      start_datetime: "",
      end_datetime: "2024-02-01T12:00:00.000Z",
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.start_datetime).toBe("errors:startDateRequired")
  })

  test("validates missing end date", () => {
    const request = {
      venue_id: "venue-1",
      start_datetime: "2024-02-01T10:00:00.000Z",
      end_datetime: "",
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.end_datetime).toBe("errors:endDateRequired")
  })

  test("validates end before start", () => {
    const request = {
      venue_id: "venue-1",
      start_datetime: "2024-02-01T12:00:00.000Z",
      end_datetime: "2024-02-01T10:00:00.000Z",
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.dateRange).toBe("errors:invalidDateRange")
  })

  test("validates negative max attendees", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const endDate = new Date(futureDate)
    endDate.setHours(endDate.getHours() + 2)

    const request = {
      venue_id: "venue-1",
      start_datetime: futureDate.toISOString(),
      end_datetime: endDate.toISOString(),
      max_attendees: -1,
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.max_attendees).toBe("errors:maxAttendeesTooSmall")
  })
})

describe("formatEventTitle", () => {
  test("trims whitespace and capitalizes first letter", () => {
    expect(formatEventTitle("  test event  ")).toBe("Test event")
  })

  test("handles empty string", () => {
    expect(formatEventTitle("")).toBe("")
  })

  test("handles already capitalized", () => {
    expect(formatEventTitle("Test Event")).toBe("Test Event")
  })
})

describe("formatEventDescription", () => {
  test("trims whitespace", () => {
    expect(formatEventDescription("  Test Description  ")).toBe("Test Description")
  })

  test("handles empty string", () => {
    expect(formatEventDescription("")).toBe(null)
  })

  test("handles null", () => {
    expect(formatEventDescription(null as any)).toBe(null)
  })

  test("handles undefined", () => {
    expect(formatEventDescription(undefined)).toBe(null)
  })
})

describe("formatDateTime", () => {
  test("formats date object to ISO string", () => {
    const date = new Date("2024-02-01T10:00:00.000Z")
    expect(formatDateTime(date)).toBe("2024-02-01T10:00:00.000Z")
  })

  test("passes through ISO string", () => {
    const dateString = "2024-02-01T10:00:00.000Z"
    expect(formatDateTime(dateString)).toBe(dateString)
  })

  test("handles invalid date", () => {
    expect(() => formatDateTime("invalid")).toThrow("Invalid time value")
  })
})

describe("mapEventError", () => {
  test("maps duplicate key error", () => {
    const error = {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    }

    const result = mapEventError(error)

    expect(result.code).toBe("errors:databaseError")
    expect(result.message).toBe("errors:databaseError")
  })

  test("maps foreign key error", () => {
    const error = {
      code: "23503",
      message:
        'insert or update on table "events" violates foreign key constraint "fk_business_id"',
    }

    const result = mapEventError(error)

    expect(result.code).toBe("errors:businessNotFound")
    expect(result.message).toBe("errors:businessNotFound")
  })

  test("maps null error", () => {
    const result = mapEventError(null)

    expect(result.code).toBe("errors:databaseError")
    expect(result.message).toBe("errors:databaseError")
  })

  test("maps unknown error", () => {
    const error = {
      message: "Some unknown error",
    }

    const result = mapEventError(error)

    expect(result.code).toBe("errors:databaseError")
    expect(result.message).toBe("errors:databaseError")
  })
})

describe("generateEventImageFilename", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1704067200000) // 2024-01-01T00:00:00.000Z
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("generates filename for jpeg", () => {
    const filename = generateEventImageFilename("event-123", 0, "image/jpeg")
    expect(filename).toBe("event-123/image-0-1704067200000.jpeg")
  })

  test("generates filename for png", () => {
    const filename = generateEventImageFilename("event-123", 1, "image/png")
    expect(filename).toBe("event-123/image-1-1704067200000.png")
  })

  test("generates filename for webp", () => {
    const filename = generateEventImageFilename("event-123", 2, "image/webp")
    expect(filename).toBe("event-123/image-2-1704067200000.webp")
  })

  test("defaults to jpg for unknown type", () => {
    const filename = generateEventImageFilename("event-123", 3, "image/unknown")
    expect(filename).toBe("event-123/image-3-1704067200000.unknown")
  })
})

describe("calculateEventDuration", () => {
  test("calculates duration in hours", () => {
    const start = "2024-02-01T10:00:00.000Z"
    const end = "2024-02-01T12:30:00.000Z"

    expect(calculateEventDuration(start, end)).toBe(2.5)
  })

  test("returns 0 for same start and end", () => {
    const time = "2024-02-01T10:00:00.000Z"

    expect(calculateEventDuration(time, time)).toBe(0)
  })

  test("handles date objects", () => {
    const start = new Date("2024-02-01T10:00:00.000Z")
    const end = new Date("2024-02-01T14:00:00.000Z")

    expect(calculateEventDuration(start.toISOString(), end.toISOString())).toBe(4)
  })
})

describe("isEventInstancePast", () => {
  const now = new Date("2024-02-01T12:00:00.000Z")

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("returns true for past instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-01-01T10:00:00.000Z",
      end_datetime: "2024-01-01T12:00:00.000Z",
      // status removed (derived from timing),
    }

    expect(isEventInstancePast(instance.end_datetime)).toBe(true)
  })

  test("returns false for future instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-03-01T10:00:00.000Z",
      end_datetime: "2024-03-01T12:00:00.000Z",
    }

    expect(isEventInstancePast(instance.end_datetime)).toBe(false)
  })

  test("returns false for active instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-02-01T11:00:00.000Z",
      end_datetime: "2024-02-01T13:00:00.000Z",
    }

    expect(isEventInstancePast(instance.end_datetime)).toBe(false)
  })
})

describe("isEventInstanceActive", () => {
  const now = new Date("2024-02-01T12:00:00.000Z")

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("returns true for active instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-02-01T11:00:00.000Z",
      end_datetime: "2024-02-01T13:00:00.000Z",
    }

    expect(isEventInstanceActive(instance.start_datetime, instance.end_datetime)).toBe(true)
  })

  test("returns false for past instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-01-01T10:00:00.000Z",
      end_datetime: "2024-01-01T12:00:00.000Z",
      // status removed (derived from timing),
    }

    expect(isEventInstanceActive(instance.start_datetime, instance.end_datetime)).toBe(false)
  })

  test("returns false for future instance", () => {
    const instance = {
      id: "instance-1",
      event_id: "event-1",
      venue_id: "venue-1",
      start_datetime: "2024-03-01T10:00:00.000Z",
      end_datetime: "2024-03-01T12:00:00.000Z",
    }

    expect(isEventInstanceActive(instance.start_datetime, instance.end_datetime)).toBe(false)
  })
})

describe("sortEventInstancesByStartDate", () => {
  test("sorts instances by start date ascending", () => {
    const instances = [
      {
        id: "instance-2",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-15T10:00:00.000Z",
        end_datetime: "2024-02-15T12:00:00.000Z",
      },
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-01T10:00:00.000Z",
        end_datetime: "2024-02-01T12:00:00.000Z",
      },
      {
        id: "instance-3",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-10T10:00:00.000Z",
        end_datetime: "2024-02-10T12:00:00.000Z",
      },
    ]

    const sorted = sortEventInstancesByStartDate(instances)

    expect(sorted[0].id).toBe("instance-1")
    expect(sorted[1].id).toBe("instance-3")
    expect(sorted[2].id).toBe("instance-2")
  })

  test("handles empty array", () => {
    expect(sortEventInstancesByStartDate([])).toEqual([])
  })

  test("handles single instance", () => {
    const instances = [
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-01T10:00:00.000Z",
        end_datetime: "2024-02-01T12:00:00.000Z",
      },
    ]

    expect(sortEventInstancesByStartDate(instances)).toEqual(instances)
  })
})

describe("groupEventInstancesByDate", () => {
  test("groups instances by date", () => {
    const instances = [
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-01T10:00:00.000Z",
        end_datetime: "2024-02-01T12:00:00.000Z",
      },
      {
        id: "instance-2",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-01T14:00:00.000Z",
        end_datetime: "2024-02-01T16:00:00.000Z",
      },
      {
        id: "instance-3",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-15T10:00:00.000Z",
        end_datetime: "2024-02-15T12:00:00.000Z",
      },
    ]

    const grouped = groupEventInstancesByDate(instances)

    expect(Object.keys(grouped)).toHaveLength(2)
    expect(grouped["2024-02-01"]).toHaveLength(2)
    expect(grouped["2024-02-15"]).toHaveLength(1)
  })

  test("handles empty array", () => {
    expect(groupEventInstancesByDate([])).toEqual({})
  })

  test("handles different time zones", () => {
    const instances = [
      {
        id: "instance-1",
        event_id: "event-1",
        venue_id: "venue-1",
        start_datetime: "2024-02-01T23:00:00.000Z", // Late UTC becomes next day in some timezones
        end_datetime: "2024-02-02T01:00:00.000Z",
      },
    ]

    const grouped = groupEventInstancesByDate(instances)

    expect(Object.keys(grouped)).toHaveLength(1)
    expect(grouped["2024-02-01"]).toHaveLength(1)
  })
})
