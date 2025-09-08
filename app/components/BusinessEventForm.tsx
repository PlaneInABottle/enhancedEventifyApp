import React, { FC, useState, useCallback, useEffect } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Alert } from "react-native"
import { observer } from "mobx-react-lite"
import type { ImagePickerAsset } from "expo-image-picker"

import { Button } from "@/components/Button"
import { BusinessEventInstanceFormSection } from "@/components/BusinessEventInstanceFormSection"
import type { BusinessEventInstanceFormData } from "@/components/BusinessEventInstanceFormSection"
import { EventImagePicker } from "@/components/EventImagePicker"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import { safeTranslate } from "@/utils/safeTranslate"
import { useStores } from "@/models"

import { validateEventRequest, validateEventInstanceRequest } from "@/services/event"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// (Moved) safeTranslate imported from utils to avoid duplication

export interface BusinessEventFormData {
  title: string
  description: string
  instances: BusinessEventInstanceFormData[]
  imageAsset: ImagePickerAsset | null
  existingImageUrl?: string | null // For edit mode - existing image URL
}

interface BusinessEventFormProps {
  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (formData: BusinessEventFormData) => void
  /**
   * Whether the form is currently being submitted
   */
  isSubmitting?: boolean
  /**
   * Error message to display (translation key)
   */
  errorMessage?: string | null
  /**
   * Initial form data for editing
   */
  initialData?: Partial<BusinessEventFormData>
  /**
   * Whether we're in edit mode
   */
  isEditing?: boolean
}

export const BusinessEventForm: FC<BusinessEventFormProps> = observer(function BusinessEventForm({
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
  initialData,
  isEditing = false,
}) {
  const { themed } = useAppTheme()
  const { venueStore, businessProfileStore } = useStores()

  // Form state
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [instances, setInstances] = useState<BusinessEventInstanceFormData[]>(
    initialData?.instances || [createEmptyInstance()],
  )
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(
    initialData?.imageAsset || null,
  )
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    initialData?.existingImageUrl || null,
  )

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper to clear specific field error
  const clearFieldError = useCallback((fieldKey: string) => {
    setErrors((prev) => {
      if (fieldKey in prev) {
        const { [fieldKey]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  // Load venues when component mounts and business profile is available
  useEffect(() => {
    const businessId = businessProfileStore.profile?.id
    if (businessId && venueStore.venues.length === 0) {
      venueStore.fetchVenuesByBusiness(businessId)
    }
  }, [businessProfileStore.profile?.id, venueStore])

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "")
      setDescription(initialData.description || "")
      setInstances(initialData.instances || [createEmptyInstance()])
      setSelectedImage(initialData.imageAsset || null)
      setExistingImageUrl(initialData.existingImageUrl || null)
    }
  }, [initialData])

  // Auto-assign first venue id to any blank instances (create mode only)
  const firstVenueId = venueStore.venues[0]?.id

  useEffect(() => {
    if (isEditing) return
    if (!firstVenueId) return
    setInstances((prev) => {
      let changed = false
      const updated = prev.map((inst) => {
        if (!inst.venue_id) {
          changed = true
          return { ...inst, venue_id: firstVenueId }
        }
        return inst
      })
      return changed ? updated : prev
    })
  }, [isEditing, firstVenueId, venueStore.venues.length])

  // Create empty instance helper with stable temporary ID
  function createEmptyInstance(): BusinessEventInstanceFormData {
    return {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary stable ID
      venue_id: "",
      start_datetime: "",
      end_datetime: "",
      max_attendees: null,
    }
  }

  // Add new event instance
  const addInstance = useCallback(() => {
    if (instances.length < 10) {
      setInstances((prev) => {
        const newInst = createEmptyInstance()
        if (!isEditing && firstVenueId) {
          newInst.venue_id = firstVenueId
        }
        return [...prev, newInst]
      })
    }
  }, [instances.length, isEditing, firstVenueId])

  // Remove event instance
  const removeInstance = useCallback(
    (index: number) => {
      if (instances.length > 1) {
        setInstances((prev) => prev.filter((_, i) => i !== index))
      }
    },
    [instances.length],
  )

  // Update specific instance
  const updateInstance = useCallback(
    (index: number, updates: Partial<BusinessEventInstanceFormData>) => {
      setInstances((prev) =>
        prev.map((instance, i) => (i === index ? { ...instance, ...updates } : instance)),
      )

      // Clear errors for updated fields
      Object.keys(updates).forEach((field) => {
        const errorKey = `instance_${index}_${field}`
        if (errors[errorKey]) {
          clearFieldError(errorKey)
        }
      })
    },
    [errors, clearFieldError],
  )

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate event data
    const eventValidation = validateEventRequest({
      title,
      description: description || undefined,
      instances: instances.map((instance) => ({
        venue_id: instance.venue_id,
        start_datetime: instance.start_datetime,
        end_datetime: instance.end_datetime,
        max_attendees: instance.max_attendees || undefined,
      })),
    })

    if (!eventValidation.isValid) {
      Object.assign(newErrors, eventValidation.errors)
    }

    // Validate each instance individually for better error messages
    instances.forEach((instance, index) => {
      const instanceValidation = validateEventInstanceRequest({
        ...instance,
        max_attendees: instance.max_attendees || undefined,
      })
      if (!instanceValidation.isValid) {
        Object.entries(instanceValidation.errors).forEach(([field, error]) => {
          newErrors[`instance_${index}_${field}`] = error
        })
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, description, instances])

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      Alert.alert(
        translate("businessEvent:validationErrorTitle"),
        translate("businessEvent:validationErrorMessage"),
      )
      return
    }

    onSubmit({
      title,
      description,
      instances,
      imageAsset: selectedImage,
      existingImageUrl,
    })
  }, [title, description, instances, selectedImage, existingImageUrl, onSubmit, validateForm])

  return (
    <ScrollView style={themed($container)}>
      {/* Event Details Section */}
      <View style={themed($section)}>
        <Text preset="subheading" tx="businessEvent:eventDetails" style={themed($sectionTitle)} />

        <TextField
          labelTx="businessEvent:titleLabel"
          placeholderTx="businessEvent:titlePlaceholder"
          value={title}
          onChangeText={(text) => {
            setTitle(text)
            if (errors.title) clearFieldError("title")
          }}
          status={errors.title ? "error" : undefined}
          helper={errors.title ? safeTranslate(errors.title) : undefined}
          containerStyle={themed($fieldContainer)}
        />

        <TextField
          labelTx="businessEvent:descriptionLabel"
          placeholderTx="businessEvent:descriptionPlaceholder"
          value={description}
          onChangeText={(text) => {
            setDescription(text)
            if (errors.description) clearFieldError("description")
          }}
          multiline
          numberOfLines={4}
          status={errors.description ? "error" : undefined}
          helper={errors.description ? safeTranslate(errors.description) : undefined}
          containerStyle={themed($fieldContainer)}
        />

        <EventImagePicker
          imageUri={selectedImage?.uri || existingImageUrl}
          onImageSelected={(asset) => {
            setSelectedImage(asset)
            if (asset) {
              // When user selects new image, clear existing URL
              setExistingImageUrl(null)
            }
          }}
          disabled={isSubmitting}
        />
      </View>

      {/* Event Instances Section */}
      <View style={themed($section)}>
        <View style={themed($sectionHeader)}>
          <Text
            preset="subheading"
            tx="businessEvent:eventInstances"
            style={themed($sectionTitle)}
          />
          <Button
            tx="businessEvent:addInstance"
            preset="default"
            onPress={addInstance}
            disabled={instances.length >= 10}
            style={themed($addButton)}
          />
        </View>

        {instances.map((instance, index) => (
          <BusinessEventInstanceFormSection
            key={instance.id || `instance-${index}`} // Use stable ID or fallback to index
            instance={instance}
            index={index}
            venues={venueStore.venues}
            errors={errors}
            showRemoveButton={instances.length > 1}
            onUpdate={(updates) => updateInstance(index, updates)}
            onRemove={() => removeInstance(index)}
          />
        ))}
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={themed($errorContainer)}>
          <Text
            preset="formHelper"
            tx={errorMessage.includes(":") ? (errorMessage as TxKeyPath) : undefined}
            text={!errorMessage.includes(":") ? errorMessage : undefined}
            style={themed($errorText)}
          />
        </View>
      )}

      {/* Submit Button */}
      <View style={themed($buttonContainer)}>
        <Button
          tx={isEditing ? "businessEvent:updateEvent" : "businessEvent:createEvent"}
          preset="filled"
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={themed($submitButton)}
        />
      </View>
    </ScrollView>
  )
})

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.md,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $fieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $addButton: ThemedStyle<ViewStyle> = () => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  minHeight: 32,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.angry100,
  padding: spacing.md,
  borderRadius: 4,
  marginBottom: spacing.md,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.lg,
  paddingBottom: spacing.xl,
})

const $submitButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 48,
})
