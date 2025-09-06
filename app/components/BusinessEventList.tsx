import React, { FC, useCallback, useMemo } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  SectionList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native"
import { observer, Observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { EmptyState } from "@/components/EmptyState"
import { Text } from "@/components/Text"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import type { IBusinessEvent } from "@/models/BusinessEventModels"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface BusinessEventListProps {
  /**
   * List of events to display
   */
  events: IBusinessEvent[]
  /**
   * Whether the list is currently loading
   */
  isLoading?: boolean
  /**
   * Whether the list is refreshing
   */
  isRefreshing?: boolean
  /**
   * Callback when pull to refresh is triggered
   */
  onRefresh?: () => void
  /**
   * Callback when an event is selected
   */
  onEventPress?: (event: IBusinessEvent) => void
  /**
   * Callback when edit event is pressed
   */
  onEditEvent?: (event: IBusinessEvent) => void
  /**
   * Callback when delete event is pressed
   */
  onDeleteEvent?: (event: IBusinessEvent) => void
  /**
   * Callback when create new event is pressed
   */
  onCreateEvent?: () => void
  /**
   * Whether to show action buttons
   */
  showActions?: boolean
}

export const BusinessEventList: FC<BusinessEventListProps> = observer(function BusinessEventList({
  events,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEventPress,
  onEditEvent,
  onDeleteEvent,
  onCreateEvent,
  showActions = true,
}) {
  const { themed } = useAppTheme()

  // Group events by status into sections for SectionList
  const eventSections = useMemo(() => {
    if (!events || events.length === 0) return []

    const upcoming = events.filter((event) => event.hasUpcomingInstances)
    const active = events.filter((event) => event.activeInstances.length > 0)
    const past = events.filter(
      (event) => !event.hasUpcomingInstances && event.activeInstances.length === 0,
    )

    const sections = []

    if (upcoming.length > 0) {
      sections.push({
        title: "businessEvent:upcomingEvents" as TxKeyPath,
        data: upcoming,
        emptyMessage: "businessEvent:noUpcomingEvents" as TxKeyPath,
      })
    }

    if (active.length > 0) {
      sections.push({
        title: "businessEvent:activeEvents" as TxKeyPath,
        data: active,
        emptyMessage: "businessEvent:noActiveEvents" as TxKeyPath,
      })
    }

    if (past.length > 0) {
      sections.push({
        title: "businessEvent:pastEvents" as TxKeyPath,
        data: past,
        emptyMessage: "businessEvent:noPastEvents" as TxKeyPath,
      })
    }

    return sections
  }, [events])

  // Handle delete event with confirmation
  const handleDeleteEvent = useCallback(
    (event: IBusinessEvent) => {
      Alert.alert(
        translate("businessEvent:deleteEventTitle"),
        translate("businessEvent:deleteEventMessage", { title: event.title }),
        [
          {
            text: translate("common:cancel"),
            style: "cancel",
          },
          {
            text: translate("common:delete"),
            style: "destructive",
            onPress: () => onDeleteEvent?.(event),
          },
        ],
      )
    },
    [onDeleteEvent],
  )

  // Render event item
  const renderEventItem = useCallback(
    ({ item: event }: { item: IBusinessEvent }) => (
      <Observer>
        {() => {
          const nextInstance = event.nextInstance

          return (
            <Pressable
              style={[themed($eventCard), themed($cardStyle)]}
              onPress={() => onEventPress?.(event)}
              testID="event-card"
            >
              <View style={themed($eventHeader)}>
                <View style={themed($eventTitleContainer)}>
                  <Text preset="subheading" text={event.title} style={themed($eventTitle)} />
                  <Text
                    preset="formHelper"
                    tx="businessEvent:instanceCount"
                    txOptions={{ count: event.instanceCount }}
                    style={themed($instanceCount)}
                  />
                </View>

                {showActions && (
                  <View style={themed($eventActions)}>
                    <Pressable onPress={() => onEditEvent?.(event)} style={themed($actionButton)}>
                      <Text tx="common:edit" style={themed($actionButtonText)} />
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteEvent(event)}
                      style={[themed($actionButton), themed($deleteButton)]}
                    >
                      <Text tx="common:delete" style={themed($deleteButtonText)} />
                    </Pressable>
                  </View>
                )}
              </View>

              {event.description && (
                <Text
                  preset="default"
                  text={event.description}
                  numberOfLines={2}
                  style={themed($eventDescription)}
                />
              )}

              <View style={themed($eventDetails)}>
                {nextInstance && (
                  <View style={themed($nextInstanceContainer)}>
                    <Text
                      preset="formLabel"
                      tx="businessEvent:nextInstance"
                      style={themed($detailLabel)}
                    />
                    <Text
                      preset="default"
                      text={new Date(nextInstance.start_datetime).toLocaleDateString()}
                      style={themed($detailValue)}
                    />
                  </View>
                )}
              </View>
            </Pressable>
          )
        }}
      </Observer>
    ),
    [onEventPress, onEditEvent, handleDeleteEvent, showActions],
  )

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: TxKeyPath } }) => (
      <View style={themed($section)}>
        <Text preset="subheading" tx={section.title} style={themed($sectionTitle)} />
      </View>
    ),
    [themed],
  )

  // Show empty state if no events
  if (events.length === 0 && !isLoading) {
    return (
      <View style={themed($container)}>
        <EmptyState
          preset="generic"
          heading={translate("businessEvent:noEventsTitle")}
          content={translate("businessEvent:noEventsMessage")}
          button={onCreateEvent ? translate("businessEvent:createFirstEvent") : undefined}
          buttonOnPress={onCreateEvent}
        />
      </View>
    )
  }

  return (
    <SectionList
      style={themed($container)}
      sections={eventSections}
      renderItem={renderEventItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        onCreateEvent ? (
          <View style={themed($createButtonContainer)}>
            <Button
              tx="businessEvent:createNewEvent"
              preset="filled"
              onPress={onCreateEvent}
              style={themed($createButton)}
            />
          </View>
        ) : null
      }
      refreshControl={
        onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  )
})

// Styles
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.md,
})

const $createButtonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $createButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 48,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $emptyMessage: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  padding: spacing.lg,
})

const $eventCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $cardStyle: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.md,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 3,
})

const $eventHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8,
})

const $eventTitleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginRight: 12,
})

const $eventTitle: ThemedStyle<TextStyle> = () => ({
  marginBottom: 4,
})

const $instanceCount: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
})

const $eventActions: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  gap: 8,
})

const $actionButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 4,
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.angry100,
})

const $actionButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.neutral700,
})

const $deleteButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "500",
  color: colors.palette.angry500,
})

const $eventDescription: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $eventDetails: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $nextInstanceContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.textDim,
  marginBottom: 2,
})

const $detailValue: ThemedStyle<TextStyle> = () => ({
  fontSize: 14,
  fontWeight: "500",
})
