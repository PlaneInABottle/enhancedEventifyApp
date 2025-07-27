import { types } from "mobx-state-tree"

/**
 * Map Models for Geographic Event Display
 */

// Basic coordinates model for GeoJSON Point
export const CoordinatesModel = types.model("Coordinates", {
  type: types.literal("Point"),
  coordinates: types.array(types.number), // [longitude, latitude]
})

// Basic MapEventInstance model matching Supabase function output
export const MapEventInstanceModel = types.model("MapEventInstance", {
  instance_id: types.string,
  event_id: types.string,
  venue_id: types.string,
  start_datetime: types.string,
  end_datetime: types.string,
  event_instance_status: types.string,
  max_attendees: types.maybeNull(types.number),
  event_title: types.string,
  event_description: types.maybeNull(types.string),
  venue_name: types.string,
  venue_capacity: types.maybeNull(types.number),
  coordinates: CoordinatesModel,
  full_address: types.string,
  city: types.string,
}).views((self) => ({
  get longitude() {
    return self.coordinates.coordinates[0]
  },
  
  get latitude() {
    return self.coordinates.coordinates[1]
  },
  
  get formattedStartTime() {
    return new Date(self.start_datetime).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
}))