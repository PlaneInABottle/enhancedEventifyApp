import { supabase } from "@/clients/supabase/SupabaseClient"
import type { BusinessProfile, UpdateBusinessProfileRequest } from "./businessProfileTypes"

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