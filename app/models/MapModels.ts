import { types } from "mobx-state-tree"

/**
 * Map Models for Geographic Event Display
 */

// Basic coordinates model for GeoJSON Point with validation
export const CoordinatesModel = types.model("Coordinates", {
  type: types.literal("Point"),
  coordinates: types.refinement(types.array(types.number), (coordinates) => {
    // Validate coordinates exist and are array
    if (!coordinates || !Array.isArray(coordinates)) {
      return false
    }

    // Validate array length
    if (coordinates.length !== 2) {
      return false
    }

    const [longitude, latitude] = coordinates

    // Validate both values are numbers
    if (typeof longitude !== "number" || typeof latitude !== "number") {
      return false
    }

    // Validate longitude range (-180 to 180)
    if (longitude < -180 || longitude > 180) {
      return false
    }

    // Validate latitude range (-90 to 90)
    if (latitude < -90 || latitude > 90) {
      return false
    }

    return true
  }), // [longitude, latitude]
})

// Basic MapEventInstance model matching Supabase function output
export const MapEventInstanceModel = types
  .model("MapEventInstance", {
    instance_id: types.string,
    event_id: types.string,
    venue_id: types.string,
    start_datetime: types.string,
    end_datetime: types.string,

    max_attendees: types.maybeNull(types.number),
    event_title: types.string,
    event_description: types.maybeNull(types.string),
    event_image_url: types.maybeNull(types.string),
    venue_name: types.string,
    venue_capacity: types.maybeNull(types.number),
    coordinates: CoordinatesModel,
    full_address: types.string,
    city: types.string,
  })
  .views((self) => ({
    get longitude() {
      return self.coordinates.coordinates[0]
    },

    get latitude() {
      return self.coordinates.coordinates[1]
    },

    get formattedStartTime() {
      return new Date(self.start_datetime).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    },
  }))
