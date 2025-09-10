import React from "react"
import {
  View,
  Modal,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  ImageStyle,
} from "react-native"
import { observer } from "mobx-react-lite"

import { Text } from "./Text"
import { Button } from "./Button"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MapEventInstanceModel } from "@/models/MapModels"

type MapEventInstance = typeof MapEventInstanceModel.Type

const formatDateTime = (startTime: string, endTime: string) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startDate = start.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const startTimeStr = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
  const endTimeStr = end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })

  return { date: startDate, timeRange: `${startTimeStr} - ${endTimeStr}` }
}

export interface EventModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean
  /**
   * Event to display, null to hide modal
   */
  event: MapEventInstance | null
  /**
   * Called when modal should be closed
   */
  onClose: () => void
  /**
   * Called when report button is pressed (optional)
   */
  onReport?: (event: MapEventInstance) => void
}

export const EventModal = observer(function EventModal(props: EventModalProps) {
  const { visible, event, onClose, onReport } = props
  const { themed } = useAppTheme()

  if (!event) return null

  const handleReport = () => {
    onReport?.(event)
  }

  const { date, timeRange } = formatDateTime(event.start_datetime, event.end_datetime)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID="event-modal"
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text preset="heading" tx="eventModal:title" />
          <TouchableOpacity
            onPress={onClose}
            style={themed($closeButton)}
            accessibilityLabel="Close event modal"
            accessibilityRole="button"
          >
            <Text style={themed($closeText)}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={themed($content)} showsVerticalScrollIndicator={false}>
          {/* Event Image */}
          {event.event_image_url && (
            <View style={themed($imageContainer)}>
              <Image
                source={{ uri: event.event_image_url }}
                style={themed($eventImage)}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Event Title */}
          <Text preset="subheading" style={themed($eventTitle)}>
            {event.event_title}
          </Text>

          {/* Date and Time */}
          <View style={themed($dateTimeSection)}>
            <Text preset="formLabel" tx="eventModal:date" style={themed($sectionLabel)} />
            <Text style={themed($dateText)}>{date}</Text>
            <Text style={themed($timeText)}>{timeRange}</Text>
          </View>

          {/* Venue Information */}
          <View style={themed($venueSection)}>
            <Text preset="formLabel" tx="eventModal:venue" style={themed($sectionLabel)} />
            <Text style={themed($venueText)}>{event.venue_name}</Text>
            <Text style={themed($addressText)}>{event.full_address}</Text>
            {event.venue_capacity && (
              <Text style={themed($capacityText)}>Capacity: {event.venue_capacity} people</Text>
            )}
          </View>

          {/* Event Description */}
          <View style={themed($descriptionSection)}>
            <Text preset="formLabel" tx="eventModal:description" style={themed($sectionLabel)} />
            <Text style={themed($descriptionText)}>
              {event.event_description || "No description available"}
            </Text>
          </View>
        </ScrollView>

        <View style={themed($footer)}>
          {onReport && (
            <Button
              tx="eventModal:reportEvent"
              preset="default"
              onPress={handleReport}
              style={themed($reportButton)}
            />
          )}
          <Button
            tx="common:close"
            preset="filled"
            onPress={onClose}
            style={themed($closeMainButton)}
          />
        </View>
      </View>
    </Modal>
  )
})

// Styles
const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $header: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  ...(Platform.OS === "web"
    ? { boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)` }
    : {
        shadowColor: theme.colors.palette.neutral800,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }),
})

const $closeButton: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.xs,
})

const $closeText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 20,
  color: theme.colors.textDim,
})

const $content: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  padding: theme.spacing.lg,
})

const $imageContainer: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.lg,
  borderRadius: theme.spacing.sm,
  overflow: "hidden",
})

const $eventImage: ThemedStyle<ImageStyle> = (theme) => ({
  width: "100%",
  aspectRatio: 16 / 9,
  backgroundColor: theme.colors.palette.neutral200,
})

const $eventTitle: ThemedStyle<TextStyle> = (theme) => ({
  marginBottom: theme.spacing.lg,
  color: theme.colors.text,
})

const $sectionLabel: ThemedStyle<TextStyle> = (theme) => ({
  marginTop: theme.spacing.md,
  marginBottom: theme.spacing.sm,
  color: theme.colors.tint,
})

// Date & Time Section
const $dateTimeSection: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
})

const $dateText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 16,
  fontWeight: "600",
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
})

const $timeText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 16,
  color: theme.colors.text,
})

// Venue Section
const $venueSection: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
})

const $venueText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 16,
  fontWeight: "600",
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
})

const $addressText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 14,
  color: theme.colors.textDim,
  marginBottom: theme.spacing.xs,
})

const $capacityText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 14,
  color: theme.colors.textDim,
})

// Description Section
const $descriptionSection: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
})

const $descriptionText: ThemedStyle<TextStyle> = (theme) => ({
  fontSize: 15,
  lineHeight: 22,
  color: theme.colors.text,
})

const $footer: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: "row",
  padding: theme.spacing.lg,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  gap: theme.spacing.sm,
})

const $reportButton: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
})

const $closeMainButton: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
})
