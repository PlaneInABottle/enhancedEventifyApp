/**
 * Event Service Exports
 * Centralized exports for event management functionality
 */

// Types
export type {
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
  EventFormData,
  EventInstanceFormData,
  EventValidationResult,
  EventInstanceValidationResult,
  EventErrorCode,
} from "./businessEventTypes"

export { EVENT_CONSTANTS } from "./businessEventTypes"

// Event service functions
export {
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

// Helper functions
export {
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
