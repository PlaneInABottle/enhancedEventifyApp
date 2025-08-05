import { supabase } from "@/clients/supabase/SupabaseClient"

import type {
  Venue,
  Address,
  CreateVenueRequest,
  UpdateVenueRequest,
  VenueServiceResult,
  VenueListResult,
} from "./venueTypes"

/**
 * Venue Service
 *
 * Handles venue and address operations using Supabase
 */

/**
 * Fetches a venue by ID with joined address data
 */
export async function getVenueById(venueId: string): Promise<VenueServiceResult> {
  try {
    const { data, error } = await supabase
      .from("venues")
      .select(
        `
        *,
        address:addresses(*)
      `,
      )
      .eq("id", venueId)
      .single()

    if (error) {
      return { success: false, error: "errors.fetchVenueFailed" }
    }

    return { success: true, venue: data as Venue }
  } catch (error) {
    return { success: false, error: "errors.fetchVenueFailed" }
  }
}

/**
 * Fetches all venues for a business with joined address data
 */
export async function getVenuesByBusiness(businessId: string): Promise<VenueListResult> {
  try {
    const { data, error } = await supabase.rpc("get_venues_by_business", {
      business_id_param: businessId,
    })

    if (error) {
      return { success: false, error: "errors.fetchVenueFailed" }
    }

    return { success: true, venues: data as Venue[] }
  } catch (error) {
    return { success: false, error: "errors.fetchVenueFailed" }
  }
}

/**
 * Creates a new venue with address
 */
export async function createVenue(
  businessId: string,
  venueData: CreateVenueRequest,
): Promise<VenueServiceResult> {
  try {
    // First create the address
    const addressData = {
      ...venueData.address,
      coordinates: venueData.address.coordinates || null,
    }

    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert(addressData)
      .select()
      .single()

    if (addressError) {
      return { success: false, error: "errors.createAddressFailed" }
    }

    // Then create the venue
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .insert({
        business_id: businessId,
        address_id: address.id,
        name: venueData.name,
        description: venueData.description || null,
        capacity: venueData.capacity || null,
      })
      .select(
        `
        *,
        address:addresses(*)
      `,
      )
      .single()

    if (venueError) {
      return { success: false, error: "errors.createVenueFailed" }
    }

    return { success: true, venue: venue as Venue }
  } catch (error) {
    return { success: false, error: "errors.createVenueFailed" }
  }
}

/**
 * Updates an existing venue and optionally its address
 */
export async function updateVenue(
  venueId: string,
  updates: UpdateVenueRequest,
): Promise<VenueServiceResult> {
  try {
    // First get venue to find address_id if address update needed
    if (updates.address) {
      const { data: venue } = await supabase
        .from("venues")
        .select("address_id")
        .eq("id", venueId)
        .single()

      if (venue?.address_id) {
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            ...updates.address,
            coordinates: updates.address.coordinates || null,
          })
          .eq("id", venue.address_id)

        if (addressError) {
          return { success: false, error: "errors.createAddressFailed" }
        }
      }
    }

    // Update venue fields
    const venueUpdates = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.capacity !== undefined && { capacity: updates.capacity }),
      ...(updates.is_active !== undefined && { is_active: updates.is_active }),
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .update(venueUpdates)
      .eq("id", venueId)
      .select(
        `
        *,
        address:addresses(*)
      `,
      )
      .single()

    if (venueError) {
      return { success: false, error: "errors.updateVenueFailed" }
    }

    return { success: true, venue: venue as Venue }
  } catch (error) {
    return { success: false, error: "errors.updateVenueFailed" }
  }
}

/**
 * Soft deletes a venue (sets is_active to false)
 */
export async function deleteVenue(venueId: string): Promise<VenueServiceResult> {
  try {
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .update({ is_active: false })
      .eq("id", venueId)
      .select(
        `
        *,
        address:addresses(*)
      `,
      )
      .single()

    if (venueError) {
      return { success: false, error: "errors.deleteVenueFailed" }
    }

    return { success: true, venue: venue as Venue }

    // TODO: Add service index export file next
    // BREADCRUMB: Completed deleteVenue function with error handling and return
  } catch (error) {
    return { success: false, error: "errors.deleteVenueFailed" }
  }
}

// TODO: Add service index export file next
// BREADCRUMB: Added basic deleteVenue function structure
