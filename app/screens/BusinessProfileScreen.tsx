import { FC, useState } from "react"
import { observer } from "mobx-react-lite"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface BusinessProfileScreenProps {
  // TODO: Add proper navigation props when integrated
}

export const BusinessProfileScreen: FC<BusinessProfileScreenProps> = observer(() => {
  const { businessProfileStore } = useStores()
  const { themed } = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Screen preset="auto" contentContainerStyle={themed($container)}>
      <Text tx="businessProfile:title" preset="heading" />
    </Screen>
  )
})

const $container: ThemedStyle = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})