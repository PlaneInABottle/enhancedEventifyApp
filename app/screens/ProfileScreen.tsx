import { FC } from "react"
import { ViewStyle } from "react-native"
import type { EnhancedEventifyTabScreenProps } from "@/navigators/EnhancedEventifyNavigator"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
// import { useNavigation } from "@react-navigation/native"

interface ProfileScreenProps extends EnhancedEventifyTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = () => {
  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen style={$root} preset="scroll">
      <Text text="profile" />
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
}
