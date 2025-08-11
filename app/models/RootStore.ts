import { Instance, SnapshotOut, types, applySnapshot } from "mobx-state-tree"

import { AuthStore } from "@/stores/AuthStore"
import { BusinessProfileStore } from "@/stores/BusinessProfileStore"
import { MapStore } from "@/stores/MapStore"
import { UserProfileStore } from "@/stores/UserProfileStore"
import { VenueStore } from "@/stores/VenueStore"
import { BusinessEventStore } from "./BusinessEventModels"

import { EpisodeStoreModel } from "./EpisodeStore" // @demo remove-current-line

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthStore, {}),
  userProfileStore: types.optional(UserProfileStore, {}),
  mapStore: types.optional(MapStore, {}),
  businessProfileStore: types.optional(BusinessProfileStore, {}),
  venueStore: types.optional(VenueStore, {}),
  businessEventStore: types.optional(BusinessEventStore, {}),
  episodeStore: types.optional(EpisodeStoreModel, {}), // @demo remove-current-line
}).actions((self) => ({
  /**
   * Resets all stores to their initial state using MobX State Tree's applySnapshot
   * Called when user logs out to prevent stale data and stuck loading states
   * This approach maintains store instance references while clearing data
   */
  resetAllStores() {
    // Reset stores to initial empty state using applySnapshot
    // This maintains store references while clearing all data
    applySnapshot(self.userProfileStore, {})
    applySnapshot(self.businessProfileStore, {})
    applySnapshot(self.mapStore, {})
    applySnapshot(self.venueStore, {})
    applySnapshot(self.businessEventStore, {})
  }
}))

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}

// @mst remove-file
