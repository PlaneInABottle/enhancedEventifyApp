import { FC, useEffect, useState } from "react"
import { ViewStyle, TextStyle, View, TouchableOpacity } from "react-native"
import { observer, Observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { ListView } from "@/components/ListView"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { VenueEditModal, VenueEditFormData } from "@/components/VenueEditModal"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import type { IVenue } from "@/models/VenueModels"
import type { CreateVenueRequest, UpdateVenueRequest } from "@/services/venue/venueTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface VenuesScreenProps {}

export const VenuesScreen: FC<VenuesScreenProps> = observer(() => {
  const { venueStore, businessProfileStore } = useStores()
  const { themed } = useAppTheme()

  // Modal state management
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Get selected venue from store using new method
  const selectedVenue = selectedVenueId ? venueStore.getVenueById(selectedVenueId) : null

  // Fetch venues when screen loads
  useEffect(() => {
    if (businessProfileStore.profile?.id) {
      venueStore.fetchVenuesByBusiness(businessProfileStore.profile.id)
    }
  }, [businessProfileStore.profile?.id])

  // Modal handlers
  const handleEditVenue = (venue: IVenue) => {
    setSelectedVenueId(venue.id)
    setEditModalVisible(true)
  }

  const handleAddVenue = () => {
    setSelectedVenueId(null)
    setEditModalVisible(true)
  }

  const handleCloseModal = () => {
    setEditModalVisible(false)
    setSelectedVenueId(null)
    setSaveError(null) // Clear any previous errors
  }

  // Helper function to transform form data to API request format
  const transformFormDataToRequest = (formData: VenueEditFormData, isCreate: boolean): CreateVenueRequest | UpdateVenueRequest => {
    const baseData = {
      name: formData.name,
      description: formData.description || null,
      capacity: formData.capacity ? Number(formData.capacity) : null,
      address: {
        full_address: formData.address.full_address || null,
        city: formData.address.city,
        postal_code: formData.address.postal_code || null,
        coordinates: formData.address.coordinates
          ? {
              type: "Point" as const,
              coordinates: [
                formData.address.coordinates.longitude,
                formData.address.coordinates.latitude,
              ],
            }
          : undefined,
      },
    }

    // Add country field only for create requests
    if (isCreate) {
      return {
        ...baseData,
        address: {
          ...baseData.address,
          country: "Turkey", // Default country
        },
      } as CreateVenueRequest
    }

    return baseData as UpdateVenueRequest
  }
  const handleSaveVenue = async (formData: VenueEditFormData) => {
    const isEditing = !!selectedVenue
    const businessId = businessProfileStore.profile?.id

    if (!businessId) {
      setSaveError("errors:businessIdNotAvailable")
      return
    }

    setSaveError(null) // Clear any previous errors
    setIsSubmitting(true)
    try {
      if (isEditing) {
        const updateData = transformFormDataToRequest(formData, false)
        await venueStore.updateVenue(selectedVenue.id, updateData as UpdateVenueRequest)
      } else {
        const createData = transformFormDataToRequest(formData, true)
        await venueStore.createVenue(businessId, createData as CreateVenueRequest)
      }

      handleCloseModal()
    } catch (error) {
      console.error("Failed to save venue:", error)
      setSaveError(isEditing ? "errors:updateVenueFailed" : "errors:createVenueFailed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderVenueItem = ({ item }: { item: IVenue }) => (
    <Observer>
      {() => (
        <View style={themed($venueCard)}>
      <View style={themed($venueContent)}>
        <Text style={themed($venueName)}>{item.name}</Text>
        <Text style={themed($venueDescription)}>{item.description}</Text>
        <Text style={themed($venueCapacity)}>
          {translate("common:capacity")}: {item.capacity}
        </Text>
        <Text style={themed($venueAddress)}>
          {item.address?.full_address || translate("venuesScreen:addressNotAvailable")}
        </Text>
      </View>
      <TouchableOpacity
        style={themed($editButton)}
        onPress={() => handleEditVenue(item)}
        testID={`edit-venue-${item.id}`}
      >
        <Text style={themed($editButtonText)} tx="common:edit" />
        </TouchableOpacity>
        </View>
      )}
    </Observer>
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
        <Button preset="filled" tx="common:addVenue" onPress={handleAddVenue} />
      </View>

      {venueStore.isLoading ? (
        <View style={themed($loadingContainer)}>
          <Text tx="venuesScreen:loadingVenues" />
        </View>
      ) : (
        <ListView
          data={venueStore.venues}
          keyExtractor={(item) => item.id}
          renderItem={renderVenueItem}
          estimatedItemSize={120}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themed($listContent)}
        />
      )}

      <VenueEditModal
        visible={editModalVisible}
        venue={selectedVenue}
        onClose={handleCloseModal}
        onSave={handleSaveVenue}
        isSubmitting={isSubmitting}
        errorMessage={saveError}
      />
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
  flexDirection: "row",
  alignItems: "flex-start",
})

const $venueContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginRight: 12,
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  alignSelf: "flex-start",
})

const $editButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 12,
  fontWeight: "600" as const,
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