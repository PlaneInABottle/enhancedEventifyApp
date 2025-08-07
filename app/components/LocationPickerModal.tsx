import React, { FC, useState, useCallback, useEffect } from "react"
import { View, ViewStyle, TextStyle, Modal, Pressable, Platform } from "react-native"
import { MapView } from "@rnmapbox/maps"
import { WebMapView } from "./WebMapView"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// Default coordinates (Istanbul center)
const defaultCoordinates = {
  latitude: 41.0082,
  longitude: 28.9784,
}

interface LocationPickerModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean
  /**
   * Callback when modal should be closed
   */
  onClose: () => void
  /**
   * Callback when location should be saved
   */
  onSave: (coordinates: { latitude: number; longitude: number }) => void
  /**
   * Initial coordinates to center the map
   */
  initialCoordinates?: { latitude: number; longitude: number }
}

interface Coordinates {
  latitude: number
  longitude: number
}

export const LocationPickerModal: FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialCoordinates,
}) => {
  const { themed } = useAppTheme()

  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates>(
    initialCoordinates || defaultCoordinates,
  )

  // Sync state when modal opens or initialCoordinates change
  useEffect(() => {
    if (visible) {
      setSelectedCoordinates(initialCoordinates || defaultCoordinates)
    }
  }, [visible, initialCoordinates])

  const handleSave = useCallback(() => {
    onSave(selectedCoordinates)
    onClose()
  }, [selectedCoordinates, onSave, onClose])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  const handleMarkerDrag = useCallback((coordinates: [number, number]) => {
    setSelectedCoordinates({
      longitude: coordinates[0],
      latitude: coordinates[1],
    })
  }, [])

  const onMarkerPositionUpdate = useCallback(
    (feature: any) => {
      if (feature.geometry?.coordinates) {
        const coordinates = feature.geometry.coordinates as [number, number]
        handleMarkerDrag(coordinates)
      }
    },
    [handleMarkerDrag],
  )

  // Handle map click for web
  const handleMapClick = useCallback((event: any) => {
    // The mapbox web implementation should provide coordinates
    if (event?.lngLat) {
      setSelectedCoordinates({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
      })
    } else if (event?.coordinate) {
      // Alternative format
      setSelectedCoordinates({
        longitude: event.coordinate[0],
        latitude: event.coordinate[1],
      })
    }
  }, [])

  // For native, we'll render PointAnnotation inside the MapView
  const renderNativeMarker = useCallback(() => {
    const PointAnnotationComponent = require("@rnmapbox/maps").PointAnnotation
    return (
      <PointAnnotationComponent
        id="location-marker"
        coordinate={[selectedCoordinates.longitude, selectedCoordinates.latitude]}
        draggable
        onDrag={onMarkerPositionUpdate}
        onDragEnd={onMarkerPositionUpdate}
      >
        <View style={themed($marker)} />
      </PointAnnotationComponent>
    )
  }, [selectedCoordinates, onMarkerPositionUpdate, themed])

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "ios" ? "slide" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <Pressable style={themed($modalOverlay)} onPress={onClose} testID="modal-overlay">
        <Pressable
          style={themed($modalContent)}
          onPress={(e) => e?.stopPropagation?.()}
          testID="modal-content"
        >
          {/* Header */}
          <View style={themed($header)}>
            <Text preset="heading" tx="locationPicker:title" style={themed($headerTitle)} />
          </View>

          {/* Map View */}
          <View style={themed($mapContainer)}>
            {Platform.OS === 'web' ? (
              <WebMapView
                style={themed($map)}
                styleURL="mapbox://styles/mapbox/streets-v12"
                scaleBarEnabled={false}
                onPress={handleMapClick}
                onClick={handleMapClick}
                initialCoordinates={selectedCoordinates}
              />
            ) : (
              <MapView
                style={themed($map)}
                styleURL="mapbox://styles/mapbox/streets-v12"
                scaleBarEnabled={false}
                onPress={handleMapClick}
              >
                {renderNativeMarker()}
              </MapView>
            )}
          </View>

          {/* Coordinates Display */}
          <View style={themed($coordinatesContainer)}>
            <Text
              tx="locationPicker:selectedLocation"
              txOptions={{
                latitude: selectedCoordinates.latitude.toFixed(6),
                longitude: selectedCoordinates.longitude.toFixed(6),
              }}
              style={themed($coordinatesText)}
            />
            <Text 
              tx={Platform.OS === "web" ? "locationPicker:clickToSelect" : "locationPicker:dragToSelect"} 
              style={themed($instructionText)} 
            />
          </View>

          {/* Action Buttons */}
          <View style={themed($buttonContainer)}>
            <Button
              tx="common:cancel"
              preset="default"
              onPress={handleCancel}
              style={themed($cancelButton)}
              testID="cancel-button"
            />
            <Button
              tx="common:save"
              preset="filled"
              onPress={handleSave}
              style={themed($saveButton)}
              testID="save-button"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// Styles following VenueEditModal patterns
const $modalOverlay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.md,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  width: "100%",
  maxWidth: 400,
  maxHeight: "90%",
  elevation: 5,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  textAlign: "center",
})

const $mapContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 300,
  margin: spacing.md,
  borderRadius: spacing.sm,
  overflow: "hidden",
})

const $map: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $marker: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: colors.error,
  borderWidth: 2,
  borderColor: colors.background,
})

const $coordinatesContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
})

const $coordinatesText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  textAlign: "center",
})

const $instructionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  color: colors.textDim,
  textAlign: "center",
  marginTop: 4,
  fontStyle: "italic",
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  gap: spacing.sm,
})

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})