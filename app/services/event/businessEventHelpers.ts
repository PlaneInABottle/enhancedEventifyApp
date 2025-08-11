/**
 * Event Service Helpers
 * Validation, formatting, and utility functions for event management
 */

import type {
  CreateEventRequest,
  CreateEventInstanceRequest,
  EventValidationResult,
  EventInstanceValidationResult,
  EventErrorCode,
} from './businessEventTypes'
import { EVENT_CONSTANTS } from './businessEventTypes'

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates event creation request
 */
export function validateEventRequest(request: CreateEventRequest): EventValidationResult {
  const errors: EventValidationResult['errors'] = {}

  // Validate title
  if (!request.title?.trim()) {
    errors.title = 'errors.titleRequired'
  } else if (request.title.trim().length < EVENT_CONSTANTS.TITLE.MIN_LENGTH) {
    errors.title = 'errors.titleTooShort'
  } else if (request.title.length > EVENT_CONSTANTS.TITLE.MAX_LENGTH) {
    errors.title = 'errors.titleTooLong'
  }

  // Validate description
  if (request.description && request.description.length > EVENT_CONSTANTS.DESCRIPTION.MAX_LENGTH) {
    errors.description = 'errors.descriptionTooLong'
  }

  // Validate instances
  if (!request.instances || request.instances.length === 0) {
    errors.instances = 'errors.noInstances'
  } else if (request.instances.length > EVENT_CONSTANTS.INSTANCES.MAX_COUNT) {
    errors.instances = 'errors.tooManyInstances'
  } else {
    // Validate each instance
    const hasInstanceError = request.instances.some(instance => {
      const instanceValidation = validateEventInstanceRequest(instance)
      return !instanceValidation.isValid
    })
    
    if (hasInstanceError) {
      errors.instances = 'errors.invalidInstances'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validates event instance creation request
 */
export function validateEventInstanceRequest(request: CreateEventInstanceRequest): EventInstanceValidationResult {
  const errors: EventInstanceValidationResult['errors'] = {}

  // Validate venue_id
  if (!request.venue_id?.trim()) {
    errors.venue_id = 'errors.venueRequired'
  }

  // Validate start_datetime
  if (!request.start_datetime) {
    errors.start_datetime = 'errors.startDateRequired'
  }

  // Validate end_datetime
  if (!request.end_datetime) {
    errors.end_datetime = 'errors.endDateRequired'
  }

  // Validate date range
  if (request.start_datetime && request.end_datetime) {
    const startDate = new Date(request.start_datetime)
    const endDate = new Date(request.end_datetime)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.dateRange = 'errors.invalidDateFormat'
    } else if (endDate <= startDate) {
      errors.dateRange = 'errors.invalidDateRange'
    } else if (startDate <= new Date()) {
      errors.dateRange = 'errors.pastStartDate'
    }
  }

  // Validate max_attendees
  if (request.max_attendees !== undefined && request.max_attendees !== null) {
    if (request.max_attendees < EVENT_CONSTANTS.MAX_ATTENDEES.MIN) {
      errors.max_attendees = 'errors.maxAttendeesTooSmall'
    } else if (request.max_attendees > EVENT_CONSTANTS.MAX_ATTENDEES.MAX) {
      errors.max_attendees = 'errors.maxAttendeesTooLarge'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats event title (trim and capitalize first letter)
 */
export function formatEventTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Formats event description (trim and limit length)
 */
export function formatEventDescription(description: string | undefined): string | null {
  if (!description) return null
  
  const trimmed = description.trim()
  if (!trimmed) return null
  
  // Truncate if too long
  if (trimmed.length > EVENT_CONSTANTS.DESCRIPTION.MAX_LENGTH) {
    return trimmed.substring(0, EVENT_CONSTANTS.DESCRIPTION.MAX_LENGTH).trim()
  }
  
  return trimmed
}

/**
 * Formats datetime strings to ensure ISO format
 */
export function formatDateTime(dateTime: string | Date): string {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
  return date.toISOString()
}

// ============================================================================
// ERROR MAPPING FUNCTIONS
// ============================================================================

/**
 * Maps Supabase errors to user-friendly error codes
 */
export function mapEventError(error: any): { code: EventErrorCode; message: EventErrorCode } {
  // Handle null/undefined errors
  if (!error) {
    return { code: 'errors.databaseError', message: 'errors.databaseError' }
  }

  // Handle common Supabase error codes
  if (error.code === 'PGRST116' || error.status === 404) {
    return { code: 'errors.eventNotFound', message: 'errors.eventNotFound' }
  }

  if (error.code === '23505') { // Unique constraint violation
    return { code: 'errors.databaseError', message: 'errors.databaseError' }
  }

  if (error.code === '23503') { // Foreign key constraint violation
    if (error.message?.includes('business_id')) {
      return { code: 'errors.businessNotFound', message: 'errors.businessNotFound' }
    }
    if (error.message?.includes('venue_id')) {
      return { code: 'errors.venueNotFound', message: 'errors.venueNotFound' }
    }
  }

  if (error.code === 'RLS_VIOLATION' || error.message?.includes('RLS')) {
    return { code: 'errors.unauthorizedAccess', message: 'errors.unauthorizedAccess' }
  }

  // Default to database error for any other case
  console.error('Unmapped event error:', error)
  return { code: 'errors.databaseError', message: 'errors.databaseError' }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique filename for event images
 */
export function generateEventImageFilename(eventId: string, index: number, mimeType: string): string {
  const extension = mimeType.split('/')[1] || 'jpg'
  const timestamp = Date.now()
  return `${eventId}/image-${index}-${timestamp}.${extension}`
}

/**
 * Calculates event duration in hours
 */
export function calculateEventDuration(startDateTime: string, endDateTime: string): number {
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)
  const diffMs = end.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10 // Round to 1 decimal place
}

/**
 * Checks if event instance is in the past
 */
export function isEventInstancePast(endDateTime: string): boolean {
  const end = new Date(endDateTime)
  return end < new Date()
}

/**
 * Checks if event instance is happening now
 */
export function isEventInstanceActive(startDateTime: string, endDateTime: string): boolean {
  const now = new Date()
  const start = new Date(startDateTime)
  const end = new Date(endDateTime)
  return now >= start && now <= end
}

/**
 * Sorts event instances by start datetime
 */
export function sortEventInstancesByStartDate<T extends { start_datetime: string; end_datetime: string; event_instance_status?: string }>(instances: T[]): T[] {
  return [...instances].sort((a, b) => 
    new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  )
}

/**
 * Groups event instances by date (for display purposes)
 */
export function groupEventInstancesByDate<T extends { start_datetime: string }>(instances: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}
  
  instances.forEach(instance => {
    const date = new Date(instance.start_datetime).toISOString().split('T')[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(instance)
  })
  
  return grouped
}