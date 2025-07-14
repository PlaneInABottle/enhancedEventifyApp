import { FC } from "react"
import { ViewStyle } from "react-native"
import { observer } from "mobx-react-lite"
import type { EnhancedEventifyTabScreenProps } from "@/navigators/EnhancedEventifyNavigator"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ProfileScreenProps extends EnhancedEventifyTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(() => {
  const { authenticationStore } = useStores()
  const { themed } = useAppTheme()

  const handleLogout = async () => {
    await authenticationStore.signOut()
  }

  return (
    <Screen style={$root} preset="scroll">
      <Text text="profile" />
      
      <Button
        testID="logout-button"
        tx="common:logOut"
        style={themed($logoutButton)}
        preset="default"
        onPress={handleLogout}
        disabled={authenticationStore.isLoading}
      />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

const $logoutButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  marginHorizontal: spacing.lg,
})
