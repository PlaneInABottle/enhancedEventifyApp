import { FC, useRef, useCallback, useEffect, useState, useMemo } from "react"
import { ViewStyle, View, Alert } from "react-native"
import { MapView } from "@rnmapbox/maps"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Button } from "@/components/Button"
import { VenuePin } from "@/components/VenuePin"
import { EventListModal } from "@/components/EventListModal"
import { useStores } from "@/models/helpers/useStores"
import { translate } from "@/i18n/translate"
import { getMapBounds } from "@/services/map"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"
import type { VenueWithEvents } from "@/stores/MapStore"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const mapRef = useRef<MapView>(null)
  const { mapStore } = useStores()
  const [selectedVenue, setSelectedVenue] = useState<VenueWithEvents | null>(null)
  const [modalVisible, setModalVisible] = useState(false)


  // Show alert when error occurs, then clear it
  useEffect(() => {
    if (mapStore.lastError) {
      Alert.alert(
        translate("map:errorLoadingEvents"),
        translate("map:searchFailedMessage"),
        [{ text: translate("common:ok"), onPress: () => mapStore.clearError() }]
      )
    }
  }, [mapStore.lastError, mapStore])

  const handleSearchArea = useCallback(async () => {
    if (!mapRef.current) return

    try {
      const bounds = await getMapBounds(mapRef)
      await mapStore.loadEventsInBounds(bounds)
    } catch (error) {
      console.warn("Failed to get map bounds:", error)
      Alert.alert(
        translate("common:error"),
        translate("map:searchFailedMessage"),
        [{ text: translate("common:ok") }]
      )
    }
  }, [mapStore])

  const handleVenuePress = useCallback((venue: VenueWithEvents) => {
    setSelectedVenue(venue)
    setModalVisible(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setModalVisible(false)
    setSelectedVenue(null)
  }, [])

  return (
    <Screen preset="fixed" contentContainerStyle={$screenContent}>
      <View style={$searchContainer}>
        <Button
          tx="map:searchThisArea"
          onPress={handleSearchArea}
          disabled={mapStore.isLoading}
          style={$searchButton}
        />
      </View>

      <MapView
        ref={mapRef}
        style={$map}
        styleURL="mapbox://styles/mapbox/streets-v12"
        scaleBarEnabled={false}
      >
        {mapStore.venuesWithEvents.map((venue) => (
          <VenuePin
            key={venue.venue_id}
            venue={venue}
            onPress={handleVenuePress}
          />
        ))}
      </MapView>

      <EventListModal
        visible={modalVisible}
        onClose={handleModalClose}
        venue={selectedVenue}
      />
    </Screen>
  )
})

const $screenContent: ViewStyle = {
  flex: 1,
}

const $searchContainer: ViewStyle = {
  position: "absolute",
  top: '5%',
  left: 20,
  right: 20,
  zIndex: 1,
}

const $searchButton: ViewStyle = {
  alignSelf: "center",
}

const $map: ViewStyle = {
  flex: 1,
}
