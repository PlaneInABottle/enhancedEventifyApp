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
  }))
  .actions((self) => ({
    clearError() {
      self.setProp("lastError", null)
    },

    setEvents(events: typeof MapEventInstanceModel.Type[]) {
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
          self.setProp("lastError", result.error || "Failed to load events")
        }

        return result
      } catch (error) {
        console.error("Error in loadEventsInBounds:", error)
        self.setProp("lastError", "Unexpected error occurred")
        return { success: false, error: "Unexpected error occurred" }
      } finally {
        self.setProp("isLoading", false)
      }
    }),
  }))