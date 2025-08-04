import React, { FC, useState, useCallback, useEffect, useMemo } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from "react-native"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { createTurkishCityOptions } from "@/constants/cities"
import type { TurkishCity } from "@/services/profile/profileTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface Venue {
  id: string
  name: string
  description: string | null
  capacity: number | null
  address: {
    full_address: string
    city: TurkishCity
    postal_code: string
  }
  coordinates: {
    type: "Point"
    coordinates: [number, number]
  }
  created_at: string
  updated_at: string
  business_id: string
}

interface VenueEditModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean
  /**
   * Callback when modal should be closed
   */
  onClose: () => void
  /**
   * Callback when venue should be saved
   */
  onSave: (formData: VenueEditFormData) => void
  /**
   * Venue to edit (null for creating new venue)
   */
  venue: Venue | null
}

interface VenueEditFormData {
  name: string
  description: string
  capacity: string
  address: {
    full_address: string
    city: TurkishCity
    postal_code: string
  }
}

export const VenueEditModal: FC<VenueEditModalProps> = (props) => {
  const { visible, onClose, onSave, venue } = props
  const { themed } = useAppTheme()

  // Initialize form data from venue prop or defaults
  const getInitialFormData = useCallback((): VenueEditFormData => {
    if (venue) {
      return {
        name: venue.name,
        description: venue.description || "",
        capacity: venue.capacity?.toString() || "",
        address: {
          full_address: venue.address.full_address,
          city: venue.address.city,
          postal_code: venue.address.postal_code,
        },
      }
    }
    return {
      name: "",
      description: "",
      capacity: "",
      address: {
        full_address: "",
        city: "İstanbul",
        postal_code: "",
      },
    }
  }, [venue])

  // Form state
  const [formData, setFormData] = useState<VenueEditFormData>(getInitialFormData())

  // Reset form data when venue prop changes
  useEffect(() => {
    setFormData(getInitialFormData())
  }, [getInitialFormData])

  // Generic form field handler
  const updateFormField = useCallback((field: keyof VenueEditFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Address field handler
  const updateAddressField = useCallback((field: keyof VenueEditFormData["address"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }, [])

  // Handle save
  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  // City options for dropdown (memoized for performance)
  const cityOptions = useMemo(() => createTurkishCityOptions("Other"), [])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === "ios" ? "slide" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <Pressable style={themed($modalOverlay)} onPress={onClose} testID="modal-overlay">
        <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={themed($modalHeader)}>
            <Text preset="heading" tx={venue ? "venueModal:editTitle" : "venueModal:addTitle"} />
          </View>

          {/* Form Content */}
          <ScrollView style={themed($formContainer)} showsVerticalScrollIndicator={false}>
            {/* Basic Info Section */}
            <View style={themed($section)}>
              <Text preset="subheading" tx="venueModal:basicInformation" style={themed($sectionTitle)} />
              
              <TextField
                labelTx="venueModal:venueName"
                placeholderTx="venueModal:venueNamePlaceholder"
                value={formData.name}
                onChangeText={(text) => updateFormField("name", text)}
                autoCapitalize="words"
                returnKeyType="next"
                containerStyle={themed($fieldContainer)}
              />

              <TextField
                labelTx="venueModal:description"
                placeholderTx="venueModal:descriptionPlaceholder"
                value={formData.description}
                onChangeText={(text) => updateFormField("description", text)}
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
                containerStyle={themed($fieldContainer)}
              />

              <TextField
                labelTx="venueModal:capacity"
                placeholderTx="venueModal:capacityPlaceholder"
                value={formData.capacity}
                onChangeText={(text) => updateFormField("capacity", text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                returnKeyType="next"
                containerStyle={themed($fieldContainer)}
              />
            </View>

            {/* Address Section */}
            <View style={themed($section)}>
              <Text preset="subheading" tx="venueModal:address" style={themed($sectionTitle)} />
              
              <TextField
                labelTx="venueModal:fullAddress"
                placeholderTx="venueModal:fullAddressPlaceholder"
                value={formData.address.full_address}
                onChangeText={(text) => updateAddressField("full_address", text)}
                autoCapitalize="words"
                returnKeyType="next"
                containerStyle={themed($fieldContainer)}
              />

              <Dropdown
                labelTx="venueModal:city"
                placeholderTx="venueModal:cityPlaceholder"
                options={cityOptions}
                value={formData.address.city}
                onValueChange={(city) => updateAddressField("city", city)}
                containerStyle={themed($fieldContainer)}
              />

              <TextField
                labelTx="venueModal:postalCode"
                placeholderTx="venueModal:postalCodePlaceholder"
                value={formData.address.postal_code}
                onChangeText={(text) => updateAddressField("postal_code", text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                maxLength={5}
                returnKeyType="done"
                containerStyle={themed($fieldContainer)}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={themed($buttonContainer)}>
            <Button
              preset="default"
              tx="common:cancel"
              onPress={onClose}
              style={themed($cancelButton)}
            />
            <Button
              preset="filled"
              tx="venueModal:saveChanges"
              onPress={handleSave}
              style={themed($saveButton)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ============================================================================
// STYLES
// ============================================================================

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay20,
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.md,
  width: "100%",
  maxWidth: 500,
  maxHeight: "90%",
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $fieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  gap: spacing.sm,
})

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  flex: 2,
})

// TODO: Connect to VenueStore and add to VenuesScreen next
// BREADCRUMB: Completed VenueEditModal with form state management