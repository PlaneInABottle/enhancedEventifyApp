import React, { FC, useState, useCallback, useEffect } from "react"
import { View, ViewStyle, TextStyle, Modal, Pressable, Platform } from "react-native"
import { MapView, PointAnnotation, Camera } from "@rnmapbox/maps"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { WebMapView } from "./WebMapView"

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
  
  // Track initial camera position to prevent re-centering  
  const [initialCameraPosition, setInitialCameraPosition] = useState<Coordinates>(
    initialCoordinates || defaultCoordinates,
  )

  // Sync state when modal opens or initialCoordinates change
  useEffect(() => {
    if (visible) {
      const coords = initialCoordinates || defaultCoordinates
      setSelectedCoordinates(coords)
      setInitialCameraPosition(coords)
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

  // Handle map click for web and native
  const handleMapClick = useCallback((event: any) => {
    let newCoordinates: Coordinates | null = null;

    if (Platform.OS === "web") {
      if (event?.lngLat) {
        newCoordinates = { longitude: event.lngLat.lng, latitude: event.lngLat.lat };
      }
    } else { // Native
      if (event?.coordinates) { // Common for general map clicks
        newCoordinates = { longitude: event.coordinates.longitude, latitude: event.coordinates.latitude };
      } else if (event?.geometry?.coordinates) { // Common if a specific feature was tapped
        newCoordinates = { longitude: event.geometry.coordinates[0], latitude: event.geometry.coordinates[1] };
      }
    }

    if (newCoordinates) {
      setSelectedCoordinates(newCoordinates);
    }
  }, [])



  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "ios" ? "slide" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View style={themed($modalOverlay)}>
        <Pressable style={themed($backgroundOverlay)} onPress={onClose} />
        <View style={themed($centeredContent)}>
          <View
            style={themed($modalContent)}
            testID="modal-content"
          >
          {/* Header */}
          <View style={themed($header)}>
            <Text preset="heading" tx="locationPicker:title" style={themed($headerTitle)} />
          </View>

          {/* Map View */}
          <View style={themed($mapContainer)}>
            {Platform.OS === "web" ? (
              <WebMapView
                style={themed($map)}
                styleURL="mapbox://styles/mapbox/streets-v12"
                scaleBarEnabled={false}
                onPress={handleMapClick}
                onClick={handleMapClick}
                initialCoordinates={initialCoordinates || defaultCoordinates}
              />
            ) : (
              <MapView
                style={themed($map)}
                styleURL="mapbox://styles/mapbox/streets-v12"
                scaleBarEnabled={false}
                onPress={handleMapClick}
              >
                <Camera
                  zoomLevel={14}
                  centerCoordinate={[initialCameraPosition.longitude, initialCameraPosition.latitude]}
                  animationDuration={0}
                />
              
                <PointAnnotation
                  id="location-marker"
                  coordinate={[selectedCoordinates.longitude, selectedCoordinates.latitude]}
                  draggable
                  onDrag={onMarkerPositionUpdate}
                  onDragEnd={onMarkerPositionUpdate}
                >
                  <View style={themed($marker)} />
                </PointAnnotation>
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
              tx={
                Platform.OS === "web"
                  ? "locationPicker:clickToSelect"
                  : "locationPicker:dragToSelect"
              }
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
          </View>
        </View>
      </View>
    </Modal>
  )
}

// Styles following VenueEditModal patterns
const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})
const $backgroundOverlay: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
})
const $centeredContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  maxWidth: 400,
  margin: spacing.md,
  justifyContent: "center",
  alignItems: "center",
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  width: "100%",
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
