import { FC, useRef, useCallback, useEffect } from "react"
import { ViewStyle, View, Alert } from "react-native"
import { MapView } from "@rnmapbox/maps"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Button } from "@/components/Button"
import { useStores } from "@/models/helpers/useStores"
import { translate } from "@/i18n/translate"
import { getMapBounds } from "@/services/map"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Events" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const mapRef = useRef<MapView>(null)
  const { mapStore } = useStores()

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
    }
  }, [mapStore])

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
