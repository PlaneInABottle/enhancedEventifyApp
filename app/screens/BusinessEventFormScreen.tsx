import React, { FC, useState, useCallback, useEffect } from "react"
import { ViewStyle, Alert } from "react-native"
import { observer } from "mobx-react-lite"

import { BusinessEventForm, BusinessEventFormData } from "@/components/BusinessEventForm"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import { useStores } from "@/models"
import type { IBusinessEvent } from "@/models/BusinessEventModels"
import type { EventInstanceStatus } from "@/services/event/businessEventTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { BusinessEventStackScreenProps } from "@/navigators/BusinessEventNavigator"

type BusinessEventFormScreenProps = BusinessEventStackScreenProps<"CreateEvent"> | BusinessEventStackScreenProps<"EditEvent">

export const BusinessEventFormScreen: FC<BusinessEventFormScreenProps> = observer(
  function BusinessEventFormScreen({ navigation, route }) {
    const { themed } = useAppTheme()
    const { businessEventStore, businessProfileStore } = useStores()
    
    // Determine if we're editing or creating using route name discrimination
    const isEditing = route.name === "EditEvent"
    const eventId = isEditing ? route.params.eventId : undefined
    const screenTitle = isEditing ? "businessEvent:editEvent" : "businessEvent:createEvent"
    
    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [initialData, setInitialData] = useState<Partial<BusinessEventFormData> | undefined>(undefined)

    // Instance diffing helper for edit mode
    const handleInstanceUpdates = useCallback(async (
      event: IBusinessEvent, 
      formInstances: BusinessEventFormData["instances"]
    ) => {
      try {
        const existingInstances = event.instances
        const existingInstancesMap = new Map(existingInstances.map(inst => [inst.id, inst]))
        const formInstancesMap = new Map(
          formInstances
            .filter(inst => inst.id) // Only instances with IDs (existing ones)
            .map(inst => [inst.id!, inst])
        )

        // 1. Update existing instances that were modified
        for (const formInstance of formInstances) {
          if (formInstance.id && existingInstancesMap.has(formInstance.id)) {
            const existingInstance = existingInstancesMap.get(formInstance.id)!
            const hasChanges = (
              existingInstance.venue_id !== formInstance.venue_id ||
              existingInstance.start_datetime !== formInstance.start_datetime ||
              existingInstance.end_datetime !== formInstance.end_datetime ||
              existingInstance.max_attendees !== (formInstance.max_attendees || null) ||
              existingInstance.event_instance_status !== formInstance.event_instance_status
            )

            if (hasChanges) {
              const updateResult = await existingInstance.update({
                venue_id: formInstance.venue_id,
                start_datetime: formInstance.start_datetime,
                end_datetime: formInstance.end_datetime,
                max_attendees: formInstance.max_attendees || undefined,
                event_instance_status: formInstance.event_instance_status as EventInstanceStatus,
              })
              
              if (!updateResult.success) {
                return { success: false, error: updateResult.error }
              }
            }
          }
        }

        // 2. Create new instances (those without IDs)
        for (const formInstance of formInstances) {
          if (!formInstance.id) {
            const createResult = await event.addNewInstance({
              venue_id: formInstance.venue_id,
              start_datetime: formInstance.start_datetime,
              end_datetime: formInstance.end_datetime,
              max_attendees: formInstance.max_attendees || undefined,
              event_instance_status: formInstance.event_instance_status as EventInstanceStatus,
            })
            
            if (!createResult.success) {
              return { success: false, error: createResult.error }
            }
          }
        }

        // 3. Delete instances that were removed (exist in event but not in form)
        for (const existingInstance of existingInstances) {
          if (!formInstancesMap.has(existingInstance.id)) {
            const deleteResult = await existingInstance.delete()
            if (!deleteResult.success) {
              return { success: false, error: deleteResult.error }
            }
          }
        }

        return { success: true }
      } catch (error) {
        console.error("Instance update failed:", error)
        return { success: false, error: "errors.unknownError" }
      }
    }, [])

    // Load event data if editing
    useEffect(() => {
      if (isEditing && eventId) {
        const event = businessEventStore.getEventById(eventId)
        if (event) {
          setInitialData({
            title: event.title,
            description: event.description || "",
            instances: event.instances.map(instance => ({
              id: instance.id, // Include ID for existing instances
              venue_id: instance.venue_id,
              start_datetime: instance.start_datetime,
              end_datetime: instance.end_datetime,
              max_attendees: instance.max_attendees,
              event_instance_status: instance.event_instance_status as EventInstanceStatus,
            }))
          })
        }
      }
    }, [isEditing, eventId])

    // Handle form submission
    const handleSubmit = useCallback(async (formData: BusinessEventFormData) => {
      if (!businessProfileStore.profile?.id) {
        setErrorMessage("errors:businessIdNotAvailable")
        return
      }

      setIsSubmitting(true)
      setErrorMessage(null)

      try {
        let result
        
        if (isEditing && eventId) {
          // Update existing event
          const event = businessEventStore.getEventById(eventId)
          if (event) {
            // First, update the main event data
            result = await event.update({
              title: formData.title,
              description: formData.description,
            })
            
            if (result.success) {
              // Handle instance updates with proper diffing
              const instanceResults = await handleInstanceUpdates(event, formData.instances)
              if (!instanceResults.success) {
                result = instanceResults
              }
            }
          } else {
            result = { success: false, error: "errors.eventNotFound" }
          }
        } else {
          // Create new event
          result = await businessEventStore.createEvent(businessProfileStore.profile.id, {
            title: formData.title,
            description: formData.description,
            instances: formData.instances.map(instance => ({
              venue_id: instance.venue_id,
              start_datetime: instance.start_datetime,
              end_datetime: instance.end_datetime,
              max_attendees: instance.max_attendees || undefined,
              event_instance_status: instance.event_instance_status,
            }))
          })
        }

        if (result.success) {
          // Navigate back to event list
          navigation.goBack()
          
          // Show success message
          Alert.alert(
            translate("common:success"),
            translate(isEditing ? "businessEvent:eventUpdatedSuccessfully" : "businessEvent:eventCreatedSuccessfully")
          )
        } else {
          setErrorMessage(result.error || "errors:unknownError")
        }
      } catch (error) {
        console.error("Error submitting event form:", error)
        setErrorMessage("errors:unknownError")
      } finally {
        setIsSubmitting(false)
      }
    }, [businessProfileStore.profile?.id, isEditing, eventId, navigation])

    return (
      <Screen
        preset="scroll"
        safeAreaEdges={["top"]}
        contentContainerStyle={themed($screenContainer)}
      >
        <Text preset="heading" tx={screenTitle as TxKeyPath} style={themed($title)} />
        
        <BusinessEventForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          initialData={initialData}
        />
      </Screen>
    )
  }
)

// Styles
const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
})

const $title: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})