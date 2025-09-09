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
  sortEventInstancesByStartDate,
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
    expect(result.errors.description).toBe("errors:eventDescriptionTooLong")
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
    expect(result.errors.end_datetime).toBe("errors:invalidDateRange")
  })

  test("validates past start date", () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 2) // 2 hours ago
    const endDate = new Date()
    endDate.setHours(endDate.getHours() + 1) // 1 hour from now

    const request = {
      venue_id: "venue-1",
      start_datetime: pastDate.toISOString(),
      end_datetime: endDate.toISOString(),
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.start_datetime).toBe("errors:pastStartDate")
  })

  test("validates invalid date format", () => {
    const request = {
      venue_id: "venue-1",
      start_datetime: "invalid-date",
      end_datetime: "2024-02-01T12:00:00.000Z",
    }

    const result = validateEventInstanceRequest(request)

    expect(result.isValid).toBe(false)
    expect(result.errors.start_datetime).toBe("errors:invalidDateFormat")
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

// Removed deprecated tests for generateEventImageFilename and calculateEventDuration per request.

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

// Removed deprecated tests for groupEventInstancesByDate per request.
