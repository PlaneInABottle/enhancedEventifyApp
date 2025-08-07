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
      return { success: false, error: "errors:fetchVenueFailed" }
    }

    return { success: true, venue: data as Venue }
  } catch (error) {
    return { success: false, error: "errors:fetchVenueFailed" }
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
      return { success: false, error: "errors:fetchVenueFailed" }
    }

    return { success: true, venues: data as Venue[] }
  } catch (error) {
    return { success: false, error: "errors:fetchVenueFailed" }
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
    // Create address directly with Point format
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        full_address: venueData.address.full_address || null,
        city: venueData.address.city || null,
        postal_code: venueData.address.postal_code || null,
        country: venueData.address.country || 'Turkey',
        coordinates: venueData.address.coordinates 
          ? `Point(${venueData.address.coordinates.coordinates[0]} ${venueData.address.coordinates.coordinates[1]})`
          : null,
      })
      .select()
      .single()

    if (addressError || !address) {
      return { success: false, error: "errors:createAddressFailed" }
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
      return { success: false, error: "errors:createVenueFailed" }
    }

    return { success: true, venue: venue as Venue }
  } catch (error) {
    return { success: false, error: "errors:createVenueFailed" }
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
    // Update address if provided
    if (updates.address) {
      const { data: venue } = await supabase
        .from("venues")
        .select("address_id")
        .eq("id", venueId)
        .single()

      if (venue?.address_id) {
        // Update address fields including coordinates in single operation
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            full_address: updates.address.full_address || null,
            city: updates.address.city || null,
            postal_code: updates.address.postal_code || null,
            country: updates.address.country || null,
            coordinates: updates.address.coordinates 
              ? `Point(${updates.address.coordinates.coordinates[0]} ${updates.address.coordinates.coordinates[1]})`
              : null,
          })
          .eq("id", venue.address_id)

        if (addressError) {
          console.error('Address update error:', addressError)
          return { success: false, error: "errors:createAddressFailed" }
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
      return { success: false, error: "errors:updateVenueFailed" }
    }

    // Manual response construction to ensure coordinate format consistency
    if (updates.address?.coordinates && venue) {
      venue.address = {
        ...venue.address,
        coordinates: updates.address.coordinates
      }
    }

    return { success: true, venue: venue as Venue }
  } catch (error) {
    return { success: false, error: "errors:updateVenueFailed" }
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
      return { success: false, error: "errors:deleteVenueFailed" }
    }

    return { success: true, venue: venue as Venue }

    // TODO: Add service index export file next
    // BREADCRUMB: Completed deleteVenue function with error handling and return
  } catch (error) {
    return { success: false, error: "errors:deleteVenueFailed" }
  }
}

// TODO: Add service index export file next
// BREADCRUMB: Added basic deleteVenue function structure
