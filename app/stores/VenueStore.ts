import { types, flow, Instance, SnapshotOut, SnapshotIn } from "mobx-state-tree"

import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { VenueModel, VenueSnapshotIn } from "@/models/VenueModels"
import {
  getVenueById,
  getVenuesByBusiness,
  createVenue,
  updateVenue,
  deleteVenue,
} from "@/services/venue/venueService"
import type { CreateVenueRequest, UpdateVenueRequest } from "@/services/venue/venueTypes"

/**
 * Venue Store
 *
 * Manages reactive venue state using MobX-State-Tree
 * Based on BusinessProfileStore patterns
 */

// ============================================================================
// VENUE STORE
// ============================================================================

export const VenueStore = types
  .model("VenueStore", {
    venues: types.array(VenueModel),
    isLoading: types.optional(types.boolean, false),
    lastError: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get venueCount() {
      return self.venues.length
    },

    get activeVenues() {
      return self.venues.filter((venue) => venue.isActive)
    },

    get activeVenueCount() {
      return self.venues.filter((venue) => venue.isActive).length
    },

    get hasVenues() {
      return self.venues.length > 0
    },

    get hasActiveVenues() {
      return self.venues.filter((venue) => venue.isActive).length > 0
    },

    // Following AuthStore:89-91 pattern for parameterized views
    getVenueById(id: string) {
      return self.venues.find((venue) => venue.id === id) ?? null
    },
  }))
  .actions((self) => ({
    // ========================================================================
    // UTILITY ACTIONS
    // ========================================================================

    clearError() {
      self.setProp("lastError", null)
    },

    setVenues(venues: VenueSnapshotIn[]) {
      self.setProp("venues", venues)
    },

    addVenue(venue: VenueSnapshotIn) {
      self.venues.push(venue)
    },

    updateVenueInStore(venueId: string, updatedVenue: VenueSnapshotIn) {
      const index = self.venues.findIndex((v) => v.id === venueId)
      if (index !== -1) {
        // Use splice to replace the item properly in MST
        self.venues.splice(index, 1, updatedVenue)
      }
    },

    removeVenueFromStore(venueId: string) {
      const index = self.venues.findIndex((v) => v.id === venueId)
      if (index !== -1) {
        self.venues.splice(index, 1)
      }
    },
  }))
  .actions((self) => ({
    // ========================================================================
    // ASYNC FLOW ACTIONS
    // ========================================================================

    fetchVenuesByBusiness: flow(function* (businessId: string) {
      self.setProp("isLoading", true)
      self.clearError()

      try {
        const result = yield getVenuesByBusiness(businessId)

        if (result.success && result.venues) {
          self.setVenues(result.venues)
        } else {
          self.setProp("lastError", result.error || "errors.fetchVenuesFailed")
        }
      } catch (error) {
        self.setProp("lastError", "errors.fetchVenuesFailed")
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    createVenue: flow(function* (businessId: string, venueData: CreateVenueRequest) {
      self.clearError()

      try {
        const result = yield createVenue(businessId, venueData)

        if (result.success && result.venue) {
          self.addVenue(result.venue)
          return result.venue
        } else {
          self.setProp("lastError", result.error || "errors.createVenueFailed")
          return null
        }
      } catch (error) {
        self.setProp("lastError", "errors.createVenueFailed")
        return null
      }
    }),

    updateVenue: flow(function* (venueId: string, updates: UpdateVenueRequest) {
      self.clearError()

      try {
        const result = yield updateVenue(venueId, updates)

        if (result.success && result.venue) {
          self.updateVenueInStore(venueId, result.venue)
          return result.venue
        } else {
          self.setProp("lastError", result.error || "errors.updateVenueFailed")
          return null
        }
      } catch (error) {
        self.setProp("lastError", "errors.updateVenueFailed")
        return null
      }
    }),

    deleteVenue: flow(function* (venueId: string) {
      self.clearError()

      try {
        const result = yield deleteVenue(venueId)

        if (result.success && result.venue) {
          // Update the venue in the store to reflect its new is_active: false state
          self.updateVenueInStore(venueId, result.venue)
          return true
        } else {
          self.setProp("lastError", result.error || "errors.deleteVenueFailed")
          return false
        }
      } catch (error) {
        self.setProp("lastError", "errors.deleteVenueFailed")
        return false
      }
    }),

    // BREADCRUMB: Completed all CRUD actions for VenueStore
  }))

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export interface VenueStore extends Instance<typeof VenueStore> {}
export interface VenueStoreSnapshotOut extends SnapshotOut<typeof VenueStore> {}
export interface VenueStoreSnapshotIn extends SnapshotIn<typeof VenueStore> {}
