import { FC, useEffect, useState } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, Platform, ImageStyle } from "react-native"

import { translate } from "@/i18n/translate"
import { getInitials } from "@/services/profile/profileHelpers"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { AutoImage } from "../AutoImage"
import { Icon } from "../Icon"
import { Text } from "../Text"

export interface ProfileAvatarSectionProps {
  /**
   * The user's display name
   */
  displayName?: string | null
  /**
   * The user's avatar URL
   */
  avatarUrl?: string | null
  /**
   * Whether the section is in edit mode
   */
  isEditing?: boolean
  // onEditPress prop removed - edit functionality now handled by Action Buttons section
  /**
   * Callback when avatar is pressed (for uploading)
   */
  onAvatarPress?: () => void
  /**
   * Whether upload is in progress
   */
  isUploading?: boolean
}

/**
 * Hero section component for user profile with avatar and name display
 */
export const ProfileAvatarSection: FC<ProfileAvatarSectionProps> = function ProfileAvatarSection({
  displayName,
  avatarUrl,
  onAvatarPress,
  isUploading = false,
}) {
  const { themed, theme } = useAppTheme()
  const [imageError, setImageError] = useState(false)

  const initials = getInitials(displayName || null)

  // Reset image error when avatarUrl changes
  useEffect(() => {
    setImageError(false)
  }, [avatarUrl])

  return (
    <View style={themed($container)}>
      <View style={themed($avatarContainer)}>
        <View style={themed($avatarShadow)}>
          <TouchableOpacity
            style={themed($avatar)}
            onPress={onAvatarPress}
            disabled={!onAvatarPress || isUploading}
            activeOpacity={0.7}
            testID="avatar-button"
          >
            {avatarUrl && !imageError ? (
              <AutoImage
                source={{ uri: avatarUrl }}
                style={themed($avatarImage)}
                onError={(error) => {
                  console.warn("Avatar image failed to load:", error.nativeEvent?.error)
                  setImageError(true)
                }}
                onLoad={() => {
                  // Reset error state when image loads successfully
                  setImageError(false)
                }}
              />
            ) : (
              <View style={themed($avatarPlaceholder)}>
                <Text text={initials} style={themed($avatarText)} />
              </View>
            )}

            {onAvatarPress && (
              <View style={themed($avatarOverlay)}>
                <Icon icon="more" size={24} color={theme.colors.palette.neutral100} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isUploading && (
          <View style={themed($uploadingOverlay)}>
            <View style={themed($uploadingBadge)}>
              <Text tx="profile:uploading" size="xs" style={themed($uploadingText)} />
            </View>
          </View>
        )}
      </View>

      <View style={themed($nameContainer)}>
        <Text
          text={displayName || translate("common:notSet")}
          preset="heading"
          size="xl"
          style={themed($displayName)}
        />

        {/* Edit button removed - now handled by Action Buttons section */}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.palette.neutral100,
  borderBottomWidth: 0,
  marginBottom: spacing.md,
})

const $avatarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "relative",
  marginBottom: spacing.xl,
})

const $avatarShadow: ThemedStyle<ViewStyle> = () => ({
  // Removed shadow as it appears rectangular on Android with borderRadius
})

const $avatar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 120,
  height: 120,
  borderRadius: 60,
  overflow: "hidden",
  position: "relative",
  borderWidth: 4,
  borderColor: colors.palette.neutral100,
  backgroundColor: colors.palette.neutral200,
})

const $avatarPlaceholder: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  height: "100%",
  backgroundColor: colors.palette.primary500,
  justifyContent: "center",
  alignItems: "center",
})

const $avatarImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
})

const $avatarText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 32,
  fontWeight: "bold",
})

const $avatarOverlay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  bottom: spacing.xs,
  right: spacing.xs,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.accent500,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 3,
  borderColor: colors.palette.neutral100,
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2)`,
      } as any)
    : {
        shadowColor: colors.palette.neutral800,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }),
})

const $uploadingOverlay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  bottom: -spacing.md,
  left: 0,
  right: 0,
  alignItems: "center",
  justifyContent: "center",
})

const $uploadingBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: spacing.sm,
  borderWidth: 2,
  borderColor: colors.palette.neutral100,
  ...(Platform.OS === "web"
    ? ({
        boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
      } as any)
    : {
        shadowColor: colors.palette.neutral800,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 6,
      }),
})

const $uploadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "600",
  fontSize: 12,
})

const $nameContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.sm,
})

const $displayName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  textAlign: "center",
  fontWeight: "700",
  marginBottom: spacing.sm,
  letterSpacing: 0.5,
})
