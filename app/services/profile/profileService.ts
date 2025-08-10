import { supabase } from "@/clients/supabase/SupabaseClient"
import { uploadMedia, deleteMedia, getMediaForEntity } from "@/services/media/mediaService"

import {
  mapProfileError,
  validateDisplayName,
  validateBio,
  formatDisplayName,
} from "./profileHelpers"
import type {
  UserProfile,
  ProfileResult,
  UpdateProfileRequest,
  AvatarUploadResult,
  StorageUploadOptions,
  SupabaseStorageError,
} from "./profileTypes"

/**
 * Profile Service
 *
 * Handles user profile operations using Supabase
 */

// ============================================================================
// PROFILE FETCH FUNCTIONALITY
// ============================================================================

/**
 * Fetches a user profile by ID
 */
export async function getUserProfile(userId: string): Promise<ProfileResult> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      const customError = mapProfileError(error)
      return {
        success: false,
        error: customError.message,
      }
    }

    return {
      success: true,
      profile: data as UserProfile,
    }
  } catch (error) {
    console.error("Unexpected error fetching profile:", error)
    return {
      success: false,
      error: "errors:unknownError",
    }
  }
}

// ============================================================================
// PROFILE UPDATE FUNCTIONALITY
// ============================================================================

/**
 * Updates a user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileRequest,
): Promise<ProfileResult> {
  try {
    // Validate display name if provided
    if (updates.display_name !== undefined) {
      const validation = validateDisplayName(updates.display_name)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        }
      }
      updates.display_name = formatDisplayName(updates.display_name)
    }

    // Validate bio if provided
    if (updates.bio !== undefined) {
      const validation = validateBio(updates.bio)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        }
      }
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      const customError = mapProfileError(error)
      return {
        success: false,
        error: customError.message,
      }
    }

    return {
      success: true,
      profile: data as UserProfile,
    }
  } catch (error) {
    console.error("Unexpected error updating profile:", error)
    return {
      success: false,
      error: "errors:unknownError",
    }
  }
}

// ============================================================================
// AVATAR FUNCTIONALITY
// ============================================================================

/**
 * Uploads a user avatar using the new media system
 */
export async function uploadAvatar(
  userId: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string,
): Promise<AvatarUploadResult> {
  try {
    // Validate inputs
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return {
        success: false,
        error: "errors:invalidFile",
      }
    }

    if (!mimeType.startsWith("image/")) {
      return {
        success: false,
        error: "errors:invalidFileType",
      }
    }

    // Validate file size (5MB limit)
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "errors:fileTooLarge",
      }
    }

    // Get current profile to check for existing avatar
    const profileResult = await getUserProfile(userId)

    // Remove old avatar if it exists
    if (profileResult.success && profileResult.profile?.avatar_url) {
      // Get existing media records for this user
      const existingMedia = await getMediaForEntity('user', userId)
      if (existingMedia.success && existingMedia.media && existingMedia.media.length > 0) {
        // Delete all existing media records
        for (const media of existingMedia.media) {
          const deleteResult = await deleteMedia(media.id)
          if (!deleteResult.success) {
            console.warn('Failed to delete old avatar:', deleteResult.error)
            // Continue with upload even if delete fails
          }
        }
      }
    }

    // Upload new avatar using media system
    const uploadResult = await uploadMedia(
      'user',
      userId, 
      arrayBuffer,
      mimeType,
      { alt_text: 'User avatar' }
    )

    if (!uploadResult.success || !uploadResult.media) {
      return {
        success: false,
        error: uploadResult.error || "errors:uploadFailed"
      }
    }

    // Update profile with new avatar URL
    const updateResult = await updateUserProfile(userId, {
      avatar_url: uploadResult.media.file_url,
    })

    if (!updateResult.success) {
      // If profile update fails, clean up the uploaded file
      await deleteMedia(uploadResult.media.id)
      return {
        success: false,
        error: updateResult.error || "Failed to update profile with avatar URL",
      }
    }

    return {
      success: true,
      avatarUrl: uploadResult.media.file_url,
    }
  } catch (error) {
    console.error("Unexpected error uploading avatar:", error)
    return {
      success: false,
      error: "errors:unknownError",
    }
  }
}
