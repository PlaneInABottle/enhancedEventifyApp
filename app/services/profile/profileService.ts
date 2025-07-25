import { supabase } from "@/clients/supabase/SupabaseClient"

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
 * Uploads a user avatar with proper Supabase Storage options
 */
export async function uploadAvatar(userId: string, arrayBuffer: ArrayBuffer, mimeType: string): Promise<AvatarUploadResult> {
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
    if (profileResult.success && profileResult.profile?.avatar_url) {
      // Extract file path from URL and delete old avatar
      const urlParts = profileResult.profile.avatar_url.split("/")
      const avatarsIndex = urlParts.findIndex((part) => part === "avatars")
      if (avatarsIndex !== -1 && avatarsIndex < urlParts.length - 1) {
        // Get everything after 'avatars/' in the URL
        const oldAvatarPath = urlParts.slice(avatarsIndex + 1).join("/")
        console.log("Deleting old avatar:", oldAvatarPath)
        await supabase.storage.from("avatars").remove([oldAvatarPath])
      }
    }

    // Extract file extension from mimeType
    let fileExt = 'jpg' // default
    if (mimeType === 'image/png') fileExt = 'png'
    else if (mimeType === 'image/gif') fileExt = 'gif'
    else if (mimeType === 'image/webp') fileExt = 'webp'
    else fileExt = 'jpg'
    
    const fileName = `avatar-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload to Supabase Storage with ArrayBuffer
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        upsert: true,
        contentType: mimeType,
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      // Handle specific Supabase Storage error formats
      const storageError = uploadError as SupabaseStorageError
      return {
        success: false,
        error:
          storageError.code === "EntityTooLarge" ? "errors:fileTooLarge" : "errors:uploadFailed",
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath)

    // Update profile with new avatar URL
    const updateResult = await updateUserProfile(userId, {
      avatar_url: publicUrl,
    })

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
      }
    }

    return {
      success: true,
      avatarUrl: publicUrl,
    }
  } catch (error) {
    console.error("Unexpected error uploading avatar:", error)
    return {
      success: false,
      error: "errors:unknownError",
    }
  }
}
