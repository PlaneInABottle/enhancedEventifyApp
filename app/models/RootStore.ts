import { Instance, SnapshotOut, types } from "mobx-state-tree"

import { AuthStore } from "@/stores/AuthStore"
import { BusinessProfileStore } from "@/stores/BusinessProfileStore"
import { UserProfileStore } from "@/stores/UserProfileStore"

import { EpisodeStoreModel } from "./EpisodeStore" // @demo remove-current-line

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthStore, {}),
  userProfileStore: types.optional(UserProfileStore, {}),
  businessProfileStore: types.optional(BusinessProfileStore, {}),
  episodeStore: types.optional(EpisodeStoreModel, {}), // @demo remove-current-line
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}

// @mst remove-file
