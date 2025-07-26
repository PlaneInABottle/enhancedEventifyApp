import { FC } from "react"
import { ViewStyle } from "react-native"
import { MapView } from "@rnmapbox/maps"

import { Screen } from "@/components/Screen"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Events" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = () => {

  return (
    <Screen preset="fixed" contentContainerStyle={$screenContent}>
      <MapView
        style={$map}
        styleURL="mapbox://styles/mapbox/streets-v12"
        scaleBarEnabled={false}
      />
    </Screen>
  )
}

const $screenContent: ViewStyle = {
  flex: 1,
}

const $map: ViewStyle = {
  flex: 1,
}
