import React, { FC, useCallback, useMemo } from "react"
import { View, ViewStyle, TextStyle, Pressable } from "react-native"

import { DateTimePickerField } from "@/components/DateTimePicker"
import { Dropdown } from "@/components/Dropdown"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import type { IVenue } from "@/models/VenueModels"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface BusinessEventInstanceFormData {
  id?: string // Optional for new instances, required for existing ones
  venue_id: string
  start_datetime: string
  end_datetime: string
  max_attendees: number | null
}

interface BusinessEventInstanceFormSectionProps {
  /**
   * Instance data
   */
  instance: BusinessEventInstanceFormData
  /**
   * Instance index for display and error handling
   */
  index: number
  /**
   * Available venues for dropdown
   */
  venues: IVenue[]
  /**
   * Validation errors for this instance
   */
  errors: Record<string, string>
  /**
   * Whether to show remove button
   */
  showRemoveButton: boolean
  /**
   * Callback when instance data changes
   */
  onUpdate: (updates: Partial<BusinessEventInstanceFormData>) => void
  /**
   * Callback when remove button is pressed
   */
  onRemove: () => void
}

export const BusinessEventInstanceFormSection: FC<BusinessEventInstanceFormSectionProps> = ({
  instance,
  index,
  venues,
  errors,
  showRemoveButton,
  onUpdate,
  onRemove,
}) => {
  const { themed } = useAppTheme()

  // Venue options for dropdown
  const venueOptions = useMemo(() => {
    return venues.map((venue) => ({
      label: venue.name,
      value: venue.id,
    }))
  }, [venues])

  // Handle field updates
  const handleVenueChange = useCallback(
    (value: string) => {
      onUpdate({ venue_id: value })
    },
    [onUpdate],
  )

  const handleStartDateTimeChange = useCallback(
    (date: Date | null) => {
      onUpdate({ start_datetime: date ? date.toISOString() : "" })
    },
    [onUpdate],
  )

  const handleEndDateTimeChange = useCallback(
    (date: Date | null) => {
      onUpdate({ end_datetime: date ? date.toISOString() : "" })
    },
    [onUpdate],
  )

  const handleMaxAttendeesChange = useCallback(
    (text: string) => {
      onUpdate({ max_attendees: text ? parseInt(text, 10) : null })
    },
    [onUpdate],
  )

  return (
    <View style={themed($instanceContainer)}>
      <View style={themed($instanceHeader)}>
        <Text
          preset="formLabel"
          tx="businessEvent:instanceNumber"
          txOptions={{ number: index + 1 }}
          style={themed($instanceTitle)}
        />
        {showRemoveButton && (
          <Pressable onPress={onRemove} style={themed($removeButton)}>
            <Text tx="common:remove" style={themed($removeButtonText)} />
          </Pressable>
        )}
      </View>

      <Dropdown
        labelTx="businessEvent:venueLabel"
        placeholderTx="businessEvent:venuePlaceholder"
        options={venueOptions}
        value={instance.venue_id}
        onValueChange={handleVenueChange}
        helper={
          errors[`instance_${index}_venue_id`]
            ? translate(errors[`instance_${index}_venue_id`] as TxKeyPath)
            : undefined
        }
        containerStyle={themed($fieldContainer)}
      />

      <View style={themed($dateTimeRow)}>
        <DateTimePickerField
          labelTx="businessEvent:startDateTimeLabel"
          placeholderTx="businessEvent:startDateTimePlaceholder"
          value={instance.start_datetime ? new Date(instance.start_datetime) : null}
          onChange={handleStartDateTimeChange}
          mode="datetime"
          status={errors[`instance_${index}_start_datetime`] ? "error" : undefined}
          error={
            errors[`instance_${index}_start_datetime`]
              ? translate(errors[`instance_${index}_start_datetime`] as TxKeyPath)
              : undefined
          }
          containerStyle={themed($dateTimeFieldLeft)}
        />

        <DateTimePickerField
          labelTx="businessEvent:endDateTimeLabel"
          placeholderTx="businessEvent:endDateTimePlaceholder"
          value={instance.end_datetime ? new Date(instance.end_datetime) : null}
          onChange={handleEndDateTimeChange}
          mode="datetime"
          status={errors[`instance_${index}_end_datetime`] ? "error" : undefined}
          error={
            errors[`instance_${index}_end_datetime`]
              ? translate(errors[`instance_${index}_end_datetime`] as TxKeyPath)
              : undefined
          }
          containerStyle={themed($dateTimeFieldRight)}
        />
      </View>

      <TextField
        labelTx="businessEvent:maxAttendeesLabel"
        placeholderTx="businessEvent:maxAttendeesPlaceholder"
        value={instance.max_attendees?.toString() || ""}
        onChangeText={handleMaxAttendeesChange}
        keyboardType="numeric"
        status={errors[`instance_${index}_max_attendees`] ? "error" : undefined}
        helper={
          errors[`instance_${index}_max_attendees`]
            ? translate(errors[`instance_${index}_max_attendees`] as TxKeyPath)
            : undefined
        }
        containerStyle={themed($fieldContainer)}
      />
    </View>
  )
}

// Styles
const $instanceContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $instanceHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
})

const $instanceTitle: ThemedStyle<TextStyle> = () => ({
  fontWeight: "600",
})

const $removeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  padding: 8,
  backgroundColor: colors.palette.angry100,
  borderRadius: 4,
})

const $removeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
  fontSize: 12,
  fontWeight: "500",
})

const $fieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $dateTimeRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "flex-start",
})

const $dateTimeFieldLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  minWidth: 0,
  marginRight: spacing.md,
  marginBottom: spacing.md,
})

const $dateTimeFieldRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  minWidth: 0,
  marginBottom: spacing.md,
})
