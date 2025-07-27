import { supabase } from "@/clients/supabase/SupabaseClient"
import { Platform } from "react-native"

import type { MapEventsResult, MapBounds, RawMapEventInstance } from "./mapTypes"

/**
 * Map Service
 *
 * Handles map-related API operations using Supabase and platform-specific map interactions
 */

/**
 * Gets visible bounds from a map reference, handling platform differences
 */
export async function getMapBounds(mapRef: any): Promise<MapBounds> {
  if (!mapRef?.current) {
    throw new Error("Map reference is not available")
  }

  const mapComponent = mapRef.current

  // React Native (@rnmapbox/maps)
  if (typeof mapComponent.getVisibleBounds === 'function') {
    const bounds = await mapComponent.getVisibleBounds()
    const [[west, south], [east, north]] = bounds
    return { north, south, east, west }
  }

  // Web (@rnmapbox/maps) - the actual mapbox-gl instance is nested
  const webMap = mapComponent.map
  if (webMap && typeof webMap.getBounds === 'function') {
    const bounds = webMap.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    return {
      north: ne.lat,
      south: sw.lat,
      east: ne.lng,
      west: sw.lng,
    }
  }

  // Fallback for unsupported platforms
  throw new Error(`Map bounds detection not supported on ${Platform.OS}`)
}

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
      return {
        success: false,
        error: error.message || "map:errorLoadingEvents",
      }
    }

    return {
      success: true,
      events: data as RawMapEventInstance[],
    }
  } catch (error) {
    return {
      success: false,
      error: "map:errorLoadingEvents",
    }
  }
}