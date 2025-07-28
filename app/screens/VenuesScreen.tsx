import { FC, useEffect } from "react"
import { ViewStyle, TextStyle, View } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { ListView } from "@/components/ListView"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface VenuesScreenProps {}

export const VenuesScreen: FC<VenuesScreenProps> = observer(() => {
  const { venueStore, businessProfileStore } = useStores()
  const { themed } = useAppTheme()

  // Fetch venues when screen loads
  useEffect(() => {
    if (businessProfileStore.profile?.id) {
      venueStore.fetchVenuesByBusiness(businessProfileStore.profile.id)
    }
  }, [businessProfileStore.profile?.id])

  const renderVenueItem = ({ item }: { item: any }) => (
    <View style={themed($venueCard)}>
      <Text style={themed($venueName)}>{item.name}</Text>
      <Text style={themed($venueDescription)}>{item.description}</Text>
      <Text style={themed($venueCapacity)}>
        {translate("common:capacity")}: {item.capacity}
      </Text>
      <Text style={themed($venueAddress)}>
        {item.address?.full_address || translate("venuesScreen:addressNotAvailable")}
      </Text>
    </View>
  )

  const renderEmptyList = () => (
    <View style={themed($emptyContainer)}>
      <Text tx="venuesScreen:noVenuesFound" />
      <Text tx="venuesScreen:noVenuesSubtext" style={themed($emptySubtext)} />
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($screenContainer)}>
      <View style={themed($header)}>
        <Text preset="heading" style={themed($title)}>
          {translate("venuesScreen:title")} ({venueStore.venues.length})
        </Text>
        <Button preset="filled" tx="common:addVenue" />
      </View>
      
      {venueStore.isLoading ? (
        <View style={themed($loadingContainer)}>
          <Text tx="venuesScreen:loadingVenues" />
        </View>
      ) : (
        <ListView
          data={venueStore.venues}
          keyExtractor={(item: any) => item.id}
          renderItem={renderVenueItem}
          estimatedItemSize={120}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themed($listContent)}
        />
      )}
    </Screen>
  )
})

// TODO: Add proper content step by step
// BREADCRUMB: Created basic VenuesScreen structure

// ============================================================================
// STYLES
// ============================================================================

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.md,
  marginBottom: spacing.md,
})

const $title: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  marginRight: 16,
})

const $listContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.lg,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxl,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxl,
})

const $emptySubtext: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: spacing.sm,
})

const $venueCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.sm,
  padding: spacing.md,
  marginBottom: spacing.md,
  shadowColor: colors.palette.neutral500,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})

const $venueName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600" as const,
  color: colors.text,
  marginBottom: 4,
})

const $venueDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: 8,
})

const $venueCapacity: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500" as const,
  color: colors.text,
  marginBottom: 4,
})

const $venueAddress: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  fontStyle: "italic" as const,
})