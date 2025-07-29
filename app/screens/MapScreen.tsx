import { FC, useRef, useCallback, useEffect, useState } from "react"
import { View, Alert, ViewStyle } from "react-native"
import { MapView, MarkerView } from "@rnmapbox/maps"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Button } from "@/components/Button"
import { VenuePinContent } from "@/components/VenuePinContent"
import { EventListModal } from "@/components/EventListModal"
import { useStores } from "@/models/helpers/useStores"
import { useAppTheme } from "@/theme/context"
import { translate } from "@/i18n/translate"
import { getMapBounds } from "@/services/map"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"
import type { VenueWithEvents } from "@/stores/MapStore"
import type { ThemedStyle } from "@/theme/types"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const { themed } = useAppTheme()
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
    <Screen preset="fixed" contentContainerStyle={themed($screenContent)}>
      <View style={themed($searchContainer)}>
        <Button
          tx="map:searchThisArea"
          onPress={handleSearchArea}
          disabled={mapStore.isLoading}
          style={themed($searchButton)}
        />
      </View>

      <MapView
        ref={mapRef}
        style={themed($map)}
        styleURL="mapbox://styles/mapbox/streets-v12"
        scaleBarEnabled={false}
      >
        {mapStore.venuesWithEvents.map((venue) => (
          <MarkerView
            key={venue.venue_id}
            coordinate={[venue.longitude, venue.latitude]}
            allowOverlap={true}
          >
            <VenuePinContent 
              venue={venue} 
              onPress={() => handleVenuePress(venue)} 
            />
          </MarkerView>
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

const $screenContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $searchContainer: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: '5%',
  left: 20,
  right: 20,
  zIndex: 1,
})

const $searchButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "center",
})

const $map: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})
