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
  CreateEventResult,
  EventWithDetails,
  EventInstanceWithVenue,
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
        error: firstError || "errors:validationFailed",
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
        error: failedInstances.join(", ") || "errors:noInstancesCreated",
      }
    }

    // Upload single image if provided
    if (request.imageAsset) {
      try {
        const response = await fetch(request.imageAsset.uri)
        const arrayBuffer = await response.arrayBuffer()
        const result = await uploadMedia("event", createdEvent.id, arrayBuffer, 
          request.imageAsset.mimeType || "image/jpeg", {
            alt_text: "Event image",
          })
        
        if (!result.success) {
          console.warn(`Failed to upload image for event ${createdEvent.id}:`, result.error)
        }
      } catch (error) {
        console.warn(`Failed to upload image for event ${createdEvent.id}:`, error)
      }
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
      error: "errors:unknownError",
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
      error: "errors:unknownError",
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

    // Handle image updates
    if (updates.removeImage || updates.imageAsset) {
      // Get existing media for this event
      const mediaResult = await getMediaForEntity("event", eventId)
      
      if (mediaResult.success && mediaResult.media) {
        // Delete all existing images
        const deletePromises = mediaResult.media.map((media) => deleteMedia(media.id))
        await Promise.allSettled(deletePromises) // Don't fail if deletion fails
      }

      // Upload new image if provided
      if (updates.imageAsset && !updates.removeImage) {
        try {
          const response = await fetch(updates.imageAsset.uri)
          const arrayBuffer = await response.arrayBuffer()
          const result = await uploadMedia("event", eventId, arrayBuffer, 
            updates.imageAsset.mimeType || "image/jpeg", {
              alt_text: "Event image",
            })
          
          if (!result.success) {
            console.warn(`Failed to upload new image for event ${eventId}:`, result.error)
          }
        } catch (error) {
          console.warn(`Failed to upload new image for event ${eventId}:`, error)
        }
      }
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
      error: "errors:unknownError",
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
      error: "errors:unknownError",
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
      error: firstError || "errors:validationFailed",
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
      error: "errors:unknownError",
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
      error: "errors:unknownError",
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
      error: "errors:unknownError",
    }
  }
}
