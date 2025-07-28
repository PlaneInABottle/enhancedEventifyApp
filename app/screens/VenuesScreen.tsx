import { FC } from "react"
import { ViewStyle, View } from "react-native"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface VenuesScreenProps {}

export const VenuesScreen: FC<VenuesScreenProps> = observer(() => {
  const { venueStore } = useStores()
  const { themed } = useAppTheme()

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Text preset="heading">Venues</Text>
      </View>
      
      <Text>Venue list will go here</Text>
    </Screen>
  )
})

// TODO: Add proper content step by step
// BREADCRUMB: Created basic VenuesScreen structure

// ============================================================================
// STYLES
// ============================================================================

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  marginBottom: spacing.lg,
})