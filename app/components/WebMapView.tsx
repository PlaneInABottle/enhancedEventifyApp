import React, { useCallback, useEffect, useRef } from "react"
import { View, ViewStyle } from "react-native"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// You'll need to set your Mapbox access token
mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

interface WebMapViewProps {
  style?: ViewStyle
  styleURL?: string
  scaleBarEnabled?: boolean
  onPress?: (event: any) => void
  onClick?: (event: any) => void
  children?: React.ReactNode
  initialCoordinates?: { longitude: number; latitude: number }
}

export const WebMapView: React.FC<WebMapViewProps> = ({
  style,
  styleURL = "mapbox://styles/mapbox/streets-v12",
  onPress,
  onClick,
  initialCoordinates = { longitude: 28.9784, latitude: 41.0082 },
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  // Memoize callbacks to avoid brittle dependencies
  const handlePress = useCallback((event: any) => {
    onPress?.(event)
  }, [onPress])
  
  const handleClick = useCallback((event: any) => {
    onClick?.(event)
  }, [onClick])

  useEffect(() => {
    if (!mapContainer.current) return

    if (!map.current) {
      // Create map only once with initial coordinates
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleURL.replace("mapbox://", "mapbox://"),
        center: [initialCoordinates.longitude, initialCoordinates.latitude],
        zoom: 12,
      })

      // Add marker to map with default Mapbox marker style
      marker.current = new mapboxgl.Marker({ color: "#EF4444" })
        .setLngLat([initialCoordinates.longitude, initialCoordinates.latitude])
        .addTo(map.current)

      // Add click handler - only move marker, not map center
      map.current.on("click", (e) => {
        const event = {
          lngLat: {
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
          },
        }

        // Update marker position only (don't move map center)
        if (marker.current) {
          marker.current.setLngLat([e.lngLat.lng, e.lngLat.lat])
        }

        handlePress(event)
        handleClick(event)
      })
    }

    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [styleURL]) // Only depend on styleURL

  return (
    <View style={[{ flex: 1, overflow: "hidden" }, style]}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </View>
  )
}