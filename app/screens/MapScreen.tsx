import { FC, useRef, useCallback } from "react"
import { ViewStyle, View } from "react-native"
import { MapView } from "@rnmapbox/maps"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Button } from "@/components/Button"
import { useStores } from "@/models/helpers/useStores"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Events" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const mapRef = useRef<MapView>(null)
  const { mapStore } = useStores()

  const handleSearchArea = useCallback(async () => {
    if (!mapRef.current) return

    try {
      const bounds = await mapRef.current.getVisibleBounds()
      const [[west, south], [east, north]] = bounds

      await mapStore.loadEventsInBounds({
        north,
        south, 
        east,
        west,
      })
    } catch (error) {
      // Silent fail - map bounds detection error
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
  top: 20,
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
