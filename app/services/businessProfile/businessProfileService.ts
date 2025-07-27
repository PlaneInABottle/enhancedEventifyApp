import { supabase } from "@/clients/supabase/SupabaseClient"
import {
  validateRequired,
  validateStringLength,
  validatePhone,
  validateUrl,
  validateImageUpload,
} from "@/utils/validation"

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
 * Uploads a logo for business profile
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
      const oldLogoPath = currentProfile.profile.logo_url.split("/").pop()
      if (oldLogoPath) {
        await supabase.storage.from("avatars").remove([`${businessId}/${oldLogoPath}`])
      }
    }

    const fileExtension = mimeType.split("/")[1]
    const fileName = `${businessId}/business-logo-${Date.now()}.${fileExtension}`

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(data.path)

    // Update business profile with new logo URL
    const updateResult = await updateBusinessProfile(businessId, {
      logo_url: publicUrl,
    })

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || "Failed to update profile with logo URL",
      }
    }

    return { success: true, logoUrl: publicUrl }
  } catch (error) {
    return { success: false, error: "Unexpected error uploading logo" }
  }
}
