import { FC } from "react"
import { View, ViewStyle, TextStyle, Modal, TouchableOpacity } from "react-native"

import { EventCard } from "@/components/EventCard"
import { ListView } from "@/components/ListView"
import { ReportButton } from "@/components/ReportButton"
import { Text } from "@/components/Text"
import type { VenueWithEvents } from "@/stores/MapStore"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface EventListModalProps {
  visible: boolean
  onClose: () => void
  venue: VenueWithEvents | null
}

export const EventListModal: FC<EventListModalProps> = ({ visible, onClose, venue }) => {
  const { themed } = useAppTheme()

  if (!venue) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={themed($container)}>
        {/* Header */}
        <View style={themed($header)}>
          <View style={themed($headerContent)}>
            <Text preset="subheading" text={venue.venue_name} />
            <Text size="xs" style={themed($addressText)} text={venue.full_address} />
            <Text size="xxs" style={themed($cityText)} text={venue.city} />
          </View>
          
          <TouchableOpacity onPress={onClose} style={themed($closeButton)}>
            <Text tx="common:close" style={themed($closeText)} />
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={themed($eventsContainer)}>
          <Text
            preset="subheading"
            tx="map:eventCount"
            txOptions={{ count: venue.events.length }}
            style={themed($eventsTitle)}
          />

          <ListView
            data={venue.events}
            renderItem={({ item }) => <EventCard event={item} />}
            keyExtractor={(item) => item.instance_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={themed($listContainer)}
            estimatedItemSize={120}
          />
          
          {/* Report Venue Link */}
          <View style={themed($reportContainer)}>
            <ReportButton contentType="venue" contentId={venue.venue_id} style={$reportButton} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $container: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
})

const $header: ThemedStyle<ViewStyle> = (theme) => ({
  padding: theme.spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.separator,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginRight: 16,
})

const $addressText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.textDim,
  marginTop: theme.spacing.xs,
})

const $cityText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.textDim,
  marginTop: theme.spacing.xxs,
})

const $closeButton: ThemedStyle<ViewStyle> = (theme) => ({
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  backgroundColor: theme.colors.palette.neutral200,
  borderRadius: 8,
})

const $closeText: ThemedStyle<TextStyle> = (theme) => ({
  color: theme.colors.text,
  fontWeight: "600",
})

const $eventsContainer: ThemedStyle<ViewStyle> = (theme) => ({
  flex: 1,
  padding: theme.spacing.lg,
})

const $eventsTitle: ThemedStyle<TextStyle> = (theme) => ({
  marginBottom: theme.spacing.md,
})

const $listContainer: ThemedStyle<ViewStyle> = (theme) => ({
  paddingBottom: theme.spacing.xl,
})

const $reportContainer: ThemedStyle<ViewStyle> = (theme) => ({
  paddingTop: theme.spacing.sm,
  borderTopWidth: 1,
  borderTopColor: theme.colors.separator,
  marginTop: theme.spacing.sm,
  alignItems: 'center',
})

const $reportButton: ThemedStyle<ViewStyle> = (theme) => ({
  minHeight: 32,
  paddingHorizontal: theme.spacing.xs,
  paddingVertical: 4,
  backgroundColor: 'transparent',
})
