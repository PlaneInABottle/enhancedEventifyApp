/**
 * Event Service Types
 * TypeScript interfaces and types for business event management
 */

import type { ImagePickerAsset } from "expo-image-picker"

// ============================================================================
// DATABASE TYPES (matching database schema)
// ============================================================================

export interface Event {
  id: string
  business_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface EventInstance {
  id: string
  event_id: string
  venue_id: string
  start_datetime: string
  end_datetime: string
  max_attendees: number | null
  created_at: string
  updated_at: string
}

// (Phase 1 Removal) EventInstanceStatus removed

// ============================================================================
// SERVICE REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateEventRequest {
  title: string
  description?: string
  instances: CreateEventInstanceRequest[]
  imageAsset?: ImagePickerAsset | null // Single image for React Native
}

export interface CreateEventInstanceRequest {
  venue_id: string
  start_datetime: string // ISO string
  end_datetime: string // ISO string
  max_attendees?: number
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  imageAsset?: ImagePickerAsset | null // New image to upload
  removeImage?: boolean // Set to true to remove existing image without replacement
}

export interface UpdateEventInstanceRequest {
  venue_id?: string
  start_datetime?: string
  end_datetime?: string
  max_attendees?: number
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export interface EventResult {
  success: boolean
  event?: Event
  error?: string
}

export interface EventInstanceResult {
  success: boolean
  eventInstance?: EventInstance
  error?: string
}

export interface EventListResult {
  success: boolean
  events?: EventWithDetails[]
  error?: string
}

export interface EventInstanceListResult {
  success: boolean
  eventInstances?: EventInstanceWithVenue[]
  error?: string
}

export interface CreateEventResult {
  success: boolean
  event?: Event
  eventInstances?: EventInstance[]
  error?: string
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export interface EventWithDetails extends Event {
  instances: EventInstanceWithVenue[]
  imageUrl?: string | null
}

export interface EventInstanceWithVenue extends EventInstance {
  venue: {
    id: string
    name: string
    address: string
    city: string
    country: string
    latitude: number | null
    longitude: number | null
  }
}

export interface EventWithInstancesAndMedia extends Event {
  instances: EventInstanceWithVenue[]
  media: Array<{
    id: string
    file_url: string
    file_type: string
    alt_text: string | null
  }>
}

// ============================================================================
// FORM/UI TYPES
// ============================================================================

export interface EventFormData {
  title: string
  description: string
  instances: EventInstanceFormData[]
  imageAsset: ImagePickerAsset | null
}

export interface EventInstanceFormData {
  venue_id: string
  start_datetime: Date
  end_datetime: Date
  max_attendees: string // Form input as string, converted to number
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface EventValidationResult {
  isValid: boolean
  errors: {
    title?: string
    description?: string
    instances?: string
    general?: string
  }
}

export interface EventInstanceValidationResult {
  isValid: boolean
  errors: {
    venue_id?: string
    start_datetime?: string
    end_datetime?: string
    max_attendees?: string
    dateRange?: string
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EVENT_CONSTANTS = {
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000,
  },
  INSTANCES: {
    MIN_COUNT: 1,
    MAX_COUNT: 50,
  },
  MAX_ATTENDEES: {
    MIN: 1,
    MAX: 10000,
  },
  IMAGES: {
    MAX_COUNT: 10,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },
} as const

// (Phase 1 Removal) EVENT_INSTANCE_STATUS_LABELS removed

// ============================================================================
// ERROR TYPES
// ============================================================================

export type EventErrorCode =
  | "errors:eventNotFound"
  | "errors:eventInstanceNotFound"
  | "errors:titleRequired"
  | "errors:titleTooShort"
  | "errors:titleTooLong"
  | "errors:eventDescriptionTooLong"
  | "errors:noInstances"
  | "errors:tooManyInstances"
  | "errors:venueRequired"
  | "errors:venueNotFound"
  | "errors:startDateRequired"
  | "errors:endDateRequired"
  | "errors:invalidDateRange"
  | "errors:maxAttendeesTooSmall"
  | "errors:maxAttendeesTooLarge"
  | "errors:businessNotFound"
  | "errors:businessNotVerified"
  | "errors:unauthorizedAccess"
  | "errors:databaseError"
  | "errors:unknownError"
