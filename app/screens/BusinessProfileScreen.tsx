import { FC, useState, useEffect, useCallback } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"

import { BusinessTypeMultiSelect, businessTypeOptions } from "@/components/BusinessTypeMultiSelect"
import { Button } from "@/components/Button"
import { ProfileAvatarSection, ProfileInfoCard, ProfileField } from "@/components/profile"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import {
  BusinessType,
  UpdateBusinessProfileRequest,
} from "@/services/businessProfile/businessProfileTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Alert } from "@/utils/alert"

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

  // Generic form field handler - memoized for performance
  const updateFormField = useCallback((field: keyof typeof editForm, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Edit toggle handler
  const handleEditToggle = () => {
    if (isEditing) {
      resetFormToProfile() // Use helper instead of duplicating logic
      businessProfileStore.clearError()
    }
    setIsEditing(!isEditing)
  }

  // Logo upload handler
  const handleLogoUpload = async () => {
    if (!authenticationStore.userId || businessProfileStore.isUploading) return

    try {
      // Clear any previous errors
      businessProfileStore.clearError()
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.simple(
          translate("profile:permissionRequired"),
          translate("profile:photoLibraryPermissionMessage"),
        )
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]

        // Use ArrayBuffer for both platforms (simpler approach)
        const response = await fetch(asset.uri)
        const arrayBuffer = await response.arrayBuffer()

        // Upload logo using the store
        const uploadResult = await businessProfileStore.uploadLogo(
          authenticationStore.userId,
          arrayBuffer,
          asset.mimeType || "image/jpeg",
        )

        if (uploadResult.success) {
          Alert.simple(translate("profile:success"), translate("profile:logoUploadedSuccessfully"))
        } else {
          Alert.simple(
            translate("profile:error"),
            uploadResult.error
              ? translate(uploadResult.error as any)
              : translate("profile:logoUploadFailed"),
          )
        }
      }
    } catch (error) {
      // Show more specific error message if available
      const errorMessage =
        error instanceof Error ? error.message : translate("profile:logoUploadFailed")
      Alert.simple(translate("profile:error"), errorMessage)
    }
  }

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!businessProfileStore.profile?.id) {
      setIsEditing(false)
      return
    }

    // Validation is now handled in the service layer

    const updates: UpdateBusinessProfileRequest = {}

    // Only include changed fields - use computed properties for consistency
    if (editForm.business_name !== (businessProfileStore.businessName || "")) {
      updates.business_name = editForm.business_name
    }
    // Compare arrays properly instead of using JSON.stringify
    const currentTypes = [...businessProfileStore.businessTypes] // Create mutable copy
    const hasTypesChanged =
      editForm.business_types.length !== currentTypes.length ||
      editForm.business_types.some((type: BusinessType) => !currentTypes.includes(type))

    if (hasTypesChanged) {
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

    try {
      await businessProfileStore.updateProfile(businessProfileStore.profile.id, updates)
      if (!businessProfileStore.lastError) {
        setIsEditing(false)
        Alert.simple(translate("profile:success"), translate("profile:profileUpdatedSuccessfully"))
      } else {
        Alert.simple(translate("profile:error"), translate(businessProfileStore.lastError as any))
      }
    } catch {
      Alert.simple(translate("profile:error"), translate("profile:unexpectedError"))
    }
  }

  return (
    <Screen preset="auto" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      {/* Business Logo and Header Section */}
      <ProfileAvatarSection
        displayName={businessProfileStore.businessName}
        avatarUrl={businessProfileStore.logoUrl}
        isEditing={isEditing}
        onAvatarPress={handleLogoUpload}
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
          <Text tx={businessProfileStore.lastError as any} style={themed($errorText)} />
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
                  value={businessProfileStore.businessTypes
                    .map((type) => {
                      const option = businessTypeOptions.find((opt) => opt.value === type)
                      return option ? translate(option.labelTx as any) : type
                    })
                    .join(", ")}
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
                preset="reversed"
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
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  marginHorizontal: spacing.lg,
  marginVertical: spacing.md,
  backgroundColor: colors.palette.angry100,
  borderRadius: spacing.md,
  borderLeftWidth: 4,
  borderLeftColor: colors.palette.angry500,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
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
