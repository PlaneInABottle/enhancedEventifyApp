import { FC } from "react"
import { ViewStyle } from "react-native"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"
import type { BusinessTabScreenProps } from "@/navigators/BusinessNavigator"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
// import { useNavigation } from "@react-navigation/native"

interface MapScreenProps extends UserTabScreenProps<"Map" | "Events" | "Moderate"> { }

export const MapScreen: FC<MapScreenProps> = () => {
  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen style={$root} preset="scroll">
      <Text text="map" />
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
}
