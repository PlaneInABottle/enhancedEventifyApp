import { FC } from "react"
import { ViewStyle } from "react-native"
import type { EnhancedEventifyTabScreenProps } from "@/navigators/EnhancedEventifyNavigator"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
// import { useNavigation } from "@react-navigation/native"

interface MapScreenProps extends EnhancedEventifyTabScreenProps<"Map"> {}

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
