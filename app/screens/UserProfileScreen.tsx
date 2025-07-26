import { FC, useEffect, useState, useMemo, useCallback } from "react"
import { ViewStyle, View, TextStyle, Platform } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { ProfileAvatarSection, ProfileInfoCard, ProfileField } from "@/components/profile"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { ThemeToggle } from "@/components/ThemeToggle"
import { createTurkishCityOptions } from "@/constants/cities"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import type { UserTabScreenProps } from "@/navigators/UserNavigator"
import type { UpdateProfileRequest, TurkishCity } from "@/services/profile/profileTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Alert } from "@/utils/alert"

interface UserProfileScreenProps extends UserTabScreenProps<"Profile"> {}

export const UserProfileScreen: FC<UserProfileScreenProps> = observer(() => {
  const { authenticationStore, userProfileStore } = useStores()
  const { themed } = useAppTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    display_name: string
    bio: string
    location_city: TurkishCity | ""
  }>({
    display_name: "",
    bio: "",
    location_city: "",
  })

  // Memoize city options to prevent recreation
  const cityOptions = useMemo(() => createTurkishCityOptions(translate("common:other")), [])

  useEffect(() => {
    // Load user profile when component mounts
    if (authenticationStore.userId) {
      userProfileStore.fetchProfile(authenticationStore.userId)
    }
  }, [authenticationStore.userId])

  useEffect(() => {
    // Update form when profile is loaded or editing mode changes
    if (userProfileStore.profile && !isEditing) {
      setEditForm({
        display_name: userProfileStore.profile.display_name || "",
        bio: userProfileStore.profile.bio || "",
        location_city: (userProfileStore.profile.location_city as TurkishCity) || "",
      })
    }
  }, [userProfileStore.profile, isEditing])

  const handleLogout = async () => {
    await authenticationStore.signOut()
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form and clear any errors
      if (userProfileStore.profile) {
        setEditForm({
          display_name: userProfileStore.profile.display_name || "",
          bio: userProfileStore.profile.bio || "",
          location_city: (userProfileStore.profile.location_city as TurkishCity) || "",
        })
      }
      userProfileStore.clearError()
    }

    setIsEditing(!isEditing)
  }

  const handleSaveProfile = async () => {
    if (!authenticationStore.userId) return

    const updates: UpdateProfileRequest = {}

    if (editForm.display_name !== (userProfileStore.profile?.display_name || "")) {
      updates.display_name = editForm.display_name
    }
    if (editForm.bio !== (userProfileStore.profile?.bio || "")) {
      updates.bio = editForm.bio
    }
    if (editForm.location_city !== (userProfileStore.profile?.location_city || "")) {
      updates.location_city = editForm.location_city as TurkishCity
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    try {
      const result = await userProfileStore.updateProfile(authenticationStore.userId, updates)
      if (result.success) {
        setIsEditing(false)
        Alert.simple(translate("profile:success"), translate("profile:profileUpdatedSuccessfully"))
      } else {
        Alert.simple(
          translate("profile:error"),
          translate(result.error || "profile:failedToUpdateProfile"),
        )
      }
    } catch {
      Alert.simple(translate("profile:error"), translate("profile:unexpectedError"))
    }
  }

  const handleAvatarUpload = async () => {
    if (!authenticationStore.userId || userProfileStore.isUploading) return

    try {
      // Clear any previous errors
      userProfileStore.clearError()
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

        // Upload avatar using the store
        const uploadResult = await userProfileStore.uploadAvatar(
          authenticationStore.userId, 
          arrayBuffer,
          asset.mimeType || 'image/jpeg'
        )

        if (uploadResult.success) {
          Alert.simple(
            translate("profile:success"),
            translate("profile:avatarUploadedSuccessfully"),
          )
        } else {
          Alert.simple(
            translate("profile:error"), 
            uploadResult.error ? translate(uploadResult.error as any) : translate("profile:avatarUploadFailed")
          )
        }
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      // Show more specific error message if available
      const errorMessage = error instanceof Error ? error.message : translate("profile:avatarUploadFailed")
      Alert.simple(translate("profile:error"), errorMessage)
    }
  }

  // Memoize form change handlers to prevent re-renders
  const handleDisplayNameChange = useCallback((text: string) => {
    setEditForm((prev) => ({ ...prev, display_name: text }))
  }, [])

  const handleLocationChange = useCallback((value: TurkishCity) => {
    setEditForm((prev) => ({ ...prev, location_city: value }))
  }, [])

  const handleBioChange = useCallback((text: string) => {
    setEditForm((prev) => ({ ...prev, bio: text }))
  }, [])

  const handleRefresh = useCallback(() => {
    if (authenticationStore.userId) {
      userProfileStore.fetchProfile(authenticationStore.userId)
    }
  }, [authenticationStore.userId])

  return (
    <Screen preset="auto" contentContainerStyle={themed($screenContainer)} safeAreaEdges={["top"]}>
      {/* Avatar and Header Section */}
      <ProfileAvatarSection
        displayName={userProfileStore.profile?.display_name}
        avatarUrl={userProfileStore.profile?.avatar_url}
        isEditing={isEditing}
        onAvatarPress={handleAvatarUpload}
        isUploading={userProfileStore.isUploading}
      />

      {/* Loading State */}
      {userProfileStore.isLoading && (
        <View style={themed($loadingContainer)}>
          <View style={themed($loadingSpinner)} />
          <Text tx="profile:loadingProfile" style={themed($loadingText)} />
        </View>
      )}

      {/* Error State */}
      {userProfileStore.lastError && (
        <View style={themed($errorContainer)}>
          <Text
            tx="profile:errorMessage"
            txOptions={{ error: translate(userProfileStore.lastError as any) }}
            style={themed($errorText)}
          />
        </View>
      )}

      {/* Profile Content */}
      <View>
        {!userProfileStore.profile ? (
          <View style={themed($emptyContainer)}>
            <Text tx="profile:noProfileData" style={themed($emptyText)} />
            <Button
              tx="profile:refresh"
              onPress={handleRefresh}
              disabled={userProfileStore.isLoading}
              style={themed($refreshButton)}
            />
          </View>
        ) : (
          <View style={themed($cardsContainer)}>
            {/* Personal Information Card */}
            <ProfileInfoCard
              titleTx="profile:profileInformation"
              headerIcon="view"
              isEditing={isEditing}
              viewContent={
                <View>
                  <ProfileField
                    labelTx="profile:displayName"
                    value={userProfileStore.profile.display_name}
                    placeholderTx="common:notSet"
                  />
                  <ProfileField
                    labelTx="profile:location"
                    value={userProfileStore.profile.location_city}
                    placeholderTx="common:notSet"
                  />
                </View>
              }
              editContent={
                <View>
                  <TextField
                    labelTx="profile:displayName"
                    value={editForm.display_name}
                    onChangeText={handleDisplayNameChange}
                    containerStyle={themed($editField)}
                    editable={!userProfileStore.isUpdating}
                  />

                  <Dropdown<TurkishCity>
                    labelTx="profile:location"
                    value={editForm.location_city || undefined}
                    onValueChange={handleLocationChange}
                    options={cityOptions}
                    placeholder={translate("profile:selectCity")}
                    containerStyle={themed($editField)}
                    disabled={userProfileStore.isUpdating}
                  />
                </View>
              }
            />

            {/* Bio Card */}
            <ProfileInfoCard
              titleTx="profile:bio"
              headerIcon="more"
              isEditing={isEditing}
              viewContent={
                <ProfileField
                  value={userProfileStore.profile.bio}
                  placeholderTx="profile:noBio"
                  multiline
                />
              }
              editContent={
                <TextField
                  labelTx="profile:bio"
                  value={editForm.bio}
                  onChangeText={handleBioChange}
                  multiline
                  containerStyle={themed($editField)}
                  editable={!userProfileStore.isUpdating}
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
                disabled={userProfileStore.isUpdating}
              />

              {isEditing && (
                <Button
                  tx="profile:saveChanges"
                  onPress={handleSaveProfile}
                  style={themed($actionButton)}
                  preset="reversed"
                  disabled={userProfileStore.isUpdating}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Account Actions */}
      <View style={themed($accountSection)}>
        <ProfileInfoCard
          titleTx="profile:themeSettings"
          headerIcon="settings"
          viewContent={<ThemeToggle />}
        />

        <ProfileInfoCard
          titleTx="profile:accountActions"
          headerIcon="more"
          viewContent={
            <Button
              testID="logout-button"
              tx="common:logOut"
              style={themed($logoutButtonStyle)}
              preset="default"
              onPress={handleLogout}
              disabled={authenticationStore.isLoading}
            />
          }
        />
      </View>
    </Screen>
  )
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xl,
  alignItems: "center",
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  textAlign: "center",
  color: colors.textDim,
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

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xxl,
  alignItems: "center",
  marginHorizontal: spacing.lg,
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.lg,
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.05)`,
      } as any)
    : {
        shadowColor: colors.palette.neutral800,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
      }),
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  textAlign: "center",
  marginBottom: spacing.lg,
  color: colors.textDim,
})

const $cardsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  paddingTop: spacing.md,
})

const $editField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $actionsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.lg,
  marginTop: spacing.xl,
  paddingTop: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  borderRadius: spacing.md,
  // Remove shadows entirely to prevent sharp edges on Android
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.05)`,
      } as any)
    : Platform.OS === "ios"
      ? {
          shadowColor: colors.palette.neutral700,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        }
      : {
          // No shadow for Android - use subtle border instead
          borderWidth: 1,
          borderColor: colors.palette.neutral300,
        }),
})

const $accountSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
  paddingTop: spacing.md,
})

const $refreshButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $logoutButtonStyle: ThemedStyle<ViewStyle> = () => ({
  // Logout button styling handled by ProfileInfoCard
})

const $loadingSpinner: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.palette.primary200,
  borderTopColor: colors.palette.primary500,
  marginBottom: spacing.md,
  // Note: In a real app, this would be animated with a rotation transform
})
