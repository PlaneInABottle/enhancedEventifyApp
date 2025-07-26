import { supabase } from "@/clients/supabase/SupabaseClient"

import type { MapEventsResult, MapBounds, RawMapEventInstance } from "./mapTypes"

/**
 * Map Service
 *
 * Handles map-related API operations using Supabase
 */

/**
 * Fetches events within geographic bounds using Supabase RPC function
 */
export async function getEventsInBounds(bounds: MapBounds): Promise<MapEventsResult> {
  try {
    const { data, error } = await supabase.rpc("get_events_in_bounds", {
      north: bounds.north,
      south: bounds.south,
      east: bounds.east,
      west: bounds.west,
      start_date: bounds.startDate,
      end_date: bounds.endDate,
    })

    if (error) {
      console.error("Error fetching events in bounds:", error)
      return {
        success: false,
        error: error.message || "Failed to fetch events",
      }
    }

    return {
      success: true,
      events: data as RawMapEventInstance[],
    }
  } catch (error) {
    console.error("Unexpected error in getEventsInBounds:", error)
    return {
      success: false,
      error: "Unexpected error occurred",
    }
  }
}