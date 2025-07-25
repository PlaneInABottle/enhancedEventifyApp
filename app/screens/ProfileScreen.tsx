import { FC } from "react"
import { ViewStyle } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useStores } from "@/models"
import type { BusinessTabScreenProps } from "@/navigators/BusinessNavigator"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ProfileScreenProps extends UserTabScreenProps<"Profile"> {}

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
