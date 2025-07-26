import { FC, useState } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import { observer } from "mobx-react-lite"

import { ProfileAvatarSection, ProfileInfoCard, ProfileField } from "@/components/profile"
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
                {/* TODO: Add TextField for business name */}
                {/* TODO: Add multi-select component for business types */}
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
                {/* TODO: Add TextField for phone */}
                {/* TODO: Add TextField for website URL */}
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
              <View>
                {/* TODO: Add TextField for description */}
              </View>
            }
          />
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