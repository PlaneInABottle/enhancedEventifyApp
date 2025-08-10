import { supabase } from "@/clients/supabase/SupabaseClient"
import {
  validateRequired,
  validateStringLength,
  validatePhone,
  validateUrl,
  validateImageUpload,
} from "@/utils/validation"
import { uploadMedia, deleteMedia, getMediaForEntity } from "@/services/media/mediaService"

import type {
  BusinessProfile,
  UpdateBusinessProfileRequest,
  LogoUploadResult,
} from "./businessProfileTypes"

/**
 * Business Profile Service
 *
 * Handles business profile operations using Supabase
 */

export interface BusinessProfileResult {
  success: boolean
  profile?: BusinessProfile
  error?: string
}

/**
 * Fetches a business profile by ID
 */
export async function getBusinessProfile(businessId: string): Promise<BusinessProfileResult> {
  try {
    const { data, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", businessId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, profile: data as BusinessProfile }
  } catch (error) {
    return { success: false, error: "Unexpected error fetching business profile" }
  }
}

/**
 * Updates a business profile
 */
export async function updateBusinessProfile(
  businessId: string,
  updates: UpdateBusinessProfileRequest,
): Promise<BusinessProfileResult> {
  try {
    // Validate business name if provided
    if (updates.business_name !== undefined) {
      const validation = validateRequired(updates.business_name, "businessName")
      if (!validation.success) {
        return validation
      }
    }

    // Validate phone if provided
    if (updates.phone !== undefined) {
      const validation = validatePhone(updates.phone, false) // Phone is optional
      if (!validation.success) {
        return validation
      }
    }

    // Validate website URL if provided
    if (updates.website_url !== undefined) {
      const validation = validateUrl(updates.website_url, false) // Website is optional
      if (!validation.success) {
        return validation
      }
    }

    // Validate description length if provided
    if (updates.description !== undefined) {
      const validation = validateStringLength(updates.description, 0, 500, "description")
      if (!validation.success) {
        return validation
      }
    }

    const { data, error } = await supabase
      .from("business_profiles")
      .update(updates)
      .eq("id", businessId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, profile: data as BusinessProfile }
  } catch (error) {
    return { success: false, error: "Unexpected error updating business profile" }
  }
}

/**
 * Uploads a logo for business profile using the new media system
 */
export async function uploadLogo(
  businessId: string,
  arrayBuffer: ArrayBuffer,
  mimeType: string,
): Promise<LogoUploadResult> {
  try {
    // Validate the upload
    const validation = validateImageUpload(arrayBuffer, mimeType)
    if (!validation.success) {
      return validation
    }

    // Get current business profile to check for existing logo
    const currentProfile = await getBusinessProfile(businessId)

    // Remove old logo if it exists
    if (currentProfile.success && currentProfile.profile?.logo_url) {
      // Get existing media records for this business
      const existingMedia = await getMediaForEntity('business', businessId)
      if (existingMedia.success && existingMedia.media && existingMedia.media.length > 0) {
        // Delete all existing media records
        for (const media of existingMedia.media) {
          const deleteResult = await deleteMedia(media.id)
          if (!deleteResult.success) {
            console.warn('Failed to delete old logo:', deleteResult.error)
            // Continue with upload even if delete fails
          }
        }
      }
    }

    // Upload new logo using media system
    const uploadResult = await uploadMedia(
      'business',
      businessId, 
      arrayBuffer,
      mimeType,
      { alt_text: 'Business logo' }
    )

    if (!uploadResult.success || !uploadResult.media) {
      return {
        success: false,
        error: uploadResult.error || "Failed to upload logo"
      }
    }

    // Update business profile with new logo URL
    const updateResult = await updateBusinessProfile(businessId, {
      logo_url: uploadResult.media.file_url,
    })

    if (!updateResult.success) {
      // If profile update fails, clean up the uploaded file
      await deleteMedia(uploadResult.media.id)
      return {
        success: false,
        error: updateResult.error || "Failed to update profile with logo URL",
      }
    }

    return { success: true, logoUrl: uploadResult.media.file_url }
  } catch (error) {
    return { success: false, error: "Unexpected error uploading logo" }
  }
}
