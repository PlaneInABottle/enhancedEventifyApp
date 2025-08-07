import React, { FC, useState, useCallback, useEffect, useMemo } from "react"
import { View, ViewStyle, TextStyle, Modal, ScrollView, Pressable, Platform } from "react-native"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { LocationPickerModal } from "@/components/LocationPickerModal"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { createTurkishCityOptions } from "@/constants/cities"
import type { TxKeyPath } from "@/i18n"
import type { IVenue } from "@/models/VenueModels"
import type { TurkishCity } from "@/services/profile/profileTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

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
  venue: IVenue | null
  /**
   * Whether the form is currently being submitted
   */
  isSubmitting?: boolean
  /**
   * Error message to display (translation key)
   */
  errorMessage?: string | null
}

export interface VenueEditFormData {
  name: string
  description: string
  capacity: string
  address: {
    full_address: string
    city: TurkishCity
    postal_code: string
    coordinates?: { latitude: number; longitude: number }
  }
}

export interface VenueFormErrors {
  name?: string
  description?: string
  capacity?: string
  address?: {
    full_address?: string
    postal_code?: string
  }
}

export const VenueEditModal: FC<VenueEditModalProps> = (props) => {
  const { visible, onClose, onSave, venue, isSubmitting = false, errorMessage } = props
  const { themed } = useAppTheme()

  // Initialize form data from venue prop or defaults
  const getInitialFormData = (): VenueEditFormData => {
    if (venue) {
      return {
        name: venue.name,
        description: venue.description || "",
        capacity: venue.capacity?.toString() || "",
        address: {
          // Safely access address properties, default to empty string if address or property is null
          full_address: venue.address?.full_address || "",
          // Cast to TurkishCity for type compatibility, assuming backend data is valid
          city: (venue.address?.city as TurkishCity) || "İstanbul",
          postal_code: venue.address?.postal_code || "",
          // Extract coordinates from GeoJSON format
          coordinates:
            venue.address?.coordinates?.coordinates
              ? { 
                  latitude: venue.address.coordinates.coordinates[1], 
                  longitude: venue.address.coordinates.coordinates[0] 
                }
              : undefined,
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
        coordinates: undefined,
      },
    }
  }

  // Form state
  const [formData, setFormData] = useState<VenueEditFormData>(getInitialFormData())
  const [errors, setErrors] = useState<VenueFormErrors>({})

  // Location picker state
  const [locationPickerVisible, setLocationPickerVisible] = useState(false)

  // Reset form data when venue prop changes
  useEffect(() => {
    setFormData(getInitialFormData())
    setErrors({}) // Clear errors when form resets
  }, [venue])

  // Validation functions
  const validateForm = useCallback((): boolean => {
    const newErrors: VenueFormErrors = {}

    // Required field: name
    if (!formData.name.trim()) {
      newErrors.name = "errors.venueNameRequired"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "errors.venueNameTooShort"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "errors.venueNameTooLong"
    }

    // Optional description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "errors.venueDescriptionTooLong"
    }

    // Optional capacity validation
    if (formData.capacity) {
      const capacityNum = Number(formData.capacity)
      if (isNaN(capacityNum) || capacityNum < 1) {
        newErrors.capacity = "errors.venueCapacityInvalid"
      } else if (capacityNum > 100000) {
        newErrors.capacity = "errors.venueCapacityTooLarge"
      }
    }

    // Optional address validations
    if (formData.address.full_address && formData.address.full_address.length > 200) {
      newErrors.address = { ...newErrors.address, full_address: "errors.addressTooLong" }
    }

    if (formData.address.postal_code) {
      const postalCode = formData.address.postal_code.trim()
      if (postalCode.length !== 5) {
        newErrors.address = { ...newErrors.address, postal_code: "errors.postalCodeInvalid" }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Generic form field handler
  const updateFormField = useCallback(
    (field: keyof VenueEditFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

  // Address field handler
  const updateAddressField = useCallback(
    (field: keyof VenueEditFormData["address"], value: any) => {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }))
      // Clear error for this address field when user starts typing (only for fields that can have errors)
      if (
        field !== "city" &&
        field !== "coordinates" &&
        errors.address?.[field as keyof VenueFormErrors["address"]]
      ) {
        setErrors((prev) => ({
          ...prev,
          address: { ...prev.address, [field]: undefined },
        }))
      }
    },
    [errors],
  )

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
      // Note: onClose() is handled by parent component after async save completes
    }
    // If validation fails, errors are already set and will be displayed
  }

  // Location picker handlers
  const handleLocationPickerOpen = useCallback(() => {
    setLocationPickerVisible(true)
  }, [])

  const handleLocationPickerClose = useCallback(() => {
    setLocationPickerVisible(false)
  }, [])

  const handleLocationPickerSave = useCallback(
    (coordinates: { latitude: number; longitude: number }) => {
      updateAddressField("coordinates", coordinates)
      setLocationPickerVisible(false)
    },
    [updateAddressField],
  )

  // City options for dropdown (memoized for performance)
  const cityOptions = useMemo(() => createTurkishCityOptions("Other"), [])

  if (!visible) return null

  return (
    <>
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
                <Text
                  preset="subheading"
                  tx="venueModal:basicInformation"
                  style={themed($sectionTitle)}
                />

                <TextField
                  labelTx="venueModal:venueName"
                  placeholderTx="venueModal:venueNamePlaceholder"
                  value={formData.name}
                  onChangeText={(text) => updateFormField("name", text)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  containerStyle={themed($fieldContainer)}
                  status={errors.name ? "error" : undefined}
                  helperTx={errors.name as TxKeyPath | undefined}
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
                  status={errors.description ? "error" : undefined}
                  helperTx={errors.description as TxKeyPath | undefined}
                />

                <TextField
                  labelTx="venueModal:capacity"
                  placeholderTx="venueModal:capacityPlaceholder"
                  value={formData.capacity}
                  onChangeText={(text) => updateFormField("capacity", text.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  containerStyle={themed($fieldContainer)}
                  status={errors.capacity ? "error" : undefined}
                  helperTx={errors.capacity as TxKeyPath | undefined}
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
                  status={errors.address?.full_address ? "error" : undefined}
                  helperTx={errors.address?.full_address as TxKeyPath | undefined}
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
                  onChangeText={(text) =>
                    updateAddressField("postal_code", text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  maxLength={5}
                  returnKeyType="done"
                  containerStyle={themed($fieldContainer)}
                  status={errors.address?.postal_code ? "error" : undefined}
                  helperTx={errors.address?.postal_code as TxKeyPath | undefined}
                />

                {/* Location Picker Section */}
                <View style={themed($locationSection)}>
                  <Button
                    tx="venueModal:pickLocationOnMap"
                    preset="default"
                    onPress={handleLocationPickerOpen}
                    style={themed($locationButton)}
                  />

                  {formData.address.coordinates && (
                    <Text
                      tx="venueModal:selectedCoordinates"
                      txOptions={{
                        latitude: formData.address.coordinates.latitude.toFixed(6),
                        longitude: formData.address.coordinates.longitude.toFixed(6),
                      }}
                      style={themed($coordinatesDisplay)}
                      preset="formHelper"
                    />
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Error Message */}
            {errorMessage && (
              <View style={themed($errorContainer)}>
                <Text
                  tx={errorMessage as TxKeyPath}
                  style={themed($errorText)}
                  preset="formHelper"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={themed($buttonContainer)}>
              <Button
                preset="default"
                tx="common:cancel"
                onPress={onClose}
                style={themed($cancelButton)}
                disabled={isSubmitting}
              />
              <Button
                preset="filled"
                tx={isSubmitting ? "common:loading" : "venueModal:saveChanges"}
                onPress={handleSave}
                style={themed($saveButton)}
                disabled={isSubmitting}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={handleLocationPickerClose}
        onSave={handleLocationPickerSave}
        initialCoordinates={formData.address.coordinates}
      />
    </>
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

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.errorBackground,
  borderTopWidth: 1,
  borderTopColor: colors.border,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
})

const $locationSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  gap: spacing.sm,
})

const $locationButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "flex-start",
})

const $coordinatesDisplay: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

// TODO: Connect to VenueStore and add to VenuesScreen next
// BREADCRUMB: Completed VenueEditModal with form state management
