import { types, flow, Instance } from "mobx-state-tree"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserProfileModel } from "@/models/ProfileModels"
import { getUserProfile, updateUserProfile, uploadAvatar } from "@/services/profile/profileService"
import type { UpdateProfileRequest, AvatarUploadResult } from "@/services/profile/profileTypes"

/**
 * User Profile Store
 * 
 * Manages reactive user profile state using MobX-State-Tree
 * Based on AuthStore patterns
 */

// ============================================================================
// USER PROFILE STORE
// ============================================================================

export const UserProfileStore = types
  .model("UserProfileStore", {
    profile: types.maybeNull(UserProfileModel),
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
    get displayName() {
      return self.profile?.display_name ?? null
    },
    get avatarUrl() {
      return self.profile?.avatar_url ?? null
    },
    get bio() {
      return self.profile?.bio ?? null
    },
    get locationCity() {
      return self.profile?.location_city ?? null
    },
    
  }))
  .actions((self) => ({
    // ========================================================================
    // BASIC ACTIONS
    // ========================================================================

    setProfile(profile: Instance<typeof UserProfileModel> | null) {
      self.profile = profile
    },

    setLoading(loading: boolean) {
      self.isLoading = loading
    },

    setUpdating(updating: boolean) {
      self.isUpdating = updating
    },

    setUploading(uploading: boolean) {
      self.isUploading = uploading
    },

    setError(error: string | null) {
      self.lastError = error
    },

    clearError() {
      self.lastError = null
    },

    // ========================================================================
    // ASYNC FLOW ACTIONS
    // ========================================================================

    fetchProfile: flow(function* (userId: string) {
      try {
        self.isLoading = true
        self.lastError = null

        const result = yield getUserProfile(userId)
        
        if (result.success) {
          self.profile = result.profile
        } else {
          self.lastError = result.error || 'errors:fetchProfileFailed'
        }
        
        return result
      } catch (error) {
        console.error('Error fetching profile:', error)
        self.lastError = 'errors:unknownError'
        return { success: false, error: 'errors:unknownError' }
      } finally {
        self.isLoading = false
      }
    }),

    updateProfile: flow(function* (userId: string, updates: UpdateProfileRequest) {
      try {
        self.isUpdating = true
        self.lastError = null

        const result = yield updateUserProfile(userId, updates)
        
        if (result.success && result.profile) {
          self.profile = result.profile
        } else {
          self.lastError = result.error || 'errors:updateProfileFailed'
        }
        
        return result
      } catch (error) {
        console.error('Error updating profile:', error)
        self.lastError = 'errors:unknownError'
        return { success: false, error: 'errors:unknownError' }
      } finally {
        self.isUpdating = false
      }
    }),

    uploadAvatar: flow(function* (userId: string, file: File) {
      try {
        self.isUploading = true
        self.lastError = null

        const result: AvatarUploadResult = yield uploadAvatar(userId, file)
        
        if (result.success && result.avatarUrl && self.profile) {
          // Update the profile's avatar_url
          self.profile = { ...self.profile, avatar_url: result.avatarUrl }
        } else {
          self.lastError = result.error || 'errors:uploadAvatarFailed'
        }
        
        return result
      } catch (error) {
        console.error('Error uploading avatar:', error)
        self.lastError = 'errors:unknownError'
        return { success: false, error: 'errors:unknownError' }
      } finally {
        self.isUploading = false
      }
    }),
  }))