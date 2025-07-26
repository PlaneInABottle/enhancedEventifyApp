import { types, flow, Instance, SnapshotOut, SnapshotIn } from "mobx-state-tree"

import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { BusinessProfileModel } from "@/models/ProfileModels"
import { getBusinessProfile, updateBusinessProfile, uploadLogo } from "@/services/businessProfile/businessProfileService"
import type { UpdateBusinessProfileRequest, LogoUploadResult } from "@/services/businessProfile/businessProfileTypes"

/**
 * Business Profile Store
 *
 * Manages reactive business profile state using MobX-State-Tree
 * Based on UserProfileStore patterns
 */

// ============================================================================
// BUSINESS PROFILE STORE
// ============================================================================

export const BusinessProfileStore = types
  .model("BusinessProfileStore", {
    profile: types.maybeNull(BusinessProfileModel),
    isLoading: types.optional(types.boolean, false),
    isUpdating: types.optional(types.boolean, false),
    isUploading: types.optional(types.boolean, false),
    lastError: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get hasProfile() {
      return Boolean(self.profile)
    },
    get businessName() {
      return self.profile?.business_name ?? null
    },
    get businessTypes() {
      return self.profile?.business_types ?? []
    },
    get description() {
      return self.profile?.description ?? null
    },
    get phone() {
      return self.profile?.phone ?? null
    },
    get websiteUrl() {
      return self.profile?.website_url ?? null
    },
    get logoUrl() {
      return self.profile?.logo_url ?? null
    },
    get businessStatus() {
      return self.profile?.business_status ?? "pending"
    },
  }))
  .actions((self) => ({
    // ========================================================================
    // ASYNC FLOW ACTIONS
    // ========================================================================

    fetchProfile: flow(function* (businessId: string) {
      try {
        self.setProp("isLoading", true)
        self.setProp("lastError", null)
        
        const result = yield getBusinessProfile(businessId)
        
        if (result.success && result.profile) {
          self.setProp("profile", result.profile)
        } else {
          self.setProp("lastError", result.error || "errors:businessProfile.fetchFailed")
        }
      } catch (error) {
        self.setProp("lastError", "errors:businessProfile.fetchUnexpected")
      } finally {
        self.setProp("isLoading", false)
      }
    }),

    updateProfile: flow(function* (businessId: string, updates: UpdateBusinessProfileRequest) {
      try {
        self.setProp("isUpdating", true)
        self.setProp("lastError", null)
        
        const result = yield updateBusinessProfile(businessId, updates)
        
        if (result.success && result.profile) {
          self.setProp("profile", result.profile)
        } else {
          self.setProp("lastError", result.error || "errors:businessProfile.updateFailed")
        }
      } catch (error) {
        self.setProp("lastError", "errors:businessProfile.updateUnexpected")
      } finally {
        self.setProp("isUpdating", false)
      }
    }),

    uploadLogo: flow(function* (businessId: string, arrayBuffer: ArrayBuffer, mimeType: string) {
      try {
        self.setProp("isUploading", true)
        self.setProp("lastError", null)
        
        const result = yield uploadLogo(businessId, arrayBuffer, mimeType)
        
        if (result.success && result.logoUrl && self.profile) {
          self.setProp("profile", { ...self.profile, logo_url: result.logoUrl })
        } else {
          self.setProp("lastError", result.error || "errors:businessProfile.uploadFailed")
        }
      } catch (error) {
        self.setProp("lastError", "errors:businessProfile.uploadUnexpected")
      } finally {
        self.setProp("isUploading", false)
      }
    }),

    // Clear error state
    clearError() {
      self.setProp("lastError", null)
    },
  }))

export interface BusinessProfileStore extends Instance<typeof BusinessProfileStore> {}
export interface BusinessProfileStoreSnapshotOut extends SnapshotOut<typeof BusinessProfileStore> {}
export interface BusinessProfileStoreSnapshotIn extends SnapshotIn<typeof BusinessProfileStore> {}