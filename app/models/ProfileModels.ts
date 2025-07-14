import { types } from "mobx-state-tree"

/**
 * Shared Profile Models
 * 
 * Common MobX-State-Tree models used across AuthStore and ProfileStore
 */

// ============================================================================
// USER PROFILE MODEL
// ============================================================================

export const UserProfileModel = types.model("UserProfile", {
  id: types.string,
  display_name: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  bio: types.maybeNull(types.string),
  location_city: types.maybeNull(types.string),
  is_profile_complete: types.maybeNull(types.boolean),
  created_at: types.string,
  updated_at: types.string,
})

// ============================================================================
// BUSINESS PROFILE MODEL
// ============================================================================

export const BusinessProfileModel = types.model("BusinessProfile", {
  id: types.string,
  business_name: types.string,
  business_types: types.array(types.string),
  description: types.maybeNull(types.string),
  phone: types.maybeNull(types.string),
  website_url: types.maybeNull(types.string),
  logo_url: types.maybeNull(types.string),
  business_status: types.enumeration("BusinessStatus", ["pending", "verified", "suspended"]),
  is_profile_complete: types.maybeNull(types.boolean),
  created_at: types.string,
  updated_at: types.string,
})