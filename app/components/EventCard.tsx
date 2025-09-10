import { FC } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Platform,
  TouchableOpacity,
  Image,
  ImageStyle,
} from "react-native"

import { ReportButton } from "@/components/ReportButton"
import { Text } from "@/components/Text"
import { MapEventInstanceModel } from "@/models/MapModels"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface EventCardProps {
  event: typeof MapEventInstanceModel.Type
  /**
   * Called when the card is pressed
   */
  onPress?: (event: typeof MapEventInstanceModel.Type) => void
}

export const EventCard: FC<EventCardProps> = ({ event, onPress }) => {
  const { themed } = useAppTheme()

  const handlePress = () => {
    onPress?.(event)
  }

  return (
    <TouchableOpacity
      style={themed($container)}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${event.event_title}`}
    >
      {/* Event Image */}
      {event.event_image_url ? (
        <Image
          source={{ uri: event.event_image_url }}
          style={themed($eventImage)}
          resizeMode="cover"
        />
      ) : (
        <View style={themed($imagePlaceholder)} />
      )}

      <View style={themed($content)}>
        <Text preset="subheading" style={themed($title)} numberOfLines={2}>
          {event.event_title}
        </Text>

        <View style={themed($venueInfo)}>
          <Text style={themed($venue)} numberOfLines={1}>
            {event.venue_name}
          </Text>
          <Text size="sm" style={themed($dateTime)}>
            {event.formattedStartTime}
          </Text>
        </View>

        {event.event_description && (
          <Text size="sm" style={themed($description)} numberOfLines={2}>
            {event.event_description}
          </Text>
        )}

        <View style={themed($actions)}>
          <ReportButton contentType="event" contentId={event.event_id} style={$reportButton} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  marginVertical: theme.spacing.sm,
  marginHorizontal: theme.spacing.lg,
  backgroundColor: theme.colors.palette.neutral100,
  borderRadius: theme.spacing.sm,
  borderWidth: 1,
  borderColor: theme.colors.palette.neutral300,
  overflow: "hidden",
  ...(Platform.OS === "web"
    ? { boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)` }
    : {
      shadowColor: theme.colors.palette.neutral800,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
    }),
})

const $imagePlaceholder: ThemedStyle<ViewStyle> = (theme) => ({
  height: 120,
  backgroundColor: theme.colors.palette.neutral300,
})

const $eventImage: ThemedStyle<ImageStyle> = (theme) => ({
  width: "100%",
  aspectRatio: 16 / 4,
  backgroundColor: theme.colors.palette.neutral200,
})

const $content: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.lg,
})

const $title: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.xs,
})

const $venueInfo: ThemedStyle<ViewStyle> = (theme) => ({
  marginBottom: theme.spacing.sm,
})

const $venue: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.textDim,
  marginBottom: theme.spacing.xxs,
})

const $dateTime: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.tint,
  fontWeight: "600",
})

const $description: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.textDim,
  lineHeight: 18,
})

const $actions: ThemedStyle<ViewStyle> = (theme) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  marginTop: theme.spacing.sm,
  paddingTop: theme.spacing.sm,
  borderTopWidth: 1,
  borderTopColor: theme.colors.palette.neutral200,
})

const $reportButton: ThemedStyle<ViewStyle> = (theme) => ({
  minHeight: 28,
  paddingHorizontal: theme.spacing.xs,
  paddingVertical: 2,
})
