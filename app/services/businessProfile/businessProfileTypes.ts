/**
 * Business Profile Types for Enhanced Eventify
 *
 * Based on the business_profiles database schema
 */

// ============================================================================
// BUSINESS PROFILE DATA TYPES
// ============================================================================

export type BusinessType = "restaurant" | "bar" | "cafe" | "event_organizer" | "other"

export interface BusinessProfile {
  id: string
  business_name: string
  business_types: BusinessType[]
  description: string | null
  phone: string | null
  website_url: string | null
  logo_url: string | null
  business_status: "pending" | "verified" | "suspended"
  created_at: string
  updated_at: string
}

// ============================================================================
// UPDATE REQUEST TYPES
// ============================================================================

export interface UpdateBusinessProfileRequest {
  business_name?: string
  business_types?: BusinessType[]
  description?: string
  phone?: string
  website_url?: string
  logo_url?: string
}

// ============================================================================
// LOGO UPLOAD TYPES
// ============================================================================

export interface LogoUploadResult {
  success: boolean
  logoUrl?: string
  error?: string
}
