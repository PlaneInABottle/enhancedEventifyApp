/**
 * Event Service
 * Handles business event management operations using Supabase
 */

import { supabase } from "@/clients/supabase/SupabaseClient"
import { uploadMedia, deleteMedia, getMediaForEntity } from "@/services/media/mediaService"
import type { MediaItem } from "@/services/media/mediaTypes"

import {
  validateEventRequest,
  validateEventInstanceRequest,
  formatEventTitle,
  formatEventDescription,
  formatDateTime,
  mapEventError,
  generateEventImageFilename,
  sortEventInstancesByStartDate,
} from "./businessEventHelpers"

import type {
  Event,
  EventInstance,
  CreateEventRequest,
  CreateEventInstanceRequest,
  UpdateEventRequest,
  UpdateEventInstanceRequest,
  EventResult,
  EventInstanceResult,
  EventListResult,
  EventInstanceListResult,
  CreateEventResult,
  EventWithDetails,
  EventInstanceWithVenue,
  EventWithInstancesAndMedia,
} from "./businessEventTypes"

// ============================================================================
// EVENT CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new event with instances and images
 */
export async function createEvent(
  businessId: string,
  request: CreateEventRequest,
): Promise<CreateEventResult> {
  try {
    // Validate request
    const validation = validateEventRequest(request)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      return {
        success: false,
        error: firstError || "errors.validationFailed",
      }
    }

    // Format event data
    const eventData = {
      business_id: businessId,
      title: formatEventTitle(request.title),
      description: formatEventDescription(request.description),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single()

    if (eventError || !event) {
      const mappedError = mapEventError(eventError)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    const createdEvent = event as Event

    // Create event instances
    const instancePromises = request.instances.map(async (instanceRequest) => {
      return createEventInstanceInternal(createdEvent.id, instanceRequest)
    })

    const instanceResults = await Promise.allSettled(instancePromises)
    const successfulInstances: EventInstance[] = []
    const failedInstances: string[] = []

    instanceResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        successfulInstances.push(result.value.eventInstance!)
      } else {
        const error = result.status === "rejected" ? result.reason : result.value.error
        failedInstances.push(`Instance ${index + 1}: ${error}`)
      }
    })

    // If no instances were created successfully, delete the event and fail
    if (successfulInstances.length === 0) {
      await deleteEvent(createdEvent.id)
      return {
        success: false,
        error: failedInstances.join(", ") || "errors.noInstancesCreated",
      }
    }

    // Upload images if provided
    if (request.imageFiles && request.imageFiles.length > 0) {
      const imageUploadPromises = request.imageFiles.map(async (file, index) => {
        const arrayBuffer = await file.arrayBuffer()
        return uploadMedia("event", createdEvent.id, arrayBuffer, file.type, {
          alt_text: `Event image ${index + 1}`,
        })
      })

      const imageResults = await Promise.allSettled(imageUploadPromises)
      // Log image upload failures but don't fail the entire operation
      imageResults.forEach((result, index) => {
        if (result.status === "rejected" || !result.value.success) {
          const error = result.status === "rejected" ? result.reason : result.value.error
          console.warn(`Failed to upload image ${index + 1} for event ${createdEvent.id}:`, error)
        }
      })
    }

    return {
      success: true,
      event: createdEvent,
      eventInstances: successfulInstances,
    }
  } catch (error) {
    console.error("Unexpected error creating event:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Gets event by ID with instances and media
 */
export async function getEvent(eventId: string): Promise<EventResult> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_instances (
          *,
          venues (
            id,
            name,
            address:addresses (
              full_address,
              city,
              country,
              coordinates
            )
          )
        )
      `,
      )
      .eq("id", eventId)
      .single()

    if (error || !data) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    // Get media for this event
    const mediaResult = await getMediaForEntity("event", eventId)
    const media = mediaResult.success ? mediaResult.media || [] : []

    const eventWithDetails: EventWithInstancesAndMedia = {
      ...data,
      instances: sortEventInstancesByStartDate(data.event_instances || []),
      media: media.map((m) => ({
        id: m.id,
        file_url: m.file_url,
        file_type: m.file_type,
        alt_text: m.alt_text || null,
      })),
    }

    return {
      success: true,
      event: eventWithDetails as Event,
    }
  } catch (error) {
    console.error("Unexpected error fetching event:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Gets all events for a business
 */
export async function getEventsForBusiness(businessId: string): Promise<EventListResult> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_instances (
          *,
          venues (
            id,
            name,
            address:addresses (
              full_address,
              city,
              country,
              coordinates
            )
          )
        )
      `,
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (error) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    // Process events to include computed fields
    const eventsWithDetails: EventWithDetails[] = await Promise.all(
      (data || []).map(async (event) => {
        const instances = sortEventInstancesByStartDate(event.event_instances || [])

        // Get first image for this event
        const mediaResult = await getMediaForEntity("event", event.id)
        const firstImage =
          mediaResult.success && mediaResult.media && mediaResult.media.length > 0
            ? mediaResult.media[0].file_url
            : null

        return {
          ...event,
          instances,
          imageUrl: firstImage,
        }
      }),
    )

    return {
      success: true,
      events: eventsWithDetails,
    }
  } catch (error) {
    console.error("Unexpected error fetching events:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Updates an event
 */
export async function updateEvent(
  eventId: string,
  updates: UpdateEventRequest,
): Promise<EventResult> {
  try {
    // Format updates
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) {
      updateData.title = formatEventTitle(updates.title)
    }

    if (updates.description !== undefined) {
      updateData.description = formatEventDescription(updates.description)
    }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single()

    if (error || !data) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    return {
      success: true,
      event: data as Event,
    }
  } catch (error) {
    console.error("Unexpected error updating event:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Deletes an event and all its instances and media
 */
export async function deleteEvent(eventId: string): Promise<EventResult> {
  try {
    // First delete all media associated with the event
    const mediaResult = await getMediaForEntity("event", eventId)
    if (mediaResult.success && mediaResult.media) {
      const deletePromises = mediaResult.media.map((media) => deleteMedia(media.id))
      await Promise.allSettled(deletePromises) // Don't fail if media deletion fails
    }

    // Delete event instances (cascades automatically)
    // Delete the event (this will cascade to event_instances due to foreign key constraint)
    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    return {
      success: true,
      event: data as Event,
    }
  } catch (error) {
    console.error("Unexpected error deleting event:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

// ============================================================================
// EVENT INSTANCE OPERATIONS
// ============================================================================

/**
 * Internal helper to create an event instance
 */
async function createEventInstanceInternal(
  eventId: string,
  request: CreateEventInstanceRequest,
): Promise<EventInstanceResult> {
  const validation = validateEventInstanceRequest(request)
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    return {
      success: false,
      error: firstError || "errors.validationFailed",
    }
  }

  const instanceData = {
    event_id: eventId,
    venue_id: request.venue_id,
    start_datetime: formatDateTime(request.start_datetime),
    end_datetime: formatDateTime(request.end_datetime),
    max_attendees: request.max_attendees || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("event_instances")
    .insert(instanceData)
    .select()
    .single()

  if (error || !data) {
    const mappedError = mapEventError(error)
    return {
      success: false,
      error: mappedError.message,
    }
  }

  return {
    success: true,
    eventInstance: data as EventInstance,
  }
}

/**
 * Creates a new event instance for an existing event
 */
export async function createEventInstance(
  eventId: string,
  request: CreateEventInstanceRequest,
): Promise<EventInstanceResult> {
  try {
    return await createEventInstanceInternal(eventId, request)
  } catch (error) {
    console.error("Unexpected error creating event instance:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Gets all event instances for an event
 */
export async function getEventInstances(eventId: string): Promise<EventInstanceListResult> {
  try {
    const { data, error } = await supabase
      .from("event_instances")
      .select(
        `
        *,
        venues (
          id,
          name,
          address,
          city,
          country,
          latitude,
          longitude
        )
      `,
      )
      .eq("event_id", eventId)
      .order("start_datetime", { ascending: true })

    if (error) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    return {
      success: true,
      eventInstances: (data || []) as EventInstanceWithVenue[],
    }
  } catch (error) {
    console.error("Unexpected error fetching event instances:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Updates an event instance
 */
export async function updateEventInstance(
  instanceId: string,
  updates: UpdateEventInstanceRequest,
): Promise<EventInstanceResult> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.venue_id !== undefined) updateData.venue_id = updates.venue_id
    if (updates.start_datetime !== undefined)
      updateData.start_datetime = formatDateTime(updates.start_datetime)
    if (updates.end_datetime !== undefined)
      updateData.end_datetime = formatDateTime(updates.end_datetime)
    if (updates.max_attendees !== undefined) updateData.max_attendees = updates.max_attendees

    const { data, error } = await supabase
      .from("event_instances")
      .update(updateData)
      .eq("id", instanceId)
      .select()
      .single()

    if (error || !data) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    return {
      success: true,
      eventInstance: data as EventInstance,
    }
  } catch (error) {
    console.error("Unexpected error updating event instance:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}

/**
 * Deletes an event instance
 */
export async function deleteEventInstance(instanceId: string): Promise<EventInstanceResult> {
  try {
    const { data, error } = await supabase
      .from("event_instances")
      .delete()
      .eq("id", instanceId)
      .select()
      .single()

    if (error) {
      const mappedError = mapEventError(error)
      return {
        success: false,
        error: mappedError.message,
      }
    }

    return {
      success: true,
      eventInstance: data as EventInstance,
    }
  } catch (error) {
    console.error("Unexpected error deleting event instance:", error)
    return {
      success: false,
      error: "errors.unknownError",
    }
  }
}
