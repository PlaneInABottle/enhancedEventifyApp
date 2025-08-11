import React, { FC, useEffect, useCallback } from "react"
import { ViewStyle, Alert } from "react-native"
import { observer } from "mobx-react-lite"

import { BusinessEventList } from "@/components/BusinessEventList"
import { Screen } from "@/components/Screen"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import type { IBusinessEvent } from "@/models/BusinessEventModels"
import { useStores } from "@/models"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import type { BusinessEventStackScreenProps } from "@/navigators/BusinessEventNavigator"

interface BusinessEventListScreenProps extends BusinessEventStackScreenProps<"EventList"> {}

export const BusinessEventListScreen: FC<BusinessEventListScreenProps> = observer(
  function BusinessEventListScreen({ navigation }) {
    const { themed } = useAppTheme()
    const { businessEventStore, businessProfileStore } = useStores()

    // Load events when component mounts
    useEffect(() => {
      if (businessProfileStore.profile?.id) {
        businessEventStore.fetchEvents(businessProfileStore.profile.id)
      }
    }, [businessProfileStore.profile?.id])

    // Handle refresh
    const handleRefresh = useCallback(() => {
      if (businessProfileStore.profile?.id) {
        businessEventStore.fetchEvents(businessProfileStore.profile.id)
      }
    }, [])

    // Handle create new event
    const handleCreateEvent = useCallback(() => {
      navigation.navigate("CreateEvent")
    }, [navigation])

    // Handle event selection
    const handleEventPress = useCallback((event: IBusinessEvent) => {
      navigation.navigate("EventDetail", { eventId: event.id })
    }, [navigation])

    // Handle edit event
    const handleEditEvent = useCallback((event: IBusinessEvent) => {
      navigation.navigate("EditEvent", { eventId: event.id })
    }, [navigation])

    // Handle delete event
    const handleDeleteEvent = useCallback(async (event: IBusinessEvent) => {
      try {
        const result = await event.delete()
        if (!result.success) {
          Alert.alert(
            translate("common:error"),
            translate(result.error as TxKeyPath)
          )
        }
        // If successful, the event is automatically removed from the store by MST
      } catch (error) {
        console.error("Failed to delete event:", error)
        Alert.alert(
          translate("common:error"),
          translate("errors:unknownError")
        )
      }
    }, [])

    return (
      <Screen
        preset="fixed"
        safeAreaEdges={["top"]}
        contentContainerStyle={themed($screenContainer)}
      >
        <BusinessEventList
          events={businessEventStore.events}
          isLoading={businessEventStore.isLoading}
          isRefreshing={businessEventStore.isLoading}
          onRefresh={handleRefresh}
          onEventPress={handleEventPress}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onCreateEvent={handleCreateEvent}
          showActions={true}
        />
      </Screen>
    )
  }
)

// Styles
const $screenContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})