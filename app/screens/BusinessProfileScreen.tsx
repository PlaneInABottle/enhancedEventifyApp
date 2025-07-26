import { FC, useState, useEffect } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import { observer } from "mobx-react-lite"

import { ProfileAvatarSection, ProfileInfoCard, ProfileField } from "@/components/profile"
import { BusinessTypeMultiSelect } from "@/components/BusinessTypeMultiSelect"
import { BusinessType, UpdateBusinessProfileRequest } from "@/services/businessProfile/businessProfileTypes"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface BusinessProfileScreenProps {
  // TODO: Add proper navigation props when integrated
}

export const BusinessProfileScreen: FC<BusinessProfileScreenProps> = observer(() => {
  const { authenticationStore, businessProfileStore } = useStores()
  const { themed } = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    business_name: "",
    business_types: [] as BusinessType[],
    description: "",
    phone: "",
    website_url: "",
  })

  // Load business profile when component mounts
  useEffect(() => {
    if (authenticationStore.userId) {
      businessProfileStore.fetchProfile(authenticationStore.userId)
    }
  }, [authenticationStore.userId])

  // Helper to reset form to current profile values
  const resetFormToProfile = () => {
    if (businessProfileStore.hasProfile) {
      setEditForm({
        business_name: businessProfileStore.businessName || "",
        business_types: [...businessProfileStore.businessTypes] as BusinessType[],
        description: businessProfileStore.description || "",
        phone: businessProfileStore.phone || "",
        website_url: businessProfileStore.websiteUrl || "",
      })
    }
  }

  // Update form when profile changes
  useEffect(() => {
    resetFormToProfile()
  }, [businessProfileStore.profile])

  // Generic form field handler
  const updateFormField = (field: keyof typeof editForm, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Edit toggle handler
  const handleEditToggle = () => {
    if (isEditing) {
      resetFormToProfile() // Use helper instead of duplicating logic
      businessProfileStore.clearError()
    }
    setIsEditing(!isEditing)
  }

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!businessProfileStore.profile?.id) {
      setIsEditing(false)
      return
    }

    const updates: UpdateBusinessProfileRequest = {}

    // Only include changed fields - use computed properties for consistency
    if (editForm.business_name !== (businessProfileStore.businessName || "")) {
      updates.business_name = editForm.business_name
    }
    if (JSON.stringify(editForm.business_types) !== JSON.stringify(businessProfileStore.businessTypes)) {
      updates.business_types = editForm.business_types
    }
    if (editForm.description !== (businessProfileStore.description || "")) {
      updates.description = editForm.description
    }
    if (editForm.phone !== (businessProfileStore.phone || "")) {
      updates.phone = editForm.phone
    }
    if (editForm.website_url !== (businessProfileStore.websiteUrl || "")) {
      updates.website_url = editForm.website_url
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    await businessProfileStore.updateProfile(businessProfileStore.profile.id, updates)
    if (!businessProfileStore.lastError) {
      setIsEditing(false)
    }
  }

  return (
    <Screen preset="auto" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      {/* Business Logo and Header Section */}
      <ProfileAvatarSection
        displayName={businessProfileStore.businessName}
        avatarUrl={businessProfileStore.logoUrl}
        isEditing={isEditing}
        onAvatarPress={() => {}} // TODO: Implement logo upload
        isUploading={businessProfileStore.isUploading}
      />

      {/* Loading State */}
      {businessProfileStore.isLoading && (
        <View style={themed($loadingContainer)}>
          <Text tx="profile:loadingProfile" style={themed($loadingText)} />
        </View>
      )}

      {/* Error State */}
      {businessProfileStore.lastError && (
        <View style={themed($errorContainer)}>
          <Text
            text={businessProfileStore.lastError}
            style={themed($errorText)}
          />
        </View>
      )}

      {/* Business Profile Content */}
      {!businessProfileStore.isLoading && (
        <View style={themed($cardsContainer)}>
          {/* Business Information Card */}
          <ProfileInfoCard
            titleTx="profile:businessInformation"
            headerIcon="view"
            isEditing={isEditing}
            viewContent={
              <View>
                <ProfileField
                  labelTx="profile:businessName"
                  value={businessProfileStore.businessName}
                  placeholderTx="common:notSet"
                />
                <ProfileField
                  labelTx="profile:businessTypes"
                  value={businessProfileStore.businessTypes.join(", ")}
                  placeholderTx="common:notSet"
                />
              </View>
            }
            editContent={
              <View>
                <TextField
                  labelTx="profile:businessName"
                  value={editForm.business_name}
                  onChangeText={(text) => updateFormField("business_name", text)}
                  containerStyle={themed($editField)}
                  editable={!businessProfileStore.isUpdating}
                />
                
                <BusinessTypeMultiSelect
                  labelTx="profile:businessTypes"
                  value={editForm.business_types}
                  onValueChange={(types) => updateFormField("business_types", types)}
                  containerStyle={themed($editField)}
                  disabled={businessProfileStore.isUpdating}
                />
              </View>
            }
          />

          {/* Contact Information Card */}
          <ProfileInfoCard
            titleTx="profile:contactInformation"
            headerIcon="components"
            isEditing={isEditing}
            viewContent={
              <View>
                <ProfileField
                  labelTx="profile:phone"
                  value={businessProfileStore.phone}
                  placeholderTx="common:notSet"
                />
                <ProfileField
                  labelTx="profile:websiteUrl"
                  value={businessProfileStore.websiteUrl}
                  placeholderTx="common:notSet"
                />
              </View>
            }
            editContent={
              <View>
                <TextField
                  labelTx="profile:phone"
                  value={editForm.phone}
                  onChangeText={(text) => updateFormField("phone", text)}
                  containerStyle={themed($editField)}
                  editable={!businessProfileStore.isUpdating}
                />
                
                <TextField
                  labelTx="profile:websiteUrl"
                  value={editForm.website_url}
                  onChangeText={(text) => updateFormField("website_url", text)}
                  containerStyle={themed($editField)}
                  editable={!businessProfileStore.isUpdating}
                />
              </View>
            }
          />

          {/* Description Card */}
          <ProfileInfoCard
            titleTx="profile:description"
            headerIcon="more"
            isEditing={isEditing}
            viewContent={
              <ProfileField
                value={businessProfileStore.description}
                placeholderTx="profile:noDescription"
                multiline
              />
            }
            editContent={
              <TextField
                labelTx="profile:description"
                value={editForm.description}
                onChangeText={(text) => updateFormField("description", text)}
                multiline
                containerStyle={themed($editField)}
                editable={!businessProfileStore.isUpdating}
              />
            }
          />

          {/* Action Buttons */}
          <View style={themed($actionsContainer)}>
            <Button
              tx={isEditing ? "profile:cancel" : "profile:editProfile"}
              onPress={handleEditToggle}
              style={themed($actionButton)}
              preset={isEditing ? "default" : "reversed"}
              disabled={businessProfileStore.isUpdating}
            />

            {isEditing && (
              <Button
                tx="profile:saveChanges"
                onPress={handleSaveProfile}
                style={themed($actionButton)}
                preset="filled"
                disabled={businessProfileStore.isUpdating}
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxl,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  marginTop: spacing.md,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.angry100,
  padding: spacing.md,
  marginVertical: spacing.md,
  borderRadius: spacing.xs,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry100,
})

const $cardsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $editField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $actionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.lg,
  marginBottom: spacing.xxl,
  gap: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  minHeight: 48,
  borderRadius: spacing.md,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})