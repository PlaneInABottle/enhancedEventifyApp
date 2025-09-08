import React, { FC } from "react"
import { View, ViewStyle, TextStyle, Pressable, Image, ImageStyle } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { translate } from "@/i18n/translate"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Alert } from "@/utils/alert"

export interface EventImagePickerProps {
  /**
   * Current image URI (from previous selection or server)
   */
  imageUri?: string | null
  /**
   * Callback when an image is selected
   */
  onImageSelected: (asset: ImagePicker.ImagePickerAsset | null) => void
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean
  /**
   * Optional custom style for the container
   */
  style?: ViewStyle
}

export const EventImagePicker: FC<EventImagePickerProps> = observer(function EventImagePicker({
  imageUri,
  onImageSelected,
  disabled = false,
  style,
}) {
  const { themed } = useAppTheme()

  const handleSelectImage = async () => {
    if (disabled) return

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.simple(
          translate("businessEvent:permissionRequired"),
          translate("businessEvent:photoLibraryPermissionMessage"),
        )
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Event images work better in landscape
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0])
      }
    } catch (error) {
      console.error("Error selecting image:", error)
      Alert.simple(
        translate("common:error"),
        translate("businessEvent:imageSelectionFailed"),
      )
    }
  }

  const handleRemoveImage = () => {
    if (disabled) return
    onImageSelected(null)
  }

  const hasImage = !!imageUri

  return (
    <View style={[themed($container), style]}>
      <Text preset="formLabel" tx="businessEvent:eventImage" style={themed($label)} />

      {hasImage ? (
        <View style={themed($imageContainer)}>
          <Image source={{ uri: imageUri }} style={themed($image)} />
          <View style={themed($imageActions)}>
            <Button
              tx="businessEvent:changeImage"
              preset="default"
              onPress={handleSelectImage}
              disabled={disabled}
              style={themed($actionButton)}
            />
            <Button
              tx="businessEvent:removeImage"
              preset="default"
              onPress={handleRemoveImage}
              disabled={disabled}
              style={themed($actionButton)}
            />
          </View>
        </View>
      ) : (
        <Pressable
          style={themed($placeholder)}
          onPress={handleSelectImage}
          disabled={disabled}
        >
          <Text
            preset="formHelper"
            tx="businessEvent:addEventImage"
            style={themed($placeholderText)}
          />
          <Text
            preset="formHelper"
            tx="businessEvent:tapToAddImage"
            style={themed($placeholderSubtext)}
          />
        </Pressable>
      )}
    </View>
  )
})

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $label: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $placeholder: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 120,
  backgroundColor: colors.palette.neutral100,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  textAlign: "center",
  marginBottom: 4,
})

const $placeholderSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  fontSize: 12,
})

const $imageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $image: ThemedStyle<ImageStyle> = () => ({
  width: 650, // Bigger for better visibility while staying reasonable
  aspectRatio: 16 / 9, // Maintain 16:9 aspect ratio - height will be ~180px
  alignSelf: "center", // Center the image since it's not full width
  borderRadius: 8,
  marginBottom: 12,
  resizeMode: "cover", // Cover ensures good fit without distortion
})

const $imageActions: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-around",
  gap: 12,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  paddingHorizontal: 12,
  paddingVertical: 8,
  minHeight: 36,
})
