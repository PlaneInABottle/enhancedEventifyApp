/**
 * Business Event Models
 * MobX State Tree models for business event management - simplified approach using computed views
 */

import { types, flow, Instance, destroy } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { 
  createEvent,
  getEvent,
  getEventsForBusiness,
  updateEvent,
  deleteEvent,
  createEventInstance,
  updateEventInstance,
  deleteEventInstance,
} from "@/services/event/businessEventService"
import type {
  Event,
  EventInstance,
  EventInstanceStatus,
  CreateEventRequest,
  CreateEventInstanceRequest,
  UpdateEventRequest,
  UpdateEventInstanceRequest,
  EventWithDetails,
} from "@/services/event"

// ============================================================================
// EVENT INSTANCE MODEL
// ============================================================================

export const BusinessEventInstanceModel = types
  .model("BusinessEventInstance", {
    id: types.identifier,
    event_id: types.string,
    venue_id: types.string,
    start_datetime: types.string,
    end_datetime: types.string,
    event_instance_status: types.enumeration("EventInstanceStatus", [
      "draft",
      "published",
      "scheduled",
      "cancelled",
      "postponed",
      "completed",
    ]),
    max_attendees: types.maybeNull(types.number),
    created_at: types.string,
    updated_at: types.string,
    // Venue data (populated when fetched with joins)
    venue: types.maybe(types.model("VenueInfo", {
      id: types.string,
      name: types.string,
      address: types.string,
      city: types.string,
      country: types.string,
      latitude: types.maybeNull(types.number),
      longitude: types.maybeNull(types.number),
    })),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get startDate() {
      return new Date(self.start_datetime)
    },
    get endDate() {
      return new Date(self.end_datetime)
    },
    get isPast() {
      return new Date(self.end_datetime) < new Date()
    },
    get isActive() {
      const now = new Date()
      return new Date(self.start_datetime) <= now && now <= new Date(self.end_datetime)
    },
    get isFuture() {
      return new Date(self.start_datetime) > new Date()
    },
    get duration() {
      const diffMs = this.endDate.getTime() - this.startDate.getTime()
      return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10 // Hours with 1 decimal
    },
  }))
  .actions((self) => ({
    async update(updates: UpdateEventInstanceRequest) {
      const result = await updateEventInstance(self.id, updates)
      if (result.success && result.eventInstance) {
        // Update properties individually to comply with MST strict mode
        const instance = result.eventInstance
        if (instance.venue_id) self.setProp("venue_id", instance.venue_id)
        if (instance.start_datetime) self.setProp("start_datetime", instance.start_datetime)
        if (instance.end_datetime) self.setProp("end_datetime", instance.end_datetime)
        if (instance.event_instance_status) self.setProp("event_instance_status", instance.event_instance_status)
        if (instance.max_attendees !== undefined) self.setProp("max_attendees", instance.max_attendees)
        if (instance.updated_at) self.setProp("updated_at", instance.updated_at)
        return { success: true }
      }
      return { success: false, error: result.error }
    },

    async delete() {
      const result = await deleteEventInstance(self.id)
      if (result.success) {
        destroy(self) // MST will handle removal from parent array
        return { success: true }
      }
      return { success: false, error: result.error }
    },
  }))

// ============================================================================
// EVENT MODEL
// ============================================================================

export const BusinessEventModel = types
  .model("BusinessEvent", {
    id: types.identifier,
    business_id: types.string,
    title: types.string,
    description: types.maybeNull(types.string),
    instances: types.array(BusinessEventInstanceModel),
    created_at: types.string,
    updated_at: types.string,
    // Optional image URL for display
    imageUrl: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    // All computed fields - no manual synchronization needed!
    get instanceCount() {
      return self.instances.length
    },
    get hasInstances() {
      return this.instanceCount > 0
    },
    get upcomingInstances() {
      const now = new Date()
      return self.instances
        .filter(instance => new Date(instance.start_datetime) > now)
        .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    },
    get pastInstances() {
      const now = new Date()
      return self.instances
        .filter(instance => new Date(instance.end_datetime) < now)
        .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime())
    },
    get activeInstances() {
      const now = new Date()
      return self.instances.filter(instance => {
        const start = new Date(instance.start_datetime)
        const end = new Date(instance.end_datetime)
        return start <= now && now <= end
      })
    },
    get nextInstance() {
      return this.upcomingInstances[0] || null
    },
    get hasUpcomingInstances() {
      return this.upcomingInstances.length > 0
    },
    get earliestStartDate() {
      if (this.instanceCount === 0) return null
      return self.instances.reduce((earliest, instance) => {
        return new Date(instance.start_datetime) < new Date(earliest.start_datetime) 
          ? instance 
          : earliest
      }).start_datetime
    },
    get latestEndDate() {
      if (this.instanceCount === 0) return null
      return self.instances.reduce((latest, instance) => {
        return new Date(instance.end_datetime) > new Date(latest.end_datetime) 
          ? instance 
          : latest
      }).end_datetime
    },
    get statusCounts() {
      const counts: Record<EventInstanceStatus, number> = {
        draft: 0,
        published: 0,
        scheduled: 0,
        cancelled: 0,
        postponed: 0,
        completed: 0,
      }
      
      self.instances.forEach(instance => {
        counts[instance.event_instance_status as EventInstanceStatus]++
      })
      
      return counts
    },
  }))
  .actions((self) => ({
    async update(updates: UpdateEventRequest) {
      const result = await updateEvent(self.id, updates)
      if (result.success && result.event) {
        // Update properties individually to comply with MST strict mode
        const event = result.event
        if (event.title) self.setProp("title", event.title)
        if (event.description !== undefined) self.setProp("description", event.description)
        if (event.updated_at) self.setProp("updated_at", event.updated_at)
        return { success: true }
      }
      return { success: false, error: result.error }
    },

    async delete() {
      const result = await deleteEvent(self.id)
      if (result.success) {
        destroy(self) // MST will handle removal from store
        return { success: true }
      }
      return { success: false, error: result.error }
    },

    addNewInstance: flow(function* (instanceData: CreateEventInstanceRequest) {
      const result = yield createEventInstance(self.id, instanceData)
      if (result.success && result.eventInstance) {
        // Add to instances array - computed fields update automatically
        self.instances.push(result.eventInstance as EventInstance)
        return { success: true, eventInstance: result.eventInstance }
      }
      return { success: false, error: result.error }
    }),
  }))

// ============================================================================
// EVENT STORE MODEL
// ============================================================================

export const BusinessEventStore = types
  .model("BusinessEventStore", {
    events: types.array(BusinessEventModel),
    selectedEvent: types.safeReference(BusinessEventModel),
    isLoading: types.optional(types.boolean, false),
    isCreating: types.optional(types.boolean, false),
    lastError: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get eventCount() {
      return self.events.length
    },
    getEventById(id: string) {
      return self.events.find(event => event.id === id)
    },
    get upcomingEvents() {
      return self.events.filter(event => event.hasUpcomingInstances)
    },
    get eventsByStatus() {
      return {
        upcoming: self.events.filter(event => event.hasUpcomingInstances),
        active: self.events.filter(event => event.activeInstances.length > 0),
        past: self.events.filter(event => !event.hasUpcomingInstances && event.activeInstances.length === 0),
      }
    },
  }))
  .actions((self) => ({
    setSelectedEvent(eventId: string | null) {
      self.setProp("selectedEvent", eventId || undefined)
    },

    clearError() {
      self.setProp("lastError", null)
    },

    reset() {
      // Use empty array snapshot to avoid detached node errors
      self.setProp("events", [])
      self.setProp("selectedEvent", undefined)
      self.setProp("isLoading", false)
      self.setProp("isCreating", false)
      self.setProp("lastError", null)
    },

    // ========================================================================
    // ASYNC ACTIONS
    // ========================================================================

    createEvent: flow(function* (businessId: string, eventData: CreateEventRequest) {
      self.setProp("isCreating", true)
      self.setProp("lastError", null)

      try {
        const result = yield createEvent(businessId, eventData)

        if (result.success && result.event && result.eventInstances) {
          // Create event with instances - let MST handle the computed fields
          const eventModel = BusinessEventModel.create({
            ...result.event,
            instances: result.eventInstances.map((instance: EventInstance) => ({
              ...instance,
              venue: undefined, // Will be populated when needed
            })),
            imageUrl: undefined, // Will be set after image upload
          })

          self.events.push(eventModel)
          return { success: true, event: eventModel }
        } else {
          self.setProp("lastError", result.error || "errors.createEventFailed")
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error("EventStore.createEvent error:", error)
        self.setProp("lastError", "errors.unknownError")
        return { success: false, error: "errors.unknownError" }
      } finally {
        self.setProp("isCreating", false)
      }
    }),

    fetchEvents: flow(function* (businessId: string) {
      self.setProp("isLoading", true)
      self.setProp("lastError", null)

      try {
        const result = yield getEventsForBusiness(businessId)

        if (result.success && result.events) {
          // Use applySnapshot to safely replace events array
          // This prevents "no longer part of state tree" errors
          const eventsSnapshot = result.events.map((eventData: EventWithDetails) => ({
            ...eventData,
            imageUrl: eventData.imageUrl || undefined,
          }))
          self.setProp("events", eventsSnapshot as any)
          return { success: true }
        } else {
          self.setProp("lastError", result.error || "errors.fetchEventsFailed")
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error("EventStore.fetchEvents error:", error)
        self.setProp("lastError", "errors.unknownError")
        return { success: false, error: "errors.unknownError" }
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    fetchEventById: flow(function* (eventId: string) {
      self.setProp("isLoading", true)
      self.setProp("lastError", null)

      try {
        const result = yield getEvent(eventId)

        if (result.success && result.event) {
          const existingEvent = self.getEventById(eventId)
          if (existingEvent) {
            // Update existing event properties individually
            const event = result.event as EventWithDetails
            if (event.title) existingEvent.setProp("title", event.title)
            if (event.description !== undefined) existingEvent.setProp("description", event.description)
            if (event.updated_at) existingEvent.setProp("updated_at", event.updated_at)
            existingEvent.setProp("imageUrl", event.imageUrl ?? undefined)
          } else {
            // Add new event to store
            const eventModel = BusinessEventModel.create({
              ...(result.event as EventWithDetails),
              imageUrl: (result.event as EventWithDetails).imageUrl || undefined,
            })
            self.events.push(eventModel)
          }
          
          return { success: true, event: result.event }
        } else {
          self.setProp("lastError", result.error || "errors.fetchEventFailed")
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error("EventStore.fetchEventById error:", error)
        self.setProp("lastError", "errors.unknownError")
        return { success: false, error: "errors.unknownError" }
      } finally {
        self.setProp("isLoading", false)
      }
    }),
  }))

// ============================================================================
// TYPES
// ============================================================================

export interface IBusinessEventStore extends Instance<typeof BusinessEventStore> {}
export interface IBusinessEvent extends Instance<typeof BusinessEventModel> {}
export interface IBusinessEventInstance extends Instance<typeof BusinessEventInstanceModel> {}