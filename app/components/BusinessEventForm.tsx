import React, { FC, useState, useCallback, useEffect, useMemo } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Alert, Platform } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { BusinessEventInstanceFormSection } from "@/components/BusinessEventInstanceFormSection"
import type { BusinessEventInstanceFormData } from "@/components/BusinessEventInstanceFormSection"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"

import { validateEventRequest, validateEventInstanceRequest } from "@/services/event"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface BusinessEventFormData {
  title: string
  description: string
  instances: BusinessEventInstanceFormData[]
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    }
  }, [initialData])

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
      // Limit based on EVENT_CONSTANTS.INSTANCES.MAX_COUNT
      setInstances((prev) => [...prev, createEmptyInstance()])
    }
  }, [instances.length])

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
    },
    [],
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
    })
  }, [title, description, instances, onSubmit, validateForm])

  return (
    <ScrollView style={themed($container)}>
      {/* Event Details Section */}
      <View style={themed($section)}>
        <Text preset="subheading" tx="businessEvent:eventDetails" style={themed($sectionTitle)} />

        <TextField
          labelTx="businessEvent:titleLabel"
          placeholderTx="businessEvent:titlePlaceholder"
          value={title}
          onChangeText={setTitle}
          status={errors.title ? "error" : undefined}
          helper={errors.title ? translate(errors.title as TxKeyPath) : undefined}
          containerStyle={themed($fieldContainer)}
        />

        <TextField
          labelTx="businessEvent:descriptionLabel"
          placeholderTx="businessEvent:descriptionPlaceholder"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          status={errors.description ? "error" : undefined}
          helper={errors.description ? translate(errors.description as TxKeyPath) : undefined}
          containerStyle={themed($fieldContainer)}
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
          <Text preset="formHelper" tx={errorMessage as TxKeyPath} style={themed($errorText)} />
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
