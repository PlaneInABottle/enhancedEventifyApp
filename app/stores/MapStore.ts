import { types, flow } from "mobx-state-tree"

import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { MapEventInstanceModel } from "@/models/MapModels"
import { getEventsInBounds } from "@/services/map"
import type { MapBounds } from "@/services/map"

/**
 * Map Store
 *
 * Manages reactive map state and event data using MobX-State-Tree
 */

export const MapStore = types
  .model("MapStore", {
    events: types.array(MapEventInstanceModel),
    isLoading: types.optional(types.boolean, false),
    lastError: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get eventCount() {
      return self.events.length
    },

    get hasEvents() {
      return self.events.length > 0
    },

    get venuesWithEvents() {
      const venueMap = new Map()

      self.events.forEach(event => {
        const venueKey = event.venue_id

        if (!venueMap.has(venueKey)) {
          venueMap.set(venueKey, {
            venue_id: event.venue_id,
            venue_name: event.venue_name,
            full_address: event.full_address,
            city: event.city,
            coordinates: event.coordinates,
            longitude: event.longitude,
            latitude: event.latitude,
            events: []
          })
        }

        venueMap.get(venueKey).events.push(event)
      })

      return Array.from(venueMap.values())
    },
  }))
  .actions((self) => ({
    clearError() {
      self.setProp("lastError", null)
    },

    setEvents(events: (typeof MapEventInstanceModel.Type)[]) {
      self.setProp("events", events)
    },

    clearEvents() {
      self.events.clear()
    },

    loadEventsInBounds: flow(function* (bounds: MapBounds) {
      try {
        self.setProp("isLoading", true)
        self.setProp("lastError", null)

        const result = yield getEventsInBounds(bounds)

        if (result.success && result.events) {
          self.setProp("events", result.events)
        } else {
          self.setProp("lastError", result.error || "map:errorLoadingEvents")
        }

        return result
      } catch (error) {
        self.setProp("lastError", "map:errorLoadingEvents")
        return { success: false, error: "map:errorLoadingEvents" }
      } finally {
        self.setProp("isLoading", false)
      }
    }),
  }))

// Export type for venue objects returned by venuesWithEvents computed property
export type VenueWithEvents = {
  venue_id: string
  venue_name: string
  full_address: string
  city: string
  coordinates: typeof MapEventInstanceModel.Type.coordinates
  longitude: number
  latitude: number
  events: typeof MapEventInstanceModel.Type[]
}
