import { types, Instance, SnapshotOut, SnapshotIn } from "mobx-state-tree"

/**
 * Venue Models for MobX State Tree
 *
 * Based on venue and address database schemas
 */

// ============================================================================
// COORDINATES MODEL
// ============================================================================

export const CoordinatesModel = types.model("Coordinates", {
  type: types.literal("Point"),
  coordinates: types.array(types.number), // [longitude, latitude]
})

// ============================================================================
// ADDRESS MODEL
// ============================================================================

export const AddressModel = types
  .model("Address", {
    id: types.string,
    full_address: types.maybeNull(types.string),
    city: types.maybeNull(types.string), // TurkishCity type from service
    country: types.maybeNull(types.string),
    postal_code: types.maybeNull(types.string),
    coordinates: types.maybeNull(CoordinatesModel),
    created_at: types.string,
    updated_at: types.string,
  })
  .views((self) => ({
    get longitude() {
      return self.coordinates?.coordinates[0] ?? null
    },

    get latitude() {
      return self.coordinates?.coordinates[1] ?? null
    },

    get formattedAddress() {
      if (!self.full_address && !self.city) return null
      return [self.full_address, self.city, self.country].filter(Boolean).join(", ")
    },
  }))

// ============================================================================
// VENUE MODEL
// ============================================================================

export const VenueModel = types
  .model("Venue", {
    id: types.string,
    business_id: types.string,
    address_id: types.string,
    name: types.string,
    description: types.maybeNull(types.string),
    capacity: types.maybeNull(types.number),
    is_active: types.boolean,
    created_at: types.string,
    updated_at: types.string,
    address: types.maybeNull(AddressModel), // Joined address data
  })
  .views((self) => ({
    get hasAddress() {
      return Boolean(self.address)
    },

    get fullLocation() {
      return self.address?.formattedAddress ?? null
    },

    get coordinates() {
      return self.address?.coordinates ?? null
    },

    get isActive() {
      return self.is_active
    },
  }))

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export interface ICoordinates extends Instance<typeof CoordinatesModel> {}
export interface IAddress extends Instance<typeof AddressModel> {}
export interface IVenue extends Instance<typeof VenueModel> {}

export interface CoordinatesSnapshotOut extends SnapshotOut<typeof CoordinatesModel> {}
export interface AddressSnapshotOut extends SnapshotOut<typeof AddressModel> {}
export interface VenueSnapshotOut extends SnapshotOut<typeof VenueModel> {}

export interface CoordinatesSnapshotIn extends SnapshotIn<typeof CoordinatesModel> {}
export interface AddressSnapshotIn extends SnapshotIn<typeof AddressModel> {}
export interface VenueSnapshotIn extends SnapshotIn<typeof VenueModel> {}

// TODO: Create VenueStore next
// BREADCRUMB: Added TypeScript interface exports for all models
