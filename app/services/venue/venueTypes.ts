/**
 * Venue Types for Enhanced Eventify
 *
 * Based on the venues database schema
 */

import type { TurkishCity } from "@/services/profile/profileTypes"

// ============================================================================
// ADDRESS DATA TYPES
// ============================================================================

export interface Address {
  id: string
  full_address: string | null
  city: TurkishCity | null
  country: string | null
  postal_code: string | null
  coordinates: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  } | null
  created_at: string
  updated_at: string
}

// ============================================================================
// VENUE DATA TYPES
// ============================================================================

export interface Venue {
  id: string
  business_id: string
  address_id: string
  name: string
  description: string | null
  capacity: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined address data (optional for detailed views)
  address?: Address
}

// ============================================================================
// CREATE REQUEST TYPES
// ============================================================================

export interface CreateAddressRequest {
  full_address?: string | null
  city?: TurkishCity
  country?: string
  postal_code?: string | null
  coordinates?: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
}

export interface CreateVenueRequest {
  name: string
  description?: string | null
  capacity?: number | null
  address: CreateAddressRequest
}

// ============================================================================
// UPDATE REQUEST TYPES
// ============================================================================

export interface UpdateAddressRequest {
  full_address?: string | null
  city?: TurkishCity
  country?: string
  postal_code?: string | null
  coordinates?: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
}

export interface UpdateVenueRequest {
  name?: string
  description?: string | null
  capacity?: number | null
  is_active?: boolean
  address?: UpdateAddressRequest
}

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export interface VenueServiceResult {
  success: boolean
  venue?: Venue
  error?: string
}

export interface VenueListResult {
  success: boolean
  venues?: Venue[]
  error?: string
}

// TODO: Add validation types next
// BREADCRUMB: Added VenueListResult interface
