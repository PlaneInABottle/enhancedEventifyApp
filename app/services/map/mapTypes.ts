/**
 * Map Service Types
 *
 * Type definitions for map-related API operations
 */

// Raw response from Supabase get_events_in_bounds function
export interface RawMapEventInstance {
  instance_id: string
  event_id: string
  venue_id: string
  start_datetime: string
  end_datetime: string
  event_instance_status: string
  max_attendees: number | null
  event_title: string
  event_description: string | null
  venue_name: string
  venue_capacity: number | null
  coordinates: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  full_address: string
  city: string
}

// Service result types
export interface MapEventsResult {
  success: boolean
  events?: RawMapEventInstance[]
  error?: string
}

// Geographic bounds for queries
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
  startDate?: string
  endDate?: string
}
